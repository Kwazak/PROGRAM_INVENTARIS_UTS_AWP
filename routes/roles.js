/**
 * Roles Routes - Complete CRUD and Permission Management
 * Author: Factory Inventory System
 * Date: 2025-10-10
 */

const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

/**
 * GET /api/roles
 * Get all roles with user count and permissions
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        // Get all roles with user count
        const rolesQuery = `
            SELECT 
                r.id,
                r.name,
                r.description,
                r.is_active,
                r.is_system,
                r.created_at,
                r.updated_at,
                COUNT(DISTINCT ur.user_id) as user_count
            FROM roles r
            LEFT JOIN user_roles ur ON ur.role_id = r.id AND ur.is_active = 1
            GROUP BY r.id
            ORDER BY 
                r.is_system DESC,
                r.name ASC
        `;
        
        const [roles] = await db.query(rolesQuery);
        
        // Get permissions for each role
        for (let role of roles) {
            const [permissions] = await db.query(`
                SELECT 
                    p.id,
                    p.module,
                    p.action,
                    p.resource,
                    p.description,
                    CONCAT(p.module, ':', p.action, IF(p.resource IS NOT NULL, CONCAT(':', p.resource), '')) as permission_string
                FROM permissions p
                INNER JOIN role_permissions rp ON p.id = rp.permission_id
                WHERE rp.role_id = ?
                ORDER BY p.module, p.action, p.resource
            `, [role.id]);
            
            role.permissions = permissions;
        }
        
        res.json({
            success: true,
            message: 'Roles retrieved successfully',
            data: roles
        });
    } catch (error) {
        console.error('Error fetching roles:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch roles',
            error: error.message
        });
    }
});

/**
 * GET /api/roles/:id
 * Get single role by ID with permissions
 */
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const roleId = req.params.id;
        
        // Get role details
        const [roles] = await db.query(`
            SELECT 
                r.id,
                r.name,
                r.description,
                r.is_active,
                r.is_system,
                r.created_at,
                r.updated_at,
                COUNT(DISTINCT u.id) as user_count
            FROM roles r
            LEFT JOIN users u ON u.role_id = r.id
            WHERE r.id = ?
            GROUP BY r.id
        `, [roleId]);
        
        if (roles.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Role not found'
            });
        }
        
        const role = roles[0];
        
        // Get permissions for this role
        const [permissions] = await db.query(`
            SELECT 
                p.id,
                p.name,
                p.description,
                p.module,
                p.action
            FROM permissions p
            INNER JOIN role_permissions rp ON p.id = rp.permission_id
            WHERE rp.role_id = ?
            ORDER BY p.module, p.name
        `, [roleId]);
        
        role.permissions = permissions;
        
        res.json({
            success: true,
            message: 'Role retrieved successfully',
            data: role
        });
    } catch (error) {
        console.error('Error fetching role:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch role',
            error: error.message
        });
    }
});

/**
 * POST /api/roles
 * Create new role with permissions
 */
router.post('/', authenticateToken, async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { name, description, is_active, permissions } = req.body;
        
        // Validate input
        if (!name || name.trim() === '') {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Role name is required'
            });
        }
        
        // Check if role name already exists
        const [existing] = await connection.query(
            'SELECT id FROM roles WHERE name = ?',
            [name.trim()]
        );
        
        if (existing.length > 0) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Role name already exists'
            });
        }
        
        // Insert role
        const [result] = await connection.query(`
            INSERT INTO roles (name, description, is_active, is_system)
            VALUES (?, ?, ?, 0)
        `, [
            name.trim(),
            description ? description.trim() : null,
            is_active !== false ? 1 : 0
        ]);
        
        const roleId = result.insertId;
        
        // Insert permissions if provided
        if (permissions && Array.isArray(permissions) && permissions.length > 0) {
            const permissionValues = permissions.map(permId => [roleId, permId]);
            await connection.query(`
                INSERT INTO role_permissions (role_id, permission_id)
                VALUES ?
            `, [permissionValues]);
        }
        
        await connection.commit();
        
        res.status(201).json({
            success: true,
            message: 'Role created successfully',
            data: {
                id: roleId,
                name: name.trim()
            }
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error creating role:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create role',
            error: error.message
        });
    } finally {
        connection.release();
    }
});

/**
 * PUT /api/roles/:id
 * Update role and permissions
 */
router.put('/:id', authenticateToken, async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const roleId = req.params.id;
        const { name, description, is_active, permissions } = req.body;
        
        // Check if role exists
        const [roles] = await connection.query(
            'SELECT id, is_system FROM roles WHERE id = ?',
            [roleId]
        );
        
        if (roles.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Role not found'
            });
        }
        
        const role = roles[0];
        
        // Validate input
        if (!name || name.trim() === '') {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Role name is required'
            });
        }
        
        // Check if name is taken by another role
        const [existing] = await connection.query(
            'SELECT id FROM roles WHERE name = ? AND id != ?',
            [name.trim(), roleId]
        );
        
        if (existing.length > 0) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Role name already exists'
            });
        }
        
        // Update role
        await connection.query(`
            UPDATE roles 
            SET name = ?, 
                description = ?, 
                is_active = ?,
                updated_at = NOW()
            WHERE id = ?
        `, [
            name.trim(),
            description ? description.trim() : null,
            is_active !== false ? 1 : 0,
            roleId
        ]);
        
        // Update permissions
        // Delete existing permissions
        await connection.query('DELETE FROM role_permissions WHERE role_id = ?', [roleId]);
        
        // Insert new permissions
        if (permissions && Array.isArray(permissions) && permissions.length > 0) {
            const permissionValues = permissions.map(permId => [roleId, permId]);
            await connection.query(`
                INSERT INTO role_permissions (role_id, permission_id)
                VALUES ?
            `, [permissionValues]);
        }
        
        await connection.commit();
        
        res.json({
            success: true,
            message: 'Role updated successfully',
            data: {
                id: roleId,
                name: name.trim()
            }
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error updating role:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update role',
            error: error.message
        });
    } finally {
        connection.release();
    }
});

/**
 * DELETE /api/roles/:id
 * Delete role (only if not system role and no users)
 */
router.delete('/:id', authenticateToken, async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const roleId = req.params.id;
        
        // Check if role exists
        const [roles] = await connection.query(`
            SELECT 
                r.id,
                r.name,
                r.is_system,
                COUNT(u.id) as user_count
            FROM roles r
            LEFT JOIN users u ON u.role_id = r.id
            WHERE r.id = ?
            GROUP BY r.id
        `, [roleId]);
        
        if (roles.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Role not found'
            });
        }
        
        const role = roles[0];
        
        // Check if system role
        if (role.is_system) {
            await connection.rollback();
            return res.status(403).json({
                success: false,
                message: 'Cannot delete system role'
            });
        }
        
        // Check if role has users
        if (role.user_count > 0) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: `Cannot delete role. ${role.user_count} user(s) are assigned to this role.`
            });
        }
        
        // Delete role permissions first
        await connection.query('DELETE FROM role_permissions WHERE role_id = ?', [roleId]);
        
        // Delete role
        await connection.query('DELETE FROM roles WHERE id = ?', [roleId]);
        
        await connection.commit();
        
        res.json({
            success: true,
            message: 'Role deleted successfully'
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error deleting role:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete role',
            error: error.message
        });
    } finally {
        connection.release();
    }
});

/**
 * POST /api/roles/:id/clone
 * Clone role with all permissions
 */
router.post('/:id/clone', authenticateToken, async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const sourceRoleId = req.params.id;
        const { name } = req.body;
        
        // Validate name
        if (!name || name.trim() === '') {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'New role name is required'
            });
        }
        
        // Check if source role exists
        const [sourceRoles] = await connection.query(
            'SELECT id, name, description, is_active FROM roles WHERE id = ?',
            [sourceRoleId]
        );
        
        if (sourceRoles.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Source role not found'
            });
        }
        
        const sourceRole = sourceRoles[0];
        
        // Check if new name already exists
        const [existing] = await connection.query(
            'SELECT id FROM roles WHERE name = ?',
            [name.trim()]
        );
        
        if (existing.length > 0) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Role name already exists'
            });
        }
        
        // Create new role
        const [result] = await connection.query(`
            INSERT INTO roles (name, description, is_active, is_system)
            VALUES (?, ?, ?, 0)
        `, [
            name.trim(),
            sourceRole.description,
            sourceRole.is_active
        ]);
        
        const newRoleId = result.insertId;
        
        // Copy permissions
        const [permissions] = await connection.query(
            'SELECT permission_id FROM role_permissions WHERE role_id = ?',
            [sourceRoleId]
        );
        
        if (permissions.length > 0) {
            const permissionValues = permissions.map(p => [newRoleId, p.permission_id]);
            await connection.query(`
                INSERT INTO role_permissions (role_id, permission_id)
                VALUES ?
            `, [permissionValues]);
        }
        
        await connection.commit();
        
        res.status(201).json({
            success: true,
            message: `Role cloned successfully from "${sourceRole.name}"`,
            data: {
                id: newRoleId,
                name: name.trim()
            }
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error cloning role:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to clone role',
            error: error.message
        });
    } finally {
        connection.release();
    }
});

module.exports = router;
