const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, checkPermission } = require('../middleware/auth');

// Get all permissions
router.get('/', authenticateToken, checkPermission('roles', 'read', 'permissions'), async (req, res) => {
    try {
        const { module, action } = req.query;
        
        let query = `SELECT * FROM permissions WHERE 1=1`;
        const params = [];
        
        if (module) {
            query += ` AND module = ?`;
            params.push(module);
        }
        
        if (action) {
            query += ` AND action = ?`;
            params.push(action);
        }
        
        query += ` ORDER BY module, action, resource`;
        
        const [permissions] = await db.query(query, params);
        
        res.json({
            success: true,
            data: permissions
        });
    } catch (error) {
        console.error('Error fetching permissions:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat mengambil data permissions'
        });
    }
});

// Get permissions grouped by module
router.get('/by-module', authenticateToken, checkPermission('roles', 'read', 'permissions'), async (req, res) => {
    try {
        const [permissions] = await db.query(`
            SELECT * FROM permissions 
            ORDER BY module, action, resource
        `);
        
        // Group by module
        const grouped = permissions.reduce((acc, perm) => {
            if (!acc[perm.module]) {
                acc[perm.module] = {
                    module: perm.module,
                    permissions: []
                };
            }
            acc[perm.module].permissions.push(perm);
            return acc;
        }, {});
        
        res.json({
            success: true,
            data: Object.values(grouped)
        });
    } catch (error) {
        console.error('Error fetching grouped permissions:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat mengambil data permissions'
        });
    }
});

// Get available modules
router.get('/modules', authenticateToken, checkPermission('roles', 'read', 'permissions'), async (req, res) => {
    try {
        const [modules] = await db.query(`
            SELECT DISTINCT module, COUNT(*) as permission_count
            FROM permissions
            GROUP BY module
            ORDER BY module
        `);
        
        res.json({
            success: true,
            data: modules
        });
    } catch (error) {
        console.error('Error fetching modules:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat mengambil data modules'
        });
    }
});

module.exports = router;
