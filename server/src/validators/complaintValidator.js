const { z } = require('zod');

const createComplaintSchema = z.object({
  title: z.string().min(5, 'Title required').max(150),
  description: z.string().min(10, 'Description required').max(1000),
  category: z.enum(['ACADEMIC', 'INFRASTRUCTURE', 'HARASSMENT', 'ADMINISTRATIVE', 'FACULTY_CONDUCT', 'OTHER'])
});

module.exports = {
  createComplaintSchema
};
