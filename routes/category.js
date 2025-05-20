const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/auth.middleware');

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Tüm kategorileri listeler
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Kategoriler başarıyla listelendi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 3
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       name:
 *                         type: string
 *                         example: "Dilbilgisi"
 *                       description:
 *                         type: string
 *                         example: "İngilizce dilbilgisi kategorisi"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       _count:
 *                         type: object
 *                         properties:
 *                           sections:
 *                             type: integer
 *                             example: 5
 */
router.get('/', categoryController.getAllCategories);

/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     summary: Belirli bir kategoriyi getirir
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Kategori ID'si
 *     responses:
 *       200:
 *         description: Kategori başarıyla getirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: "Dilbilgisi"
 *                     description:
 *                       type: string
 *                       example: "İngilizce dilbilgisi kategorisi"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     sections:
 *                       type: array
 *                       items:
 *                         type: object
 *                     _count:
 *                       type: object
 *                       properties:
 *                         sections:
 *                           type: integer
 *                           example: 5
 *       404:
 *         description: Kategori bulunamadı
 */
router.get('/:id', categoryController.getCategoryById);

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Yeni bir kategori oluşturur
 *     tags: [Categories]
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
 *                 example: "Dilbilgisi"
 *               description:
 *                 type: string
 *                 example: "İngilizce dilbilgisi kategorisi"
 *     responses:
 *       201:
 *         description: Kategori başarıyla oluşturuldu
 *       400:
 *         description: Geçersiz kategori verileri
 *       401:
 *         description: Kimlik doğrulama gerekli
 *       403:
 *         description: Bu işlem için yetkiniz yok
 *       409:
 *         description: Bu isimde bir kategori zaten mevcut
 */
router.post('/', authenticate, requireAdmin, categoryController.createCategory);

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: Bir kategoriyi günceller
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Kategori ID'si
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
 *                 example: "Dilbilgisi"
 *               description:
 *                 type: string
 *                 example: "İngilizce dilbilgisi kategorisi - güncellenmiş açıklama"
 *     responses:
 *       200:
 *         description: Kategori başarıyla güncellendi
 *       400:
 *         description: Geçersiz kategori verileri
 *       401:
 *         description: Kimlik doğrulama gerekli
 *       403:
 *         description: Bu işlem için yetkiniz yok
 *       404:
 *         description: Kategori bulunamadı
 *       409:
 *         description: Bu isimde bir kategori zaten mevcut
 */
router.put('/:id', authenticate, requireAdmin, categoryController.updateCategory);

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Bir kategoriyi siler
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Kategori ID'si
 *     responses:
 *       200:
 *         description: Kategori başarıyla silindi
 *       401:
 *         description: Kimlik doğrulama gerekli
 *       403:
 *         description: Bu işlem için yetkiniz yok
 *       404:
 *         description: Kategori bulunamadı
 */
router.delete('/:id', authenticate, requireAdmin, categoryController.deleteCategory);

module.exports = router; 