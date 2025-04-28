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
    apiUrl: process.env.API_URL,
    corsOrigins: process.env.NODE_ENV === 'production'
        ? ['https://oguzhandemirci.com.tr', 'https://test.oguzhandemirci.com.tr', 'https://panel.oguzhandemirci.com.tr']
        : ['http://localhost:3000', 'http://localhost:5173'],
    logging: process.env.NODE_ENV === 'production' ? 'combined' : 'dev',
    redirectUrl: process.env.NODE_ENV === 'production'
        ? 'https://test.oguzhandemirci.com.tr'
        : 'http://localhost:3000/api-docs'
};