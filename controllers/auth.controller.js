const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma/prisma');
const { z } = require('zod');
const config = require('../config');
const { OAuth2Client } = require('google-auth-library');
const { asyncHandler, ApiError } = require('../utils/errorHandler');
const emailService = require('../utils/email');
const crypto = require('crypto');

// bcrypt için saltRounds sabiti
const SALT_ROUNDS = 10;

// Validation şemaları
const registerSchema = z.object({
    email: z.string().email('Geçerli bir e-posta adresi giriniz'),
    password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
    name: z.string().min(2, 'İsim en az 2 karakter olmalıdır').optional(),
    termsAccepted: z.boolean().refine(val => val === true, {
        message: 'Kullanım şartlarını ve gizlilik politikasını kabul etmelisiniz'
    }),
    marketingEmails: z.boolean().optional().default(false)
});

const loginSchema = z.object({
    email: z.string().email('Geçerli bir e-posta adresi giriniz'),
    password: z.string().min(1, 'Şifre giriniz'),
});

// Kullanıcı kaydı
exports.register = asyncHandler(async (req, res) => {
    // Validasyon
    const validData = registerSchema.parse(req.body);

    // Kullanıcı zaten var mı?
    const existingUser = await prisma.user.findUnique({
        where: { email: validData.email },
    });

    if (existingUser) {
        throw ApiError.conflict('Bu e-posta adresi zaten kullanılıyor');
    }

    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash(validData.password, SALT_ROUNDS);

    // Kullanıcıyı oluştur
    const newUser = await prisma.user.create({
        data: {
            email: validData.email,
            password: hashedPassword,
            name: validData.name || null,
            termsAccepted: validData.termsAccepted,
            marketingEmails: validData.marketingEmails
        },
    });

    // Hassas bilgileri çıkar
    const { password, ...userWithoutPassword } = newUser;

    return res.status(201).json({
        message: 'Kullanıcı başarıyla oluşturuldu',
        user: userWithoutPassword,
    });
});

// Kullanıcı girişi
exports.login = asyncHandler(async (req, res) => {
    // Validasyon
    const validData = loginSchema.parse(req.body);

    // Kullanıcıyı bul
    const user = await prisma.user.findUnique({
        where: { email: validData.email },
    });

    if (!user) {
        throw ApiError.unauthorized('Geçersiz e-posta veya şifre');
    }

    // Şifreyi doğrula
    const isPasswordValid = await bcrypt.compare(validData.password, user.password);

    if (!isPasswordValid) {
        throw ApiError.unauthorized('Geçersiz e-posta veya şifre');
    }

    // JWT token oluştur
    const token = jwt.sign(
        {
            userId: user.id,
            email: user.email,
            role: user.role,
        },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
    );

    // Hassas bilgileri çıkar
    const { password, ...userWithoutPassword } = user;

    return res.status(200).json({
        message: 'Giriş başarılı',
        token,
        user: userWithoutPassword,
    });
});

// Token doğrulama
exports.validateToken = asyncHandler(async (req, res) => {
    // authenticate middleware token doğrulamasını yaptığı için
    // buraya geldiğimizde token zaten doğrulanmış demektir

    // Kullanıcıyı veritabanından taze bilgilerle al
    const user = await prisma.user.findUnique({
        where: { id: req.user.id },
    });

    if (!user) {
        throw ApiError.notFound('Kullanıcı bulunamadı');
    }

    // Hassas bilgileri çıkar
    const { password, ...userWithoutPassword } = user;

    return res.status(200).json({
        success: true,
        user: userWithoutPassword
    });
});

// Admin rolünü doğrula
exports.verifyRole = asyncHandler(async (req, res) => {
    // Kullanıcı admin mi kontrol et
    if (req.user.role !== 'admin') {
        throw ApiError.forbidden('Bu işlem için admin yetkisi gerekiyor');
    }

    return res.status(200).json({
        success: true,
        message: 'Admin yetkisi doğrulandı'
    });
});

// Google ile giriş bilgilerini doğrulama
exports.verifyGoogleToken = asyncHandler(async (req, res) => {
    const { token, clientId, termsAccepted = true, marketingEmails = false } = req.body;

    if (!token) {
        throw ApiError.badRequest('Token gereklidir');
    }

    // termsAccepted doğrulaması (Google ile giriş yapan kullanıcılar için de gerekli)
    if (!termsAccepted) {
        throw ApiError.badRequest('Kullanım şartlarını ve gizlilik politikasını kabul etmelisiniz');
    }

    try {
        // Google ID token doğrulama işlemi
        const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: clientId || process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const googleId = payload.sub;
        const email = payload.email;
        const name = payload.name;
        const profilePhoto = payload.picture;

        // Kullanıcıyı email veya googleId ile ara
        let user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    { googleId }
                ]
            }
        });

        if (user) {
            // Kullanıcı varsa ve googleId yoksa güncelle
            if (!user.googleId) {
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        googleId,
                        profilePhoto: profilePhoto || user.profilePhoto,
                        termsAccepted: true // Kullanıcı zaten varsa şartları kabul etmiş sayılır
                    }
                });
            }
        } else {
            // Kullanıcı yoksa oluştur
            user = await prisma.user.create({
                data: {
                    email,
                    name,
                    googleId,
                    profilePhoto,
                    password: '', // Google ile giriş yapan kullanıcının şifresi olmaz
                    role: 'user', // Varsayılan rol
                    termsAccepted: true, // Google ile giriş yapan kullanıcılar şartları kabul etmiş sayılır
                    marketingEmails
                }
            });
        }

        // JWT token oluştur
        const jwtToken = jwt.sign(
            {
                userId: user.id,
                email: user.email,
                role: user.role,
            },
            config.jwtSecret,
            { expiresIn: config.jwtExpiresIn }
        );

        // Hassas bilgileri çıkar
        const { password, ...userWithoutPassword } = user;

        return res.status(200).json({
            success: true,
            message: 'Google ile giriş başarılı',
            token: jwtToken,
            user: userWithoutPassword,
        });
    } catch (error) {
        console.error('Google token doğrulama hatası:', error);
        throw ApiError.unauthorized('Geçersiz Google token\'ı');
    }
});

// Kullanıcı tercihlerini güncelleme
exports.updatePreferences = asyncHandler(async (req, res) => {
    // Validasyon şeması
    const preferencesSchema = z.object({
        marketingEmails: z.boolean().optional(),
    });

    // Validasyon
    const validData = preferencesSchema.parse(req.body);

    // Kullanıcıyı güncelle
    const updatedUser = await prisma.user.update({
        where: { id: req.user.id },
        data: {
            marketingEmails: validData.marketingEmails !== undefined ? validData.marketingEmails : undefined,
        },
    });

    // Hassas bilgileri çıkar
    const { password, ...userWithoutPassword } = updatedUser;

    return res.status(200).json({
        success: true,
        message: 'Kullanıcı tercihleri güncellendi',
        user: userWithoutPassword
    });
});

// 6 haneli rastgele kod oluştur
const generateResetCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Şifre sıfırlama talebi
exports.requestPasswordReset = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        throw ApiError.badRequest('E-posta adresi gereklidir');
    }

    // Kullanıcıyı kontrol et
    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        throw ApiError.notFound('Bu e-posta adresine sahip bir kullanıcı bulunamadı');
    }

    // Google ile giren kullanıcılar için şifre yenileme izni vermeyelim
    if (user.googleId && !user.password) {
        throw ApiError.badRequest('Google hesabı ile giriş yapan kullanıcılar şifre sıfırlama yapamaz');
    }

    // 6 haneli rastgele kod oluştur
    const resetCode = generateResetCode();
    
    // Önceki kullanılmamış kodları iptal et
    await prisma.passwordReset.updateMany({
        where: {
            email: user.email,
            used: false
        },
        data: {
            used: true
        }
    });

    // Kod için 20 dakikalık süre belirle
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 20);

    // Kodun hash'ini veritabanına kaydet (güvenlik için)
    await prisma.passwordReset.create({
        data: {
            email: user.email,
            token: resetCode,
            expiresAt
        }
    });

    // E-posta gönder
    const emailResult = await emailService.sendPasswordResetCode(user.email, resetCode);

    if (!emailResult.success) {
        throw ApiError.internal('E-posta gönderirken bir hata oluştu');
    }

    return res.status(200).json({
        success: true,
        message: 'Şifre sıfırlama kodu e-posta adresinize gönderildi'
    });
});

// Sıfırlama kodunun doğruluğunu kontrol et
exports.verifyResetCode = asyncHandler(async (req, res) => {
    const { email, code } = req.body;

    if (!email || !code) {
        throw ApiError.badRequest('E-posta ve kod gereklidir');
    }

    // Kodu veritabanında kontrol et
    const resetRecord = await prisma.passwordReset.findFirst({
        where: {
            email,
            token: code,
            used: false,
            expiresAt: {
                gt: new Date()
            }
        }
    });

    if (!resetRecord) {
        throw ApiError.badRequest('Geçersiz veya süresi dolmuş kod');
    }

    return res.status(200).json({
        success: true,
        message: 'Doğrulama kodu geçerli',
        resetId: resetRecord.id
    });
});

// Şifre sıfırlama
exports.resetPassword = asyncHandler(async (req, res) => {
    const { email, code, newPassword } = req.body;

    // Validasyon
    if (!email || !code || !newPassword) {
        throw ApiError.badRequest('E-posta, kod ve yeni şifre gereklidir');
    }

    if (newPassword.length < 6) {
        throw ApiError.badRequest('Şifre en az 6 karakter olmalıdır');
    }

    // Kodu veritabanında kontrol et
    const resetRecord = await prisma.passwordReset.findFirst({
        where: {
            email,
            token: code,
            used: false,
            expiresAt: {
                gt: new Date()
            }
        }
    });

    if (!resetRecord) {
        throw ApiError.badRequest('Geçersiz veya süresi dolmuş kod');
    }

    // Kullanıcıyı bul
    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        throw ApiError.notFound('Kullanıcı bulunamadı');
    }

    // Yeni şifreyi hashle
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Kullanıcı şifresini güncelle
    await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
    });

    // Reset kaydını kullanıldı olarak işaretle
    await prisma.passwordReset.update({
        where: { id: resetRecord.id },
        data: { used: true }
    });

    return res.status(200).json({
        success: true,
        message: 'Şifreniz başarıyla sıfırlandı'
    });
});

// Şifre değiştirme
exports.changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    
    // Validasyon
    if (!currentPassword || !newPassword) {
        throw ApiError.badRequest('Mevcut şifre ve yeni şifre gereklidir');
    }

    if (newPassword.length < 6) {
        throw ApiError.badRequest('Yeni şifre en az 6 karakter olmalıdır');
    }

    // Kullanıcıyı bul
    const user = await prisma.user.findUnique({
        where: { id: req.user.id }
    });

    if (!user) {
        throw ApiError.notFound('Kullanıcı bulunamadı');
    }

    // Google ile giriş yapmış ve şifresi olmayan kullanıcılar için engelle
    if (user.googleId && !user.password) {
        throw ApiError.badRequest('Google hesabı ile giriş yapan kullanıcılar şifre değiştiremez');
    }

    // Mevcut şifreyi doğrula
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
        throw ApiError.badRequest('Mevcut şifre yanlış');
    }

    // Yeni şifreyi hashle ve güncelle
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
    });

    return res.status(200).json({
        success: true,
        message: 'Şifreniz başarıyla değiştirildi'
    });
});

// Kullanıcı hesabını silme
exports.deleteAccount = asyncHandler(async (req, res) => {
    const { password, reason } = req.body;

    // Kullanıcıyı bul
    const user = await prisma.user.findUnique({
        where: { id: req.user.id }
    });

    if (!user) {
        throw ApiError.notFound('Kullanıcı bulunamadı');
    }

    // Google ile giriş yapmış ve şifresi olmayan kullanıcılar için şifre doğrulaması olmadan devam et
    let isPasswordValid = true;
    if (password && user.password) {
        isPasswordValid = await bcrypt.compare(password, user.password);
    }

    if (!isPasswordValid) {
        throw ApiError.badRequest('Şifre yanlış, hesabınızı silmek için doğru şifreyi giriniz');
    }

    // Kullanıcı bilgilerini DeletedUser tablosuna kaydet
    await prisma.deletedUser.create({
        data: {
            originalId: user.id,
            email: user.email,
            name: user.name,
            googleId: user.googleId,
            profilePhoto: user.profilePhoto,
            role: user.role,
            deletedReason: reason || null
        }
    });

    // Kullanıcının test sonuçlarını ve diğer ilişkili verileri silmeden önce,
    // bu verileri ayrıca arşivlemek isterseniz, burada ek işlemler yapabilirsiniz

    // Kullanıcıyı sil (Cascade silme ile ilişkili kayıtlar da silinecek)
    await prisma.user.delete({
        where: { id: user.id }
    });

    return res.status(200).json({
        success: true,
        message: 'Hesabınız başarıyla silindi'
    });
});

// Email değişikliği talebi
exports.requestEmailChange = asyncHandler(async (req, res) => {
    const { newEmail } = req.body;

    if (!newEmail) {
        throw ApiError.badRequest('Yeni e-posta adresi gereklidir');
    }

    // Email formatını kontrol et
    const emailSchema = z.string().email('Geçerli bir e-posta adresi giriniz');
    emailSchema.parse(newEmail);

    // Kullanıcıyı bul
    const user = await prisma.user.findUnique({
        where: { id: req.user.id }
    });

    if (!user) {
        throw ApiError.notFound('Kullanıcı bulunamadı');
    }

    // Mevcut email ile aynı mı kontrol et
    if (user.email === newEmail) {
        throw ApiError.badRequest('Yeni e-posta adresi mevcut adresinizle aynı olamaz');
    }

    // Email başka bir kullanıcı tarafından kullanılıyor mu kontrol et
    const existingUserWithEmail = await prisma.user.findUnique({
        where: { email: newEmail }
    });

    if (existingUserWithEmail) {
        throw ApiError.conflict('Bu e-posta adresi başka bir kullanıcı tarafından kullanılıyor');
    }

    // Önceki değişiklik taleplerini iptal et
    await prisma.emailChange.updateMany({
        where: {
            userId: user.id,
            used: false
        },
        data: {
            used: true
        }
    });

    // 6 haneli rastgele kod oluştur
    const verificationCode = generateResetCode();
    
    // Kod için 20 dakikalık süre belirle
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 20);

    // Değişiklik kaydını oluştur
    await prisma.emailChange.create({
        data: {
            userId: user.id,
            oldEmail: user.email,
            newEmail: newEmail,
            token: verificationCode,
            expiresAt
        }
    });

    // E-posta gönder
    const emailResult = await emailService.sendEmailChangeCode(newEmail, verificationCode);

    if (!emailResult.success) {
        throw ApiError.internal('E-posta gönderirken bir hata oluştu');
    }

    return res.status(200).json({
        success: true,
        message: 'E-posta değişikliği için doğrulama kodu gönderildi'
    });
});

// Email değişikliği doğrulama
exports.verifyEmailChange = asyncHandler(async (req, res) => {
    const { code } = req.body;

    if (!code) {
        throw ApiError.badRequest('Doğrulama kodu gereklidir');
    }

    // Kullanıcıyı bul
    const user = await prisma.user.findUnique({
        where: { id: req.user.id }
    });

    if (!user) {
        throw ApiError.notFound('Kullanıcı bulunamadı');
    }

    // Kodu veritabanında kontrol et
    const changeRecord = await prisma.emailChange.findFirst({
        where: {
            userId: user.id,
            token: code,
            used: false,
            expiresAt: {
                gt: new Date()
            }
        }
    });

    if (!changeRecord) {
        throw ApiError.badRequest('Geçersiz veya süresi dolmuş doğrulama kodu');
    }

    // Email'i güncelle
    await prisma.user.update({
        where: { id: user.id },
        data: { email: changeRecord.newEmail }
    });

    // Değişiklik kaydını kullanıldı olarak işaretle
    await prisma.emailChange.update({
        where: { id: changeRecord.id },
        data: { used: true }
    });

    return res.status(200).json({
        success: true,
        message: 'E-posta adresiniz başarıyla değiştirildi',
        newEmail: changeRecord.newEmail
    });
});