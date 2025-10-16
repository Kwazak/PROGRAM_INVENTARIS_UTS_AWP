require('dotenv').config();

/**
 * Server Configuration Module
 * Centralized server settings
 */

const serverConfig = {
    // Server
    port: parseInt(process.env.PORT) || 3000,
    host: process.env.HOST || '0.0.0.0',
    env: process.env.NODE_ENV || 'development',
    
    // Security
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-this',
    jwtExpiry: process.env.JWT_EXPIRY || '24h',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 10,
    
    // Rate Limiting
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 500,
    
    // File Upload
    uploadDir: process.env.UPLOAD_DIR || 'uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
    allowedFileTypes: (process.env.ALLOWED_FILE_TYPES || 'jpg,jpeg,png,pdf').split(','),
    
    // CORS
    corsOrigin: process.env.CORS_ORIGIN || '*',
    
    // Pagination
    defaultPageSize: parseInt(process.env.DEFAULT_PAGE_SIZE) || 20,
    maxPageSize: parseInt(process.env.MAX_PAGE_SIZE) || 100,
    
    // Session
    sessionSecret: process.env.SESSION_SECRET || 'session-secret-change-this',
    sessionExpiry: parseInt(process.env.SESSION_EXPIRY) || 24 * 60 * 60 * 1000, // 24 hours
    
    // Email (for future use)
    emailEnabled: process.env.EMAIL_ENABLED === 'true',
    emailHost: process.env.EMAIL_HOST,
    emailPort: parseInt(process.env.EMAIL_PORT) || 587,
    emailUser: process.env.EMAIL_USER,
    emailPassword: process.env.EMAIL_PASSWORD,
    emailFrom: process.env.EMAIL_FROM || 'noreply@factory-inventory.com',
    
    // Features
    enableCron: process.env.ENABLE_CRON !== 'false',
    enableRateLimit: process.env.ENABLE_RATE_LIMIT === 'true',
    enableCompression: process.env.ENABLE_COMPRESSION !== 'false',
    enableHelmet: process.env.ENABLE_HELMET !== 'false',
    
    // Logging
    logLevel: process.env.LOG_LEVEL || 'info',
    logToFile: process.env.LOG_TO_FILE === 'true',
    logDir: process.env.LOG_DIR || 'logs'
};

module.exports = serverConfig;
