const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, checkPermission } = require('../middleware/auth');

// Production Dashboard
router.get('/production', authenticateToken, checkPermission('dashboard', 'read', 'production'), async (req, res) => {
    try {
        // Today's production
        const [todayProduction] = await db.query(`
            SELECT SUM(quantity_produced) as total_produced, SUM(quantity_good) as total_good, SUM(quantity_reject) as total_reject
            FROM production_tracking
            WHERE tracking_date = CURDATE()
        `);

        // Active work orders
        const [activeWO] = await db.query(`
            SELECT COUNT(*) as count FROM work_orders WHERE status IN ('pending', 'in_progress')
        `);

        // Completed work orders today
        const [completedToday] = await db.query(`
            SELECT COUNT(*) as count FROM work_orders WHERE status = 'completed' AND DATE(completion_date) = CURDATE()
        `);

        // Production by line (today)
        const [productionByLine] = await db.query(`
            SELECT pl.line_name, SUM(pt.quantity_produced) as total
            FROM production_tracking pt
            JOIN work_orders wo ON pt.wo_id = wo.id
            JOIN production_lines pl ON wo.production_line_id = pl.id
            WHERE pt.tracking_date = CURDATE()
            GROUP BY pl.id
        `);

        // Recent work orders
        const [recentWO] = await db.query(`
            SELECT wo.*, p.name as product_name, pl.line_name
            FROM work_orders wo
            LEFT JOIN products p ON wo.product_id = p.id
            LEFT JOIN production_lines pl ON wo.production_line_id = pl.id
            ORDER BY wo.created_at DESC
            LIMIT 10
        `);

        // Efficiency rate
        const efficiency = todayProduction[0].total_produced > 0 
            ? ((todayProduction[0].total_good / todayProduction[0].total_produced) * 100).toFixed(2)
            : 0;

        res.json({
            success: true,
            data: {
                todayProduction: {
                    produced: todayProduction[0].total_produced || 0,
                    good: todayProduction[0].total_good || 0,
                    reject: todayProduction[0].total_reject || 0,
                    efficiency: efficiency
                },
                workOrders: {
                    active: activeWO[0].count,
                    completedToday: completedToday[0].count
                },
                productionByLine: productionByLine,
                recentWorkOrders: recentWO
            }
        });

    } catch (error) {
        console.error('Production dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan'
        });
    }
});

// Inventory Dashboard
router.get('/inventory', authenticateToken, checkPermission('dashboard', 'read', 'inventory'), async (req, res) => {
    try {
        // Total inventory value (raw materials)
        const [materialValue] = await db.query(`
            SELECT SUM(current_stock * unit_price) as total_value, COUNT(*) as total_items
            FROM raw_materials WHERE status = 'active'
        `);

        // Total product value
        const [productValue] = await db.query(`
            SELECT SUM(current_stock * unit_price) as total_value, COUNT(*) as total_items
            FROM products WHERE status = 'active'
        `);

        // Low stock materials
        const [lowStockMaterials] = await db.query(`
            SELECT COUNT(*) as count FROM raw_materials 
            WHERE current_stock <= min_stock AND status = 'active'
        `);

        // Low stock products
        const [lowStockProducts] = await db.query(`
            SELECT COUNT(*) as count FROM products 
            WHERE current_stock <= min_stock AND status = 'active'
        `);

        // Recent stock movements
        const [recentMovements] = await db.query(`
            SELECT sm.*, rm.name as material_name
            FROM stock_movements sm
            LEFT JOIN raw_materials rm ON sm.material_id = rm.id
            ORDER BY sm.created_at DESC
            LIMIT 10
        `);

        // Top materials by value
        const [topMaterials] = await db.query(`
            SELECT name, current_stock, unit_price, (current_stock * unit_price) as total_value
            FROM raw_materials
            WHERE status = 'active'
            ORDER BY total_value DESC
            LIMIT 5
        `);

        res.json({
            success: true,
            data: {
                inventory: {
                    materialValue: materialValue[0].total_value || 0,
                    materialItems: materialValue[0].total_items || 0,
                    productValue: productValue[0].total_value || 0,
                    productItems: productValue[0].total_items || 0,
                    totalValue: (materialValue[0].total_value || 0) + (productValue[0].total_value || 0)
                },
                alerts: {
                    lowStockMaterials: lowStockMaterials[0].count,
                    lowStockProducts: lowStockProducts[0].count
                },
                recentMovements: recentMovements,
                topMaterials: topMaterials
            }
        });

    } catch (error) {
        console.error('Inventory dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan'
        });
    }
});

// Inventory Health Metrics (Gauge Charts)
router.get('/inventory-health', authenticateToken, async (req, res) => {
    try {
        // Inventory Turnover Ratio (mock calculation - customize based on your business logic)
        // Formula: Cost of Goods Sold / Average Inventory Value
        const [salesData] = await db.query(`
            SELECT SUM(total_amount) as total_sales
            FROM sales_orders
            WHERE order_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            AND status IN ('delivered', 'completed')
        `);
        
        const [avgInventory] = await db.query(`
            SELECT (SUM(current_stock * unit_price)) as avg_value
            FROM raw_materials WHERE status = 'active'
        `);
        
        const turnoverRatio = avgInventory[0].avg_value > 0 
            ? ((salesData[0].total_sales || 0) / avgInventory[0].avg_value).toFixed(2)
            : 0;
        
        // Stockout Rate (percentage of items out of stock or below min)
        const [totalItems] = await db.query(`SELECT COUNT(*) as count FROM raw_materials WHERE status = 'active'`);
        const [outOfStock] = await db.query(`SELECT COUNT(*) as count FROM raw_materials WHERE current_stock <= min_stock AND status = 'active'`);
        
        const stockoutRate = totalItems[0].count > 0
            ? ((outOfStock[0].count / totalItems[0].count) * 100).toFixed(2)
            : 0;

        res.json({
            success: true,
            data: {
                inventoryTurnover: parseFloat(turnoverRatio),
                stockoutRate: parseFloat(stockoutRate)
            }
        });
    } catch (error) {
        console.error('Inventory health error:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
    }
});

// Aging Inventory Analysis
router.get('/inventory-aging', authenticateToken, async (req, res) => {
    try {
        // Get products with aging data (simulated via last update or created_at)
        // Group by age buckets: 0-30, 31-60, 61-90, >90 days
        const [agingData] = await db.query(`
            SELECT 
                p.sku_code,
                p.name,
                p.size,
                p.current_stock,
                p.unit_price,
                (p.current_stock * p.unit_price) as stock_value,
                DATEDIFF(CURDATE(), p.updated_at) as age_days,
                CASE 
                    WHEN DATEDIFF(CURDATE(), p.updated_at) <= 30 THEN '0-30'
                    WHEN DATEDIFF(CURDATE(), p.updated_at) BETWEEN 31 AND 60 THEN '31-60'
                    WHEN DATEDIFF(CURDATE(), p.updated_at) BETWEEN 61 AND 90 THEN '61-90'
                    ELSE '>90'
                END as age_bucket
            FROM products p
            WHERE p.status = 'active' AND p.current_stock > 0
            ORDER BY age_days DESC
            LIMIT 20
        `);

        // Aggregate by bucket
        const buckets = { '0-30': 0, '31-60': 0, '61-90': 0, '>90': 0 };
        agingData.forEach(item => {
            buckets[item.age_bucket] += parseFloat(item.stock_value) || 0;
        });

        // Stock per size (Top 5 sizes)
        const [stockBySize] = await db.query(`
            SELECT 
                size,
                SUM(current_stock) as total_stock,
                COUNT(*) as sku_count
            FROM products
            WHERE status = 'active' AND size IS NOT NULL AND size != ''
            GROUP BY size
            ORDER BY total_stock DESC
            LIMIT 5
        `);

        res.json({
            success: true,
            data: {
                agingBuckets: buckets,
                agingDetails: agingData,
                stockBySize: stockBySize
            }
        });
    } catch (error) {
        console.error('Aging inventory error:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
    }
});

// Sales Dashboard
router.get('/sales', authenticateToken, checkPermission('dashboard', 'read', 'sales'), async (req, res) => {
    try {
        // Sales this month
        const [monthlySales] = await db.query(`
            SELECT COUNT(*) as order_count, SUM(total_amount) as total_revenue
            FROM sales_orders
            WHERE MONTH(order_date) = MONTH(CURDATE()) AND YEAR(order_date) = YEAR(CURDATE())
        `);

        // Sales today
        const [todaySales] = await db.query(`
            SELECT COUNT(*) as order_count, SUM(total_amount) as total_revenue
            FROM sales_orders
            WHERE DATE(order_date) = CURDATE()
        `);

        // Pending orders
        const [pendingOrders] = await db.query(`
            SELECT COUNT(*) as count FROM sales_orders 
            WHERE status IN ('pending', 'confirmed', 'processing')
        `);

        // Top selling products
        const [topProducts] = await db.query(`
            SELECT p.name, SUM(soi.quantity) as total_sold
            FROM sales_order_items soi
            JOIN products p ON soi.product_id = p.id
            JOIN sales_orders so ON soi.so_id = so.id
            WHERE so.status = 'delivered' 
              AND MONTH(so.order_date) = MONTH(CURDATE())
            GROUP BY p.id
            ORDER BY total_sold DESC
            LIMIT 5
        `);

        // Recent orders
        const [recentOrders] = await db.query(`
            SELECT so.*, c.company_name as customer_name
            FROM sales_orders so
            LEFT JOIN customers c ON so.customer_id = c.id
            ORDER BY so.created_at DESC
            LIMIT 10
        `);

        res.json({
            success: true,
            data: {
                monthly: {
                    orderCount: monthlySales[0].order_count || 0,
                    revenue: monthlySales[0].total_revenue || 0
                },
                today: {
                    orderCount: todaySales[0].order_count || 0,
                    revenue: todaySales[0].total_revenue || 0
                },
                pendingOrders: pendingOrders[0].count,
                topProducts: topProducts,
                recentOrders: recentOrders
            }
        });

    } catch (error) {
        console.error('Sales dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan'
        });
    }
});

// Main Dashboard (Overview)
router.get('/overview', authenticateToken, checkPermission('dashboard', 'read', 'overview'), async (req, res) => {
    try {
        // Quick stats
        const [stats] = await db.query(`
            SELECT 
                (SELECT COUNT(*) FROM work_orders WHERE status IN ('pending', 'in_progress')) as active_wo,
                (SELECT COUNT(*) FROM sales_orders WHERE status IN ('pending', 'confirmed', 'processing')) as pending_orders,
                (SELECT COUNT(*) FROM raw_materials WHERE current_stock <= min_stock) as low_stock_alerts,
                (SELECT SUM(total_amount) FROM sales_orders WHERE MONTH(order_date) = MONTH(CURDATE())) as monthly_revenue
        `);

        res.json({
            success: true,
            data: stats[0]
        });

    } catch (error) {
        console.error('Overview dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan'
        });
    }
});

module.exports = router;
