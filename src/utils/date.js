/**
 * Date Utility
 * Helper functions for date operations
 */

class DateUtil {
    /**
     * Get current date in YYYY-MM-DD format
     */
    static getCurrentDate() {
        return new Date().toISOString().split('T')[0];
    }

    /**
     * Get current datetime in MySQL format
     */
    static getCurrentDateTime() {
        return new Date().toISOString().slice(0, 19).replace('T', ' ');
    }

    /**
     * Format date to YYYY-MM-DD
     */
    static formatDate(date) {
        if (!date) return null;
        const d = new Date(date);
        return d.toISOString().split('T')[0];
    }

    /**
     * Format datetime to readable string
     */
    static formatDateTime(date) {
        if (!date) return null;
        return new Date(date).toLocaleString('id-ID', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    /**
     * Add days to date
     */
    static addDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }

    /**
     * Get date difference in days
     */
    static getDaysDifference(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        const diffTime = Math.abs(d2 - d1);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    /**
     * Check if date is in the past
     */
    static isPast(date) {
        return new Date(date) < new Date();
    }

    /**
     * Check if date is in the future
     */
    static isFuture(date) {
        return new Date(date) > new Date();
    }

    /**
     * Get start of day
     */
    static getStartOfDay(date = new Date()) {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d;
    }

    /**
     * Get end of day
     */
    static getEndOfDay(date = new Date()) {
        const d = new Date(date);
        d.setHours(23, 59, 59, 999);
        return d;
    }

    /**
     * Get first day of month
     */
    static getFirstDayOfMonth(date = new Date()) {
        return new Date(date.getFullYear(), date.getMonth(), 1);
    }

    /**
     * Get last day of month
     */
    static getLastDayOfMonth(date = new Date()) {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0);
    }
}

module.exports = DateUtil;
