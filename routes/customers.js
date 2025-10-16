const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, checkPermission } = require('../middleware/auth');
const { generateCustomerCode } = require('../utils/autoIncrement');

router.get('/', authenticateToken, checkPermission('customers', 'read', 'list'), async (req, res) => {
    try {
        // Return company_name and also include a backward-compatible alias `customer_name`
        const [customers] = await db.query(`
            SELECT id, customer_code, company_name, company_name as customer_name, contact_person, email, phone,
                   address, city, province, customer_type, credit_limit, payment_terms, status
            FROM customers
            ORDER BY company_name
        `);
        res.json({ success: true, data: customers });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
    }
});

router.post('/', authenticateToken, checkPermission('customers', 'create', 'customer'), async (req, res) => {
    try {
        let { customer_code, company_name, contact_person, email, phone, address, city, province, customer_type, credit_limit, payment_terms } = req.body;
        
        // Auto-generate customer code if not provided
        if (!customer_code) {
            customer_code = await generateCustomerCode();
        }
        
        const [result] = await db.query(
            `INSERT INTO customers (customer_code, company_name, contact_person, email, phone, address, city, province, customer_type, credit_limit, payment_terms)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [customer_code, company_name, contact_person, email, phone, address, city, province, customer_type, credit_limit, payment_terms]
        );
        res.status(201).json({ success: true, message: 'Customer berhasil ditambahkan', customerId: result.insertId, customer_code });
    } catch (error) {
        console.error('Error creating customer:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
    }
});

// Get single customer by ID
router.get('/:id', authenticateToken, checkPermission('customers', 'read', 'customer'), async (req, res) => {
    try {
        const [customers] = await db.query(`
            SELECT id, customer_code, company_name, company_name as customer_name, contact_person, email, phone,
                   address, city, province, customer_type, credit_limit, payment_terms, status
            FROM customers WHERE id = ?
        `, [req.params.id]);
        
        if (customers.length === 0) {
            return res.status(404).json({ success: false, message: 'Customer tidak ditemukan' });
        }
        
        res.json({ success: true, data: customers[0] });
    } catch (error) {
        console.error('Error getting customer:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
    }
});

// Update customer
router.put('/:id', authenticateToken, checkPermission('customers', 'update', 'customer'), async (req, res) => {
    try {
        const { company_name, contact_person, email, phone, address, city, province, customer_type, credit_limit, payment_terms, status } = req.body;
        
        // Check if customer exists
        const [existing] = await db.query('SELECT * FROM customers WHERE id = ?', [req.params.id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Customer tidak ditemukan' });
        }
        
        await db.query(
            `UPDATE customers 
             SET company_name = ?, contact_person = ?, email = ?, phone = ?, address = ?, 
                 city = ?, province = ?, customer_type = ?, credit_limit = ?, payment_terms = ?, status = ?
             WHERE id = ?`,
            [company_name, contact_person, email, phone, address, city, province, customer_type, credit_limit, payment_terms, status || 'active', req.params.id]
        );
        
        res.json({ success: true, message: 'Customer berhasil diupdate' });
    } catch (error) {
        console.error('Error updating customer:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
    }
});

// Delete customer
router.delete('/:id', authenticateToken, checkPermission('customers', 'delete', 'customer'), async (req, res) => {
    try {
        // Check if customer exists
        const [existing] = await db.query('SELECT * FROM customers WHERE id = ?', [req.params.id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Customer tidak ditemukan' });
        }
        
        // Check if customer has any sales orders
        const [orders] = await db.query('SELECT COUNT(*) as count FROM sales_orders WHERE customer_id = ?', [req.params.id]);
        if (orders[0].count > 0) {
            return res.status(400).json({ 
                success: false, 
                message: `Customer tidak dapat dihapus karena memiliki ${orders[0].count} pesanan` 
            });
        }
        
        await db.query('DELETE FROM customers WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Customer berhasil dihapus' });
    } catch (error) {
        console.error('Error deleting customer:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
    }
});

module.exports = router;
