const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/user/:userId', async (req, res) => {
  try {
    const unreadOnly = req.query.unread === 'true';
    const [rows] = await db.query(
      `SELECT n.notification_id, n.job_id, n.resume_id, n.match_score, n.message,
              n.is_read, n.created_at, j.job_title
       FROM notifications n
       JOIN jobs j ON j.job_id = n.job_id
       WHERE n.user_id = ? ${unreadOnly ? 'AND n.is_read = FALSE' : ''}
       ORDER BY n.created_at DESC, n.notification_id DESC
       LIMIT 50`,
      [req.params.userId]
    );
    const [[{ unread_count }]] = await db.query(
      'SELECT COUNT(*) AS unread_count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [req.params.userId]
    );
    res.json({
      unread_count,
      notifications: rows.map((row) => ({ ...row, is_read: Boolean(row.is_read) }))
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/user/:userId/read-all', async (req, res) => {
  try {
    const [result] = await db.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
      [req.params.userId]
    );
    res.json({ marked_read: result.affectedRows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/:id/read', async (req, res) => {
  try {
    const [result] = await db.query(
      'UPDATE notifications SET is_read = TRUE WHERE notification_id = ?',
      [req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json({ notification_id: Number(req.params.id), is_read: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;