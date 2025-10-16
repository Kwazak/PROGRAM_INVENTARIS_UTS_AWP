/**
 * Logger Helper
 * Centralized logging utility
 */

const fs = require('fs');
const path = require('path');
const config = require('../config/server');

class Logger {
    constructor() {
        this.logDir = config.logDir;
        this.logToFile = config.logToFile;
        
        // Create log directory if it doesn't exist
        if (this.logToFile && !fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    /**
     * Format log message
     */
    formatMessage(level, message, meta = {}) {
        const timestamp = new Date().toISOString();
        const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';
        return `[${timestamp}] [${level.toUpperCase()}] ${message} ${metaStr}`;
    }

    /**
     * Write to log file
     */
    writeToFile(level, message) {
        if (!this.logToFile) return;

        const filename = `${new Date().toISOString().split('T')[0]}.log`;
        const filepath = path.join(this.logDir, filename);
        
        fs.appendFileSync(filepath, message + '\n');
    }

    /**
     * Info log
     */
    info(message, meta = {}) {
        const logMessage = this.formatMessage('info', message, meta);
        console.log('\x1b[36m%s\x1b[0m', logMessage); // Cyan
        this.writeToFile('info', logMessage);
    }

    /**
     * Success log
     */
    success(message, meta = {}) {
        const logMessage = this.formatMessage('success', message, meta);
        console.log('\x1b[32m%s\x1b[0m', logMessage); // Green
        this.writeToFile('success', logMessage);
    }

    /**
     * Warning log
     */
    warn(message, meta = {}) {
        const logMessage = this.formatMessage('warn', message, meta);
        console.warn('\x1b[33m%s\x1b[0m', logMessage); // Yellow
        this.writeToFile('warn', logMessage);
    }

    /**
     * Error log
     */
    error(message, meta = {}) {
        const logMessage = this.formatMessage('error', message, meta);
        console.error('\x1b[31m%s\x1b[0m', logMessage); // Red
        this.writeToFile('error', logMessage);
    }

    /**
     * Debug log
     */
    debug(message, meta = {}) {
        if (config.env !== 'development') return;
        
        const logMessage = this.formatMessage('debug', message, meta);
        console.log('\x1b[35m%s\x1b[0m', logMessage); // Magenta
        this.writeToFile('debug', logMessage);
    }

    /**
     * HTTP request log
     */
    http(req, res) {
        const logMessage = this.formatMessage('http', `${req.method} ${req.originalUrl}`, {
            ip: req.ip,
            userAgent: req.get('user-agent'),
            statusCode: res.statusCode
        });
        console.log(logMessage);
        this.writeToFile('http', logMessage);
    }
}

module.exports = new Logger();
