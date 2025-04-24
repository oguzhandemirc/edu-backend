const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
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
                url: `http://localhost:${process.env.PORT || 3000}`,
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
    apis: ['./routes/*.js'], // API rotalarının bulunduğu dosyalar
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
app.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor`);
    console.log(`Swagger belgeleri şu adreste: http://localhost:${PORT}/api-docs`);
});

module.exports = app; 