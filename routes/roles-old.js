const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, checkPermission } = require('../middleware/auth');

// ============================================
// ROLES ENDPOINTS
// ============================================

// Get all roles
router.get('/', authenticateToken, checkPermission('roles', 'read', 'list'), async (req, res) => {
    try {
        const { search, is_system, is_active } = req.query;
        
        let query = `
            SELECT 
                r.id,
                r.name,
                r.description,
                r.is_system,
                r.is_active,
                COUNT(DISTINCT rp.permission_id) as permission_count,
                COUNT(DISTINCT ur.user_id) as user_count,
                r.created_at,
                r.updated_at,
                u.full_name as created_by_name
            FROM roles r
            LEFT JOIN role_permissions rp ON r.id = rp.role_id
            LEFT JOIN user_roles ur ON r.id = ur.role_id AND ur.is_active = 1
            LEFT JOIN users u ON r.created_by = u.id
            WHERE 1=1
        `;
        
        const params = [];
        
        if (search) {
            query += ` AND (r.name LIKE ? OR r.description LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`);
        }
        
        if (is_system !== undefined) {
            query += ` AND r.is_system = ?`;
            params.push(is_system === 'true' ? 1 : 0);
        }
        
        if (is_active !== undefined) {
            query += ` AND r.is_active = ?`;
            params.push(is_active === 'true' ? 1 : 0);
        }
        
        query += ` GROUP BY r.id, r.name, r.description, r.is_system, r.is_active, r.created_at, r.updated_at, u.full_name
                   ORDER BY r.is_system DESC, r.name ASC`;
        
        const [roles] = await db.query(query, params);
        
        res.json({
            success: true,
            data: roles
        });
    } catch (error) {
        console.error('Error fetching roles:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat mengambil data role'
        });
    }
});

// Get single role by ID with permissions
router.get('/:id', authenticateToken, checkPermission('roles', 'read', 'role'), async (req, res) => {
    try {
        const { id } = req.params;
        
        // Get role details
        const [roles] = await db.query(`
            SELECT 
                r.*,
                u.full_name as created_by_name
            FROM roles r
            LEFT JOIN users u ON r.created_by = u.id
            WHERE r.id = ?
        `, [id]);
        
        if (roles.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Role tidak ditemukan'
            });
        }
        
        // Get role permissions
        const [permissions] = await db.query(`
            SELECT 
                p.id,
                p.module,
                p.action,
                p.resource,
                p.description
            FROM role_permissions rp
            INNER JOIN permissions p ON rp.permission_id = p.id
            WHERE rp.role_id = ?
            ORDER BY p.module, p.action
        `, [id]);
        
        // Get users with this role
        const [users] = await db.query(`
            SELECT 
                u.id,
                u.username,
                u.full_name,
                u.email,
                ur.assigned_at,
                assigner.full_name as assigned_by_name
            FROM user_roles ur
            INNER JOIN users u ON ur.user_id = u.id
            LEFT JOIN users assigner ON ur.assigned_by = assigner.id
            WHERE ur.role_id = ? AND ur.is_active = 1
            ORDER BY ur.assigned_at DESC
        `, [id]);
        
        const role = {
            ...roles[0],
            permissions,
            users,
            user_count: users.length,
            permission_count: permissions.length
        };
        
        res.json({
            success: true,
            data: role
        });
    } catch (error) {
        console.error('Error fetching role:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat mengambil detail role'
        });
    }
});

// Create new role
router.post('/', authenticateToken, checkPermission('roles', 'create', 'role'), async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        const { name, description, permission_ids } = req.body;
        
        // Validation
        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Nama role wajib diisi'
            });
        }
        
        if (!permission_ids || permission_ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Minimal 1 permission harus dipilih'
            });
        }
        
        await connection.beginTransaction();
        
        // Check if role name already exists
        const [existing] = await connection.query(
            `SELECT id FROM roles WHERE name = ?`,
            [name]
        );
        
        if (existing.length > 0) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Nama role sudah digunakan'
            });
        }
        
        // Create role
        const [result] = await connection.query(
            `INSERT INTO roles (name, description, is_system, created_by) VALUES (?, ?, 0, ?)`,
            [name, description, req.user.userId]
        );
        
        const roleId = result.insertId;
        
        // Assign permissions
        for (const permissionId of permission_ids) {
            await connection.query(
                `INSERT INTO role_permissions (role_id, permission_id, created_by) VALUES (?, ?, ?)`,
                [roleId, permissionId, req.user.userId]
            );
        }
        
        // Audit log
        await connection.query(
            `INSERT INTO role_audit_log (role_id, action, changes, performed_by, ip_address, user_agent) 
             VALUES (?, 'created', ?, ?, ?, ?)`,
            [
                roleId,
                JSON.stringify({ name, description, permission_count: permission_ids.length }),
                req.user.userId,
                req.ip,
                req.get('user-agent')
            ]
        );
        
        await connection.commit();
        
        res.status(201).json({
            success: true,
            message: 'Role berhasil dibuat',
            role_id: roleId
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error creating role:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat membuat role'
        });
    } finally {
        connection.release();
    }
});

// Update role
router.put('/:id', authenticateToken, checkPermission('roles', 'update', 'role'), async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        const { id } = req.params;
        const { name, description, is_active } = req.body;
        
        await connection.beginTransaction();
        
        // Check if role exists
        const [roles] = await connection.query(`SELECT * FROM roles WHERE id = ?`, [id]);
        
        if (roles.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Role tidak ditemukan'
            });
        }
        
        // Allow editing system roles (Admin can edit permissions)
        // Removed is_system check to enable editing Admin, Manager, Viewer roles
        
        // Check unique name if changed
        if (name && name !== roles[0].name) {
            const [existing] = await connection.query(
                `SELECT id FROM roles WHERE name = ? AND id != ?`,
                [name, id]
            );
            
            if (existing.length > 0) {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'Nama role sudah digunakan'
                });
            }
        }
        
        // Update role
        const updates = [];
        const values = [];
        const changes = {};
        
        if (name !== undefined) {
            updates.push('name = ?');
            values.push(name);
            changes.name = { from: roles[0].name, to: name };
        }
        
        if (description !== undefined) {
            updates.push('description = ?');
            values.push(description);
            changes.description = { from: roles[0].description, to: description };
        }
        
        if (is_active !== undefined) {
            updates.push('is_active = ?');
            values.push(is_active ? 1 : 0);
            changes.is_active = { from: roles[0].is_active, to: is_active ? 1 : 0 };
        }
        
        if (updates.length > 0) {
            values.push(id);
            await connection.query(
                `UPDATE roles SET ${updates.join(', ')} WHERE id = ?`,
                values
            );
            
            // Audit log
            await connection.query(
                `INSERT INTO role_audit_log (role_id, action, changes, performed_by, ip_address, user_agent) 
                 VALUES (?, 'updated', ?, ?, ?, ?)`,
                [
                    id,
                    JSON.stringify(changes),
                    req.user.userId,
                    req.ip,
                    req.get('user-agent')
                ]
            );
        }
        
        await connection.commit();
        
        res.json({
            success: true,
            message: 'Role berhasil diupdate'
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error updating role:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat mengupdate role'
        });
    } finally {
        connection.release();
    }
});

// Delete role
router.delete('/:id', authenticateToken, checkPermission('roles', 'delete', 'role'), async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        const { id } = req.params;
        const { reassign_role_id } = req.body;
        
        await connection.beginTransaction();
        
        // Check if role exists
        const [roles] = await connection.query(`SELECT * FROM roles WHERE id = ?`, [id]);
        
        if (roles.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Role tidak ditemukan'
            });
        }
        
        // Check if it's a system role
        if (roles[0].is_system) {
            await connection.rollback();
            return res.status(403).json({
                success: false,
                message: 'System role tidak dapat dihapus'
            });
        }
        
        // Check if role has active users
        const [activeUsers] = await connection.query(
            `SELECT COUNT(*) as count FROM user_roles WHERE role_id = ? AND is_active = 1`,
            [id]
        );
        
        if (activeUsers[0].count > 0) {
            if (!reassign_role_id) {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    message: `Role ini masih digunakan oleh ${activeUsers[0].count} user aktif. Silakan reassign user terlebih dahulu.`,
                    user_count: activeUsers[0].count
                });
            }
            
            // Reassign users to new role
            await connection.query(
                `UPDATE user_roles SET role_id = ? WHERE role_id = ? AND is_active = 1`,
                [reassign_role_id, id]
            );
        }
        
        // Audit log before deletion
        await connection.query(
            `INSERT INTO role_audit_log (role_id, action, changes, performed_by, ip_address, user_agent) 
             VALUES (?, 'deleted', ?, ?, ?, ?)`,
            [
                id,
                JSON.stringify({ name: roles[0].name, user_count: activeUsers[0].count }),
                req.user.userId,
                req.ip,
                req.get('user-agent')
            ]
        );
        
        // Delete role (cascade will delete role_permissions)
        await connection.query(`DELETE FROM roles WHERE id = ?`, [id]);
        
        await connection.commit();
        
        res.json({
            success: true,
            message: 'Role berhasil dihapus'
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error deleting role:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat menghapus role'
        });
    } finally {
        connection.release();
    }
});

// Clone role
router.post('/:id/clone', authenticateToken, checkPermission('roles', 'execute', 'clone'), async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        
        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Nama role baru wajib diisi'
            });
        }
        
        await connection.beginTransaction();
        
        // Check if source role exists
        const [sourceRole] = await connection.query(`SELECT * FROM roles WHERE id = ?`, [id]);
        
        if (sourceRole.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Role sumber tidak ditemukan'
            });
        }
        
        // Check if new name already exists
        const [existing] = await connection.query(`SELECT id FROM roles WHERE name = ?`, [name]);
        
        if (existing.length > 0) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Nama role sudah digunakan'
            });
        }
        
        // Create new role
        const [result] = await connection.query(
            `INSERT INTO roles (name, description, is_system, created_by) VALUES (?, ?, 0, ?)`,
            [name, description || `Cloned from ${sourceRole[0].name}`, req.user.userId]
        );
        
        const newRoleId = result.insertId;
        
        // Copy permissions
        await connection.query(
            `INSERT INTO role_permissions (role_id, permission_id, created_by)
             SELECT ?, permission_id, ? FROM role_permissions WHERE role_id = ?`,
            [newRoleId, req.user.userId, id]
        );
        
        // Audit log
        await connection.query(
            `INSERT INTO role_audit_log (role_id, action, changes, performed_by, ip_address, user_agent) 
             VALUES (?, 'cloned', ?, ?, ?, ?)`,
            [
                newRoleId,
                JSON.stringify({ source_role: sourceRole[0].name, source_role_id: id }),
                req.user.userId,
                req.ip,
                req.get('user-agent')
            ]
        );
        
        await connection.commit();
        
        res.status(201).json({
            success: true,
            message: 'Role berhasil di-clone',
            role_id: newRoleId
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error cloning role:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat cloning role'
        });
    } finally {
        connection.release();
    }
});

// Update role permissions
router.put('/:id/permissions', authenticateToken, checkPermission('roles', 'update', 'permissions'), async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        const { id } = req.params;
        const { permission_ids } = req.body;
        
        if (!Array.isArray(permission_ids)) {
            return res.status(400).json({
                success: false,
                message: 'Format permission_ids tidak valid'
            });
        }
        
        if (permission_ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Minimal 1 permission harus dipilih'
            });
        }
        
        await connection.beginTransaction();
        
        // Check if role exists
        const [roles] = await connection.query(`SELECT * FROM roles WHERE id = ?`, [id]);
        
        if (roles.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Role tidak ditemukan'
            });
        }
        
        // Allow editing system role permissions (Admin can manage all roles)
        // Removed is_system check to enable editing Admin, Manager, Viewer permissions
        
        // Get current permissions for audit
        const [currentPerms] = await connection.query(
            `SELECT permission_id FROM role_permissions WHERE role_id = ?`,
            [id]
        );
        const currentPermIds = currentPerms.map(p => p.permission_id);
        
        // Delete all current permissions
        await connection.query(`DELETE FROM role_permissions WHERE role_id = ?`, [id]);
        
        // Insert new permissions
        for (const permissionId of permission_ids) {
            await connection.query(
                `INSERT INTO role_permissions (role_id, permission_id, created_by) VALUES (?, ?, ?)`,
                [id, permissionId, req.user.userId]
            );
        }
        
        // Audit log
        const added = permission_ids.filter(p => !currentPermIds.includes(p));
        const removed = currentPermIds.filter(p => !permission_ids.includes(p));
        
        await connection.query(
            `INSERT INTO role_audit_log (role_id, action, changes, performed_by, ip_address, user_agent) 
             VALUES (?, 'permissions_updated', ?, ?, ?, ?)`,
            [
                id,
                JSON.stringify({ 
                    added_count: added.length, 
                    removed_count: removed.length,
                    total: permission_ids.length 
                }),
                req.user.userId,
                req.ip,
                req.get('user-agent')
            ]
        );
        
        await connection.commit();
        
        // Get count of users with this role who are currently logged in
        // Note: This is informational only - we don't track active sessions in DB
        const [usersWithRole] = await connection.query(
            `SELECT COUNT(DISTINCT u.id) as user_count 
             FROM users u 
             JOIN user_roles ur ON u.id = ur.user_id 
             WHERE ur.role_id = ? AND ur.is_active = 1`,
            [id]
        );
        
        const affectedUsers = usersWithRole[0]?.user_count || 0;
        
        res.json({
            success: true,
            message: 'Permissions role berhasil diupdate',
            stats: {
                added: added.length,
                removed: removed.length,
                total: permission_ids.length,
                affected_users: affectedUsers
            },
            warning: affectedUsers > 0 ? 
                `${affectedUsers} user(s) dengan role ini perlu LOGOUT & LOGIN ULANG untuk apply permissions baru` : 
                null
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error updating role permissions:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat mengupdate permissions'
        });
    } finally {
        connection.release();
    }
});

// Get role audit log
router.get('/:id/audit', authenticateToken, checkPermission('settings', 'read', 'audit_log'), async (req, res) => {
    try {
        const { id } = req.params;
        const { limit = 50, offset = 0 } = req.query;
        
        const [logs] = await db.query(`
            SELECT 
                ral.*,
                u.full_name as performed_by_name
            FROM role_audit_log ral
            LEFT JOIN users u ON ral.performed_by = u.id
            WHERE ral.role_id = ?
            ORDER BY ral.performed_at DESC
            LIMIT ? OFFSET ?
        `, [id, parseInt(limit), parseInt(offset)]);
        
        const [total] = await db.query(
            `SELECT COUNT(*) as count FROM role_audit_log WHERE role_id = ?`,
            [id]
        );
        
        res.json({
            success: true,
            data: logs,
            pagination: {
                total: total[0].count,
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });
    } catch (error) {
        console.error('Error fetching audit log:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat mengambil audit log'
        });
    }
});

module.exports = router;
