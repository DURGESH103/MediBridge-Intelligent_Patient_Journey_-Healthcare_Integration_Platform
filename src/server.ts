import http from 'http';
import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { verifyDatabaseConnection } from './config/database';
import { connectRedis } from './config/redis';
import { initSocketServer } from './sockets';

async function bootstrap(): Promise<void> {
  await verifyDatabaseConnection();
  await connectRedis();

  const app = createApp();
  const httpServer = http.createServer(app);
  initSocketServer(httpServer);

  httpServer.listen(env.port, () => {
    logger.info(`MediBridge API listening on port ${env.port} [${env.nodeEnv}]`);
  });
}

bootstrap().catch((error) => {
  logger.error(`Failed to start MediBridge API: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
});
