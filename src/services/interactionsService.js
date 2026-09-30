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

export async function buildInteractionResponse(interaction) {
  // Discord endpoint verification
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

  // Process everything after Discord has been acknowledged.
  processInteraction(interaction).catch((error) => {
    console.error('Failed to process interaction:', error);
  });

  // Tell Discord immediately that we are processing the command.
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

  // Get/create configuration.
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

  // Apply rules.
  const result = applyCommandRules(config, text);

  console.log('Command rule result:', {
    command,
    enabled: result.enabled,
    flagged: result.flagged,
    matchedKeywords: result.matchedKeywords,
  });

  // Persist interaction.
  const userId =
    interaction.member?.user?.id ??
    interaction.user?.id ??
    'unknown';

  const username =
    interaction.member?.user?.username ??
    interaction.user?.username ??
    'unknown';

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
      status: 'replied',
      actions: {
        create: {
          kind: 'reply',
          status: 'success',
          attempts: 1,
        },
      },
    },
  });

  // Send the actual configured response.
  await sendFollowUp(
    interaction.token,
    result.reply,
  );
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