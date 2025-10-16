/**
 * Database Connection (Legacy Compatibility)
 * This file is kept for backward compatibility
 * New code should use src/config/database.js
 */

const { promisePool } = require('./src/config/database');

module.exports = promisePool;
