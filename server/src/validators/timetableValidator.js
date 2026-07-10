const { z } = require('zod');

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const createSlotSchema = z.object({
  courseId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid course ID format'),
  branchId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid branch ID format'),
  semester: z.number().int().min(1).max(10),
  group: z.string().trim().max(20).optional().or(z.null()),
  subjectId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid subject ID format'),
  facultyId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid faculty ID format'),
  dayOfWeek: z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']),
  startTime: z.string().regex(timeRegex, 'Start time must be HH:MM'),
  endTime: z.string().regex(timeRegex, 'End time must be HH:MM'),
  room: z.string().trim().max(50).optional().or(z.null()),
}).refine((data) => {
  const start = data.startTime.split(':').map(Number);
  const end = data.endTime.split(':').map(Number);
  const startMins = start[0] * 60 + start[1];
  const endMins = end[0] * 60 + end[1];
  return startMins < endMins;
}, {
  message: 'End time must be strictly after start time',
  path: ['endTime'],
});

module.exports = {
  createSlotSchema,
};
