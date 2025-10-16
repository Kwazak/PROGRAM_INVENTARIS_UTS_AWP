-- ============================================
-- Role-Based Access Control (RBAC) System
-- Migration Script
-- Created: October 3, 2025
-- ============================================

-- 1. ROLES TABLE
CREATE TABLE IF NOT EXISTS roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    INDEX idx_name (name),
    INDEX idx_is_system (is_system),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. PERMISSIONS TABLE
CREATE TABLE IF NOT EXISTS permissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    module VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    resource VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_permission (module, action, resource),
    INDEX idx_module (module),
    INDEX idx_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. ROLE_PERMISSIONS TABLE (Many-to-Many)
CREATE TABLE IF NOT EXISTS role_permissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT,
    UNIQUE KEY unique_role_permission (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    INDEX idx_role_id (role_id),
    INDEX idx_permission_id (permission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. USER_ROLES TABLE (Many-to-Many)
CREATE TABLE IF NOT EXISTS user_roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by INT,
    expires_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT 1,
    UNIQUE KEY unique_user_role (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_role_id (role_id),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. ROLE_AUDIT_LOG TABLE
CREATE TABLE IF NOT EXISTS role_audit_log (
    id INT PRIMARY KEY AUTO_INCREMENT,
    role_id INT,
    action VARCHAR(50) NOT NULL, -- created, updated, deleted, permission_added, permission_removed
    changes JSON,
    performed_by INT,
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL,
    FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_role_id (role_id),
    INDEX idx_action (action),
    INDEX idx_performed_at (performed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- INSERT DEFAULT PERMISSIONS
-- ============================================

-- Dashboard Permissions
INSERT INTO permissions (module, action, resource, description) VALUES
('dashboard', 'read', 'overview', 'View dashboard overview'),
('dashboard', 'read', 'analytics', 'View analytics and reports'),
('dashboard', 'read', 'statistics', 'View statistics');

-- User Management Permissions
INSERT INTO permissions (module, action, resource, description) VALUES
('users', 'create', 'user', 'Create new users'),
('users', 'read', 'user', 'View user details'),
('users', 'update', 'user', 'Update user information'),
('users', 'delete', 'user', 'Delete users'),
('users', 'read', 'list', 'View users list'),
('users', 'execute', 'reset_password', 'Reset user password'),
('users', 'execute', 'change_status', 'Activate/deactivate users');

-- Role Management Permissions
INSERT INTO permissions (module, action, resource, description) VALUES
('roles', 'create', 'role', 'Create new roles'),
('roles', 'read', 'role', 'View role details'),
('roles', 'update', 'role', 'Update role information'),
('roles', 'delete', 'role', 'Delete roles'),
('roles', 'read', 'list', 'View roles list'),
('roles', 'update', 'permissions', 'Manage role permissions'),
('roles', 'execute', 'clone', 'Clone existing roles'),
('roles', 'execute', 'assign', 'Assign roles to users');

-- Inventory Permissions
INSERT INTO permissions (module, action, resource, description) VALUES
('inventory', 'create', 'material', 'Add new inventory items'),
('inventory', 'read', 'material', 'View inventory details'),
('inventory', 'update', 'material', 'Update inventory information'),
('inventory', 'delete', 'material', 'Delete inventory items'),
('inventory', 'read', 'list', 'View inventory list'),
('inventory', 'execute', 'adjust_stock', 'Adjust stock quantities'),
('inventory', 'execute', 'transfer', 'Transfer between warehouses'),
('inventory', 'execute', 'export', 'Export inventory data');

-- Product Permissions
INSERT INTO permissions (module, action, resource, description) VALUES
('products', 'create', 'product', 'Create new products'),
('products', 'read', 'product', 'View product details'),
('products', 'update', 'product', 'Update product information'),
('products', 'delete', 'product', 'Delete products'),
('products', 'read', 'list', 'View products list'),
('products', 'create', 'bom', 'Create bill of materials'),
('products', 'update', 'bom', 'Update bill of materials'),
('products', 'execute', 'export', 'Export product data');

-- Production Permissions
INSERT INTO permissions (module, action, resource, description) VALUES
('production', 'create', 'work_order', 'Create work orders'),
('production', 'read', 'work_order', 'View work order details'),
('production', 'update', 'work_order', 'Update work orders'),
('production', 'delete', 'work_order', 'Delete work orders'),
('production', 'read', 'list', 'View work orders list'),
('production', 'execute', 'start', 'Start production'),
('production', 'execute', 'complete', 'Complete production'),
('production', 'execute', 'cancel', 'Cancel work orders');

-- Sales Order Permissions
INSERT INTO permissions (module, action, resource, description) VALUES
('sales_orders', 'create', 'order', 'Create sales orders'),
('sales_orders', 'read', 'order', 'View sales order details'),
('sales_orders', 'update', 'order', 'Update sales orders'),
('sales_orders', 'delete', 'order', 'Delete sales orders'),
('sales_orders', 'read', 'list', 'View sales orders list'),
('sales_orders', 'execute', 'confirm', 'Confirm sales orders'),
('sales_orders', 'execute', 'cancel', 'Cancel sales orders'),
('sales_orders', 'execute', 'complete', 'Complete sales orders');

-- Purchase Order Permissions
INSERT INTO permissions (module, action, resource, description) VALUES
('purchase_orders', 'create', 'order', 'Create purchase orders'),
('purchase_orders', 'read', 'order', 'View purchase order details'),
('purchase_orders', 'update', 'order', 'Update purchase orders'),
('purchase_orders', 'delete', 'order', 'Delete purchase orders'),
('purchase_orders', 'read', 'list', 'View purchase orders list'),
('purchase_orders', 'execute', 'approve', 'Approve purchase orders'),
('purchase_orders', 'execute', 'receive', 'Receive goods'),
('purchase_orders', 'execute', 'cancel', 'Cancel purchase orders');

-- Supplier Permissions
INSERT INTO permissions (module, action, resource, description) VALUES
('suppliers', 'create', 'supplier', 'Add new suppliers'),
('suppliers', 'read', 'supplier', 'View supplier details'),
('suppliers', 'update', 'supplier', 'Update supplier information'),
('suppliers', 'delete', 'supplier', 'Delete suppliers'),
('suppliers', 'read', 'list', 'View suppliers list');

-- Customer Permissions
INSERT INTO permissions (module, action, resource, description) VALUES
('customers', 'create', 'customer', 'Add new customers'),
('customers', 'read', 'customer', 'View customer details'),
('customers', 'update', 'customer', 'Update customer information'),
('customers', 'delete', 'customer', 'Delete customers'),
('customers', 'read', 'list', 'View customers list');

-- Warehouse Permissions
INSERT INTO permissions (module, action, resource, description) VALUES
('warehouse', 'create', 'location', 'Create warehouse locations'),
('warehouse', 'read', 'location', 'View warehouse details'),
('warehouse', 'update', 'location', 'Update warehouse information'),
('warehouse', 'delete', 'location', 'Delete warehouse locations'),
('warehouse', 'read', 'list', 'View warehouse list');

-- Reports Permissions
INSERT INTO permissions (module, action, resource, description) VALUES
('reports', 'read', 'inventory_report', 'View inventory reports'),
('reports', 'read', 'sales_report', 'View sales reports'),
('reports', 'read', 'production_report', 'View production reports'),
('reports', 'read', 'financial_report', 'View financial reports'),
('reports', 'execute', 'export', 'Export reports'),
('reports', 'execute', 'print', 'Print reports');

-- Settings Permissions
INSERT INTO permissions (module, action, resource, description) VALUES
('settings', 'read', 'system', 'View system settings'),
('settings', 'update', 'system', 'Update system settings'),
('settings', 'update', 'company', 'Update company information'),
('settings', 'read', 'audit_log', 'View audit logs');

-- ============================================
-- INSERT DEFAULT ROLES
-- ============================================

-- Super Admin Role
INSERT INTO roles (name, description, is_system, created_by) VALUES
('Super Admin', 'Full system access with all permissions', 1, 1);

SET @super_admin_role_id = LAST_INSERT_ID();

-- Assign ALL permissions to Super Admin
INSERT INTO role_permissions (role_id, permission_id, created_by)
SELECT @super_admin_role_id, id, 1 FROM permissions;

-- Admin Role
INSERT INTO roles (name, description, is_system, created_by) VALUES
('Admin', 'Administrative access to manage users and basic configurations', 1, 1);

SET @admin_role_id = LAST_INSERT_ID();

-- Assign permissions to Admin
INSERT INTO role_permissions (role_id, permission_id, created_by)
SELECT @admin_role_id, id, 1 FROM permissions
WHERE (module = 'users' AND action IN ('create', 'read', 'update', 'execute'))
   OR (module = 'roles' AND action = 'read')
   OR (module = 'dashboard' AND action = 'read')
   OR (module IN ('inventory', 'products', 'production', 'sales_orders', 'purchase_orders') AND action IN ('read', 'update'))
   OR (module IN ('suppliers', 'customers', 'warehouse') AND action IN ('create', 'read', 'update'))
   OR (module = 'reports' AND action = 'read')
   OR (module = 'settings' AND action = 'read');

-- Manager Role
INSERT INTO roles (name, description, is_system, created_by) VALUES
('Manager', 'Supervisory access with approval and review capabilities', 1, 1);

SET @manager_role_id = LAST_INSERT_ID();

-- Assign permissions to Manager
INSERT INTO role_permissions (role_id, permission_id, created_by)
SELECT @manager_role_id, id, 1 FROM permissions
WHERE (module = 'dashboard' AND action = 'read')
   OR (module IN ('inventory', 'products', 'production', 'sales_orders', 'purchase_orders') AND action IN ('read', 'update', 'execute'))
   OR (module IN ('suppliers', 'customers', 'warehouse') AND action IN ('read', 'update'))
   OR (module = 'reports' AND action IN ('read', 'execute'))
   OR (module = 'users' AND action = 'read');

-- Staff Role
INSERT INTO roles (name, description, is_system, created_by) VALUES
('Staff', 'Basic operational access for data entry and daily tasks', 1, 1);

SET @staff_role_id = LAST_INSERT_ID();

-- Assign permissions to Staff
INSERT INTO role_permissions (role_id, permission_id, created_by)
SELECT @staff_role_id, id, 1 FROM permissions
WHERE (module = 'dashboard' AND action = 'read')
   OR (module IN ('inventory', 'products', 'production', 'sales_orders', 'purchase_orders') AND action IN ('create', 'read', 'update'))
   OR (module IN ('suppliers', 'customers', 'warehouse') AND action = 'read')
   OR (module = 'reports' AND action = 'read');

-- Viewer Role
INSERT INTO roles (name, description, is_system, created_by) VALUES
('Viewer', 'Read-only access to view data without modification rights', 1, 1);

SET @viewer_role_id = LAST_INSERT_ID();

-- Assign permissions to Viewer
INSERT INTO role_permissions (role_id, permission_id, created_by)
SELECT @viewer_role_id, id, 1 FROM permissions
WHERE action = 'read';

-- ============================================
-- ASSIGN DEFAULT ROLE TO EXISTING USERS
-- ============================================

-- Assign Super Admin role to user ID 1 (assuming first user is admin)
INSERT INTO user_roles (user_id, role_id, assigned_by) 
VALUES (1, @super_admin_role_id, 1)
ON DUPLICATE KEY UPDATE role_id = role_id;

-- ============================================
-- CREATE VIEWS FOR EASIER QUERYING
-- ============================================

-- View: User Permissions (denormalized)
CREATE OR REPLACE VIEW v_user_permissions AS
SELECT DISTINCT
    u.id as user_id,
    u.username,
    u.full_name,
    r.id as role_id,
    r.name as role_name,
    p.id as permission_id,
    p.module,
    p.action,
    p.resource,
    p.description
FROM users u
INNER JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = 1
INNER JOIN roles r ON ur.role_id = r.id AND r.is_active = 1
INNER JOIN role_permissions rp ON r.id = rp.role_id
INNER JOIN permissions p ON rp.permission_id = p.id;

-- View: Role Summary
CREATE OR REPLACE VIEW v_role_summary AS
SELECT 
    r.id,
    r.name,
    r.description,
    r.is_system,
    r.is_active,
    COUNT(DISTINCT rp.permission_id) as permission_count,
    COUNT(DISTINCT ur.user_id) as user_count,
    r.created_at,
    r.updated_at
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN user_roles ur ON r.id = ur.role_id AND ur.is_active = 1
GROUP BY r.id, r.name, r.description, r.is_system, r.is_active, r.created_at, r.updated_at;

-- ============================================
-- STORED PROCEDURES
-- ============================================

DELIMITER //

-- Procedure: Check if user has permission
CREATE PROCEDURE sp_check_user_permission(
    IN p_user_id INT,
    IN p_module VARCHAR(50),
    IN p_action VARCHAR(50),
    IN p_resource VARCHAR(100)
)
BEGIN
    SELECT COUNT(*) as has_permission
    FROM v_user_permissions
    WHERE user_id = p_user_id
      AND module = p_module
      AND action = p_action
      AND (resource = p_resource OR resource IS NULL);
END //

-- Procedure: Clone role
CREATE PROCEDURE sp_clone_role(
    IN p_source_role_id INT,
    IN p_new_role_name VARCHAR(100),
    IN p_new_role_description TEXT,
    IN p_created_by INT,
    OUT p_new_role_id INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_new_role_id = -1;
    END;
    
    START TRANSACTION;
    
    -- Create new role
    INSERT INTO roles (name, description, is_system, created_by)
    VALUES (p_new_role_name, p_new_role_description, 0, p_created_by);
    
    SET p_new_role_id = LAST_INSERT_ID();
    
    -- Copy permissions
    INSERT INTO role_permissions (role_id, permission_id, created_by)
    SELECT p_new_role_id, permission_id, p_created_by
    FROM role_permissions
    WHERE role_id = p_source_role_id;
    
    COMMIT;
END //

DELIMITER ;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Add composite indexes for common queries
ALTER TABLE role_permissions ADD INDEX idx_role_permission_lookup (role_id, permission_id);
ALTER TABLE user_roles ADD INDEX idx_user_role_active (user_id, role_id, is_active);

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

SELECT 'RBAC System Migration Completed Successfully!' as status;
