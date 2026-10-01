import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { sendMirrorNotification } from './mirrorService.js';

function getNextRetryTime(attempts) {
  const delaySeconds = Math.min(
    30 * 2 ** Math.max(attempts - 1, 0),
    15 * 60,
  );

  return new Date(
    Date.now() + delaySeconds * 1000,
  );
}

export async function retryFailedActions() {
  const now = new Date();

  const actions = await prisma.action.findMany({
    where: {
      status: {
        in: ['failed', 'retrying'],
      },
      nextRetryAt: {
        lte: now,
      },
    },
    include: {
      interaction: true,
    },
    orderBy: {
      updatedAt: 'asc',
    },
    take: 20,
  });

  const results = [];

  for (const action of actions) {
    try {
      await prisma.action.update({
        where: {
          id: action.id,
        },
        data: {
          status: 'retrying',
          attempts: {
            increment: 1,
          },
        },
      });

      if (action.kind === 'reply') {
        await retryReplyAction(action);
      } else if (action.kind === 'mirror') {
        await retryMirrorAction(action);
      } else {
        throw new Error(
          `Retry for action type '${action.kind}' is not implemented`,
        );
      }

      await prisma.action.update({
        where: {
          id: action.id,
        },
        data: {
          status: 'success',
          lastError: null,
          nextRetryAt: null,
        },
      });

      results.push({
        actionId: action.id,
        kind: action.kind,
        status: 'success',
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Unknown retry error';

      const nextRetryAt = getNextRetryTime(
        action.attempts + 1,
      );

      await prisma.action.update({
        where: {
          id: action.id,
        },
        data: {
          status: 'failed',
          lastError: errorMessage,
          nextRetryAt,
        },
      });

      results.push({
        actionId: action.id,
        kind: action.kind,
        status: 'failed',
        error: errorMessage,
      });
    }
  }

  return {
    processed: actions.length,
    results,
  };
}

async function retryReplyAction(action) {
  const interaction = action.interaction;

  if (!interaction.interactionToken) {
    throw new Error(
      'Interaction token is unavailable',
    );
  }

  if (
    interaction.tokenExpiresAt &&
    interaction.tokenExpiresAt <= new Date()
  ) {
    throw new Error(
      'Discord interaction token has expired',
    );
  }

  if (!action.payload) {
    throw new Error(
      'Reply action payload is unavailable',
    );
  }

  const response = await fetch(
    `https://discord.com/api/v10/webhooks/${env.DISCORD_APP_ID}/${interaction.interactionToken}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: action.payload,
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text();

    throw new Error(
      `Discord retry failed: ${response.status} ${body}`,
    );
  }
}

async function retryMirrorAction(action) {
  const guild = await prisma.guild.findUnique({
    where: {
      guildId: action.interaction.guildId,
    },
    select: {
      mirrorWebhook: true,
    },
  });

  if (!guild?.mirrorWebhook) {
    throw new Error(
      'Mirror webhook is not configured',
    );
  }

  if (!action.payload) {
    throw new Error(
      'Mirror action payload is unavailable',
    );
  }

  await sendMirrorNotification(
    guild.mirrorWebhook,
    action.payload,
  );
}