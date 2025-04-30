const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');

const prisma = new PrismaClient();

// Validation şemaları
const testSchema = z.object({
    title: z.string().min(2, 'Başlık en az 2 karakter olmalıdır'),
    description: z.string().min(5, 'Açıklama en az 5 karakter olmalıdır'),
    difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']),
    duration: z.number().int().positive('Süre pozitif bir sayı olmalıdır').default(30),
    sectionId: z.number().int().positive('Bölüm ID pozitif bir sayı olmalıdır'),
});

// Zorluk seviyelerini getir
exports.getDifficultyLevels = async (req, res) => {
    try {
        const difficulties = [
            { value: 'BEGINNER', label: 'Başlangıç' },
            { value: 'INTERMEDIATE', label: 'Orta' },
            { value: 'ADVANCED', label: 'İleri' },
            { value: 'EXPERT', label: 'Uzman' }
        ];

        return res.status(200).json(difficulties);
    } catch (error) {
        console.error('Zorluk seviyeleri getirme hatası:', error);
        return res.status(500).json({ message: 'Sunucu hatası' });
    }
};

// Tüm testleri getir
exports.getAllTests = async (req, res) => {
    try {
        const tests = await prisma.test.findMany({
            include: {
                section: {
                    select: {
                        id: true,
                        title: true,
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
    } catch (error) {
        console.error('Testleri getirme hatası:', error);
        return res.status(500).json({ message: 'Sunucu hatası' });
    }
};

// Bölüme ait tüm testleri getir
exports.getTestsBySection = async (req, res) => {
    try {
        const { sectionId } = req.params;

        // Bölüm var mı kontrol et
        const section = await prisma.section.findUnique({
            where: { id: Number(sectionId) },
        });

        if (!section) {
            return res.status(404).json({ message: 'Bölüm bulunamadı' });
        }

        const tests = await prisma.test.findMany({
            where: { sectionId: Number(sectionId) },
            select: {
                id: true,
                title: true,
                description: true,
                difficulty: true,
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
    } catch (error) {
        console.error('Testleri getirme hatası:', error);
        return res.status(500).json({ message: 'Sunucu hatası' });
    }
};

// Tek bir testi getir
exports.getTestById = async (req, res) => {
    try {
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
            return res.status(404).json({ message: 'Test bulunamadı' });
        }

        // Soru sayısını doğrudan test objesine ekle
        const testWithQuestionCount = {
            ...test,
            questionCount: test.questions.length,
        };

        return res.status(200).json(testWithQuestionCount);
    } catch (error) {
        console.error('Test getirme hatası:', error);
        return res.status(500).json({ message: 'Sunucu hatası' });
    }
};

// Yeni test oluştur
exports.createTest = async (req, res) => {
    try {
        // Admin kontrolü middleware'de yapılacak

        // Validasyon
        const validData = testSchema.parse(req.body);

        // Bölüm var mı kontrol et
        const section = await prisma.section.findUnique({
            where: { id: Number(validData.sectionId) },
        });

        if (!section) {
            return res.status(404).json({ message: 'Bölüm bulunamadı' });
        }

        // Transaction ile test oluştur ve section'ı güncelle
        const result = await prisma.$transaction(async (prisma) => {
            // Test oluştur
            const newTest = await prisma.test.create({
                data: {
                    title: validData.title,
                    description: validData.description,
                    difficulty: validData.difficulty,
                    duration: validData.duration,
                    sectionId: validData.sectionId,
                    createdById: req.user.id,
                    updatedById: req.user.id,
                },
                include: {
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

            // Section'ı güncelle
            await prisma.section.update({
                where: { id: Number(validData.sectionId) },
                data: {
                    updatedById: req.user.id,
                },
            });

            return newTest;
        });

        return res.status(201).json({
            message: 'Test başarıyla oluşturuldu',
            test: result,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: 'Geçersiz veri', errors: error.errors });
        }
        console.error('Test oluşturma hatası:', error);
        return res.status(500).json({ message: 'Sunucu hatası' });
    }
};

// Testi güncelle
exports.updateTest = async (req, res) => {
    try {
        // Admin kontrolü middleware'de yapılacak

        const { id } = req.params;

        // Test var mı kontrol et
        const existingTest = await prisma.test.findUnique({
            where: { id: Number(id) },
        });

        if (!existingTest) {
            return res.status(404).json({ message: 'Test bulunamadı' });
        }

        // Validasyon
        const validData = testSchema.parse(req.body);

        // Bölüm var mı kontrol et
        const section = await prisma.section.findUnique({
            where: { id: Number(validData.sectionId) },
        });

        if (!section) {
            return res.status(404).json({ message: 'Bölüm bulunamadı' });
        }

        // Transaction ile test ve section güncelle
        const result = await prisma.$transaction(async (prisma) => {
            // Testi güncelle
            const updatedTest = await prisma.test.update({
                where: { id: Number(id) },
                data: {
                    title: validData.title,
                    description: validData.description,
                    difficulty: validData.difficulty,
                    duration: validData.duration,
                    sectionId: validData.sectionId,
                    updatedById: req.user.id,
                },
                include: {
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

            // Bölüm değiştiyse eski ve yeni bölümleri güncelle
            if (existingTest.sectionId !== validData.sectionId) {
                // Eski bölümü güncelle
                await prisma.section.update({
                    where: { id: existingTest.sectionId },
                    data: {
                        updatedById: req.user.id,
                    },
                });
            }

            // Yeni bölümü güncelle
            await prisma.section.update({
                where: { id: validData.sectionId },
                data: {
                    updatedById: req.user.id,
                },
            });

            return updatedTest;
        });

        return res.status(200).json({
            message: 'Test başarıyla güncellendi',
            test: result,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: 'Geçersiz veri', errors: error.errors });
        }
        console.error('Test güncelleme hatası:', error);
        return res.status(500).json({ message: 'Sunucu hatası' });
    }
};

// Testi sil
exports.deleteTest = async (req, res) => {
    try {
        // Admin kontrolü middleware'de yapılacak

        const { id } = req.params;

        // Test var mı kontrol et
        const existingTest = await prisma.test.findUnique({
            where: { id: Number(id) },
        });

        if (!existingTest) {
            return res.status(404).json({ message: 'Test bulunamadı' });
        }

        // Testi sil (bağlı sorular cascade ile silinecek)
        await prisma.test.delete({
            where: { id: Number(id) },
        });

        return res.status(200).json({
            message: 'Test ve bağlı tüm sorular başarıyla silindi',
        });
    } catch (error) {
        console.error('Test silme hatası:', error);
        return res.status(500).json({ message: 'Sunucu hatası' });
    }
}; 