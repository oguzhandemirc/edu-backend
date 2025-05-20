const prisma = require('../prisma/prisma');
const { z } = require('zod');
const { asyncHandler, ApiError } = require('../utils/errorHandler');

// Validation şemaları
const testSchema = z.object({
    title: z.string().min(2, 'Başlık en az 2 karakter olmalıdır'),
    description: z.string().min(5, 'Açıklama en az 5 karakter olmalıdır'),
    difficultyLevelId: z.number().int().positive('Zorluk seviyesi ID pozitif bir sayı olmalıdır'),
    duration: z.number().int().positive('Süre pozitif bir sayı olmalıdır').default(30),
    sectionId: z.number().int().positive('Bölüm ID pozitif bir sayı olmalıdır'),
});

// Tüm testleri getir
exports.getAllTests = asyncHandler(async (req, res) => {
    const tests = await prisma.test.findMany({
        include: {
            section: {
                select: {
                    id: true,
                    title: true,
                },
            },
            difficultyLevel: {
                select: {
                    id: true,
                    name: true,
                    value: true,
                },
            },
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
        orderBy: { createdAt: 'desc' },
    });

    // Soru sayısını doğrudan test objesine ekle
    const testsWithQuestionCount = tests.map(test => ({
        ...test,
        questionCount: test._count.questions,
    }));

    return res.status(200).json(testsWithQuestionCount);
});

// Bölüme ait tüm testleri getir
exports.getTestsBySection = asyncHandler(async (req, res) => {
    const { sectionId } = req.params;

    // Bölüm var mı kontrol et
    const section = await prisma.section.findUnique({
        where: { id: Number(sectionId) },
    });

    if (!section) {
        throw ApiError.notFound('Bölüm bulunamadı');
    }

    const tests = await prisma.test.findMany({
        where: { sectionId: Number(sectionId) },
        select: {
            id: true,
            title: true,
            description: true,
            difficultyLevel: {
                select: {
                    id: true,
                    name: true,
                    value: true,
                },
            },
            duration: true,
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
        orderBy: { createdAt: 'desc' },
    });

    // Soru sayısını doğrudan test objesine ekle
    const testsWithQuestionCount = tests.map(test => ({
        ...test,
        questionCount: test._count.questions,
    }));

    return res.status(200).json(testsWithQuestionCount);
});

// Tek bir testi getir
exports.getTestById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const test = await prisma.test.findUnique({
        where: { id: Number(id) },
        include: {
            section: {
                select: {
                    id: true,
                    title: true,
                },
            },
            difficultyLevel: {
                select: {
                    id: true,
                    name: true,
                    value: true,
                    description: true,
                },
            },
            questions: {
                include: {
                    options: true,
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

    if (!test) {
        throw ApiError.notFound('Test bulunamadı');
    }

    // Soru sayısını doğrudan test objesine ekle
    const testWithQuestionCount = {
        ...test,
        questionCount: test.questions.length,
    };

    return res.status(200).json(testWithQuestionCount);
});

// Test oluştur
exports.createTest = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const validData = testSchema.parse(req.body);

    // Bölüm var mı kontrol et
    const section = await prisma.section.findUnique({
        where: { id: validData.sectionId },
    });

    if (!section) {
        throw ApiError.notFound('Bölüm bulunamadı');
    }

    // Zorluk seviyesi var mı kontrol et
    const difficultyLevel = await prisma.difficultyLevel.findUnique({
        where: { id: validData.difficultyLevelId },
    });

    if (!difficultyLevel) {
        throw ApiError.notFound('Zorluk seviyesi bulunamadı');
    }

    // Yeni test oluştur
    const newTest = await prisma.test.create({
        data: {
            title: validData.title,
            description: validData.description,
            difficultyLevelId: validData.difficultyLevelId,
            duration: validData.duration,
            sectionId: validData.sectionId,
            createdById: userId,
        },
        include: {
            section: {
                select: {
                    title: true,
                },
            },
            difficultyLevel: {
                select: {
                    name: true,
                },
            },
        },
    });

    return res.status(201).json({
        message: 'Test başarıyla oluşturuldu',
        test: newTest,
    });
});

// Test güncelle
exports.updateTest = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const validData = testSchema.parse(req.body);

    // Test var mı kontrol et
    const test = await prisma.test.findUnique({
        where: { id: Number(id) },
    });

    if (!test) {
        throw ApiError.notFound('Test bulunamadı');
    }

    // Bölüm var mı kontrol et
    const section = await prisma.section.findUnique({
        where: { id: validData.sectionId },
    });

    if (!section) {
        throw ApiError.notFound('Bölüm bulunamadı');
    }

    // Zorluk seviyesi var mı kontrol et
    const difficultyLevel = await prisma.difficultyLevel.findUnique({
        where: { id: validData.difficultyLevelId },
    });

    if (!difficultyLevel) {
        throw ApiError.notFound('Zorluk seviyesi bulunamadı');
    }

    // Testi güncelle
    const updatedTest = await prisma.test.update({
        where: { id: Number(id) },
        data: {
            title: validData.title,
            description: validData.description,
            difficultyLevelId: validData.difficultyLevelId,
            duration: validData.duration,
            sectionId: validData.sectionId,
            updatedById: userId,
        },
        include: {
            section: {
                select: {
                    title: true,
                },
            },
            difficultyLevel: {
                select: {
                    name: true,
                },
            },
        },
    });

    return res.status(200).json({
        message: 'Test başarıyla güncellendi',
        test: updatedTest,
    });
});

// Test sil
exports.deleteTest = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Test var mı kontrol et
    const test = await prisma.test.findUnique({
        where: { id: Number(id) },
        include: {
            _count: {
                select: { questions: true },
            },
        },
    });

    if (!test) {
        throw ApiError.notFound('Test bulunamadı');
    }

    // İlişkili soruları da sil
    if (test._count.questions > 0) {
        await prisma.question.deleteMany({
            where: { testId: Number(id) },
        });
    }

    // Testi sil
    await prisma.test.delete({
        where: { id: Number(id) },
    });

    return res.status(200).json({
        message: 'Test ve ilişkili tüm içerikler başarıyla silindi',
    });
});

// Teste ait tüm soruları getir
exports.getQuestionsByTest = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Test var mı kontrol et
    const test = await prisma.test.findUnique({
        where: { id: Number(id) },
    });

    if (!test) {
        throw ApiError.notFound('Test bulunamadı');
    }

    const questions = await prisma.question.findMany({
        where: { testId: Number(id) },
        include: {
            options: true,
        },
        orderBy: { id: 'asc' },
    });

    return res.status(200).json(questions);
}); 