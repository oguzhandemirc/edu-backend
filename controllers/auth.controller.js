const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma/prisma');
const { z } = require('zod');
const config = require('../config');
const { OAuth2Client } = require('google-auth-library');
const { asyncHandler, ApiError } = require('../utils/errorHandler');

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