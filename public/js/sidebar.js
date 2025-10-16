/**
 * Sidebar Navigation Component
 * Loads and manages the sidebar navigation for all pages
 */

function loadSidebar(activePage = '') {
    const sidebarElement = document.getElementById('sidebar');
    if (!sidebarElement) return;
    
    // Get user info from localStorage
    const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
    const userName = userInfo.full_name || userInfo.username || 'User';
    const userRole = userInfo.role_name || 'User';
    const userAvatar = userInfo.avatar || '';
    
    // Generate avatar/initials
    const avatarHTML = userAvatar 
        ? `<img src="${userAvatar}" alt="${userName}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">`
        : `<div style="width: 40px; height: 40px; border-radius: 50%; background: var(--primary-color); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700;">${userName.charAt(0).toUpperCase()}</div>`;
    
    const sidebarHTML = `
        <!-- Sidebar Header -->
        <div class="sidebar-header">
            <div class="sidebar-brand">
                <span class="sidebar-brand-icon">🏭</span>
                <span class="sidebar-brand-text">Factory Inventory</span>
            </div>
        </div>
        
        <!-- Sidebar Navigation -->
        <nav class="sidebar-nav">
            <ul class="sidebar-menu">
                <li class="sidebar-menu-item ${activePage === 'dashboard' ? 'active' : ''}">
                    <a href="/dashboard.html" class="sidebar-menu-link">
                        <span class="sidebar-menu-icon">📊</span>
                        <span class="sidebar-menu-text">Dashboard</span>
                    </a>
                </li>
                
                <!-- Master Data -->
                <li class="sidebar-menu-header">Master Data</li>
                
                <li class="sidebar-menu-item ${activePage === 'products' ? 'active' : ''}">
                    <a href="/products.html" class="sidebar-menu-link">
                        <span class="sidebar-menu-icon">📦</span>
                        <span class="sidebar-menu-text">Products</span>
                    </a>
                </li>
                
                <li class="sidebar-menu-item ${activePage === 'materials' ? 'active' : ''}">
                    <a href="/materials.html" class="sidebar-menu-link">
                        <span class="sidebar-menu-icon">🧱</span>
                        <span class="sidebar-menu-text">Raw Materials</span>
                    </a>
                </li>
                
                <li class="sidebar-menu-item ${activePage === 'bom' ? 'active' : ''}">
                    <a href="/bom.html" class="sidebar-menu-link">
                        <span class="sidebar-menu-icon">📋</span>
                        <span class="sidebar-menu-text">Bill of Materials</span>
                    </a>
                </li>
                
                <li class="sidebar-menu-item ${activePage === 'customers' ? 'active' : ''}">
                    <a href="/customers.html" class="sidebar-menu-link">
                        <span class="sidebar-menu-icon">👥</span>
                        <span class="sidebar-menu-text">Customers</span>
                    </a>
                </li>
                
                <!-- Operations -->
                <li class="sidebar-menu-header">Operations</li>
                
                <li class="sidebar-menu-item ${activePage === 'sales-orders' ? 'active' : ''}">
                    <a href="/sales-orders.html" class="sidebar-menu-link">
                        <span class="sidebar-menu-icon">🛒</span>
                        <span class="sidebar-menu-text">Sales Orders</span>
                    </a>
                </li>
                
                <li class="sidebar-menu-item ${activePage === 'work-orders' ? 'active' : ''}">
                    <a href="/work-orders.html" class="sidebar-menu-link">
                        <span class="sidebar-menu-icon">⚙️</span>
                        <span class="sidebar-menu-text">Work Orders</span>
                    </a>
                </li>
                
                <li class="sidebar-menu-item ${activePage === 'shipments' ? 'active' : ''}">
                    <a href="/shipments.html" class="sidebar-menu-link">
                        <span class="sidebar-menu-icon">🚚</span>
                        <span class="sidebar-menu-text">Shipments</span>
                    </a>
                </li>
                
                <!-- Inventory -->
                <li class="sidebar-menu-header">Inventory</li>
                
                <li class="sidebar-menu-item ${activePage === 'stock-movement' ? 'active' : ''}">
                    <a href="/stock-movement.html" class="sidebar-menu-link">
                        <span class="sidebar-menu-icon">📊</span>
                        <span class="sidebar-menu-text">Stock Movement</span>
                    </a>
                </li>
                
                <!-- Reports -->
                <li class="sidebar-menu-header">Reports</li>
                
                <li class="sidebar-menu-item ${activePage === 'reports' ? 'active' : ''}">
                    <a href="/reports.html" class="sidebar-menu-link">
                        <span class="sidebar-menu-icon">📈</span>
                        <span class="sidebar-menu-text">Reports</span>
                    </a>
                </li>
                
                <!-- Admin -->
                <li class="sidebar-menu-header">System</li>
                
                <li class="sidebar-menu-item ${activePage === 'users' ? 'active' : ''}">
                    <a href="/users.html" class="sidebar-menu-link">
                        <span class="sidebar-menu-icon">👤</span>
                        <span class="sidebar-menu-text">Users</span>
                    </a>
                </li>
                
                <li class="sidebar-menu-item ${activePage === 'roles' ? 'active' : ''}">
                    <a href="/roles.html" class="sidebar-menu-link">
                        <span class="sidebar-menu-icon">🔐</span>
                        <span class="sidebar-menu-text">Roles & Permissions</span>
                    </a>
                </li>
            </ul>
        </nav>
        
        <!-- Sidebar Footer -->
        <div class="sidebar-footer">
            <div class="sidebar-user">
                <div class="sidebar-user-avatar">
                    ${avatarHTML}
                </div>
                <div class="sidebar-user-info">
                    <div class="sidebar-user-name">${userName}</div>
                    <div class="sidebar-user-role">${userRole}</div>
                </div>
                <div class="sidebar-user-actions">
                    <a href="/profile.html" class="sidebar-user-action" title="Profile">
                        ⚙️
                    </a>
                    <a href="#" onclick="logoutUser(); return false;" class="sidebar-user-action" title="Logout">
                        🚪
                    </a>
                </div>
            </div>
        </div>
    `;
    
    sidebarElement.innerHTML = sidebarHTML;
}

// Logout function
function logoutUser() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login.html';
    }
}

// Mobile sidebar toggle
document.addEventListener('DOMContentLoaded', () => {
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar?.classList.toggle('show');
            overlay?.classList.toggle('show');
        });
    }
    
    if (overlay) {
        overlay.addEventListener('click', () => {
            sidebar?.classList.remove('show');
            overlay?.classList.remove('show');
        });
    }
});
