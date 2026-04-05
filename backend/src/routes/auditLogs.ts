import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { getAuditLogs, countAuditLogs, getDistinctActions } from '../db/queries/auditQueries';
import { authMiddleware }    from '../middleware/authMiddleware';
import { requirePermission } from '../middleware/roleMiddleware';
import { validate }          from '../middleware/validateRequest';

const router = Router();
router.use(authMiddleware);

const filterSchema = z.object({
  action: z.string().optional(),
  from:   z.string().optional(),   // ISO date string  e.g. "2024-01-01"
  to:     z.string().optional(),   // ISO date string  e.g. "2024-12-31"
  page:   z.string().regex(/^\d+$/).optional(),
  limit:  z.string().regex(/^\d+$/).optional(),
}).strict();

// ─────────────────────────────────────────────────────────────
// GET /api/audit-logs
// Supports ?action=  ?from=  ?to=  ?page=  ?limit= filters
// ─────────────────────────────────────────────────────────────
router.get(
  '/',
  requirePermission('view_audit_logs'),
  validate(filterSchema, 'query'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { action, from, to, page = '1', limit = '20' } = req.query as Record<string, string>;
      const pageNum  = Math.max(1, parseInt(page));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
      const offset   = (pageNum - 1) * limitNum;

      const filterParams = { action, from, to };

      const [logs, total] = await Promise.all([
        getAuditLogs({ ...filterParams, limit: limitNum, offset }),
        countAuditLogs(filterParams),
      ]);

      res.json({
        data:    { logs, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
        message: 'Success.',
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────────────────────
// GET /api/audit-logs/actions — distinct action names for filter dropdown
// ─────────────────────────────────────────────────────────────
router.get(
  '/actions',
  requirePermission('view_audit_logs'),
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const actions = await getDistinctActions();
      res.json({ data: actions, message: 'Success.' });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
