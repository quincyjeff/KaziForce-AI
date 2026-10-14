require('dotenv').config();
const express = require('express');
const cors = require('cors');

const usersRoutes = require('./routes/users');
const jobsRoutes = require('./routes/jobs');
const resumesRoutes = require('./routes/resumes');
const matchRoutes = require('./routes/match');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/users', usersRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/resumes', resumesRoutes);
app.use('/api/match', matchRoutes);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`KaziForce API running on port ${port}`));