/**
 * Error Handler Middleware
 * Centralized error handling
 */

const { logger } = require('../helpers');
const { ResponseHelper } = require('../helpers');

class ErrorHandler {
    /**
     * Handle 404 - Not Found
     */
    static notFound(req, res, next) {
        return ResponseHelper.notFound(res, `Route ${req.originalUrl} not found`);
    }

    /**
     * Handle all errors
     */
    static handle(err, req, res, next) {
        // Log error
        logger.error('Error occurred', {
            message: err.message,
            stack: err.stack,
            url: req.originalUrl,
            method: req.method,
            ip: req.ip
        });

        // Determine status code
        const statusCode = err.statusCode || err.status || 500;

        // JWT errors
        if (err.name === 'JsonWebTokenError') {
            return ResponseHelper.unauthorized(res, 'Invalid token');
        }

        if (err.name === 'TokenExpiredError') {
            return ResponseHelper.unauthorized(res, 'Token expired');
        }

        // Validation errors
        if (err.name === 'ValidationError') {
            return ResponseHelper.validationError(res, err.errors);
        }

        // Database errors
        if (err.code === 'ER_DUP_ENTRY') {
            return ResponseHelper.error(res, 'Duplicate entry found', 409);
        }

        if (err.code === 'ER_NO_REFERENCED_ROW_2') {
            return ResponseHelper.error(res, 'Referenced record not found', 400);
        }

        // Multer errors (file upload)
        if (err.name === 'MulterError') {
            return ResponseHelper.error(res, `File upload error: ${err.message}`, 400);
        }

        // Generic error response
        return ResponseHelper.error(
            res,
            err.message || 'Internal server error',
            statusCode,
            process.env.NODE_ENV === 'development' ? err.stack : null
        );
    }

    /**
     * Async error wrapper
     */
    static asyncHandler(fn) {
        return (req, res, next) => {
            Promise.resolve(fn(req, res, next)).catch(next);
        };
    }
}

module.exports = ErrorHandler;
