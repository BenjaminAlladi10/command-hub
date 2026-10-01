import {
  InteractionResponseType,
  InteractionType,
} from 'discord-interactions';

import { prisma } from '../lib/prisma.js';

import {
  getCommandConfig,
  applyCommandRules,
} from './ruleService.js';

import { env } from '../config/env.js';
import { sendMirrorNotification } from './mirrorService.js';

function getInitialRetryTime() {
  return new Date(Date.now() + 30 * 1000);
}

export async function buildInteractionResponse(interaction) {
  if (interaction.type === InteractionType.PING) {
    return {
      type: InteractionResponseType.PONG,
    };
  }

  if (interaction.type !== InteractionType.APPLICATION_COMMAND) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: 'Unsupported interaction type.',
      },
    };
  }

  processInteraction(interaction).catch((error) => {
    console.error('Failed to process interaction:', error);
  });

  return {
    type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
  };
}

async function processInteraction(interaction) {
  const command = interaction.data?.name;

  const guildId = interaction.guild_id ?? 'unknown';
  const guildName = interaction.guild?.name ?? 'Unknown Server';

  const text =
    command === 'notify'
      ? interaction.data?.options?.find(
          (option) => option.name === 'message',
        )?.value ?? ''
      : command === 'hello'
        ? 'Hello! Command Hub is working 🚀'
        : '';

  const config = await getCommandConfig(
    guildId,
    guildName,
    command,
  );

  console.log('Loaded command config:', {
    guildId,
    command,
    enabled: config.enabled,
    replyTemplate: config.replyTemplate,
    flagKeywords: config.flagKeywords,
    mirror: config.mirror,
    useAiTriage: config.useAiTriage,
  });

  const result = applyCommandRules(config, text);

  console.log('Command rule result:', {
    command,
    enabled: result.enabled,
    flagged: result.flagged,
    matchedKeywords: result.matchedKeywords,
  });

  const userId =
    interaction.member?.user?.id ??
    interaction.user?.id ??
    'unknown';

  const username =
    interaction.member?.user?.username ??
    interaction.user?.username ??
    'unknown';

  /*
   * Create the interaction and its reply action.
   *
   * The reply action starts as PENDING because
   * the Discord follow-up has not been sent yet.
   */
  await prisma.interaction.upsert({
    where: {
      id: interaction.id,
    },
    update: {},
    create: {
      id: interaction.id,
      guildId,
      guildName,
      userId,
      username,
      command: command ?? 'unknown',
      text,

      // Needed if we have to retry the Discord response.
      interactionToken: interaction.token,

      // Discord interaction tokens are temporary.
      tokenExpiresAt: new Date(
        Date.now() + 15 * 60 * 1000,
      ),

      status: 'received',

      actions: {
        create: {
          kind: 'reply',
          status: 'pending',
          payload: result.reply,
        },
      },
    },
  });

  /*
   * Find the reply action.
   */
  const replyAction = await prisma.action.findFirst({
    where: {
      interactionId: interaction.id,
      kind: 'reply',
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  if (!replyAction) {
    throw new Error('Reply action was not created');
  }

  /*
   * Attempt to send the Discord response.
   */
  try {
    await prisma.action.update({
      where: {
        id: replyAction.id,
      },
      data: {
        attempts: {
          increment: 1,
        },
      },
    });

    await sendFollowUp(
      interaction.token,
      result.reply,
    );

    /*
     * Discord response succeeded.
     */
    await prisma.action.update({
      where: {
        id: replyAction.id,
      },
      data: {
        status: 'success',
        lastError: null,
      },
    });

    await prisma.interaction.update({
      where: {
        id: interaction.id,
      },
      data: {
        status: 'replied',
      },
    });
  } catch (error) {
    /*
     * Discord response failed.
     */
    await prisma.action.update({
      where: { id: replyAction.id },
      data: {
        status: 'failed',
        lastError:
          error instanceof Error ? error.message : 'Unknown reply error',
        nextRetryAt: new Date(Date.now() + 30 * 1000),
      },
    });

    await prisma.interaction.update({
      where: {
        id: interaction.id,
      },
      data: {
        status: 'failed',
      },
    });

    throw error;
  }

  /*
   * Mirror notification.
   */
  if (config.mirror) {
    await mirrorInteraction(
      guildId,
      interaction.id,
      result.reply,
    );
  }
}

async function sendFollowUp(token, content) {
  const response = await fetch(
    `https://discord.com/api/v10/webhooks/${env.DISCORD_APP_ID}/${token}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text();

    throw new Error(
      `Discord follow-up failed: ${response.status} ${body}`,
    );
  }
}

async function mirrorInteraction(
  guildId,
  interactionId,
  content,
) {
  const guild = await prisma.guild.findUnique({
    where: {
      guildId,
    },
    select: {
      mirrorWebhook: true,
    },
  });

  if (!guild?.mirrorWebhook) {
    throw new Error(
      'Mirror is enabled but webhook is not configured',
    );
  }

  const action = await prisma.action.create({
    data: {
      interactionId,
      kind: 'mirror',
      status: 'pending',
      payload: content,
    },
  });

  try {
    await prisma.action.update({
      where: {
        id: action.id,
      },
      data: {
        attempts: {
          increment: 1,
        },
      },
    });

    await sendMirrorNotification(
      guild.mirrorWebhook,
      content,
    );

    await prisma.action.update({
      where: {
        id: action.id,
      },
      data: {
        status: 'success',
        lastError: null,
      },
    });
  } catch (error) {
    await prisma.action.update({
      where: { id: action.id },
      data: {
        status: 'failed',
        lastError:
          error instanceof Error ? error.message : 'Unknown mirror error',
        nextRetryAt: new Date(Date.now() + 30 * 1000),
      },
    });

    throw error;
  }
}