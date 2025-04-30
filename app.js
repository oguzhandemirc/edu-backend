const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const passport = require('./config/passport');
const config = require('./config');
const { errorMiddleware } = require('./utils/errorHandler');
const { setupSwagger } = require('./config/swagger');
const { apiLimiter, authLimiter } = require('./middleware/rateLimit.middleware');

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

// Swagger kurulumu
setupSwagger(app);

// Passport middleware'i ekle
app.use(passport.initialize());

// Tüm API rotalarına genel rate limit uygula
app.use('/api', apiLimiter);

// Auth rotaları (auth limiter ile koruma)
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth', require('./routes/auth'));

// Google OAuth rotaları
app.use('/api/auth', require('./routes/google-auth'));

// Bölüm rotaları
app.use('/api/sections', require('./routes/section'));

// Test rotaları
app.use('/api/tests', require('./routes/test'));

// Soru rotaları
app.use('/api/questions', require('./routes/question'));

// Test sonuçları rotaları
app.use('/api/test-results', require('./routes/testResult'));

// Global error handling middleware
app.use(errorMiddleware);

// Sunucu başlatma
app.listen(config.port, '0.0.0.0', () => {
    console.log(`Sunucu ${config.apiUrl} adresinde çalışıyor`);
    if (config.nodeEnv !== 'production') {
        console.log(`Swagger belgeleri şu adreste: ${config.apiUrl}/api-docs`);
    }
});

module.exports = app;
