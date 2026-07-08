const { z } = require('zod');
const ROLES = require('../constants/roles');

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

// Allowed student roles for bulk CSV import
const IMPORTABLE_ROLES = ['STUDENT', 'FACULTY', 'HOD', 'COLLEGE_ADMIN'];

const updateUserSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters long')
    .max(50, 'Name cannot exceed 50 characters')
    .trim()
    .optional(),
  role: z.nativeEnum(ROLES, {
    errorMap: () => ({ message: 'Invalid role. Must be one of the registered system roles.' }),
  }).optional(),
  departmentId: z
    .string()
    .regex(objectIdRegex, 'Invalid department ID format')
    .optional()
    .or(z.literal(''))
    .or(z.null())
    .optional(),
  status: z.enum(['ACTIVE', 'INACTIVE'], {
    errorMap: () => ({ message: 'Invalid status. Must be ACTIVE or INACTIVE.' }),
  }).optional(),
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
  reason: z
    .string()
    .min(3, 'A reasoning of at least 3 characters is required for updating student branches or semesters')
    .optional(),
});

/**
 * Schema for validating a single row from a bulk CSV student import.
 * Uses department/course/branch codes (not ObjectIds) which are resolved
 * to actual IDs in the service layer.
 */
const studentImportRowSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name cannot exceed 50 characters')
    .trim(),
  email: z
    .string()
    .email('Invalid email format')
    .toLowerCase(),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters'),
  role: z.enum(IMPORTABLE_ROLES, {
    errorMap: () => ({ message: `Role must be one of: ${IMPORTABLE_ROLES.join(', ')}` }),
  }),
  departmentCode: z
    .string()
    .min(1, 'Department code is required')
    .max(10)
    .toUpperCase()
    .trim()
    .optional()
    .or(z.literal('')),
  courseCode: z
    .string()
    .min(1, 'Course code is required')
    .max(15)
    .toUpperCase()
    .trim()
    .optional()
    .or(z.literal('')),
  branchCode: z
    .string()
    .min(1, 'Branch code is required')
    .max(15)
    .toUpperCase()
    .trim()
    .optional()
    .or(z.literal('')),
  semester: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .refine((val) => val === undefined || (!isNaN(val) && val >= 1 && val <= 12), {
      message: 'Semester must be a number between 1 and 12',
    }),
});

module.exports = {
  updateUserSchema,
  studentImportRowSchema,
};
