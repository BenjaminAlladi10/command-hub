import { env } from '../config/env.js';

export function verifyCronSecret(req, res, next) {
  const authorization = req.get('Authorization');

  if (!authorization) {
    return res.status(401).json({
      error: {
        code: 'unauthorized',
        message: 'Missing Authorization header',
      },
    });
  }

  const [scheme, token] = authorization.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({
      error: {
        code: 'unauthorized',
        message: 'Invalid Authorization header',
      },
    });
  }

  if (token !== env.CRON_SECRET) {
    return res.status(401).json({
      error: {
        code: 'unauthorized',
        message: 'Invalid cron secret',
      },
    });
  }

  return next();
}