const prisma = require('../prisma/prisma');
const { z } = require('zod');
const { asyncHandler, ApiError } = require('../utils/errorHandler');

// Validation şemaları
const sectionSchema = z.object({
    title: z.string().min(2, 'Başlık en az 2 karakter olmalıdır'),
    description: z.string().min(5, 'Açıklama en az 5 karakter olmalıdır'),
    categoryId: z.number().int().positive().optional().nullable(),
});

// Tüm bölümleri getir
exports.getAllSections = asyncHandler(async (req, res) => {
    const { categoryId } = req.query;

    // Filtreleme seçenekleri
    const where = {};

    // Kategori filtreleme
    if (categoryId) {
        where.categoryId = parseInt(categoryId);
    }

    const sections = await prisma.section.findMany({
        where,
        include: {
            category: {
                select: {
                    id: true,
                    name: true,
                },
            },
            tests: {
                select: {
                    id: true,
                    title: true,
                    difficultyLevel: {
                        select: {
                            id: true,
                            name: true,
                            value: true
                        }
                    },
                },
            },
            _count: {
                select: { tests: true },
            },
            createdBy: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            updatedBy: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });

    // Her bölüme testCount alanı ekleme
    const sectionsWithTestCount = sections.map(section => ({
        ...section,
        testCount: section._count.tests,
    }));

    return res.status(200).json(sectionsWithTestCount);
});

// Tek bir bölümü getir
exports.getSectionById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const section = await prisma.section.findUnique({
        where: { id: Number(id) },
        include: {
            category: {
                select: {
                    id: true,
                    name: true,
                    description: true,
                },
            },
            tests: {
                select: {
                    id: true,
                    title: true,
                    difficultyLevel: {
                        select: {
                            id: true,
                            name: true,
                            value: true
                        }
                    },
                    description: true,
                    createdAt: true,
                    updatedAt: true,
                    _count: {
                        select: { questions: true },
                    },
                    createdBy: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                    updatedBy: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            },
            _count: {
                select: { tests: true },
            },
            createdBy: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            updatedBy: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });

    if (!section) {
        throw ApiError.notFound('Bölüm bulunamadı');
    }

    // Testlere questionCount ekleme
    const testsWithQuestionCount = section.tests.map(test => ({
        ...test,
        questionCount: test._count.questions,
    }));

    // Bölüme testCount ekleme
    const sectionWithCounts = {
        ...section,
        testCount: section._count.tests,
        tests: testsWithQuestionCount,
    };

    return res.status(200).json(sectionWithCounts);
});

// Yeni bölüm oluştur
exports.createSection = asyncHandler(async (req, res) => {
    // Validasyon
    const validData = sectionSchema.parse(req.body);

    // Kategori ID varsa, kategori kontrol et
    if (validData.categoryId) {
        const categoryExists = await prisma.category.findUnique({
            where: { id: validData.categoryId }
        });

        if (!categoryExists) {
            throw ApiError.notFound('Belirtilen kategori bulunamadı');
        }
    }

    const newSection = await prisma.section.create({
        data: {
            title: validData.title,
            description: validData.description,
            categoryId: validData.categoryId || null,
            createdById: req.user.id,
        },
        include: {
            category: {
                select: {
                    id: true,
                    name: true,
                },
            },
            createdBy: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });

    return res.status(201).json({
        message: 'Bölüm başarıyla oluşturuldu',
        section: newSection,
    });
});

// Bölümü güncelle
exports.updateSection = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Validasyon
    const validData = sectionSchema.parse(req.body);

    // Bölüm var mı kontrol et
    const section = await prisma.section.findUnique({
        where: { id: Number(id) },
    });

    if (!section) {
        throw ApiError.notFound('Bölüm bulunamadı');
    }

    // Kategori ID varsa, kategori kontrol et
    if (validData.categoryId) {
        const categoryExists = await prisma.category.findUnique({
            where: { id: validData.categoryId }
        });

        if (!categoryExists) {
            throw ApiError.notFound('Belirtilen kategori bulunamadı');
        }
    }

    const updatedSection = await prisma.section.update({
        where: { id: Number(id) },
        data: {
            title: validData.title,
            description: validData.description,
            categoryId: validData.categoryId,
            updatedById: userId,
        },
        include: {
            category: {
                select: {
                    id: true,
                    name: true,
                },
            },
            updatedBy: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });

    return res.status(200).json({
        message: 'Bölüm başarıyla güncellendi',
        section: updatedSection,
    });
});

// Bölümü sil
exports.deleteSection = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Bölüm var mı kontrol et
    const section = await prisma.section.findUnique({
        where: { id: Number(id) },
        include: {
            _count: {
                select: { tests: true },
            },
        },
    });

    if (!section) {
        throw ApiError.notFound('Bölüm bulunamadı');
    }

    // İlişkili testleri de sil (testler de ilişkili soruları silecek - cascade)
    if (section._count.tests > 0) {
        await prisma.test.deleteMany({
            where: { sectionId: Number(id) },
        });
    }

    // Bölümü sil
    await prisma.section.delete({
        where: { id: Number(id) },
    });

    return res.status(200).json({
        message: 'Bölüm ve ilişkili tüm testler başarıyla silindi',
    });
}); 