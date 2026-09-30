import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/requireAuth.js';

export const interactionsApiRouter = Router();

interactionsApiRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const page = Math.max(Number.parseInt(req.query.page ?? '1', 10), 1);
    const limit = Math.min(
      Math.max(Number.parseInt(req.query.limit ?? '20', 10), 1),
      100,
    );

    const skip = (page - 1) * limit;

    const [interactions, total] = await Promise.all([
      prisma.interaction.findMany({
        skip,
        take: limit,
        orderBy: {
          receivedAt: 'desc',
        },
        select: {
          id: true,
          guildId: true,
          guildName: true,
          userId: true,
          username: true,
          command: true,
          text: true,
          status: true,
          receivedAt: true,
          aiSummary: true,
          aiTags: true,
          actions: {
            select: {
              id: true,
              kind: true,
              status: true,
              attempts: true,
              lastError: true,
              nextRetryAt: true,
              updatedAt: true,
            },
            orderBy: {
              updatedAt: 'desc',
            },
          },
        },
      }),

      prisma.interaction.count(),
    ]);

    return res.status(200).json({
      data: interactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

interactionsApiRouter.get('/:id', requireAuth, async (req, res, next) => {
    try {
      const interaction = await prisma.interaction.findUnique({
        where: {
          id: req.params.id,
        },
        select: {
          id: true,
          guildId: true,
          guildName: true,
          userId: true,
          username: true,
          command: true,
          text: true,
          status: true,
          receivedAt: true,
          aiSummary: true,
          aiTags: true,
          actions: {
            select: {
              id: true,
              kind: true,
              status: true,
              attempts: true,
              lastError: true,
              nextRetryAt: true,
              updatedAt: true,
            },
            orderBy: {
              updatedAt: 'desc',
            },
          },
        },
      });
  
      if (!interaction) {
        return res.status(404).json({
          error: {
            code: 'interaction_not_found',
            message: 'Interaction not found',
          },
        });
      }
  
      return res.status(200).json(interaction);
    } catch (error) {
      next(error);
    }
  });