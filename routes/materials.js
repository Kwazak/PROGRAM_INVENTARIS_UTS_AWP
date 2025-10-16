const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, checkPermission } = require('../middleware/auth');
const { generateMaterialSKU } = require('../utils/autoIncrement');

// Get all materials with filters
router.get('/', authenticateToken, checkPermission('inventory', 'read', 'list'), async (req, res) => {
    try {
        const { search, category, status, lowStock } = req.query;
        
        let query = `
            SELECT m.*, c.name as category_name, s.company_name as supplier_name
            FROM raw_materials m
            LEFT JOIN raw_material_categories c ON m.category_id = c.id
            LEFT JOIN suppliers s ON m.supplier_id = s.id
            WHERE 1=1
        `;
        const params = [];

        if (search) {
            query += ` AND (m.name LIKE ? OR m.sku_code LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`);
        }

        if (category) {
            query += ` AND m.category_id = ?`;
            params.push(category);
        }

        if (status) {
            query += ` AND m.status = ?`;
            params.push(status);
        }

        if (lowStock === 'true') {
            query += ` AND m.current_stock <= m.min_stock`;
        }

        query += ` ORDER BY m.created_at DESC`;

        const [materials] = await db.query(query, params);

        res.json({
            success: true,
            data: materials
        });

    } catch (error) {
        console.error('Get materials error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat mengambil data'
        });
    }
});

// Get single material
router.get('/:id', authenticateToken, checkPermission('inventory', 'read', 'material'), async (req, res) => {
    try {
        const [materials] = await db.query(
            `SELECT m.*, c.name as category_name, s.company_name as supplier_name
             FROM raw_materials m
             LEFT JOIN raw_material_categories c ON m.category_id = c.id
             LEFT JOIN suppliers s ON m.supplier_id = s.id
             WHERE m.id = ?`,
            [req.params.id]
        );

        if (materials.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Material tidak ditemukan'
            });
        }

        res.json({
            success: true,
            data: materials[0]
        });

    } catch (error) {
        console.error('Get material error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan'
        });
    }
});

// Add new material
router.post('/', authenticateToken, checkPermission('inventory', 'create', 'material'), async (req, res) => {
    try {
        let { sku_code, name, category_id, description, unit, unit_price, min_stock, current_stock, warehouse_location, supplier_id } = req.body;

        // Auto-generate SKU if not provided
        if (!sku_code) {
            sku_code = await generateMaterialSKU();
        }

        const [result] = await db.query(
            `INSERT INTO raw_materials (sku_code, name, category_id, description, unit, unit_price, min_stock, current_stock, warehouse_location, supplier_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [sku_code, name, category_id, description, unit, unit_price, min_stock, current_stock, warehouse_location, supplier_id]
        );

        res.status(201).json({
            success: true,
            message: 'Material berhasil ditambahkan',
            materialId: result.insertId,
            sku_code
        });

    } catch (error) {
        console.error('Add material error:', error);
        res.status(500).json({
            success: false,
            message: error.code === 'ER_DUP_ENTRY' ? 'SKU code sudah ada' : 'Terjadi kesalahan'
        });
    }
});

// Update material
router.put('/:id', authenticateToken, checkPermission('inventory', 'update', 'material'), async (req, res) => {
    try {
        const { name, category_id, description, unit, unit_price, min_stock, current_stock, warehouse_location, supplier_id, status } = req.body;

        const [result] = await db.query(
            `UPDATE raw_materials SET name=?, category_id=?, description=?, unit=?, unit_price=?, min_stock=?, current_stock=?, warehouse_location=?, supplier_id=?, status=?
             WHERE id=?`,
            [name, category_id, description, unit, unit_price, min_stock, current_stock, warehouse_location, supplier_id, status, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Material tidak ditemukan'
            });
        }

        res.json({
            success: true,
            message: 'Material berhasil diupdate'
        });

    } catch (error) {
        console.error('Update material error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan'
        });
    }
});

// Delete material
router.delete('/:id', authenticateToken, checkPermission('inventory', 'delete', 'material'), async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM raw_materials WHERE id = ?', [req.params.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Material tidak ditemukan'
            });
        }

        res.json({
            success: true,
            message: 'Material berhasil dihapus'
        });

    } catch (error) {
        console.error('Delete material error:', error);
        res.status(500).json({
            success: false,
            message: 'Tidak dapat menghapus material yang sedang digunakan'
        });
    }
});

// Get low stock materials
router.get('/alerts/low-stock', authenticateToken, checkPermission('inventory', 'read', 'stock_level'), async (req, res) => {
    try {
        const [materials] = await db.query(
            `SELECT m.*, c.name as category_name
             FROM raw_materials m
             LEFT JOIN raw_material_categories c ON m.category_id = c.id
             WHERE m.current_stock <= m.min_stock AND m.status = 'active'
             ORDER BY (m.current_stock - m.min_stock) ASC`
        );

        res.json({
            success: true,
            data: materials,
            count: materials.length
        });

    } catch (error) {
        console.error('Get low stock error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan'
        });
    }
});

// Get material categories
router.get('/categories/list', authenticateToken, checkPermission('inventory', 'read', 'list'), async (req, res) => {
    try {
        const [categories] = await db.query('SELECT * FROM raw_material_categories ORDER BY name');

        res.json({
            success: true,
            data: categories
        });

    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan'
        });
    }
});

module.exports = router;
