const { z } = require('zod');
const ROLES = require('../constants/roles');

// Custom regex to validate MongoDB ObjectId format (24 hex characters)
const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .min(1, 'Email cannot be empty')
    .email('Invalid email address format')
    .trim()
    .toLowerCase(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters long'),
});

const registerSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .min(2, 'Name must be at least 2 characters long')
    .max(50, 'Name cannot exceed 50 characters')
    .trim(),
  email: z
    .string({ required_error: 'Email is required' })
    .min(1, 'Email cannot be empty')
    .email('Invalid email address format')
    .trim()
    .toLowerCase(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters long'),
  role: z.nativeEnum(ROLES, {
    errorMap: () => ({ message: 'Invalid role. Must be one of the registered system roles.' }),
  }),
  departmentId: z
    .string()
    .regex(objectIdRegex, 'Invalid department ID format')
    .optional()
    .or(z.literal('')) // Allow empty string
    .or(z.null()) // Allow null
    .optional(),
  courseId: z
    .string()
    .regex(objectIdRegex, 'Invalid course ID format')
    .optional()
    .or(z.literal(''))
    .or(z.null())
    .optional(),
  branchId: z
    .string()
    .regex(objectIdRegex, 'Invalid branch ID format')
    .optional()
    .or(z.literal(''))
    .or(z.null())
    .optional(),
  semester: z
    .number()
    .min(1, 'Semester must be at least 1')
    .optional()
    .or(z.null())
    .optional(),
});

const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .min(1, 'Email cannot be empty')
    .email('Invalid email address format')
    .trim()
    .toLowerCase(),
});

const resetPasswordSchema = z.object({
  password: z
    .string({ required_error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters long'),
});

module.exports = {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
