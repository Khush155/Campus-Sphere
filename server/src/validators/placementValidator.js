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
  applicationDeadline: z.string().refine((date) => !isNaN(Date.parse(date)), { message: 'Invalid deadline date' }).optional(),
  jobDescription: z.string().optional(),
  selectionProcess: z.string().optional(),
  driveType: z.enum(['PLACEMENT', 'INTERNSHIP']).optional(),
  departmentIds: z.array(z.string().regex(objectIdRegex, 'Invalid department ID')).min(1),
  eligibleBranches: z.array(z.string().regex(objectIdRegex, 'Invalid branch ID')).optional(),
  eligibleStanding: z.enum(['FINAL_YEAR', 'PRE_FINAL_YEAR', 'ALL_YEARS']).optional(),
  graduatingBatchYear: z.coerce.number().min(2000).max(2100).optional(),
});

module.exports = {
  createPlacementDriveSchema
};
