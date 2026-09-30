import { Router, raw } from 'express';
import { logger } from '../lib/logger.js';
import { verifyDiscordSignature } from '../middleware/verifyDiscordSignature.js';
import { buildInteractionResponse } from '../services/interactionsService.js';

export const interactionsRouter = Router();

function parseVerifiedBody(req, res, next) {
  try {
    const rawBody = Buffer.isBuffer(req.body)
      ? req.body.toString('utf8')
      : String(req.body ?? '');

    req.interaction = JSON.parse(rawBody);

    return next();
  } catch {
    logger.warn('Verified interaction body was not valid JSON');

    return res.status(400).json({
      error: {
        code: 'invalid_json',
        message: 'Body is not valid JSON',
      },
    });
  }
}

async function postInteraction(req, res, next) {
  try {
    const payload = await buildInteractionResponse(req.interaction);

    res.status(200).json(payload);
  } catch (error) {
    next(error);
  }
}

interactionsRouter.post(
  '/',
  raw({ type: 'application/json' }),
  verifyDiscordSignature,
  parseVerifiedBody,
  postInteraction,
);