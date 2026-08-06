const { nanoid } = require('nanoid');
const { getShardForCode } = require('../config/db');
const { getCachedUrl, setCachedUrl } = require('../config/redis');

async function createShortUrl(originalUrl) {
  // Try up to 5 times in case of short code collision
  for (let i = 0; i < 5; i += 1) {
    const shortCode = nanoid(8);
    const { key: shardKey, pool } = getShardForCode(shortCode);

    try {
      const result = await pool.query(
        'INSERT INTO urls (short_code, original_url) VALUES ($1, $2) RETURNING id, short_code, original_url, created_at, clicks',
        [shortCode, originalUrl],
      );

      const row = result.rows[0];
      // Attach target shard metadata
      row.shard = shardKey;

      // Pre-warm Redis cache for instant first-read response
      await setCachedUrl(shortCode, row);

      return row;
    } catch (err) {
      // Unique constraint violation code '23505' -> retry with fresh short_code
      if (err.code === '23505') {
        // eslint-disable-next-line no-continue
        continue;
      }
      throw err;
    }
  }

  throw new Error('Failed to generate a unique short code after multiple attempts');
}

async function getUrlByCode(shortCode) {
  // 1. Check Redis Cache First (Read-heavy optimization path)
  const cached = await getCachedUrl(shortCode);
  if (cached) {
    return cached;
  }

  // 2. Cache Miss: Route to target PostgreSQL Shard via Consistent Hashing
  const { key: shardKey, pool } = getShardForCode(shortCode);

  const result = await pool.query(
    'SELECT id, short_code, original_url, created_at, clicks FROM urls WHERE short_code = $1',
    [shortCode],
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  row.shard = shardKey;

  // Populate Redis Cache (TTL = 1 hour)
  await setCachedUrl(shortCode, row);

  return row;
}

/**
 * Increments click count in target DB shard.
 * Non-blocking / fire-and-forget implementation to prevent write latency from delaying 302 redirects.
 */
function incrementClicks(id, shortCode) {
  setImmediate(async () => {
    try {
      const { pool } = getShardForCode(shortCode);
      await pool.query('UPDATE urls SET clicks = clicks + 1 WHERE id = $1', [id]);
    } catch (err) {
      console.error(`Failed to increment clicks for code ${shortCode}:`, err.message);
    }
  });
}

module.exports = {
  createShortUrl,
  getUrlByCode,
  incrementClicks,
};
