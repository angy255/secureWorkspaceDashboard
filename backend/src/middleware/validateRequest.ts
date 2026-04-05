import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

type RequestSource = 'body' | 'query' | 'params';

/**
 * validate(schema, source?)
 *
 * Middleware factory that parses and validates request data with Zod.
 * Defaults to validating req.body.
 *
 * On success  — replaces req[source] with the Zod-parsed (stripped) value.
 * On failure  — returns 400 with structured field errors.
 *
 * SECURITY: Zod's .strict() (applied in each schema) strips unknown
 * keys, preventing mass-assignment of unintended fields.
 */
export function validate(schema: ZodSchema, source: RequestSource = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const err = result.error as ZodError;
      res.status(400).json({
        error: 'Validation failed',
        details: err.errors.map(e => ({
          field:   e.path.join('.') || source,
          message: e.message,
        })),
      });
      return;
    }

    // Replace with parsed data (unknown keys stripped by .strict())
    (req as Record<string, unknown>)[source] = result.data;
    next();
  };
}
