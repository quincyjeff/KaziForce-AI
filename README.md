# KaziForce-AI

An AI-powered intelligent notification system for workforce recruitment. KaziForce-AI matches candidates to jobs by meaning rather than keywords, using Sentence Transformers and natural language processing, and notifies the right people when a strong match appears.

## What it does

- **Candidates** upload a resume and are notified when a newly posted job matches it above a set threshold.
- **Employers** post jobs and are notified with a summary of the strongest matching candidates.
- Matching is **semantic**: a "Java Backend Developer" resume matches a "Senior Java Developer" posting even when the wording differs.

## How it works

1. A resume and a job posting are each turned into a text of the form `title/role. Skills: ... description`, so the most important details come first.
2. The text is converted into a 384-dimension vector using the `all-MiniLM-L6-v2` Sentence Transformers model.
3. Vectors are normalized, so cosine similarity is a simple dot product. A score of 0.83 means an 83% match.
4. When an employer posts a job, it is scored against every resume. Candidates scoring at or above the threshold (default 60%) each receive one notification, using their best-matching resume. The employer receives one summary notification.
5. Each notification is also sent by email when Gmail credentials are configured. If they aren't, notifications still appear in the app.

## Architecture

```
Client  ->  Node.js / Express API  ->  MySQL
                    |
                    v
          FastAPI matching service (Python, Sentence Transformers)
```

- **Express API** handles users, resumes, jobs, and notifications, and stores everything in MySQL.
- **FastAPI matching service** holds the AI model and ranks documents against a query text.
- **Offline scripts** in `ai/` prepare the LinkedIn job data and test matching at scale.

## Tech stack

- Python: Sentence Transformers, scikit-learn, pandas, FastAPI, Uvicorn
- Node.js: Express, mysql2, bcryptjs, dotenv, cors
- MySQL 8

## Project structure

```
KaziForce_AI/
├── ai/
│   ├── match_service.py           FastAPI matching service
│   ├── build_job_embeddings.py    Encodes LinkedIn jobs and saves the vectors
│   ├── match_top_jobs.py          Ranks LinkedIn jobs for a resume using saved vectors
│   ├── prepare_*.py               Dataset preparation scripts
│   └── explore_*.py               Dataset exploration scripts
├── backend/
│   ├── server.js                  API entry point
│   ├── db.js                      MySQL connection pool
│   ├── routes/                    users, jobs, resumes, match, notifications
│   └── services/                  matcher client and notification logic
├── database/
│   └── schema.sql                 MySQL schema
├── datasets/                      Resume dataset (LinkedIn data is not committed)
├── models/                        Saved embeddings (not committed)
└── requirements.txt               Python dependencies
```

## Setup

### Prerequisites

- Python 3.10 or newer
- Node.js 18 or newer
- MySQL 8

### 1. Clone and install Python dependencies

```
git clone https://github.com/quincyjeff/KaziForce-AI.git
cd KaziForce-AI
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Create the database

```
mysql -u root -p -e "source database/schema.sql"
```

This creates the `kaziforce` database with four tables: `users`, `resumes`, `jobs`, and `notifications`.

### 3. Configure and start the API

```
cd backend
npm install
```

Copy `.env.example` to `.env` and fill in your MySQL password, then:

```
npm start
```

The API runs on `http://localhost:3000`.

### 4. Start the matching service

In a second terminal, with the virtual environment active:

```
cd ai
uvicorn match_service:app --port 8000
```

The first start downloads the model, so allow a moment.

### 5. (Optional) Prepare the LinkedIn dataset

The LinkedIn job postings data is large and is not in the repository. To use the offline scripts, download the LinkedIn Job Postings dataset from Kaggle into `datasets/linkedin_dataset/`, update the file paths at the top of each script in `ai/`, then run:

```
python ai/prepare_resume_data.py
python ai/prepare_jobs_data.py
python ai/prepare_master_jobs.py
python ai/build_job_embeddings.py
python ai/match_top_jobs.py
```

`build_job_embeddings.py` has a `LIMIT` setting for encoding a smaller sample while testing.

## Configuration

Set in `backend/.env`:

| Variable | Purpose | Default |
|---|---|---|
| `DB_HOST` | MySQL host | `localhost` |
| `DB_USER` | MySQL user | `root` |
| `DB_PASSWORD` | MySQL password | none |
| `DB_NAME` | Database name | `kaziforce` |
| `PORT` | API port | `3000` |
| `MATCH_THRESHOLD` | Minimum match percentage to notify (optional) | `60` |
| `MATCHER_URL` | Matching service address (optional) | `http://localhost:8000` |
| `EMAIL_USER` | Gmail address that sends notification emails (optional) | none |
| `EMAIL_PASS` | Gmail app password for that address (optional) | none |

## API reference

**Users**
- `POST /api/users/register` with `name`, `email`, `password`, `role` (`candidate` or `employer`)
- `POST /api/users/login` with `email`, `password`
- `GET /api/users/:id`

**Resumes** (candidates only)
- `POST /api/resumes` with `user_id`, `resume_text`, and optional `job_role`, `skills`, `experience_years`, `education`
- `GET /api/resumes/user/:userId`
- `GET /api/resumes/:id`

**Jobs** (employers only)
- `POST /api/jobs` with `employer_id`, `job_title`, `job_description`, and optional `company_name`, `location`, `experience_level`, `work_type`, `skills`. Posting a job triggers the notifications.
- `GET /api/jobs`
- `GET /api/jobs/:id`

**Matching**
- `GET /api/match/resume/:resumeId?top=10` returns the top jobs for a resume
- `GET /api/match/job/:jobId?top=10` returns the top candidates for a job

**Notifications**
- `GET /api/notifications/user/:userId` returns a user's notifications and unread count (add `?unread=true` for unread only)
- `PATCH /api/notifications/:id/read`
- `PATCH /api/notifications/user/:userId/read-all`

## Example

```
POST /api/jobs
{
  "employer_id": 1,
  "job_title": "Senior Java Developer",
  "company_name": "Fintech Ltd",
  "job_description": "Design and build Java microservices and REST APIs using Spring Boot.",
  "skills": "Java, Spring Boot, SQL"
}
```

A candidate with a Java backend resume receives: `New job: Senior Java Developer at Fintech Ltd (83.3% match)`, and the employer receives: `1 strong candidate for your Senior Java Developer role (top match: 83.3%)`.

## Run the demo

With the API and the matching service running, run this from the project root to see the whole flow on an empty database:

    powershell -ExecutionPolicy Bypass -File .\demo.ps1

It registers an employer and three candidates, uploads their resumes, posts a job, and prints the notifications, match rankings, and the mark-as-read step.

## Roadmap

- A web front end for candidates and employers
- Authentication tokens for the API
- Pre-computed embeddings stored per resume and job to speed up matching at scale

## Status

Final-year project, in active development.