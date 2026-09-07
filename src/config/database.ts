import mysql, { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { env } from './env';
import { logger } from './logger';

export const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  database: env.db.name,
  user: env.db.user,
  password: env.db.password,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  namedPlaceholders: true,
  // Keep DATE columns as plain 'YYYY-MM-DD' strings; letting mysql2 convert them to JS Date
  // objects re-interprets them in the server's local timezone and can shift the calendar day.
  dateStrings: ['DATE'],
});

type NamedParams = Record<string, unknown>;

/**
 * Typed wrapper around pool.query for named-placeholder queries. mysql2's own
 * types require QueryValues objects to have a strict index signature, which
 * plain DTO interfaces don't satisfy - this keeps that cast in one place
 * instead of scattered across every repository call site.
 */
export async function query<T extends RowDataPacket[] | ResultSetHeader = ResultSetHeader>(
  sql: string,
  params?: NamedParams
): Promise<T> {
  const [result] = await pool.query<T>(sql, params as never);
  return result;
}

export async function verifyDatabaseConnection(): Promise<void> {
  const connection = await pool.getConnection();
  try {
    await connection.ping();
    logger.info(`Connected to MySQL database "${env.db.name}" at ${env.db.host}:${env.db.port}`);
  } finally {
    connection.release();
  }
}
