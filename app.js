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
        // Sadece ana dizine gelen istekleri yönlendir
        return res.redirect(301, `https://test.oguzhandemirci.com.tr`);
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

app.use(express.json());
app.use(morgan('dev'));

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
    res.send('İngilizce Test Uygulaması API');
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
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor`);
    console.log(`Swagger belgeleri şu adreste: https://oguzhandemirci.com.tr/api-docs`);
});

module.exports = app;
