// Factory Inventory System - Main JavaScript

// API_URL: Use from config.js if available, otherwise use static URL
if (typeof API_URL === 'undefined') {
    var API_URL = 'http://localhost:3000/api';
}

// Get token from localStorage
function getToken() {
    return localStorage.getItem('token');
}

// Get user from localStorage
function getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

// Check if user is logged in
function checkAuth() {
    const token = getToken();
    if (!token) {
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

// Fetch API with authentication
async function fetchAPI(endpoint, options = {}) {
    const token = getToken();
    
    console.log(`📡 Fetching: ${endpoint}`);
    console.log(`🔑 Token: ${token ? 'Present (length: ' + token.length + ')' : 'Missing'}`);
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers
        });

        console.log(`📥 Response status for ${endpoint}: ${response.status}`);

        // Try to parse JSON
        let data;
        try {
            data = await response.json();
            console.log(`📦 Response data for ${endpoint}:`, data);
        } catch (parseError) {
            console.error(`❌ Failed to parse JSON for ${endpoint}:`, parseError);
            return null;
        }

        // Check if token is invalid (401 or 403)
        if (response.status === 401 || response.status === 403) {
            console.error(`🚫 Authentication failed for ${endpoint}: ${response.status}`);
            console.error(`🚫 Response message:`, data.message);

            if (window.ErrorHandler) {
                window.ErrorHandler.handleAuthError();
            } else {
                // Fallback
                alert(`Session expired or access denied: ${data.message || 'Please login again'}`);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login.html';
            }
            return null;
        }

        return data;
    } catch (error) {
        console.error(`❌ API Error for ${endpoint}:`, error);
        if (window.ErrorHandler) {
            window.ErrorHandler.handleAPIError(error, endpoint);
        } else {
            // Fallback
            ToastUI.show('Terjadi kesalahan saat menghubungi server', 'error');
        }
        return null;
    }
}

// Show toast notification (legacy function for backward compatibility)
function showToast(message, type = 'info') {
    ToastUI.show(message, type);
}

// Add animations
const mainStyle = document.createElement('style');
mainStyle.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(mainStyle);

// Toggle sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const menuToggle = document.querySelector('.menu-toggle');
    
    sidebar.classList.toggle('active');
    
    // Handle overlay for mobile
    if (overlay) {
        if (sidebar.classList.contains('active')) {
            overlay.classList.add('active');
        } else {
            overlay.classList.remove('active');
        }
    }
    
    // Update menu toggle button state
    if (menuToggle) {
        if (sidebar.classList.contains('active')) {
            menuToggle.classList.add('active');
        } else {
            menuToggle.classList.remove('active');
        }
    }
    
    // Close sidebar when clicking outside on mobile
    if (sidebar.classList.contains('active')) {
        setTimeout(() => {
            document.addEventListener('click', closeSidebarOnClickOutside);
        }, 0);
    } else {
        document.removeEventListener('click', closeSidebarOnClickOutside);
    }
}

// Close sidebar when clicking outside
function closeSidebarOnClickOutside(event) {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const menuToggle = document.querySelector('.menu-toggle');
    
    if (sidebar && menuToggle &&
        !sidebar.contains(event.target) && 
        !menuToggle.contains(event.target)) {
        sidebar.classList.remove('active');
        if (overlay) {
            overlay.classList.remove('active');
        }
        if (menuToggle) {
            menuToggle.classList.remove('active');
        }
        document.removeEventListener('click', closeSidebarOnClickOutside);
    }
    
    // Close sidebar when clicking overlay
    if (overlay && event.target === overlay) {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
        if (menuToggle) {
            menuToggle.classList.remove('active');
        }
        document.removeEventListener('click', closeSidebarOnClickOutside);
    }
}

// Logout function
function logout() {
    if (confirm('Apakah Anda yakin ingin logout?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login.html';
    }
}

// Format currency
function formatCurrency(amount) {
    // Handle null, undefined, NaN, and empty string
    if (amount === null || amount === undefined || amount === '' || isNaN(amount)) {
        amount = 0;
    }
    // Convert to number if it's a string
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(numAmount || 0);
}

// Format date
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Format datetime
function formatDateTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Get status badge HTML
function getStatusBadge(status) {
    const statusMap = {
        'active': 'badge-success',
        'completed': 'badge-success',
        'delivered': 'badge-success',
        'passed': 'badge-success',
        'paid': 'badge-success',
        
        'pending': 'badge-warning',
        'in_progress': 'badge-warning',
        'processing': 'badge-warning',
        'partial': 'badge-warning',
        
        'cancelled': 'badge-danger',
        'failed': 'badge-danger',
        'rejected': 'badge-danger',
        'inactive': 'badge-danger',
        
        'draft': 'badge-secondary',
        'on_hold': 'badge-secondary'
    };

    const badgeClass = statusMap[status] || 'badge-info';
    const displayText = status ? status.replace(/_/g, ' ').toUpperCase() : '-';
    
    return `<span class="badge-status ${badgeClass}">${displayText}</span>`;
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication for all pages except login
    if (!window.location.pathname.endsWith('login.html')) {
        if (!checkAuth()) return;

        // Load user info
        const user = getUser();
        if (user) {
            const userNameEl = document.getElementById('userName');
            const userRoleEl = document.getElementById('userRole');
            
            if (userNameEl) userNameEl.textContent = user.full_name || user.username;
            if (userRoleEl) userRoleEl.textContent = user.role || '';
        }
        
        // Apply role-based permissions (hide/show menu items, buttons, etc)
        if (typeof applyPermissions === 'function') {
            applyPermissions();
        }
    }

    // Highlight active nav item
    const currentPath = window.location.pathname;
    document.querySelectorAll('.nav-item').forEach(item => {
        if (item.getAttribute('href') === currentPath) {
            item.classList.add('active');
        }
    });
});

// Export functions for use in other scripts
window.API_URL = API_URL;
window.fetchAPI = fetchAPI;
window.showToast = showToast;
window.formatCurrency = formatCurrency;
window.formatDate = formatDate;
window.formatDateTime = formatDateTime;
window.getStatusBadge = getStatusBadge;
window.toggleSidebar = toggleSidebar;
window.logout = logout;

// Load UI modules
import('./modules/ui/loading.js').then(module => {
    window.LoadingUI = module.LoadingUI;
}).catch(err => console.error('Failed to load LoadingUI:', err));

import('./modules/ui/toast.js').then(module => {
    window.ToastUI = module.ToastUI;
}).catch(err => console.error('Failed to load ToastUI:', err));

import('./modules/ui/error-handler.js').then(module => {
    window.ErrorHandler = module.ErrorHandler;
}).catch(err => console.error('Failed to load ErrorHandler:', err));

import('./modules/ui/breadcrumb.js').then(module => {
    window.Breadcrumb = module.Breadcrumb;
}).catch(err => console.error('Failed to load Breadcrumb:', err));

import('./modules/utils/performance.js').then(module => {
    window.Performance = module.Performance;
}).catch(err => console.error('Failed to load Performance:', err));
