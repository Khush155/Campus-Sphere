const { z } = require('zod');

const createRequestSchema = z.object({
  facultyId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid faculty ID format'),
  subjectId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid subject ID format'),
  reason: z.string().min(1, 'Reason is required').max(500, 'Reason too long'),
});

const respondRequestSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  responseNotes: z.string().max(500, 'Notes too long').optional(),
});

const finalizeRequestSchema = z.object({
  pin: z.string().length(6, 'PIN must be exactly 6 characters'),
});

module.exports = {
  createRequestSchema,
  respondRequestSchema,
  finalizeRequestSchema,
};
