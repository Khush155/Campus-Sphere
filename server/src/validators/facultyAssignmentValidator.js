const { z } = require('zod');

// We use z.string().regex(/^[0-9a-fA-F]{24}$/) for MongoDB ObjectIds
const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

const createAssignmentSchema = z.object({
  facultyId: objectIdSchema,
  subjectId: objectIdSchema,
  branchId: objectIdSchema,
  academicYear: z
    .string()
    .min(7, 'Academic year must be at least 7 characters (e.g. 2025-26)')
    .max(9, 'Academic year too long'),
  semester: z
    .number()
    .int()
    .min(1, 'Semester must be at least 1')
    .max(12, 'Semester cannot exceed 12'),
});

const revokeAssignmentSchema = z.object({
  id: objectIdSchema,
});

module.exports = {
  createAssignmentSchema,
  revokeAssignmentSchema,
};
