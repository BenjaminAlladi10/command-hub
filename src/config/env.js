import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { z } from 'zod';

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
dotenv.config({ path: path.join(serverRoot, '.env') });

const emptyToUndefined = (value) => (value === '' ? undefined : value);

const envSchema = z.object({
  PORT: z.preprocess(
    (value) => (value === undefined || value === '' ? 3000 : value),
    z.coerce.number().int().min(1).max(65535),
  ),
  DISCORD_PUBLIC_KEY: z.string().trim().min(1),
  DISCORD_APP_ID: z.string().trim().min(1),
  DISCORD_BOT_TOKEN: z.string().trim().min(1),
  DATABASE_URL: z.preprocess(emptyToUndefined, z.string().trim().min(1).optional()),
  DIRECT_URL: z.preprocess(emptyToUndefined, z.string().trim().min(1).optional()),
  CRON_SECRET: z.string().trim().min(1),
});

function formatEnvErrors(error) {
  const lines = error.issues.map((issue) => {
    const name = issue.path.join('.') || 'unknown';
    return `  - ${name}: ${issue.message}`;
  });
  return `Invalid environment configuration:\n${lines.join('\n')}`;
}

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(formatEnvErrors(parsed.error));
  process.exit(1);
}

export const env = parsed.data;
