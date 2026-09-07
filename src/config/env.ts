import dotenv from 'dotenv';

dotenv.config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env' });

function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT ?? 5000),
  apiPrefix: process.env.API_PREFIX ?? '/api/v1',

  db: {
    host: requireEnv('DB_HOST', 'localhost'),
    port: Number(process.env.DB_PORT ?? 3306),
    name: requireEnv('DB_NAME', 'medibridge'),
    user: requireEnv('DB_USER', 'root'),
    password: process.env.DB_PASSWORD ?? '',
  },

  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: Number(process.env.REDIS_PORT ?? 6379),
    password: process.env.REDIS_PASSWORD || undefined,
    db: Number(process.env.REDIS_DB ?? 0),
  },

  jwt: {
    accessSecret: requireEnv('JWT_ACCESS_SECRET'),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    // Refresh tokens are opaque (not JWTs) so they can be revoked server-side;
    // this only controls how long they remain valid before rotation is required.
    refreshExpiresInDays: Number(process.env.JWT_REFRESH_EXPIRES_IN_DAYS ?? 7),
  },

  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',

  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 900000),
    maxRequests: Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 100),
    // Deliberately separate from the global limit above and much tighter by
    // default - login is a common brute-force target - but still
    // env-configurable so the test suite (which logs in far more often than
    // any real client would in 15 minutes) isn't throttled by its own tests.
    loginMaxRequests: Number(process.env.LOGIN_RATE_LIMIT_MAX_REQUESTS ?? 10),
  },

  appointmentReminder: {
    // How far ahead of an appointment its reminder fires.
    leadMinutes: Number(process.env.APPOINTMENT_REMINDER_LEAD_MINUTES ?? 60),
    // How often the job checks for newly-due appointments.
    checkIntervalMs: Number(process.env.APPOINTMENT_REMINDER_INTERVAL_MS ?? 5 * 60 * 1000),
  },
};
