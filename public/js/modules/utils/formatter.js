/**
 * Formatter Utility Module
 * Helper untuk formatting data
 */

const FormatterUtil = {
    /**
     * Format currency (Indonesian Rupiah)
     */
    currency(amount) {
        if (amount === null || amount === undefined) return 'Rp 0';
        
        return new Intl.NumberFormat(AppConfig.currency.locale, {
            style: 'currency',
            currency: AppConfig.currency.code,
            minimumFractionDigits: AppConfig.currency.decimalPlaces,
            maximumFractionDigits: AppConfig.currency.decimalPlaces
        }).format(amount);
    },

    /**
     * Format number with thousand separator
     */
    number(num) {
        if (num === null || num === undefined) return '0';
        return new Intl.NumberFormat(AppConfig.currency.locale).format(num);
    },

    /**
     * Format date
     */
    date(dateString, format = 'short') {
        if (!dateString) return '-';
        
        const date = new Date(dateString);
        if (isNaN(date)) return '-';

        const options = {
            short: { year: 'numeric', month: '2-digit', day: '2-digit' },
            long: { year: 'numeric', month: 'long', day: 'numeric' },
            time: { hour: '2-digit', minute: '2-digit', second: '2-digit' },
            datetime: { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }
        };

        return date.toLocaleString(AppConfig.currency.locale, options[format] || options.short);
    },

    /**
     * Format datetime
     */
    datetime(dateString) {
        return this.date(dateString, 'datetime');
    },

    /**
     * Format time
     */
    time(dateString) {
        return this.date(dateString, 'time');
    },

    /**
     * Format phone number
     */
    phone(phoneNumber) {
        if (!phoneNumber) return '-';
        
        // Format: 0812-3456-7890
        const cleaned = phoneNumber.replace(/\D/g, '');
        const match = cleaned.match(/^(\d{4})(\d{4})(\d{4})$/);
        
        if (match) {
            return match[1] + '-' + match[2] + '-' + match[3];
        }
        
        return phoneNumber;
    },

    /**
     * Format percentage
     */
    percentage(value, decimals = 0) {
        if (value === null || value === undefined) return '0%';
        return value.toFixed(decimals) + '%';
    },

    /**
     * Format file size
     */
    fileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    },

    /**
     * Truncate string
     */
    truncate(str, maxLength = 50, suffix = '...') {
        if (!str || str.length <= maxLength) return str;
        return str.substring(0, maxLength - suffix.length) + suffix;
    },

    /**
     * Capitalize first letter
     */
    capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    },

    /**
     * Title case
     */
    titleCase(str) {
        if (!str) return '';
        return str.split(' ')
            .map(word => this.capitalize(word))
            .join(' ');
    },

    /**
     * Format status with badge
     */
    statusBadge(status) {
        const color = OrderStatusColors[status] || '#6b7280';
        const label = OrderStatusLabels[status] || status;
        
        return `<span class="badge" style="background-color: ${color}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px;">${label}</span>`;
    }
};

// Export
window.FormatterUtil = FormatterUtil;
