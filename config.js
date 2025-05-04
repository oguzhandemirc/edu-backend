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
    corsOrigins: process.env.NODE_ENV === 'production'
        ? ['https://e-yds.quizta.com.tr/', 'https://panel-e-yds.quizta.com.tr/']
        : ['http://localhost:3000', 'http://localhost:5173'],
    logging: process.env.NODE_ENV === 'production' ? 'combined' : 'dev',
    redirectUrl: process.env.NODE_ENV === 'production'
        ? 'https://e-yds.quizta.com.tr/'
        : 'http://localhost:3000/api-docs'
};