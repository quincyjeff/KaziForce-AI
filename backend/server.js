require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const usersRoutes = require('./routes/users');
const jobsRoutes = require('./routes/jobs');
const resumesRoutes = require('./routes/resumes');
const matchRoutes = require('./routes/match');
const notificationsRoutes = require('./routes/notifications');

const app = express();

app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// API routes
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/users', usersRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/resumes', resumesRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/notifications', notificationsRoutes);

// Fallback to index.html for non-API client routes
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    return res.sendFile(path.join(__dirname, '../frontend/index.html'));
  }
  next();
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`KaziForce API running on port ${port}`));
