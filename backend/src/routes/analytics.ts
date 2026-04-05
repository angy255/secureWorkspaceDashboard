import { Router, Request, Response, NextFunction } from 'express';
import {
  userGrowthByMonth,
  roleDistribution,
  loginActivityLast30Days,
  auditFrequency,
  topActiveUsers,
} from '../db/queries/analyticsQueries';
import { authMiddleware }    from '../middleware/authMiddleware';
import { requirePermission } from '../middleware/roleMiddleware';

const router = Router();

// All analytics endpoints require authentication + view_analytics permission
router.use(authMiddleware);
router.use(requirePermission('view_analytics'));

// GET /api/analytics/user-growth
router.get(
  '/user-growth',
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await userGrowthByMonth();
      res.json({ data, message: 'Success.' });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/analytics/role-distribution
router.get(
  '/role-distribution',
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await roleDistribution();
      res.json({ data, message: 'Success.' });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/analytics/login-activity
router.get(
  '/login-activity',
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await loginActivityLast30Days();
      res.json({ data, message: 'Success.' });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/analytics/audit-frequency
router.get(
  '/audit-frequency',
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await auditFrequency();
      res.json({ data, message: 'Success.' });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/analytics/top-users
router.get(
  '/top-users',
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await topActiveUsers();
      res.json({ data, message: 'Success.' });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
