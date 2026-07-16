const { z } = require('zod');
const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const createNoticeSchema = z.object({
  title: z.string().min(5, 'Title required').max(150),
  content: z.string().min(10, 'Content required').max(2000),
  departmentId: z.string().regex(objectIdRegex, 'Invalid department ID').optional().nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  expiresAt: z.string().refine((date) => !isNaN(Date.parse(date)), { message: 'Invalid date' }).optional()
});

module.exports = {
  createNoticeSchema
};
