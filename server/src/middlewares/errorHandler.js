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

  // Log unexpected errors
  if (!err.isOperational) {
    logger.error(`[Unexpected Error] ${err.stack || err}`);
  } else {
    logger.warn(`[Operational Error] ${message} - StatusCode: ${statusCode} - Code: ${errorCode}`);
  }

  // Handle Zod Validation Errors
  if (err.name === 'ZodError' || err.issues) {
    statusCode = 400;
    errorCode = ERROR_CODES.VALIDATION_ERROR;
    message = 'Validation failed';
    // Format Zod issues into a key-value/list object
    data = {
      fields: err.issues ? err.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })) : [],
    };
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
  }

  // Handle Mongoose Cast Error (e.g. invalid ObjectId format)
  else if (err.name === 'CastError') {
    statusCode = 400;
    errorCode = ERROR_CODES.VALIDATION_ERROR;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Handle JWT errors
  else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorCode = ERROR_CODES.TOKEN_EXPIRED;
    message = 'Token has expired, please log in again';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorCode = ERROR_CODES.INVALID_TOKEN;
    message = 'Invalid authentication token';
  }

  // Include stack trace in development/test for unexpected errors
  if (env.NODE_ENV !== 'production' && !err.isOperational && statusCode === 500) {
    data = {
      ...data,
      stack: err.stack,
    };
  }

  return errorResponse(res, statusCode, message, errorCode, data);
};

module.exports = errorHandler;
