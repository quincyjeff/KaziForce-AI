const db = require('../db');
const { jobText, resumeText, rank } = require('./matcher');

const THRESHOLD = parseFloat(process.env.MATCH_THRESHOLD) || 60;

async function notifyCandidates(job) {
  const [resumes] = await db.query('SELECT * FROM resumes');
  if (resumes.length === 0) {
    return 0;
  }

  const matches = await rank(
    jobText(job),
    resumes.map((resume) => ({ id: resume.resume_id, text: resumeText(resume) })),
    resumes.length
  );

  const resumesById = new Map(resumes.map((resume) => [resume.resume_id, resume]));
  const bestPerCandidate = new Map();

  for (const match of matches) {
    const percent = Math.round(match.score * 1000) / 10;
    if (percent < THRESHOLD) {
      continue;
    }
    const resume = resumesById.get(match.id);
    if (!bestPerCandidate.has(resume.user_id)) {
      bestPerCandidate.set(resume.user_id, { resume, percent });
    }
  }

  const rows = [];
  for (const { resume, percent } of bestPerCandidate.values()) {
    const company = job.company_name ? ` at ${job.company_name}` : '';
    rows.push([
      resume.user_id,
      job.job_id,
      resume.resume_id,
      percent,
      `New job: ${job.job_title}${company} (${percent}% match)`
    ]);
  }

  if (rows.length > 0) {
    await db.query(
      'INSERT INTO notifications (user_id, job_id, resume_id, match_score, message) VALUES ?',
      [rows]
    );
  }

  return rows.length;
}

module.exports = { notifyCandidates };