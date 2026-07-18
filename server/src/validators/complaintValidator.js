const { z } = require('zod');
const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const createComplaintSchema = z.object({
  title: z.string().min(5, 'Title required').max(150),
  description: z.string().min(10, 'Description required').max(1000),
  category: z.enum(['ACADEMIC', 'INFRASTRUCTURE', 'HARASSMENT', 'OTHER'])
});

module.exports = {
  createComplaintSchema
};
