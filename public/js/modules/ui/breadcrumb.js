/**
 * Breadcrumb Navigation Module
 * Provides consistent breadcrumb navigation across pages
 */

const Breadcrumb = {
    /**
     * Initialize breadcrumb for a page
     */
    init(pageTitle, breadcrumbs = []) {
        // Default breadcrumbs
        const defaultBreadcrumbs = [
            { label: 'Dashboard', href: '/index.html', icon: 'fas fa-home' }
        ];

        // Combine with page-specific breadcrumbs
        const allBreadcrumbs = [...defaultBreadcrumbs, ...breadcrumbs];

        // Add current page if not already included
        if (pageTitle && allBreadcrumbs[allBreadcrumbs.length - 1].label !== pageTitle) {
            allBreadcrumbs.push({ label: pageTitle, active: true });
        }

        this.render(allBreadcrumbs);
    },

    /**
     * Render breadcrumb navigation
     */
    render(breadcrumbs) {
        // Find or create breadcrumb container
        let breadcrumbContainer = document.querySelector('.breadcrumb-container');

        if (!breadcrumbContainer) {
            // Create container after topbar
            const topbar = document.querySelector('.topbar');
            if (topbar) {
                breadcrumbContainer = document.createElement('div');
                breadcrumbContainer.className = 'breadcrumb-container';
                topbar.insertAdjacentElement('afterend', breadcrumbContainer);
            } else {
                console.warn('Breadcrumb: No topbar found to insert breadcrumbs');
                return;
            }
        }

        // Clear existing content
        breadcrumbContainer.innerHTML = '';

        // Create breadcrumb element
        const breadcrumb = document.createElement('nav');
        breadcrumb.className = 'breadcrumb';
        breadcrumb.setAttribute('aria-label', 'Breadcrumb navigation');

        breadcrumbs.forEach((item, index) => {
            const itemElement = document.createElement('div');
            itemElement.className = `breadcrumb-item${item.active ? ' active' : ''}`;

            if (item.icon) {
                const iconElement = document.createElement('i');
                iconElement.className = item.icon;
                itemElement.appendChild(iconElement);
            }

            if (item.href && !item.active) {
                const linkElement = document.createElement('a');
                linkElement.className = 'breadcrumb-link';
                linkElement.href = item.href;
                linkElement.textContent = item.label;
                linkElement.setAttribute('aria-current', index === breadcrumbs.length - 1 ? 'page' : null);
                itemElement.appendChild(linkElement);
            } else {
                const spanElement = document.createElement('span');
                spanElement.textContent = item.label;
                if (item.active) {
                    spanElement.setAttribute('aria-current', 'page');
                }
                itemElement.appendChild(spanElement);
            }

            breadcrumb.appendChild(itemElement);
        });

        breadcrumbContainer.appendChild(breadcrumb);
    },

    /**
     * Update breadcrumb dynamically
     */
    update(breadcrumbs) {
        this.render(breadcrumbs);
    },

    /**
     * Add breadcrumb item
     */
    addItem(item) {
        const currentBreadcrumb = document.querySelector('.breadcrumb');
        if (!currentBreadcrumb) return;

        const items = Array.from(currentBreadcrumb.querySelectorAll('.breadcrumb-item'));
        const lastItem = items[items.length - 1];

        // Remove active state from last item
        if (lastItem) {
            lastItem.classList.remove('active');
            const link = lastItem.querySelector('.breadcrumb-link');
            if (link) {
                const href = link.getAttribute('href');
                if (href) {
                    link.setAttribute('href', href);
                }
            }
        }

        // Add new item
        const newItem = document.createElement('div');
        newItem.className = 'breadcrumb-item active';

        if (item.icon) {
            const iconElement = document.createElement('i');
            iconElement.className = item.icon;
            newItem.appendChild(iconElement);
        }

        const spanElement = document.createElement('span');
        spanElement.textContent = item.label;
        spanElement.setAttribute('aria-current', 'page');
        newItem.appendChild(spanElement);

        currentBreadcrumb.appendChild(newItem);
    },

    /**
     * Predefined breadcrumb configurations for common pages
     */
    configs: {
        dashboard: [
            { label: 'Dashboard', href: '/index.html', icon: 'fas fa-home', active: true }
        ],

        inventory: [
            { label: 'Bahan Baku', href: '/inventory.html', icon: 'fas fa-boxes', active: true }
        ],

        products: [
            { label: 'Produk', href: '/products.html', icon: 'fas fa-shoe-prints', active: true }
        ],

        production: [
            { label: 'Produksi', href: '/production.html', icon: 'fas fa-cogs', active: true }
        ],

        orders: [
            { label: 'Pesanan', href: '/orders.html', icon: 'fas fa-shopping-cart', active: true }
        ],

        suppliers: [
            { label: 'Suppliers', href: '/suppliers.html', icon: 'fas fa-truck', active: true }
        ],

        customers: [
            { label: 'Customers', href: '/customers.html', icon: 'fas fa-users', active: true }
        ],

        reports: [
            { label: 'Laporan', href: '/reports.html', icon: 'fas fa-chart-bar', active: true }
        ],

        'user-management': [
            { label: 'User Management', href: '/user-management.html', icon: 'fas fa-users-cog', active: true }
        ],

        roles: [
            { label: 'Role Management', href: '/roles.html', icon: 'fas fa-shield-alt', active: true }
        ],

        'qc-dashboard': [
            { label: 'QC Dashboard', href: '/qc-dashboard.html', icon: 'fas fa-chart-line', active: true }
        ]
    },

    /**
     * Initialize breadcrumb for current page based on URL
     */
    initFromURL() {
        const path = window.location.pathname;
        const pageName = path.split('/').pop().replace('.html', '') || 'dashboard';

        const config = this.configs[pageName];
        if (config) {
            this.render(config);
        } else {
            // Fallback to dashboard
            this.render(this.configs.dashboard);
        }
    }
};

// Auto-initialize breadcrumb on page load
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure DOM is ready
    setTimeout(() => {
        Breadcrumb.initFromURL();
    }, 100);
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Breadcrumb;
}