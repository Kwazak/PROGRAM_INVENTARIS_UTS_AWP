const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.get('/lines', authenticateToken, async (req, res) => {
    try {
        const [lines] = await db.query('SELECT * FROM production_lines ORDER BY line_name');
        res.json({ success: true, data: lines });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
    }
});

router.post('/tracking', authenticateToken, async (req, res) => {
    const connection = await db.getConnection();
    await connection.beginTransaction();
    
    try {
        const { wo_id, tracking_date, quantity_produced, quantity_good, quantity_reject, reject_reason, shift, notes } = req.body;
        
        // Get work order details to find product_id
        const [workOrders] = await connection.query(
            `SELECT product_id FROM work_orders WHERE id = ?`,
            [wo_id]
        );
        
        if (workOrders.length === 0) {
            await connection.rollback();
            connection.release();
            return res.status(404).json({ success: false, message: 'Work order tidak ditemukan' });
        }
        
        const product_id = workOrders[0].product_id;
        
        // ========================================
        // ✅ STEP 1: GET BOM (Bill of Materials)
        // ========================================
        const [bomItems] = await connection.query(
            `SELECT bom.material_id, bom.quantity_required, bom.unit, 
                    rm.name as material_name, rm.current_stock
             FROM bill_of_materials bom
             JOIN raw_materials rm ON bom.material_id = rm.id
             WHERE bom.product_id = ?`,
            [product_id]
        );
        
        // ========================================
        // ✅ STEP 2: VALIDATE Raw Material Stock
        // ========================================
        const materialShortages = [];
        
        for (const bom of bomItems) {
            const requiredQty = bom.quantity_required * quantity_produced;
            
            if (bom.current_stock < requiredQty) {
                materialShortages.push({
                    material_name: bom.material_name,
                    required: requiredQty,
                    available: bom.current_stock,
                    shortage: requiredQty - bom.current_stock,
                    unit: bom.unit
                });
            }
        }
        
        // Jika ada kekurangan material, REJECT produksi
        if (materialShortages.length > 0) {
            await connection.rollback();
            connection.release();
            
            return res.status(400).json({ 
                success: false, 
                message: 'Stok bahan baku tidak mencukupi untuk produksi ini!',
                materialShortages: materialShortages,
                hint: 'Silakan tambah stok bahan baku terlebih dahulu atau kurangi jumlah produksi.'
            });
        }
        
        // Insert production tracking
        const [result] = await connection.query(
            `INSERT INTO production_tracking (wo_id, tracking_date, quantity_produced, quantity_good, quantity_reject, reject_reason, operator_id, shift, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [wo_id, tracking_date, quantity_produced, quantity_good, quantity_reject, reject_reason, req.user.userId, shift, notes]
        );
        
        // Update work order quantities
        await connection.query(
            `UPDATE work_orders SET quantity_produced = quantity_produced + ?, quantity_good = quantity_good + ?, quantity_reject = quantity_reject + ? WHERE id = ?`,
            [quantity_produced, quantity_good, quantity_reject, wo_id]
        );
        
        // ========================================
        // ✅ STEP 3: AUTO-DEDUCT Raw Material Stock
        // ========================================
        const materialUsage = [];
        
        for (const bom of bomItems) {
            const usedQty = bom.quantity_required * quantity_produced;
            
            // Update raw material stock (REDUCE)
            await connection.query(
                `UPDATE raw_materials 
                 SET current_stock = current_stock - ? 
                 WHERE id = ?`,
                [usedQty, bom.material_id]
            );
            
            // Record material usage untuk tracking
            materialUsage.push({
                material_id: bom.material_id,
                material_name: bom.material_name,
                quantity_used: usedQty,
                unit: bom.unit,
                stock_before: bom.current_stock,
                stock_after: bom.current_stock - usedQty
            });
        }
        
        // ========================================
        // ✅ STEP 4: AUTO-UPDATE Product Stock (ADD)
        // ========================================
        if (quantity_good && quantity_good > 0) {
            await connection.query(
                `UPDATE products SET current_stock = current_stock + ? WHERE id = ?`,
                [quantity_good, product_id]
            );
        }
        
        await connection.commit();
        connection.release();
        
        // ========================================
        // ✅ SUCCESS Response with Details
        // ========================================
        res.status(201).json({ 
            success: true, 
            message: '✅ Production tracking berhasil dicatat!\n' +
                     `🔹 Stok produk bertambah: ${quantity_good} unit\n` +
                     `🔹 Stok bahan baku berkurang otomatis`,
            production: {
                quantity_produced: quantity_produced,
                quantity_good: quantity_good,
                quantity_reject: quantity_reject
            },
            stockAdded: quantity_good,
            materialUsed: materialUsage,
            summary: {
                total_materials_used: materialUsage.length,
                product_stock_added: quantity_good
            }
        });
        
    } catch (error) {
        await connection.rollback();
        connection.release();
        console.error('Error in production tracking:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Terjadi kesalahan saat mencatat production tracking',
            error: error.message 
        });
    }
});

module.exports = router;
