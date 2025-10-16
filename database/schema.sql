-- ========================================
-- FACTORY INVENTORY DATABASE SCHEMA
-- Sistem Inventaris Pabrik Sendal & Boot
-- Combined from all migration files
-- ========================================

CREATE DATABASE IF NOT EXISTS factory_inventory;
USE factory_inventory;

-- ========================================
-- USER MANAGEMENT
-- ========================================

CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'production_manager', 'warehouse_manager', 'purchasing', 'sales', 'finance', 'operator') NOT NULL,
    phone VARCHAR(20),
    avatar VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ========================================
-- BAHAN BAKU & INVENTORY
-- ========================================

CREATE TABLE raw_material_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE suppliers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    supplier_code VARCHAR(50) UNIQUE NOT NULL,
    company_name VARCHAR(200) NOT NULL,
    contact_person VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Indonesia',
    payment_terms VARCHAR(100),
    lead_time_days INT DEFAULT 7,
    rating DECIMAL(3,2) DEFAULT 0,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE raw_materials (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sku_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    category_id INT,
    description TEXT,
    unit VARCHAR(20) NOT NULL,
    unit_price DECIMAL(15,2) DEFAULT 0,
    min_stock INT DEFAULT 0,
    current_stock INT DEFAULT 0,
    warehouse_location VARCHAR(100),
    supplier_id INT,
    expiry_date DATE NULL,
    image_url VARCHAR(255),
    status ENUM('active', 'discontinued') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES raw_material_categories(id) ON DELETE SET NULL,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
);

CREATE TABLE stock_movements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    material_id INT NOT NULL,
    movement_type ENUM('in', 'out', 'adjustment', 'transfer') NOT NULL,
    quantity INT NOT NULL,
    unit VARCHAR(20),
    reference_type VARCHAR(50),
    reference_id INT,
    from_warehouse VARCHAR(100),
    to_warehouse VARCHAR(100),
    batch_number VARCHAR(50),
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (material_id) REFERENCES raw_materials(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ========================================
-- PURCHASE ORDERS
-- ========================================

CREATE TABLE purchase_orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    po_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id INT NOT NULL,
    order_date DATE NOT NULL,
    expected_delivery DATE,
    status ENUM('draft', 'submitted', 'approved', 'partial_received', 'received', 'cancelled') DEFAULT 'draft',
    subtotal DECIMAL(15,2) DEFAULT 0,
    tax DECIMAL(15,2) DEFAULT 0,
    shipping_cost DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0,
    notes TEXT,
    created_by INT,
    approved_by INT,
    approved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE purchase_order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    po_id INT NOT NULL,
    material_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(15,2) DEFAULT 0,
    subtotal DECIMAL(15,2) DEFAULT 0,
    received_quantity INT DEFAULT 0,
    FOREIGN KEY (po_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (material_id) REFERENCES raw_materials(id) ON DELETE CASCADE
);

CREATE TABLE goods_receipts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    receipt_number VARCHAR(50) UNIQUE NOT NULL,
    po_id INT NOT NULL,
    receipt_date DATE NOT NULL,
    received_by INT,
    qc_status ENUM('pending', 'passed', 'failed', 'partial') DEFAULT 'pending',
    qc_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (po_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (received_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ========================================
-- PRODUK & BOM
-- ========================================

CREATE TABLE product_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    type ENUM('sendal', 'boot') NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sku_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    category_id INT,
    type ENUM('sendal', 'boot') NOT NULL,
    description TEXT,
    size VARCHAR(20),
    color VARCHAR(50),
    weight DECIMAL(10,2) DEFAULT 0,
    unit_price DECIMAL(15,2) DEFAULT 0,
    wholesale_price DECIMAL(15,2) DEFAULT 0,
    current_stock INT DEFAULT 0,
    min_stock INT DEFAULT 0,
    image_url VARCHAR(255),
    barcode VARCHAR(100),
    status ENUM('active', 'discontinued') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES product_categories(id) ON DELETE SET NULL
);

CREATE TABLE bill_of_materials (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    material_id INT NOT NULL,
    quantity_required DECIMAL(10,3) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    notes TEXT,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (material_id) REFERENCES raw_materials(id) ON DELETE CASCADE
);

-- ========================================
-- PRODUKSI
-- ========================================

CREATE TABLE production_lines (
    id INT PRIMARY KEY AUTO_INCREMENT,
    line_code VARCHAR(50) UNIQUE NOT NULL,
    line_name VARCHAR(100) NOT NULL,
    type ENUM('sendal', 'boot') NOT NULL,
    capacity_per_day INT DEFAULT 0,
    status ENUM('active', 'maintenance', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE work_orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    wo_number VARCHAR(50) UNIQUE NOT NULL,
    product_id INT NOT NULL,
    quantity_planned INT NOT NULL,
    quantity_produced INT DEFAULT 0,
    quantity_good INT DEFAULT 0,
    quantity_reject INT DEFAULT 0,
    production_line_id INT,
    status ENUM('pending', 'in_progress', 'completed', 'cancelled', 'on_hold') DEFAULT 'pending',
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    start_date DATE,
    due_date DATE,
    completion_date DATE NULL,
    shift ENUM('pagi', 'siang', 'malam'),
    operator_id INT,
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (production_line_id) REFERENCES production_lines(id) ON DELETE SET NULL,
    FOREIGN KEY (operator_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE production_tracking (
    id INT PRIMARY KEY AUTO_INCREMENT,
    wo_id INT NOT NULL,
    tracking_date DATE NOT NULL,
    quantity_produced INT DEFAULT 0,
    quantity_good INT DEFAULT 0,
    quantity_reject INT DEFAULT 0,
    reject_reason TEXT,
    operator_id INT,
    shift ENUM('pagi', 'siang', 'malam'),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wo_id) REFERENCES work_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (operator_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE quality_control (
    id INT PRIMARY KEY AUTO_INCREMENT,
    wo_id INT NOT NULL,
    qc_date DATE NOT NULL,
    inspector_id INT,
    sample_size INT DEFAULT 0,
    passed_count INT DEFAULT 0,
    failed_count INT DEFAULT 0,
    defect_type VARCHAR(100),
    defect_description TEXT,
    qc_result ENUM('passed', 'failed', 'conditional') NOT NULL,
    action_taken TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wo_id) REFERENCES work_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (inspector_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ========================================
-- SALES & CUSTOMER
-- ========================================

CREATE TABLE customers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_code VARCHAR(50) UNIQUE NOT NULL,
    company_name VARCHAR(200),
    contact_person VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    province VARCHAR(100),
    postal_code VARCHAR(10),
    customer_type ENUM('retail', 'wholesale', 'distributor') DEFAULT 'retail',
    credit_limit DECIMAL(15,2) DEFAULT 0,
    payment_terms VARCHAR(100),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE sales_orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    so_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INT NOT NULL,
    order_date DATE NOT NULL,
    delivery_date DATE,
    status ENUM('pending', 'confirmed', 'processing', 'packed', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    subtotal DECIMAL(15,2) DEFAULT 0,
    discount DECIMAL(15,2) DEFAULT 0,
    tax DECIMAL(15,2) DEFAULT 0,
    shipping_cost DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0,
    payment_status ENUM('unpaid', 'partial', 'paid') DEFAULT 'unpaid',
    payment_method VARCHAR(50),
    shipping_address TEXT,
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE sales_order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    so_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(15,2) DEFAULT 0,
    discount DECIMAL(15,2) DEFAULT 0,
    subtotal DECIMAL(15,2) DEFAULT 0,
    FOREIGN KEY (so_id) REFERENCES sales_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE shipments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    shipment_number VARCHAR(50) UNIQUE NOT NULL,
    so_id INT NOT NULL,
    shipment_date DATE NOT NULL,
    courier VARCHAR(100),
    tracking_number VARCHAR(100),
    shipping_cost DECIMAL(15,2) DEFAULT 0,
    estimated_delivery DATE,
    actual_delivery DATE NULL,
    status ENUM('pending', 'in_transit', 'delivered', 'returned') DEFAULT 'pending',
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (so_id) REFERENCES sales_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ========================================
-- FINANCIAL
-- ========================================

CREATE TABLE payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    payment_number VARCHAR(50) UNIQUE NOT NULL,
    reference_type ENUM('sales_order', 'purchase_order') NOT NULL,
    reference_id INT NOT NULL,
    payment_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    payment_method VARCHAR(50),
    bank_name VARCHAR(100),
    account_number VARCHAR(50),
    transaction_id VARCHAR(100),
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE expenses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    expense_date DATE NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    amount DECIMAL(15,2) NOT NULL,
    payment_method VARCHAR(50),
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ========================================
-- NOTIFICATIONS & LOGS
-- ========================================

CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT,
    link VARCHAR(255),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE activity_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    module VARCHAR(50) NOT NULL,
    description TEXT,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

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

-- ================================================
-- QC (Quality Control) Module Database Tables
-- Factory Inventory System
-- Date: 2025-10-12
-- ================================================

-- Table: qc_inspections
-- Stores QC inspection records from production
CREATE TABLE IF NOT EXISTS `qc_inspections` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `production_tracking_id` INT NULL,
  `work_order_id` INT NULL,
  `product_id` INT NULL,
  `product_model` VARCHAR(100) NULL,
  `wo_number` VARCHAR(50) NULL,
  `shift` VARCHAR(20) NULL COMMENT 'Shift 1, Shift 2, Shift 3',
  `inspector_name` VARCHAR(100) NULL,
  `inspection_date` DATE NOT NULL,
  `total_inspected` INT NOT NULL DEFAULT 0 COMMENT 'Jumlah total yang diperiksa',
  `total_defect` INT NOT NULL DEFAULT 0 COMMENT 'Jumlah total cacat',
  `defect_rate` DECIMAL(5,2) NOT NULL DEFAULT 0.00 COMMENT 'Persentase cacat',
  `decision` ENUM('PASS', 'REWORK', 'REJECT') NOT NULL DEFAULT 'PASS',
  `notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX `idx_inspection_date` (`inspection_date`),
  INDEX `idx_product_id` (`product_id`),
  INDEX `idx_wo_id` (`work_order_id`),
  INDEX `idx_production_tracking` (`production_tracking_id`),
  INDEX `idx_shift` (`shift`),
  INDEX `idx_decision` (`decision`),
  
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`work_order_id`) REFERENCES `work_orders`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`production_tracking_id`) REFERENCES `production_tracking`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='QC Inspection Records';

-- Table: qc_defects
-- Stores detailed defect information for each inspection
CREATE TABLE IF NOT EXISTS `qc_defects` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `inspection_id` INT NOT NULL,
  `category` VARCHAR(50) NOT NULL COMMENT 'UPPER, SOLE, FINISHING, OTHERS',
  `defect_name` VARCHAR(100) NOT NULL,
  `quantity` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX `idx_inspection_id` (`inspection_id`),
  INDEX `idx_category` (`category`),
  INDEX `idx_defect_name` (`defect_name`),
  
  FOREIGN KEY (`inspection_id`) REFERENCES `qc_inspections`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='QC Defect Details';

-- Add qc_count column to production_tracking table if not exists
ALTER TABLE `production_tracking`
ADD COLUMN IF NOT EXISTS `qc_count` INT DEFAULT 0 COMMENT 'Jumlah QC inspection untuk tracking ini';

-- ============================================
-- QC INSPECTION SYSTEM - INTEGRATED MIGRATION
-- Database: factory_inventory
-- Date: 2025-10-10
-- ============================================

-- ============================================
-- ALTER production_tracking table
-- Add column to track QC inspections count
-- ============================================
ALTER TABLE production_tracking 
ADD COLUMN IF NOT EXISTS qc_inspections_count INT DEFAULT 0 
COMMENT 'Jumlah QC inspection yang sudah dibuat untuk tracking ini';

-- ========================================
-- INDEXES untuk Performance
-- ========================================

CREATE INDEX idx_materials_sku ON raw_materials(sku_code);
CREATE INDEX idx_materials_category ON raw_materials(category_id);
CREATE INDEX idx_products_sku ON products(sku_code);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_wo_status ON work_orders(status);
CREATE INDEX idx_wo_product ON work_orders(product_id);
CREATE INDEX idx_so_status ON sales_orders(status);
CREATE INDEX idx_so_customer ON sales_orders(customer_id);
CREATE INDEX idx_stock_material ON stock_movements(material_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_logs_user ON activity_logs(user_id);

-- ========================================
-- INSERT DEFAULT DATA
-- ========================================

-- Default Admin User (password: admin123)
INSERT INTO users (username, email, password, full_name, role, phone) VALUES
('admin', 'admin@factory.com', '$2a$10$XOPbrlUPQdwdJUpSrIF6X.LbE14qsMmKGhM02N8W0PPvF.v8dn.1m', 'Administrator', 'admin', '081234567890');

-- Raw Material Categories
INSERT INTO raw_material_categories (name, description) VALUES
('Karet', 'Bahan karet untuk sol sendal dan boot'),
('EVA Foam', 'Bahan foam untuk cushioning'),
('Kulit', 'Kulit sintetis dan asli untuk boot'),
('Tali & Strap', 'Tali dan strap untuk sendal'),
('Lem & Adhesive', 'Perekat untuk produksi'),
('Komponen Logam', 'Buckle, eyelet, dan komponen logam lainnya'),
('Packaging', 'Kardus dan material packaging'),
('Label & Sticker', 'Label produk dan stiker');

-- Product Categories
INSERT INTO product_categories (name, type, description) VALUES
('Sandal Jepit', 'sendal', 'Sandal jepit casual'),
('Sandal Gunung', 'sendal', 'Sandal untuk outdoor dan hiking'),
('Sandal Hotel', 'sendal', 'Sandal untuk hotel dan spa'),
('Safety Boots', 'boot', 'Sepatu safety untuk industri'),
('Fashion Boots', 'boot', 'Sepatu boot fashion'),
('Military Boots', 'boot', 'Sepatu boot untuk militer dan security');

-- Production Lines
INSERT INTO production_lines (line_code, line_name, type, capacity_per_day) VALUES
('LINE-S01', 'Sendal Production Line 1', 'sendal', 500),
('LINE-S02', 'Sendal Production Line 2', 'sendal', 500),
('LINE-B01', 'Boot Assembly Line 1', 'boot', 200),
('LINE-B02', 'Boot Assembly Line 2', 'boot', 200);

-- Sample Suppliers
INSERT INTO suppliers (supplier_code, company_name, contact_person, email, phone, city, payment_terms) VALUES
('SUP001', 'PT Karet Indonesia', 'Budi Santoso', 'budi@karet.com', '081234567891', 'Jakarta', 'Net 30'),
('SUP002', 'CV Foam Sejahtera', 'Siti Aminah', 'siti@foam.com', '081234567892', 'Bandung', 'Net 30'),
('SUP003', 'PT Kulit Leather', 'Ahmad Rifai', 'ahmad@leather.com', '081234567893', 'Surabaya', 'Net 45');

-- Sample Raw Materials
INSERT INTO raw_materials (sku_code, name, category_id, unit, unit_price, min_stock, current_stock, supplier_id) VALUES
('MAT00001', 'Karet Sol Hitam', 1, 'kg', 25000, 100, 500, 1),
('MAT00002', 'Karet Sol Putih', 1, 'kg', 27000, 100, 450, 1),
('MAT00003', 'EVA Foam 10mm', 2, 'lembar', 15000, 50, 200, 2),
('MAT00004', 'EVA Foam 15mm', 2, 'lembar', 18000, 50, 180, 2),
('MAT00005', 'Kulit Sintetis Hitam', 3, 'meter', 50000, 30, 150, 3),
('MAT00006', 'Kulit Asli Coklat', 3, 'meter', 150000, 20, 80, 3),
('MAT00007', 'Strap Nilon', 4, 'meter', 3000, 200, 800, 1),
('MAT00008', 'Lem PU', 5, 'liter', 45000, 20, 100, 2);

-- Sample Products
INSERT INTO products (sku_code, name, category_id, type, size, color, unit_price, wholesale_price, min_stock, current_stock) VALUES
('PRD00001', 'Sandal Jepit Classic', 1, 'sendal', '39', 'Hitam', 35000, 28000, 50, 200),
('PRD00002', 'Sandal Jepit Classic', 1, 'sendal', '40', 'Hitam', 35000, 28000, 50, 180),
('PRD00003', 'Sandal Gunung Adventure', 2, 'sendal', '39', 'Coklat', 150000, 120000, 30, 100),
('PRD00004', 'Sandal Gunung Adventure', 2, 'sendal', '40', 'Coklat', 150000, 120000, 30, 90),
('PRD00005', 'Safety Boot Steel Toe', 4, 'boot', '39', 'Hitam', 350000, 280000, 20, 50),
('PRD00006', 'Safety Boot Steel Toe', 4, 'boot', '40', 'Hitam', 350000, 280000, 20, 45);

-- Sample Customers
INSERT INTO customers (customer_code, company_name, contact_person, email, phone, city, customer_type) VALUES
('CUST001', 'Toko Sepatu Maju', 'Andi Wijaya', 'andi@tokosepatu.com', '081234567894', 'Jakarta', 'wholesale'),
('CUST002', 'CV Retail Indonesia', 'Dewi Lestari', 'dewi@retail.com', '081234567895', 'Bandung', 'distributor'),
('CUST003', 'Toko Sandal Jaya', 'Rudi Hartono', 'rudi@sandaljaya.com', '081234567896', 'Surabaya', 'wholesale');

SELECT '✅ Database created successfully!' AS message;
SELECT '📊 Sample data inserted!' AS message;
SELECT 'Default admin login:' AS message;
SELECT 'Username: admin' AS message;
SELECT 'Password: admin123' AS message;