const { z } = require('zod');

const createExamSchema = z.object({
  name: z.string({ required_error: 'Exam name is required' }).trim().min(3, 'Name must be at least 3 characters'),
  subjectId: z.string({ required_error: 'Subject ID is required' }).regex(/^[0-9a-fA-F]{24}$/, 'Invalid Subject ID format'),
  examType: z.enum(['MID_TERM', 'END_TERM', 'LAB', 'QUIZ'], {
    error_map: () => ({ message: 'Exam type must be: MID_TERM, END_TERM, LAB, or QUIZ' }),
  }),
  date: z.coerce.date({ required_error: 'Exam date is required' }),
  maxMarks: z.preprocess(
    (val) => (val === null || val === undefined || val === '' ? undefined : Number(val)),
    z.number().min(1, 'Max marks must be at least 1').default(100)
  ),
  passingMarks: z.preprocess(
    (val) => (val === null || val === undefined || val === '' ? undefined : Number(val)),
    z.number().min(1, 'Passing marks must be at least 1').default(40)
  ),
});

const submitResultSchema = z.object({
  examId: z.string({ required_error: 'Exam ID is required' }).regex(/^[0-9a-fA-F]{24}$/, 'Invalid Exam ID format'),
  studentId: z.string({ required_error: 'Student ID is required' }).regex(/^[0-9a-fA-F]{24}$/, 'Invalid Student ID format'),
  marksObtained: z.number().min(0, 'Marks obtained cannot be negative').nullable().optional(),
  remarks: z.string().optional(),
  absent: z.boolean().optional(),
  isPublished: z.boolean().optional(),
});

module.exports = {
  createExamSchema,
  submitResultSchema,
};
