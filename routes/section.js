const express = require('express');
const router = express.Router();
const sectionController = require('../controllers/section.controller');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Sections
 *   description: Bölüm yönetimi
 */

/**
 * @swagger
 * /api/sections:
 *   get:
 *     summary: Tüm bölümleri listeler
 *     tags: [Sections]
 *     parameters:
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *         description: Belirli bir kategoriye ait bölümleri filtrele
 *         required: false
 *     responses:
 *       200:
 *         description: Bölümlerin listesi başarıyla getirildi
 *       500:
 *         description: Sunucu hatası
 */
router.get('/', sectionController.getAllSections);

/**
 * @swagger
 * /api/sections/{id}:
 *   get:
 *     summary: Belirli bir bölümü ID'ye göre getirir
 *     tags: [Sections]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Bölüm ID'si
 *     responses:
 *       200:
 *         description: Bölüm başarıyla getirildi
 *       404:
 *         description: Bölüm bulunamadı
 *       500:
 *         description: Sunucu hatası
 */
router.get('/:id', sectionController.getSectionById);

/**
 * @swagger
 * /api/sections:
 *   post:
 *     summary: Yeni bir bölüm oluşturur (Sadece admin)
 *     tags: [Sections]
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
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Okuma Anlama"
 *               description:
 *                 type: string
 *                 example: "İngilizce okuma ve anlama becerilerini geliştiren bölüm"
 *               categoryId:
 *                 type: integer
 *                 description: Bölümün ait olduğu kategori ID'si
 *                 example: 1
 *     responses:
 *       201:
 *         description: Bölüm başarıyla oluşturuldu
 *       400:
 *         description: Geçersiz veri
 *       401:
 *         description: Kimlik doğrulama gerekli
 *       403:
 *         description: Yetkisiz erişim
 *       404:
 *         description: Belirtilen kategori bulunamadı
 *       500:
 *         description: Sunucu hatası
 */
router.post('/', authenticate, requireAdmin, sectionController.createSection);

/**
 * @swagger
 * /api/sections/{id}:
 *   put:
 *     summary: Bölümü günceller (Sadece admin)
 *     tags: [Sections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Bölüm ID'si
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Okuma Anlama"
 *               description:
 *                 type: string
 *                 example: "İngilizce okuma ve anlama becerilerini geliştiren bölüm"
 *               categoryId:
 *                 type: integer
 *                 description: Bölümün ait olduğu kategori ID'si
 *                 example: 1
 *     responses:
 *       200:
 *         description: Bölüm başarıyla güncellendi
 *       400:
 *         description: Geçersiz veri
 *       401:
 *         description: Kimlik doğrulama gerekli
 *       403:
 *         description: Yetkisiz erişim
 *       404:
 *         description: Bölüm veya belirtilen kategori bulunamadı
 *       500:
 *         description: Sunucu hatası
 */
router.put('/:id', authenticate, requireAdmin, sectionController.updateSection);

/**
 * @swagger
 * /api/sections/{id}:
 *   delete:
 *     summary: Bölümü ve ilişkili tüm testleri ve soruları siler (Sadece admin)
 *     tags: [Sections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Bölüm ID'si
 *     responses:
 *       200:
 *         description: Bölüm ve ilişkili içerikler başarıyla silindi
 *       401:
 *         description: Kimlik doğrulama gerekli
 *       403:
 *         description: Yetkisiz erişim
 *       404:
 *         description: Bölüm bulunamadı
 *       500:
 *         description: Sunucu hatası
 */
router.delete('/:id', authenticate, requireAdmin, sectionController.deleteSection);

module.exports = router; 