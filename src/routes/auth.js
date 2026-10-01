import { Router } from 'express';
import {
  createSession,
  deleteSession,
  verifyPassword,
} from '../services/authService.js';
import { prisma } from '../lib/prisma.js';
import { requireAuth, COOKIE_NAME } from '../middleware/requireAuth.js';

export const authRouter = Router();

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'none',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

function getCookie(req, name) {
  const cookieHeader = req.get('Cookie');

  if (!cookieHeader) {
    return null;
  }

  for (const cookie of cookieHeader.split(';')) {
    const [key, ...valueParts] = cookie.trim().split('=');

    if (key === name) {
      return decodeURIComponent(valueParts.join('='));
    }
  }

  return null;
}

// POST /api/auth/login
authRouter.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {};

    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !email ||
      !password
    ) {
      return res.status(400).json({
        error: {
          code: 'invalid_request',
          message: 'Email and password are required',
        },
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        email: email.trim().toLowerCase(),
      },
    });

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return res.status(401).json({
        error: {
          code: 'invalid_credentials',
          message: 'Invalid email or password',
        },
      });
    }

    const session = await createSession(user.id);

    res.cookie(COOKIE_NAME, session.token, COOKIE_OPTIONS);

    return res.status(200).json({
      id: user.id,
      email: user.email,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/logout
authRouter.post('/logout', requireAuth, async (req, res, next) => {
  try {
    const token = getCookie(req, COOKIE_NAME);

    if (token) {
      await deleteSession(token);
    }

    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      path: '/',
    });

    return res.status(200).json({
      ok: true,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me
authRouter.get('/me', requireAuth, async (req, res) => {
  return res.status(200).json({
    id: req.user.id,
    email: req.user.email,
  });
});