const mysql = require('mysql2/promise');
const { execSync } = require('child_process');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.test' });

/**
 * Runs once before the whole test suite: drops and recreates the test
 * database, then applies every migration so each test run starts from an
 * identical, empty schema.
 */
module.exports = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  const dbName = process.env.DB_NAME;
  await connection.query(`DROP DATABASE IF EXISTS \`${dbName}\``);
  await connection.query(
    `CREATE DATABASE \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await connection.end();

  const tsNodeBin = require.resolve('ts-node/dist/bin.js');
  execSync(`node "${tsNodeBin}" src/database/migrate.ts`, {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'test' },
  });
};
