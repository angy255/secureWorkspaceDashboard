import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import {
  getAllUsers, countUsers, getUserById,
  createUser, updateUser, deleteUser, userExists,
} from '../db/queries/userQueries';
import { createAuditLog } from '../db/queries/auditQueries';
import { authMiddleware }    from '../middleware/authMiddleware';
import { requirePermission } from '../middleware/roleMiddleware';
import { validate }          from '../middleware/validateRequest';

const router = Router();
router.use(authMiddleware);

// ─────────────────────────────────────────────────────────────
// Zod schemas
// ─────────────────────────────────────────────────────────────
const createUserSchema = z.object({
  name:            z.string().min(1, 'Name is required').max(255),
  email:           z.string().email('Invalid email'),
  password:        z.string().min(8, 'Password must be at least 8 characters'),
  role_id:         z.number({ required_error: 'role_id is required' }).int().positive(),
  organization_id: z.number().int().positive().default(1),
}).strict();

const updateUserSchema = z.object({
  name:    z.string().min(1).max(255).optional(),
  email:   z.string().email().optional(),
  role_id: z.number().int().positive().optional(),
}).strict().refine(
  data => Object.keys(data).length > 0,
  { message: 'At least one field must be provided.' }
);

const listQuerySchema = z.object({
  search: z.string().optional(),
  role:   z.enum(['admin', 'manager', 'member', 'viewer']).optional(),
  page:   z.string().regex(/^\d+$/).optional(),
  limit:  z.string().regex(/^\d+$/).optional(),
}).strict();

// ─────────────────────────────────────────────────────────────
// GET /api/users  — list with optional ?search= and ?role= filters
// ─────────────────────────────────────────────────────────────
router.get(
  '/',
  requirePermission('view_users'),
  validate(listQuerySchema, 'query'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { search, role, page = '1', limit = '20' } = req.query as Record<string, string>;
      const pageNum  = Math.max(1, parseInt(page));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
      const offset   = (pageNum - 1) * limitNum;

      const [users, total] = await Promise.all([
        getAllUsers({ search, role, limit: limitNum, offset }),
        countUsers({ search, role }),
      ]);

      res.json({
        data:    { users, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
        message: 'Success.',
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────────────────────
// POST /api/users
// ─────────────────────────────────────────────────────────────
router.post(
  '/',
  requirePermission('create_users'),
  validate(createUserSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, email, password, role_id, organization_id } = req.body as z.infer<typeof createUserSchema>;

      // Check duplicate email
      const { getUserByEmail } = await import('../db/queries/userQueries');
      const existing = await getUserByEmail(email);
      if (existing) {
        res.status(409).json({ error: 'An account with that email already exists.' });
        return;
      }

      // SECURITY: bcrypt with 12 rounds
      const hashed_password = await bcrypt.hash(password, 12);
      const newId = await createUser({ name, email, hashed_password, role_id, organization_id });

      // Audit trail
      await createAuditLog({
        user_id:     req.user!.userId,
        action:      'CREATE_USER',
        entity_type: 'user',
        entity_id:   newId,
      });

      const user = await getUserById(newId);
      res.status(201).json({ data: user, message: 'User created successfully.' });
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────────────────────
// PUT /api/users/:id
// ─────────────────────────────────────────────────────────────
router.put(
  '/:id',
  requirePermission('edit_users'),
  validate(updateUserSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) { res.status(400).json({ error: 'Invalid user ID.' }); return; }

      const exists = await userExists(id);
      if (!exists) { res.status(404).json({ error: 'User not found.' }); return; }

      await updateUser(id, req.body as z.infer<typeof updateUserSchema>);

      await createAuditLog({
        user_id:     req.user!.userId,
        action:      'UPDATE_USER',
        entity_type: 'user',
        entity_id:   id,
      });

      const updated = await getUserById(id);
      res.json({ data: updated, message: 'User updated successfully.' });
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────────────────────
// DELETE /api/users/:id
// ─────────────────────────────────────────────────────────────
router.delete(
  '/:id',
  requirePermission('delete_users'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) { res.status(400).json({ error: 'Invalid user ID.' }); return; }

      const exists = await userExists(id);
      if (!exists) { res.status(404).json({ error: 'User not found.' }); return; }

      // Prevent self-deletion
      if (id === req.user!.userId) {
        res.status(400).json({ error: 'You cannot delete your own account.' });
        return;
      }

      // Audit before delete (FK cascade would remove the log otherwise)
      await createAuditLog({
        user_id:     req.user!.userId,
        action:      'DELETE_USER',
        entity_type: 'user',
        entity_id:   id,
      });

      await deleteUser(id);
      res.json({ data: null, message: 'User deleted successfully.' });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
