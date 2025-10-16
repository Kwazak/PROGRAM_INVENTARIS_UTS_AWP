/**
 * Application Configuration Module
 * Konfigurasi aplikasi frontend
 */

const AppConfig = {
    // API Configuration - Dynamic URL based on current hostname
    getApiUrl() {
        const hostname = window.location.hostname;
        const protocol = window.location.protocol;
        const port = '3000';
        return `${protocol}//${hostname}:${port}/api`;
    },

    // App Information
    app: {
        name: 'Factory Inventory System',
        version: '2.0.0',
        description: 'Sistem Inventaris Pabrik Produksi'
    },

    // Date & Time Formats
    dateFormat: {
        short: 'DD/MM/YYYY',
        long: 'DD MMMM YYYY',
        time: 'HH:mm:ss',
        datetime: 'DD/MM/YYYY HH:mm',
        iso: 'YYYY-MM-DD'
    },

    // Pagination Settings
    pagination: {
        defaultPageSize: 10,
        pageSizeOptions: [10, 25, 50, 100],
        maxPageSize: 100
    },

    // Currency Settings
    currency: {
        code: 'IDR',
        symbol: 'Rp',
        locale: 'id-ID',
        decimalPlaces: 0
    },

    // Localization
    localization: {
        supportedLanguages: ['en', 'id', 'zh'],
        defaultLanguage: 'id'
    },

    // UI Settings
    ui: {
        toastDuration: 3000,
        modalAnimationDuration: 300,
        loadingDelay: 500
    },

    // File Upload Settings
    upload: {
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
        allowedExtensions: ['jpg', 'jpeg', 'png', 'pdf']
    },

    // Validation Rules
    validation: {
        username: {
            minLength: 3,
            maxLength: 20,
            pattern: /^[a-zA-Z0-9_]+$/
        },
        password: {
            minLength: 8,
            requireUppercase: true,
            requireLowercase: true,
            requireNumber: true
        },
        phone: {
            pattern: /^(\+62|62|0)[0-9]{9,12}$/
        },
        email: {
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        }
    },

    // Feature Flags
    features: {
        enableNotifications: true,
        enableExport: true,
        enableImport: true,
        enableAdvancedSearch: true,
        enableDarkMode: true
    },

    // Debug Settings
    debug: {
        enabled: window.location.hostname === 'localhost',
        logLevel: 'info', // 'debug', 'info', 'warn', 'error'
        showConsoleMessages: true
    }
};

// Initialize and log configuration
if (AppConfig.debug.enabled && AppConfig.debug.showConsoleMessages) {
    console.log('🌐 Application Configuration Loaded');
    console.log('   App:', AppConfig.app.name, 'v' + AppConfig.app.version);
    console.log('   API URL:', AppConfig.getApiUrl());
    console.log('   Environment:', window.location.hostname === 'localhost' ? 'Development' : 'Production');
}

// Export for use in other modules
window.AppConfig = AppConfig;
