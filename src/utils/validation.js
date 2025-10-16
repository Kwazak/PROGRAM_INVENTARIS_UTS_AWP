/**
 * Validation Utility
 * Common validation functions
 */

class ValidationUtil {
    /**
     * Validate email format
     */
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validate phone number (Indonesian format)
     */
    static isValidPhone(phone) {
        const phoneRegex = /^(\+62|62|0)[0-9]{9,12}$/;
        return phoneRegex.test(phone);
    }

    /**
     * Validate password strength
     */
    static isStrongPassword(password) {
        // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        return passwordRegex.test(password);
    }

    /**
     * Validate username
     */
    static isValidUsername(username) {
        // 3-20 characters, alphanumeric and underscore only
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        return usernameRegex.test(username);
    }

    /**
     * Sanitize string input
     */
    static sanitizeString(str) {
        if (typeof str !== 'string') return str;
        return str.trim().replace(/[<>]/g, '');
    }

    /**
     * Validate date format (YYYY-MM-DD)
     */
    static isValidDate(dateString) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(dateString)) return false;
        
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date);
    }

    /**
     * Validate positive number
     */
    static isPositiveNumber(value) {
        const num = Number(value);
        return !isNaN(num) && num > 0;
    }

    /**
     * Validate non-negative number
     */
    static isNonNegativeNumber(value) {
        const num = Number(value);
        return !isNaN(num) && num >= 0;
    }

    /**
     * Validate required fields
     */
    static validateRequired(data, requiredFields) {
        const errors = {};
        
        requiredFields.forEach(field => {
            if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
                errors[field] = `${field} is required`;
            }
        });
        
        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }

    /**
     * Validate enum value
     */
    static isValidEnum(value, allowedValues) {
        return allowedValues.includes(value);
    }
}

module.exports = ValidationUtil;
