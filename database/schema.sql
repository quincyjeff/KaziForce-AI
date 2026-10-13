-- KaziForce-AI database schema


CREATE DATABASE IF NOT EXISTS kaziforce
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE kaziforce;

-- 1. Users: both candidates and employers live here, told apart by "role"
CREATE TABLE IF NOT EXISTS users (
    user_id       INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role          ENUM('candidate', 'employer') NOT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Resumes: each belongs to a candidate
CREATE TABLE IF NOT EXISTS resumes (
    resume_id        INT AUTO_INCREMENT PRIMARY KEY,
    user_id          INT NOT NULL,
    job_role         VARCHAR(150),
    skills           TEXT,
    experience_years INT,
    education        VARCHAR(150),
    resume_text      MEDIUMTEXT NOT NULL,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 3. Jobs: each is posted by an employer
CREATE TABLE IF NOT EXISTS jobs (
    job_id           INT AUTO_INCREMENT PRIMARY KEY,
    employer_id      INT NOT NULL,
    job_title        VARCHAR(200) NOT NULL,
    company_name     VARCHAR(200),
    location         VARCHAR(200),
    experience_level VARCHAR(50),
    work_type        VARCHAR(50),
    skills           TEXT,
    job_description  MEDIUMTEXT NOT NULL,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employer_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 4. Notifications: one table for BOTH kinds
--    Candidate notification: user_id = candidate, "this job matches your resume"
--    Employer notification:  user_id = employer,  "this resume matches your job"
CREATE TABLE IF NOT EXISTS notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    job_id          INT NOT NULL,
    resume_id       INT NOT NULL,
    match_score     DECIMAL(5,2) NOT NULL,
    message         VARCHAR(500) NOT NULL,
    is_read         BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)   REFERENCES users(user_id)     ON DELETE CASCADE,
    FOREIGN KEY (job_id)    REFERENCES jobs(job_id)       ON DELETE CASCADE,
    FOREIGN KEY (resume_id) REFERENCES resumes(resume_id) ON DELETE CASCADE
);