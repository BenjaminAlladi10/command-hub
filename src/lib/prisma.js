import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

// Reuse one client across node --watch reloads in development.
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
