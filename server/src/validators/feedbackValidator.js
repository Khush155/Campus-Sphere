const { z } = require('zod');

const createFeedbackSchema = z.object({
  targetRole: z.enum(['FACULTY', 'STUDENT']),
  targetUser: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format').optional().or(z.null()),
  subjectId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid subject ID format').optional().or(z.null()),
  semester: z.number().int().min(1).max(12).optional(),
  rating: z.number().min(1).max(5),
  criteriaRatings: z
    .object({
      courseCoverage: z.number().min(1).max(5).optional(),
      conceptClarity: z.number().min(1).max(5).optional(),
      punctuality: z.number().min(1).max(5).optional(),
      doubtClearing: z.number().min(1).max(5).optional(),
      practicalRelevance: z.number().min(1).max(5).optional(),
    })
    .optional(),
  comments: z.string().trim().min(3, 'Comments must be at least 3 characters').max(1000),
  isAnonymous: z.boolean().optional(),
});

module.exports = {
  createFeedbackSchema,
};
