import { connectRedis, redisClient } from '../src/config/redis';
import { pool } from '../src/config/database';

beforeAll(async () => {
  await connectRedis();
});

afterAll(async () => {
  await redisClient.quit();
  await pool.end();
});
