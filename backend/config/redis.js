const Redis = require('ioredis');

let redis = null;

/**
 * Initialize Redis connection for caching
 * Optional - falls back gracefully if Redis is not available
 */
const initRedis = () => {
  if (!process.env.REDIS_URL) {
    console.log('⚠️ Redis URL not configured. Caching disabled.');
    return null;
  }

  try {
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      enableReadyCheck: true,
      lazyConnect: true,
    });

    redis.on('connect', () => {
      console.log('✅ Redis Connected');
    });

    redis.on('error', (err) => {
      console.error('❌ Redis Error:', err.message);
    });

    redis.on('close', () => {
      console.log('⚠️ Redis connection closed');
    });

    return redis;
  } catch (error) {
    console.error('❌ Redis initialization failed:', error.message);
    return null;
  }
};

/**
 * Get cached data
 * @param {string} key - Cache key
 * @returns {Promise<Object|null>} Cached data or null
 */
const getCache = async (key) => {
  if (!redis) return null;
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Cache get error:', error.message);
    return null;
  }
};

/**
 * Set cached data
 * @param {string} key - Cache key
 * @param {Object} data - Data to cache
 * @param {number} ttl - Time to live in seconds (default: 5 minutes)
 */
const setCache = async (key, data, ttl = 300) => {
  if (!redis) return;
  try {
    await redis.setex(key, ttl, JSON.stringify(data));
  } catch (error) {
    console.error('Cache set error:', error.message);
  }
};

/**
 * Delete cached data
 * @param {string} pattern - Key pattern to delete
 */
const deleteCache = async (pattern) => {
  if (!redis) return;
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error('Cache delete error:', error.message);
  }
};

module.exports = {
  initRedis,
  getCache,
  setCache,
  deleteCache,
  getRedis: () => redis,
};
