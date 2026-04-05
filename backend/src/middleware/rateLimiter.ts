import rateLimit from 'express-rate-limit';

/**
 * generalLimiter
 * Applied globally: 100 requests per 15-minute window.
 * Protects against resource exhaustion / DoS.
 *
 * SECURITY: Rate limiting reduces the blast radius of credential
 * stuffing attacks and abusive scraping.
 */
export const generalLimiter = rateLimit({
  windowMs:       15 * 60 * 1000, // 15 minutes
  max:            100,
  standardHeaders: true,          // Return RateLimit-* headers (RFC 6585)
  legacyHeaders:   false,
  message: { error: 'Too many requests — please try again later.' },
});

/**
 * strictLimiter
 * Applied to auth routes (login / register / refresh):
 * 10 requests per 15-minute window.
 *
 * SECURITY: A tight limit on authentication endpoints prevents
 * brute-force password attacks and credential stuffing.
 */
export const strictLimiter = rateLimit({
  windowMs:       15 * 60 * 1000,
  max:            10,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many authentication attempts — please try again later.' },
  skipSuccessfulRequests: false, // Count ALL attempts, not just failures
});
