/**
 * Legacy Compatibility Layer
 * Membuat fungsi-fungsi lama tetap bekerja dengan struktur modular baru
 * 
 * File ini menjembatani kode lama dengan modul baru
 * Include file ini setelah loader.js
 */

// Wait for modules to load
window.addEventListener('modulesLoaded', function() {
    console.log('🔗 Setting up legacy compatibility...');

    // ============================================
    // API Functions (Legacy)
    // ============================================

    window.API_URL = AppConfig.getApiUrl();

    window.getToken = function() {
        return StorageUtil.getToken();
    };

    window.getUser = function() {
        return StorageUtil.getUser();
    };

    window.checkAuth = function() {
        return AuthService.requireAuth();
    };

    window.fetchAPI = async function(endpoint, options = {}) {
        return APIService.request(endpoint, options);
    };

    // ============================================
    // Toast Functions (Legacy)
    // ============================================

    window.showToast = function(message, type = 'info') {
        ToastUI.show(message, type);
    };

    // ============================================
    // Format Functions (Legacy)
    // ============================================

    window.formatCurrency = function(amount) {
        return FormatterUtil.currency(amount);
    };

    window.formatNumber = function(num) {
        return FormatterUtil.number(num);
    };

    window.formatDate = function(dateString, format = 'short') {
        return FormatterUtil.date(dateString, format);
    };

    // ============================================
    // Validation Functions (Legacy)
    // ============================================

    window.validateEmail = function(email) {
        return ValidationUtil.isValidEmail(email);
    };

    window.validatePhone = function(phone) {
        return ValidationUtil.isValidPhone(phone);
    };

    // ============================================
    // Logout Function (Legacy)
    // ============================================

    window.logout = function() {
        AuthService.logout();
    };

    console.log('✅ Legacy compatibility layer ready');
});
