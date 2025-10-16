/**
 * Response Helper
 * Standardized API response formats
 */

class ResponseHelper {
    /**
     * Success response
     */
    static success(res, data = null, message = 'Success', statusCode = 200) {
        return res.status(statusCode).json({
            success: true,
            message,
            data,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Error response
     */
    static error(res, message = 'Error occurred', statusCode = 500, errors = null) {
        const response = {
            success: false,
            message,
            timestamp: new Date().toISOString()
        };

        if (errors) {
            response.errors = errors;
        }

        return res.status(statusCode).json(response);
    }

    /**
     * Validation error response
     */
    static validationError(res, errors) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Not found response
     */
    static notFound(res, message = 'Resource not found') {
        return res.status(404).json({
            success: false,
            message,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Unauthorized response
     */
    static unauthorized(res, message = 'Unauthorized access') {
        return res.status(401).json({
            success: false,
            message,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Forbidden response
     */
    static forbidden(res, message = 'Access forbidden') {
        return res.status(403).json({
            success: false,
            message,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Paginated response
     */
    static paginated(res, data, pagination, message = 'Success') {
        return res.status(200).json({
            success: true,
            message,
            data,
            pagination: {
                page: parseInt(pagination.page),
                pageSize: parseInt(pagination.pageSize),
                totalItems: parseInt(pagination.totalItems),
                totalPages: Math.ceil(pagination.totalItems / pagination.pageSize)
            },
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Created response
     */
    static created(res, data = null, message = 'Resource created successfully') {
        return this.success(res, data, message, 201);
    }

    /**
     * No content response
     */
    static noContent(res) {
        return res.status(204).send();
    }
}

module.exports = ResponseHelper;
