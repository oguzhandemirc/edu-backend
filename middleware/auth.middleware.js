const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * JWT token doğrulama middleware'i
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 * @param {Function} next - Express next fonksiyonu
 */
exports.authenticate = async (req, res, next) => {
    try {
        // Authorization header'ı kontrol et
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Kimlik doğrulama gerekli' });
        }

        // Token'ı al
        const token = authHeader.split(' ')[1];

        // Token'ı doğrula
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Kullanıcıyı bul
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
        });

        if (!user) {
            return res.status(401).json({ message: 'Geçersiz kimlik bilgileri' });
        }

        // Kullanıcı bilgilerini request'e ekle
        req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
        };

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Geçersiz veya süresi dolmuş token' });
        }

        console.error('Kimlik doğrulama hatası:', error);
        return res.status(500).json({ message: 'Sunucu hatası' });
    }
};

/**
 * Admin yetki kontrolü middleware'i
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 * @param {Function} next - Express next fonksiyonu
 */
exports.requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
    }
    next();
}; 