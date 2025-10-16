/**
 * Authentication Service Module
 * Handle user authentication
 */

const AuthService = {
    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!StorageUtil.getToken();
    },

    /**
     * Get current user
     */
    getCurrentUser() {
        return StorageUtil.getUser();
    },

    /**
     * Check authentication and redirect if not logged in
     */
    requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = '/login.html';
            return false;
        }
        return true;
    },

    /**
     * Login user
     */
    async login(username, password) {
        try {
            const response = await fetch(`${AppConfig.getApiUrl()}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (data.success && data.token) {
                // Save auth data
                StorageUtil.setToken(data.token);
                StorageUtil.setUser(data.user);
                if (data.permissions) {
                    StorageUtil.setPermissions(data.permissions);
                }

                if (AppConfig.debug.enabled) {
                    console.log('✅ Login successful:', data.user.username);
                }

                return { success: true, user: data.user };
            } else {
                return { success: false, message: data.message || 'Login failed' };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'Terjadi kesalahan saat login' };
        }
    },

    /**
     * Logout user
     */
    logout() {
        StorageUtil.clearAuth();
        window.location.href = '/login.html';
    },

    /**
     * Check if user has permission
     */
    hasPermission(permission) {
        const permissions = StorageUtil.getPermissions();
        return permissions.includes(permission);
    },

    /**
     * Check if user has any of the permissions
     */
    hasAnyPermission(permissionArray) {
        const permissions = StorageUtil.getPermissions();
        return permissionArray.some(p => permissions.includes(p));
    },

    /**
     * Check if user has all permissions
     */
    hasAllPermissions(permissionArray) {
        const permissions = StorageUtil.getPermissions();
        return permissionArray.every(p => permissions.includes(p));
    },

    /**
     * Check if user has role
     */
    hasRole(role) {
        const user = this.getCurrentUser();
        return user && user.role === role;
    },

    /**
     * Check if user is admin or super admin
     */
    isAdmin() {
        return this.hasRole(Roles.ADMIN) || this.hasRole(Roles.SUPER_ADMIN);
    },

    /**
     * Get user's role label
     */
    getRoleLabel() {
        const user = this.getCurrentUser();
        return user ? RoleLabels[user.role] || user.role : '';
    }
};

// Export
window.AuthService = AuthService;
