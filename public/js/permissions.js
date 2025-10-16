// Permission Management for Frontend
// This file handles UI permission checks based on user role

/**
 * Get current user from localStorage
 */
function getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

/**
 * Get current user role
 */
function getUserRole() {
    const user = getCurrentUser();
    return user ? user.role : null;
}

/**
 * Get user permissions from JWT token (stored in localStorage)
 */
function getUserPermissions() {
    const user = getCurrentUser();
    return user && user.permissions ? user.permissions : [];
}

/**
 * Check if user has a specific permission
 * @param {string} module - Module name (e.g., 'users', 'inventory', 'dashboard')
 * @param {string} action - Action name (e.g., 'read', 'create', 'update', 'delete')
 * @param {string} resource - Optional resource name (e.g., 'stock_level', 'user')
 */
function hasUserPermission(module, action, resource = null) {
    const permissions = getUserPermissions();
    
    // Check exact match: module:action:resource
    if (resource) {
        const exactMatch = `${module}:${action}:${resource}`;
        if (permissions.includes(exactMatch)) return true;
    }
    
    // Check module:action
    const moduleAction = `${module}:${action}`;
    if (permissions.some(p => p.startsWith(moduleAction))) return true;
    
    return false;
}

/**
 * Check if user has a specific role
 */
function hasRole(role) {
    const userRole = getUserRole();
    return userRole === role;
}

/**
 * Check if user is admin (case-insensitive)
 */
function isAdmin() {
    const role = getUserRole();
    return role && role.toLowerCase() === 'admin';
}

/**
 * Check if user is manager
 * Supports role names containing 'manager' (e.g., 'Manager cikupa', 'manager panasia')
 */
function isManager() {
    const role = getUserRole();
    return role && role.toLowerCase().includes('manager');
}

/**
 * Check if user is viewer (read-only)
 */
function isViewer() {
    const role = getUserRole();
    return role && role.toLowerCase().includes('viewer');
}

/**
 * Check if user has write permissions (based on actual permissions from DB)
 */
function canWrite() {
    const permissions = getUserPermissions();
    // Check if user has any create/update/write permissions
    return permissions.some(p => 
        p.includes(':create') || 
        p.includes(':update') || 
        p.includes(':write')
    );
}

/**
 * Check if user can delete (based on actual permissions from DB)
 */
function canDelete() {
    const permissions = getUserPermissions();
    // Check if user has any delete permissions
    return permissions.some(p => p.includes(':delete'));
}

/**
 * Check if user can access settings (user/role management)
 */
function canAccessSettings() {
    return hasUserPermission('users', 'read') || hasUserPermission('roles', 'read');
}

/**
 * Get allowed modules for current user based on their permissions
 */
function getAllowedModules() {
    const permissions = getUserPermissions();
    const modules = new Set();
    
    // Map permissions to modules
    permissions.forEach(perm => {
        const [module] = perm.split(':');
        
        // Map database module names to frontend page names
        const moduleMap = {
            'dashboard': 'dashboard',
            'inventory': 'inventory',
            'materials': 'inventory',
            'products': 'products',
            'production': 'production',
            'work_order': 'production',
            'sales_orders': 'orders',
            'purchase_orders': 'orders',
            'order': 'orders',
            'suppliers': 'suppliers',
            'customers': 'customers',
            'warehouse': 'warehouse',
            'location': 'warehouse',
            'reports': 'reports',
            'users': 'user-management',
            'roles': 'roles',
            'settings': 'settings',
            'qc': 'qc-dashboard',
            'qc-dashboard': 'qc-dashboard',
            'qc-inspection': 'qc-inspection'
        };
        
        const mappedModule = moduleMap[module] || module;
        modules.add(mappedModule);
    });
    
    return Array.from(modules);
}

/**
 * Check if user has permission for action
 */
function hasPermission(action) {
    const permissions = getUserPermissions();
    
    switch (action) {
        case 'read':
            return permissions.some(p => p.includes(':read'));
        case 'write':
        case 'create':
        case 'edit':
        case 'update':
            return permissions.some(p => 
                p.includes(':create') || 
                p.includes(':update') || 
                p.includes(':write')
            );
        case 'delete':
            return permissions.some(p => p.includes(':delete'));
        case 'settings':
            return hasUserPermission('users', 'read') || hasUserPermission('roles', 'read');
        default:
            return false;
    }
}

/**
 * Check if user can access a specific module/page
 */
function canAccessModule(moduleName) {
    const allowedModules = getAllowedModules();
    
    // Special case: index.html = dashboard
    if (moduleName === 'index') moduleName = 'dashboard';
    
    return allowedModules.includes(moduleName);
}

/**
 * Get page name from current URL
 */
function getCurrentPage() {
    const path = window.location.pathname;
    const page = path.split('/').pop().replace('.html', '') || 'index';
    return page === 'index' ? 'dashboard' : page;
}

/**
 * Get current page filename (with .html extension)
 */
function getCurrentPageFilename() {
    const path = window.location.pathname;
    const filename = path.split('/').pop() || 'index.html';
    return filename.endsWith('.html') ? filename : filename + '.html';
}

/**
 * Check page access and redirect if not allowed
 * Uses role-config.js for role-based access control
 */
function checkPageAccess() {
    const currentPageFile = getCurrentPageFilename();
    const role = getUserRole();
    const user = getCurrentUser();
    
    console.log('🔐 Checking access for:', currentPageFile);
    console.log('👤 Role:', role);
    
    // If no user, redirect to login
    if (!user) {
        console.warn('❌ No user found, redirecting to login');
        window.location.href = '/login.html';
        return false;
    }
    
    // Skip check for login page
    if (currentPageFile === 'login.html') {
        return true;
    }
    
    // Use role-config.js if available
    if (typeof canRoleAccessPage === 'function') {
        const normalizedRole = role.toLowerCase();
        const allowed = canRoleAccessPage(normalizedRole, currentPageFile);
        
        console.log('� Role:', normalizedRole);
        console.log('📄 Page:', currentPageFile);
        console.log('✓ Allowed:', allowed);
        
        if (!allowed) {
            console.warn('❌ Access denied to:', currentPageFile);
            if (typeof getAllowedPagesForRole === 'function') {
                console.log('💡 Available pages:', getAllowedPagesForRole(normalizedRole));
            }
            alert('Anda tidak memiliki akses ke halaman ini!\nRole Anda: ' + role);
            window.location.href = '/index.html'; // Redirect to dashboard
            return false;
        }
        
        console.log('✅ Access granted to:', currentPageFile);
        return true;
    }
    
    // Fallback to old permission-based check
    const currentPage = getCurrentPage();
    
    // Special case: dashboard is always accessible if logged in
    if (currentPage === 'dashboard' || currentPage === 'index') {
        console.log('✅ Dashboard access allowed');
        return true;
    }
    
    if (!canAccessModule(currentPage)) {
        console.warn('❌ Access denied to:', currentPage);
        console.log('💡 Available modules:', getAllowedModules());
        alert('Anda tidak memiliki akses ke halaman ini!');
        window.location.href = '/index.html'; // Redirect to dashboard
        return false;
    }
    
    console.log('✅ Access granted to:', currentPage);
    return true;
}

/**
 * Hide element if user doesn't have permission
 */
function hideIfNoPermission(selector, action) {
    if (!hasPermission(action)) {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
            el.style.display = 'none';
        });
    }
}

/**
 * Disable element if user doesn't have permission
 */
function disableIfNoPermission(selector, action) {
    if (!hasPermission(action)) {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
            el.disabled = true;
            el.style.opacity = '0.5';
            el.style.cursor = 'not-allowed';
            el.title = 'Anda tidak memiliki akses untuk aksi ini';
        });
    }
}

/**
 * Apply permission-based UI restrictions
 * Call this function on page load
 */
function applyPermissions() {
    const role = getUserRole();
    
    console.log('🔐 Applying permissions for role:', role);
    
    if (!role) {
        console.warn('⚠️ No user role found, redirecting to login...');
        return;
    }
    
    // Check if user can access current page
    checkPageAccess();
    
    // Hide menu items based on role
    hideUnauthorizedMenuItems();
    
    // Get role capabilities
    let canCreate = false, canUpdate = false, canDelete = false;
    
    if (typeof getRoleCapabilities === 'function') {
        const capabilities = getRoleCapabilities(role.toLowerCase());
        canCreate = capabilities.canCreate;
        canUpdate = capabilities.canUpdate;
        canDelete = capabilities.canDelete;
        
        console.log('🔐 Role capabilities:', capabilities);
    } else {
        // Fallback to permission-based check
        canCreate = canWrite();
        canUpdate = canWrite();
        canDelete = canDelete();
    }
    
    // For VIEWER or roles without write access - hide all write operations
    if (!canCreate && !canUpdate) {
        console.log('👁️ Read-only mode: Hiding write operations...');
        
        // Hide all Add buttons
        hideIfNoPermission('button[onclick*="openAdd"]', 'write');
        hideIfNoPermission('button[onclick*="showAdd"]', 'write');
        hideIfNoPermission('button[onclick*="Add"]', 'write');
        hideIfNoPermission('.btn:has(.fa-plus)', 'write');
        
        // Hide all Edit buttons
        hideIfNoPermission('button[onclick*="edit"]', 'write');
        hideIfNoPermission('.btn-primary:has(.fa-edit)', 'write');
        hideIfNoPermission('.btn:has(.fa-edit)', 'write');
        
        // Disable form submit buttons (but allow view)
        disableIfNoPermission('button[type="submit"]', 'write');
        
        // Add viewer badge to UI
        addViewerBadge();
    }
    
    // Hide Delete buttons if no delete permission
    if (!canDelete) {
        hideIfNoPermission('button[onclick*="delete"]', 'delete');
        hideIfNoPermission('.btn-danger:has(.fa-trash)', 'delete');
        hideIfNoPermission('.btn:has(.fa-trash)', 'delete');
    }
    
    // Hide settings for non-admin
    if (!canAccessSettings() && !(typeof canRoleAccessSection === 'function' && canRoleAccessSection(role.toLowerCase(), 'system'))) {
        hideIfNoPermission('a[href*="roles.html"]', 'settings');
        hideIfNoPermission('.nav-item[href*="roles.html"]', 'settings');
        hideIfNoPermission('a[href*="user-management.html"]', 'settings');
        hideIfNoPermission('.nav-item[href*="user-management.html"]', 'settings');
    }
    
    console.log('✅ Permissions applied successfully');
}

/**
 * Hide menu items that user cannot access
 * Uses role-config.js for role-based navigation control
 */
function hideUnauthorizedMenuItems() {
    const role = getUserRole();
    if (!role) return;
    
    const normalizedRole = role.toLowerCase();
    
    console.log('🔐 Hiding unauthorized menu items for role:', normalizedRole);
    
    // Use role-config.js if available
    if (typeof getAllowedPagesForRole === 'function') {
        const allowedPages = getAllowedPagesForRole(normalizedRole);
        console.log('✅ Allowed pages:', allowedPages);
        
        // Hide menu items that are not in allowed pages
        document.querySelectorAll('.nav-item').forEach(menuItem => {
            const href = menuItem.getAttribute('href');
            if (!href) return;
            
            const page = href.replace('/', '');
            
            // Check if page is allowed
            if (!allowedPages.includes(page)) {
                menuItem.style.display = 'none';
                console.log('❌ Hiding menu:', page);
            } else {
                menuItem.style.display = ''; // Show allowed items
                console.log('✅ Showing menu:', page);
            }
        });
        
        // Hide sections if all items in that section are hidden
        hideEmptyNavSections();
        
        return;
    }
    
    // Fallback to old permission-based logic
    const allowedModules = getAllowedModules();
    
    console.log('🔐 Allowed modules:', allowedModules);
    
    // Menu item to module mapping
    const menuMapping = {
        'inventory.html': 'inventory',
        'products.html': 'products',
        'production.html': 'production',
        'orders.html': 'orders',
        'suppliers.html': 'suppliers',
        'customers.html': 'customers',
        'warehouse.html': 'warehouse',
        'reports.html': 'reports',
        'user-management.html': 'user-management',
        'roles.html': 'roles',
        'index.html': 'dashboard',
        'qc-dashboard.html': 'qc-dashboard'
    };
    
    // Hide menu items that are not allowed
    document.querySelectorAll('.nav-item').forEach(menuItem => {
        const href = menuItem.getAttribute('href');
        if (!href) return;
        
        const page = href.replace('/', '');
        const module = menuMapping[page];
        
        if (!module) return;
        
        // Hide if not in allowed modules
        if (!allowedModules.includes(module)) {
            menuItem.style.display = 'none';
            console.log('❌ Hiding menu:', module);
        } else {
            console.log('✅ Showing menu:', module);
        }
    });
    
    hideEmptyNavSections();
}

/**
 * Hide navigation sections if all items are hidden
 */
function hideEmptyNavSections() {
    document.querySelectorAll('.nav-section').forEach(section => {
        const nextItems = [];
        let next = section.nextElementSibling;
        
        while (next && !next.classList.contains('nav-section')) {
            if (next.classList.contains('nav-item')) {
                nextItems.push(next);
            }
            next = next.nextElementSibling;
        }
        
        // If all items hidden, hide section too
        const allHidden = nextItems.length > 0 && nextItems.every(item => 
            item.style.display === 'none'
        );
        
        if (allHidden) {
            section.style.display = 'none';
        } else {
            section.style.display = '';
        }
    });
}

/**
 * Add viewer badge to indicate read-only mode
 */
function addViewerBadge() {
    // Add badge to topbar
    const topbar = document.querySelector('.topbar-right');
    if (topbar && !document.querySelector('.viewer-badge')) {
        const badge = document.createElement('span');
        badge.className = 'viewer-badge';
        badge.innerHTML = '<i class="fas fa-eye"></i> Mode Read-Only';
        badge.style.cssText = `
            background: #f59e0b;
            color: white;
            padding: 6px 12px;
            border-radius: 5px;
            font-size: 12px;
            font-weight: bold;
            margin-right: 10px;
            display: inline-flex;
            align-items: center;
            gap: 5px;
        `;
        topbar.insertBefore(badge, topbar.firstChild);
    }
}

/**
 * Prevent action if no permission
 * Use this in onclick handlers
 */
function checkPermissionOrAlert(action, message) {
    if (!hasPermission(action)) {
        alert(message || 'Anda tidak memiliki akses untuk melakukan aksi ini. Role Anda: ' + getUserRole());
        return false;
    }
    return true;
}

/**
 * Wrapper for sensitive operations
 */
function withPermission(action, callback, errorMessage) {
    return function(...args) {
        if (!hasPermission(action)) {
            alert(errorMessage || 'Akses ditolak. Anda tidak memiliki permission untuk: ' + action);
            return;
        }
        return callback.apply(this, args);
    };
}

// Auto-apply permissions when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyPermissions);
} else {
    // DOM already loaded
    applyPermissions();
}
