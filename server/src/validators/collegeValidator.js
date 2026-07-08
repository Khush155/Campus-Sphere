const { z } = require('zod');

// Custom regex to validate MongoDB ObjectId format (24 hex characters)
const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const createDepartmentSchema = z.object({
  name: z
    .string({ required_error: 'Department name is required' })
    .min(2, 'Department name must be at least 2 characters long')
    .max(100, 'Department name cannot exceed 100 characters')
    .trim(),
  code: z
    .string({ required_error: 'Department code is required' })
    .min(2, 'Department code must be at least 2 characters long')
    .max(10, 'Department code cannot exceed 10 characters')
    .trim()
    .toUpperCase(),
  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters')
    .trim()
    .optional()
    .or(z.literal(''))
    .or(z.null()),
});

const updateDepartmentSchema = createDepartmentSchema.partial();

const createCourseSchema = z.object({
  name: z
    .string({ required_error: 'Course name is required' })
    .min(2, 'Course name must be at least 2 characters long')
    .max(100, 'Course name cannot exceed 100 characters')
    .trim(),
  code: z
    .string({ required_error: 'Course code is required' })
    .min(2, 'Course code must be at least 2 characters long')
    .max(15, 'Course code cannot exceed 15 characters')
    .trim()
    .toUpperCase(),
  durationYears: z.coerce
    .number({ required_error: 'Course duration is required' })
    .int('Duration must be a whole number')
    .min(1, 'Course duration must be at least 1 year')
    .max(6, 'Course duration cannot exceed 6 years'),
});

const updateCourseSchema = createCourseSchema.partial();

const createBranchSchema = z.object({
  name: z
    .string({ required_error: 'Branch name is required' })
    .min(2, 'Branch name must be at least 2 characters long')
    .max(100, 'Branch name cannot exceed 100 characters')
    .trim(),
  code: z
    .string({ required_error: 'Branch code is required' })
    .min(2, 'Branch code must be at least 2 characters long')
    .max(15, 'Branch code cannot exceed 15 characters')
    .trim()
    .toUpperCase(),
  courseId: z
    .string({ required_error: 'Course reference ID is required' })
    .regex(objectIdRegex, 'Invalid course ID format'),
});

const updateBranchSchema = createBranchSchema.partial();

const createSubjectSchema = z.object({
  name: z
    .string({ required_error: 'Subject name is required' })
    .min(2, 'Subject name must be at least 2 characters long')
    .max(100, 'Subject name cannot exceed 100 characters')
    .trim(),
  code: z
    .string({ required_error: 'Subject code is required' })
    .min(2, 'Subject code must be at least 2 characters long')
    .max(15, 'Subject code cannot exceed 15 characters')
    .trim()
    .toUpperCase(),
  credits: z.coerce
    .number({ required_error: 'Subject credits are required' })
    .int('Credits must be a whole number')
    .min(1, 'Credits must be at least 1')
    .max(6, 'Credits cannot exceed 6'),
  type: z.enum(['THEORY', 'PRACTICAL', 'SESSIONAL'], {
    errorMap: () => ({ message: 'Type must be THEORY, PRACTICAL, or SESSIONAL' }),
  }),
  branchId: z
    .string({ required_error: 'Branch reference ID is required' })
    .regex(objectIdRegex, 'Invalid branch ID format'),
  departmentId: z
    .string({ required_error: 'Department reference ID is required' })
    .regex(objectIdRegex, 'Invalid department ID format'),
  semester: z.coerce
    .number({ required_error: 'Semester is required' })
    .int('Semester must be a whole number')
    .min(1, 'Semester must be at least 1')
    .max(12, 'Semester cannot exceed 12'),
  facultyId: z
    .string()
    .regex(objectIdRegex, 'Invalid faculty ID format')
    .optional()
    .or(z.literal(''))
    .or(z.null()),
});

const updateSubjectSchema = createSubjectSchema.partial();

module.exports = {
  createDepartmentSchema,
  updateDepartmentSchema,
  createCourseSchema,
  updateCourseSchema,
  createBranchSchema,
  updateBranchSchema,
  createSubjectSchema,
  updateSubjectSchema,
};
