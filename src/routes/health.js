import { Router } from 'express';
import { getHealth } from '../services/healthService.js';

export const healthRouter = Router();

healthRouter.get('/', async (_req, res, next) => {
  try {
    res.json(await getHealth());
  } catch (error) {
    next(error);
  }
});
