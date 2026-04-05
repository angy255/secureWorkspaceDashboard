import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { execute, queryOne } from '../db';
import { getUserByEmail, getUserById } from '../db/queries/userQueries';
import { authMiddleware } from '../middleware/authMiddleware';
import { validate } from '../middleware/validateRequest';
import { strictLimiter } from '../middleware/rateLimiter';
import type { JwtPayload } from '../types';

const router = Router();

// ─────────────────────────────────────────────────────────────
// In-memory refresh-token store
// PRODUCTION NOTE: Replace this Map with Redis for horizontal
// scaling and persistence across restarts.
// ─────────────────────────────────────────────────────────────
interface RefreshEntry {
  userId: number;
  expiresAt: Date;
}
const refreshTokenStore = new Map<string, RefreshEntry>();

// ─────────────────────────────────────────────────────────────
// Zod schemas (all use .strict() to strip unknown keys)
// SECURITY: Unknown fields are stripped before any processing
// ─────────────────────────────────────────────────────────────
const registerSchema = z.object({
  name:     z.string().min(1, 'Name is required').max(255),
  email:    z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
}).strict();

const loginSchema = z.object({
  email:    z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
}).strict();

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function issueTokens(user: { id: number; role_name: string; organization_id: number }) {
  const jwtSecret     = process.env.JWT_SECRET!;
  const refreshSecret = process.env.JWT_REFRESH_SECRET!;

  // SECURITY: Short-lived access token (15 m) limits blast radius if leaked
  const accessToken = jwt.sign(
    { userId: user.id, role: user.role_name, organizationId: user.organization_id } satisfies JwtPayload,
    jwtSecret,
    { expiresIn: '15m' }
  );

  // SECURITY: Separate secret for refresh tokens prevents cross-use
  const refreshToken = jwt.sign(
    { userId: user.id },
    refreshSecret,
    { expiresIn: '7d' }
  );

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  refreshTokenStore.set(refreshToken, { userId: user.id, expiresAt });

  return { accessToken, refreshToken };
}

function setRefreshCookie(res: Response, token: string): void {
  // SECURITY: httpOnly prevents JavaScript from reading the cookie (XSS defence)
  // SECURITY: secure flag ensures cookie is only sent over HTTPS in production
  // SECURITY: sameSite=strict prevents CSRF by blocking cross-site cookie sends
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge:   7 * 24 * 60 * 60 * 1000,
    path:     '/api/auth',
  });
}

function safeUser(u: { id: number; name: string; email: string; role_name: string }) {
  // SECURITY: hashed_password is never included in API responses
  return { id: u.id, name: u.name, email: u.email, role: u.role_name };
}

// ─────────────────────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────────────────────
router.post(
  '/register',
  strictLimiter,
  validate(registerSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, email, password } = req.body as z.infer<typeof registerSchema>;

      const existing = await getUserByEmail(email);
      if (existing) {
        res.status(409).json({ error: 'An account with that email already exists.' });
        return;
      }

      // SECURITY: bcrypt with 12 rounds — slow enough to resist offline attacks
      const hashed_password = await bcrypt.hash(password, 12);

      // Default new registrations to member role (role_id=3) in org 1
      const result = await execute(
        `INSERT INTO users (name, email, hashed_password, role_id, organization_id)
         VALUES (?, ?, ?, 3, 1)`,
        [name, email, hashed_password]
      );

      const user = await queryOne<{ id: number; name: string; email: string; role_name: string; organization_id: number }>(
        `SELECT u.id, u.name, u.email, r.role_name, u.organization_id
         FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?`,
        [result.insertId]
      );

      if (!user) { res.status(500).json({ error: 'User creation failed.' }); return; }

      const { accessToken, refreshToken } = issueTokens(user);
      setRefreshCookie(res, refreshToken);

      res.status(201).json({
        data:    { accessToken, user: safeUser(user) },
        message: 'Registration successful.',
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────
router.post(
  '/login',
  strictLimiter,
  validate(loginSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body as z.infer<typeof loginSchema>;

      const user = await getUserByEmail(email);

      // SECURITY: Always run bcrypt.compare even when user doesn't exist.
      // This prevents timing-based user-enumeration attacks by making
      // both code paths take approximately the same time.
      const dummyHash = '$2b$12$invalidhashusedfortimingprotectionXXXXXXXXXXXXXXXXXX';
      const hashToCheck = user?.hashed_password ?? dummyHash;
      const isMatch     = await bcrypt.compare(password, hashToCheck);

      if (!user || !isMatch) {
        res.status(401).json({ error: 'Invalid email or password.' });
        return;
      }

      // Record login activity
      const ip         = req.ip ?? req.socket.remoteAddress ?? 'unknown';
      const deviceInfo = req.headers['user-agent'] ?? 'unknown';
      await execute(
        `INSERT INTO activity_logs (user_id, login_time, ip_address, device_info)
         VALUES (?, NOW(), ?, ?)`,
        [user.id, ip, deviceInfo]
      );

      const { accessToken, refreshToken } = issueTokens(user);
      setRefreshCookie(res, refreshToken);

      res.json({
        data:    { accessToken, user: safeUser(user) },
        message: 'Login successful.',
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────────────────────
// POST /api/auth/refresh
// Reads httpOnly cookie, issues new access token + rotates refresh token
// ─────────────────────────────────────────────────────────────
router.post(
  '/refresh',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.cookies?.refreshToken as string | undefined;

      if (!token) {
        res.status(401).json({ error: 'No refresh token provided.' });
        return;
      }

      const stored = refreshTokenStore.get(token);
      if (!stored || stored.expiresAt < new Date()) {
        refreshTokenStore.delete(token);
        res.status(401).json({ error: 'Invalid or expired refresh token.' });
        return;
      }

      let decoded: { userId: number };
      try {
        decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as { userId: number };
      } catch {
        refreshTokenStore.delete(token);
        res.status(401).json({ error: 'Invalid refresh token.' });
        return;
      }

      const user = await queryOne<{ id: number; name: string; email: string; role_name: string; organization_id: number }>(
        `SELECT u.id, u.name, u.email, r.role_name, u.organization_id
         FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?`,
        [decoded.userId]
      );

      if (!user) {
        res.status(401).json({ error: 'User not found.' });
        return;
      }

      // Rotate: delete old refresh token, issue new pair
      refreshTokenStore.delete(token);
      const { accessToken, refreshToken: newRefreshToken } = issueTokens(user);
      setRefreshCookie(res, newRefreshToken);

      res.json({
        data:    { accessToken },
        message: 'Token refreshed.',
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────────────────────
// GET /api/auth/me
// ─────────────────────────────────────────────────────────────
router.get(
  '/me',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await getUserById(req.user!.userId);

      if (!user) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }

      // SECURITY: hashed_password field is never returned — getUserById omits it
      res.json({ data: user, message: 'Success.' });
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────────────────────
// POST /api/auth/logout
// Clears the refresh token cookie and removes it from the store
// ─────────────────────────────────────────────────────────────
router.post(
  '/logout',
  async (req: Request, res: Response): Promise<void> => {
    const token = req.cookies?.refreshToken as string | undefined;
    if (token) refreshTokenStore.delete(token);

    res.clearCookie('refreshToken', { path: '/api/auth' });
    res.json({ data: null, message: 'Logged out.' });
  }
);

export default router;
