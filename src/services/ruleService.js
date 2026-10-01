import { prisma } from '../lib/prisma.js';

export async function getCommandConfig(
  guildId,
  guildName,
  commandName,
) {
  // Make sure the guild exists first.
  await prisma.guild.upsert({
    where: {
      guildId,
    },
    update: {
      name: guildName,
    },
    create: {
      guildId,
      name: guildName,
      channels: [],
    },
  });

  let config = await prisma.commandConfig.findUnique({
    where: {
      guildId_name: {
        guildId,
        name: commandName,
      },
    },
  });

  if (!config) {
    config = await prisma.commandConfig.create({
      data: {
        guildId,
        name: commandName,
        enabled: true,
        replyTemplate: '',
        mirror: false,
        flagKeywords: [],
        useAiTriage: false,
      },
    });
  }

  return config;
}

export function applyCommandRules(config, text) {
  if (!config.enabled) {
    return {
      enabled: false,
      reply: 'This command is currently disabled.',
      flagged: false,
      matchedKeywords: [],
    };
  }

  const normalizedText = text.toLowerCase();

  const matchedKeywords = config.flagKeywords.filter((keyword) =>
    normalizedText.includes(keyword.toLowerCase()),
  );

  let reply = config.replyTemplate;

  if (!reply) {
    reply = text;
  }

  reply = reply.replaceAll('{{text}}', text);

  return {
    enabled: true,
    reply,
    flagged: matchedKeywords.length > 0,
    matchedKeywords,
  };
}