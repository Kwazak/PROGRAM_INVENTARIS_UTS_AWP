const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { generatePONumber } = require('../utils/autoIncrement');

router.get('/', authenticateToken, async (req, res) => {
    try {
        const [pos] = await db.query(`
            SELECT po.*, s.company_name as supplier_name
            FROM purchase_orders po
            LEFT JOIN suppliers s ON po.supplier_id = s.id
            ORDER BY po.created_at DESC
        `);
        res.json({ success: true, data: pos });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
    }
});

router.post('/', authenticateToken, async (req, res) => {
    try {
        const { po_number, supplier_id, order_date, expected_delivery, items, notes } = req.body;
        const connection = await db.getConnection();
        await connection.beginTransaction();
        
        try {
            let subtotal = 0;
            items.forEach(item => {
                subtotal += item.quantity * item.unit_price;
            });
            const tax = subtotal * 0.11;
            const total = subtotal + tax;
            
            const [poResult] = await connection.query(
                `INSERT INTO purchase_orders (po_number, supplier_id, order_date, expected_delivery, subtotal, tax, total_amount, notes, created_by)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [po_number, supplier_id, order_date, expected_delivery, subtotal, tax, total, notes, req.user.userId]
            );
            
            const poId = poResult.insertId;
            
            for (const item of items) {
                const itemSubtotal = item.quantity * item.unit_price;
                await connection.query(
                    `INSERT INTO purchase_order_items (po_id, material_id, quantity, unit_price, subtotal)
                     VALUES (?, ?, ?, ?, ?)`,
                    [poId, item.material_id, item.quantity, item.unit_price, itemSubtotal]
                );
            }
            
            await connection.commit();
            connection.release();
            
            res.status(201).json({ success: true, message: 'PO berhasil dibuat', purchaseOrderId: poId });
        } catch (error) {
            await connection.rollback();
            connection.release();
            throw error;
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
    }
});

module.exports = router;
