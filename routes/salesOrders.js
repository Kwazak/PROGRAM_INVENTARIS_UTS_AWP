const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, checkPermission } = require('../middleware/auth');
const { generateSONumber } = require('../utils/autoIncrement');

router.get('/', authenticateToken, checkPermission('sales_orders', 'read', 'list'), async (req, res) => {
    try {
        const [orders] = await db.query(`
            SELECT so.*, c.company_name as customer_name
            FROM sales_orders so
            LEFT JOIN customers c ON so.customer_id = c.id
            ORDER BY so.created_at DESC
        `);
        res.json({ success: true, data: orders });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
    }
});

router.post('/', authenticateToken, checkPermission('sales_orders', 'create', 'order'), async (req, res) => {
    try {
        const { customer_id, order_date, delivery_date, items, shipping_address, notes, auto_confirm } = req.body;
        
        // Validate required fields
        if (!customer_id || !items || items.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Customer dan minimal 1 item wajib diisi' 
            });
        }
        
        const connection = await db.getConnection();
        await connection.beginTransaction();
        
        try {
            // ✅ CHECK STOCK AVAILABILITY FIRST
            for (const item of items) {
                const [products] = await connection.query(
                    `SELECT id, name, current_stock FROM products WHERE id = ?`,
                    [item.product_id]
                );
                
                if (products.length === 0) {
                    await connection.rollback();
                    connection.release();
                    return res.status(400).json({ 
                        success: false, 
                        message: `Produk dengan ID ${item.product_id} tidak ditemukan` 
                    });
                }
                
                if (products[0].current_stock < item.quantity) {
                    await connection.rollback();
                    connection.release();
                    return res.status(400).json({ 
                        success: false, 
                        message: `Stok tidak cukup untuk produk "${products[0].name}". Tersedia: ${products[0].current_stock}, Dibutuhkan: ${item.quantity}` 
                    });
                }
            }
            
            // Auto-generate SO number
            const so_number = await generateSONumber();
            
            // Calculate totals
            let subtotal = 0;
            items.forEach(item => {
                subtotal += item.quantity * item.unit_price - (item.discount || 0);
            });
            const tax = subtotal * 0.11; // 11% VAT
            const total = subtotal + tax;
            
            // Insert sales order (status default: pending)
            const [soResult] = await connection.query(
                `INSERT INTO sales_orders (so_number, customer_id, order_date, delivery_date, subtotal, tax, total_amount, shipping_address, notes, status, created_by)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [so_number, customer_id, order_date, delivery_date, subtotal, tax, total, shipping_address, notes, 'pending', req.user.userId]
            );
            
            const soId = soResult.insertId;
            
            // Insert order items
            for (const item of items) {
                const itemSubtotal = item.quantity * item.unit_price - (item.discount || 0);
                await connection.query(
                    `INSERT INTO sales_order_items (so_id, product_id, quantity, unit_price, discount, subtotal)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [soId, item.product_id, item.quantity, item.unit_price, item.discount || 0, itemSubtotal]
                );
            }
            
            // ✅ AUTO-REDUCE PRODUCT STOCK saat order dibuat
            for (const item of items) {
                await connection.query(
                    `UPDATE products SET current_stock = current_stock - ? WHERE id = ?`,
                    [item.quantity, item.product_id]
                );
            }
            
            // Auto-confirm if requested
            if (auto_confirm) {
                await connection.query(
                    `UPDATE sales_orders SET status = 'confirmed' WHERE id = ?`,
                    [soId]
                );
            }
            
            await connection.commit();
            connection.release();
            
            res.status(201).json({ 
                success: true, 
                message: 'Sales order berhasil dibuat. Stok produk telah dikurangi.', 
                salesOrderId: soId, 
                so_number: so_number 
            });
        } catch (error) {
            await connection.rollback();
            connection.release();
            throw error;
        }
    } catch (error) {
        console.error('Error creating sales order:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan saat membuat sales order' });
    }
});

// Confirm sales order
router.post('/:id/confirm', authenticateToken, checkPermission('sales_orders', 'execute', 'confirm'), async (req, res) => {
    const connection = await db.getConnection();
    await connection.beginTransaction();
    
    try {
        // Check if order exists and is pending
        const [orders] = await connection.query(
            `SELECT * FROM sales_orders WHERE id = ?`,
            [req.params.id]
        );
        
        if (orders.length === 0) {
            await connection.rollback();
            connection.release();
            return res.status(404).json({ success: false, message: 'Sales order tidak ditemukan' });
        }
        
        if (orders[0].status !== 'pending') {
            await connection.rollback();
            connection.release();
            return res.status(400).json({ success: false, message: 'Hanya order dengan status pending yang bisa dikonfirmasi' });
        }
        
        // ✅ STOCK ALREADY REDUCED WHEN ORDER WAS CREATED
        // Just update status to confirmed
        await connection.query(
            `UPDATE sales_orders SET status = 'confirmed' WHERE id = ?`,
            [req.params.id]
        );
        
        await connection.commit();
        connection.release();
        
        res.json({ success: true, message: 'Sales order berhasil dikonfirmasi' });
    } catch (error) {
        await connection.rollback();
        connection.release();
        console.error('Error confirming sales order:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan: ' + error.message });
    }
});

// Cancel sales order
router.post('/:id/cancel', authenticateToken, checkPermission('sales_orders', 'execute', 'cancel'), async (req, res) => {
    const connection = await db.getConnection();
    await connection.beginTransaction();
    
    try {
        // Check if order exists and get its status
        const [orders] = await connection.query(
            `SELECT * FROM sales_orders WHERE id = ?`,
            [req.params.id]
        );
        
        if (orders.length === 0) {
            await connection.rollback();
            connection.release();
            return res.status(404).json({ success: false, message: 'Sales order tidak ditemukan' });
        }
        
        if (orders[0].status === 'cancelled') {
            await connection.rollback();
            connection.release();
            return res.status(400).json({ success: false, message: 'Order sudah dibatalkan sebelumnya' });
        }
        
        // ✅ RESTORE STOCK - Since stock is reduced when order is created (pending status)
        // We need to restore stock regardless of pending or confirmed status
        const [items] = await connection.query(
            `SELECT * FROM sales_order_items WHERE so_id = ?`,
            [req.params.id]
        );
        
        // Restore stock for each product
        for (const item of items) {
            await connection.query(
                `UPDATE products SET current_stock = current_stock + ? WHERE id = ?`,
                [item.quantity, item.product_id]
            );
        }
        
        // Update order status to cancelled
        await connection.query(
            `UPDATE sales_orders SET status = 'cancelled' WHERE id = ?`,
            [req.params.id]
        );
        
        await connection.commit();
        connection.release();
        
        res.json({ 
            success: true, 
            message: 'Sales order berhasil dibatalkan dan stok produk telah dikembalikan' 
        });
    } catch (error) {
        await connection.rollback();
        connection.release();
        console.error('Error cancelling sales order:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan: ' + error.message });
    }
});

// Complete sales order
router.post('/:id/complete', authenticateToken, checkPermission('sales_orders', 'execute', 'ship'), async (req, res) => {
    try {
        const [result] = await db.query(
            `UPDATE sales_orders SET status = 'completed' WHERE id = ?`,
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Sales order tidak ditemukan' });
        }

        res.json({ success: true, message: 'Sales order berhasil diselesaikan' });
    } catch (error) {
        console.error('Error completing sales order:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
    }
});// Get single sales order by ID
router.get('/:id', authenticateToken, checkPermission('sales_orders', 'read', 'order'), async (req, res) => {
    try {
        const [orders] = await db.query(`
            SELECT so.*, c.company_name as customer_name, c.contact_person, c.phone
            FROM sales_orders so
            LEFT JOIN customers c ON so.customer_id = c.id
            WHERE so.id = ?
        `, [req.params.id]);
        
        if (orders.length === 0) {
            return res.status(404).json({ success: false, message: 'Sales order tidak ditemukan' });
        }
        
        res.json({ success: true, data: orders[0] });
    } catch (error) {
        console.error('Error getting sales order:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
    }
});

// Get sales order items
router.get('/:id/items', authenticateToken, checkPermission('sales_orders', 'read', 'order'), async (req, res) => {
    try {
        const [items] = await db.query(`
            SELECT soi.*, p.name as product_name, p.sku_code
            FROM sales_order_items soi
            LEFT JOIN products p ON soi.product_id = p.id
            WHERE soi.so_id = ?
            ORDER BY soi.id
        `, [req.params.id]);
        
        res.json({ success: true, data: items });
    } catch (error) {
        console.error('Error getting order items:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
    }
});

// Update sales order
router.put('/:id', authenticateToken, checkPermission('sales_orders', 'update', 'order'), async (req, res) => {
    try {
        const { status, payment_status, notes } = req.body;
        const updates = [];
        const values = [];
        
        if (status) {
            updates.push('status = ?');
            values.push(status);
        }
        
        if (payment_status) {
            updates.push('payment_status = ?');
            values.push(payment_status);
        }
        
        if (notes !== undefined) {
            updates.push('notes = ?');
            values.push(notes);
        }
        
        if (updates.length === 0) {
            return res.status(400).json({ success: false, message: 'Tidak ada data untuk diupdate' });
        }
        
        values.push(req.params.id);
        
        const [result] = await db.query(
            `UPDATE sales_orders SET ${updates.join(', ')} WHERE id = ?`,
            values
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Sales order tidak ditemukan' });
        }
        
        res.json({ success: true, message: 'Sales order berhasil diupdate' });
    } catch (error) {
        console.error('Error updating sales order:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
    }
});

module.exports = router;
