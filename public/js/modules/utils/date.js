/**
 * Date Utility Module
 * Helper untuk operasi tanggal
 */

const DateUtil = {
    /**
     * Get current date in YYYY-MM-DD format
     */
    getCurrentDate() {
        return new Date().toISOString().split('T')[0];
    },

    /**
     * Get current datetime
     */
    getCurrentDateTime() {
        return new Date().toISOString();
    },

    /**
     * Add days to date
     */
    addDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    },

    /**
     * Subtract days from date
     */
    subtractDays(date, days) {
        return this.addDays(date, -days);
    },

    /**
     * Get difference in days
     */
    daysDifference(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        const diffTime = Math.abs(d2 - d1);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    },

    /**
     * Check if date is past
     */
    isPast(date) {
        return new Date(date) < new Date();
    },

    /**
     * Check if date is future
     */
    isFuture(date) {
        return new Date(date) > new Date();
    },

    /**
     * Check if date is today
     */
    isToday(date) {
        const today = this.getCurrentDate();
        const checkDate = new Date(date).toISOString().split('T')[0];
        return today === checkDate;
    },

    /**
     * Get start of day
     */
    startOfDay(date = new Date()) {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d;
    },

    /**
     * Get end of day
     */
    endOfDay(date = new Date()) {
        const d = new Date(date);
        d.setHours(23, 59, 59, 999);
        return d;
    },

    /**
     * Get first day of month
     */
    firstDayOfMonth(date = new Date()) {
        return new Date(date.getFullYear(), date.getMonth(), 1);
    },

    /**
     * Get last day of month
     */
    lastDayOfMonth(date = new Date()) {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0);
    },

    /**
     * Get relative time (e.g., "2 jam yang lalu")
     */
    relativeTime(date) {
        const now = new Date();
        const past = new Date(date);
        const diffSeconds = Math.floor((now - past) / 1000);

        if (diffSeconds < 60) return 'Baru saja';
        if (diffSeconds < 3600) return Math.floor(diffSeconds / 60) + ' menit yang lalu';
        if (diffSeconds < 86400) return Math.floor(diffSeconds / 3600) + ' jam yang lalu';
        if (diffSeconds < 604800) return Math.floor(diffSeconds / 86400) + ' hari yang lalu';
        if (diffSeconds < 2592000) return Math.floor(diffSeconds / 604800) + ' minggu yang lalu';
        if (diffSeconds < 31536000) return Math.floor(diffSeconds / 2592000) + ' bulan yang lalu';
        return Math.floor(diffSeconds / 31536000) + ' tahun yang lalu';
    },

    /**
     * Parse date string to Date object
     */
    parse(dateString) {
        return new Date(dateString);
    },

    /**
     * Format date for input[type="date"]
     */
    toInputFormat(date) {
        if (!date) return '';
        return new Date(date).toISOString().split('T')[0];
    }
};

// Export
window.DateUtil = DateUtil;
