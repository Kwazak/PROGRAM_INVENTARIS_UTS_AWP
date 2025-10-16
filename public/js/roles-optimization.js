/**
 * Roles Management - Optimized Script
 * Includes: Search, Filter, Pagination, Export, Bulk Actions
 */

// Configuration
const ITEMS_PER_PAGE = 10;
let currentPage = 1;
let totalPages = 1;
let allRolesData = [];
let filteredRoles = [];

// Initialize enhanced features
document.addEventListener('DOMContentLoaded', () => {
    initializeEnhancedFeatures();
});

function initializeEnhancedFeatures() {
    // Add search and filter controls
    addSearchAndFilterUI();
    
    // Add pagination controls
    addPaginationUI();
    
    // Add export button
    addExportButton();
    
    // Add bulk selection
    enableBulkSelection();
    
    // Add performance monitoring
    monitorPerformance();
}

function addSearchAndFilterUI() {
    const actionButtons = document.querySelector('.action-buttons');
    
    const searchHTML = `
        <div class="search-filter-container" style="margin-top: 15px; display: flex; gap: 10px; align-items: center;">
            <div class="form-group" style="flex: 1; margin: 0;">
                <div class="search-box">
                    <i class="fas fa-search"></i>
                    <input type="text" 
                           id="roleSearch" 
                           placeholder="Search roles by name or description..." 
                           style="width: 100%; padding: 10px 10px 10px 35px; border: 1px solid #ddd; border-radius: 4px;">
                </div>
            </div>
            <div class="form-group" style="margin: 0;">
                <select id="typeFilter" 
                        style="padding: 10px; border: 1px solid #ddd; border-radius: 4px; min-width: 150px;">
                    <option value="">All Types</option>
                    <option value="system">System Roles</option>
                    <option value="custom">Custom Roles</option>
                </select>
            </div>
            <div class="form-group" style="margin: 0;">
                <select id="statusFilter" 
                        style="padding: 10px; border: 1px solid #ddd; border-radius: 4px; min-width: 150px;">
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
            </div>
        </div>
    `;
    
    actionButtons.insertAdjacentHTML('afterend', searchHTML);
    
    // Add event listeners
    document.getElementById('roleSearch').addEventListener('input', debounce(applyFilters, 300));
    document.getElementById('typeFilter').addEventListener('change', applyFilters);
    document.getElementById('statusFilter').addEventListener('change', applyFilters);
}

function addPaginationUI() {
    const contentWrapper = document.querySelector('.content-wrapper');
    
    const paginationHTML = `
        <div class="pagination-container" style="margin-top: 20px; display: flex; justify-content: space-between; align-items: center;">
            <div class="pagination-info">
                <span id="paginationInfo">Showing 0 of 0 roles</span>
            </div>
            <div class="pagination-controls">
                <button id="prevPage" class="btn btn-sm btn-secondary" onclick="changePage(-1)">
                    <i class="fas fa-chevron-left"></i> Previous
                </button>
                <span id="pageNumbers" style="margin: 0 15px;"></span>
                <button id="nextPage" class="btn btn-sm btn-secondary" onclick="changePage(1)">
                    Next <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        </div>
    `;
    
    // Insert after the roles table card
    const card = document.querySelector('.card');
    card.insertAdjacentHTML('afterend', paginationHTML);
}

function addExportButton() {
    const actionButtons = document.querySelector('.action-buttons');
    
    const exportButton = `
        <button class="btn btn-success" onclick="exportRoles()">
            <i class="fas fa-file-export"></i> Export to CSV
        </button>
    `;
    
    actionButtons.insertAdjacentHTML('beforeend', exportButton);
}

function enableBulkSelection() {
    // Will be implemented for bulk operations
    console.log('Bulk selection enabled');
}

// Enhanced loadRoles with caching
let rolesCache = null;
let rolesCacheTime = null;
const CACHE_DURATION = 30000; // 30 seconds

async function loadRolesOptimized() {
    const now = Date.now();
    
    // Use cache if available and fresh
    if (rolesCache && rolesCacheTime && (now - rolesCacheTime < CACHE_DURATION)) {
        console.log('Using cached roles data');
        allRolesData = rolesCache;
        applyFilters();
        return;
    }
    
    try {
        const startTime = performance.now();
        
        const response = await fetch(`${API_URL}/roles`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        
        const loadTime = performance.now() - startTime;
        console.log(`Roles loaded in ${loadTime.toFixed(2)}ms`);
        
        if (result.success) {
            allRolesData = result.data;
            rolesCache = result.data;
            rolesCacheTime = now;
            applyFilters();
        } else {
            showError('Error loading roles: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Failed to load roles');
    }
}

function applyFilters() {
    const searchTerm = document.getElementById('roleSearch')?.value.toLowerCase() || '';
    const typeFilter = document.getElementById('typeFilter')?.value || '';
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    
    filteredRoles = allRolesData.filter(role => {
        // Search filter
        const matchesSearch = role.name.toLowerCase().includes(searchTerm) || 
                            (role.description && role.description.toLowerCase().includes(searchTerm));
        
        // Type filter
        const matchesType = !typeFilter || 
                           (typeFilter === 'system' && role.is_system) ||
                           (typeFilter === 'custom' && !role.is_system);
        
        // Status filter
        const matchesStatus = !statusFilter ||
                             (statusFilter === 'active' && role.is_active) ||
                             (statusFilter === 'inactive' && !role.is_active);
        
        return matchesSearch && matchesType && matchesStatus;
    });
    
    // Reset to first page
    currentPage = 1;
    updatePagination();
    displayPaginatedRoles();
}

function updatePagination() {
    totalPages = Math.ceil(filteredRoles.length / ITEMS_PER_PAGE);
    
    const start = (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const end = Math.min(currentPage * ITEMS_PER_PAGE, filteredRoles.length);
    
    const infoElement = document.getElementById('paginationInfo');
    if (infoElement) {
        infoElement.textContent = `Showing ${start}-${end} of ${filteredRoles.length} roles`;
    }
    
    // Update page numbers
    const pageNumbersElement = document.getElementById('pageNumbers');
    if (pageNumbersElement) {
        let pageHTML = '';
        
        // Show max 5 page numbers
        const maxPages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxPages / 2));
        let endPage = Math.min(totalPages, startPage + maxPages - 1);
        
        if (endPage - startPage < maxPages - 1) {
            startPage = Math.max(1, endPage - maxPages + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            const active = i === currentPage ? 'active' : '';
            pageHTML += `<button class="btn btn-sm ${active}" onclick="goToPage(${i})" style="margin: 0 2px;">${i}</button>`;
        }
        
        pageNumbersElement.innerHTML = pageHTML;
    }
    
    // Enable/disable prev/next buttons
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = currentPage === totalPages || totalPages === 0;
}

function displayPaginatedRoles() {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const paginatedRoles = filteredRoles.slice(start, end);
    
    displayRoles(paginatedRoles);
}

function changePage(direction) {
    const newPage = currentPage + direction;
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        updatePagination();
        displayPaginatedRoles();
    }
}

function goToPage(page) {
    currentPage = page;
    updatePagination();
    displayPaginatedRoles();
}

function exportRoles() {
    if (filteredRoles.length === 0) {
        alert('No roles to export');
        return;
    }
    
    // Prepare CSV data
    const headers = ['Name', 'Description', 'Type', 'Permissions Count', 'Users Count', 'Status'];
    const rows = filteredRoles.map(role => [
        role.name,
        role.description || '',
        role.is_system ? 'System' : 'Custom',
        role.permission_count,
        role.user_count,
        role.is_active ? 'Active' : 'Inactive'
    ]);
    
    // Create CSV content
    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
        csv += row.map(field => `"${field}"`).join(',') + '\n';
    });
    
    // Download file
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roles_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    console.log(`Exported ${filteredRoles.length} roles to CSV`);
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showError(message) {
    alert(message);
}

function monitorPerformance() {
    // Log performance metrics
    if (window.performance && window.performance.memory) {
        console.log('Memory Usage:', {
            used: (window.performance.memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
            total: (window.performance.memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB'
        });
    }
}

// Override original loadRoles to use optimized version
if (typeof loadRoles !== 'undefined') {
    const originalLoadRoles = loadRoles;
    loadRoles = loadRolesOptimized;
}

console.log('✅ Roles Management Optimization Loaded');
