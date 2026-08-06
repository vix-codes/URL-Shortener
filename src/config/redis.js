const Redis = require('ioredis');

const redisUrl = process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || '127.0.0.1'}:${process.env.REDIS_PORT || 6379}`;

let client = null;
let isConnected = false;

try {
  client = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 5) {
        console.warn('⚠️ Redis reconnect attempts exhausted. Continuing with cache disabled/bypassed.');
        return null;
      }
      return Math.min(times * 100, 2000);
    },
    lazyConnect: true,
  });

  client.on('connect', () => {
    isConnected = true;
    console.log('✅ Connected to Redis cache');
  });

  client.on('error', (err) => {
    isConnected = false;
    console.warn(`⚠️ Redis error: ${err.message}`);
  });

  // Attempt connection asynchronously
  client.connect().catch((err) => {
    console.warn(`⚠️ Redis initial connection failed: ${err.message}. Direct DB lookups will be used.`);
  });
} catch (err) {
  console.warn(`⚠️ Failed to initialize Redis client: ${err.message}`);
}

async function getCachedUrl(shortCode) {
  if (!client || !isConnected) return null;
  try {
    const data = await client.get(`url:${shortCode}`);
    if (data) {
      return JSON.parse(data);
    }
  } catch (err) {
    console.warn(`Redis get error: ${err.message}`);
  }
  return null;
}

async function setCachedUrl(shortCode, urlRecord, ttlSeconds = 3600) {
  if (!client || !isConnected) return;
  try {
    await client.set(`url:${shortCode}`, JSON.stringify(urlRecord), 'EX', ttlSeconds);
  } catch (err) {
    console.warn(`Redis set error: ${err.message}`);
  }
}

async function invalidateCachedUrl(shortCode) {
  if (!client || !isConnected) return;
  try {
    await client.del(`url:${shortCode}`);
  } catch (err) {
    console.warn(`Redis del error: ${err.message}`);
  }
}

module.exports = {
  redisClient: client,
  getCachedUrl,
  setCachedUrl,
  invalidateCachedUrl,
};
