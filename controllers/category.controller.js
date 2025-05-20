const prisma = require('../prisma/prisma');
const { z } = require('zod');
const { asyncHandler, ApiError } = require('../utils/errorHandler');

// Validation şemaları
const categorySchema = z.object({
    name: z.string().min(2, 'Kategori adı en az 2 karakter olmalıdır'),
    description: z.string().optional(),
});

// Tüm kategorileri getir
exports.getAllCategories = asyncHandler(async (req, res) => {
    const categories = await prisma.category.findMany({
        include: {
            _count: {
                select: { sections: true }
            }
        },
        orderBy: {
            name: 'asc'
        }
    });

    return res.status(200).json({
        success: true,
        count: categories.length,
        data: categories
    });
});

// Belirli bir kategoriyi getir
exports.getCategoryById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const category = await prisma.category.findUnique({
        where: { id: parseInt(id) },
        include: {
            sections: true,
            _count: {
                select: { sections: true }
            }
        }
    });

    if (!category) {
        throw ApiError.notFound('Kategori bulunamadı');
    }

    return res.status(200).json({
        success: true,
        data: category
    });
});

// Yeni kategori oluştur
exports.createCategory = asyncHandler(async (req, res) => {
    // Admin yetkisi kontrolü req.user middleware'i tarafından yapılmıştır

    // Validasyon
    const validData = categorySchema.parse(req.body);

    // Kategori zaten var mı kontrol et
    const existingCategory = await prisma.category.findUnique({
        where: { name: validData.name }
    });

    if (existingCategory) {
        throw ApiError.conflict('Bu isimde bir kategori zaten mevcut');
    }

    // Kategoriyi oluştur
    const newCategory = await prisma.category.create({
        data: {
            name: validData.name,
            description: validData.description || null,
            createdById: req.user.id,
            updatedById: req.user.id
        }
    });

    return res.status(201).json({
        success: true,
        message: 'Kategori başarıyla oluşturuldu',
        data: newCategory
    });
});

// Kategoriyi güncelle
exports.updateCategory = asyncHandler(async (req, res) => {
    // Admin yetkisi kontrolü req.user middleware'i tarafından yapılmıştır
    const { id } = req.params;

    // Validasyon
    const validData = categorySchema.parse(req.body);

    // Kategori var mı kontrol et
    const category = await prisma.category.findUnique({
        where: { id: parseInt(id) }
    });

    if (!category) {
        throw ApiError.notFound('Kategori bulunamadı');
    }

    // İsim değişikliği varsa, yeni isim başka bir kategoride kullanılıyor mu kontrol et
    if (validData.name !== category.name) {
        const nameExists = await prisma.category.findUnique({
            where: { name: validData.name }
        });

        if (nameExists) {
            throw ApiError.conflict('Bu isimde bir kategori zaten mevcut');
        }
    }

    // Kategoriyi güncelle
    const updatedCategory = await prisma.category.update({
        where: { id: parseInt(id) },
        data: {
            name: validData.name,
            description: validData.description,
            updatedById: req.user.id
        }
    });

    return res.status(200).json({
        success: true,
        message: 'Kategori başarıyla güncellendi',
        data: updatedCategory
    });
});

// Kategoriyi sil
exports.deleteCategory = asyncHandler(async (req, res) => {
    // Admin yetkisi kontrolü req.user middleware'i tarafından yapılmıştır
    const { id } = req.params;

    // Kategori var mı kontrol et
    const category = await prisma.category.findUnique({
        where: { id: parseInt(id) },
        include: {
            _count: {
                select: { sections: true }
            }
        }
    });

    if (!category) {
        throw ApiError.notFound('Kategori bulunamadı');
    }

    // İlişkili bölümleri güncelle (null yap)
    if (category._count.sections > 0) {
        await prisma.section.updateMany({
            where: { categoryId: parseInt(id) },
            data: { categoryId: null }
        });
    }

    // Kategoriyi sil
    await prisma.category.delete({
        where: { id: parseInt(id) }
    });

    return res.status(200).json({
        success: true,
        message: 'Kategori başarıyla silindi'
    });
}); 