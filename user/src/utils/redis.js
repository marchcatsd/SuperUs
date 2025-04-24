import { createClient } from 'redis';
import config from '../config/config.js';

// Create Redis client
const redisClient = createClient({
  url: config.REDIS_URL
});

// Handle connection events
redisClient.on('error', (err) => {
  console.error('Redis error:', err);
});

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

// Connect to Redis
const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    console.error('Redis connection error:', error);
  }
};

// Cache middleware
const cacheMiddleware = (duration) => {
  return async (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = `__superU__${req.originalUrl || req.url}`;

    try {
      const cachedResponse = await redisClient.get(key);
      
      if (cachedResponse) {
        return res.json(JSON.parse(cachedResponse));
      }
      
      // Store the original send function
      const originalSend = res.send;
      
      // Override the send function
      res.send = function(body) {
        // Only cache successful responses
        if (res.statusCode === 200) {
          redisClient.setEx(key, duration, body);
        }
        
        // Call the original send function
        originalSend.call(this, body);
      };
      
      next();
    } catch (error) {
      console.error('Redis cache error:', error);
      next();
    }
  };
};

// Clear cache for a specific pattern
const clearCache = async (pattern) => {
  try {
    const keys = await redisClient.keys(`__superU__${pattern}*`);
    
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    console.error('Redis clear cache error:', error);
  }
};

export { redisClient, connectRedis, cacheMiddleware, clearCache };
