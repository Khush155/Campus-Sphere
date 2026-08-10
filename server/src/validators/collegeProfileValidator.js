const { z } = require('zod');

const collegeProfileUpdateSchema = z.object({
  name: z
    .string({ required_error: 'College name is required' })
    .min(1, 'College name cannot be empty')
    .max(150, 'College name cannot exceed 150 characters')
    .trim(),
  institutionCode: z
    .string()
    .max(50, 'Institution code cannot exceed 50 characters')
    .trim()
    .optional()
    .or(z.literal('')),
  establishmentYear: z
    .union([z.number(), z.string().transform((val) => (val ? Number(val) : undefined))])
    .optional(),
  accreditation: z
    .string()
    .max(150, 'Accreditation info cannot exceed 150 characters')
    .trim()
    .optional()
    .or(z.literal('')),
  affiliation: z
    .string()
    .max(200, 'Affiliation info cannot exceed 200 characters')
    .trim()
    .optional()
    .or(z.literal('')),
  address: z
    .string()
    .max(300, 'Address cannot exceed 300 characters')
    .trim()
    .optional()
    .or(z.literal('')),
  contactEmail: z
    .string()
    .email('Invalid contact email format')
    .trim()
    .optional()
    .or(z.literal(''))
    .or(z.null()),
  contactPhone: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .or(z.null()),
  website: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .or(z.null()),
});

module.exports = {
  collegeProfileUpdateSchema,
};
