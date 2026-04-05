import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { authMiddleware } from '../middleware/authMiddleware';
import { validate } from '../middleware/validateRequest';
import { queryOne, execute } from '../db';
import { sendPasswordChangedEmail } from '../services/mailer';
import type { User, UserWithPassword } from '../types';

const router = Router();

// All profile routes require a valid JWT
router.use(authMiddleware);

// ─────────────────────────────────────────────────────────────
// GET /api/me — return the calling user's public profile
// ─────────────────────────────────────────────────────────────
router.get('/', async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;

  const user = await queryOne<User>(
    `SELECT u.id, u.name, u.email, r.role_name, u.organization_id, u.created_at
     FROM users u
     JOIN roles r ON u.role_id = r.id
     WHERE u.id = ?`,
    [userId]
  );

  if (!user) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  res.json({ data: user });
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/me — update email
// ─────────────────────────────────────────────────────────────
const updateProfileSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
}).strict();

router.patch(
  '/',
  validate(updateProfileSchema),
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const { email } = req.body as { email: string };

    // Check the new email is not already taken by another user
    const existing = await queryOne<{ id: number }>(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [email, userId]
    );
    if (existing) {
      res.status(409).json({ error: 'Email is already in use.' });
      return;
    }

    await execute('UPDATE users SET email = ? WHERE id = ?', [email, userId]);

    res.json({ message: 'Profile updated.' });
  }
);

// ─────────────────────────────────────────────────────────────
// PATCH /api/me/password — change password
// ─────────────────────────────────────────────────────────────
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required.'),
  newPassword:     z.string().min(8, 'New password must be at least 8 characters.'),
}).strict();

router.patch(
  '/password',
  validate(changePasswordSchema),
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const { currentPassword, newPassword } = req.body as {
      currentPassword: string;
      newPassword:     string;
    };

    const userRow = await queryOne<UserWithPassword>(
      `SELECT u.id, u.name, u.email, u.hashed_password, u.role_id,
              u.organization_id, u.created_at, r.role_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [userId]
    );

    if (!userRow) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const passwordMatches = await bcrypt.compare(currentPassword, userRow.hashed_password);
    if (!passwordMatches) {
      res.status(400).json({ error: 'Current password is incorrect.' });
      return;
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await execute('UPDATE users SET hashed_password = ? WHERE id = ?', [hashed, userId]);

    // Fire-and-forget security alert email
    sendPasswordChangedEmail(userRow.email, userRow.name);

    res.json({ message: 'Password changed successfully.' });
  }
);

export default router;
