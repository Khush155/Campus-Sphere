/**
 * Custom application operational error class.
 * Captures stack trace, assigns HTTP status code, and appends a programmatically checkable errorCode.
 */
class AppError extends Error {
  constructor(message, statusCode, errorCode) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode || 'INTERNAL_ERROR';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
