const express = require('express');
const router = express.Router();
const db = require('../db');

// GET list with product and inspector details
router.get('/', async (req, res) => {
    try {
        const { startDate, endDate, productId, status } = req.query;
        let sql = `
            SELECT 
                qi.*,
                p.name as product_name,
                p.sku_code,
                u.name as inspector_name
            FROM quality_inspections qi
            LEFT JOIN products p ON qi.product_id = p.id
            LEFT JOIN users u ON qi.inspector_id = u.id
            WHERE 1=1
        `;
        const params = [];
        if (startDate) { sql += ' AND DATE(qi.inspection_date) >= ?'; params.push(startDate); }
        if (endDate) { sql += ' AND DATE(qi.inspection_date) <= ?'; params.push(endDate); }
        if (productId) { sql += ' AND qi.product_id = ?'; params.push(productId); }
        if (status) { sql += ' AND qi.status = ?'; params.push(status); }
        sql += ' ORDER BY qi.inspection_date DESC, qi.id DESC LIMIT 500';

        const [rows] = await db.query(sql, params);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('QC list error', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
    }
});

// GET single with details
router.get('/:id', async (req, res) => {
    try {
        const sql = `
            SELECT 
                qi.*,
                p.name as product_name,
                p.sku_code,
                p.size,
                p.color,
                p.category,
                u.name as inspector_name
            FROM quality_inspections qi
            LEFT JOIN products p ON qi.product_id = p.id
            LEFT JOIN users u ON qi.inspector_id = u.id
            WHERE qi.id = ?
        `;
        const [rows] = await db.query(sql, [req.params.id]);
        if (!rows || rows.length === 0) return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('QC get error', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
    }
});

// POST create with new fields
router.post('/', async (req, res) => {
    try {
        const { 
            product_id, 
            work_order_id, 
            inspection_date, 
            batch_number,
            unit_inspected,
            unit_pass,
            unit_fail,
            defect_type, 
            severity,
            defect_notes,
            status, 
            approved_by,
            notes,
            checklist, 
            photos 
        } = req.body;

        const inspector_id = req.user?.id || 1; // Get from session or default to 1

        // Validate unit counts
        const inspected = parseInt(unit_inspected) || 0;
        const pass = parseInt(unit_pass) || 0;
        const fail = parseInt(unit_fail) || 0;

        if (inspected > 0 && (pass + fail !== inspected)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Unit pass + fail must equal unit inspected' 
            });
        }

        const sql = `
            INSERT INTO quality_inspections (
                inspection_date, 
                inspector_id, 
                product_id, 
                work_order_id, 
                batch_number,
                unit_inspected,
                unit_pass,
                unit_fail,
                status, 
                checklist, 
                defect_type, 
                severity,
                defect_notes,
                photos, 
                approved_by,
                notes, 
                created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;
        
        const params = [
            inspection_date || new Date(), 
            inspector_id, 
            product_id || null, 
            work_order_id || null, 
            batch_number || null,
            inspected,
            pass,
            fail,
            status || 'pending', 
            JSON.stringify(checklist || []), 
            defect_type || null, 
            severity || null,
            defect_notes || null,
            JSON.stringify(photos || []), 
            approved_by || null,
            notes || null
        ];
        
        const [result] = await db.query(sql, params);

        // Update approved_at if status is approved
        if (status === 'approved') {
            await db.query('UPDATE quality_inspections SET approved_at = NOW() WHERE id = ?', [result.insertId]);
        }

        const [row] = await db.query('SELECT * FROM quality_inspections WHERE id = ?', [result.insertId]);
        res.json({ success: true, data: row[0], message: 'QC inspection created successfully' });
    } catch (error) {
        console.error('QC create error', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan: ' + error.message });
    }
});

// PUT update with new fields
router.put('/:id', async (req, res) => {
    try {
        const { 
            product_id,
            work_order_id,
            inspection_date,
            batch_number,
            unit_inspected,
            unit_pass,
            unit_fail,
            status, 
            checklist, 
            defect_type, 
            severity,
            defect_notes,
            photos, 
            notes, 
            approved_by 
        } = req.body;

        // Validate unit counts if provided
        if (unit_inspected !== undefined) {
            const inspected = parseInt(unit_inspected) || 0;
            const pass = parseInt(unit_pass) || 0;
            const fail = parseInt(unit_fail) || 0;

            if (inspected > 0 && (pass + fail !== inspected)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Unit pass + fail must equal unit inspected' 
                });
            }
        }

        const params = [];
        const updates = [];
        
        if (product_id !== undefined) { updates.push('product_id = ?'); params.push(product_id); }
        if (work_order_id !== undefined) { updates.push('work_order_id = ?'); params.push(work_order_id); }
        if (inspection_date !== undefined) { updates.push('inspection_date = ?'); params.push(inspection_date); }
        if (batch_number !== undefined) { updates.push('batch_number = ?'); params.push(batch_number); }
        if (unit_inspected !== undefined) { updates.push('unit_inspected = ?'); params.push(parseInt(unit_inspected)); }
        if (unit_pass !== undefined) { updates.push('unit_pass = ?'); params.push(parseInt(unit_pass)); }
        if (unit_fail !== undefined) { updates.push('unit_fail = ?'); params.push(parseInt(unit_fail)); }
        if (status !== undefined) { updates.push('status = ?'); params.push(status); }
        if (checklist !== undefined) { updates.push('checklist = ?'); params.push(JSON.stringify(checklist)); }
        if (defect_type !== undefined) { updates.push('defect_type = ?'); params.push(defect_type); }
        if (severity !== undefined) { updates.push('severity = ?'); params.push(severity); }
        if (defect_notes !== undefined) { updates.push('defect_notes = ?'); params.push(defect_notes); }
        if (photos !== undefined) { updates.push('photos = ?'); params.push(JSON.stringify(photos)); }
        if (notes !== undefined) { updates.push('notes = ?'); params.push(notes); }
        if (approved_by !== undefined) { updates.push('approved_by = ?'); params.push(approved_by); }
        
        // Update approved_at if status changed to approved
        if (status === 'approved') {
            updates.push('approved_at = NOW()');
        }

        if (updates.length === 0) {
            return res.status(400).json({ success: false, message: 'No fields to update' });
        }

        updates.push('updated_at = NOW()');
        params.push(req.params.id);
        
        const sql = `UPDATE quality_inspections SET ${updates.join(', ')} WHERE id = ?`;
        await db.query(sql, params);
        
        const [row] = await db.query('SELECT * FROM quality_inspections WHERE id = ?', [req.params.id]);
        res.json({ success: true, data: row[0], message: 'QC inspection updated successfully' });
    } catch (error) {
        console.error('QC update error', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan: ' + error.message });
    }
});

// DELETE QC inspection
router.delete('/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM quality_inspections WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'QC inspection deleted successfully' });
    } catch (error) {
        console.error('QC delete error', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
    }
});

module.exports = router;
