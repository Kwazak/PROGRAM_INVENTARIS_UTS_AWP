const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: 'Token tidak ditemukan' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, message: 'Token tidak valid' });
        }
        req.user = user;
        next();
    });
};

// Configure multer for avatar upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads/avatars');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed (jpeg, jpg, png, gif)'));
        }
    }
});

// GET /api/profile - Get current user profile
router.get('/', authenticateToken, (req, res) => {
    try {
        const user = db.prepare(`
            SELECT 
                u.id,
                u.username,
                u.email,
                u.full_name,
                u.phone,
                u.address,
                u.avatar,
                u.created_at,
                u.last_login,
                r.role_name,
                r.description as role_description
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.id = ?
        `).get(req.user.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User tidak ditemukan'
            });
        }

        // Remove sensitive data
        delete user.password;

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil data profil'
        });
    }
});

// PUT /api/profile - Update user profile
router.put('/', authenticateToken, (req, res) => {
    try {
        const { full_name, email, phone, address } = req.body;
        const userId = req.user.userId;

        // Validate email if changed
        if (email) {
            const existingEmail = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?')
                .get(email, userId);
            
            if (existingEmail) {
                return res.status(400).json({
                    success: false,
                    message: 'Email sudah digunakan oleh user lain'
                });
            }
        }

        // Update user profile
        const stmt = db.prepare(`
            UPDATE users 
            SET full_name = ?,
                email = ?,
                phone = ?,
                address = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `);

        stmt.run(full_name, email, phone, address, userId);

        res.json({
            success: true,
            message: 'Profil berhasil diupdate'
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengupdate profil'
        });
    }
});

// PUT /api/profile/password - Change password
router.put('/password', authenticateToken, (req, res) => {
    try {
        const { current_password, new_password, confirm_password } = req.body;
        const userId = req.user.userId;

        // Validation
        if (!current_password || !new_password || !confirm_password) {
            return res.status(400).json({
                success: false,
                message: 'Semua field password harus diisi'
            });
        }

        if (new_password !== confirm_password) {
            return res.status(400).json({
                success: false,
                message: 'Password baru dan konfirmasi tidak cocok'
            });
        }

        if (new_password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password baru minimal 6 karakter'
            });
        }

        // Get current user
        const user = db.prepare('SELECT password FROM users WHERE id = ?').get(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User tidak ditemukan'
            });
        }

        // Verify current password
        const validPassword = bcrypt.compareSync(current_password, user.password);
        if (!validPassword) {
            return res.status(400).json({
                success: false,
                message: 'Password lama tidak sesuai'
            });
        }

        // Hash new password
        const hashedPassword = bcrypt.hashSync(new_password, 10);

        // Update password
        db.prepare('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
            .run(hashedPassword, userId);

        res.json({
            success: true,
            message: 'Password berhasil diubah'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengubah password'
        });
    }
});

// POST /api/profile/avatar - Upload avatar
router.post('/avatar', authenticateToken, upload.single('avatar'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Tidak ada file yang diupload'
            });
        }

        const userId = req.user.userId;
        const avatarPath = `/uploads/avatars/${req.file.filename}`;

        // Get old avatar
        const oldUser = db.prepare('SELECT avatar FROM users WHERE id = ?').get(userId);

        // Update avatar in database
        db.prepare('UPDATE users SET avatar = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
            .run(avatarPath, userId);

        // Delete old avatar file if exists
        if (oldUser.avatar) {
            const oldAvatarPath = path.join(__dirname, '..', oldUser.avatar);
            if (fs.existsSync(oldAvatarPath)) {
                fs.unlinkSync(oldAvatarPath);
            }
        }

        res.json({
            success: true,
            message: 'Avatar berhasil diupload',
            data: {
                avatar: avatarPath
            }
        });
    } catch (error) {
        console.error('Upload avatar error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Gagal mengupload avatar'
        });
    }
});

// DELETE /api/profile/avatar - Delete avatar
router.delete('/avatar', authenticateToken, (req, res) => {
    try {
        const userId = req.user.userId;

        // Get current avatar
        const user = db.prepare('SELECT avatar FROM users WHERE id = ?').get(userId);

        if (!user.avatar) {
            return res.status(400).json({
                success: false,
                message: 'Tidak ada avatar untuk dihapus'
            });
        }

        // Delete file
        const avatarPath = path.join(__dirname, '..', user.avatar);
        if (fs.existsSync(avatarPath)) {
            fs.unlinkSync(avatarPath);
        }

        // Remove from database
        db.prepare('UPDATE users SET avatar = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
            .run(userId);

        res.json({
            success: true,
            message: 'Avatar berhasil dihapus'
        });
    } catch (error) {
        console.error('Delete avatar error:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal menghapus avatar'
        });
    }
});

// GET /api/profile/activity - Get user activity log (optional)
router.get('/activity', authenticateToken, (req, res) => {
    try {
        const userId = req.user.userId;
        const limit = parseInt(req.query.limit) || 50;

        // This is a placeholder - you can implement activity logging
        res.json({
            success: true,
            data: {
                activities: [],
                message: 'Activity logging not yet implemented'
            }
        });
    } catch (error) {
        console.error('Get activity error:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil data aktivitas'
        });
    }
});

module.exports = router;
