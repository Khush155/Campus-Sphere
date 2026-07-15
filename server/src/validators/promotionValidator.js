const { z } = require('zod');

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const promotionSchema = z.object({
  departmentId: z
    .string()
    .regex(objectIdRegex, 'Invalid department ID')
    .optional()
    .nullable()
    .or(z.literal('')),
  courseId: z
    .string()
    .regex(objectIdRegex, 'Invalid course ID')
    .optional()
    .nullable()
    .or(z.literal('')),
  branchId: z
    .string()
    .regex(objectIdRegex, 'Invalid branch ID')
    .optional()
    .nullable()
    .or(z.literal('')),
});

module.exports = {
  promotionSchema,
};
