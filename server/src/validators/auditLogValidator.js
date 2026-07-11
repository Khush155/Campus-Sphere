const { z } = require('zod');

const auditLogQuerySchema = z.object({
  page: z
    .preprocess((val) => (val ? parseInt(val, 10) : 1), z.number().int().min(1))
    .optional()
    .default(1),
  limit: z
    .preprocess((val) => (val ? parseInt(val, 10) : 10), z.number().int().min(1).max(100))
    .optional()
    .default(10),
  actorId: z.string().trim().optional(),
  action: z.string().trim().optional(),
  targetModel: z.string().trim().optional(),
  dateFrom: z.string().trim().optional(),
  dateTo: z.string().trim().optional(),
  search: z.string().trim().optional(),
});

module.exports = {
  auditLogQuerySchema,
};
