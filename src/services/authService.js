import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { prisma } from '../lib/prisma.js';

const scrypt = promisify(crypto.scrypt);

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');

  const derivedKey = await scrypt(password, salt, 64);

  return `scrypt:${salt}:${derivedKey.toString('hex')}`;
}

export async function verifyPassword(password, storedHash) {
  const [algorithm, salt, keyHex] = storedHash.split(':');

  if (algorithm !== 'scrypt' || !salt || !keyHex) {
    return false;
  }

  const derivedKey = await scrypt(password, salt, 64);
  const storedKey = Buffer.from(keyHex, 'hex');

  if (derivedKey.length !== storedKey.length) {
    return false;
  }

  return crypto.timingSafeEqual(derivedKey, storedKey);
}

export function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function hashSessionToken(token) {
  return crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
}

export async function createSession(userId) {
  const token = generateSessionToken();
  const tokenHash = hashSessionToken(token);

  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  return {
    token,
    expiresAt,
  };
}

export async function findSession(token) {
  const tokenHash = hashSessionToken(token);

  return prisma.session.findFirst({
    where: {
      tokenHash,
      expiresAt: {
        gt: new Date(),
      },
    },
    include: {
      user: true,
    },
  });
}

export async function deleteSession(token) {
  const tokenHash = hashSessionToken(token);

  await prisma.session.deleteMany({
    where: { tokenHash },
  });
}