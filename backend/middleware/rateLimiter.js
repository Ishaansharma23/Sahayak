const rateLimit = require('express-rate-limit');

/**
 * General API rate limiter
 */
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise use IP
    return req.user?.id || req.ip;
  },
});

/**
 * Strict limiter for auth routes
 */
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 attempts per hour
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after an hour.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
});

/**
 * Limiter for password reset
 */
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  message: {
    success: false,
    message: 'Too many password reset attempts. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Limiter for emergency requests
 */
const emergencyLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 emergency requests per minute
  message: {
    success: false,
    message: 'Too many emergency requests. Please wait before trying again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Limiter for SOS alerts
 */
const sosLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // 3 SOS alerts per minute (prevent accidental spam)
  message: {
    success: false,
    message: 'SOS alert already active. Check your existing alert.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Heavy operation limiter (exports, reports)
 */
const heavyOperationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: {
    success: false,
    message: 'Too many requests for this operation. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  apiLimiter,
  authLimiter,
  passwordResetLimiter,
  emergencyLimiter,
  sosLimiter,
  heavyOperationLimiter,
};
