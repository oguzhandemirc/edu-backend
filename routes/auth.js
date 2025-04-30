const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authLimiter } = require('../middleware/rateLimit.middleware');

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Yeni bir kullanıcı kaydeder
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - termsAccepted
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               name:
 *                 type: string
 *               termsAccepted:
 *                 type: boolean
 *                 description: Kullanım şartlarını ve gizlilik politikasını kabul ettiğini belirtir
 *                 example: true
 *               marketingEmails:
 *                 type: boolean
 *                 description: E-posta kampanyalarından haberdar olmak isteyip istemediğini belirtir
 *                 default: false
 *                 example: false
 *     responses:
 *       201:
 *         description: Kullanıcı başarıyla kaydedildi
 *       400:
 *         description: Geçersiz giriş verileri
 *       409:
 *         description: Bu e-posta adresi zaten kullanılıyor
 */
router.post('/register', authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Kullanıcı girişi yapar ve bir JWT token döndürür
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Başarılı giriş
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *       401:
 *         description: Geçersiz kimlik bilgileri
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /api/auth/validate-token:
 *   get:
 *     summary: JWT token'ı doğrular ve kullanıcı bilgilerini döndürür
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token geçerli, kullanıcı bilgileri döndürüldü
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *                     role:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Geçersiz veya süresi dolmuş token
 *       404:
 *         description: Kullanıcı bulunamadı
 */
router.get('/validate-token', authenticate, authController.validateToken);

/**
 * @swagger
 * /api/auth/verify-role:
 *   get:
 *     summary: Kullanıcının admin rolüne sahip olup olmadığını kontrol eder
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin yetkisi doğrulandı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Admin yetkisi doğrulandı
 *       401:
 *         description: Geçersiz veya süresi dolmuş token
 *       403:
 *         description: Yetersiz yetki (kullanıcı admin değil)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Bu işlem için admin yetkisi gerekiyor
 */
router.get('/verify-role', authenticate, authController.verifyRole);

/**
 * @swagger
 * /api/auth/google-token:
 *   post:
 *     summary: Google'dan alınan token ile giriş yapar
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - termsAccepted
 *             properties:
 *               token:
 *                 type: string
 *               clientId:
 *                 type: string
 *               termsAccepted:
 *                 type: boolean
 *                 description: Kullanım şartlarını ve gizlilik politikasını kabul ettiğini belirtir
 *                 example: true
 *               marketingEmails:
 *                 type: boolean
 *                 description: E-posta kampanyalarından haberdar olmak isteyip istemediğini belirtir
 *                 example: false
 *     responses:
 *       200:
 *         description: Başarılı giriş
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *       400:
 *         description: Kullanım şartları kabul edilmemiş
 *       401:
 *         description: Geçersiz token
 */
router.post('/google-token', authController.verifyGoogleToken);

/**
 * @swagger
 * /api/auth/preferences:
 *   put:
 *     summary: Kullanıcı tercihlerini günceller
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               marketingEmails:
 *                 type: boolean
 *                 description: E-posta kampanyalarından haberdar olmak isteyip istemediğini belirtir
 *     responses:
 *       200:
 *         description: Kullanıcı tercihleri başarıyla güncellendi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *       400:
 *         description: Geçersiz giriş verileri
 *       401:
 *         description: Oturum açılmamış
 */
router.put('/preferences', authenticate, authController.updatePreferences);

module.exports = router; 