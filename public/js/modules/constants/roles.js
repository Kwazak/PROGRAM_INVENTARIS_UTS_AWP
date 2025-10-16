/**
 * Roles Constants Module
 * Konstanta untuk roles pengguna
 */

const Roles = {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    MANAGER: 'manager',
    STAFF: 'staff',
    VIEWER: 'viewer'
};

const RoleLabels = {
    [Roles.SUPER_ADMIN]: 'Super Admin',
    [Roles.ADMIN]: 'Admin',
    [Roles.MANAGER]: 'Manager',
    [Roles.STAFF]: 'Staff',
    [Roles.VIEWER]: 'Viewer'
};

const RoleDescriptions = {
    [Roles.SUPER_ADMIN]: 'Akses penuh sistem dengan manajemen user',
    [Roles.ADMIN]: 'Akses administratif ke semua modul',
    [Roles.MANAGER]: 'Akses manajemen ke modul yang ditugaskan',
    [Roles.STAFF]: 'Akses operasional untuk tugas harian',
    [Roles.VIEWER]: 'Akses read-only untuk laporan dan data'
};

const RoleHierarchy = {
    [Roles.SUPER_ADMIN]: 5,
    [Roles.ADMIN]: 4,
    [Roles.MANAGER]: 3,
    [Roles.STAFF]: 2,
    [Roles.VIEWER]: 1
};

// Export
window.Roles = Roles;
window.RoleLabels = RoleLabels;
window.RoleDescriptions = RoleDescriptions;
window.RoleHierarchy = RoleHierarchy;
