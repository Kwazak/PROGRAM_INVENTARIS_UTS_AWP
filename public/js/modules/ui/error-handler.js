/**
 * Error Handling Module
 * Consistent error handling and user feedback across the application
 */

const ErrorHandler = {
    /**
     * Handle API errors with appropriate user feedback
     */
    handleAPIError(error, context = '') {
        console.error(`API Error${context ? ` (${context})` : ''}:`, error);

        let message = 'Terjadi kesalahan yang tidak diketahui';
        let type = 'error';

        if (error.response) {
            // Server responded with error status
            const status = error.response.status;
            const data = error.response.data;

            switch (status) {
                case 400:
                    message = data?.message || 'Data yang dikirim tidak valid';
                    type = 'warning';
                    break;
                case 401:
                    message = 'Sesi Anda telah berakhir. Silakan login kembali.';
                    this.handleAuthError();
                    return;
                case 403:
                    message = data?.message || 'Anda tidak memiliki akses untuk melakukan tindakan ini';
                    type = 'warning';
                    break;
                case 404:
                    message = 'Data atau halaman yang dicari tidak ditemukan';
                    type = 'warning';
                    break;
                case 409:
                    message = data?.message || 'Data sudah ada atau konflik dengan data lain';
                    type = 'warning';
                    break;
                case 422:
                    message = 'Data yang dikirim tidak dapat diproses';
                    type = 'warning';
                    break;
                case 500:
                    message = 'Terjadi kesalahan pada server. Silakan coba lagi nanti.';
                    break;
                default:
                    message = data?.message || `Kesalahan server (${status})`;
            }
        } else if (error.request) {
            // Network error
            message = 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
            type = 'error';
        } else {
            // Other error
            message = error.message || 'Terjadi kesalahan yang tidak diketahui';
        }

        this.showError(message, type);
    },

    /**
     * Handle authentication errors
     */
    handleAuthError() {
        // Clear stored auth data
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Show message and redirect
        this.showError('Sesi Anda telah berakhir. Mengalihkan ke halaman login...', 'warning');

        setTimeout(() => {
            window.location.href = '/login.html';
        }, 2000);
    },

    /**
     * Handle form validation errors
     */
    handleValidationError(errors, formElement = null) {
        if (Array.isArray(errors)) {
            errors.forEach(error => {
                this.showError(error.message || error, 'warning');
            });
        } else if (typeof errors === 'object') {
            Object.values(errors).forEach(errorMessages => {
                if (Array.isArray(errorMessages)) {
                    errorMessages.forEach(message => {
                        this.showError(message, 'warning');
                    });
                } else {
                    this.showError(errorMessages, 'warning');
                }
            });
        } else {
            this.showError(errors, 'warning');
        }

        // Focus on first invalid field if form element provided
        if (formElement) {
            const firstInvalidField = formElement.querySelector('.is-invalid, [aria-invalid="true"]');
            if (firstInvalidField) {
                firstInvalidField.focus();
                firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    },

    /**
     * Handle network errors
     */
    handleNetworkError() {
        this.showError('Koneksi internet terputus. Silakan periksa koneksi Anda dan coba lagi.', 'error');
    },

    /**
     * Show error message to user
     */
    showError(message, type = 'error') {
        if (window.ToastUI) {
            window.ToastUI.show(message, type);
        } else if (window.showToast) {
            window.showToast(message, type);
        } else {
            alert(message);
        }
    },

    /**
     * Show success message
     */
    showSuccess(message) {
        this.showError(message, 'success');
    },

    /**
     * Show warning message
     */
    showWarning(message) {
        this.showError(message, 'warning');
    },

    /**
     * Show info message
     */
    showInfo(message) {
        this.showError(message, 'info');
    },

    /**
     * Wrap async function with error handling
     */
    async withErrorHandling(asyncFn, options = {}) {
        const {
            showLoading = false,
            loadingMessage = 'Memproses...',
            successMessage = null,
            errorMessage = null,
            context = ''
        } = options;

        try {
            if (showLoading && window.LoadingUI) {
                window.LoadingUI.showPageLoading(loadingMessage);
            }

            const result = await asyncFn();

            if (successMessage) {
                this.showSuccess(successMessage);
            }

            return result;
        } catch (error) {
            const message = errorMessage || error.message;
            this.handleAPIError(error, context);
            throw error; // Re-throw for caller to handle if needed
        } finally {
            if (showLoading && window.LoadingUI) {
                window.LoadingUI.hidePageLoading();
            }
        }
    },

    /**
     * Validate form data
     */
    validateForm(formData, rules) {
        const errors = {};

        Object.keys(rules).forEach(field => {
            const value = formData[field];
            const fieldRules = rules[field];

            if (fieldRules.required && (!value || value.toString().trim() === '')) {
                errors[field] = `${fieldRules.label || field} wajib diisi`;
                return;
            }

            if (value && fieldRules.minLength && value.length < fieldRules.minLength) {
                errors[field] = `${fieldRules.label || field} minimal ${fieldRules.minLength} karakter`;
                return;
            }

            if (value && fieldRules.maxLength && value.length > fieldRules.maxLength) {
                errors[field] = `${fieldRules.label || field} maksimal ${fieldRules.maxLength} karakter`;
                return;
            }

            if (value && fieldRules.pattern && !fieldRules.pattern.test(value)) {
                errors[field] = fieldRules.message || `${fieldRules.label || field} format tidak valid`;
                return;
            }

            if (value && fieldRules.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                errors[field] = `${fieldRules.label || field} harus berupa email yang valid`;
                return;
            }
        });

        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    },

    /**
     * Highlight form field with error
     */
    highlightFieldError(fieldElement, errorMessage) {
        if (!fieldElement) return;

        fieldElement.classList.add('is-invalid');
        fieldElement.setAttribute('aria-invalid', 'true');

        // Remove existing error message
        const existingError = fieldElement.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }

        // Add error message
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.textContent = errorMessage;
        errorElement.style.cssText = `
            color: var(--danger, #ef4444);
            font-size: 12px;
            margin-top: 4px;
            display: block;
        `;

        fieldElement.parentNode.appendChild(errorElement);
    },

    /**
     * Clear field error highlighting
     */
    clearFieldError(fieldElement) {
        if (!fieldElement) return;

        fieldElement.classList.remove('is-invalid');
        fieldElement.removeAttribute('aria-invalid');

        const errorElement = fieldElement.parentNode.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorHandler;
}