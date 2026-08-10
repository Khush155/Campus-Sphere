const env = require('../config/env');
const logger = require('../utils/logger');
const { errorResponse } = require('../utils/apiResponse');
const ERROR_CODES = require('../constants/errorCodes');

/**
 * Express global error handling middleware.
 */
const errorHandler = (err, req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let errorCode = err.errorCode || ERROR_CODES.INTERNAL_ERROR;
  let message = err.message || 'Internal Server Error';
  let data = null;
  let isValidationOrKnown = false;

  // Handle Zod Validation Errors
  if (err.name === 'ZodError' || err.issues) {
    statusCode = 400;
    errorCode = ERROR_CODES.VALIDATION_ERROR;
    const firstIssue = err.issues?.[0];
    message = firstIssue ? firstIssue.message : 'Validation failed';
    data = {
      fields: err.issues ? err.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })) : [],
    };
    isValidationOrKnown = true;
  }
  // Handle Mongoose / MongoDB Duplicate Key Error (Code 11000)
  else if (err.code === 11000) {
    statusCode = 400;
    errorCode = ERROR_CODES.DUPLICATE_ENTRY;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Duplicate value entered for ${field}`;
    data = {
      keyValue: err.keyValue,
    };
    isValidationOrKnown = true;
  }
  // Handle Mongoose Validation Error
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = ERROR_CODES.VALIDATION_ERROR;
    message = 'Validation failed';
    data = {
      fields: Object.values(err.errors).map((error) => ({
        path: error.path,
        message: error.message,
      })),
    };
    isValidationOrKnown = true;
  }
  // Handle Mongoose Cast Error (e.g. invalid ObjectId format)
  else if (err.name === 'CastError') {
    statusCode = 400;
    errorCode = ERROR_CODES.VALIDATION_ERROR;
    message = `Invalid ${err.path}: ${err.value}`;
    isValidationOrKnown = true;
  }
  // Handle JWT errors
  else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorCode = ERROR_CODES.TOKEN_EXPIRED;
    message = 'Token has expired, please log in again';
    isValidationOrKnown = true;
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorCode = ERROR_CODES.INVALID_TOKEN;
    message = 'Invalid authentication token';
    isValidationOrKnown = true;
  }

  // Log error based on severity
  if (isValidationOrKnown || err.isOperational) {
    logger.warn(`[Operational Error] ${message} - StatusCode: ${statusCode} - Code: ${errorCode}`);
  } else {
    logger.error(`[Unexpected Error] ${err.stack || err}`);
  }

  // Include stack trace in development/test for unexpected errors
  if (env.NODE_ENV !== 'production' && !err.isOperational && !isValidationOrKnown && statusCode === 500) {
    data = {
      ...data,
      stack: err.stack,
    };
  }

  return errorResponse(res, statusCode, message, errorCode, data);
};

module.exports = errorHandler;
