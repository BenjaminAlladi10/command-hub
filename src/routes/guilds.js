import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/requireAuth.js';

export const guildsRouter = Router();

const updateGuildSchema = z.object({
  name: z.string().min(1).optional(),
  channelId: z.string().min(1).nullable().optional(),
  channels: z
    .array(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1),
      }),
    )
    .optional(),
  mirrorWebhook: z
    .string()
    .url()
    .refine(
      (value) =>
        value.startsWith('https://discord.com/api/webhooks/') ||
        value.startsWith('https://hooks.slack.com/'),
      {
        message: 'Unsupported mirror webhook',
      },
    )
    .nullable()
    .optional(),
});

// GET /api/guilds
guildsRouter.get('/', requireAuth, async (_req, res, next) => {
  try {
    const guilds = await prisma.guild.findMany({
      orderBy: {
        name: 'asc',
      },
      select: {
        guildId: true,
        name: true,
        channelId: true,
        channels: true,
        mirrorWebhook: true,
        connectedAt: true,
      },
    });

    return res.status(200).json(
      guilds.map((guild) => ({
        guildId: guild.guildId,
        name: guild.name,
        channelId: guild.channelId,
        channels: guild.channels,
        mirrorConfigured: Boolean(guild.mirrorWebhook),
        connectedAt: guild.connectedAt,
      })),
    );
  } catch (error) {
    next(error);
  }
});

// PUT /api/guilds/:guildId
guildsRouter.put('/:guildId', requireAuth, async (req, res, next) => {
  try {
    const parsed = updateGuildSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: {
          code: 'invalid_request',
          message: 'Invalid guild configuration',
        },
      });
    }

    const existing = await prisma.guild.findUnique({
      where: {
        guildId: req.params.guildId,
      },
    });

    if (!existing) {
      return res.status(404).json({
        error: {
          code: 'guild_not_found',
          message: 'Guild not found',
        },
      });
    }

    const data = {};

    if (parsed.data.name !== undefined) {
      data.name = parsed.data.name;
    }

    if (parsed.data.channelId !== undefined) {
      data.channelId = parsed.data.channelId;
    }

    if (parsed.data.channels !== undefined) {
      data.channels = parsed.data.channels;
    }

    if (parsed.data.mirrorWebhook !== undefined) {
      data.mirrorWebhook = parsed.data.mirrorWebhook;
    }

    const guild = await prisma.guild.update({
      where: {
        guildId: req.params.guildId,
      },
      data,
    });

    return res.status(200).json({
      guildId: guild.guildId,
      name: guild.name,
      channelId: guild.channelId,
      channels: guild.channels,
      mirrorConfigured: Boolean(guild.mirrorWebhook),
      connectedAt: guild.connectedAt,
    });
  } catch (error) {
    next(error);
  }
});