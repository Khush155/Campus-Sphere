const { z } = require('zod');

const createFeedbackSchema = z.object({
  targetRole: z.enum(['FACULTY', 'STUDENT']),
  targetUser: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format').optional().or(z.null()),
  rating: z.number().min(1).max(5),
  comments: z.string().trim().min(3, 'Comments must be at least 3 characters').max(1000)
});

module.exports = {
  createFeedbackSchema
};
