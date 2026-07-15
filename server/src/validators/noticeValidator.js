const { z } = require('zod');
const ROLES = require('../constants/roles');

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const noticeSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .min(1, 'Title cannot be empty')
    .max(150, 'Title cannot exceed 150 characters')
    .trim(),
  content: z
    .string({ required_error: 'Content is required' })
    .min(1, 'Content cannot be empty')
    .max(5000, 'Content cannot exceed 5000 characters')
    .trim(),
  priority: z.enum(['NORMAL', 'IMPORTANT', 'URGENT']).optional().default('NORMAL'),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional().default('DRAFT'),
  targetRoles: z
    .array(z.nativeEnum(ROLES))
    .optional()
    .default([]),
  targetDepartments: z
    .array(z.string().regex(objectIdRegex, 'Invalid department ID format'))
    .optional()
    .default([]),
  targetSemesters: z
    .array(z.number().min(1).max(12))
    .optional()
    .default([]),
  expiresAt: z
    .string()
    .datetime({ message: 'Invalid ISO date string format for expiry' })
    .nullable()
    .optional()
    .or(z.date())
    .or(z.literal(''))
    .or(z.null()),
});

module.exports = {
  noticeSchema,
};
