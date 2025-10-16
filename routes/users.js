const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const { authenticateToken, checkPermission } = require('../middleware/auth');

// Get all users with their roles and permissions
router.get('/', authenticateToken, checkPermission('users', 'read', 'list'), async (req, res) => {
    try {
        const [users] = await db.query(`
            SELECT 
                u.id,
                u.username,
                u.email,
                u.is_active,
                u.created_at,
                u.updated_at,
                GROUP_CONCAT(DISTINCT r.name ORDER BY r.name) as roles,
                GROUP_CONCAT(DISTINCT r.id ORDER BY r.name) as role_ids,
                COUNT(DISTINCT p.id) as permission_count
            FROM users u
            LEFT JOIN user_roles ur ON u.id = ur.user_id
            LEFT JOIN roles r ON ur.role_id = r.id
            LEFT JOIN role_permissions rp ON r.id = rp.role_id
            LEFT JOIN permissions p ON rp.permission_id = p.id
            GROUP BY u.id, u.username, u.email, u.is_active, u.created_at, u.updated_at
            ORDER BY u.username
        `);

        res.json({ 
            success: true, 
            data: users.map(user => ({
                ...user,
                roles: user.roles ? user.roles.split(',') : [],
                role_ids: user.role_ids ? user.role_ids.split(',').map(id => parseInt(id)) : []
            }))
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get user by ID with detailed permissions
router.get('/:id', authenticateToken, checkPermission('users', 'read', 'detail'), async (req, res) => {
    try {
        const userId = req.params.id;

        // Get user basic info
        const [users] = await db.query(
            'SELECT id, username, email, is_active, created_at, updated_at FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const user = users[0];

        // Get user roles
        const [roles] = await db.query(`
            SELECT r.id, r.name, r.description
            FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = ?
        `, [userId]);

        // Get user permissions (via roles)
        const [permissions] = await db.query(`
            SELECT DISTINCT
                p.id,
                p.module,
                p.action,
                p.resource,
                p.description
            FROM user_roles ur
            JOIN role_permissions rp ON ur.role_id = rp.role_id
            JOIN permissions p ON rp.permission_id = p.id
            WHERE ur.user_id = ?
            ORDER BY p.module, p.resource, p.action
        `, [userId]);

        res.json({
            success: true,
            data: {
                ...user,
                roles,
                permissions
            }
        });
    } catch (error) {
        console.error('Error fetching user details:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create new user
router.post('/', authenticateToken, checkPermission('users', 'create', 'user'), async (req, res) => {
    try {
        const { username, email, password, role_ids, is_active = true } = req.body;

        // Validate required fields
        if (!username || !email || !password) {
            return res.status(400).json({ 
                success: false, 
                error: 'Username, email, and password are required' 
            });
        }

        // Check if username already exists
        const [existingUser] = await db.query(
            'SELECT id FROM users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'Username or email already exists' 
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const [result] = await db.query(
            'INSERT INTO users (username, email, password, is_active, created_at) VALUES (?, ?, ?, ?, NOW())',
            [username, email, hashedPassword, is_active]
        );

        const newUserId = result.insertId;

        // Assign roles
        if (role_ids && role_ids.length > 0) {
            for (const roleId of role_ids) {
                await db.query(
                    'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
                    [newUserId, roleId]
                );
            }
        }

        res.status(201).json({ 
            success: true, 
            message: 'User created successfully',
            data: { id: newUserId, username, email }
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update user
router.put('/:id', authenticateToken, checkPermission('users', 'update', 'user'), async (req, res) => {
    try {
        const userId = req.params.id;
        const { username, email, password, is_active } = req.body;

        // Check if user exists
        const [users] = await db.query('SELECT id FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Build update query
        const updates = [];
        const values = [];

        if (username !== undefined) {
            updates.push('username = ?');
            values.push(username);
        }
        if (email !== undefined) {
            updates.push('email = ?');
            values.push(email);
        }
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updates.push('password = ?');
            values.push(hashedPassword);
        }
        if (is_active !== undefined) {
            updates.push('is_active = ?');
            values.push(is_active);
        }

        updates.push('updated_at = NOW()');
        values.push(userId);

        if (updates.length > 1) { // More than just updated_at
            await db.query(
                `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
                values
            );
        }

        res.json({ 
            success: true, 
            message: 'User updated successfully' 
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete user
router.delete('/:id', authenticateToken, checkPermission('users', 'delete', 'user'), async (req, res) => {
    try {
        const userId = req.params.id;

        // Prevent deleting own account
        if (userId == req.user.id) {
            return res.status(400).json({ 
                success: false, 
                error: 'Cannot delete your own account' 
            });
        }

        // Check if user exists
        const [users] = await db.query('SELECT id FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Delete user roles first
        await db.query('DELETE FROM user_roles WHERE user_id = ?', [userId]);

        // Delete user
        await db.query('DELETE FROM users WHERE id = ?', [userId]);

        res.json({ 
            success: true, 
            message: 'User deleted successfully' 
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Assign roles to user
router.post('/:id/roles', authenticateToken, checkPermission('users', 'update', 'roles'), async (req, res) => {
    try {
        const userId = req.params.id;
        const { role_ids } = req.body;

        if (!role_ids || !Array.isArray(role_ids)) {
            return res.status(400).json({ 
                success: false, 
                error: 'role_ids must be an array' 
            });
        }

        // Check if user exists
        const [users] = await db.query('SELECT id FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Remove existing roles
        await db.query('DELETE FROM user_roles WHERE user_id = ?', [userId]);

        // Assign new roles
        for (const roleId of role_ids) {
            await db.query(
                'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
                [userId, roleId]
            );
        }

        res.json({ 
            success: true, 
            message: 'User roles updated successfully' 
        });
    } catch (error) {
        console.error('Error assigning roles:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get user's roles
router.get('/:id/roles', authenticateToken, checkPermission('users', 'read', 'roles'), async (req, res) => {
    try {
        const userId = req.params.id;

        const [roles] = await db.query(`
            SELECT r.id, r.name, r.description
            FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = ?
        `, [userId]);

        res.json({ success: true, data: roles });
    } catch (error) {
        console.error('Error fetching user roles:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get user's effective permissions
router.get('/:id/permissions', authenticateToken, checkPermission('users', 'read', 'permissions'), async (req, res) => {
    try {
        const userId = req.params.id;

        const [permissions] = await db.query(`
            SELECT DISTINCT
                p.id,
                p.module,
                p.action,
                p.resource,
                p.description,
                GROUP_CONCAT(DISTINCT r.name ORDER BY r.name) as granted_by_roles
            FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            JOIN role_permissions rp ON r.id = rp.role_id
            JOIN permissions p ON rp.permission_id = p.id
            WHERE ur.user_id = ?
            GROUP BY p.id, p.module, p.action, p.resource, p.description
            ORDER BY p.module, p.resource, p.action
        `, [userId]);

        res.json({ success: true, data: permissions });
    } catch (error) {
        console.error('Error fetching user permissions:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Toggle user active status
router.patch('/:id/toggle-active', authenticateToken, checkPermission('users', 'update', 'status'), async (req, res) => {
    try {
        const userId = req.params.id;

        // Prevent disabling own account
        if (userId == req.user.id) {
            return res.status(400).json({ 
                success: false, 
                error: 'Cannot disable your own account' 
            });
        }

        const [users] = await db.query('SELECT is_active FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const newStatus = !users[0].is_active;

        await db.query('UPDATE users SET is_active = ?, updated_at = NOW() WHERE id = ?', [newStatus, userId]);

        res.json({ 
            success: true, 
            message: `User ${newStatus ? 'activated' : 'deactivated'} successfully`,
            data: { is_active: newStatus }
        });
    } catch (error) {
        console.error('Error toggling user status:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
