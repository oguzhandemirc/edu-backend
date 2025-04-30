const { PrismaClient } = require('@prisma/client');
const config = require('../config');

// Node ortamına göre env dosyasını yükle
require('dotenv').config({
    path: process.env.NODE_ENV === 'production'
        ? '.env.production'
        : '.env.development'
});

const prisma = new PrismaClient();

module.exports = prisma; 