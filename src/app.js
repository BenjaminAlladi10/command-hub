import express from 'express';
import { logger } from './lib/logger.js';
import { healthRouter } from './routes/health.js';
import { interactionsRouter } from './routes/interactions.js';
import { internalRouter } from './routes/internal.js';
import { authRouter } from './routes/auth.js';
import { statsRouter } from './routes/stats.js';
import { interactionsApiRouter } from './routes/interactionsApi.js';
import { commandsRouter } from './routes/commands.js';
import { guildsRouter } from './routes/guilds.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use('/health', healthRouter);
  app.use('/interactions', interactionsRouter);

  app.use('/api', express.json());

  app.use('/api/auth', authRouter);
  app.use('/api/stats', statsRouter);
  app.use('/api/interactions', interactionsApiRouter);
  app.use('/api/commands', commandsRouter);
  app.use('/api/guilds', guildsRouter);
  app.use('/api/internal', internalRouter);

  app.use((error, _req, res, _next) => {
    logger.error({ err: error instanceof Error ? error.message : 'unknown' }, 'Unhandled error');
    res.status(500).json({
      error: { code: 'internal_error', message: 'Internal server error' },
    });
  });

  return app;
}
