import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { generalLimiter }  from './middleware/rateLimiter';
import { errorMiddleware } from './middleware/errorMiddleware';

import authRoutes      from './routes/auth';
import usersRoutes     from './routes/users';
import rolesRoutes     from './routes/roles';
import auditLogsRoutes from './routes/auditLogs';
import analyticsRoutes from './routes/analytics';
import profileRoutes   from './routes/profile';

const app = express();

// ─────────────────────────────────────────────────────────────
// Security Middleware
// ─────────────────────────────────────────────────────────────

// SECURITY: helmet sets ~15 security-related HTTP headers including
// X-Content-Type-Options, X-Frame-Options, HSTS, and Content-Security-Policy
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc:  ["'self'"],
        scriptSrc:   ["'self'"],
        styleSrc:    ["'self'", "'unsafe-inline'"],
        imgSrc:      ["'self'", 'data:', 'https:'],
        connectSrc:  ["'self'"],
        fontSrc:     ["'self'"],
        objectSrc:   ["'none'"],
        frameSrc:    ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false, // allow embedding when needed
  })
);

// SECURITY: CORS restricted to the FRONTEND_URL env var — no wildcard.
// Credentials (cookies) are allowed only for the trusted origin.
if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_URL) {
  throw new Error('FRONTEND_URL environment variable is required in production');
}
const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(
  cors({
    origin(origin, callback) {
      // Allow same-origin requests (e.g. curl / Postman in dev)
      if (!origin || origin === allowedOrigin) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials:     true,
    methods:         ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders:  ['Content-Type', 'Authorization'],
    exposedHeaders:  ['RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],
  })
);

// ─────────────────────────────────────────────────────────────
// Body / Cookie Parsers
// ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '50kb' }));      // Limit body size to reduce DoS risk
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// ─────────────────────────────────────────────────────────────
// Global Rate Limiter
// ─────────────────────────────────────────────────────────────
// SECURITY: General limiter applied before any route handler
app.use(generalLimiter);

// ─────────────────────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/users',      usersRoutes);
app.use('/api/roles',      rolesRoutes);
app.use('/api/audit-logs', auditLogsRoutes);
app.use('/api/analytics',  analyticsRoutes);
app.use('/api/me',         profileRoutes);

// Health check (no auth)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

// ─────────────────────────────────────────────────────────────
// Global Error Handler — must be last
// ─────────────────────────────────────────────────────────────
app.use(errorMiddleware);

// ─────────────────────────────────────────────────────────────
// Start
// ─────────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT) || 3001;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`   ENV: ${process.env.NODE_ENV ?? 'development'}`);
  console.log(`   CORS origin: ${allowedOrigin}`);
});

export default app;
