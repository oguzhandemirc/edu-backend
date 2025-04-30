/**
 * Uygulama içindeki tüm hataları tutarlı şekilde işlemek için yardımcı fonksiyonlar
 */
const { z } = require('zod');

/**
 * API hatalarını sınıflandırmak için özel hata sınıfı
 */
class ApiError extends Error {
    constructor(statusCode, message, errors = null) {
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
        this.name = this.constructor.name;
    }

    static badRequest(message, errors = null) {
        return new ApiError(400, message, errors);
    }

    static unauthorized(message = 'Kimlik doğrulama gerekli') {
        return new ApiError(401, message);
    }

    static forbidden(message = 'Bu işlem için yetkiniz yok') {
        return new ApiError(403, message);
    }

    static notFound(message = 'Kaynak bulunamadı') {
        return new ApiError(404, message);
    }

    static conflict(message) {
        return new ApiError(409, message);
    }

    static internal(message = 'Sunucu hatası') {
        return new ApiError(500, message);
    }
}

/**
 * HTTP yanıtı olarak hata döndürmek için global error handler middleware
 */
const errorMiddleware = (err, req, res, next) => {
    // Zod validasyon hatası
    if (err instanceof z.ZodError) {
        return res.status(400).json({
            success: false,
            message: 'Geçersiz giriş verileri',
            errors: err.errors
        });
    }

    // JWT hatası
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Geçersiz veya süresi dolmuş token'
        });
    }

    // Özel API hatası
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            ...(err.errors && { errors: err.errors })
        });
    }

    // Beklenmeyen hata
    console.error('Sunucu hatası:', err);
    return res.status(500).json({
        success: false,
        message: 'Sunucu hatası'
    });
};

/**
 * Controller fonksiyonlarındaki async hataları yakalamak için yardımcı fonksiyon
 * @param {Function} fn - Controller fonksiyonu
 * @returns {Function} - Express middleware fonksiyonu
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
    ApiError,
    errorMiddleware,
    asyncHandler
}; 