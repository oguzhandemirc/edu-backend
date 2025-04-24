const express = require('express');
const router = express.Router();
const testResultController = require('../controllers/testResult.controller');
const { authenticate } = require('../middleware/auth.middleware');

/**
 * @swagger
 * /api/test-results/questions/{testId}:
 *   get:
 *     summary: Test sorularını getir (cevaplar olmadan)
 *     tags: [Test Results]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Test ID
 *     responses:
 *       200:
 *         description: Test soruları başarıyla getirildi
 *       400:
 *         description: Geçersiz test ID
 *       401:
 *         description: Oturum açılmamış
 *       404:
 *         description: Test bulunamadı
 */
router.get('/questions/:testId', authenticate, testResultController.getTestQuestions);

/**
 * @swagger
 * /api/test-results/submit:
 *   post:
 *     summary: Test sonuçlarını kaydet ve değerlendir
 *     tags: [Test Results]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - testId
 *               - totalDuration
 *               - answers
 *             properties:
 *               testId:
 *                 type: integer
 *                 description: Test ID
 *               totalDuration:
 *                 type: integer
 *                 description: Toplam süre (saniye cinsinden)
 *               answers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - questionId
 *                   properties:
 *                     questionId:
 *                       type: integer
 *                       description: Soru ID
 *                     selectedOptionId:
 *                       type: integer
 *                       description: Seçilen şık ID (boş bırakılabilir)
 *     responses:
 *       201:
 *         description: Test sonuçları başarıyla kaydedildi
 *       400:
 *         description: Geçersiz giriş verileri
 *       401:
 *         description: Oturum açılmamış
 *       404:
 *         description: Test bulunamadı
 */
router.post('/submit', authenticate, testResultController.submitTestResults);

/**
 * @swagger
 * /api/test-results/user:
 *   get:
 *     summary: Kullanıcının tüm test sonuçlarını listele
 *     tags: [Test Results]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Test sonuçları başarıyla getirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                   description: Toplam sonuç sayısı
 *                 testResults:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       testId:
 *                         type: integer
 *                       testTitle:
 *                         type: string
 *                       sectionTitle:
 *                         type: string
 *                       score:
 *                         type: number
 *                         format: float
 *                       correctCount:
 *                         type: integer
 *                       wrongCount:
 *                         type: integer
 *                       emptyCount:
 *                         type: integer
 *                       totalDuration:
 *                         type: integer
 *                       completedAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Oturum açılmamış
 */
router.get('/user', authenticate, testResultController.getUserTestResults);

/**
 * @swagger
 * /api/test-results/test/{testId}:
 *   get:
 *     summary: Belirli bir teste ait kullanıcının tüm sonuçlarını getir
 *     tags: [Test Results]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Test ID
 *     responses:
 *       200:
 *         description: Test sonuçları başarıyla getirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 test:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     title:
 *                       type: string
 *                     sectionTitle:
 *                       type: string
 *                 statistics:
 *                   type: object
 *                   properties:
 *                     totalAttempts:
 *                       type: integer
 *                     bestScore:
 *                       type: number
 *                       format: float
 *                     averageScore:
 *                       type: number
 *                       format: float
 *                 attempts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       score:
 *                         type: number
 *                         format: float
 *                       correctCount:
 *                         type: integer
 *                       wrongCount:
 *                         type: integer
 *                       emptyCount:
 *                         type: integer
 *                       totalDuration:
 *                         type: integer
 *                       completedAt:
 *                         type: string
 *                         format: date-time
 *       400:
 *         description: Geçersiz test ID
 *       401:
 *         description: Oturum açılmamış
 *       404:
 *         description: Test bulunamadı
 */
router.get('/test/:testId', authenticate, testResultController.getUserTestResultsByTestId);

/**
 * @swagger
 * /api/test-results/{resultId}:
 *   get:
 *     summary: Test sonucu detaylarını getir (cevaplar ve açıklamalarla birlikte)
 *     tags: [Test Results]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: resultId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Test sonucu ID
 *     responses:
 *       200:
 *         description: Test sonucu detayları başarıyla getirildi
 *       400:
 *         description: Geçersiz test sonucu ID
 *       401:
 *         description: Oturum açılmamış
 *       403:
 *         description: Bu sonucu görüntüleme yetkiniz yok
 *       404:
 *         description: Test sonucu bulunamadı
 */
router.get('/:resultId', authenticate, testResultController.getTestResultDetails);

module.exports = router; 