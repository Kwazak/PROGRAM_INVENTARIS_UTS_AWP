const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.post('/inspect', authenticateToken, async (req, res) => {
    try {
        const { wo_id, qc_date, sample_size, passed_count, failed_count, defect_type, defect_description, qc_result, action_taken } = req.body;
        const [result] = await db.query(
            `INSERT INTO quality_control (wo_id, qc_date, inspector_id, sample_size, passed_count, failed_count, defect_type, defect_description, qc_result, action_taken)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [wo_id, qc_date, req.user.userId, sample_size, passed_count, failed_count, defect_type, defect_description, qc_result, action_taken]
        );
        res.status(201).json({ success: true, message: 'QC inspection berhasil dicatat' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
    }
});

router.get('/reports', authenticateToken, async (req, res) => {
    try {
        const [reports] = await db.query(`
            SELECT qc.*, wo.wo_number, p.name as product_name, u.full_name as inspector_name
            FROM quality_control qc
            JOIN work_orders wo ON qc.wo_id = wo.id
            JOIN products p ON wo.product_id = p.id
            LEFT JOIN users u ON qc.inspector_id = u.id
            ORDER BY qc.created_at DESC
            LIMIT 50
        `);
        res.json({ success: true, data: reports });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
    }
});

module.exports = router;
