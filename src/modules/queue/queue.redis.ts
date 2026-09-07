import { redisClient } from '../../config/redis';

const TOKEN_COUNTER_TTL_SECONDS = 60 * 60 * 24 * 2; // outlives the business day with margin

function tokenCounterKey(doctorId: number, queueDate: string): string {
  return `queue:token:${doctorId}:${queueDate}`;
}

/**
 * Atomically issues the next token number for a doctor's queue on a given day.
 * Redis INCR avoids the row-locking contention a MySQL MAX(token_number)+1
 * query would hit when many patients check in around the same time.
 */
export async function nextTokenNumber(doctorId: number, queueDate: string): Promise<number> {
  const key = tokenCounterKey(doctorId, queueDate);
  const token = await redisClient.incr(key);
  await redisClient.expire(key, TOKEN_COUNTER_TTL_SECONDS);
  return token;
}
