const express = require('express');
const db = require('../db');

const router = express.Router();
const MATCHER_URL = process.env.MATCHER_URL || 'http://localhost:8000';

function jobText(job) {
  return `${job.job_title}. Skills: ${job.skills || ''}. ${job.job_description}`;
}

function resumeText(resume) {
  return `${resume.job_role || ''}. Skills: ${resume.skills || ''}. ${resume.resume_text}`;
}

function parseTop(value) {
  const n = parseInt(value, 10);
  return Number.isInteger(n) && n > 0 && n <= 50 ? n : 10;
}

function toPercent(score) {
  return Math.round(score * 1000) / 10;
}

async function rank(queryText, documents, topN) {
  const response = await fetch(`${MATCHER_URL}/match`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query_text: queryText, documents, top_n: topN })
  });
  if (!response.ok) {
    throw new Error('Matching service error');
  }
  const data = await response.json();
  return data.matches;
}

router.get('/resume/:resumeId', async (req, res) => {
  try {
    const [resumes] = await db.query(
      'SELECT * FROM resumes WHERE resume_id = ?',
      [req.params.resumeId]
    );
    if (resumes.length === 0) {
      return res.status(404).json({ error: 'Resume not found' });
    }
    const [jobs] = await db.query('SELECT * FROM jobs');
    const matches = await rank(
      resumeText(resumes[0]),
      jobs.map((job) => ({ id: job.job_id, text: jobText(job) })),
      parseTop(req.query.top)
    );
    const jobsById = new Map(jobs.map((job) => [job.job_id, job]));
    res.json(
      matches.map((match) => {
        const job = jobsById.get(match.id);
        return {
          job_id: job.job_id,
          job_title: job.job_title,
          company_name: job.company_name,
          location: job.location,
          match_score: toPercent(match.score)
        };
      })
    );
  } catch (err) {
    res.status(500).json({ error: 'Matching failed' });
  }
});

router.get('/job/:jobId', async (req, res) => {
  try {
    const [jobs] = await db.query(
      'SELECT * FROM jobs WHERE job_id = ?',
      [req.params.jobId]
    );
    if (jobs.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }
    const [resumes] = await db.query('SELECT * FROM resumes');
    const matches = await rank(
      jobText(jobs[0]),
      resumes.map((resume) => ({ id: resume.resume_id, text: resumeText(resume) })),
      parseTop(req.query.top)
    );
    const resumesById = new Map(resumes.map((resume) => [resume.resume_id, resume]));
    res.json(
      matches.map((match) => {
        const resume = resumesById.get(match.id);
        return {
          resume_id: resume.resume_id,
          user_id: resume.user_id,
          job_role: resume.job_role,
          match_score: toPercent(match.score)
        };
      })
    );
  } catch (err) {
    res.status(500).json({ error: 'Matching failed' });
  }
});

module.exports = router;