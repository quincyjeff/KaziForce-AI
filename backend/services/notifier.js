const db = require('../db');
const { jobText, resumeText, rank } = require('./matcher');
const { sendEmail } = require('./mailer');

const THRESHOLD = parseFloat(process.env.MATCH_THRESHOLD) || 60;

function toPercent(score) {
  return Math.round(score * 1000) / 10;
}

async function notifyMatches(job) {
  const [resumes] = await db.query('SELECT * FROM resumes');
  if (resumes.length === 0) {
    return { candidates: 0, employer: 0 };
  }

  const matches = await rank(
    jobText(job),
    resumes.map((resume) => ({ id: resume.resume_id, text: resumeText(resume) })),
    resumes.length
  );

  const resumesById = new Map(resumes.map((resume) => [resume.resume_id, resume]));
  const bestPerCandidate = new Map();

  for (const match of matches) {
    const percent = toPercent(match.score);
    if (percent < THRESHOLD) {
      continue;
    }
    const resume = resumesById.get(match.id);
    if (!bestPerCandidate.has(resume.user_id)) {
      bestPerCandidate.set(resume.user_id, { resume, percent });
    }
  }

  const strongMatches = [...bestPerCandidate.values()];
  if (strongMatches.length === 0) {
    return { candidates: 0, employer: 0 };
  }

  const company = job.company_name ? ` at ${job.company_name}` : '';
  const candidateRows = strongMatches.map(({ resume, percent }) => [
    resume.user_id,
    job.job_id,
    resume.resume_id,
    percent,
    `New job: ${job.job_title}${company} (${percent}% match)`
  ]);

  await db.query(
    'INSERT INTO notifications (user_id, job_id, resume_id, match_score, message) VALUES ?',
    [candidateRows]
  );

  const top = strongMatches[0];
  const noun = strongMatches.length === 1 ? 'candidate' : 'candidates';
  const employerMessage = `${strongMatches.length} strong ${noun} for your ${job.job_title} role (top match: ${top.percent}%)`;

  await db.query(
    'INSERT INTO notifications (user_id, job_id, resume_id, match_score, message) VALUES (?, ?, ?, ?, ?)',
    [job.employer_id, job.job_id, top.resume.resume_id, top.percent, employerMessage]
  );

  const userIds = [job.employer_id, ...strongMatches.map(({ resume }) => resume.user_id)];
  const [users] = await db.query(
    'SELECT user_id, email FROM users WHERE user_id IN (?)',
    [userIds]
  );
  const emailsById = new Map(users.map((user) => [user.user_id, user.email]));

  const emails = strongMatches.map(({ resume, percent }) =>
    sendEmail(
      emailsById.get(resume.user_id),
      `New job match: ${job.job_title}`,
      `A new job matches your resume.\n\n${job.job_title}${company}\nMatch: ${percent}%\n\nLog in to KaziForce-AI to see the details.`
    )
  );
  emails.push(
    sendEmail(
      emailsById.get(job.employer_id),
      `Top candidates for ${job.job_title}`,
      `${employerMessage}\n\nLog in to KaziForce-AI to review them.`
    )
  );
  Promise.all(emails);

  return { candidates: strongMatches.length, employer: 1 };
}

module.exports = { notifyMatches };