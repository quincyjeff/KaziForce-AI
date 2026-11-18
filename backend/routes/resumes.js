const express = require('express');
const db = require('../db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.post('/', verifyToken, async (req, res) => {
  const user_id = req.user.user_id;
  const { resume_text, job_role, skills, experience_years, education } = req.body;
  if (!resume_text) {
    return res.status(400).json({ error: 'resume_text is required' });
  }
  try {
    const [users] = await db.query('SELECT role FROM users WHERE user_id = ?', [user_id]);
    if (users.length === 0 || users[0].role !== 'candidate') {
      return res.status(403).json({ error: 'Only candidates can upload resumes' });
    }
    const [result] = await db.query(
      `INSERT INTO resumes (user_id, job_role, skills, experience_years, education, resume_text)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [user_id, job_role || null, skills || null, experience_years || null, education || null, resume_text]
    );
    res.status(201).json({ resume_id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/user/:userId', verifyToken, async (req, res) => {
  try {
    const targetUserId = Number(req.params.userId);
    if (req.user.user_id !== targetUserId && req.user.role !== 'employer') {
      return res.status(403).json({ error: 'Forbidden: you cannot view another user resumes' });
    }
    const [rows] = await db.query(
      'SELECT * FROM resumes WHERE user_id = ? ORDER BY created_at DESC',
      [targetUserId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM resumes WHERE resume_id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Resume not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
