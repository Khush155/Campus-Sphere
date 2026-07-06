const rateLimit = require('express-rate-limit');
const ERROR_CODES = require('../constants/errorCodes');

/**
 * Custom rate limit handler to return standardized error format.
 */
const limitHandler = (req, res, next, options) => {
  res.status(options.statusCode).json({
    success: false,
    message: options.message,
    errorCode: ERROR_CODES.LIMIT_EXCEEDED,
    data: null,
    meta: {},
  });
};

/**
 * Global API rate limiter - protects all routes from abuse.
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 10000 : 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  statusCode: 429,
  handler: limitHandler,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/**
 * Strict rate limiter for authentication routes (login, forgot password, etc.).
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 10000 : 5, // Limit each IP to 5 requests per windowMs (e.g. login attempts)
  message: 'Too many authentication attempts. Please try again after 15 minutes',
  statusCode: 429,
  handler: limitHandler,
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  apiLimiter,
  authLimiter,
};
