const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, checkPermission } = require('../middleware/auth');
const { generateSupplierCode } = require('../utils/autoIncrement');

router.get('/', authenticateToken, checkPermission('suppliers', 'read', 'list'), async (req, res) => {
    try {
        const [suppliers] = await db.query('SELECT * FROM suppliers ORDER BY company_name');
        res.json({ success: true, data: suppliers });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
    }
});

router.get('/:id', authenticateToken, checkPermission('suppliers', 'read', 'supplier'), async (req, res) => {
    try {
        const [suppliers] = await db.query('SELECT * FROM suppliers WHERE id = ?', [req.params.id]);
        if (suppliers.length === 0) {
            return res.status(404).json({ success: false, message: 'Supplier tidak ditemukan' });
        }
        res.json({ success: true, data: suppliers[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
    }
});

router.post('/', authenticateToken, checkPermission('suppliers', 'create', 'supplier'), async (req, res) => {
    try {
        let { supplier_code, company_name, contact_person, email, phone, address, city, payment_terms, lead_time_days } = req.body;
        if (!supplier_code) {
            supplier_code = await generateSupplierCode();
        }
        const [result] = await db.query(
            'INSERT INTO suppliers (supplier_code, company_name, contact_person, email, phone, address, city, payment_terms, lead_time_days) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [supplier_code, company_name, contact_person, email, phone, address, city, payment_terms, lead_time_days]
        );
        res.status(201).json({ success: true, message: 'Supplier berhasil ditambahkan', supplierId: result.insertId, supplier_code });
    } catch (error) {
        console.error('Error creating supplier:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
    }
});

router.put('/:id', authenticateToken, checkPermission('suppliers', 'update', 'supplier'), async (req, res) => {
    try {
        const { company_name, contact_person, email, phone, address, city, payment_terms, lead_time_days, status } = req.body;
        const [result] = await db.query(
            'UPDATE suppliers SET company_name=?, contact_person=?, email=?, phone=?, address=?, city=?, payment_terms=?, lead_time_days=?, status=? WHERE id=?',
            [company_name, contact_person, email, phone, address, city, payment_terms, lead_time_days, status, req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Supplier tidak ditemukan' });
        }
        res.json({ success: true, message: 'Supplier berhasil diupdate' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
    }
});

router.delete('/:id', authenticateToken, checkPermission('suppliers', 'delete', 'supplier'), async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM suppliers WHERE id=?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Supplier tidak ditemukan' });
        }
        res.json({ success: true, message: 'Supplier berhasil dihapus' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
    }
});

module.exports = router;
