const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.post('/', authenticateToken, async (req, res) => {
    try {
        const { payment_number, reference_type, reference_id, payment_date, amount, payment_method, notes } = req.body;
        const [result] = await db.query(
            `INSERT INTO payments (payment_number, reference_type, reference_id, payment_date, amount, payment_method, notes, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [payment_number, reference_type, reference_id, payment_date, amount, payment_method, notes, req.user.userId]
        );
        res.status(201).json({ success: true, message: 'Payment berhasil dicatat', paymentId: result.insertId });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
    }
});

router.get('/history', authenticateToken, async (req, res) => {
    try {
        const [payments] = await db.query(`SELECT * FROM payments ORDER BY payment_date DESC LIMIT 50`);
        res.json({ success: true, data: payments });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
    }
});

module.exports = router;
