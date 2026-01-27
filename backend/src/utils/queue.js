const Redis = require('ioredis');

// Connect to Redis
const redisUrl = process.env.REDIS_URL || 'redis://redis:6379';
const redis = new Redis(redisUrl);

redis.on('error', (err) => {
  console.error('Redis Connection Error:', err);
});

redis.on('connect', () => {
  console.log('✅ Connected to Redis Queue');
});

const QUEUE_NAME = 'smartcopy_jobs';

/**
 * Add job to queue
 * @param {Object} jobData 
 */
const addToQueue = async (jobData) => {
  try {
    await redis.rpush(QUEUE_NAME, JSON.stringify(jobData));
    console.log(`Job added to queue: ${QUEUE_NAME}`, jobData.type);
    return true;
  } catch (error) {
    console.error('Failed to add job to queue:', error);
    return false;
  }
};

module.exports = {
  addToQueue,
  redis
};
