const { z } = require('zod');

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const applyAdmissionSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Invalid email address'),
  dateOfBirth: z.string().refine((date) => !isNaN(Date.parse(date)), { message: 'Invalid date format' }),
  contactNumber: z.string().regex(/^\d{10}$/, 'Contact number must be 10 digits'),
  guardianName: z.string().min(2, 'Guardian name required').max(50),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  bloodGroup: z.string().min(2, 'Blood group required').max(5),
  highSchoolMarks: z.coerce.number().min(0).max(100),
  intermediateMarks: z.coerce.number().min(0).max(100),
  address: z.string().min(5, 'Address required').max(200),
  departmentId: z.string().regex(objectIdRegex, 'Invalid department ID'),
  courseId: z.string().regex(objectIdRegex, 'Invalid course ID'),
  branchId: z.string().regex(objectIdRegex, 'Invalid branch ID'),
});

const actionAdmissionSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  notes: z.string().max(500).optional(),
});

module.exports = {
  applyAdmissionSchema,
  actionAdmissionSchema,
};
