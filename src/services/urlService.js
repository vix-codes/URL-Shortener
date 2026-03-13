const { nanoid } = require('nanoid');
const { pool } = require('../config/db');

async function createShortUrl(originalUrl) {
  // Try a few times in the unlikely event of a collision.
  for (let i = 0; i < 5; i += 1) {
    const shortCode = nanoid(8);
    try {
      const result = await pool.query(
        'INSERT INTO urls (short_code, original_url) VALUES ($1, $2) RETURNING id, short_code, original_url, created_at, clicks',
        [shortCode, originalUrl],
      );
      return result.rows[0];
    } catch (err) {
      // Unique violation on short_code -> retry with a new code
      if (err.code === '23505') {
        // continue loop
        // eslint-disable-next-line no-continue
        continue;
      }
      throw err;
    }
  }

  throw new Error('Failed to generate a unique short code after multiple attempts');
}

async function getUrlByCode(shortCode) {
  const result = await pool.query(
    'SELECT id, short_code, original_url, created_at, clicks FROM urls WHERE short_code = $1',
    [shortCode],
  );
  return result.rows[0] || null;
}

async function incrementClicks(id) {
  await pool.query('UPDATE urls SET clicks = clicks + 1 WHERE id = $1', [id]);
}

module.exports = {
  createShortUrl,
  getUrlByCode,
  incrementClicks,
};

