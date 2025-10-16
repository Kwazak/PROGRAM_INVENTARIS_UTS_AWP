// User Management JavaScript
let allUsers = [];
let allRoles = [];
let currentFilter = 'all';

// Helper function to fetch API with auth token
async function fetchAPI(endpoint, method = 'GET', body = null) {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        throw new Error('Not authenticated');
    }
    
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };
    
    if (body) {
        options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`/api${endpoint}`, options);
    
    if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login.html';
        throw new Error('Session expired');
    }
    
    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.error || data.message || 'Request failed');
    }
    
    return data;
}

// Load users on page load
document.addEventListener('DOMContentLoaded', async function() {
    await loadRoles();
    await loadUsers();
});

// Load all users
async function loadUsers() {
    try {
        const response = await fetchAPI('/users');
        // Handle both array response and {data: []} response
        allUsers = Array.isArray(response) ? response : (response.data || []);
        renderUsers(allUsers);
    } catch (error) {
        showToast('Failed to load users: ' + error.message, 'error');
        document.getElementById('userList').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Failed to Load Users</h3>
                <p>${error.message}</p>
                <button class="btn btn-primary" onclick="loadUsers()">
                    <i class="fas fa-redo"></i> Try Again
                </button>
            </div>
        `;
    }
}

// Load all roles
async function loadRoles() {
    try {
        const response = await fetchAPI('/roles');
        // Handle both array response and {data: []} response
        allRoles = Array.isArray(response) ? response : (response.data || []);
    } catch (error) {
        console.error('Failed to load roles:', error);
    }
}

// Render users list
function renderUsers(users) {
    const container = document.getElementById('userList');
    
    if (users.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <h3>No Users Found</h3>
                <p>Start by adding a new user to the system</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = users.map(user => `
        <div class="user-card" data-user-id="${user.id}">
            <div class="user-header">
                <div class="user-info">
                    <div class="user-name">
                        <i class="fas fa-user"></i> ${user.username}
                        ${user.is_active ? 
                            '<span class="status-badge status-active">Active</span>' : 
                            '<span class="status-badge status-inactive">Inactive</span>'}
                    </div>
                    <div class="user-email">
                        <i class="fas fa-envelope"></i> ${user.email || 'No email'}
                    </div>
                </div>
            </div>
            
            <div class="user-roles">
                ${user.roles.length > 0 ? 
                    user.roles.map(role => {
                        const roleClass = role.toLowerCase().includes('admin') ? 'admin' : 
                                         role.toLowerCase().includes('manager') ? 'manager' : 
                                         role.toLowerCase().includes('viewer') ? 'viewer' : '';
                        return `<span class="role-badge ${roleClass}">${role}</span>`;
                    }).join('') : 
                    '<span class="role-badge" style="background: #95a5a6;">No Roles</span>'}
            </div>
            
            <div class="user-stats">
                <div class="stat-item">
                    <div class="stat-value">${user.roles.length}</div>
                    <div class="stat-label">Roles</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${user.permission_count || 0}</div>
                    <div class="stat-label">Permissions</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${formatDate(user.created_at, true)}</div>
                    <div class="stat-label">Created</div>
                </div>
            </div>
            
            <div class="user-actions">
                <button class="btn-action btn-edit" onclick="editUser(${user.id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn-action btn-roles" onclick="manageRoles(${user.id})">
                    <i class="fas fa-user-tag"></i> Manage Roles
                </button>
                <button class="btn-action btn-permissions" onclick="viewPermissions(${user.id})">
                    <i class="fas fa-key"></i> Permissions
                </button>
                <button class="btn-action btn-toggle ${!user.is_active ? 'inactive' : ''}" 
                        onclick="toggleUserStatus(${user.id}, ${user.is_active})">
                    <i class="fas fa-power-off"></i> ${user.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button class="btn-action btn-delete" onclick="deleteUser(${user.id}, '${user.username}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

// Show add user modal
function showAddUserModal() {
    document.getElementById('modalTitle').textContent = 'Add New User';
    document.getElementById('userId').value = '';
    document.getElementById('userForm').reset();
    document.getElementById('isActive').checked = true;
    document.getElementById('passwordHint').style.display = 'none';
    
    renderRoleCheckboxes([]);
    
    document.getElementById('userModal').classList.add('show');
}

// Edit user
async function editUser(userId) {
    try {
        const response = await fetchAPI(`/users/${userId}`);
        const user = response.data || response;
        
        document.getElementById('modalTitle').textContent = 'Edit User';
        document.getElementById('userId').value = user.id;
        document.getElementById('username').value = user.username;
        document.getElementById('email').value = user.email || '';
        document.getElementById('password').value = '';
        document.getElementById('isActive').checked = user.is_active;
        document.getElementById('passwordHint').style.display = 'inline';
        
        const userRoleIds = Array.isArray(user.roles) ? user.roles.map(r => r.id || r) : [];
        renderRoleCheckboxes(userRoleIds);
        
        document.getElementById('userModal').classList.add('show');
    } catch (error) {
        showToast('Failed to load user: ' + error.message, 'error');
    }
}

// Render role checkboxes
function renderRoleCheckboxes(selectedRoleIds = []) {
    const container = document.getElementById('roleCheckboxes');
    
    // Ensure allRoles is an array
    if (!Array.isArray(allRoles) || allRoles.length === 0) {
        container.innerHTML = '<p>No roles available. <button onclick="loadRoles()">Reload Roles</button></p>';
        return;
    }
    
    container.innerHTML = allRoles.map(role => `
        <label class="role-checkbox">
            <input type="checkbox" 
                   name="roles" 
                   value="${role.id}" 
                   ${selectedRoleIds.includes(role.id) ? 'checked' : ''}>
            <span><strong>${role.name}</strong> - ${role.description || ''}</span>
        </label>
    `).join('');
}

// Save user (add or edit)
async function saveUser(event) {
    event.preventDefault();
    
    const userId = document.getElementById('userId').value;
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const isActive = document.getElementById('isActive').checked;
    
    // Get selected roles
    const roleCheckboxes = document.querySelectorAll('input[name="roles"]:checked');
    const roleIds = Array.from(roleCheckboxes).map(cb => parseInt(cb.value));
    
    const userData = {
        username,
        email,
        is_active: isActive,
        role_ids: roleIds
    };
    
    // Only include password if it's set (for new users or password change)
    if (password) {
        userData.password = password;
    } else if (!userId) {
        showToast('Password is required for new users', 'error');
        return;
    }
    
    try {
        if (userId) {
            // Update existing user
            await fetchAPI(`/users/${userId}`, 'PUT', userData);
            
            // Update roles separately
            await fetchAPI(`/users/${userId}/roles`, 'POST', { role_ids: roleIds });
            
            showToast('User updated successfully', 'success');
        } else {
            // Create new user
            await fetchAPI('/users', 'POST', userData);
            showToast('User created successfully', 'success');
        }
        
        closeUserModal();
        loadUsers();
    } catch (error) {
        showToast('Failed to save user: ' + error.message, 'error');
    }
}

// Close user modal
function closeUserModal() {
    document.getElementById('userModal').classList.remove('show');
    document.getElementById('userForm').reset();
}

// Manage user roles
async function manageRoles(userId) {
    try {
        const response = await fetchAPI(`/users/${userId}`);
        const user = response.data || response;
        
        document.getElementById('modalTitle').textContent = `Manage Roles for ${user.username}`;
        document.getElementById('userId').value = user.id;
        
        // Hide other fields, only show roles
        document.getElementById('username').value = user.username;
        document.getElementById('email').value = user.email || '';
        document.getElementById('username').disabled = true;
        document.getElementById('email').disabled = true;
        document.getElementById('password').closest('.form-group').style.display = 'none';
        document.getElementById('isActive').closest('.form-group').style.display = 'none';
        
        const userRoleIds = Array.isArray(user.roles) ? user.roles.map(r => r.id || r) : [];
        renderRoleCheckboxes(userRoleIds);
        
        document.getElementById('userModal').classList.add('show');
        
        // Override submit to only update roles
        const form = document.getElementById('userForm');
        form.onsubmit = async (e) => {
            e.preventDefault();
            const roleCheckboxes = document.querySelectorAll('input[name="roles"]:checked');
            const roleIds = Array.from(roleCheckboxes).map(cb => parseInt(cb.value));
            
            try {
                await fetchAPI(`/users/${userId}/roles`, 'POST', { role_ids: roleIds });
                showToast('Roles updated successfully', 'success');
                closeUserModal();
                loadUsers();
                
                // Reset form
                form.onsubmit = saveUser;
                document.getElementById('username').disabled = false;
                document.getElementById('email').disabled = false;
                document.getElementById('password').closest('.form-group').style.display = 'block';
                document.getElementById('isActive').closest('.form-group').style.display = 'block';
            } catch (error) {
                showToast('Failed to update roles: ' + error.message, 'error');
            }
        };
    } catch (error) {
        showToast('Failed to load user: ' + error.message, 'error');
    }
}

// View user permissions
async function viewPermissions(userId) {
    try {
        const userResponse = await fetchAPI(`/users/${userId}`);
        const user = userResponse.data || userResponse;
        
        const permResponse = await fetchAPI(`/users/${userId}/permissions`);
        const permissions = Array.isArray(permResponse) ? permResponse : (permResponse.data || []);
        
        document.getElementById('permissionsTitle').textContent = `Permissions for ${user.username}`;
        
        const container = document.getElementById('permissionsList');
        
        if (permissions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-key"></i>
                    <h3>No Permissions</h3>
                    <p>This user has no permissions assigned via roles</p>
                </div>
            `;
        } else {
            // Group permissions by module
            const grouped = permissions.reduce((acc, perm) => {
                if (!acc[perm.module]) {
                    acc[perm.module] = [];
                }
                acc[perm.module].push(perm);
                return acc;
            }, {});
            
            container.innerHTML = Object.keys(grouped).map(module => `
                <div class="permission-item">
                    <div class="permission-module">
                        <i class="fas fa-folder"></i> ${module.toUpperCase()}
                    </div>
                    ${grouped[module].map(perm => `
                        <div class="permission-details">
                            • ${perm.action}.${perm.resource} - ${perm.description}
                            <br><small style="color: #9b59b6;">Granted by: ${perm.granted_by_roles}</small>
                        </div>
                    `).join('')}
                </div>
            `).join('');
        }
        
        document.getElementById('permissionsModal').classList.add('show');
    } catch (error) {
        showToast('Failed to load permissions: ' + error.message, 'error');
    }
}

// Close permissions modal
function closePermissionsModal() {
    document.getElementById('permissionsModal').classList.remove('show');
}

// Toggle user active status
async function toggleUserStatus(userId, currentStatus) {
    const action = currentStatus ? 'deactivate' : 'activate';
    
    if (!confirm(`Are you sure you want to ${action} this user?`)) {
        return;
    }
    
    try {
        await fetchAPI(`/users/${userId}/toggle-active`, 'PATCH');
        showToast(`User ${action}d successfully`, 'success');
        loadUsers();
    } catch (error) {
        showToast('Failed to update user status: ' + error.message, 'error');
    }
}

// Delete user
async function deleteUser(userId, username) {
    if (!confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
        return;
    }
    
    try {
        await fetchAPI(`/users/${userId}`, 'DELETE');
        showToast('User deleted successfully', 'success');
        loadUsers();
    } catch (error) {
        showToast('Failed to delete user: ' + error.message, 'error');
    }
}

// Filter users
function setFilter(filter) {
    currentFilter = filter;
    
    // Update button states
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
    
    filterUsers();
}

// Filter and search users
function filterUsers() {
    const searchTerm = document.getElementById('userSearchInput').value.toLowerCase();
    
    // Ensure allUsers is an array
    if (!Array.isArray(allUsers)) {
        allUsers = [];
    }
    
    let filtered = allUsers.filter(user => {
        // Search filter
        const matchesSearch = user.username.toLowerCase().includes(searchTerm) || 
                            (user.email && user.email.toLowerCase().includes(searchTerm));
        
        if (!matchesSearch) return false;
        
        // Status/Role filter
        switch (currentFilter) {
            case 'all':
                return true;
            case 'active':
                return user.is_active;
            case 'inactive':
                return !user.is_active;
            case 'admin':
                return user.roles.some(role => role.toLowerCase().includes('admin'));
            case 'viewer':
                return user.roles.some(role => role.toLowerCase().includes('viewer'));
            default:
                return true;
        }
    });
    
    renderUsers(filtered);
}

// Refresh users
function refreshUsers() {
    loadUsers();
    showToast('User list refreshed', 'success');
}

// Helper function to format date
function formatDate(dateString, shortFormat = false) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (shortFormat) {
        return date.toLocaleDateString();
    }
    return date.toLocaleString();
}
