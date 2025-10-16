/**
 * Validation Middleware
 * Request validation middleware using express-validator
 */

const { validationResult } = require('express-validator');
const { ResponseHelper } = require('../helpers');

/**
 * Validate request and return errors if any
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        const formattedErrors = errors.array().reduce((acc, err) => {
            acc[err.path || err.param] = err.msg;
            return acc;
        }, {});
        
        return ResponseHelper.validationError(res, formattedErrors);
    }
    
    next();
};

module.exports = validate;
