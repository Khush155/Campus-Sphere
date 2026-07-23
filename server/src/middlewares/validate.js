const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');

/**
 * Express middleware to validate request bodies against Zod schemas.
 * 
 * @param {z.ZodSchema} schema - The Zod schema to validate against.
 */
const validate = (schema) => async (req, res, next) => {
  try {
    // parseAsync verifies req.body against the Zod schema
    // If validation fails, it throws a ZodError
    const parsedBody = await schema.parseAsync(req.body);
    
    // Replace req.body with the parsed body (which has sanitization like .trim() applied)
    req.body = parsedBody;
    
    next(); // Pass control to the next middleware/controller
  } catch (error) {
    // If it's a Zod validation error, extract messages and format them nicely
    if (error.name === 'ZodError') {
      const messages = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`).join(', ');
      
      // Wrap the error in our custom AppError with VALIDATION_ERROR code
      return next(new AppError(messages, 400, ERROR_CODES.VALIDATION_ERROR));
    }
    
    // For other unexpected errors
    next(error);
  }
};

module.exports = validate;
