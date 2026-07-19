const { z } = require('zod');

const createLeaveRequestSchema = z.object({
  leaveType: z.enum(['SICK', 'CASUAL', 'ACADEMIC', 'EMERGENCY']),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), { message: 'Invalid date' }),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), { message: 'Invalid date' }),
  reason: z.string().min(5, 'Reason is required').max(500)
});

module.exports = {
  createLeaveRequestSchema
};
