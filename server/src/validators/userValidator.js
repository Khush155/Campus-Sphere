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
  rollNumber: z
    .string()
    .trim()
    .max(30, 'Roll Number cannot exceed 30 characters')
    .optional()
    .or(z.literal(''))
    .or(z.null())
    .optional(),
  reason: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .or(z.null()),
  shift: z.enum(['GENERAL', 'MORNING', 'EVENING']).optional().or(z.literal('')).or(z.null()).optional(),
  feeStatus: z.enum(['CLEARED', 'PENDING', 'OVERDUE']).optional(),
  feeDues: z.object({
    tuition: z.number().min(0).optional(),
    hostel: z.number().min(0).optional(),
    library: z.number().min(0).optional(),
    lab: z.number().min(0).optional(),
  }).optional(),
}).superRefine((data, ctx) => {
  if (data.role === 'HOD') {
    if (!data.shift || !['GENERAL', 'MORNING', 'EVENING'].includes(data.shift)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Shift is required for HOD role and must be GENERAL, MORNING, or EVENING',
        path: ['shift'],
      });
    }
  }
});

const getDepartmentFeesQuerySchema = z.object({
  status: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) {
        return ['PENDING', 'OVERDUE']; // Default if none provided
      }
      return val.split(',').map((s) => s.trim().toUpperCase());
    })
    .refine(
      (statuses) => statuses.every((s) => ['CLEARED', 'PENDING', 'OVERDUE'].includes(s)),
      { message: 'Invalid status. Allowed values are CLEARED, PENDING, OVERDUE' }
    ),
});

module.exports = {
  updateUserSchema,
  getDepartmentFeesQuerySchema,
};
