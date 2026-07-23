const { z } = require('zod');
const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const markAttendanceSchema = z.object({
  studentId: z.string().regex(objectIdRegex, 'Invalid student ID'),
  subjectId: z.string().regex(objectIdRegex, 'Invalid subject ID'),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), { message: 'Invalid date' }),
  status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'MEDICAL_LEAVE', 'DUTY_LEAVE'])
});

const submitAttendanceSchema = z.object({
  subjectId: z.string({ required_error: 'Subject ID is required' }).regex(objectIdRegex, 'Invalid Subject ID format'),
  date: z.string({ required_error: 'Attendance date is required' }).refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  }),
  records: z.array(
    z.object({
      studentId: z.string({ required_error: 'Student ID is required' }).regex(objectIdRegex, 'Invalid Student ID format'),
      status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'MEDICAL_LEAVE', 'DUTY_LEAVE'], {
        error_map: () => ({ message: "Status must be: PRESENT, ABSENT, LATE, EXCUSED, MEDICAL_LEAVE, or DUTY_LEAVE" }),
      }),
    })
  ).min(1, 'At least one student attendance record must be submitted'),
});

module.exports = {
  markAttendanceSchema,
  submitAttendanceSchema
};
