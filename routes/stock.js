const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, checkPermission } = require('../middleware/auth');

// Record stock IN
router.post('/in', authenticateToken, checkPermission('stock', 'execute', 'stock_in'), async (req, res) => {
    try {
        const { material_id, quantity, movement_date, reference_number, notes } = req.body;

        // Start transaction
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // Get material info
            const [materials] = await connection.query('SELECT unit FROM raw_materials WHERE id = ?', [material_id]);
            if (materials.length === 0) {
                throw new Error('Material tidak ditemukan');
            }
            const unit = materials[0].unit;

            // Parse reference_number to reference_type and reference_id if provided
            let reference_type = reference_number || null;
            let reference_id = null;

            // Insert stock movement (using reference_type instead of movement_date and reference_number)
            await connection.query(
                `INSERT INTO stock_movements (material_id, movement_type, quantity, unit, reference_type, notes, created_by)
                 VALUES (?, 'in', ?, ?, ?, ?, ?)`,
                [material_id, quantity, unit, reference_type, notes, req.user.userId]
            );

            // Update material stock
            await connection.query(
                'UPDATE raw_materials SET current_stock = current_stock + ? WHERE id = ?',
                [quantity, material_id]
            );

            await connection.commit();
            connection.release();

            res.json({
                success: true,
                message: 'Stock berhasil ditambahkan'
            });

        } catch (error) {
            await connection.rollback();
            connection.release();
            throw error;
        }

    } catch (error) {
        console.error('Stock IN error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Terjadi kesalahan saat menambah stock'
        });
    }
});

// Record stock OUT
router.post('/out', authenticateToken, checkPermission('stock', 'execute', 'stock_out'), async (req, res) => {
    try {
        const { material_id, quantity, movement_date, reference_number, notes } = req.body;

        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // Check available stock and get unit
            const [materials] = await connection.query('SELECT current_stock, unit FROM raw_materials WHERE id = ?', [material_id]);
            
            if (materials.length === 0) {
                throw new Error('Material tidak ditemukan');
            }

            if (materials[0].current_stock < quantity) {
                throw new Error('Stock tidak mencukupi');
            }

            const unit = materials[0].unit;

            // Parse reference_number to reference_type if provided
            let reference_type = reference_number || null;

            // Insert stock movement (using reference_type instead of movement_date and reference_number)
            await connection.query(
                `INSERT INTO stock_movements (material_id, movement_type, quantity, unit, reference_type, notes, created_by)
                 VALUES (?, 'out', ?, ?, ?, ?, ?)`,
                [material_id, quantity, unit, reference_type, notes, req.user.userId]
            );

            // Update material stock
            await connection.query(
                'UPDATE raw_materials SET current_stock = current_stock - ? WHERE id = ?',
                [quantity, material_id]
            );

            await connection.commit();
            connection.release();

            res.json({
                success: true,
                message: 'Stock berhasil dikurangi'
            });

        } catch (error) {
            await connection.rollback();
            connection.release();
            throw error;
        }

    } catch (error) {
        console.error('Stock OUT error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Terjadi kesalahan'
        });
    }
});

// Get stock movements history
router.get('/movements', authenticateToken, async (req, res) => {
    try {
        const { search, type, startDate, endDate } = req.query;

        let query = `
            SELECT 
                sm.id,
                sm.material_id,
                sm.movement_type,
                sm.quantity,
                sm.unit,
                sm.created_at as movement_date,
                sm.reference_type,
                sm.reference_id,
                CONCAT(COALESCE(sm.reference_type, ''), ' #', COALESCE(sm.reference_id, '')) as reference_number,
                sm.notes,
                sm.created_at,
                rm.name as material_name,
                rm.sku_code,
                u.full_name as user_name
            FROM stock_movements sm
            LEFT JOIN raw_materials rm ON sm.material_id = rm.id
            LEFT JOIN users u ON sm.created_by = u.id
            WHERE 1=1
        `;
        const params = [];

        if (search) {
            query += ` AND (rm.name LIKE ? OR rm.sku_code LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`);
        }

        if (type) {
            query += ` AND sm.movement_type = ?`;
            params.push(type);
        }

        if (startDate) {
            query += ` AND DATE(sm.created_at) >= ?`;
            params.push(startDate);
        }

        if (endDate) {
            query += ` AND DATE(sm.created_at) <= ?`;
            params.push(endDate);
        }

        query += ` ORDER BY sm.created_at DESC LIMIT 500`;

        console.log('Stock movements query:', query);
        console.log('Params:', params);

        const [movements] = await db.query(query, params);

        console.log('Stock movements found:', movements.length);

        res.json({
            success: true,
            data: movements
        });
    } catch (error) {
        console.error('Error fetching stock movements:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: error.message || 'Terjadi kesalahan saat memuat data'
        });
    }
});

// Get stock history for specific material
router.get('/history/:materialId', authenticateToken, async (req, res) => {
    try {
        const [movements] = await db.query(
            `SELECT sm.*, u.full_name as created_by_name
             FROM stock_movements sm
             LEFT JOIN users u ON sm.created_by = u.id
             WHERE sm.material_id = ?
             ORDER BY sm.created_at DESC`,
            [req.params.materialId]
        );

        res.json({
            success: true,
            data: movements
        });

    } catch (error) {
        console.error('Get history error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan'
        });
    }
});

module.exports = router;
