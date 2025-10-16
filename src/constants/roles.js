/**
 * User Roles Constants
 */

const ROLES = {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    MANAGER: 'manager',
    STAFF: 'staff',
    VIEWER: 'viewer'
};

const ROLE_HIERARCHY = {
    [ROLES.SUPER_ADMIN]: 5,
    [ROLES.ADMIN]: 4,
    [ROLES.MANAGER]: 3,
    [ROLES.STAFF]: 2,
    [ROLES.VIEWER]: 1
};

const ROLE_DESCRIPTIONS = {
    [ROLES.SUPER_ADMIN]: 'Full system access with user management',
    [ROLES.ADMIN]: 'Administrative access to all modules',
    [ROLES.MANAGER]: 'Management access to assigned modules',
    [ROLES.STAFF]: 'Operational access to daily tasks',
    [ROLES.VIEWER]: 'Read-only access to reports and data'
};

module.exports = {
    ROLES,
    ROLE_HIERARCHY,
    ROLE_DESCRIPTIONS
};
