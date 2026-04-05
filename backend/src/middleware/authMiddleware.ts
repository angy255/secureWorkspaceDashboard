import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { JwtPayload } from '../types';

/**
 * authMiddleware
 *
 * Reads the Authorization header, verifies the Bearer JWT against
 * JWT_SECRET, and attaches the decoded payload to req.user.
 *
 * SECURITY: Returns 401 without revealing why validation failed —
 * prevents leaking information about token structure or expiry.
 */
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // SECURITY: Token transmitted in Authorization header, not URL params
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const token = authHeader.slice(7); // strip "Bearer "

  try {
    // SECURITY: No secrets in code — JWT_SECRET loaded from env
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET not configured');

    const decoded = jwt.verify(token, secret) as JwtPayload;

    req.user = {
      userId:         decoded.userId,
      role:           decoded.role,
      organizationId: decoded.organizationId,
    };

    next();
  } catch {
    // Generic 401 — never expose the underlying jwt.verify error
    res.status(401).json({ error: 'Unauthorized' });
  }
}
