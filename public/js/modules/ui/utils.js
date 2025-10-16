/**
 * UI Utility Module
 * General UI helper functions
 */

const UIUtil = {
    /**
     * Show toast (alias to ToastUI)
     */
    showToast(message, type = 'info') {
        ToastUI.show(message, type);
    },

    /**
     * Show loading indicator
     */
    showLoading(element = document.body, message = 'Loading...') {
        const loadingId = 'global-loading-indicator';
        
        // Remove existing loading
        const existing = document.getElementById(loadingId);
        if (existing) existing.remove();

        const loading = document.createElement('div');
        loading.id = loadingId;
        loading.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; gap: 15px;">
                <div class="spinner"></div>
                <div style="color: #666;">${message}</div>
            </div>
        `;
        
        loading.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 99999;
        `;

        // Add spinner styles
        const uiUtilStyle = document.createElement('style');
        uiUtilStyle.textContent = `
            .spinner {
                width: 40px;
                height: 40px;
                border: 4px solid #f3f3f3;
                border-top: 4px solid #3b82f6;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(uiUtilStyle);

        document.body.appendChild(loading);
        return loading;
    },

    /**
     * Hide loading indicator
     */
    hideLoading() {
        const loading = document.getElementById('global-loading-indicator');
        if (loading) {
            loading.remove();
        }
    },

    /**
     * Confirm dialog
     */
    confirm(message, title = 'Konfirmasi') {
        return new Promise((resolve) => {
            const result = window.confirm(`${title}\n\n${message}`);
            resolve(result);
        });
    },

    /**
     * Alert dialog
     */
    alert(message, title = 'Pemberitahuan') {
        window.alert(`${title}\n\n${message}`);
    },

    /**
     * Disable element
     */
    disable(element) {
        if (element) {
            element.disabled = true;
            element.style.opacity = '0.6';
            element.style.cursor = 'not-allowed';
        }
    },

    /**
     * Enable element
     */
    enable(element) {
        if (element) {
            element.disabled = false;
            element.style.opacity = '1';
            element.style.cursor = 'pointer';
        }
    },

    /**
     * Show element
     */
    show(element) {
        if (element) {
            element.style.display = 'block';
        }
    },

    /**
     * Hide element
     */
    hide(element) {
        if (element) {
            element.style.display = 'none';
        }
    },

    /**
     * Toggle element visibility
     */
    toggle(element) {
        if (element) {
            element.style.display = element.style.display === 'none' ? 'block' : 'none';
        }
    },

    /**
     * Scroll to top
     */
    scrollToTop(smooth = true) {
        window.scrollTo({
            top: 0,
            behavior: smooth ? 'smooth' : 'auto'
        });
    },

    /**
     * Scroll to element
     */
    scrollToElement(element, offset = 0) {
        if (element) {
            const top = element.getBoundingClientRect().top + window.pageYOffset - offset;
            window.scrollTo({
                top: top,
                behavior: 'smooth'
            });
        }
    },

    /**
     * Copy to clipboard
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('Berhasil disalin ke clipboard', 'success');
            return true;
        } catch (error) {
            console.error('Failed to copy:', error);
            this.showToast('Gagal menyalin ke clipboard', 'error');
            return false;
        }
    },

    /**
     * Debounce function
     */
    debounce(func, wait = 300) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Throttle function
     */
    throttle(func, limit = 300) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
};

// Export
window.UIUtil = UIUtil;
