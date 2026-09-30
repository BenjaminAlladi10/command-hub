import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';

export async function getHealth() {
  if (env.DATABASE_URL) {
    await prisma.$queryRaw`SELECT 1`;
  }

  return { ok: true };
}
