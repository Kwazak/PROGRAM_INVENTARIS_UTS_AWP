const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, async (req, res) => {
    try {
        const [shipments] = await db.query(`
            SELECT s.*, so.so_number, c.company_name as customer_name
            FROM shipments s
            LEFT JOIN sales_orders so ON s.so_id = so.id
            LEFT JOIN customers c ON so.customer_id = c.id
            ORDER BY s.created_at DESC
        `);
        res.json({ success: true, data: shipments });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
    }
});

router.post('/', authenticateToken, async (req, res) => {
    try {
        const { shipment_number, so_id, shipment_date, courier, tracking_number, shipping_cost, estimated_delivery, notes } = req.body;
        const [result] = await db.query(
            `INSERT INTO shipments (shipment_number, so_id, shipment_date, courier, tracking_number, shipping_cost, estimated_delivery, notes, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [shipment_number, so_id, shipment_date, courier, tracking_number, shipping_cost, estimated_delivery, notes, req.user.userId]
        );
        res.status(201).json({ success: true, message: 'Shipment berhasil dibuat', shipmentId: result.insertId });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
    }
});

module.exports = router;
