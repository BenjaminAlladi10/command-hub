import { InteractionResponseType, InteractionType } from 'discord-interactions';
import { prisma } from '../lib/prisma.js';

export async function buildInteractionResponse(interaction) {
  if (interaction.type === InteractionType.PING) {
    return { type: InteractionResponseType.PONG };
  }

  if (interaction.type !== InteractionType.APPLICATION_COMMAND) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: 'Unsupported interaction type.',
      },
    };
  }

  const command = interaction.data?.name;

  let text;

  if (command === 'hello') {
    text = 'Hello! Command Hub is working 🚀';
  } else if (command === 'notify') {
    const message = interaction.data?.options?.find(
      (option) => option.name === 'message',
    )?.value;

    text = message
      ? `Notification received: ${message}`
      : 'Notification received.';
  } else {
    text = `Unknown command: /${command}`;
  }

  // Start persistence without making Discord wait for it.
  persistInteraction(interaction, command, text).catch((error) => {
    console.error('Failed to persist interaction:', error);
  });

  // Respond to Discord immediately.
  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content: text,
    },
  };
}

async function persistInteraction(interaction, command, text) {
  const guildId = interaction.guild_id ?? 'unknown';

  const guildName = interaction.guild?.name ?? 'Unknown Server';

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
}