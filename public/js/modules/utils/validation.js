/**
 * Validation Utility Module
 * Helper untuk validasi input
 */

const ValidationUtil = {
    /**
     * Validate email
     */
    isValidEmail(email) {
        const pattern = AppConfig.validation.email.pattern;
        return pattern.test(email);
    },

    /**
     * Validate phone number (Indonesian)
     */
    isValidPhone(phone) {
        const pattern = AppConfig.validation.phone.pattern;
        return pattern.test(phone);
    },

    /**
     * Validate password strength
     */
    isStrongPassword(password) {
        const rules = AppConfig.validation.password;
        
        if (password.length < rules.minLength) {
            return { valid: false, message: `Password minimal ${rules.minLength} karakter` };
        }

        if (rules.requireUppercase && !/[A-Z]/.test(password)) {
            return { valid: false, message: 'Password harus mengandung huruf besar' };
        }

        if (rules.requireLowercase && !/[a-z]/.test(password)) {
            return { valid: false, message: 'Password harus mengandung huruf kecil' };
        }

        if (rules.requireNumber && !/\d/.test(password)) {
            return { valid: false, message: 'Password harus mengandung angka' };
        }

        return { valid: true, message: 'Password valid' };
    },

    /**
     * Validate username
     */
    isValidUsername(username) {
        const rules = AppConfig.validation.username;
        
        if (username.length < rules.minLength || username.length > rules.maxLength) {
            return { valid: false, message: `Username harus ${rules.minLength}-${rules.maxLength} karakter` };
        }

        if (!rules.pattern.test(username)) {
            return { valid: false, message: 'Username hanya boleh alfanumerik dan underscore' };
        }

        return { valid: true, message: 'Username valid' };
    },

    /**
     * Validate required fields
     */
    validateRequired(data, requiredFields) {
        const errors = {};
        
        requiredFields.forEach(field => {
            if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
                errors[field] = `${field} wajib diisi`;
            }
        });

        return {
            valid: Object.keys(errors).length === 0,
            errors
        };
    },

    /**
     * Validate positive number
     */
    isPositiveNumber(value) {
        const num = Number(value);
        return !isNaN(num) && num > 0;
    },

    /**
     * Validate non-negative number
     */
    isNonNegativeNumber(value) {
        const num = Number(value);
        return !isNaN(num) && num >= 0;
    },

    /**
     * Validate date format (YYYY-MM-DD)
     */
    isValidDate(dateString) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(dateString)) return false;
        
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date);
    },

    /**
     * Validate file size
     */
    isValidFileSize(file) {
        return file.size <= AppConfig.upload.maxSize;
    },

    /**
     * Validate file type
     */
    isValidFileType(file) {
        return AppConfig.upload.allowedTypes.includes(file.type);
    },

    /**
     * Sanitize string (remove HTML tags)
     */
    sanitize(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
};

// Export
window.ValidationUtil = ValidationUtil;
