const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');

const prisma = new PrismaClient();

// Validation şemaları
const sectionSchema = z.object({
    title: z.string().min(2, 'Başlık en az 2 karakter olmalıdır'),
    description: z.string().min(5, 'Açıklama en az 5 karakter olmalıdır'),
});

// Tüm bölümleri getir
exports.getAllSections = async (req, res) => {
    try {
        const sections = await prisma.section.findMany({
            include: {
                tests: {
                    select: {
                        id: true,
                        title: true,
                        difficulty: true,
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
    } catch (error) {
        console.error('Bölümleri getirme hatası:', error);
        return res.status(500).json({ message: 'Sunucu hatası' });
    }
};

// Tek bir bölümü getir
exports.getSectionById = async (req, res) => {
    try {
        const { id } = req.params;

        const section = await prisma.section.findUnique({
            where: { id: Number(id) },
            include: {
                tests: {
                    select: {
                        id: true,
                        title: true,
                        difficulty: true,
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
            return res.status(404).json({ message: 'Bölüm bulunamadı' });
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
    } catch (error) {
        console.error('Bölüm getirme hatası:', error);
        return res.status(500).json({ message: 'Sunucu hatası' });
    }
};

// Yeni bölüm oluştur
exports.createSection = async (req, res) => {
    try {
        // Admin kontrolü middleware'de yapılacak

        // Validasyon
        const validData = sectionSchema.parse(req.body);

        const newSection = await prisma.section.create({
            data: {
                title: validData.title,
                description: validData.description,
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

        return res.status(201).json({
            message: 'Bölüm başarıyla oluşturuldu',
            section: newSection,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: 'Geçersiz veri', errors: error.errors });
        }
        console.error('Bölüm oluşturma hatası:', error);
        return res.status(500).json({ message: 'Sunucu hatası' });
    }
};

// Bölümü güncelle
exports.updateSection = async (req, res) => {
    try {
        // Admin kontrolü middleware'de yapılacak

        const { id } = req.params;

        // Bölüm var mı kontrol et
        const existingSection = await prisma.section.findUnique({
            where: { id: Number(id) },
        });

        if (!existingSection) {
            return res.status(404).json({ message: 'Bölüm bulunamadı' });
        }

        // Validasyon
        const validData = sectionSchema.parse(req.body);

        const updatedSection = await prisma.section.update({
            where: { id: Number(id) },
            data: {
                title: validData.title,
                description: validData.description,
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

        return res.status(200).json({
            message: 'Bölüm başarıyla güncellendi',
            section: updatedSection,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: 'Geçersiz veri', errors: error.errors });
        }
        console.error('Bölüm güncelleme hatası:', error);
        return res.status(500).json({ message: 'Sunucu hatası' });
    }
};

// Bölümü sil
exports.deleteSection = async (req, res) => {
    try {
        // Admin kontrolü middleware'de yapılacak

        const { id } = req.params;

        // Bölüm var mı kontrol et
        const existingSection = await prisma.section.findUnique({
            where: { id: Number(id) },
        });

        if (!existingSection) {
            return res.status(404).json({ message: 'Bölüm bulunamadı' });
        }

        // Bölümü sil (bağlı testler ve sorular cascade ile silinecek)
        await prisma.section.delete({
            where: { id: Number(id) },
        });

        return res.status(200).json({
            message: 'Bölüm ve bağlı tüm içerikler başarıyla silindi',
        });
    } catch (error) {
        console.error('Bölüm silme hatası:', error);
        return res.status(500).json({ message: 'Sunucu hatası' });
    }
}; 