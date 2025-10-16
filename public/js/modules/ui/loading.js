/**
 * Loading UI Module
 * Consistent loading states across the application
 */

const LoadingUI = {
    /**
     * Show page loading overlay
     */
    showPageLoading(message = 'Loading...', subtitle = '') {
        // Remove existing overlay
        this.hidePageLoading();

        const overlay = document.createElement('div');
        overlay.className = 'page-loading-overlay show';
        overlay.id = 'pageLoadingOverlay';

        // Check for dark mode
        if (document.documentElement.classList.contains('dark-mode')) {
            overlay.classList.add('dark');
        }

        overlay.innerHTML = `
            <div class="page-loading-content">
                <div class="loading-spinner large"></div>
                <div class="page-loading-text">${message}</div>
                ${subtitle ? `<div class="page-loading-subtitle">${subtitle}</div>` : ''}
            </div>
        `;

        document.body.appendChild(overlay);

        // Prevent interaction
        document.body.style.overflow = 'hidden';
    },

    /**
     * Hide page loading overlay
     */
    hidePageLoading() {
        const overlay = document.getElementById('pageLoadingOverlay');
        if (overlay) {
            overlay.classList.remove('show');
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
                document.body.style.overflow = '';
            }, 300);
        }
    },

    /**
     * Show inline loading in a container
     */
    showInlineLoading(container, message = 'Loading...') {
        if (typeof container === 'string') {
            container = document.querySelector(container);
        }

        if (!container) return;

        // Clear existing loading
        this.hideInlineLoading(container);

        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'inline-loading';
        loadingDiv.id = `inlineLoading_${Math.random().toString(36).substr(2, 9)}`;

        loadingDiv.innerHTML = `
            <div class="loading-spinner"></div>
            <span class="inline-loading-text">${message}</span>
        `;

        container.innerHTML = '';
        container.appendChild(loadingDiv);
        container.classList.add('loading-active');
    },

    /**
     * Hide inline loading from a container
     */
    hideInlineLoading(container) {
        if (typeof container === 'string') {
            container = document.querySelector(container);
        }

        if (!container) return;

        const loadingDiv = container.querySelector('.inline-loading');
        if (loadingDiv) {
            loadingDiv.remove();
        }
        container.classList.remove('loading-active');
    },

    /**
     * Show button loading state
     */
    showButtonLoading(button, loadingText = '') {
        if (typeof button === 'string') {
            button = document.querySelector(button);
        }

        if (!button) return;

        button.classList.add('loading');
        button.disabled = true;

        if (loadingText) {
            button.setAttribute('data-original-text', button.textContent);
            button.textContent = loadingText;
        }
    },

    /**
     * Hide button loading state
     */
    hideButtonLoading(button) {
        if (typeof button === 'string') {
            button = document.querySelector(button);
        }

        if (!button) return;

        button.classList.remove('loading');
        button.disabled = false;

        const originalText = button.getAttribute('data-original-text');
        if (originalText) {
            button.textContent = originalText;
            button.removeAttribute('data-original-text');
        }
    },

    /**
     * Show table loading overlay
     */
    showTableLoading(table) {
        if (typeof table === 'string') {
            table = document.querySelector(table);
        }

        if (!table) return;

        table.classList.add('table-loading');
    },

    /**
     * Hide table loading overlay
     */
    hideTableLoading(table) {
        if (typeof table === 'string') {
            table = document.querySelector(table);
        }

        if (!table) return;

        table.classList.remove('table-loading');
    },

    /**
     * Show form loading state
     */
    showFormLoading(form) {
        if (typeof form === 'string') {
            form = document.querySelector(form);
        }

        if (!form) return;

        form.classList.add('form-loading');
    },

    /**
     * Hide form loading state
     */
    hideFormLoading(form) {
        if (typeof form === 'string') {
            form = document.querySelector(form);
        }

        if (!form) return;

        form.classList.remove('form-loading');
    },

    /**
     * Create skeleton loading elements
     */
    createSkeleton(type = 'text') {
        const skeleton = document.createElement('div');
        skeleton.className = `skeleton skeleton-${type}`;
        return skeleton;
    },

    /**
     * Show progress loading bar
     */
    showProgressLoading(container) {
        if (typeof container === 'string') {
            container = document.querySelector(container);
        }

        if (!container) return;

        const progress = document.createElement('div');
        progress.className = 'progress-loading';
        container.appendChild(progress);

        return progress;
    },

    /**
     * Hide progress loading bar
     */
    hideProgressLoading(container) {
        if (typeof container === 'string') {
            container = document.querySelector(container);
        }

        if (!container) return;

        const progress = container.querySelector('.progress-loading');
        if (progress) {
            progress.remove();
        }
    },

    /**
     * Auto-hide loading after API call
     */
    async withLoading(asyncFn, loadingConfig = {}) {
        const {
            showPage = false,
            showButton = null,
            showInline = null,
            showTable = null,
            showForm = null,
            message = 'Loading...',
            loadingText = ''
        } = loadingConfig;

        try {
            // Show loading
            if (showPage) this.showPageLoading(message);
            if (showButton) this.showButtonLoading(showButton, loadingText);
            if (showInline) this.showInlineLoading(showInline, message);
            if (showTable) this.showTableLoading(showTable);
            if (showForm) this.showFormLoading(showForm);

            // Execute function
            const result = await asyncFn();

            return result;
        } finally {
            // Hide loading
            if (showPage) this.hidePageLoading();
            if (showButton) this.hideButtonLoading(showButton);
            if (showInline) this.hideInlineLoading(showInline);
            if (showTable) this.hideTableLoading(showTable);
            if (showForm) this.hideFormLoading(showForm);
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoadingUI;
}