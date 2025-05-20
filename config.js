// config.js
require('dotenv').config({
    path: process.env.NODE_ENV === 'production'
        ? '.env.production'
        : '.env.development'
});

module.exports = {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000,
    databaseUrl: process.env.DATABASE_URL,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d', // Default: 1 gün
    apiUrl: process.env.API_URL,
    // corsOrigins: process.env.NODE_ENV === 'production'
    //     ? ['https://e-yds.quizta.com.tr/', 'https://panel-e-yds.quizta.com.tr/']
    //     : ['http://localhost:3000', 'http://localhost:5173','http://localhost:8081/'],
    corsOrigins: '*', // Tüm kaynaklara CORS erişimine izin ver
    logging: process.env.NODE_ENV === 'production' ? 'combined' : 'dev',
    redirectUrl: process.env.NODE_ENV === 'production'
        ? 'https://e-yds.quizta.com.tr/'
        : 'http://localhost:3000/api-docs',
    
    // Email ayarları
    emailHost: process.env.EMAIL_HOST,
    emailPort: parseInt(process.env.EMAIL_PORT) || 587,
    emailSecure: process.env.EMAIL_SECURE === 'true',
    emailUser: process.env.EMAIL_USER,
    emailPassword: process.env.EMAIL_PASSWORD,
    emailFromName: process.env.EMAIL_FROM_NAME || 'E-YDS',
    emailFromAddress: process.env.EMAIL_FROM_ADDRESS || 'noreply@quizta.com.tr',
};