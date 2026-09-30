import { InteractionResponseType, InteractionType } from 'discord-interactions';

export function buildInteractionResponse(interaction) {
  if (interaction.type === InteractionType.PING) {
    return { type: InteractionResponseType.PONG };
  }

  // Placeholder until command handling is implemented in a later step.
  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: { content: 'Command Hub received this interaction.' },
  };
}
