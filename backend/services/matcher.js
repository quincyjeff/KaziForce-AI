const MATCHER_URL = process.env.MATCHER_URL || 'http://localhost:8000';

function jobText(job) {
  return `${job.job_title}. Skills: ${job.skills || ''}. ${job.job_description}`;
}

function resumeText(resume) {
  return `${resume.job_role || ''}. Skills: ${resume.skills || ''}. ${resume.resume_text}`;
}

async function getEmbedding(text) {
  try {
    const response = await fetch(`${MATCHER_URL}/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    if (!response.ok) {
      console.warn(`[matcher] /embed returned status ${response.status}`);
      return null;
    }
    const data = await response.json();
    return data.embedding || null;
  } catch (err) {
    console.warn('[matcher] Failed to generate embedding from AI service:', err.message);
    return null;
  }
}

async function rank(queryText, documents, topN) {
  // Normalize documents to ensure embedding is properly parsed array if provided
  const normalizedDocs = documents.map((doc) => {
    let embedding = doc.embedding;
    if (typeof embedding === 'string') {
      try { embedding = JSON.parse(embedding); } catch { embedding = null; }
    }
    return {
      id: doc.id,
      text: doc.text,
      embedding: Array.isArray(embedding) && embedding.length > 0 ? embedding : null
    };
  });

  const response = await fetch(`${MATCHER_URL}/match`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query_text: queryText, documents: normalizedDocs, top_n: topN })
  });
  if (!response.ok) {
    throw new Error('Matching service error');
  }
  const data = await response.json();
  return data.matches;
}

module.exports = { jobText, resumeText, getEmbedding, rank };
