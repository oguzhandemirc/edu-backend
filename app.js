const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

const app = express();

// Yalnızca ana dizin isteklerini yönlendirecek middleware
app.use((req, res, next) => {
    if (req.originalUrl === '/') {
        if (process.env.NODE_ENV === 'production') {
            return res.redirect(301, `https://test.oguzhandemirci.com.tr`);
        } else {
            return res.redirect(301, `http://localhost:3000/api-docs`);
        }
    }
    next();  // API istekleri için yönlendirmeyi atla
});

// CORS ayarları
const corsOptions = {
    origin: ['https://oguzhandemirci.com.tr', 'http://localhost:3000', 'https://test.oguzhandemirci.com.tr', 'https://panel.oguzhandemirci.com.tr'],  // Bu domain'lere izin ver
    methods: ['GET', 'POST', 'PUT', 'DELETE'],  // İzin verilen HTTP metodları
    allowedHeaders: ['Content-Type', 'Authorization'],  // İzin verilen header'lar
    credentials: true,  // Eğer kimlik doğrulaması yapılıyorsa
};

app.use(cors(corsOptions));  // CORS middleware'ini bu ayarlarla kullan

app.use(express.json()); // JSON parser middleware
app.use(morgan('dev')); // Development modunda loglama

// Swagger yapılandırması
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'İngilizce Test Uygulaması API',
            version: '1.0.0',
            description: 'İngilizce test uygulaması için Express API',
        },
        servers: [
            {
                url: 'https://oguzhandemirci.com.tr',
                description: 'Production ortamı',
            },
            {
                url: 'http://localhost:3000',
                description: 'Development ortamı',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
    },
    apis: ['./routes/*.js'],  // API rotalarının bulunduğu dosyalar
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Rotalar
app.get('/', (req, res) => {
    res.send('Test Uygulaması API');
    if (process.env.NODE_ENV === 'production') {
        return res.redirect(301, `https://test.oguzhandemirci.com.tr`);
    } else {
        return res.redirect(301, `http://localhost:3000/api-docs`);
    }
});

// Auth rotaları
app.use('/api/auth', require('./routes/auth'));

// Bölüm rotaları
app.use('/api/sections', require('./routes/section'));

// Test rotaları
app.use('/api/tests', require('./routes/test'));

// Soru rotaları
app.use('/api/questions', require('./routes/question'));

// Test sonuçları rotaları
app.use('/api/test-results', require('./routes/testResult'));

// Sunucu başlatma
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => { // 0.0.0.0 ile tüm IP adreslerine izin ver.
    console.log(`Sunucu http://localhost:${PORT} portunda çalışıyor`);
    console.log(`Swagger belgeleri şu adreste: http://localhost:${PORT}/api-docs`);
});

module.exports = app;
