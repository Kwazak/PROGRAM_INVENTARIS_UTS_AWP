-- QC Inspection System Tables

-- Table: qc_inspections
CREATE TABLE IF NOT EXISTS qc_inspections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_model VARCHAR(100) NOT NULL,
    inspection_date DATE NOT NULL,
    shift TINYINT NOT NULL COMMENT '1=Morning, 2=Afternoon, 3=Night',
    total_inspected INT NOT NULL,
    total_defect INT NOT NULL DEFAULT 0,
    defect_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    decision ENUM('RELEASE', 'REWORK', 'REJECT') NOT NULL,
    inspector VARCHAR(100) NOT NULL,
    supervisor VARCHAR(100) NOT NULL,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_inspection_date (inspection_date),
    INDEX idx_product_model (product_model),
    INDEX idx_shift (shift),
    INDEX idx_decision (decision)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: qc_defects
CREATE TABLE IF NOT EXISTS qc_defects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    inspection_id INT NOT NULL,
    category ENUM('UPPER', 'SOLE', 'FINISHING', 'SIZING', 'OTHERS') NOT NULL,
    defect_name VARCHAR(100) NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inspection_id) REFERENCES qc_inspections(id) ON DELETE CASCADE,
    INDEX idx_inspection_id (inspection_id),
    INDEX idx_category (category),
    INDEX idx_defect_name (defect_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample Data untuk Testing
INSERT INTO qc_inspections (product_model, inspection_date, shift, total_inspected, total_defect, defect_rate, decision, inspector, supervisor, created_by) VALUES
('Sepatu Model A', '2025-10-01', 1, 500, 25, 5.00, 'REWORK', 'John Doe', 'Jane Smith', 1),
('Sepatu Model A', '2025-10-02', 1, 450, 18, 4.00, 'RELEASE', 'John Doe', 'Jane Smith', 1),
('Sepatu Model B', '2025-10-03', 2, 600, 42, 7.00, 'REWORK', 'Alice Brown', 'Bob Wilson', 1),
('Sepatu Model A', '2025-10-04', 1, 480, 15, 3.12, 'RELEASE', 'John Doe', 'Jane Smith', 1),
('Sepatu Model C', '2025-10-05', 3, 420, 58, 13.81, 'REJECT', 'Charlie Davis', 'Diana Evans', 1);

INSERT INTO qc_defects (inspection_id, category, defect_name, quantity) VALUES
-- Inspection 1
(1, 'SOLE', 'Sole miring', 10),
(1, 'UPPER', 'Jahitan lepas', 8),
(1, 'FINISHING', 'Noda lem', 7),

-- Inspection 2
(2, 'UPPER', 'Benang nongol', 6),
(2, 'SOLE', 'Celah upper-sole', 5),
(2, 'FINISHING', 'Goresan', 7),

-- Inspection 3
(3, 'SOLE', 'Sole miring', 15),
(3, 'UPPER', 'Warna belang', 12),
(3, 'SOLE', 'Bonding lemah', 8),
(3, 'FINISHING', 'Aksesoris rusak', 7),

-- Inspection 4
(4, 'UPPER', 'Jahitan lepas', 6),
(4, 'SOLE', 'Sole retak', 5),
(4, 'FINISHING', 'Goresan', 4),

-- Inspection 5
(5, 'SOLE', 'Sole miring', 20),
(5, 'UPPER', 'Jahitan lepas', 18),
(5, 'UPPER', 'Warna belang', 10),
(5, 'FINISHING', 'Noda lem', 10);
