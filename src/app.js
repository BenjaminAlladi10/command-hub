import express from 'express';
import { logger } from './lib/logger.js';
import { healthRouter } from './routes/health.js';
import { interactionsRouter } from './routes/interactions.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use('/health', healthRouter);
  app.use('/interactions', interactionsRouter);

  app.use((error, _req, res, _next) => {
    logger.error({ err: error instanceof Error ? error.message : 'unknown' }, 'Unhandled error');
    res.status(500).json({
      error: { code: 'internal_error', message: 'Internal server error' },
    });
  });

  return app;
}
