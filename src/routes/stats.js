import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/requireAuth.js';

export const statsRouter = Router();

statsRouter.get('/', requireAuth, async (_req, res, next) => {
  try {
    const [
      totalInteractions,
      successfulInteractions,
      failedInteractions,
      totalCommands,
      totalMirrors,
    ] = await Promise.all([
      prisma.interaction.count(),

      prisma.interaction.count({
        where: {
          status: 'replied',
        },
      }),

      prisma.interaction.count({
        where: {
          status: 'failed',
        },
      }),

      prisma.commandConfig.count(),

      prisma.action.count({
        where: {
          kind: 'mirror',
          status: 'success',
        },
      }),
    ]);

    return res.status(200).json({
      totalInteractions,
      successfulInteractions,
      failedInteractions,
      totalCommands,
      totalMirrors,
    });
  } catch (error) {
    next(error);
  }
});