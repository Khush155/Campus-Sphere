const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');

/**
 * Middleware to authorize requests based on user roles.
 * Must be used AFTER authMiddleware.
 *
 * @param {...String} allowedRoles - List of roles permitted to access the route.
 */
const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401, ERROR_CODES.UNAUTHORIZED));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403, ERROR_CODES.FORBIDDEN));
    }

    next();
  };
};

module.exports = roleMiddleware;
