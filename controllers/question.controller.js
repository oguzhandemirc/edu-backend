const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');

const prisma = new PrismaClient();

// Validation şemaları
const optionSchema = z.object({
    content: z.string().min(1, 'Şık içeriği boş olamaz'),
    isCorrect: z.boolean(),
});

const questionSchema = z.object({
    content: z.string().min(5, 'Soru içeriği en az 5 karakter olmalıdır'),
    explanation: z.string().optional(),
    testId: z.number().int().positive('Test ID pozitif bir sayı olmalıdır'),
    options: z.array(optionSchema).min(2, 'En az 2 şık olmalıdır')
        .refine(options => options.some(opt => opt.isCorrect), {
            message: 'En az bir doğru şık olmalıdır'
        })
});

// Teste ait tüm soruları getir
exports.getQuestionsByTest = async (req, res) => {
    try {
        const { testId } = req.params;

        // Test var mı kontrol et
        const test = await prisma.test.findUnique({
            where: { id: Number(testId) },
        });

        if (!test) {
            return res.status(404).json({ message: 'Test bulunamadı' });
        }

        const questions = await prisma.question.findMany({
            where: { testId: Number(testId) },
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
            orderBy: { createdAt: 'asc' },
        });

        return res.status(200).json(questions);
    } catch (error) {
        console.error('Soruları getirme hatası:', error);
        return res.status(500).json({ message: 'Sunucu hatası' });
    }
};

// Teste ait soruları kullanıcılar için getir (doğru cevaplar olmadan)
exports.getQuestionsByTestForUsers = async (req, res) => {
    try {
        const { testId } = req.params;

        // Test var mı kontrol et
        const test = await prisma.test.findUnique({
            where: { id: Number(testId) },
        });

        if (!test) {
            return res.status(404).json({ message: 'Test bulunamadı' });
        }

        const questions = await prisma.question.findMany({
            where: { testId: Number(testId) },
            select: {
                id: true,
                content: true,
                testId: true,
                createdAt: true,
                options: {
                    select: {
                        id: true,
                        content: true,
                        // isCorrect dahil değil
                    }
                }
            },
            orderBy: { createdAt: 'asc' },
        });

        return res.status(200).json(questions);
    } catch (error) {
        console.error('Soruları getirme hatası:', error);
        return res.status(500).json({ message: 'Sunucu hatası' });
    }
};

// Tek bir soruyu getir
exports.getQuestionById = async (req, res) => {
    try {
        const { id } = req.params;

        const question = await prisma.question.findUnique({
            where: { id: Number(id) },
            include: {
                test: {
                    select: {
                        id: true,
                        title: true,
                        section: {
                            select: {
                                id: true,
                                title: true,
                            },
                        },
                    },
                },
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
        });

        if (!question) {
            return res.status(404).json({ message: 'Soru bulunamadı' });
        }

        return res.status(200).json(question);
    } catch (error) {
        console.error('Soru getirme hatası:', error);
        return res.status(500).json({ message: 'Sunucu hatası' });
    }
};

// Yeni soru oluştur
exports.createQuestion = async (req, res) => {
    try {
        // Admin kontrolü middleware'de yapılacak

        // Validasyon
        const validData = questionSchema.parse(req.body);

        // Test var mı kontrol et
        const test = await prisma.test.findUnique({
            where: { id: Number(validData.testId) },
        });

        if (!test) {
            return res.status(404).json({ message: 'Test bulunamadı' });
        }

        // Transaction ile soru ve şıkları birlikte oluştur, testi güncelle
        const questionWithOptions = await prisma.$transaction(async (prisma) => {
            // Soru oluştur
            const newQuestion = await prisma.question.create({
                data: {
                    content: validData.content,
                    explanation: validData.explanation,
                    testId: validData.testId,
                    createdById: req.user.id,
                    updatedById: req.user.id,
                },
            });

            // Şıkları ekle
            const optionsData = validData.options.map(option => ({
                content: option.content,
                isCorrect: option.isCorrect,
                questionId: newQuestion.id,
            }));

            await prisma.option.createMany({
                data: optionsData,
            });

            // Testi güncelle
            await prisma.test.update({
                where: { id: Number(validData.testId) },
                data: {
                    updatedById: req.user.id,
                },
            });

            // Şıklarla birlikte soruyu getir
            return prisma.question.findUnique({
                where: { id: newQuestion.id },
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
            });
        });

        return res.status(201).json({
            message: 'Soru başarıyla oluşturuldu',
            question: questionWithOptions,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: 'Geçersiz veri', errors: error.errors });
        }
        console.error('Soru oluşturma hatası:', error);
        return res.status(500).json({ message: 'Sunucu hatası' });
    }
};

// Soruyu güncelle
exports.updateQuestion = async (req, res) => {
    try {
        // Admin kontrolü middleware'de yapılacak

        const { id } = req.params;

        // Soru var mı kontrol et
        const existingQuestion = await prisma.question.findUnique({
            where: { id: Number(id) },
            include: {
                options: true,
                test: true,
            },
        });

        if (!existingQuestion) {
            return res.status(404).json({ message: 'Soru bulunamadı' });
        }

        // Validasyon
        const validData = questionSchema.parse(req.body);

        // Test var mı kontrol et
        const test = await prisma.test.findUnique({
            where: { id: Number(validData.testId) },
            include: {
                section: true,
            },
        });

        if (!test) {
            return res.status(404).json({ message: 'Test bulunamadı' });
        }

        // Prisma transaction kullanarak soruyu, şıkları ve ilgili kayıtları güncelle
        const updatedQuestion = await prisma.$transaction(async (prisma) => {
            // Soruyu güncelle
            const question = await prisma.question.update({
                where: { id: Number(id) },
                data: {
                    content: validData.content,
                    explanation: validData.explanation,
                    testId: validData.testId,
                    updatedById: req.user.id,
                },
            });

            // Mevcut şıkları sil
            await prisma.option.deleteMany({
                where: { questionId: Number(id) },
            });

            // Yeni şıkları ekle
            const optionsData = validData.options.map(option => ({
                content: option.content,
                isCorrect: option.isCorrect,
                questionId: Number(id),
            }));

            await prisma.option.createMany({
                data: optionsData,
            });

            // Test değiştiyse eski ve yeni testleri güncelle
            if (existingQuestion.testId !== validData.testId) {
                // Eski testi güncelle
                await prisma.test.update({
                    where: { id: existingQuestion.testId },
                    data: {
                        updatedById: req.user.id,
                    },
                });

                // Eski testin bölümünü güncelle
                await prisma.section.update({
                    where: { id: existingQuestion.test.sectionId },
                    data: {
                        updatedById: req.user.id,
                    },
                });
            }

            // Yeni testi güncelle
            await prisma.test.update({
                where: { id: validData.testId },
                data: {
                    updatedById: req.user.id,
                },
            });

            // Yeni testin bölümünü güncelle
            await prisma.section.update({
                where: { id: test.sectionId },
                data: {
                    updatedById: req.user.id,
                },
            });

            // Güncellenmiş soruyu şıklarla birlikte getir
            return prisma.question.findUnique({
                where: { id: Number(id) },
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
            });
        });

        return res.status(200).json({
            message: 'Soru başarıyla güncellendi',
            question: updatedQuestion,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: 'Geçersiz veri', errors: error.errors });
        }
        console.error('Soru güncelleme hatası:', error);
        return res.status(500).json({ message: 'Sunucu hatası' });
    }
};

// Soruyu sil
exports.deleteQuestion = async (req, res) => {
    try {
        // Admin kontrolü middleware'de yapılacak

        const { id } = req.params;

        // Soru var mı kontrol et
        const existingQuestion = await prisma.question.findUnique({
            where: { id: Number(id) },
        });

        if (!existingQuestion) {
            return res.status(404).json({ message: 'Soru bulunamadı' });
        }

        // Soruyu sil (bağlı şıklar cascade ile silinecek)
        await prisma.question.delete({
            where: { id: Number(id) },
        });

        return res.status(200).json({
            message: 'Soru başarıyla silindi',
        });
    } catch (error) {
        console.error('Soru silme hatası:', error);
        return res.status(500).json({ message: 'Sunucu hatası' });
    }
}; 