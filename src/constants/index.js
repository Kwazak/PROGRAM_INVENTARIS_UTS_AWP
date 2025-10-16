/**
 * Constants Index
 * Central export point for all constants
 */

const roles = require('./roles');
const permissions = require('./permissions');
const status = require('./status');

module.exports = {
    ...roles,
    ...permissions,
    ...status
};
