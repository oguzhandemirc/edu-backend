const express = require('express');
const router = express.Router();
const difficultyLevelController = require('../controllers/difficultyLevel.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/auth.middleware');

/**
 * @swagger
 * /api/difficulty-levels:
 *   get:
 *     summary: Tüm zorluk seviyelerini listeler
 *     tags: [DifficultyLevels]
 *     responses:
 *       200:
 *         description: Zorluk seviyeleri listesi
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *                   value:
 *                     type: integer
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 */
router.get('/', difficultyLevelController.getAllDifficultyLevels);

/**
 * @swagger
 * /api/difficulty-levels/{id}:
 *   get:
 *     summary: Belirli bir zorluk seviyesini ID'ye göre getirir
 *     tags: [DifficultyLevels]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Zorluk seviyesi ID
 *     responses:
 *       200:
 *         description: Zorluk seviyesi detayları
 *       404:
 *         description: Zorluk seviyesi bulunamadı
 */
router.get('/:id', difficultyLevelController.getDifficultyLevelById);

/**
 * @swagger
 * /api/difficulty-levels:
 *   post:
 *     summary: Yeni bir zorluk seviyesi oluşturur
 *     tags: [DifficultyLevels]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Zorluk seviyesi adı
 *               description:
 *                 type: string
 *                 description: Zorluk seviyesi açıklaması
 *               value:
 *                 type: integer
 *                 description: Zorluk değeri (sıralama için)
 *                 default: 1
 *     responses:
 *       201:
 *         description: Zorluk seviyesi başarıyla oluşturuldu
 *       400:
 *         description: Geçersiz veri
 *       401:
 *         description: Yetki hatası
 *       409:
 *         description: Bu isimde bir zorluk seviyesi zaten var
 */
router.post('/', authenticate, requireAdmin, difficultyLevelController.createDifficultyLevel);

/**
 * @swagger
 * /api/difficulty-levels/{id}:
 *   put:
 *     summary: Bir zorluk seviyesini günceller
 *     tags: [DifficultyLevels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Zorluk seviyesi ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Zorluk seviyesi adı
 *               description:
 *                 type: string
 *                 description: Zorluk seviyesi açıklaması
 *               value:
 *                 type: integer
 *                 description: Zorluk değeri (sıralama için)
 *     responses:
 *       200:
 *         description: Zorluk seviyesi başarıyla güncellendi
 *       400:
 *         description: Geçersiz veri
 *       401:
 *         description: Yetki hatası
 *       404:
 *         description: Zorluk seviyesi bulunamadı
 *       409:
 *         description: Bu isimde bir zorluk seviyesi zaten var
 */
router.put('/:id', authenticate, requireAdmin, difficultyLevelController.updateDifficultyLevel);

/**
 * @swagger
 * /api/difficulty-levels/{id}:
 *   delete:
 *     summary: Bir zorluk seviyesini siler
 *     tags: [DifficultyLevels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Zorluk seviyesi ID
 *     responses:
 *       200:
 *         description: Zorluk seviyesi başarıyla silindi
 *       401:
 *         description: Yetki hatası
 *       404:
 *         description: Zorluk seviyesi bulunamadı
 *       409:
 *         description: Bu zorluk seviyesiyle ilişkili testler var
 */
router.delete('/:id', authenticate, requireAdmin, difficultyLevelController.deleteDifficultyLevel);

module.exports = router; 