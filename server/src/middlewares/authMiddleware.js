const jwt = require('jsonwebtoken');
const env = require('../config/env');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');
const logger = require('../utils/logger');

// Dynamically require User model to prevent circular dependency / model-not-defined issues in setup
let User;
try {
  User = require('../models/User');
} catch (e) {
  logger.warn('User model not loaded yet in authMiddleware');
}

/**
 * Middleware to authenticate requests using JWT access tokens.
 * Supports token extraction from Authorization Bearer header or cookies.
 */
const authMiddleware = async (req, res, next) => {
  try {
    let token = null;

    // 1. Check Authorization Header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // 2. Check HTTP-only cookie if headers didn't contain the token
    else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }
    // 3. Check query parameters (for direct window.open PDF downloads)
    else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return next(new AppError('Authentication required. Please log in.', 401, ERROR_CODES.UNAUTHORIZED));
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return next(new AppError('Your session has expired. Please log in again.', 401, ERROR_CODES.TOKEN_EXPIRED));
      }
      return next(new AppError('Invalid authentication token.', 401, ERROR_CODES.INVALID_TOKEN));
    }

    // Attach decoded user info (id, role, etc.) to request
    req.user = decoded;

    // Check if user still exists in database (if User model is available)
    if (User && typeof User.findById === 'function') {
      const currentUser = await User.findById(decoded.id).select('-password');
      if (!currentUser) {
        return next(new AppError('The user belonging to this token no longer exists.', 401, ERROR_CODES.USER_NOT_FOUND));
      }

      // Check if user is active (if status field exists)
      if (currentUser.status && currentUser.status === 'INACTIVE') {
        return next(new AppError('Your account has been deactivated.', 403, ERROR_CODES.FORBIDDEN));
      }

      // Overwrite req.user with actual DB user document details for downstream usage
      req.user = {
        id: currentUser._id,
        email: currentUser.email,
        role: currentUser.role,
        departmentId: currentUser.departmentId,
        semester: currentUser.semester,
      };
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authMiddleware;
