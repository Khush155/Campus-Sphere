/**
 * Standard API response helper.
 * Enforces uniform success and error structures across the backend.
 */

/**
 * Sends a successful API response
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {String} message - Human-readable success message
 * @param {Object|Array} [data={}] - Response payload data
 * @param {Object} [meta={}] - Pagination or metadata information
 */
const successResponse = (res, statusCode = 200, message = 'Success', data = {}, meta = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    meta,
  });
};

/**
 * Sends an error API response
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {String} message - Human-readable error message
 * @param {String} [errorCode='INTERNAL_ERROR'] - Programmatic error code
 * @param {Object|Array|null} [data=null] - Additional error details (e.g., validation fields)
 */
const errorResponse = (res, statusCode = 500, message = 'Internal Server Error', errorCode = 'INTERNAL_ERROR', data = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errorCode,
    data,
    meta: {},
  });
};

module.exports = {
  successResponse,
  errorResponse,
};
