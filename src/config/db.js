const { Pool } = require('pg');
const ConsistentHashRing = require('../utils/consistentHash');

/**
 * Configure database shard connection URLs.
 * SHARD_URLS can be a comma-separated list of PostgreSQL connection strings.
 * Default fallback to DATABASE_URL or individual shard env variables.
 */
function getShardConnectionConfig() {
  if (process.env.SHARD_URLS) {
    const urls = process.env.SHARD_URLS.split(',').map((s) => s.trim()).filter(Boolean);
    return urls.map((url, idx) => ({ key: `shard_${idx}`, connectionString: url }));
  }

  // Check explicit individual shard env variables
  const shardEnvVars = [
    process.env.DATABASE_URL_0 || process.env.DATABASE_URL,
    process.env.DATABASE_URL_1,
    process.env.DATABASE_URL_2,
  ].filter(Boolean);

  if (shardEnvVars.length > 0) {
    return shardEnvVars.map((url, idx) => ({ key: `shard_${idx}`, connectionString: url }));
  }

  // Default fallback for single database mode
  const defaultUrl = process.env.DATABASE_URL || 'postgresql://url_user:url_password@127.0.0.1:5432/urlshortener';
  return [{ key: 'shard_0', connectionString: defaultUrl }];
}

const shardConfigs = getShardConnectionConfig();
const pools = new Map();
const shardKeys = shardConfigs.map((cfg) => cfg.key);

// Initialize connection pools for each shard
shardConfigs.forEach(({ key, connectionString }) => {
  const pool = new Pool({
    connectionString,
    max: 20, // Tuned pool limit to prevent connection pool exhaustion under high concurrency
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  pool.on('error', (err) => {
    console.error(`Unexpected pool error on ${key}:`, err);
  });

  pools.set(key, pool);
});

// Initialize consistent hash ring
const hashRing = new ConsistentHashRing(shardKeys, 40);

/**
 * Ensures database table schema and indexes exist across all shards.
 */
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

  // Bottleneck fix: Create explicit B-tree index on short_code for fast shard lookup queries
  const createIndexSql = `
    CREATE INDEX IF NOT EXISTS idx_urls_short_code ON urls(short_code);
  `;

  const promises = Array.from(pools.entries()).map(async ([key, pool]) => {
    try {
      await pool.query(createTableSql);
      await pool.query(createIndexSql);
      console.log(`✅ Schema & index verified on database shard: ${key}`);
    } catch (err) {
      console.error(`❌ Failed to initialize schema on shard ${key}:`, err.message);
      throw err;
    }
  });

  await Promise.all(promises);
}

/**
 * Returns the pool for the target database shard determined by consistent hashing for shortCode.
 * @param {string} shortCode
 * @returns {{ key: string, pool: Pool }}
 */
function getShardForCode(shortCode) {
  const targetShardKey = hashRing.getShard(shortCode) || 'shard_0';
  const pool = pools.get(targetShardKey) || pools.get('shard_0');
  return { key: targetShardKey, pool };
}

/**
 * Returns all configured pools.
 */
function getAllPools() {
  return pools;
}

module.exports = {
  pools,
  hashRing,
  ensureSchema,
  getShardForCode,
  getAllPools,
};
