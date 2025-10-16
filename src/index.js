/**
 * Main Application Index
 * Central export point for the modular structure
 */

const config = require('./config');
const constants = require('./constants');
const helpers = require('./helpers');
const utils = require('./utils');
const middleware = require('./middleware');

module.exports = {
    config,
    constants,
    helpers,
    utils,
    middleware
};
