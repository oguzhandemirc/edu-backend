const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const config = require('../config');

// Google OAuth stratejisi yapılandırması
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: `${config.apiUrl}/api/auth/google/callback`,
            scope: ['profile', 'email']
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // Google profilinden bilgileri al
                const googleId = profile.id;
                const email = profile.emails[0].value;
                const name = profile.displayName || profile.name?.givenName || '';
                const profilePhoto = profile.photos?.[0]?.value || null;

                // Kullanıcı zaten var mı kontrol et (email veya googleId ile)
                let user = await prisma.user.findFirst({
                    where: {
                        OR: [
                            { email },
                            { googleId }
                        ]
                    }
                });

                if (user) {
                    // Kullanıcı varsa ve Google ID'si yoksa güncelle
                    if (!user.googleId) {
                        user = await prisma.user.update({
                            where: { id: user.id },
                            data: {
                                googleId,
                                // Profil fotoğrafı varsa güncelle
                                ...(profilePhoto && { profilePhoto })
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
                            password: '', // Google ile giriş yapan kullanıcının şifresi olmaz
                            role: 'user', // Varsayılan rol
                            profilePhoto
                        }
                    });
                }

                // Hassas verileri çıkar ve kullanıcıyı döndür
                const { password, ...userWithoutPassword } = user;
                return done(null, userWithoutPassword);
            } catch (error) {
                console.error('Google auth hatası:', error);
                return done(error, null);
            }
        }
    )
);

// Kullanıcı serileştirme/deserileştirme (session için)
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id }
        });

        if (!user) {
            return done(null, false);
        }

        const { password, ...userWithoutPassword } = user;
        done(null, userWithoutPassword);
    } catch (error) {
        done(error, null);
    }
});

module.exports = passport; 