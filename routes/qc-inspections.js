const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, checkPermission } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);

// GET all inspections with filters - requires qc:view:inspections permission
router.get('/', checkPermission('qc', 'view', 'inspections'), async (req, res) => {
    try {
        const { period, product, shift, production_tracking_id, page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;
        
        let query = `
            SELECT 
                i.*,
                COUNT(d.id) as defect_count,
                SUM(d.quantity) as total_defect_qty,
                p.name as product_name,
                w.wo_number,
                pt.tracking_date
            FROM qc_inspections i
            LEFT JOIN qc_defects d ON i.id = d.inspection_id
            LEFT JOIN products p ON i.product_id = p.id
            LEFT JOIN work_orders w ON i.work_order_id = w.id
            LEFT JOIN production_tracking pt ON i.production_tracking_id = pt.id
            WHERE 1=1
        `;
        
        const params = [];
        
        // Filter by production tracking ID
        if (production_tracking_id) {
            query += ` AND i.production_tracking_id = ?`;
            params.push(production_tracking_id);
        }
        
        if (product) {
            query += ` AND i.product_model = ?`;
            params.push(product);
        }
        
        if (shift) {
            query += ` AND i.shift = ?`;
            params.push(shift);
        }
        
        if (period) {
            // Implement period filter (e.g., current month, last month)
            const now = new Date();
            if (period === 'current') {
                query += ` AND MONTH(i.inspection_date) = ? AND YEAR(i.inspection_date) = ?`;
                params.push(now.getMonth() + 1, now.getFullYear());
            }
        }
        
        query += ` GROUP BY i.id ORDER BY i.inspection_date DESC, i.id DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), offset);
        
        const [inspections] = await db.query(query, params);
        
        // Get total count
        const countQuery = query.split('GROUP BY')[0].replace('SELECT i.*, COUNT(d.id) as defect_count, SUM(d.quantity) as total_defect_qty', 'SELECT COUNT(DISTINCT i.id) as total');
        const [countResult] = await db.query(countQuery, params.slice(0, -2));
        const total = countResult[0].total;
        
        res.json({
            success: true,
            data: inspections,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching inspections:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching inspections',
            error: error.message
        });
    }
});

// GET single inspection by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Get inspection
        const [inspections] = await db.query(
            'SELECT * FROM qc_inspections WHERE id = ?',
            [id]
        );
        
        if (inspections.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Inspection not found'
            });
        }
        
        // Get defects
        const [defects] = await db.query(
            'SELECT * FROM qc_defects WHERE inspection_id = ? ORDER BY category, defect_name',
            [id]
        );
        
        const inspection = inspections[0];
        inspection.defects = defects;
        
        res.json({
            success: true,
            data: inspection
        });
    } catch (error) {
        console.error('Error fetching inspection:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching inspection',
            error: error.message
        });
    }
});

// POST create new inspection - requires qc:perform:inspection permission
router.post('/', checkPermission('qc', 'perform', 'inspection'), async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const {
            production_tracking_id,
            work_order_id,
            product_id,
            product_model,
            inspection_date,
            shift,
            total_inspected,
            total_defect,
            defect_rate,
            decision,
            inspector,
            supervisor,
            notes,
            defects
        } = req.body;
        
        // Validate required fields
        if (!product_model || !inspection_date || !shift || !total_inspected || !inspector || !decision) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }
        
        // Insert inspection
        const [result] = await connection.query(
            `INSERT INTO qc_inspections 
            (production_tracking_id, work_order_id, product_id, product_model, inspection_date, shift, 
             total_inspected, total_defect, defect_rate, decision, inspector, supervisor, notes, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [production_tracking_id, work_order_id, product_id, product_model, inspection_date, shift, 
             total_inspected, total_defect, defect_rate, decision, inspector, supervisor, notes, req.user.userId]
        );
        
        const inspectionId = result.insertId;
        
        // Insert defects
        if (defects && defects.length > 0) {
            const defectValues = defects.map(d => [
                inspectionId,
                d.category,
                d.defect_name,
                d.quantity
            ]);
            
            await connection.query(
                `INSERT INTO qc_defects (inspection_id, category, defect_name, quantity) VALUES ?`,
                [defectValues]
            );
        }
        
        // Update production_tracking qc_inspections_count if linked
        if (production_tracking_id) {
            await connection.query(
                `UPDATE production_tracking 
                 SET qc_inspections_count = qc_inspections_count + 1 
                 WHERE id = ?`,
                [production_tracking_id]
            );
        }
        
        await connection.commit();
        
        res.status(201).json({
            success: true,
            message: 'Inspection created successfully',
            data: { id: inspectionId }
        });
        
    } catch (error) {
        await connection.rollback();
        console.error('Error creating inspection:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating inspection',
            error: error.message
        });
    } finally {
        connection.release();
    }
});

// PUT update inspection
router.put('/:id', async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { id } = req.params;
        const {
            product_model,
            inspection_date,
            shift,
            total_inspected,
            total_defect,
            defect_rate,
            decision,
            inspector,
            supervisor,
            defects
        } = req.body;
        
        // Update inspection
        await connection.query(
            `UPDATE qc_inspections 
            SET product_model = ?, inspection_date = ?, shift = ?, total_inspected = ?, 
                total_defect = ?, defect_rate = ?, decision = ?, inspector = ?, supervisor = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
            [product_model, inspection_date, shift, total_inspected, total_defect, defect_rate, decision, inspector, supervisor, id]
        );
        
        // Delete old defects
        await connection.query('DELETE FROM qc_defects WHERE inspection_id = ?', [id]);
        
        // Insert new defects
        if (defects && defects.length > 0) {
            const defectValues = defects.map(d => [
                id,
                d.category,
                d.defect_name,
                d.quantity
            ]);
            
            await connection.query(
                `INSERT INTO qc_defects (inspection_id, category, defect_name, quantity) VALUES ?`,
                [defectValues]
            );
        }
        
        await connection.commit();
        
        res.json({
            success: true,
            message: 'Inspection updated successfully'
        });
        
    } catch (error) {
        await connection.rollback();
        console.error('Error updating inspection:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating inspection',
            error: error.message
        });
    } finally {
        connection.release();
    }
});

// DELETE inspection
router.delete('/:id', async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { id } = req.params;
        
        // Delete defects first
        await connection.query('DELETE FROM qc_defects WHERE inspection_id = ?', [id]);
        
        // Delete inspection
        const [result] = await connection.query('DELETE FROM qc_inspections WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Inspection not found'
            });
        }
        
        await connection.commit();
        
        res.json({
            success: true,
            message: 'Inspection deleted successfully'
        });
        
    } catch (error) {
        await connection.rollback();
        console.error('Error deleting inspection:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting inspection',
            error: error.message
        });
    } finally {
        connection.release();
    }
});

module.exports = router;
