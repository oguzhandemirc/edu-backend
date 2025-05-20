const prisma = require('../prisma/prisma');
const { z } = require('zod');
const { asyncHandler, ApiError } = require('../utils/errorHandler');

// DifficultyLevel validation şemaları
const difficultyLevelSchema = z.object({
    name: z.string().min(2, 'İsim en az 2 karakter olmalıdır'),
    description: z.string().optional(),
    value: z.number().int().positive().default(1)
});

// Tüm zorluk seviyelerini getir
exports.getAllDifficultyLevels = asyncHandler(async (req, res) => {
    const difficultyLevels = await prisma.difficultyLevel.findMany({
        orderBy: {
            value: 'asc'
        }
    });

    return res.status(200).json(difficultyLevels);
});

// Belirli bir zorluk seviyesini ID'ye göre getir
exports.getDifficultyLevelById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const difficultyLevel = await prisma.difficultyLevel.findUnique({
        where: { id: Number(id) }
    });

    if (!difficultyLevel) {
        throw ApiError.notFound('Zorluk seviyesi bulunamadı');
    }

    return res.status(200).json(difficultyLevel);
});

// Yeni zorluk seviyesi oluştur
exports.createDifficultyLevel = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const validData = difficultyLevelSchema.parse(req.body);

    // Aynı isimle zorluk seviyesi var mı kontrol et
    const existingDifficultyLevel = await prisma.difficultyLevel.findUnique({
        where: { name: validData.name }
    });

    if (existingDifficultyLevel) {
        throw ApiError.conflict('Bu isimde bir zorluk seviyesi zaten var');
    }

    const newDifficultyLevel = await prisma.difficultyLevel.create({
        data: {
            ...validData,
            createdById: userId,
        }
    });

    return res.status(201).json({
        message: 'Zorluk seviyesi başarıyla oluşturuldu',
        difficultyLevel: newDifficultyLevel
    });
});

// Zorluk seviyesini güncelle
exports.updateDifficultyLevel = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const validData = difficultyLevelSchema.parse(req.body);

    // Zorluk seviyesi var mı kontrol et
    const difficultyLevel = await prisma.difficultyLevel.findUnique({
        where: { id: Number(id) }
    });

    if (!difficultyLevel) {
        throw ApiError.notFound('Zorluk seviyesi bulunamadı');
    }

    // Aynı isimle başka bir zorluk seviyesi var mı kontrol et
    if (validData.name !== difficultyLevel.name) {
        const existingDifficultyLevel = await prisma.difficultyLevel.findUnique({
            where: { name: validData.name }
        });

        if (existingDifficultyLevel) {
            throw ApiError.conflict('Bu isimde bir zorluk seviyesi zaten var');
        }
    }

    const updatedDifficultyLevel = await prisma.difficultyLevel.update({
        where: { id: Number(id) },
        data: {
            ...validData,
            updatedById: userId,
        }
    });

    return res.status(200).json({
        message: 'Zorluk seviyesi başarıyla güncellendi',
        difficultyLevel: updatedDifficultyLevel
    });
});

// Zorluk seviyesini sil
exports.deleteDifficultyLevel = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Zorluk seviyesi var mı kontrol et
    const difficultyLevel = await prisma.difficultyLevel.findUnique({
        where: { id: Number(id) },
        include: {
            tests: {
                select: { id: true },
                take: 1
            }
        }
    });

    if (!difficultyLevel) {
        throw ApiError.notFound('Zorluk seviyesi bulunamadı');
    }

    // Zorluk seviyesinin ilişkili testleri var mı kontrol et
    if (difficultyLevel.tests.length > 0) {
        throw ApiError.conflict('Bu zorluk seviyesiyle ilişkili testler var. Önce testleri silin veya başka bir zorluk seviyesine taşıyın.');
    }

    await prisma.difficultyLevel.delete({
        where: { id: Number(id) }
    });

    return res.status(200).json({
        message: 'Zorluk seviyesi başarıyla silindi'
    });
}); 