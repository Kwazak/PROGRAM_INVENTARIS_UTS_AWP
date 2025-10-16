const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

// Register new user (Public - self registration with default 'viewer' role)
router.post('/register', [
    body('username').trim().isLength({ min: 3 }).withMessage('Username minimal 3 karakter'),
    body('email').isEmail().withMessage('Email tidak valid'),
    body('password').isLength({ min: 6 }).withMessage('Password minimal 6 karakter'),
    body('full_name').trim().notEmpty().withMessage('Nama lengkap wajib diisi')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: errors.array()[0].msg,
                errors: errors.array()
            });
        }

        const { username, email, password, full_name, phone } = req.body;

        // Check if user exists
        const [existingUser] = await db.query(
            'SELECT id FROM users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Username atau email sudah terdaftar'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Start transaction
        await db.query('START TRANSACTION');

        try {
            // Insert user (WITHOUT role column - using RBAC instead)
            const [result] = await db.query(
                `INSERT INTO users (username, email, password, full_name, phone) 
                 VALUES (?, ?, ?, ?, ?)`,
                [username, email, hashedPassword, full_name, phone || null]
            );

            const userId = result.insertId;

            // Check if 'Viewer' role exists in roles table
            let [viewerRole] = await db.query(
                'SELECT id FROM roles WHERE name = ?',
                ['Viewer']
            );

            let viewerRoleId;

            // If Viewer role doesn't exist, create it
            if (viewerRole.length === 0) {
                const [roleResult] = await db.query(
                    `INSERT INTO roles (name, description, is_system, is_active) 
                     VALUES ('Viewer', 'Read-only access to all modules', 1, 1)`
                );
                viewerRoleId = roleResult.insertId;

                // Assign basic read permissions to Viewer role
                // Get all 'read' permissions
                const [readPermissions] = await db.query(
                    "SELECT id FROM permissions WHERE action = 'read'"
                );

                // Assign all read permissions to Viewer role
                if (readPermissions.length > 0) {
                    const permissionValues = readPermissions.map(p => 
                        `(${viewerRoleId}, ${p.id})`
                    ).join(',');
                    
                    await db.query(
                        `INSERT INTO role_permissions (role_id, permission_id) 
                         VALUES ${permissionValues}`
                    );
                }
            } else {
                viewerRoleId = viewerRole[0].id;
            }

            // Assign Viewer role to new user in user_roles table
            await db.query(
                `INSERT INTO user_roles (user_id, role_id, is_active) 
                 VALUES (?, ?, 1)`,
                [userId, viewerRoleId]
            );

            // Commit transaction
            await db.query('COMMIT');

            res.status(201).json({
                success: true,
                message: 'Akun berhasil dibuat! Silakan login dengan akun Anda. Role default adalah Viewer, admin dapat mengubahnya nanti.',
                userId: userId
            });

        } catch (txError) {
            // Rollback on error
            await db.query('ROLLBACK');
            throw txError;
        }

    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat registrasi'
        });
    }
});

// Login
router.post('/login', [
    body('username').trim().notEmpty(),
    body('password').notEmpty()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { username, password } = req.body;

        // Get user
        const [users] = await db.query(
            'SELECT * FROM users WHERE username = ? AND is_active = TRUE',
            [username]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Username atau password salah'
            });
        }

        const user = users[0];

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Username atau password salah'
            });
        }

        // Get user roles (RBAC support)
        const [userRoles] = await db.query(
            `SELECT r.id, r.name, r.description 
             FROM user_roles ur
             JOIN roles r ON ur.role_id = r.id
             WHERE ur.user_id = ? AND ur.is_active = 1`,
            [user.id]
        );

        // Get primary role (first active role, or fallback to 'Viewer')
        let primaryRole = 'Viewer';
        let roleId = null;
        
        if (userRoles.length > 0) {
            // Prioritize Admin > Manager > Viewer (3 roles only)
            const admin = userRoles.find(r => r.name === 'Admin');
            const manager = userRoles.find(r => r.name === 'Manager');
            const viewer = userRoles.find(r => r.name === 'Viewer');
            
            if (admin) {
                primaryRole = admin.name;
                roleId = admin.id;
            } else if (manager) {
                primaryRole = manager.name;
                roleId = manager.id;
            } else if (viewer) {
                primaryRole = viewer.name;
                roleId = viewer.id;
            } else {
                // Fallback to first role
                primaryRole = userRoles[0].name;
                roleId = userRoles[0].id;
            }
        }

        // Get user permissions
        const [permissions] = await db.query(
            `SELECT DISTINCT p.module, p.action, p.resource 
             FROM user_roles ur
             JOIN role_permissions rp ON ur.role_id = rp.role_id
             JOIN permissions p ON rp.permission_id = p.id
             WHERE ur.user_id = ? AND ur.is_active = 1`,
            [user.id]
        );

        // Format permissions as module:action:resource or module:action
        const formattedPermissions = permissions.map(p => {
            if (p.resource && p.resource !== '*') {
                return `${p.module}:${p.action}:${p.resource}`;
            } else {
                return `${p.module}:${p.action}`;
            }
        });

        // Generate JWT token with RBAC info
        const token = jwt.sign(
            {
                userId: user.id,
                username: user.username,
                role: primaryRole, // For backward compatibility
                roleId: roleId,
                permissions: formattedPermissions
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Update last login
        await db.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

        res.json({
            success: true,
            message: 'Login berhasil',
            token: token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                role: primaryRole, // Primary role name
                roleId: roleId,
                roles: userRoles.map(r => ({ id: r.id, name: r.name })),
                permissions: formattedPermissions
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat login'
        });
    }
});

// Get profile (protected route)
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT id, username, email, full_name, role, phone, avatar, created_at FROM users WHERE id = ?',
            [req.user.userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User tidak ditemukan'
            });
        }

        res.json({
            success: true,
            user: users[0]
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan'
        });
    }
});

// Logout
router.post('/logout', authenticateToken, (req, res) => {
    // In a production app, you might want to blacklist the token
    res.json({
        success: true,
        message: 'Logout berhasil'
    });
});

module.exports = router;
