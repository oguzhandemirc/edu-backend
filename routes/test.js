const express = require('express');
const router = express.Router();
const testController = require('../controllers/test.controller');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Tests
 *   description: Test yönetimi
 */

/**
 * @swagger
 * /api/tests/difficulty-levels:
 *   get:
 *     summary: Test zorluk seviyelerini listeler
 *     tags: [Tests]
 *     responses:
 *       200:
 *         description: Zorluk seviyeleri başarıyla getirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   value:
 *                     type: string
 *                     description: Zorluk seviyesi değeri
 *                     enum: [BEGINNER, INTERMEDIATE, ADVANCED, EXPERT]
 *                   label:
 *                     type: string
 *                     description: Zorluk seviyesi etiketi
 *       500:
 *         description: Sunucu hatası
 */
router.get('/difficulty-levels', testController.getDifficultyLevels);

/**
 * @swagger
 * /api/tests:
 *   get:
 *     summary: Tüm testleri listeler
 *     tags: [Tests]
 *     responses:
 *       200:
 *         description: Testlerin listesi başarıyla getirildi
 *       500:
 *         description: Sunucu hatası
 */
router.get('/', testController.getAllTests);

/**
 * @swagger
 * /api/tests/section/{sectionId}:
 *   get:
 *     summary: Bir bölüme ait tüm testleri listeler
 *     tags: [Tests]
 *     parameters:
 *       - in: path
 *         name: sectionId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Bölüm ID'si
 *     responses:
 *       200:
 *         description: Testlerin listesi başarıyla getirildi
 *       404:
 *         description: Bölüm bulunamadı
 *       500:
 *         description: Sunucu hatası
 */
router.get('/section/:sectionId', testController.getTestsBySection);

/**
 * @swagger
 * /api/tests/{id}:
 *   get:
 *     summary: Belirli bir testi ID'ye göre getirir
 *     tags: [Tests]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Test ID'si
 *     responses:
 *       200:
 *         description: Test başarıyla getirildi
 *       404:
 *         description: Test bulunamadı
 *       500:
 *         description: Sunucu hatası
 */
router.get('/:id', testController.getTestById);

/**
 * @swagger
 * /api/tests:
 *   post:
 *     summary: Yeni bir test oluşturur (Sadece admin)
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - difficulty
 *               - sectionId
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               difficulty:
 *                 type: string
 *                 enum: [BEGINNER, INTERMEDIATE, ADVANCED, EXPERT]
 *               duration:
 *                 type: integer
 *                 description: Testin dakika cinsinden süresi
 *                 default: 30
 *               sectionId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Test başarıyla oluşturuldu
 *       400:
 *         description: Geçersiz veri
 *       401:
 *         description: Kimlik doğrulama gerekli
 *       403:
 *         description: Yetkisiz erişim
 *       404:
 *         description: Bölüm bulunamadı
 *       500:
 *         description: Sunucu hatası
 */
router.post('/', authenticate, requireAdmin, testController.createTest);

/**
 * @swagger
 * /api/tests/{id}:
 *   put:
 *     summary: Testi günceller (Sadece admin)
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Test ID'si
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - difficulty
 *               - sectionId
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               difficulty:
 *                 type: string
 *                 enum: [BEGINNER, INTERMEDIATE, ADVANCED, EXPERT]
 *               duration:
 *                 type: integer
 *                 description: Testin dakika cinsinden süresi
 *                 default: 30
 *               sectionId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Test başarıyla güncellendi
 *       400:
 *         description: Geçersiz veri
 *       401:
 *         description: Kimlik doğrulama gerekli
 *       403:
 *         description: Yetkisiz erişim
 *       404:
 *         description: Test veya bölüm bulunamadı
 *       500:
 *         description: Sunucu hatası
 */
router.put('/:id', authenticate, requireAdmin, testController.updateTest);

/**
 * @swagger
 * /api/tests/{id}:
 *   delete:
 *     summary: Testi ve ilişkili tüm soruları siler (Sadece admin)
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Test ID'si
 *     responses:
 *       200:
 *         description: Test ve ilişkili sorular başarıyla silindi
 *       401:
 *         description: Kimlik doğrulama gerekli
 *       403:
 *         description: Yetkisiz erişim
 *       404:
 *         description: Test bulunamadı
 *       500:
 *         description: Sunucu hatası
 */
router.delete('/:id', authenticate, requireAdmin, testController.deleteTest);

module.exports = router; 