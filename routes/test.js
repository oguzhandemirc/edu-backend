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
 * /api/tests/{id}/questions:
 *   get:
 *     summary: Belirli bir teste ait tüm soruları getirir
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
 *         description: Sorular başarıyla getirildi
 *       404:
 *         description: Test bulunamadı
 */
router.get('/:id/questions', testController.getQuestionsByTest);

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
 *               - difficultyLevelId
 *               - sectionId
 *             properties:
 *               title:
 *                 type: string
 *                 description: Testin başlığı
 *               description:
 *                 type: string
 *                 description: Testin açıklaması
 *               difficultyLevelId:
 *                 type: integer
 *                 description: Zorluk seviyesi ID'si
 *               duration:
 *                 type: integer
 *                 description: Testin dakika cinsinden süresi
 *                 default: 30
 *               sectionId:
 *                 type: integer
 *                 description: Bölüm ID'si
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
 *         description: Bölüm veya zorluk seviyesi bulunamadı
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
 *               - difficultyLevelId
 *               - sectionId
 *             properties:
 *               title:
 *                 type: string
 *                 description: Testin başlığı
 *               description:
 *                 type: string
 *                 description: Testin açıklaması
 *               difficultyLevelId:
 *                 type: integer
 *                 description: Zorluk seviyesi ID'si
 *               duration:
 *                 type: integer
 *                 description: Testin dakika cinsinden süresi
 *                 default: 30
 *               sectionId:
 *                 type: integer
 *                 description: Bölüm ID'si
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
 *         description: Test, bölüm veya zorluk seviyesi bulunamadı
 */
router.put('/:id', authenticate, requireAdmin, testController.updateTest);

/**
 * @swagger
 * /api/tests/{id}:
 *   delete:
 *     summary: Testi siler (Sadece admin)
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
 *         description: Test başarıyla silindi
 *       401:
 *         description: Kimlik doğrulama gerekli
 *       403:
 *         description: Yetkisiz erişim
 *       404:
 *         description: Test bulunamadı
 */
router.delete('/:id', authenticate, requireAdmin, testController.deleteTest);

module.exports = router; 