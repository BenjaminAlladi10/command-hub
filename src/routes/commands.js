import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/requireAuth.js';

export const commandsRouter = Router();

const commandConfigSchema = z.object({
  enabled: z.boolean(),
  rule: z.object({
    replyTemplate: z.string(),
    mirror: z.boolean(),
    flagKeywords: z.array(z.string()),
    useAiTriage: z.boolean(),
  }),
});

// GET /api/commands?guildId=...
commandsRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const guildId = req.query.guildId;

    if (typeof guildId !== 'string' || !guildId) {
      return res.status(400).json({
        error: {
          code: 'invalid_request',
          message: 'guildId is required',
        },
      });
    }

    const commands = await prisma.commandConfig.findMany({
      where: { guildId },
      orderBy: { name: 'asc' },
    });

    return res.status(200).json(
      commands.map((command) => ({
        name: command.name,
        enabled: command.enabled,
        rule: {
          replyTemplate: command.replyTemplate,
          mirror: command.mirror,
          flagKeywords: command.flagKeywords,
          useAiTriage: command.useAiTriage,
        },
      })),
    );
  } catch (error) {
    next(error);
  }
});

// PUT /api/commands/:name?guildId=...
commandsRouter.put('/:name', requireAuth, async (req, res, next) => {
  try {
    const guildId = req.query.guildId;

    if (typeof guildId !== 'string' || !guildId) {
      return res.status(400).json({
        error: {
          code: 'invalid_request',
          message: 'guildId is required',
        },
      });
    }

    const parsed = commandConfigSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: {
          code: 'invalid_request',
          message: 'Invalid command configuration',
        },
      });
    }

    const command = await prisma.commandConfig.findUnique({
      where: {
        guildId_name: {
          guildId,
          name: req.params.name,
        },
      },
    });

    if (!command) {
      return res.status(404).json({
        error: {
          code: 'command_not_found',
          message: 'Command configuration not found',
        },
      });
    }

    const updated = await prisma.commandConfig.update({
      where: {
        guildId_name: {
          guildId,
          name: req.params.name,
        },
      },
      data: {
        enabled: parsed.data.enabled,
        replyTemplate: parsed.data.rule.replyTemplate,
        mirror: parsed.data.rule.mirror,
        flagKeywords: parsed.data.rule.flagKeywords,
        useAiTriage: parsed.data.rule.useAiTriage,
      },
    });

    return res.status(200).json({
      name: updated.name,
      enabled: updated.enabled,
      rule: {
        replyTemplate: updated.replyTemplate,
        mirror: updated.mirror,
        flagKeywords: updated.flagKeywords,
        useAiTriage: updated.useAiTriage,
      },
    });
  } catch (error) {
    next(error);
  }
});