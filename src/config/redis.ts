import Redis from 'ioredis';
import { env } from './env';
import { logger } from './logger';

export const redisClient = new Redis({
  host: env.redis.host,
  port: env.redis.port,
  password: env.redis.password,
  db: env.redis.db,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

redisClient.on('error', (err) => {
  logger.error(`Redis connection error: ${err.message}`);
});

export async function connectRedis(): Promise<void> {
  await redisClient.connect();
  logger.info(`Connected to Redis at ${env.redis.host}:${env.redis.port}`);
}
