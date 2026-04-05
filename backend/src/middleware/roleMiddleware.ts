import { Request, Response, NextFunction } from 'express';
import { query } from '../db';

/**
 * requirePermission(permissionName)
 *
 * Returns an Express middleware that:
 *   1. Reads req.user (set by authMiddleware).
 *   2. Queries the DB for all permissions belonging to the user's role.
 *   3. Returns 403 if the requested permission is missing.
 *
 * Because permissions are fetched from the DB on every request, any
 * role-permission change takes effect immediately without restarting
 * the server or invalidating existing JWTs.
 *
 * Usage:
 *   router.get('/users', authMiddleware, requirePermission('view_users'), handler)
 */
export function requirePermission(permissionName: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    try {
      // SECURITY: Parameterized query — role name comes from the JWT,
      // but we still use a placeholder to prevent any injection path.
      const rows = await query<{ permission_name: string }>(
        `SELECT p.permission_name
         FROM role_permissions rp
         JOIN permissions p ON rp.permission_id = p.id
         JOIN roles r       ON rp.role_id       = r.id
         WHERE r.role_name = ?`,
        [req.user.role]
      );

      const granted = rows.some(r => r.permission_name === permissionName);

      if (!granted) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
