const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, checkPermission } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);

// GET dashboard data - requires qc:view:dashboard permission
router.get('/', checkPermission('qc', 'view', 'dashboard'), async (req, res) => {
    try {
        const { period = 'current', product, shift } = req.query;
        
        // Get date range based on period
        const now = new Date();
        let startDate, endDate;
        
        if (period === 'current') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        } else if (period.startsWith('last')) {
            const monthsAgo = parseInt(period.replace('last', ''));
            startDate = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
            endDate = new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 0);
        }
        
        // Build WHERE clause
        let whereClause = 'WHERE i.inspection_date BETWEEN ? AND ?';
        const params = [startDate, endDate];
        
        if (product) {
            whereClause += ' AND i.product_model = ?';
            params.push(product);
        }
        
        if (shift) {
            whereClause += ' AND i.shift = ?';
            params.push(shift);
        }
        
        // Get metrics
        const metrics = await getMetrics(whereClause, params);
        
        // Get Pareto data (top reject reasons)
        const paretoData = await getParetoData(whereClause, params);
        
        // Get Trend data (last 6 months)
        const trendData = await getTrendData();
        
        // Get Category distribution
        const categoryData = await getCategoryData(whereClause, params);
        
        // Get Action items
        const actionItems = await getActionItems();
        
        res.json({
            success: true,
            metrics,
            paretoData,
            trendData,
            categoryData,
            actionItems
        });
        
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard data',
            error: error.message
        });
    }
});

// Get metrics
async function getMetrics(whereClause, params) {
    // Current period metrics
    const [currentMetrics] = await db.query(`
        SELECT 
            SUM(total_inspected) as totalInspected,
            SUM(total_defect) as totalRejected,
            AVG(defect_rate) as rejectRate
        FROM qc_inspections i
        ${whereClause}
    `, params);
    
    // Previous period metrics for comparison
    const now = new Date();
    const prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevEndDate = new Date(now.getFullYear(), now.getMonth(), 0);
    
    const [prevMetrics] = await db.query(`
        SELECT 
            SUM(total_inspected) as totalInspected,
            SUM(total_defect) as totalRejected,
            AVG(defect_rate) as rejectRate
        FROM qc_inspections i
        WHERE i.inspection_date BETWEEN ? AND ?
    `, [prevStartDate, prevEndDate]);
    
    const current = currentMetrics[0];
    const prev = prevMetrics[0];
    
    return {
        totalInspected: current.totalInspected || 0,
        totalRejected: current.totalRejected || 0,
        rejectRate: current.rejectRate || 0,
        inspectedChange: prev.totalInspected ? ((current.totalInspected - prev.totalInspected) / prev.totalInspected * 100) : 0,
        rejectedChange: prev.totalRejected ? ((current.totalRejected - prev.totalRejected) / prev.totalRejected * 100) : 0,
        rateChange: prev.rejectRate ? ((current.rejectRate - prev.rejectRate) / prev.rejectRate * 100) : 0
    };
}

// Get Pareto data (Top 10 defects)
async function getParetoData(whereClause, params) {
    const [results] = await db.query(`
        SELECT 
            d.defect_name,
            SUM(d.quantity) as quantity
        FROM qc_defects d
        INNER JOIN qc_inspections i ON d.inspection_id = i.id
        ${whereClause}
        GROUP BY d.defect_name
        ORDER BY quantity DESC
        LIMIT 10
    `, params);
    
    return results;
}

// Get Trend data (Last 6 months)
async function getTrendData() {
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
            month: date.toLocaleDateString('en-US', { month: 'short' }),
            year: date.getFullYear(),
            monthNum: date.getMonth() + 1
        });
    }
    
    const [results] = await db.query(`
        SELECT 
            MONTH(inspection_date) as month,
            YEAR(inspection_date) as year,
            AVG(defect_rate) as reject_rate
        FROM qc_inspections
        WHERE inspection_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        GROUP BY YEAR(inspection_date), MONTH(inspection_date)
        ORDER BY year, month
    `);
    
    // Map results to months
    const trendData = months.map(m => {
        const found = results.find(r => r.month === m.monthNum && r.year === m.year);
        return {
            month: m.month,
            reject_rate: found ? parseFloat(found.reject_rate) : 0
        };
    });
    
    return trendData;
}

// Get Category distribution
async function getCategoryData(whereClause, params) {
    const [categories] = await db.query(`
        SELECT 
            d.category,
            SUM(d.quantity) as quantity
        FROM qc_defects d
        INNER JOIN qc_inspections i ON d.inspection_id = i.id
        ${whereClause}
        GROUP BY d.category
        ORDER BY quantity DESC
    `, params);
    
    // Get details for each category
    for (let cat of categories) {
        const [details] = await db.query(`
            SELECT 
                d.defect_name,
                SUM(d.quantity) as quantity
            FROM qc_defects d
            INNER JOIN qc_inspections i ON d.inspection_id = i.id
            ${whereClause} AND d.category = ?
            GROUP BY d.defect_name
            ORDER BY quantity DESC
            LIMIT 5
        `, [...params, cat.category]);
        
        cat.details = details;
    }
    
    return categories;
}

// Get Action items
async function getActionItems() {
    // This could come from a database table, but for now return sample data
    const actionItems = [
        {
            priority: 'URGENT',
            title: 'Sole miring (45 cases, +15% vs last month)',
            root_cause: 'Lem kurang kering sebelum pressing',
            action: 'Tambah drying time dari 3 menit → 5 menit',
            pic: 'Supervisor Produksi (Budi)',
            target_date: '15 Oct 2025',
            status: 'In Progress'
        },
        {
            priority: 'MONITOR',
            title: 'Warna belang trending up (+20%)',
            action: 'Check consistency supplier material',
            pic: 'Purchasing (Ani) & QC (Siti)',
            target_date: '20 Oct 2025',
            status: 'Under Investigation'
        },
        {
            priority: 'GOOD',
            title: 'Jahitan lepas turun 5%',
            success: 'Training operator stitching (5 Oct)',
            continue: 'Weekly skill refresher',
            status: 'Completed'
        }
    ];
    
    return actionItems;
}

// GET recent inspections
router.get('/recent', async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;
        
        const [inspections] = await db.query(`
            SELECT 
                i.*,
                w.wo_number,
                p.name as product_name,
                pt.tracking_date,
                COUNT(d.id) as defect_types_count
            FROM qc_inspections i
            LEFT JOIN work_orders w ON i.work_order_id = w.id
            LEFT JOIN products p ON i.product_id = p.id
            LEFT JOIN production_tracking pt ON i.production_tracking_id = pt.id
            LEFT JOIN qc_defects d ON i.id = d.inspection_id
            GROUP BY i.id
            ORDER BY i.inspection_date DESC, i.id DESC
            LIMIT ? OFFSET ?
        `, [parseInt(limit), offset]);
        
        // Get total count
        const [countResult] = await db.query(`
            SELECT COUNT(*) as total FROM qc_inspections
        `);
        
        const total = countResult[0].total;
        const pages = Math.ceil(total / limit);
        
        res.json({
            success: true,
            data: inspections,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages
            }
        });
        
    } catch (error) {
        console.error('Error fetching recent inspections:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching recent inspections',
            error: error.message
        });
    }
});

module.exports = router;
