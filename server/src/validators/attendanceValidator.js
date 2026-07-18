const { z } = require('zod');
const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const markAttendanceSchema = z.object({
  studentId: z.string().regex(objectIdRegex, 'Invalid student ID'),
  subjectId: z.string().regex(objectIdRegex, 'Invalid subject ID'),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), { message: 'Invalid date' }),
  status: z.enum(['PRESENT', 'ABSENT', 'EXCUSED'])
});

module.exports = {
  markAttendanceSchema
};
