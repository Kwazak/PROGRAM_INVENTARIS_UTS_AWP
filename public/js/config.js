// Configuration file for Factory Inventory System

// API Configuration - Dynamic URL based on current hostname
// This allows the app to work on both localhost and remote access (IP address)
const hostname = window.location.hostname;
const protocol = window.location.protocol;
const port = '3000'; // API server port

// Build API URL dynamically
const API_BASE_URL = `${protocol}//${hostname}:${port}`;
var API_URL = `${API_BASE_URL}/api`;

console.log('🌐 API Configuration:');
console.log('   Current URL:', window.location.href);
console.log('   Hostname:', hostname);
console.log('   API URL:', API_URL);

// App Version
const APP_VERSION = '1.0.0';

// Date formats
const DATE_FORMAT = {
    short: 'DD/MM/YYYY',
    long: 'DD MMMM YYYY',
    time: 'HH:mm:ss'
};

// Pagination
const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// Currency
const DEFAULT_CURRENCY = 'IDR';
const CURRENCY_SYMBOL = 'Rp';

// Supported languages
const SUPPORTED_LANGUAGES = ['en', 'id', 'zh'];
const DEFAULT_LANGUAGE = 'id';

// Toast notification duration (ms)
const TOAST_DURATION = 3000;

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        APP_VERSION,
        DATE_FORMAT,
        DEFAULT_PAGE_SIZE,
        PAGE_SIZE_OPTIONS,
        DEFAULT_CURRENCY,
        CURRENCY_SYMBOL,
        SUPPORTED_LANGUAGES,
        DEFAULT_LANGUAGE,
        TOAST_DURATION
    };
}
