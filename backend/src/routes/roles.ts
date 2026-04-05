import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  getAllRolesWithPermissions,
  getAllPermissions,
  createRole,
  updateRoleDescription,
  setRolePermissions,
  getRoleById,
} from '../db/queries/roleQueries';
import { authMiddleware }    from '../middleware/authMiddleware';
import { requirePermission } from '../middleware/roleMiddleware';
import { validate }          from '../middleware/validateRequest';

const router = Router();
router.use(authMiddleware);

const createRoleSchema = z.object({
  role_name:   z.enum(['admin', 'manager', 'member', 'viewer']),
  description: z.string().max(500).optional(),
}).strict();

const updateRoleSchema = z.object({
  description: z.string().max(500).optional(),
  permissions: z.array(z.number().int().positive()).optional(),
}).strict();

// ─────────────────────────────────────────────────────────────
// GET /api/roles — list all roles with their permissions
// Auth required; no special permission needed (all authenticated users can view roles)
// ─────────────────────────────────────────────────────────────
router.get(
  '/',
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roles = await getAllRolesWithPermissions();
      res.json({ data: roles, message: 'Success.' });
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────────────────────
// GET /api/roles/permissions — list all available permissions
// ─────────────────────────────────────────────────────────────
router.get(
  '/permissions',
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const permissions = await getAllPermissions();
      res.json({ data: permissions, message: 'Success.' });
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────────────────────
// POST /api/roles — create a new role
// ─────────────────────────────────────────────────────────────
router.post(
  '/',
  requirePermission('assign_roles'),
  validate(createRoleSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { role_name, description } = req.body as z.infer<typeof createRoleSchema>;
      const id = await createRole(role_name, description);
      const role = await getRoleById(id);
      res.status(201).json({ data: { ...role, permissions: [] }, message: 'Role created.' });
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────────────────────
// PUT /api/roles/:id — update description and/or permissions
// ─────────────────────────────────────────────────────────────
router.put(
  '/:id',
  requirePermission('assign_roles'),
  validate(updateRoleSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) { res.status(400).json({ error: 'Invalid role ID.' }); return; }

      const role = await getRoleById(id);
      if (!role) { res.status(404).json({ error: 'Role not found.' }); return; }

      const { description, permissions } = req.body as z.infer<typeof updateRoleSchema>;

      if (description !== undefined) {
        await updateRoleDescription(id, description);
      }
      if (permissions !== undefined) {
        await setRolePermissions(id, permissions);
      }

      res.json({ data: null, message: 'Role updated.' });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
