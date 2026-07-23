const { z } = require('zod');
const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const createExaminationSchema = z.object({
  title: z.string().min(2, 'Title is required').max(150),
  type: z.enum(['INTERNAL', 'EXTERNAL', 'PRACTICAL', 'VIVA']),
  departmentId: z.string().regex(objectIdRegex, 'Invalid department ID'),
  subjectId: z.string().regex(objectIdRegex, 'Invalid subject ID'),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), { message: 'Invalid date' }),
  totalMarks: z.coerce.number().min(1),
  passingMarks: z.coerce.number().min(1),
});

const publishResultSchema = z.object({
  studentId: z.string().regex(objectIdRegex, 'Invalid student ID'),
  marksObtained: z.coerce.number().min(0),
  status: z.enum(['PASS', 'FAIL', 'ABSENT']),
});

module.exports = {
  createExaminationSchema,
  publishResultSchema
};
