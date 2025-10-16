/**
 * Configuration Index
 * Central export point for all configuration modules
 */

const database = require('./database');
const server = require('./server');

module.exports = {
    database,
    server
};
