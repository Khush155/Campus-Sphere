const { z } = require('zod');
const ROLES = require('../constants/roles');

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

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
  group: z
    .string()
    .max(20, 'Group cannot exceed 20 characters')
    .trim()
    .optional()
    .or(z.null())
    .optional(),
  reason: z
    .string()
    .min(3, 'A reasoning of at least 3 characters is required for updating student branches or semesters')
    .optional(),
});

module.exports = {
  updateUserSchema,
};
