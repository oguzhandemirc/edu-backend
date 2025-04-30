const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');

/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: Google ile giriş başlatır
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Google yönlendirmesi
 */
router.get('/google',
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        // State parametresi, CSRF koruması için kullanılabilir
        // Ayrıca, yönlendirme yapmak istediğiniz frontend URL'ini taşıyabilir
        state: process.env.NODE_ENV === 'production'
            ? 'https://test.oguzhandemirci.com.tr'
            : 'http://localhost:5173'
    })
);

/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Google kimlik doğrulama geri çağırma noktası
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Google'dan dönen yetkilendirme kodu
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: Önceki istekte gönderilen state parametresi
 *     responses:
 *       302:
 *         description: Frontend yönlendirmesi
 */
router.get('/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/api/auth/google/failed' }),
    (req, res) => {
        try {
            // Başarılı kimlik doğrulaması durumunda JWT token oluştur
            const token = jwt.sign(
                {
                    userId: req.user.id,
                    email: req.user.email,
                    role: req.user.role,
                },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
            );

            // Frontend URL'ini al (state'ten veya varsayılan değerden)
            const frontendUrl = req.query.state ||
                (process.env.NODE_ENV === 'production'
                    ? 'https://test.oguzhandemirci.com.tr'
                    : 'http://localhost:5173');

            // Token'ı URL parametresi olarak frontend'e gönder
            const redirectUrl = `${frontendUrl}?token=${token}`;

            return res.redirect(redirectUrl);
        } catch (error) {
            console.error('Google callback hatası:', error);
            return res.redirect('/api/auth/google/failed');
        }
    }
);

/**
 * @swagger
 * /api/auth/google/failed:
 *   get:
 *     summary: Google kimlik doğrulama başarısız olduğunda
 *     tags: [Auth]
 *     responses:
 *       401:
 *         description: Kimlik doğrulama başarısız
 */
router.get('/google/failed', (req, res) => {
    res.status(401).json({
        success: false,
        message: 'Google ile giriş başarısız oldu'
    });
});

module.exports = router; 