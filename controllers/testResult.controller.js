const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');

const prisma = new PrismaClient();

// Kullanıcı başına her test için maksimum sonuç sayısı
const MAX_RESULTS_PER_TEST = 5;

// Belirli bir test sonucunun detaylarını getirme (cevaplar ve açıklamalarla birlikte)
exports.getTestResultDetails = async (req, res) => {
    try {
        const resultId = parseInt(req.params.resultId);

        if (isNaN(resultId)) {
            return res.status(400).json({ message: 'Geçersiz test sonucu ID' });
        }

        // Test sonucunu detaylı olarak getir
        const testResult = await prisma.testResult.findUnique({
            where: { id: resultId },
            include: {
                test: {
                    include: {
                        section: true
                    }
                },
                userAnswers: {
                    include: {
                        question: {
                            include: {
                                options: true
                            }
                        },
                        selectedOption: true
                    }
                }
            }
        });

        if (!testResult) {
            return res.status(404).json({ message: 'Test sonucu bulunamadı' });
        }

        // Kullanıcı kendisine ait olmayan sonuçları görüntüleyemez
        if (testResult.userId !== req.user.id) {
            return res.status(403).json({ message: 'Bu sonucu görüntüleme yetkiniz yok' });
        }

        // Sonuç dönüşünü hazırla - açıklamalar ve doğru cevaplar dahil
        const result = {
            testResult: {
                id: testResult.id,
                testId: testResult.testId,
                testTitle: testResult.test.title,
                sectionTitle: testResult.test.section.title,
                score: testResult.score,
                correctCount: testResult.correctCount,
                wrongCount: testResult.wrongCount,
                emptyCount: testResult.emptyCount,
                totalDuration: testResult.totalDuration,
                completedAt: testResult.createdAt,
            },
            answers: testResult.userAnswers.map(answer => {
                const question = answer.question;
                const correctOption = question.options.find(o => o.isCorrect);

                return {
                    questionId: question.id,
                    content: question.content,
                    explanation: question.explanation,
                    selectedOptionId: answer.selectedOptionId,
                    isCorrect: answer.isCorrect,
                    correctOptionId: correctOption ? correctOption.id : null,
                    options: question.options.map(option => ({
                        id: option.id,
                        content: option.content,
                        isCorrect: option.isCorrect
                    }))
                };
            })
        };

        return res.status(200).json(result);
    } catch (error) {
        console.error('Test sonucu detayları getirme hatası:', error);
        return res.status(500).json({ message: 'Sunucu hatası' });
    }
};

// Test sorularını görüntüleme (cevaplar olmadan)
exports.getTestQuestions = async (req, res) => {
    try {
        const testId = parseInt(req.params.testId);

        if (isNaN(testId)) {
            return res.status(400).json({ message: 'Geçersiz test ID' });
        }

        // Testi ve sorularını getir (doğru cevapları ve açıklamaları gösterme)
        const test = await prisma.test.findUnique({
            where: { id: testId },
            include: {
                questions: {
                    select: {
                        id: true,
                        content: true,
                        // explanation dahil edilmiyor
                        options: {
                            select: {
                                id: true,
                                content: true,
                                // isCorrect bilgisi dahil edilmiyor
                            }
                        }
                    }
                },
                section: true
            }
        });

        if (!test) {
            return res.status(404).json({ message: 'Test bulunamadı' });
        }

        return res.status(200).json({
            test
        });
    } catch (error) {
        console.error('Test sorularını getirme hatası:', error);
        return res.status(500).json({ message: 'Sunucu hatası' });
    }
};

// Test sonuçlarını kaydetme ve değerlendirme
exports.submitTestResults = async (req, res) => {
    try {
        // Validasyon şeması
        const submitTestSchema = z.object({
            testId: z.number().int().positive('Test ID geçerli olmalıdır'),
            totalDuration: z.number().int().nonnegative('Süre geçerli olmalıdır'),
            answers: z.array(z.object({
                questionId: z.number().int().positive('Soru ID geçerli olmalıdır'),
                selectedOptionId: z.number().int().nonnegative('Seçenek ID geçerli olmalıdır').optional(),
            }))
        });

        // Validasyon
        const validData = submitTestSchema.parse(req.body);

        // Testi bul
        const test = await prisma.test.findUnique({
            where: { id: validData.testId },
            include: {
                questions: {
                    include: {
                        options: true
                    }
                }
            }
        });

        if (!test) {
            return res.status(404).json({ message: 'Test bulunamadı' });
        }

        // Sonuçları hesapla
        let correctCount = 0;
        let wrongCount = 0;
        let emptyCount = 0;
        const userAnswers = [];

        for (const answer of validData.answers) {
            const question = test.questions.find(q => q.id === answer.questionId);

            if (!question) {
                continue; // Soru bulunamadı, sonraki soruya geç
            }

            // Cevap verilmiş mi? selectedOptionId 0 ise veya yoksa boş olarak kabul et
            if (answer.selectedOptionId === 0 || answer.selectedOptionId === undefined) {
                emptyCount++;
                userAnswers.push({
                    questionId: answer.questionId,
                    isCorrect: false
                });
                continue;
            }

            // Doğru cevabı bul
            const correctOption = question.options.find(o => o.isCorrect);
            const isCorrect = correctOption && correctOption.id === answer.selectedOptionId;

            if (isCorrect) {
                correctCount++;
            } else {
                wrongCount++;
            }

            userAnswers.push({
                questionId: answer.questionId,
                selectedOptionId: answer.selectedOptionId,
                isCorrect
            });
        }

        // Toplam soru sayısı
        const totalQuestions = test.questions.length;

        // Puanı hesapla (doğru cevap sayısı / toplam soru sayısı) * 100
        const score = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

        // Kullanıcının bu test için sonuçlarını say
        const resultCount = await prisma.testResult.count({
            where: {
                userId: req.user.id,
                testId: validData.testId
            }
        });

        // Eğer maksimum sayıya ulaşıldıysa, en eski sonuçları sil
        if (resultCount >= MAX_RESULTS_PER_TEST) {
            const deleteCount = resultCount - MAX_RESULTS_PER_TEST + 1; // Yeni eklenecek sonuç için +1

            // Silinecek en eski sonuçları bul
            const oldResults = await prisma.testResult.findMany({
                where: {
                    userId: req.user.id,
                    testId: validData.testId
                },
                orderBy: {
                    createdAt: 'asc'
                },
                take: deleteCount,
                select: {
                    id: true
                }
            });

            // Eski sonuçları sil
            for (const result of oldResults) {
                await prisma.testResult.delete({
                    where: { id: result.id }
                });
            }

            console.log(`Kullanıcı ID: ${req.user.id}, Test ID: ${validData.testId} için ${deleteCount} eski sonuç silindi.`);
        }

        // Test sonucunu oluştur
        const testResult = await prisma.testResult.create({
            data: {
                userId: req.user.id,
                testId: validData.testId,
                score,
                correctCount,
                wrongCount,
                emptyCount,
                totalDuration: validData.totalDuration,
                userAnswers: {
                    create: userAnswers
                }
            },
            include: {
                test: true,
                userAnswers: {
                    include: {
                        question: {
                            include: {
                                options: true
                            }
                        }
                    }
                }
            }
        });

        // Sonuç dönüşünü hazırla - açıklamalar dahil edilmiş şekilde
        const result = {
            testResult: {
                id: testResult.id,
                testId: testResult.testId,
                score: testResult.score,
                correctCount: testResult.correctCount,
                wrongCount: testResult.wrongCount,
                emptyCount: testResult.emptyCount,
                totalDuration: testResult.totalDuration,
                createdAt: testResult.createdAt,
            },
            answers: testResult.userAnswers.map(answer => {
                const question = answer.question;
                const correctOption = question.options.find(o => o.isCorrect);

                return {
                    questionId: question.id,
                    content: question.content,
                    explanation: question.explanation, // Açıklama dahil edildi
                    selectedOptionId: answer.selectedOptionId,
                    isCorrect: answer.isCorrect,
                    correctOptionId: correctOption ? correctOption.id : null,
                    options: question.options.map(option => ({
                        id: option.id,
                        content: option.content,
                        isCorrect: option.isCorrect
                    }))
                };
            })
        };

        return res.status(201).json({
            message: 'Test sonuçları başarıyla kaydedildi',
            result
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: 'Geçersiz giriş verileri', errors: error.errors });
        }
        console.error('Test sonuçları kaydetme hatası:', error);
        return res.status(500).json({ message: 'Sunucu hatası' });
    }
};

// Kullanıcının tüm test sonuçlarını görüntüleme
exports.getUserTestResults = async (req, res) => {
    try {
        // Kullanıcıya ait tüm test sonuçlarını getir
        const testResults = await prisma.testResult.findMany({
            where: {
                userId: req.user.id
            },
            include: {
                test: {
                    include: {
                        section: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Test sonuçlarını daha okunabilir bir formatta hazırla
        const formattedResults = testResults.map(result => ({
            id: result.id,
            testId: result.testId,
            testTitle: result.test.title,
            sectionTitle: result.test.section.title,
            score: result.score,
            correctCount: result.correctCount,
            wrongCount: result.wrongCount,
            emptyCount: result.emptyCount,
            totalDuration: result.totalDuration,
            completedAt: result.createdAt
        }));

        return res.status(200).json({
            count: testResults.length,
            testResults: formattedResults
        });
    } catch (error) {
        console.error('Test sonuçlarını getirme hatası:', error);
        return res.status(500).json({ message: 'Sunucu hatası' });
    }
};

// Belirli bir teste ait kullanıcı sonuçlarını görüntüleme
exports.getUserTestResultsByTestId = async (req, res) => {
    try {
        const testId = parseInt(req.params.testId);

        if (isNaN(testId)) {
            return res.status(400).json({ message: 'Geçersiz test ID' });
        }

        // Test varlığını kontrol et
        const test = await prisma.test.findUnique({
            where: { id: testId },
            include: { section: true }
        });

        if (!test) {
            return res.status(404).json({ message: 'Test bulunamadı' });
        }

        // Kullanıcının bu teste ait sonuçlarını getir
        const testResults = await prisma.testResult.findMany({
            where: {
                userId: req.user.id,
                testId: testId
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // İstatistiksel bilgileri hesapla
        let bestScore = 0;
        let averageScore = 0;
        let totalAttempts = testResults.length;

        if (totalAttempts > 0) {
            // En yüksek skoru bul
            bestScore = Math.max(...testResults.map(result => result.score));

            // Ortalama skoru hesapla
            const totalScore = testResults.reduce((sum, result) => sum + result.score, 0);
            averageScore = parseFloat((totalScore / totalAttempts).toFixed(2));
        }

        // Formatlanmış sonuçları hazırla
        const formattedResults = testResults.map(result => ({
            id: result.id,
            score: result.score,
            correctCount: result.correctCount,
            wrongCount: result.wrongCount,
            emptyCount: result.emptyCount,
            totalDuration: result.totalDuration,
            completedAt: result.createdAt
        }));

        return res.status(200).json({
            test: {
                id: test.id,
                title: test.title,
                sectionTitle: test.section.title
            },
            statistics: {
                totalAttempts,
                bestScore,
                averageScore
            },
            attempts: formattedResults
        });
    } catch (error) {
        console.error('Test sonuçlarını getirme hatası:', error);
        return res.status(500).json({ message: 'Sunucu hatası' });
    }
};

// Belirli bir teste ait kullanıcının en son test sonucunu görüntüleme
exports.getLatestUserTestResult = async (req, res) => {
    try {
        const testId = parseInt(req.params.testId);

        if (isNaN(testId)) {
            return res.status(400).json({ message: 'Geçersiz test ID' });
        }

        // Test varlığını kontrol et
        const test = await prisma.test.findUnique({
            where: { id: testId },
            include: { section: true }
        });

        if (!test) {
            return res.status(404).json({ message: 'Test bulunamadı' });
        }

        // Kullanıcının bu teste ait en son sonucunu getir
        const testResult = await prisma.testResult.findFirst({
            where: {
                userId: req.user.id,
                testId: testId
            },
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                userAnswers: {
                    include: {
                        question: {
                            include: {
                                options: true
                            }
                        },
                        selectedOption: true
                    }
                }
            }
        });

        if (!testResult) {
            return res.status(404).json({ message: 'Bu teste ait sonuç bulunamadı' });
        }

        // Sonuç dönüşünü hazırla - açıklamalar ve doğru cevaplar dahil
        const result = {
            testResult: {
                id: testResult.id,
                testId: testResult.testId,
                testTitle: test.title,
                sectionTitle: test.section.title,
                score: testResult.score,
                correctCount: testResult.correctCount,
                wrongCount: testResult.wrongCount,
                emptyCount: testResult.emptyCount,
                totalDuration: testResult.totalDuration,
                completedAt: testResult.createdAt,
            },
            answers: testResult.userAnswers.map(answer => {
                const question = answer.question;
                const correctOption = question.options.find(o => o.isCorrect);

                return {
                    questionId: question.id,
                    content: question.content,
                    explanation: question.explanation,
                    selectedOptionId: answer.selectedOptionId,
                    isCorrect: answer.isCorrect,
                    correctOptionId: correctOption ? correctOption.id : null,
                    options: question.options.map(option => ({
                        id: option.id,
                        content: option.content,
                        isCorrect: option.isCorrect
                    }))
                };
            })
        };

        return res.status(200).json(result);
    } catch (error) {
        console.error('En son test sonucunu getirme hatası:', error);
        return res.status(500).json({ message: 'Sunucu hatası' });
    }
}; 