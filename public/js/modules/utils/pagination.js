/**
 * Pagination Utility Module
 * Reusable pagination system for all tables
 */

class PaginationManager {
    constructor(options = {}) {
        this.currentPage = options.currentPage || 1;
        this.itemsPerPage = options.itemsPerPage || 10;
        this.totalItems = options.totalItems || 0;
        this.containerId = options.containerId;
        this.onPageChange = options.onPageChange || (() => {});
        this.data = [];

        if (this.containerId) {
            this.initContainer();
        }
    }

    setData(data) {
        this.data = data || [];
        this.totalItems = this.data.length;
        this.currentPage = Math.min(this.currentPage, this.getTotalPages());
        this.currentPage = Math.max(1, this.currentPage);
        this.render();
    }

    getCurrentPageItems() {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        return this.data.slice(startIndex, endIndex);
    }

    getTotalPages() {
        return Math.ceil(this.totalItems / this.itemsPerPage);
    }

    setPage(page) {
        const totalPages = this.getTotalPages();
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            this.render();
            this.onPageChange();
        }
    }

    nextPage() {
        if (this.currentPage < this.getTotalPages()) {
            this.setPage(this.currentPage + 1);
        }
    }

    prevPage() {
        if (this.currentPage > 1) {
            this.setPage(this.currentPage - 1);
        }
    }

    initContainer() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="pagination-controls">
                <button class="pagination-btn pagination-prev" onclick="this.closest('.pagination-container').pagination.prevPage()">
                    <i class="fas fa-chevron-left"></i> Previous
                </button>

                <div class="pagination-pages"></div>

                <button class="pagination-btn pagination-next" onclick="this.closest('.pagination-container').pagination.nextPage()">
                    Next <i class="fas fa-chevron-right"></i>
                </button>
            </div>

            <div class="pagination-info">
                <span class="pagination-text"></span>
            </div>
        `;

        // Store reference to this pagination instance
        container.pagination = this;
    }

    render() {
        if (!this.containerId) return;

        const container = document.getElementById(this.containerId);
        if (!container) return;

        const totalPages = this.getTotalPages();
        const startItem = (this.currentPage - 1) * this.itemsPerPage + 1;
        const endItem = Math.min(this.currentPage * this.itemsPerPage, this.totalItems);

        // Update page buttons
        const pagesContainer = container.querySelector('.pagination-pages');
        if (pagesContainer) {
            pagesContainer.innerHTML = this.generatePageButtons();
        }

        // Update info text
        const infoText = container.querySelector('.pagination-text');
        if (infoText) {
            infoText.textContent = `Showing ${startItem}-${endItem} of ${this.totalItems} items`;
        }

        // Update button states
        const prevBtn = container.querySelector('.pagination-prev');
        const nextBtn = container.querySelector('.pagination-next');

        if (prevBtn) {
            prevBtn.disabled = this.currentPage <= 1;
            prevBtn.classList.toggle('disabled', this.currentPage <= 1);
        }

        if (nextBtn) {
            nextBtn.disabled = this.currentPage >= totalPages;
            nextBtn.classList.toggle('disabled', this.currentPage >= totalPages);
        }
    }

    generatePageButtons() {
        const totalPages = this.getTotalPages();
        let buttons = [];

        // Always show first page
        if (totalPages > 1) {
            buttons.push(this.createPageButton(1));
        }

        // Calculate range around current page
        let startPage = Math.max(2, this.currentPage - 2);
        let endPage = Math.min(totalPages - 1, this.currentPage + 2);

        // Add ellipsis if needed
        if (startPage > 2) {
            buttons.push('<span class="pagination-ellipsis">...</span>');
        }

        // Add pages in range
        for (let i = startPage; i <= endPage; i++) {
            buttons.push(this.createPageButton(i));
        }

        // Add ellipsis if needed
        if (endPage < totalPages - 1) {
            buttons.push('<span class="pagination-ellipsis">...</span>');
        }

        // Always show last page
        if (totalPages > 1) {
            buttons.push(this.createPageButton(totalPages));
        }

        return buttons.join('');
    }

    createPageButton(page) {
        const isActive = page === this.currentPage;
        return `<button class="pagination-btn pagination-page ${isActive ? 'active' : ''}"
                        onclick="this.closest('.pagination-container').pagination.setPage(${page})">
                    ${page}
                </button>`;
    }
}

// Utility functions for table pagination
const PaginationUtils = {
    createPagination(containerId, options = {}) {
        return new PaginationManager({
            containerId,
            ...options
        });
    },

    initTablePagination(tableId, data, options = {}) {
        const pagination = new PaginationManager(options);
        pagination.setData(data);

        // Update table when page changes
        pagination.onPageChange = () => {
            const tbody = document.querySelector(`#${tableId} tbody`);
            if (tbody && options.renderRow) {
                const currentItems = pagination.getCurrentPageItems();
                tbody.innerHTML = currentItems.map(options.renderRow).join('');
            }
        };

        return pagination;
    }
};

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PaginationManager, PaginationUtils };
}