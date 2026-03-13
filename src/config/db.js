const { Pool } = require('pg');

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  // For production (App Runner), DATABASE_URL must be set via env vars.
  // We fail fast here so misconfiguration is obvious.
  throw new Error('DATABASE_URL environment variable is required');
}

// Use a single shared connection pool
const pool = new Pool({
  connectionString: databaseUrl,
  // Let pg honor SSL settings embedded in DATABASE_URL or
  // additional environment variables in AWS/RDS if needed.
});

async function ensureSchema() {
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS urls (
      id SERIAL PRIMARY KEY,
      short_code VARCHAR(255) UNIQUE NOT NULL,
      original_url TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      clicks INTEGER DEFAULT 0 NOT NULL
    );
  `;

  await pool.query(createTableSql);
}

module.exports = {
  pool,
  ensureSchema,
};

