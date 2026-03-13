require('dotenv').config();

const express = require('express');
const urlRoutes = require('./routes/urlRoutes');
const { ensureSchema } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(express.json());

// Basic health endpoint
app.get('/health-check', (req, res) => {
  res.json({ status: 'UP', message: 'Backend is reachable!' });
});

// Core URL shortener routes
app.use('/', urlRoutes);

// Central error handler
app.use(errorHandler);

const port = process.env.PORT || 3000;
const host = '0.0.0.0';

async function start() {
  try {
    await ensureSchema();
    app.listen(port, host, () => {
      // eslint-disable-next-line no-console
      console.log(`URL Shortener listening on http://${host}:${port}`);
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to start server', err);
    process.exit(1);
  }
}

start();

