/**
 * String Utility
 * Helper functions for string operations
 */

class StringUtil {
    /**
     * Generate random string
     */
    static randomString(length = 10) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    /**
     * Generate random numeric string
     */
    static randomNumeric(length = 6) {
        const chars = '0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    /**
     * Capitalize first letter
     */
    static capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    /**
     * Convert to title case
     */
    static toTitleCase(str) {
        if (!str) return '';
        return str.split(' ')
            .map(word => this.capitalize(word))
            .join(' ');
    }

    /**
     * Convert to slug
     */
    static toSlug(str) {
        if (!str) return '';
        return str.toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    }

    /**
     * Truncate string
     */
    static truncate(str, maxLength = 100, suffix = '...') {
        if (!str || str.length <= maxLength) return str;
        return str.substring(0, maxLength - suffix.length) + suffix;
    }

    /**
     * Remove special characters
     */
    static removeSpecialChars(str) {
        if (!str) return '';
        return str.replace(/[^a-zA-Z0-9\s]/g, '');
    }

    /**
     * Format currency (Indonesian Rupiah)
     */
    static formatCurrency(amount) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    }

    /**
     * Format number with thousands separator
     */
    static formatNumber(num) {
        return new Intl.NumberFormat('id-ID').format(num);
    }

    /**
     * Parse currency string to number
     */
    static parseCurrency(str) {
        if (typeof str === 'number') return str;
        return parseFloat(str.replace(/[^0-9.-]+/g, '')) || 0;
    }

    /**
     * Generate auto number (e.g., INV-20231201-001)
     */
    static generateAutoNumber(prefix, date, sequence) {
        const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
        const seqStr = sequence.toString().padStart(3, '0');
        return `${prefix}-${dateStr}-${seqStr}`;
    }

    /**
     * Extract numbers from string
     */
    static extractNumbers(str) {
        const matches = str.match(/\d+/g);
        return matches ? matches.join('') : '';
    }

    /**
     * Check if string is empty or whitespace
     */
    static isEmpty(str) {
        return !str || str.trim().length === 0;
    }
}

module.exports = StringUtil;
