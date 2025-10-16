-- ============================================
-- QC INSPECTION SYSTEM - INTEGRATED MIGRATION
-- Database: factory_inventory
-- Date: 2025-10-10
-- ============================================

USE factory_inventory;

-- ============================================
-- Table: qc_inspections
-- Purpose: Quality Control inspection records linked to production tracking
-- ============================================
CREATE TABLE IF NOT EXISTS qc_inspections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Links to existing tables
    production_tracking_id INT NULL COMMENT 'FK to production_tracking table',
    work_order_id INT NULL COMMENT 'FK to work_orders table',
    product_id INT NULL COMMENT 'FK to products table',
    
    -- Inspection details
    product_model VARCHAR(100) NOT NULL COMMENT 'Product name for display',
    inspection_date DATE NOT NULL,
    shift TINYINT NOT NULL COMMENT '1=Pagi, 2=Siang, 3=Malam',
    
    -- Quantities (total_inspected = quantity reject from production tracking)
    total_inspected INT NOT NULL DEFAULT 0 COMMENT 'Jumlah yang di-inspect (dari qty reject)',
    total_defect INT NOT NULL DEFAULT 0 COMMENT 'Total defect yang ditemukan',
    defect_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00 COMMENT 'Defect rate dalam persen',
    
    -- Decision
    decision ENUM('RELEASE', 'REWORK', 'REJECT') NOT NULL DEFAULT 'REJECT',
    
    -- Inspectors
    inspector VARCHAR(100) NOT NULL,
    supervisor VARCHAR(100) NULL,
    
    -- Additional info
    notes TEXT NULL COMMENT 'Catatan tambahan',
    
    -- Audit fields
    created_by INT NULL COMMENT 'FK to users table',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_production_tracking_id (production_tracking_id),
    INDEX idx_work_order_id (work_order_id),
    INDEX idx_product_id (product_id),
    INDEX idx_inspection_date (inspection_date),
    INDEX idx_product_model (product_model),
    INDEX idx_shift (shift),
    INDEX idx_decision (decision),
    INDEX idx_created_by (created_by),
    
    -- Foreign keys
    CONSTRAINT fk_qc_production_tracking 
        FOREIGN KEY (production_tracking_id) 
        REFERENCES production_tracking(id) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE,
        
    CONSTRAINT fk_qc_work_order 
        FOREIGN KEY (work_order_id) 
        REFERENCES work_orders(id) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE,
        
    CONSTRAINT fk_qc_product 
        FOREIGN KEY (product_id) 
        REFERENCES products(id) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE,
        
    CONSTRAINT fk_qc_created_by 
        FOREIGN KEY (created_by) 
        REFERENCES users(id) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE
        
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='QC Inspection records - linked to production tracking';

-- ============================================
-- Table: qc_defects
-- Purpose: Detailed defect records for each inspection
-- ============================================
CREATE TABLE IF NOT EXISTS qc_defects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Link to inspection
    inspection_id INT NOT NULL COMMENT 'FK to qc_inspections table',
    
    -- Defect details
    category ENUM('UPPER', 'SOLE', 'FINISHING', 'SIZING', 'OTHERS') NOT NULL,
    defect_name VARCHAR(100) NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    
    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_inspection_id (inspection_id),
    INDEX idx_category (category),
    INDEX idx_defect_name (defect_name),
    
    -- Foreign key with CASCADE delete
    CONSTRAINT fk_defect_inspection 
        FOREIGN KEY (inspection_id) 
        REFERENCES qc_inspections(id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
        
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='QC Defect details - child records of qc_inspections';

-- ============================================
-- ALTER production_tracking table
-- Add column to track QC inspections count
-- ============================================
ALTER TABLE production_tracking 
ADD COLUMN IF NOT EXISTS qc_inspections_count INT DEFAULT 0 
COMMENT 'Jumlah QC inspection yang sudah dibuat untuk tracking ini';

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Sample QC Inspections (linked to production tracking)
-- Note: Adjust production_tracking_id, work_order_id, product_id sesuai data existing
/*
INSERT INTO qc_inspections 
(production_tracking_id, work_order_id, product_id, product_model, inspection_date, shift, 
total_inspected, total_defect, defect_rate, decision, inspector, supervisor, created_by) 
VALUES
-- Sample 1: QC for production tracking #1
(1, 1, 1, 'Sepatu Model A', '2025-10-01', 1, 25, 15, 60.00, 'REJECT', 'John Doe', 'Jane Smith', 1),

-- Sample 2: QC for production tracking #2
(2, 2, 2, 'Sepatu Model B', '2025-10-02', 2, 10, 8, 80.00, 'REJECT', 'Mike Wilson', 'Jane Smith', 1),

-- Sample 3: QC for production tracking #3 (multiple inspections)
(3, 3, 3, 'Sandal Jepit Classic', '2025-10-03', 1, 5, 3, 60.00, 'REWORK', 'Sarah Connor', 'Jane Smith', 1),
(3, 3, 3, 'Sandal Jepit Classic', '2025-10-03', 2, 8, 5, 62.50, 'REJECT', 'Sarah Connor', 'Jane Smith', 1);

-- Sample Defects
INSERT INTO qc_defects (inspection_id, category, defect_name, quantity) VALUES
-- Defects for inspection #1
(1, 'SOLE', 'Sole miring', 8),
(1, 'UPPER', 'Noda lem', 5),
(1, 'FINISHING', 'Goresan', 2),

-- Defects for inspection #2
(2, 'SOLE', 'Bonding lemah', 5),
(2, 'UPPER', 'Jahitan lepas', 3),

-- Defects for inspection #3
(3, 'SOLE', 'Sole miring', 2),
(3, 'FINISHING', 'Goresan', 1),

-- Defects for inspection #4
(4, 'SOLE', 'Celah upper-sole', 3),
(4, 'UPPER', 'Benang nongol', 2);

-- Update production_tracking qc_inspections_count
UPDATE production_tracking SET qc_inspections_count = 1 WHERE id = 1;
UPDATE production_tracking SET qc_inspections_count = 1 WHERE id = 2;
UPDATE production_tracking SET qc_inspections_count = 2 WHERE id = 3;
*/

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
/*
-- Check if tables created
SHOW TABLES LIKE 'qc_%';

-- Check qc_inspections structure
DESCRIBE qc_inspections;

-- Check qc_defects structure
DESCRIBE qc_defects;

-- Check foreign keys
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'factory_inventory'
AND TABLE_NAME IN ('qc_inspections', 'qc_defects')
AND REFERENCED_TABLE_NAME IS NOT NULL;

-- Check production_tracking new column
DESCRIBE production_tracking;
*/

-- ============================================
-- ROLLBACK SCRIPT (if needed)
-- ============================================
/*
-- Drop tables in correct order (child first, then parent)
DROP TABLE IF EXISTS qc_defects;
DROP TABLE IF EXISTS qc_inspections;

-- Remove column from production_tracking
ALTER TABLE production_tracking DROP COLUMN IF EXISTS qc_inspections_count;
*/

-- ============================================
-- END OF MIGRATION
-- ============================================
