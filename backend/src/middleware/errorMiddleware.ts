import { Request, Response, NextFunction } from 'express';

/**
 * errorMiddleware
 *
 * Global Express error handler — must be the LAST middleware registered.
 * Catches any error passed to next(err) from route handlers.
 *
 * SECURITY: Stack traces are only included in development mode.
 * Production responses never expose internal implementation details,
 * file paths, or SQL error messages that could aid an attacker.
 */
export function errorMiddleware(
  err: Error & { status?: number; statusCode?: number },
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const isDev        = process.env.NODE_ENV !== 'production';
  const statusCode   = err.status ?? err.statusCode ?? 500;
  const message      = statusCode < 500 ? err.message : 'Internal server error';

  // Always log the full error server-side
  console.error('[error]', err);

  res.status(statusCode).json({
    error: message,
    // SECURITY: Never leak stack traces in production
    ...(isDev && { stack: err.stack, detail: err.message }),
  });
}
