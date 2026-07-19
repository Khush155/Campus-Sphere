const { z } = require('zod');

// Schema to validate when CREATING a new Faculty
const createFacultySchema = z.object({
  // User Account Fields
  name: z.string({ required_error: 'Name is required' }).trim().min(2, 'Name must be at least 2 characters'),
  email: z.string({ required_error: 'Email is required' }).trim().email('Invalid email address'),
  password: z.string({ required_error: 'Password is required' }).min(6, 'Password must be at least 6 characters'),
  
  // Faculty Profile Fields
  departmentId: z.string({ required_error: 'Department ID is required' }).regex(/^[0-9a-fA-F]{24}$/, 'Invalid Department ID format'), // Checks if it's a valid MongoDB ObjectId
  designation: z.enum(['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer'], {
    error_map: () => ({ message: 'Designation must be one of: Professor, Associate Professor, Assistant Professor, Lecturer' }),
  }),
  phoneNumber: z.string().optional().or(z.literal('')), // Optional field, allows empty string
  officeHours: z.string().optional().or(z.literal('')),
  subjects: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Subject ID format')).optional().default([]),
});

// Schema to validate when UPDATING a Faculty profile
const updateFacultySchema = z.object({
  name: z.string().trim().min(2).optional(),
  email: z.string().trim().email().optional(),
  designation: z.enum(['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer']).optional(),
  phoneNumber: z.string().optional().or(z.literal('')),
  officeHours: z.string().optional().or(z.literal('')),
  subjects: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Subject ID format')).optional(),
});

module.exports = {
  createFacultySchema,
  updateFacultySchema,
};
