const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

// Sales Report with detailed products
router.get('/sales-report', authenticateToken, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        // Get sales summary
        const [summary] = await db.query(`
            SELECT 
                COUNT(DISTINCT so.id) as total_orders,
                SUM(so.total_amount) as total_revenue,
                SUM(CASE WHEN so.status='pending' THEN 1 ELSE 0 END) as pending_orders,
                SUM(CASE WHEN so.status IN ('delivered', 'completed') THEN 1 ELSE 0 END) as completed_orders
            FROM sales_orders so
            WHERE DATE(so.order_date) BETWEEN ? AND ?
                AND so.status != 'cancelled'
        `, [startDate, endDate]);
        
        // Get customer details with their products
        const [customerDetails] = await db.query(`
            SELECT 
                c.company_name as customer,
                COUNT(DISTINCT so.id) as orders,
                SUM(so.total_amount) as revenue,
                GROUP_CONCAT(
                    CONCAT(
                        p.name, 
                        CASE WHEN p.size IS NOT NULL AND p.size != '' 
                            THEN CONCAT(' (Size: ', p.size, ')') 
                            ELSE '' 
                        END
                    ) 
                    ORDER BY p.name 
                    SEPARATOR '||'
                ) as products_with_sizes
            FROM customers c
            INNER JOIN sales_orders so ON c.id = so.customer_id
            INNER JOIN sales_order_items soi ON so.id = soi.so_id
            INNER JOIN products p ON soi.product_id = p.id
            WHERE DATE(so.order_date) BETWEEN ? AND ?
                AND so.status != 'cancelled'
            GROUP BY c.id, c.company_name
            ORDER BY revenue DESC
        `, [startDate, endDate]);
        
        res.json({ 
            success: true, 
            data: {
                summary: summary[0],
                details: customerDetails
            }
        });
    } catch (error) {
        console.error('Error generating sales report:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
    }
});

router.get('/production-summary', authenticateToken, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const [data] = await db.query(`
            SELECT 
                COUNT(*) as total_wo,
                SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) as completed,
                SUM(quantity_produced) as total_produced,
                SUM(quantity_good) as total_good,
                SUM(quantity_reject) as total_reject
            FROM work_orders
            WHERE DATE(created_at) BETWEEN ? AND ?
        `, [startDate, endDate]);
        res.json({ success: true, data: data[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
    }
});

router.get('/inventory-value', authenticateToken, async (req, res) => {
    try {
        const [materials] = await db.query(`SELECT SUM(current_stock * unit_price) as value FROM raw_materials`);
        const [products] = await db.query(`SELECT SUM(current_stock * unit_price) as value FROM products`);
        res.json({ success: true, data: { materialsValue: materials[0].value, productsValue: products[0].value } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
    }
});

module.exports = router;

// Dashboard summary endpoint (time series revenue + top products)
router.get('/dashboard-summary', authenticateToken, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        // default to last 30 days
        const end = endDate || new Date().toISOString().split('T')[0];
        const start = startDate || new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        // Revenue time series per day
        const [series] = await db.query(`
            SELECT DATE(order_date) as date, SUM(total_amount) as revenue, COUNT(*) as orders
            FROM sales_orders
            WHERE DATE(order_date) BETWEEN ? AND ? AND status != 'cancelled'
            GROUP BY DATE(order_date)
            ORDER BY DATE(order_date)
        `, [start, end]);

        // Ensure continuous dates - build labels array
        const labels = [];
        const revenueMap = {};
        const ordersMap = {};
        const sDate = new Date(start);
        const eDate = new Date(end);
        for (let d = new Date(sDate); d <= eDate; d.setDate(d.getDate() + 1)) {
            const key = d.toISOString().split('T')[0];
            labels.push(key);
            revenueMap[key] = 0;
            ordersMap[key] = 0;
        }

        series.forEach(row => {
            const k = row.date.toISOString().split('T')[0];
            revenueMap[k] = parseFloat(row.revenue) || 0;
            ordersMap[k] = parseInt(row.orders) || 0;
        });

        const revenue = labels.map(l => revenueMap[l] || 0);
        const orders = labels.map(l => ordersMap[l] || 0);

        // Top products by revenue in range
        const [topProducts] = await db.query(`
            SELECT p.id, p.name, SUM(soi.quantity) as qty, SUM(soi.subtotal) as revenue
            FROM sales_order_items soi
            INNER JOIN sales_orders so ON soi.so_id = so.id
            INNER JOIN products p ON soi.product_id = p.id
            WHERE DATE(so.order_date) BETWEEN ? AND ? AND so.status != 'cancelled'
            GROUP BY p.id, p.name
            ORDER BY revenue DESC
            LIMIT 5
        `, [start, end]);

        // Top customers by total spend (revenue)
        const [topCustomers] = await db.query(`
            SELECT 
                c.id,
                c.company_name as name,
                COUNT(DISTINCT so.id) as total_orders,
                SUM(so.total_amount) as total_revenue,
                MAX(so.order_date) as last_order_date
            FROM customers c
            INNER JOIN sales_orders so ON c.id = so.customer_id
            WHERE DATE(so.order_date) BETWEEN ? AND ? AND so.status != 'cancelled'
            GROUP BY c.id, c.company_name
            ORDER BY total_revenue DESC
            LIMIT 10
        `, [start, end]);

        res.json({ success: true, data: { labels, revenue, orders, topProducts, topCustomers } });
    } catch (error) {
        console.error('Error generating dashboard summary:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
    }
});
