const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const config = require('./config');

const app = express();

// Yalnızca ana dizin isteklerini yönlendirecek middleware
app.use((req, res, next) => {
    if (req.originalUrl === '/') {
        return res.redirect(301, config.redirectUrl);
    }
    next();
});

// CORS ayarları
const corsOptions = {
    origin: config.corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan(config.logging));

// Swagger yapılandırması
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Test Uygulaması API',
            version: '1.0.0',
            description: 'Test uygulaması için Express API',
        },
        servers: [
            {
                url: config.nodeEnv === 'production' ? 'https://oguzhandemirci.com.tr' : 'http://localhost:3000',
                description: config.nodeEnv === 'production' ? 'Production ortamı' : 'Development ortamı',
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
app.listen(config.port, '0.0.0.0', () => {
    console.log(`Sunucu ${config.apiUrl} adresinde çalışıyor`);
    console.log(`Swagger belgeleri şu adreste: ${config.apiUrl}/api-docs`);
});

module.exports = app;
