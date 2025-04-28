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

// Swagger yapılandırması - sadece development ortamında erişilebilir
if (config.nodeEnv !== 'production') {
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

    console.log('Swagger API dokümantasyonu etkinleştirildi (sadece development ortamında erişilebilir)');
} else {
    // Production ortamında api-docs'a erişim engellendi
    app.use('/api-docs', (req, res) => {
        res.status(403).json({
            error: 'API dokümantasyonuna sadece development ortamında erişilebilir'
        });
    });
}

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
    if (config.nodeEnv !== 'production') {
        console.log(`Swagger belgeleri şu adreste: ${config.apiUrl}/api-docs`);
    }
});

module.exports = app;
