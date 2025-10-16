const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, checkPermission } = require('../middleware/auth');

// Get BOM for product
router.get('/:productId', authenticateToken, checkPermission('products', 'read', 'bom'), async (req, res) => {
    try {
        const [bom] = await db.query(`
            SELECT b.*, rm.name as material_name, rm.unit as material_unit, rm.unit_price
            FROM bill_of_materials b
            JOIN raw_materials rm ON b.material_id = rm.id
            WHERE b.product_id = ?
        `, [req.params.productId]);
        res.json({ success: true, data: bom });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
    }
});

router.post('/', authenticateToken, checkPermission('products', 'create', 'bom'), async (req, res) => {
    try {
        const { product_id, material_id, quantity_required, unit, notes } = req.body;
        const [result] = await db.query(
            `INSERT INTO bill_of_materials (product_id, material_id, quantity_required, unit, notes) VALUES (?, ?, ?, ?, ?)`,
            [product_id, material_id, quantity_required, unit, notes]
        );
        res.status(201).json({ success: true, message: 'BOM item berhasil ditambahkan', bomId: result.insertId });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
    }
});

router.delete('/:id', authenticateToken, checkPermission('products', 'delete', 'bom'), async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM bill_of_materials WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'BOM item tidak ditemukan' });
        res.json({ success: true, message: 'BOM item berhasil dihapus' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
    }
});

module.exports = router;
