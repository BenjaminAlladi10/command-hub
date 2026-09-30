import { verifyKey } from 'discord-interactions';
import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';

function rejectInvalidSignature(res) {
  logger.warn('Rejected Discord interaction with invalid signature');
  return res.status(401).send('invalid request signature');
}

export async function verifyDiscordSignature(req, res, next) {
  const signature = req.get('X-Signature-Ed25519');
  const timestamp = req.get('X-Signature-Timestamp');

  if (!signature || !timestamp || !Buffer.isBuffer(req.body)) {
    return rejectInvalidSignature(res);
  }

  let isValid = false;

  try {
    isValid = await verifyKey(
      req.body,
      signature,
      timestamp,
      env.DISCORD_PUBLIC_KEY,
    );
  } catch (error) {
    console.error('verifyKey threw:', error);
    isValid = false;
  }


  if (!isValid) {
    return rejectInvalidSignature(res);
  }

  return next();
}
