const express = require('express');
const db = require('../db');
const { notifyMatches } = require('../services/notifier');

const router = express.Router();

router.post('/', async (req, res) => {
  const {
    employer_id, job_title, job_description, company_name,
    location, experience_level, work_type, skills
  } = req.body;
  if (!employer_id || !job_title || !job_description) {
    return res.status(400).json({ error: 'employer_id, job_title and job_description are required' });
  }
  try {
    const [users] = await db.query(
      'SELECT role FROM users WHERE user_id = ?',
      [employer_id]
    );
    if (users.length === 0 || users[0].role !== 'employer') {
      return res.status(403).json({ error: 'Only employers can post jobs' });
    }
    const [result] = await db.query(
      `INSERT INTO jobs
        (employer_id, job_title, company_name, location, experience_level, work_type, skills, job_description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        employer_id, job_title, company_name || null, location || null,
        experience_level || null, work_type || null, skills || null, job_description
      ]
    );
            const job = { job_id: result.insertId, employer_id, job_title, company_name, skills, job_description };
    let notified = { candidates: 0, employer: 0 };
    try {
      notified = await notifyMatches(job);
    } catch (notifyError) {
      console.error('Notification step failed:', notifyError.message);
    }
    res.status(201).json({
      job_id: result.insertId,
      job_title,
      candidates_notified: notified.candidates,
      employer_notified: notified.employer
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT job_id, employer_id, job_title, company_name, location, experience_level, work_type, skills, created_at
       FROM jobs ORDER BY created_at DESC LIMIT 50`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM jobs WHERE job_id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;