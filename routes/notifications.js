const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, async (req, res) => {
    try {
        const [notifications] = await db.query(
            'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
            [req.user.userId]
        );
        res.json({ success: true, data: notifications });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
    }
});

router.put('/:id/read', authenticateToken, async (req, res) => {
    try {
        await db.query('UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?', [req.params.id, req.user.userId]);
        res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
    }
});

router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        await db.query('DELETE FROM notifications WHERE id = ? AND user_id = ?', [req.params.id, req.user.userId]);
        res.json({ success: true, message: 'Notification deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
    }
});

module.exports = router;
