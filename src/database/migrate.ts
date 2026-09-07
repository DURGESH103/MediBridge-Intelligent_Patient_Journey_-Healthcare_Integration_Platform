import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { env } from '../config/env';
import { logger } from '../config/logger';

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

// A dedicated connection with multipleStatements enabled, used only for running
// migration files. The app's shared pool (src/config/database.ts) intentionally
// keeps multipleStatements off to reduce SQL injection surface.
const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  database: env.db.name,
  user: env.db.user,
  password: env.db.password,
  multipleStatements: true,
});

async function ensureMigrationsTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function getAppliedMigrations(): Promise<Set<string>> {
  const [rows] = await pool.query('SELECT name FROM schema_migrations');
  return new Set((rows as { name: string }[]).map((row) => row.name));
}

async function runMigrations(): Promise<void> {
  await ensureMigrationsTable();
  const applied = await getAppliedMigrations();

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  for (const file of files) {
    if (applied.has(file)) {
      continue;
    }

    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8');
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query(sql);
      await connection.query('INSERT INTO schema_migrations (name) VALUES (?)', [file]);
      await connection.commit();
      logger.info(`Applied migration: ${file}`);
    } catch (error) {
      await connection.rollback();
      logger.error(`Failed to apply migration ${file}: ${error instanceof Error ? error.message : error}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  logger.info('All migrations are up to date');
}

runMigrations()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
