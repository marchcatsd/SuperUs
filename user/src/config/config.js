export default {
  PORT: process.env.PORT || 8000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/superU',
  JWT_SECRET: process.env.JWT_SECRET || 'your_jwt_secret_key',
  JWT_EXPIRATION: process.env.JWT_EXPIRATION || '7d',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379'
};
