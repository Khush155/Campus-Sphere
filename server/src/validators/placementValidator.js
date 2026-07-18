const { z } = require('zod');
const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const createPlacementDriveSchema = z.object({
  companyName: z.string().min(2, 'Company name is required'),
  role: z.string().min(2, 'Role is required'),
  packageInfo: z.string().optional(),
  eligibilityCriteria: z.object({
    cgpa: z.coerce.number().min(0).max(10).optional(),
    backlogs: z.coerce.number().min(0).optional()
  }).optional(),
  driveDate: z.string().refine((date) => !isNaN(Date.parse(date)), { message: 'Invalid date' }),
  departmentIds: z.array(z.string().regex(objectIdRegex, 'Invalid department ID')).min(1)
});

module.exports = {
  createPlacementDriveSchema
};
