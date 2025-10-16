/**
 * Request Logger Middleware
 * Log all incoming requests
 */

const { logger } = require('../helpers');

const requestLogger = (req, res, next) => {
    const startTime = Date.now();

    // Log when response is finished
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const logData = {
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get('user-agent')
        };

        if (res.statusCode >= 400) {
            logger.warn(`${req.method} ${req.originalUrl} - ${res.statusCode}`, logData);
        } else {
            logger.info(`${req.method} ${req.originalUrl} - ${res.statusCode}`, logData);
        }
    });

    next();
};

module.exports = requestLogger;
