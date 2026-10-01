import { Router } from 'express';

import { verifyCronSecret } from '../middleware/verifyCronSecret.js';
import { retryFailedActions } from '../services/retryService.js';

export const internalRouter = Router();

internalRouter.post(
  '/retry',
  verifyCronSecret,
  async (_req, res, next) => {
    try {
      const result = await retryFailedActions();

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
);