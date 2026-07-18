const { z } = require('zod');
const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const createMeetingSchema = z.object({
  title: z.string().min(3, 'Title required').max(150),
  agenda: z.string().min(5, 'Agenda required').max(1000),
  participants: z.array(z.string().regex(objectIdRegex, 'Invalid participant ID')).optional(),
  meetingDate: z.string().refine((date) => !isNaN(Date.parse(date)), { message: 'Invalid date' }),
  location: z.string().min(2, 'Location required').max(100)
});

module.exports = {
  createMeetingSchema
};
