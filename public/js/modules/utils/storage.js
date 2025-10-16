/**
 * Storage Utility Module
 * Helper untuk localStorage dan sessionStorage
 */

const StorageUtil = {
    /**
     * Get token dari localStorage
     */
    getToken() {
        return localStorage.getItem('token');
    },

    /**
     * Set token ke localStorage
     */
    setToken(token) {
        localStorage.setItem('token', token);
    },

    /**
     * Remove token dari localStorage
     */
    removeToken() {
        localStorage.removeItem('token');
    },

    /**
     * Get user dari localStorage
     */
    getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    /**
     * Set user ke localStorage
     */
    setUser(user) {
        localStorage.setItem('user', JSON.stringify(user));
    },

    /**
     * Remove user dari localStorage
     */
    removeUser() {
        localStorage.removeItem('user');
    },

    /**
     * Get permissions dari localStorage
     */
    getPermissions() {
        const permissions = localStorage.getItem('permissions');
        return permissions ? JSON.parse(permissions) : [];
    },

    /**
     * Set permissions ke localStorage
     */
    setPermissions(permissions) {
        localStorage.setItem('permissions', JSON.stringify(permissions));
    },

    /**
     * Clear all auth data
     */
    clearAuth() {
        this.removeToken();
        this.removeUser();
        localStorage.removeItem('permissions');
    },

    /**
     * Get item dari localStorage dengan default value
     */
    get(key, defaultValue = null) {
        const value = localStorage.getItem(key);
        if (value === null) return defaultValue;
        
        try {
            return JSON.parse(value);
        } catch (e) {
            return value;
        }
    },

    /**
     * Set item ke localStorage (auto stringify object)
     */
    set(key, value) {
        const stringValue = typeof value === 'object' ? JSON.stringify(value) : value;
        localStorage.setItem(key, stringValue);
    },

    /**
     * Remove item dari localStorage
     */
    remove(key) {
        localStorage.removeItem(key);
    },

    /**
     * Clear all localStorage
     */
    clear() {
        localStorage.clear();
    },

    /**
     * Session storage methods
     */
    session: {
        get(key, defaultValue = null) {
            const value = sessionStorage.getItem(key);
            if (value === null) return defaultValue;
            
            try {
                return JSON.parse(value);
            } catch (e) {
                return value;
            }
        },

        set(key, value) {
            const stringValue = typeof value === 'object' ? JSON.stringify(value) : value;
            sessionStorage.setItem(key, stringValue);
        },

        remove(key) {
            sessionStorage.removeItem(key);
        },

        clear() {
            sessionStorage.clear();
        }
    }
};

// Export
window.StorageUtil = StorageUtil;
