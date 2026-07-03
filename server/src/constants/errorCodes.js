/**
 * Standard error codes to allow the client/frontend to programmatically
 * distinguish error cases without depending on matching raw error messages.
 */
const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  DATABASE_ERROR: 'DATABASE_ERROR',
  LIMIT_EXCEEDED: 'LIMIT_EXCEEDED',
};

module.exports = ERROR_CODES;
