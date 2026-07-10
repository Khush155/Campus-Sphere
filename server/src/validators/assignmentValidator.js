const { z } = require('zod');

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const createAssignmentSchema = z.object({
  facultyId: z
    .string({ required_error: 'Faculty ID is required' })
    .regex(objectIdRegex, 'Invalid faculty ID format'),
  subjectId: z
    .string({ required_error: 'Subject ID is required' })
    .regex(objectIdRegex, 'Invalid subject ID format'),
});

const revokeAssignmentSchema = z.object({
  revokedReason: z
    .string({ required_error: 'Revoke reason is required' })
    .min(5, 'Revoke reason must be at least 5 characters')
    .max(500, 'Revoke reason cannot exceed 500 characters')
    .trim(),
});

module.exports = {
  createAssignmentSchema,
  revokeAssignmentSchema,
};
