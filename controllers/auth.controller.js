const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');

const prisma = new PrismaClient();

// Validation şemaları
const registerSchema = z.object({
    email: z.string().email('Geçerli bir e-posta adresi giriniz'),
    password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
    name: z.string().min(2, 'İsim en az 2 karakter olmalıdır').optional(),
});

const loginSchema = z.object({
    email: z.string().email('Geçerli bir e-posta adresi giriniz'),
    password: z.string().min(1, 'Şifre giriniz'),
});

// Kullanıcı kaydı
exports.register = async (req, res) => {
    try {
        // Validasyon
        const validData = registerSchema.parse(req.body);

        // Kullanıcı zaten var mı?
        const existingUser = await prisma.user.findUnique({
            where: { email: validData.email },
        });

        if (existingUser) {
            return res.status(409).json({ message: 'Bu e-posta adresi zaten kullanılıyor' });
        }

        // Şifreyi hashle
        const hashedPassword = await bcrypt.hash(validData.password, 10);

        // Kullanıcıyı oluştur
        const newUser = await prisma.user.create({
            data: {
                email: validData.email,
                password: hashedPassword,
                name: validData.name || null,
            },
        });

        // Hassas bilgileri çıkar
        const { password, ...userWithoutPassword } = newUser;

        return res.status(201).json({
            message: 'Kullanıcı başarıyla oluşturuldu',
            user: userWithoutPassword,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: 'Geçersiz giriş verileri', errors: error.errors });
        }
        console.error('Kayıt hatası:', error);
        return res.status(500).json({ message: 'Sunucu hatası' });
    }
};

// Kullanıcı girişi
exports.login = async (req, res) => {
    try {
        // Validasyon
        const validData = loginSchema.parse(req.body);

        // Kullanıcıyı bul
        const user = await prisma.user.findUnique({
            where: { email: validData.email },
        });

        if (!user) {
            return res.status(401).json({ message: 'Geçersiz e-posta veya şifre' });
        }

        // Şifreyi doğrula
        const isPasswordValid = await bcrypt.compare(validData.password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Geçersiz e-posta veya şifre' });
        }

        // JWT token oluştur
        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email,
                role: user.role,
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        // Hassas bilgileri çıkar
        const { password, ...userWithoutPassword } = user;

        return res.status(200).json({
            message: 'Giriş başarılı',
            token,
            user: userWithoutPassword,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: 'Geçersiz giriş verileri', errors: error.errors });
        }
        console.error('Giriş hatası:', error);
        return res.status(500).json({ message: 'Sunucu hatası' });
    }
};

// Token doğrulama
exports.validateToken = async (req, res) => {
    try {
        // authenticate middleware token doğrulamasını yaptığı için
        // buraya geldiğimizde token zaten doğrulanmış demektir

        // Kullanıcıyı veritabanından taze bilgilerle al
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
        });

        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
        }

        // Hassas bilgileri çıkar
        const { password, ...userWithoutPassword } = user;

        return res.status(200).json({
            success: true,
            user: userWithoutPassword
        });
    } catch (error) {
        console.error('Token doğrulama hatası:', error);
        return res.status(500).json({ message: 'Sunucu hatası' });
    }
};

// Admin rolünü doğrula
exports.verifyRole = async (req, res) => {
    try {
        // Kullanıcı admin mi kontrol et
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Bu işlem için admin yetkisi gerekiyor'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Admin yetkisi doğrulandı'
        });
    } catch (error) {
        console.error('Rol doğrulama hatası:', error);
        return res.status(500).json({ message: 'Sunucu hatası' });
    }
}; 