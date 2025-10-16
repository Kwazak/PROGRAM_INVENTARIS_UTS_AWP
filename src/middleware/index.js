/**
 * Middleware Index
 * Central export point for all middleware
 */

const auth = require('../../middleware/auth'); // Keep existing auth
const ErrorHandler = require('./errorHandler');
const requestLogger = require('./requestLogger');
const validate = require('./validate');

module.exports = {
    auth,
    ErrorHandler,
    requestLogger,
    validate
};
