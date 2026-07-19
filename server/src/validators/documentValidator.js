const { z } = require('zod');

const createDocumentRequestSchema = z.object({
  documentType: z.enum(['BONAFIDE', 'NOC', 'LOR', 'TRANSCRIPT']),
  purpose: z.string().min(5, 'Purpose required').max(500)
});

module.exports = {
  createDocumentRequestSchema
};
