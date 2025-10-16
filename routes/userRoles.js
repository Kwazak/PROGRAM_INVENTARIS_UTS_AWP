const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, checkPermission } = require('../middleware/auth');

// Get user's roles
router.get('/:userId/roles', authenticateToken, checkPermission('users', 'read', 'user'), async (req, res) => {
    try {
        const { userId } = req.params;
        
        const [roles] = await db.query(`
            SELECT 
                r.id,
                r.name,
                r.description,
                r.is_system,
                ur.assigned_at,
                ur.expires_at,
                ur.is_active,
                assigner.full_name as assigned_by_name
            FROM user_roles ur
            INNER JOIN roles r ON ur.role_id = r.id
            LEFT JOIN users assigner ON ur.assigned_by = assigner.id
            WHERE ur.user_id = ?
            ORDER BY ur.assigned_at DESC
        `, [userId]);
        
        res.json({
            success: true,
            data: roles
        });
    } catch (error) {
        console.error('Error fetching user roles:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat mengambil role user'
        });
    }
});

// Get user's effective permissions
router.get('/:userId/permissions', authenticateToken, checkPermission('users', 'read', 'user'), async (req, res) => {
    try {
        const { userId } = req.params;
        
        const [permissions] = await db.query(`
            SELECT DISTINCT
                p.id,
                p.module,
                p.action,
                p.resource,
                p.description
            FROM user_roles ur
            INNER JOIN role_permissions rp ON ur.role_id = rp.role_id
            INNER JOIN permissions p ON rp.permission_id = p.id
            INNER JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = ? 
                AND ur.is_active = 1
                AND r.is_active = 1
                AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
            ORDER BY p.module, p.action, p.resource
        `, [userId]);
        
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
            data: {
                permissions,
                grouped: Object.values(grouped),
                total: permissions.length
            }
        });
    } catch (error) {
        console.error('Error fetching user permissions:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat mengambil permissions user'
        });
    }
});

// Assign role to user
router.post('/:userId/roles', authenticateToken, checkPermission('users', 'update', 'roles'), async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        const { userId } = req.params;
        const { role_id, expires_at } = req.body;
        
        if (!role_id) {
            return res.status(400).json({
                success: false,
                message: 'Role ID wajib diisi'
            });
        }
        
        await connection.beginTransaction();
        
        // Check if user exists
        const [users] = await connection.query(`SELECT id FROM users WHERE id = ?`, [userId]);
        
        if (users.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'User tidak ditemukan'
            });
        }
        
        // Check if role exists and is active
        const [roles] = await connection.query(
            `SELECT * FROM roles WHERE id = ? AND is_active = 1`,
            [role_id]
        );
        
        if (roles.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Role tidak ditemukan atau tidak aktif'
            });
        }
        
        // Check if already assigned
        const [existing] = await connection.query(
            `SELECT id FROM user_roles WHERE user_id = ? AND role_id = ? AND is_active = 1`,
            [userId, role_id]
        );
        
        if (existing.length > 0) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'User sudah memiliki role ini'
            });
        }
        
        // Assign role
        await connection.query(
            `INSERT INTO user_roles (user_id, role_id, assigned_by, expires_at) VALUES (?, ?, ?, ?)`,
            [userId, role_id, req.user.userId, expires_at || null]
        );
        
        // Audit log
        await connection.query(
            `INSERT INTO role_audit_log (role_id, action, changes, performed_by, ip_address, user_agent) 
             VALUES (?, 'user_assigned', ?, ?, ?, ?)`,
            [
                role_id,
                JSON.stringify({ user_id: userId, role_name: roles[0].name }),
                req.user.userId,
                req.ip,
                req.get('user-agent')
            ]
        );
        
        await connection.commit();
        
        res.status(201).json({
            success: true,
            message: 'Role berhasil di-assign ke user'
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error assigning role:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat assign role'
        });
    } finally {
        connection.release();
    }
});

// Remove role from user
router.delete('/:userId/roles/:roleId', authenticateToken, checkPermission('users', 'update', 'roles'), async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        const { userId, roleId } = req.params;
        
        await connection.beginTransaction();
        
        // Check if assignment exists
        const [assignments] = await connection.query(
            `SELECT * FROM user_roles WHERE user_id = ? AND role_id = ? AND is_active = 1`,
            [userId, roleId]
        );
        
        if (assignments.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'User tidak memiliki role ini'
            });
        }
        
        // Check if user has at least one other active role
        const [otherRoles] = await connection.query(
            `SELECT COUNT(*) as count FROM user_roles 
             WHERE user_id = ? AND role_id != ? AND is_active = 1`,
            [userId, roleId]
        );
        
        if (otherRoles[0].count === 0) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'User harus memiliki minimal 1 role aktif'
            });
        }
        
        // Deactivate role assignment
        await connection.query(
            `UPDATE user_roles SET is_active = 0, revoked_by = ?, revoked_at = NOW() 
             WHERE user_id = ? AND role_id = ?`,
            [req.user.userId, userId, roleId]
        );
        
        // Get role name for audit
        const [roles] = await connection.query(`SELECT name FROM roles WHERE id = ?`, [roleId]);
        
        // Audit log
        await connection.query(
            `INSERT INTO role_audit_log (role_id, action, changes, performed_by, ip_address, user_agent) 
             VALUES (?, 'user_removed', ?, ?, ?, ?)`,
            [
                roleId,
                JSON.stringify({ user_id: userId, role_name: roles[0]?.name }),
                req.user.userId,
                req.ip,
                req.get('user-agent')
            ]
        );
        
        await connection.commit();
        
        res.json({
            success: true,
            message: 'Role berhasil dihapus dari user'
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error removing role:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat menghapus role'
        });
    } finally {
        connection.release();
    }
});

// Bulk assign roles to user
router.post('/:userId/roles/bulk', authenticateToken, checkPermission('users', 'update', 'roles'), async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        const { userId } = req.params;
        const { role_ids } = req.body;
        
        if (!Array.isArray(role_ids) || role_ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Role IDs wajib diisi dan harus array'
            });
        }
        
        await connection.beginTransaction();
        
        // Check if user exists
        const [users] = await connection.query(`SELECT id FROM users WHERE id = ?`, [userId]);
        
        if (users.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'User tidak ditemukan'
            });
        }
        
        // Deactivate all current roles
        await connection.query(
            `UPDATE user_roles SET is_active = 0, revoked_by = ?, revoked_at = NOW() 
             WHERE user_id = ? AND is_active = 1`,
            [req.user.userId, userId]
        );
        
        let assignedCount = 0;
        
        // Assign new roles
        for (const roleId of role_ids) {
            // Check if role exists and is active
            const [roles] = await connection.query(
                `SELECT * FROM roles WHERE id = ? AND is_active = 1`,
                [roleId]
            );
            
            if (roles.length > 0) {
                await connection.query(
                    `INSERT INTO user_roles (user_id, role_id, assigned_by) VALUES (?, ?, ?)`,
                    [userId, roleId, req.user.userId]
                );
                
                // Audit log
                await connection.query(
                    `INSERT INTO role_audit_log (role_id, action, changes, performed_by, ip_address, user_agent) 
                     VALUES (?, 'user_assigned', ?, ?, ?, ?)`,
                    [
                        roleId,
                        JSON.stringify({ user_id: userId, role_name: roles[0].name, bulk: true }),
                        req.user.userId,
                        req.ip,
                        req.get('user-agent')
                    ]
                );
                
                assignedCount++;
            }
        }
        
        await connection.commit();
        
        res.json({
            success: true,
            message: `${assignedCount} role berhasil di-assign ke user`,
            assigned_count: assignedCount
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error bulk assigning roles:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat bulk assign roles'
        });
    } finally {
        connection.release();
    }
});

module.exports = router;
