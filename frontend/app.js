// KaziForce-AI front end. 
const API = 'http://localhost:3000/api';
const STRONG_MATCH = 60; // same default as MATCH_THRESHOLD in the backend

const app = document.getElementById('app');
const dialog = document.getElementById('job-dialog');
const toastEl = document.getElementById('toast');

const state = {
  user: loadUser(),
  view: null,
  authMode: 'login',
  unread: 0
};

/* ---------- helpers ---------- */

function loadUser() {
  try { return JSON.parse(localStorage.getItem('kf_user')); } catch { return null; }
}

function saveUser(user) {
  state.user = user;
  if (user) localStorage.setItem('kf_user', JSON.stringify(user));
  else localStorage.removeItem('kf_user');
}

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

async function api(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
      body: options.body ? JSON.stringify(options.body) : undefined
    });
  } catch {
    throw new Error('Cannot reach the API. Check that the backend is running on port 3000.');
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Something went wrong. Try again.');
  return data;
}

let toastTimer;
function toast(message) {
  toastEl.textContent = message;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 3500);
}

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function tags(csv) {
  const items = String(csv || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!items.length) return '';
  return `<div class="tags">${items.map((s) => `<span class="tag">${esc(s)}</span>`).join('')}</div>`;
}

function scoreBlock(percent) {
  const weak = percent < STRONG_MATCH ? ' weak' : '';
  return `<div class="score${weak}" aria-label="${percent} percent match">
    <strong>${percent}%</strong>
    <span class="bar"><i style="width:${Math.min(percent, 100)}%"></i></span>
  </div>`;
}

const loadingHtml = (text) => `<div class="loading"><div class="spinner"></div><span>${esc(text)}</span></div>`;
const errorHtml = (text) => `<div class="notice error" role="alert">${esc(text)}</div>`;

/* ---------- auth screen ---------- */

function renderAuth(error = '') {
  const register = state.authMode === 'register';
  app.innerHTML = `
    <div class="auth">
      <section class="auth-intro">
        <div class="brand">Kazi<b>Force</b>-AI</div>
        <div>
          <h1>The right job finds you.</h1>
          <p style="margin-top:1rem">Upload a resume once. When an employer posts a role that fits, you hear about it. Employers see the strongest candidates the moment they post.</p>
        </div>
        <p>Matching reads meaning, not keywords.</p>
      </section>
      <section class="auth-panel">
        <div class="auth-card">
          <div class="tabs" role="tablist">
            <button role="tab" id="tab-login" aria-selected="${!register}">Sign in</button>
            <button role="tab" id="tab-register" aria-selected="${register}">Create account</button>
          </div>
          <form id="auth-form">
            ${register ? `
              <label>Full name <input name="name" required autocomplete="name"></label>` : ''}
            <label>Email <input name="email" type="email" required autocomplete="email"></label>
            <label>Password <input name="password" type="password" required minlength="6" autocomplete="${register ? 'new-password' : 'current-password'}"></label>
            ${register ? `
              <div class="role-choice" role="radiogroup" aria-label="Account type">
                <label><input type="radio" name="role" value="candidate" checked> I'm looking for work <span>Upload resumes, get job alerts</span></label>
                <label><input type="radio" name="role" value="employer"> I'm hiring <span>Post jobs, see top candidates</span></label>
              </div>` : ''}
            ${error ? errorHtml(error) : ''}
            <button class="btn" type="submit">${register ? 'Create account' : 'Sign in'}</button>
          </form>
        </div>
      </section>
    </div>`;

  document.getElementById('tab-login').onclick = () => { state.authMode = 'login'; renderAuth(); };
  document.getElementById('tab-register').onclick = () => { state.authMode = 'register'; renderAuth(); };

  document.getElementById('auth-form').onsubmit = async (event) => {
    event.preventDefault();
    const form = Object.fromEntries(new FormData(event.target));
    const button = event.target.querySelector('button[type="submit"]');
    button.disabled = true;
    try {
      const user = await api(register ? '/users/register' : '/users/login', { method: 'POST', body: form });
      saveUser(user);
      state.view = null;
      renderApp();
    } catch (err) {
      renderAuth(err.message);
    }
  };
}

/* ---------- app shell ---------- */

const NAV = {
  candidate: [
    ['matches', 'Jobs for me'],
    ['resumes', 'My resumes'],
    ['alerts', 'Alerts']
  ],
  employer: [
    ['post', 'Post a job'],
    ['jobs', 'My jobs'],
    ['alerts', 'Alerts']
  ]
};

function renderApp() {
  const { user } = state;
  if (!user) return renderAuth();
  const nav = NAV[user.role];
  if (!state.view || !nav.some(([key]) => key === state.view)) state.view = nav[0][0];

  app.innerHTML = `
    <header class="topbar">
      <div class="brand">Kazi<b>Force</b>-AI</div>
      <nav aria-label="Main">
        ${nav.map(([key, label]) => `
          <button data-view="${key}" ${state.view === key ? 'aria-current="page"' : ''}>
            ${label}${key === 'alerts' && state.unread ? `<span class="badge">${state.unread}</span>` : ''}
          </button>`).join('')}
      </nav>
      <div class="who">
        <span>${esc(user.name)}</span>
        <button class="btn ghost small" id="signout">Sign out</button>
      </div>
    </header>
    <main id="view"></main>`;

  app.querySelectorAll('nav button').forEach((b) => {
    b.onclick = () => { state.view = b.dataset.view; renderApp(); };
  });
  document.getElementById('signout').onclick = () => {
    saveUser(null);
    state.unread = 0;
    renderAuth();
  };

  const view = document.getElementById('view');
  const views = { matches: viewMatches, resumes: viewResumes, post: viewPost, jobs: viewJobs, alerts: viewAlerts };
  views[state.view](view);
  refreshUnread();
}

async function refreshUnread() {
  if (!state.user) return;
  try {
    const data = await api(`/notifications/user/${state.user.user_id}?unread=true`);
    state.unread = data.unread_count;
    const alertsBtn = app.querySelector('nav button[data-view="alerts"]');
    if (alertsBtn) {
      alertsBtn.innerHTML = `Alerts${state.unread ? `<span class="badge">${state.unread}</span>` : ''}`;
    }
  } catch { /* badge is optional; ignore */ }
}
setInterval(refreshUnread, 30000);

/* ---------- job detail dialog ---------- */

async function openJob(jobId) {
  dialog.innerHTML = `<div class="dialog-body">${loadingHtml('Loading job')}</div>`;
  dialog.showModal();
  try {
    const job = await api(`/jobs/${jobId}`);
    dialog.innerHTML = `
      <div class="dialog-body">
        <div>
          <h2 id="job-dialog-title">${esc(job.job_title)}</h2>
          <p class="meta">${[job.company_name, job.location, job.work_type, job.experience_level].filter(Boolean).map(esc).join(' | ')}</p>
        </div>
        ${tags(job.skills)}
        <p class="desc">${esc(job.job_description)}</p>
        <div class="actions"><button class="btn" id="close-dialog">Close</button></div>
      </div>`;
    document.getElementById('close-dialog').onclick = () => dialog.close();
  } catch (err) {
    dialog.innerHTML = `<div class="dialog-body">${errorHtml(err.message)}<div class="actions"><button class="btn" id="close-dialog">Close</button></div></div>`;
    document.getElementById('close-dialog').onclick = () => dialog.close();
  }
}
dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });

/* ---------- candidate: jobs for me ---------- */

async function viewMatches(root) {
  root.innerHTML = `
    <div class="page-head">
      <h2>Jobs for me</h2>
      <p>Pick a resume to see the posted jobs that fit it best.</p>
    </div>
    <div id="matches-body">${loadingHtml('Loading your resumes')}</div>`;
  const body = document.getElementById('matches-body');

  let resumes;
  try {
    resumes = await api(`/resumes/user/${state.user.user_id}`);
  } catch (err) {
    body.innerHTML = errorHtml(err.message);
    return;
  }
  if (!resumes.length) {
    body.innerHTML = `<div class="panel empty">
      <p>You haven't added a resume yet. Add one to see matching jobs.</p>
      <button class="btn" id="go-resume">Add a resume</button></div>`;
    document.getElementById('go-resume').onclick = () => { state.view = 'resumes'; renderApp(); };
    return;
  }

  body.innerHTML = `
    <label style="max-width:26rem">Resume
      <select id="resume-select">
        ${resumes.map((r) => `<option value="${r.resume_id}">${esc(r.job_role || 'Untitled resume')} (added ${formatDate(r.created_at)})</option>`).join('')}
      </select>
    </label>
    <div id="match-results"></div>`;

  const load = async () => {
    const results = document.getElementById('match-results');
    results.innerHTML = loadingHtml('Matching your resume to jobs');
    try {
      const id = document.getElementById('resume-select').value;
      const matches = await api(`/match/resume/${id}?top=10`);
      if (!matches.length) {
        results.innerHTML = `<div class="panel empty"><p>No jobs have been posted yet. Check back soon.</p></div>`;
        return;
      }
      results.innerHTML = `<div class="list">${matches.map((m) => `
        <article class="item">
          <div class="item-top">
            <div>
              <h3>${esc(m.job_title)}</h3>
              <p class="meta">${[m.company_name, m.location].filter(Boolean).map(esc).join(' | ')}</p>
            </div>
            ${scoreBlock(m.match_score)}
          </div>
          <div class="actions"><button class="btn ghost small" data-job="${m.job_id}">View job</button></div>
        </article>`).join('')}</div>`;
      results.querySelectorAll('[data-job]').forEach((b) => { b.onclick = () => openJob(b.dataset.job); });
    } catch (err) {
      results.innerHTML = errorHtml(
        /Matching failed/.test(err.message)
          ? 'Matching failed. Check that the matching service is running on port 8000.'
          : err.message
      );
    }
  };
  document.getElementById('resume-select').onchange = load;
  load();
}

/* ---------- candidate: resumes ---------- */

async function viewResumes(root) {
  root.innerHTML = `
    <div class="page-head">
      <h2>My resumes</h2>
      <p>You can keep several, for example one per kind of role. Alerts use whichever fits a new job best.</p>
    </div>
    <section class="panel">
      <form id="resume-form">
        <div class="row">
          <label>Target role <input name="job_role" placeholder="Java Backend Developer"></label>
          <label>Years of experience <input name="experience_years" type="number" min="0" max="60"></label>
          <label>Education <input name="education" placeholder="BSc Computer Science"></label>
        </div>
        <label>Skills <small>Separate with commas</small>
          <input name="skills" placeholder="Java, Spring Boot, SQL, REST API"></label>
        <label>Resume text <small>Paste your experience and achievements</small>
          <textarea name="resume_text" required></textarea></label>
        <div id="resume-msg"></div>
        <div><button class="btn" type="submit">Save resume</button></div>
      </form>
    </section>
    <div id="resume-list">${loadingHtml('Loading resumes')}</div>`;

  const list = document.getElementById('resume-list');
  const loadList = async () => {
    try {
      const resumes = await api(`/resumes/user/${state.user.user_id}`);
      list.innerHTML = resumes.length ? `<div class="list">${resumes.map((r) => `
        <article class="item">
          <div class="item-top">
            <h3>${esc(r.job_role || 'Untitled resume')}</h3>
            <span class="meta">Added ${formatDate(r.created_at)}</span>
          </div>
          <p class="meta">${[r.experience_years != null ? `${r.experience_years} years experience` : '', r.education].filter(Boolean).map(esc).join(' | ')}</p>
          ${tags(r.skills)}
        </article>`).join('')}</div>`
        : `<div class="panel empty"><p>No resumes yet. Save your first one above.</p></div>`;
    } catch (err) {
      list.innerHTML = errorHtml(err.message);
    }
  };
  loadList();

  document.getElementById('resume-form').onsubmit = async (event) => {
    event.preventDefault();
    const form = event.target;
    const data = Object.fromEntries(new FormData(form));
    data.user_id = state.user.user_id;
    if (data.experience_years === '') delete data.experience_years;
    const msg = document.getElementById('resume-msg');
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    try {
      await api('/resumes', { method: 'POST', body: data });
      form.reset();
      msg.innerHTML = '';
      toast('Resume saved');
      loadList();
    } catch (err) {
      msg.innerHTML = errorHtml(err.message);
    } finally {
      button.disabled = false;
    }
  };
}

/* ---------- employer: post a job ---------- */

function viewPost(root) {
  root.innerHTML = `
    <div class="page-head">
      <h2>Post a job</h2>
      <p>When you post, every resume is scored against the role. Candidates who fit are alerted, and you get a summary.</p>
    </div>
    <section class="panel">
      <form id="job-form">
        <div class="row">
          <label>Job title <input name="job_title" required placeholder="Senior Java Developer"></label>
          <label>Company <input name="company_name"></label>
          <label>Location <input name="location" placeholder="Nairobi, Kenya"></label>
        </div>
        <div class="row">
          <label>Work type
            <select name="work_type">
              <option value="">Not specified</option>
              <option>Full-time</option><option>Part-time</option><option>Contract</option>
              <option>Internship</option><option>Temporary</option>
            </select>
          </label>
          <label>Experience level
            <select name="experience_level">
              <option value="">Not specified</option>
              <option>Entry level</option><option>Associate</option><option>Mid-Senior level</option>
              <option>Director</option><option>Executive</option>
            </select>
          </label>
        </div>
        <label>Skills <small>Separate with commas</small>
          <input name="skills" placeholder="Java, Spring Boot, SQL"></label>
        <label>Job description
          <textarea name="job_description" required></textarea></label>
        <div id="job-msg"></div>
        <div><button class="btn" type="submit">Post job</button></div>
      </form>
    </section>`;

  document.getElementById('job-form').onsubmit = async (event) => {
    event.preventDefault();
    const form = event.target;
    const data = Object.fromEntries(new FormData(form));
    data.employer_id = state.user.user_id;
    const msg = document.getElementById('job-msg');
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    msg.innerHTML = loadingHtml('Posting and matching candidates');
    try {
      const result = await api('/jobs', { method: 'POST', body: data });
      form.reset();
      const n = result.candidates_notified;
      msg.innerHTML = `<div class="notice">Posted "${esc(result.job_title)}". ${
        n ? `${n} ${n === 1 ? 'candidate was' : 'candidates were'} alerted.` : 'No candidates matched strongly enough yet.'
      }</div>`;
      toast('Job posted');
      refreshUnread();
    } catch (err) {
      msg.innerHTML = errorHtml(err.message);
    } finally {
      button.disabled = false;
    }
  };
}

/* ---------- employer: my jobs and top candidates ---------- */

async function viewJobs(root) {
  root.innerHTML = `
    <div class="page-head">
      <h2>My jobs</h2>
      <p>Open a job to see the candidates whose resumes fit it best.</p>
    </div>
    <div id="jobs-body">${loadingHtml('Loading jobs')}</div>`;
  const body = document.getElementById('jobs-body');

  let jobs;
  try {
    // The API returns the 50 most recent jobs; keep the ones this employer posted.
    jobs = (await api('/jobs')).filter((j) => j.employer_id === state.user.user_id);
  } catch (err) {
    body.innerHTML = errorHtml(err.message);
    return;
  }
  if (!jobs.length) {
    body.innerHTML = `<div class="panel empty"><p>You haven't posted a job yet.</p>
      <button class="btn" id="go-post">Post a job</button></div>`;
    document.getElementById('go-post').onclick = () => { state.view = 'post'; renderApp(); };
    return;
  }

  body.innerHTML = `<div class="list">${jobs.map((j) => `
    <article class="item" id="job-${j.job_id}">
      <div class="item-top">
        <div>
          <h3>${esc(j.job_title)}</h3>
          <p class="meta">${[j.company_name, j.location, j.work_type].filter(Boolean).map(esc).join(' | ')} | Posted ${formatDate(j.created_at)}</p>
        </div>
        <div class="actions">
          <button class="btn ghost small" data-detail="${j.job_id}">View job</button>
          <button class="btn small" data-cands="${j.job_id}">Top candidates</button>
        </div>
      </div>
      ${tags(j.skills)}
      <div class="cands"></div>
    </article>`).join('')}</div>`;

  body.querySelectorAll('[data-detail]').forEach((b) => { b.onclick = () => openJob(b.dataset.detail); });
  body.querySelectorAll('[data-cands]').forEach((b) => {
    b.onclick = () => loadCandidates(b.dataset.cands, document.querySelector(`#job-${b.dataset.cands} .cands`));
  });
}

async function loadCandidates(jobId, target) {
  target.innerHTML = loadingHtml('Finding the best candidates');
  try {
    const matches = await api(`/match/job/${jobId}?top=5`);
    if (!matches.length) {
      target.innerHTML = `<p class="meta">No resumes to match against yet.</p>`;
      return;
    }
    // Enrich each match with the candidate's name, email and skills.
    const people = await Promise.all(matches.map(async (m) => {
      const [user, resume] = await Promise.all([
        api(`/users/${m.user_id}`).catch(() => null),
        api(`/resumes/${m.resume_id}`).catch(() => null)
      ]);
      return { m, user, resume };
    }));
    target.innerHTML = `<div class="list">${people.map(({ m, user, resume }) => `
      <div class="item" style="background:var(--paper)">
        <div class="item-top">
          <div>
            <h3>${esc(user ? user.name : `Candidate ${m.user_id}`)}</h3>
            <p class="meta">${esc(m.job_role || 'Untitled resume')}${user ? ` | <a href="mailto:${esc(user.email)}">${esc(user.email)}</a>` : ''}</p>
          </div>
          ${scoreBlock(m.match_score)}
        </div>
        ${resume ? tags(resume.skills) : ''}
      </div>`).join('')}</div>`;
  } catch (err) {
    target.innerHTML = errorHtml(
      /Matching failed/.test(err.message)
        ? 'Matching failed. Check that the matching service is running on port 8000.'
        : err.message
    );
  }
}

/* ---------- alerts (both roles) ---------- */

async function viewAlerts(root) {
  root.innerHTML = `
    <div class="page-head">
      <h2>Alerts</h2>
      <p>${state.user.role === 'candidate' ? 'New jobs that match your resumes.' : 'Strong candidates for the jobs you posted.'}</p>
    </div>
    <div id="alerts-body">${loadingHtml('Loading alerts')}</div>`;
  const body = document.getElementById('alerts-body');

  const load = async () => {
    try {
      const data = await api(`/notifications/user/${state.user.user_id}`);
      state.unread = data.unread_count;
      if (!data.notifications.length) {
        body.innerHTML = `<div class="panel empty"><p>No alerts yet. ${
          state.user.role === 'candidate' ? 'You will see one here when a matching job is posted.' : 'Post a job to see matching candidates here.'
        }</p></div>`;
        return;
      }
      body.innerHTML = `
        ${data.unread_count ? `<div><button class="btn ghost small" id="read-all">Mark all as read</button></div>` : ''}
        <div class="list">${data.notifications.map((n) => `
          <article class="item note${n.is_read ? '' : ' unread'}" tabindex="0" role="button" data-id="${n.notification_id}" data-job="${n.job_id}">
            <div class="item-top">
              <p>${esc(n.message)}</p>
              <span class="meta">${formatDate(n.created_at)}</span>
            </div>
          </article>`).join('')}</div>`;

      const readAll = document.getElementById('read-all');
      if (readAll) readAll.onclick = async () => {
        try {
          await api(`/notifications/user/${state.user.user_id}/read-all`, { method: 'PATCH' });
          toast('All alerts marked as read');
          renderApp();
        } catch (err) { toast(err.message); }
      };

      body.querySelectorAll('.note').forEach((card) => {
        const open = async () => {
          if (card.classList.contains('unread')) {
            try {
              await api(`/notifications/${card.dataset.id}/read`, { method: 'PATCH' });
              card.classList.remove('unread');
              state.unread = Math.max(0, state.unread - 1);
              refreshUnread();
            } catch { /* keep going; opening the job still works */ }
          }
          openJob(card.dataset.job);
        };
        card.onclick = open;
        card.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } };
      });
    } catch (err) {
      body.innerHTML = errorHtml(err.message);
    }
  };
  load();
}

/* ---------- start ---------- */

renderApp();