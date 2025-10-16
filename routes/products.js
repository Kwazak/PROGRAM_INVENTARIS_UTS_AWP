const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, checkPermission } = require('../middleware/auth');
const { generateProductSKU } = require('../utils/autoIncrement');

// Get product categories
router.get('/categories', authenticateToken, checkPermission('products', 'read', 'list'), async (req, res) => {
    try {
        const [categories] = await db.query('SELECT * FROM product_categories ORDER BY name');
        res.json({ success: true, data: categories });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
    }
});

// Get all products
router.get('/', authenticateToken, checkPermission('products', 'read', 'list'), async (req, res) => {
    try {
        const { search, category, type, status } = req.query;
        let query = `
            SELECT p.*, pc.name as category_name 
            FROM products p 
            LEFT JOIN product_categories pc ON p.category_id = pc.id 
            WHERE 1=1
        `;
        const params = [];
        
        if (search) {
            query += ' AND (p.name LIKE ? OR p.sku_code LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }
        if (category) {
            query += ' AND p.category_id = ?';
            params.push(category);
        }
        if (type) {
            query += ' AND p.type = ?';
            params.push(type);
        }
        if (status) {
            query += ' AND p.status = ?';
            params.push(status);
        }
        
        query += ' ORDER BY p.created_at DESC';
        
        console.log('=== DEBUG PRODUCTS QUERY ===');
        console.log('Query:', query);
        console.log('Params:', params);
        console.log('=========================');
        
        const [products] = await db.query(query, params);
        res.json({ success: true, data: products });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
    }
});

router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const [products] = await db.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
        if (products.length === 0) return res.status(404).json({ success: false, message: 'Product tidak ditemukan' });
        res.json({ success: true, data: products[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
    }
});

router.post('/', authenticateToken, checkPermission('products', 'create', 'product'), async (req, res) => {
    try {
        let { sku_code, name, category_id, type, description, size, color, weight, unit_price, wholesale_price, min_stock, current_stock } = req.body;
        
        // Auto-generate SKU if not provided
        if (!sku_code) {
            sku_code = await generateProductSKU();
        }
        
        const [result] = await db.query(
            `INSERT INTO products (sku_code, name, category_id, type, description, size, color, weight, unit_price, wholesale_price, min_stock, current_stock)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [sku_code, name, category_id, type, description, size, color, weight, unit_price, wholesale_price, min_stock, current_stock]
        );
        res.status(201).json({ success: true, message: 'Product berhasil ditambahkan', productId: result.insertId, sku_code });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
    }
});

router.put('/:id', authenticateToken, checkPermission('products', 'update', 'product'), async (req, res) => {
    try {
        const { name, category_id, type, description, size, color, weight, unit_price, wholesale_price, min_stock, current_stock, status } = req.body;
        const [result] = await db.query(
            `UPDATE products SET name=?, category_id=?, type=?, description=?, size=?, color=?, weight=?, unit_price=?, wholesale_price=?, min_stock=?, current_stock=?, status=? WHERE id=?`,
            [name, category_id, type, description, size, color, weight, unit_price, wholesale_price, min_stock, current_stock, status, req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Product tidak ditemukan' });
        res.json({ success: true, message: 'Product berhasil diupdate' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
    }
});

router.delete('/:id', authenticateToken, checkPermission('products', 'delete', 'product'), async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM products WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Product tidak ditemukan' });
        res.json({ success: true, message: 'Product berhasil dihapus' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
    }
});

module.exports = router;
