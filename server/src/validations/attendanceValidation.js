const { z } = require('zod');

const submitAttendanceSchema = z.object({
  subjectId: z.string({ required_error: 'Subject ID is required' }).regex(/^[0-9a-fA-F]{24}$/, 'Invalid Subject ID format'),
  
  // Accept any valid ISO date string
  date: z.string({ required_error: 'Attendance date is required' }).refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  }),
  
  records: z.array(
    z.object({
      studentId: z.string({ required_error: 'Student ID is required' }).regex(/^[0-9a-fA-F]{24}$/, 'Invalid Student ID format'),
      status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'MEDICAL_LEAVE', 'DUTY_LEAVE'], {
        error_map: () => ({ message: "Status must be: PRESENT, ABSENT, LATE, MEDICAL_LEAVE, or DUTY_LEAVE" }),
      }),
    })
  ).min(1, 'At least one student attendance record must be submitted'),
});

module.exports = {
  submitAttendanceSchema,
};
