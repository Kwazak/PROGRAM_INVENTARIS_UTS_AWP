-- ========================================
-- FACTORY INVENTORY DATABASE SCHEMA
-- Sistem Inventaris Pabrik Sendal & Boot
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
