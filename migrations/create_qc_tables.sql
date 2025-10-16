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

-- ================================================
-- Sample Data (Optional - for testing)
-- ================================================

-- Insert sample QC inspection
INSERT INTO `qc_inspections` (
  `work_order_id`,
  `product_id`,
  `product_model`,
  `wo_number`,
  `shift`,
  `inspector_name`,
  `inspection_date`,
  `total_inspected`,
  `total_defect`,
  `defect_rate`,
  `decision`,
  `notes`
) VALUES
(1, 1, 'Model A-001', 'WO-001', 'Shift 1', 'John Doe', CURDATE(), 100, 5, 5.00, 'PASS', 'Inspeksi normal'),
(1, 1, 'Model A-001', 'WO-001', 'Shift 2', 'Jane Smith', CURDATE(), 100, 12, 12.00, 'REWORK', 'Perlu perbaikan minor'),
(2, 2, 'Model B-002', 'WO-002', 'Shift 1', 'Bob Johnson', CURDATE() - INTERVAL 1 DAY, 100, 8, 8.00, 'PASS', 'Kualitas baik')
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- Insert sample defects for first inspection
INSERT INTO `qc_defects` (`inspection_id`, `category`, `defect_name`, `quantity`) VALUES
(1, 'UPPER', 'Jahitan lepas', 2),
(1, 'UPPER', 'Warna belang', 1),
(1, 'SOLE', 'Sole miring', 1),
(1, 'FINISHING', 'Lem kotor', 1)
ON DUPLICATE KEY UPDATE quantity = VALUES(quantity);

-- Insert sample defects for second inspection
INSERT INTO `qc_defects` (`inspection_id`, `category`, `defect_name`, `quantity`) VALUES
(2, 'UPPER', 'Jahitan lepas', 5),
(2, 'UPPER', 'Tusuk jarang', 3),
(2, 'SOLE', 'Sole miring', 2),
(2, 'FINISHING', 'Lem kotor', 2)
ON DUPLICATE KEY UPDATE quantity = VALUES(quantity);

-- Insert sample defects for third inspection
INSERT INTO `qc_defects` (`inspection_id`, `category`, `defect_name`, `quantity`) VALUES
(3, 'UPPER', 'Warna belang', 3),
(3, 'SOLE', 'Sole kendor', 2),
(3, 'FINISHING', 'Lem kuning', 2),
(3, 'OTHERS', 'Label miring', 1)
ON DUPLICATE KEY UPDATE quantity = VALUES(quantity);

-- ================================================
-- Verification Queries
-- ================================================

-- Count records
SELECT 'qc_inspections' as table_name, COUNT(*) as record_count FROM qc_inspections
UNION ALL
SELECT 'qc_defects', COUNT(*) FROM qc_defects;

-- View sample data
SELECT 
  i.id,
  i.wo_number,
  i.product_model,
  i.shift,
  i.inspection_date,
  i.total_inspected,
  i.total_defect,
  i.defect_rate,
  i.decision,
  COUNT(d.id) as defect_types
FROM qc_inspections i
LEFT JOIN qc_defects d ON i.id = d.inspection_id
GROUP BY i.id
ORDER BY i.inspection_date DESC, i.id DESC
LIMIT 5;

-- View defects by category
SELECT 
  category,
  defect_name,
  SUM(quantity) as total_quantity
FROM qc_defects
GROUP BY category, defect_name
ORDER BY category, total_quantity DESC;

-- ================================================
-- Success Message
-- ================================================
SELECT '✅ QC Tables created successfully!' as status;
