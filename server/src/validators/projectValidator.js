const { z } = require('zod');
const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const createProjectSchema = z.object({
  title: z.string().min(2, 'Title is required').max(200),
  description: z.string().min(10, 'Description required').max(1000),
  departmentId: z.string().regex(objectIdRegex, 'Invalid department ID'),
  guideId: z.string().regex(objectIdRegex, 'Invalid guide ID'),
  academicYear: z.string().min(4).max(9)
});

module.exports = {
  createProjectSchema
};
