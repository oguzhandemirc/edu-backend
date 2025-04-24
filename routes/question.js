const express = require('express');
const router = express.Router();
const questionController = require('../controllers/question.controller');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Questions
 *   description: Soru yönetimi
 */

/**
 * @swagger
 * /api/questions/test/{testId}:
 *   get:
 *     summary: Bir teste ait tüm soruları listeler
 *     tags: [Questions]
 *     parameters:
 *       - in: path
 *         name: testId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Test ID'si
 *     responses:
 *       200:
 *         description: Soruların listesi başarıyla getirildi
 *       404:
 *         description: Test bulunamadı
 *       500:
 *         description: Sunucu hatası
 */
router.get('/test/:testId', questionController.getQuestionsByTest);

/**
 * @swagger
 * /api/questions/test/{testId}/for-users:
 *   get:
 *     summary: Bir teste ait tüm soruları doğru cevaplar olmadan listeler (Kullanıcılar için)
 *     description: Bu endpoint, kullanıcıların test çözerken kullanması için, doğru cevap bilgileri olmadan soru ve şıkları döndürür
 *     tags: [Questions]
 *     parameters:
 *       - in: path
 *         name: testId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Test ID'si
 *     responses:
 *       200:
 *         description: Soruların listesi başarıyla getirildi
 *       404:
 *         description: Test bulunamadı
 *       500:
 *         description: Sunucu hatası
 */
router.get('/test/:testId/for-users', questionController.getQuestionsByTestForUsers);

/**
 * @swagger
 * /api/questions/{id}:
 *   get:
 *     summary: Belirli bir soruyu ID'ye göre getirir
 *     tags: [Questions]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Soru ID'si
 *     responses:
 *       200:
 *         description: Soru başarıyla getirildi
 *       404:
 *         description: Soru bulunamadı
 *       500:
 *         description: Sunucu hatası
 */
router.get('/:id', questionController.getQuestionById);

/**
 * @swagger
 * /api/questions:
 *   post:
 *     summary: Yeni bir çoktan seçmeli soru oluşturur (Sadece admin)
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *               - testId
 *               - options
 *             properties:
 *               content:
 *                 type: string
 *                 description: Soru içeriği
 *               explanation:
 *                 type: string
 *                 description: Sorunun açıklaması veya çözümü (opsiyonel)
 *               testId:
 *                 type: integer
 *                 description: Sorunun ait olduğu testin ID'si
 *               options:
 *                 type: array
 *                 description: Çoktan seçmeli soru şıkları (en az 2 şık ve en az 1 doğru şık olmalı)
 *                 items:
 *                   type: object
 *                   required:
 *                     - content
 *                     - isCorrect
 *                   properties:
 *                     content:
 *                       type: string
 *                       description: Şık içeriği
 *                     isCorrect:
 *                       type: boolean
 *                       description: Doğru şık mı?
 *     responses:
 *       201:
 *         description: Soru başarıyla oluşturuldu
 *       400:
 *         description: Geçersiz veri
 *       401:
 *         description: Kimlik doğrulama gerekli
 *       403:
 *         description: Yetkisiz erişim
 *       404:
 *         description: Test bulunamadı
 *       500:
 *         description: Sunucu hatası
 */
router.post('/', authenticate, requireAdmin, questionController.createQuestion);

/**
 * @swagger
 * /api/questions/{id}:
 *   put:
 *     summary: Çoktan seçmeli soruyu günceller (Sadece admin)
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Soru ID'si
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *               - testId
 *               - options
 *             properties:
 *               content:
 *                 type: string
 *                 description: Soru içeriği
 *               explanation:
 *                 type: string
 *                 description: Sorunun açıklaması veya çözümü (opsiyonel)
 *               testId:
 *                 type: integer
 *                 description: Sorunun ait olduğu testin ID'si
 *               options:
 *                 type: array
 *                 description: Çoktan seçmeli soru şıkları (en az 2 şık ve en az 1 doğru şık olmalı)
 *                 items:
 *                   type: object
 *                   required:
 *                     - content
 *                     - isCorrect
 *                   properties:
 *                     content:
 *                       type: string
 *                       description: Şık içeriği
 *                     isCorrect:
 *                       type: boolean
 *                       description: Doğru şık mı?
 *     responses:
 *       200:
 *         description: Soru başarıyla güncellendi
 *       400:
 *         description: Geçersiz veri
 *       401:
 *         description: Kimlik doğrulama gerekli
 *       403:
 *         description: Yetkisiz erişim
 *       404:
 *         description: Soru veya test bulunamadı
 *       500:
 *         description: Sunucu hatası
 */
router.put('/:id', authenticate, requireAdmin, questionController.updateQuestion);

/**
 * @swagger
 * /api/questions/{id}:
 *   delete:
 *     summary: Soruyu ve ilişkili tüm şıkları siler (Sadece admin)
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Soru ID'si
 *     responses:
 *       200:
 *         description: Soru başarıyla silindi
 *       401:
 *         description: Kimlik doğrulama gerekli
 *       403:
 *         description: Yetkisiz erişim
 *       404:
 *         description: Soru bulunamadı
 *       500:
 *         description: Sunucu hatası
 */
router.delete('/:id', authenticate, requireAdmin, questionController.deleteQuestion);

module.exports = router; 