/**
 * Swagger yapılandırması
 */
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const config = require('../config');

// Swagger ayarları
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
                url: config.apiUrl,
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

// Swagger dokümanı oluştur
const swaggerDocs = swaggerJsDoc(swaggerOptions);

/**
 * Express uygulamasına Swagger UI ekler
 * @param {Object} app - Express uygulaması
 */
exports.setupSwagger = (app) => {
    if (config.nodeEnv !== 'production') {
        // Sadece development ortamında Swagger UI'ı etkinleştir
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
}; 