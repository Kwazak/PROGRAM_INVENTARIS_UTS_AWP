const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, checkPermission } = require('../middleware/auth');
const { generateWONumber } = require('../utils/autoIncrement');

// Get production lines
router.get('/production-lines', authenticateToken, checkPermission('production', 'read', 'list'), async (req, res) => {
    try {
        const [lines] = await db.query('SELECT * FROM production_lines WHERE status = "active" ORDER BY line_name');
        res.json({ success: true, data: lines });
    } catch (error) {
        console.error('Error fetching production lines:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
    }
});

// Alias endpoint for production lines (used by frontend)
router.get('/lines/list', authenticateToken, async (req, res) => {
    try {
        const [lines] = await db.query('SELECT * FROM production_lines WHERE status = "active" ORDER BY line_name');
        res.json({ success: true, data: lines });
    } catch (error) {
        console.error('Error fetching production lines:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
    }
});

// Get all work orders
router.get('/', authenticateToken, checkPermission('production', 'read', 'list'), async (req, res) => {
    try {
        const { search, status, priority } = req.query;
        let query = `
            SELECT wo.*, p.name as product_name, pl.line_name, u.full_name as operator_name
            FROM work_orders wo
            LEFT JOIN products p ON wo.product_id = p.id
            LEFT JOIN production_lines pl ON wo.production_line_id = pl.id
            LEFT JOIN users u ON wo.operator_id = u.id
            WHERE 1=1
        `;
        const params = [];
        
        if (search) {
            query += ' AND (wo.wo_number LIKE ? OR p.name LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }
        if (status) {
            query += ' AND wo.status = ?';
            params.push(status);
        }
        if (priority) {
            query += ' AND wo.priority = ?';
            params.push(priority);
        }
        
        query += ' ORDER BY wo.created_at DESC';
        
        const [workOrders] = await db.query(query, params);
        res.json({ success: true, data: workOrders });
    } catch (error) {
        console.error('Error fetching work orders:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
    }
});

router.get('/:id', authenticateToken, checkPermission('production', 'read', 'work_order'), async (req, res) => {
    try {
        const [workOrders] = await db.query('SELECT * FROM work_orders WHERE id = ?', [req.params.id]);
        if (workOrders.length === 0) return res.status(404).json({ success: false, message: 'Work order tidak ditemukan' });
        res.json({ success: true, data: workOrders[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
    }
});

router.post('/', authenticateToken, checkPermission('production', 'create', 'work_order'), async (req, res) => {
    try {
        const { product_id, quantity_planned, production_line_id, priority, start_date, due_date, shift, notes } = req.body;
        
        // Validate required fields
        if (!product_id || !quantity_planned) {
            return res.status(400).json({ 
                success: false, 
                message: 'Product dan Quantity wajib diisi' 
            });
        }
        
        // Auto-generate WO number
        const wo_number = await generateWONumber();
        
        const [result] = await db.query(
            `INSERT INTO work_orders (wo_number, product_id, quantity_planned, production_line_id, priority, start_date, due_date, shift, notes, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [wo_number, product_id, quantity_planned, production_line_id || null, priority || 'normal', start_date || null, due_date || null, shift || null, notes || null, req.user.userId]
        );
        res.status(201).json({ success: true, message: 'Work order berhasil dibuat', workOrderId: result.insertId, wo_number: wo_number });
    } catch (error) {
        console.error('Error creating work order:', error);
        res.status(500).json({ 
            success: false, 
            message: error.code === 'ER_DUP_ENTRY' ? 'WO Number sudah ada' : 'Terjadi kesalahan saat membuat work order' 
        });
    }
});

router.put('/:id', authenticateToken, checkPermission('production', 'update', 'work_order'), async (req, res) => {
    try {
        const { quantity_planned, production_line_id, priority, start_date, due_date, shift, notes, status } = req.body;
        const [result] = await db.query(
            `UPDATE work_orders SET quantity_planned=?, production_line_id=?, priority=?, start_date=?, due_date=?, shift=?, notes=?, status=? WHERE id=?`,
            [quantity_planned, production_line_id, priority, start_date, due_date, shift, notes, status, req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Work order tidak ditemukan' });
        res.json({ success: true, message: 'Work order berhasil diupdate' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
    }
});

router.post('/:id/start', authenticateToken, checkPermission('production', 'execute', 'start_production'), async (req, res) => {
    try {
        const [result] = await db.query(`UPDATE work_orders SET status='in_progress', start_date=CURDATE() WHERE id=?`, [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Work order tidak ditemukan' });
        res.json({ success: true, message: 'Work order dimulai' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
    }
});

router.post('/:id/complete', authenticateToken, checkPermission('production', 'execute', 'complete_production'), async (req, res) => {
    try {
        const [result] = await db.query(`UPDATE work_orders SET status='completed', completion_date=CURDATE() WHERE id=?`, [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Work order tidak ditemukan' });
        res.json({ success: true, message: 'Work order selesai' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
    }
});

router.post('/:id/cancel', authenticateToken, checkPermission('production', 'update', 'work_order'), async (req, res) => {
    try {
        const [result] = await db.query(`UPDATE work_orders SET status='cancelled' WHERE id=?`, [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Work order tidak ditemukan' });
        res.json({ success: true, message: 'Work order dibatalkan' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
    }
});

// Delete work order (only for pending status)
router.delete('/:id', authenticateToken, checkPermission('production', 'delete', 'work_order'), async (req, res) => {
    try {
        // Check if work order exists and is pending
        const [wo] = await db.query(`SELECT status FROM work_orders WHERE id=?`, [req.params.id]);
        if (wo.length === 0) {
            return res.status(404).json({ success: false, message: 'Work order tidak ditemukan' });
        }
        
        if (wo[0].status !== 'pending') {
            return res.status(400).json({ 
                success: false, 
                message: 'Hanya work order dengan status pending yang bisa dihapus' 
            });
        }
        
        // Check if there's any tracking data
        const [tracking] = await db.query(`SELECT COUNT(*) as count FROM production_tracking WHERE wo_id=?`, [req.params.id]);
        if (tracking[0].count > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Tidak bisa menghapus work order yang sudah memiliki data tracking' 
            });
        }
        
        // Delete the work order
        const [result] = await db.query(`DELETE FROM work_orders WHERE id=?`, [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Work order tidak ditemukan' });
        }
        
        res.json({ success: true, message: 'Work order berhasil dihapus' });
    } catch (error) {
        console.error('Error deleting work order:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan saat menghapus work order' });
    }
});

module.exports = router;
