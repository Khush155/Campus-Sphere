/**
 * Middleware wrapper to handle async Express controller functions.
 * Resolves promises and catches rejections, passing them to the next middleware (error handler).
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
