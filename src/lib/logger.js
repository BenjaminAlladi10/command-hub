import pino from 'pino';

export const logger = pino({
  redact: {
    paths: [
      'req.headers',
      'headers',
      '*.headers',
      'res.headers',
      'authorization',
      '*.authorization',
      'cookie',
      '*.cookie',
      'token',
      '*.token',
      'botToken',
      '*.botToken',
      'DISCORD_BOT_TOKEN',
      'DISCORD_PUBLIC_KEY',
      'DISCORD_APP_ID',
      'DATABASE_URL',
      'DIRECT_URL',
      'env.DISCORD_BOT_TOKEN',
      'env.DISCORD_PUBLIC_KEY',
      'env.DATABASE_URL',
      'env.DIRECT_URL',
    ],
    censor: '[Redacted]',
  },
});
