const { z } = require('zod');

const academicSessionSchema = z.object({
  academicYear: z
    .string({ required_error: 'Academic year is required' })
    .min(1, 'Academic year cannot be empty')
    .trim(),
  semesterType: z.enum(['ODD', 'EVEN'], { required_error: 'Semester type must be ODD or EVEN' }),
  termStartDate: z.coerce.date({ required_error: 'Term start date is required' }),
  termEndDate: z.coerce.date({ required_error: 'Term end date is required' }),
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional().default('ACTIVE'),
}).refine(
  (data) => data.termEndDate > data.termStartDate,
  {
    message: 'Term end date must be after term start date',
    path: ['termEndDate'],
  }
);

module.exports = {
  academicSessionSchema,
};
