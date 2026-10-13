const express = require('express');
const db = require('../db');

const router = express.Router();

router.post('/', async (req, res) => {
  const { user_id, resume_text, job_role, skills, experience_years, education } = req.body;
  if (!user_id || !resume_text) {
    return res.status(400).json({ error: 'user_id and resume_text are required' });
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

router.get('/user/:userId', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM resumes WHERE user_id = ? ORDER BY created_at DESC',
      [req.params.userId]
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