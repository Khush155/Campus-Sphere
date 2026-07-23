const { z } = require('zod');

const createDocumentRequestSchema = z.object({
  documentType: z.enum([
    'BONAFIDE',
    'NOC',
    'LOR',
    'TRANSCRIPT',
    'CHARACTER_CERTIFICATE',
    'MIGRATION_CERTIFICATE',
    'PROVISIONAL_CERTIFICATE'
  ]),
  purpose: z.string().min(5, 'Purpose required').max(500)
});

module.exports = {
  createDocumentRequestSchema
};
