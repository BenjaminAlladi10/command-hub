import { findSession } from '../services/authService.js';

const COOKIE_NAME = 'command_hub_session';

function getCookie(req, name) {
  const cookieHeader = req.get('Cookie');

  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(';');

  for (const cookie of cookies) {
    const [key, ...valueParts] = cookie.trim().split('=');

    if (key === name) {
      return decodeURIComponent(valueParts.join('='));
    }
  }

  return null;
}

export async function requireAuth(req, res, next) {
  try {
    const token = getCookie(req, COOKIE_NAME);

    if (!token) {
      return res.status(401).json({
        error: {
          code: 'unauthorized',
          message: 'Authentication required',
        },
      });
    }

    const session = await findSession(token);

    if (!session) {
      return res.status(401).json({
        error: {
          code: 'unauthorized',
          message: 'Invalid or expired session',
        },
      });
    }

    req.user = session.user;

    return next();
  } catch (error) {
    return next(error);
  }
}

export { COOKIE_NAME };