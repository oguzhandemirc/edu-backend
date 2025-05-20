/**
 * API isteklerini hız sınırlandırma middleware'i
 */
const rateLimit = require('express-rate-limit');
const config = require('../config');

// Genel API rate limiter
exports.apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 dakika
    max: 200, // Her IP'den 15 dakikada en fazla 100 istek
    standardHeaders: true, // Limit bilgilerini döndür (X-RateLimit-*)
    legacyHeaders: false, // X-RateLimit-* başlıklarını devre dışı bırak
    message: {
        success: false,
        message: 'Çok fazla istek gönderildi, lütfen daha sonra tekrar deneyin'
    },
    skip: () => config.nodeEnv === 'development' // Development ortamında limitleri devre dışı bırak
});

// Hassas rotalar için daha sıkı limit (login, register gibi)
exports.authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 saat
    max: 20, // Her IP'den saatte en fazla 10 istek
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Çok fazla kimlik doğrulama isteği, lütfen bir saat sonra tekrar deneyin'
    },
    skip: () => config.nodeEnv === 'development' // Development ortamında limitleri devre dışı bırak
}); 