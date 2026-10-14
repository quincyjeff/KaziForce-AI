const MATCHER_URL = process.env.MATCHER_URL || 'http://localhost:8000';

function jobText(job) {
  return `${job.job_title}. Skills: ${job.skills || ''}. ${job.job_description}`;
}

function resumeText(resume) {
  return `${resume.job_role || ''}. Skills: ${resume.skills || ''}. ${resume.resume_text}`;
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

module.exports = { jobText, resumeText, rank };