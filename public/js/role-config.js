// Role Configuration - Define access levels for each role
// This centralizes all role-based access control

/**
 * Navigation structure with role-based access
 * Each section defines which roles can access it
 */
const ROLE_NAVIGATION = {
    // DASHBOARD Section - Accessible to all roles
    dashboard: {
        roles: ['admin', 'manager', 'viewer'],
        pages: ['index.html']
    },
    
    // INVENTORY Section
    inventory: {
        roles: ['admin', 'manager'],
        pages: ['inventory.html', 'products.html']
    },
    
    // PRODUCTION Section
    production: {
        roles: ['admin', 'manager'],
        pages: ['production.html', 'orders.html']
    },
    
    // QUALITY CONTROL Section
    quality: {
        roles: ['admin', 'manager', 'viewer'],
        pages: ['qc-dashboard.html']
    },
    
    // PARTNERS Section
    partners: {
        roles: ['admin', 'manager'],
        pages: ['suppliers.html', 'customers.html', 'warehouse.html']
    },
    
    // REPORTS Section
    reports: {
        roles: ['admin', 'manager', 'viewer'],
        pages: ['reports.html']
    },
    
    // SYSTEM Section - Admin only
    system: {
        roles: ['admin'],
        pages: ['user-management.html', 'roles.html']
    }
};

/**
 * Page to section mapping
 * Maps each page to its navigation section
 */
const PAGE_SECTION_MAP = {
    'index.html': 'dashboard',
    'inventory.html': 'inventory',
    'products.html': 'inventory',
    'production.html': 'production',
    'orders.html': 'production',
    'qc-dashboard.html': 'quality',
    'suppliers.html': 'partners',
    'customers.html': 'partners',
    'warehouse.html': 'partners',
    'reports.html': 'reports',
    'user-management.html': 'system',
    'roles.html': 'system'
};

/**
 * Role capabilities - What each role can do
 */
const ROLE_CAPABILITIES = {
    admin: {
        label: 'Administrator',
        description: 'Full access to all features including system management',
        canCreate: true,
        canRead: true,
        canUpdate: true,
        canDelete: true,
        canAccessSystem: true,
        sections: ['dashboard', 'inventory', 'production', 'quality', 'partners', 'reports', 'system']
    },
    
    manager: {
        label: 'Manager',
        description: 'Access to all operational features except system settings',
        canCreate: true,
        canRead: true,
        canUpdate: true,
        canDelete: true,
        canAccessSystem: false,
        sections: ['dashboard', 'inventory', 'production', 'quality', 'partners', 'reports']
    },
    
    viewer: {
        label: 'Viewer',
        description: 'Read-only access to dashboard, reports, and QC dashboard',
        canCreate: false,
        canRead: true,
        canUpdate: false,
        canDelete: false,
        canAccessSystem: false,
        sections: ['dashboard', 'quality', 'reports']
    }
};

/**
 * Get allowed pages for a specific role
 * @param {string} role - User role (admin, manager, viewer)
 * @returns {Array} - Array of allowed page URLs
 */
function getAllowedPagesForRole(role) {
    const normalizedRole = role.toLowerCase();
    const allowedPages = [];
    
    Object.keys(ROLE_NAVIGATION).forEach(section => {
        const sectionConfig = ROLE_NAVIGATION[section];
        if (sectionConfig.roles.includes(normalizedRole)) {
            allowedPages.push(...sectionConfig.pages);
        }
    });
    
    return allowedPages;
}

/**
 * Get allowed sections for a specific role
 * @param {string} role - User role
 * @returns {Array} - Array of allowed section names
 */
function getAllowedSectionsForRole(role) {
    const normalizedRole = role.toLowerCase();
    const capabilities = ROLE_CAPABILITIES[normalizedRole];
    
    return capabilities ? capabilities.sections : [];
}

/**
 * Check if role can access a specific page
 * @param {string} role - User role
 * @param {string} page - Page filename (e.g., 'inventory.html')
 * @returns {boolean}
 */
function canRoleAccessPage(role, page) {
    const allowedPages = getAllowedPagesForRole(role);
    return allowedPages.includes(page);
}

/**
 * Check if role can access a specific section
 * @param {string} role - User role
 * @param {string} section - Section name
 * @returns {boolean}
 */
function canRoleAccessSection(role, section) {
    const sectionConfig = ROLE_NAVIGATION[section];
    if (!sectionConfig) return false;
    
    const normalizedRole = role.toLowerCase();
    return sectionConfig.roles.includes(normalizedRole);
}

/**
 * Get role capabilities
 * @param {string} role - User role
 * @returns {Object} - Role capabilities object
 */
function getRoleCapabilities(role) {
    const normalizedRole = role.toLowerCase();
    return ROLE_CAPABILITIES[normalizedRole] || ROLE_CAPABILITIES.viewer;
}

/**
 * Check if role can perform action
 * @param {string} role - User role
 * @param {string} action - Action type (create, read, update, delete)
 * @returns {boolean}
 */
function canRolePerformAction(role, action) {
    const capabilities = getRoleCapabilities(role);
    
    switch (action.toLowerCase()) {
        case 'create':
        case 'add':
            return capabilities.canCreate;
        case 'read':
        case 'view':
            return capabilities.canRead;
        case 'update':
        case 'edit':
            return capabilities.canUpdate;
        case 'delete':
        case 'remove':
            return capabilities.canDelete;
        default:
            return false;
    }
}

/**
 * Get navigation menu structure for role
 * Returns organized menu with sections and pages
 * @param {string} role - User role
 * @returns {Object} - Menu structure
 */
function getNavigationMenuForRole(role) {
    const normalizedRole = role.toLowerCase();
    const allowedSections = getAllowedSectionsForRole(normalizedRole);
    
    const menu = {
        sections: []
    };
    
    // Build menu structure
    Object.keys(ROLE_NAVIGATION).forEach(sectionKey => {
        if (allowedSections.includes(sectionKey)) {
            const section = ROLE_NAVIGATION[sectionKey];
            menu.sections.push({
                key: sectionKey,
                pages: section.pages
            });
        }
    });
    
    return menu;
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ROLE_NAVIGATION,
        PAGE_SECTION_MAP,
        ROLE_CAPABILITIES,
        getAllowedPagesForRole,
        getAllowedSectionsForRole,
        canRoleAccessPage,
        canRoleAccessSection,
        getRoleCapabilities,
        canRolePerformAction,
        getNavigationMenuForRole
    };
}
