import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Box,
  Button,
  Drawer,
  TextField,
  Typography,
  MenuItem,
  Alert,
  useTheme,
  Grid,
} from '@mui/material';
import {
  useDepartmentsQuery,
  useCoursesQuery,
  useBranchesQuery,
} from '../../../queries/collegeQueries';
import { useUsersQuery, useRegisterMutation } from '../../../queries/userQueries';

// Validation Schema for Registration Form
const registerFormSchema = z.object({
  role: z.string().min(1, 'Please select a role first'),
  name: z.string().min(2, 'Name must be at least 2 characters long').max(50, 'Name cannot exceed 50 characters').trim(),
  email: z.string().min(1, 'Email cannot be empty').email('Invalid email address format').trim().toLowerCase(),
  password: z.string().min(6, 'Temporary password must be at least 6 characters long'),
  departmentId: z.string().optional().or(z.null()).or(z.literal('')),
  courseId: z.string().optional().or(z.null()).or(z.literal('')),
  branchId: z.string().optional().or(z.null()).or(z.literal('')),
  semester: z.number().optional().or(z.null()),
  shift: z.string().optional().or(z.null()).or(z.literal('')),
}).superRefine((data, ctx) => {
  if (data.role === 'HOD') {
    if (!data.shift || !['GENERAL', 'MORNING', 'EVENING'].includes(data.shift)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Shift is required for HOD role and must be GENERAL, MORNING, or EVENING',
        path: ['shift'],
      });
    }
  }
});

export const UserRegister = ({ open, onClose }) => {
  const theme = useTheme();

  // Queries & Mutations
  const { data: depts } = useDepartmentsQuery();
  const { data: courses } = useCoursesQuery();
  const { data: branches } = useBranchesQuery();
  const { data: hodsData } = useUsersQuery({ role: 'HOD', limit: 100 });
  const registerUser = useRegisterMutation();

  const [hodWarning, setHodWarning] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      role: '',
      name: '',
      email: '',
      password: '',
      departmentId: '',
      courseId: '',
      branchId: '',
      semester: 1,
      shift: '',
    },
  });

  const selectedRole = watch('role');
  const selectedDept = watch('departmentId');
  const selectedCourse = watch('courseId');
  const selectedShift = watch('shift');

  // Clear fields when role changes
  useEffect(() => {
    if (selectedRole) {
      setValue('departmentId', '');
      setValue('courseId', '');
      setValue('branchId', '');
      setValue('semester', 1);
      setValue('shift', '');
      setHodWarning('');
    }
  }, [selectedRole, setValue]);

  // HOD check warning
  useEffect(() => {
    if (selectedRole === 'HOD' && selectedDept && hodsData?.data) {
      const shift = selectedShift || 'GENERAL';
      const deptObj = depts?.find((d) => String(d._id) === String(selectedDept));
      const deptName = deptObj ? deptObj.name : 'this department';

      if (shift === 'GENERAL') {
        const existing = hodsData.data.find(
          (h) => String(h.departmentId) === String(selectedDept) && h.status === 'ACTIVE'
        );
        if (existing) {
          setHodWarning(
            `${deptName} already has an active HOD: ${existing.name} (${existing.shift || 'GENERAL'}). Assigning a General HOD will conflict.`
          );
        } else {
          setHodWarning('');
        }
      } else {
        const conflicting = hodsData.data.find(
          (h) => String(h.departmentId) === String(selectedDept) && h.status === 'ACTIVE' && (h.shift === 'GENERAL' || h.shift === shift)
        );
        if (conflicting) {
          const reason = conflicting.shift === 'GENERAL'
            ? `${deptName} currently has a General HOD (${conflicting.name}). Reassign or convert them to shift-specific before adding a ${shift} HOD.`
            : `${deptName} already has a ${shift}-shift HOD: ${conflicting.name}.`;
          setHodWarning(reason);
        } else {
          setHodWarning('');
        }
      }
    } else {
      setHodWarning('');
    }
  }, [selectedRole, selectedDept, selectedShift, hodsData, depts]);

  // Filter branches cascading select based on course selection
  const filteredBranches = branches?.filter(
    (b) => String(b.courseId?._id || b.courseId) === String(selectedCourse)
  );

  // Filter semester bounds based on course selection
  const [semesterOptions, setSemesterOptions] = useState([1, 2, 3, 4, 5, 6, 7, 8]);
  useEffect(() => {
    if (selectedCourse && courses) {
      const matchCourse = courses.find((c) => String(c._id) === String(selectedCourse));
      if (matchCourse) {
        const totalSems = matchCourse.semesters || (matchCourse.durationYears * 2);
        const options = [];
        for (let i = 1; i <= totalSems; i++) {
          options.push(i);
        }
        setSemesterOptions(options);
        setValue('semester', 1);
      }
    }
  }, [selectedCourse, courses, setValue]);

  const onSubmit = async (data) => {
    try {
      const payload = {
        role: data.role,
        name: data.name,
        email: data.email,
        password: data.password,
        departmentId: data.departmentId || null,
        courseId: data.courseId || null,
        branchId: data.branchId || null,
        semester: data.role === 'STUDENT' ? (data.semester || 1) : null,
        shift: data.role === 'HOD' ? data.shift : null,
      };

      await registerUser.mutateAsync(payload);
      
      // Reset form to role-selection step on success
      reset({
        role: '',
        name: '',
        email: '',
        password: '',
        departmentId: '',
        courseId: '',
        branchId: '',
        semester: 1,
        shift: '',
      });
      setHodWarning('');
      onClose();
    } catch (err) {
      // Handled globally
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 400 }, p: 4, bgcolor: theme.palette.background.paper } }}
    >
      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '100%',
          gap: 4.5,
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
          {/* Header */}
          <Box>
            <Typography variant="h5" sx={{ fontFamily: theme.typography.h1.fontFamily, fontWeight: 700, color: theme.palette.ink[900], mb: 0.5 }}>
              Register Account
            </Typography>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
              Add a student, HOD, faculty, or system administrator.
            </Typography>
          </Box>

          {/* Role selector first */}
          <Box>
            <Typography component="label" htmlFor="reg-role-select" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}>
              Select Account Role
            </Typography>
            <TextField
              id="reg-role-select"
              select
              fullWidth
              size="small"
              {...register('role')}
              error={!!errors.role}
              helperText={errors.role?.message}
            >
              <MenuItem value="">Choose Role...</MenuItem>
              <MenuItem value="SUPER_ADMIN">Super Admin</MenuItem>
              <MenuItem value="COLLEGE_ADMIN">College Admin</MenuItem>
              <MenuItem value="HOD">HOD (Dept. Head)</MenuItem>
              <MenuItem value="FACULTY">Faculty</MenuItem>
              <MenuItem value="STUDENT">Student</MenuItem>
            </TextField>
          </Box>

          {selectedRole && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {/* Dynamic HOD Alert warning */}
              {hodWarning && (
                <Alert severity="warning" sx={{ fontFamily: theme.typography.body2.fontFamily, fontSize: '0.78rem' }}>
                  {hodWarning}
                </Alert>
              )}

              {/* Common Fields */}
              <Box>
                <Typography component="label" htmlFor="reg-name-input" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}>
                  Full Name
                </Typography>
                <TextField
                  id="reg-name-input"
                  fullWidth
                  placeholder="e.g. Priyanshu Sharma"
                  size="small"
                  {...register('name')}
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              </Box>

              <Box>
                <Typography component="label" htmlFor="reg-email-input" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}>
                  Email Address
                </Typography>
                <TextField
                  id="reg-email-input"
                  fullWidth
                  placeholder="e.g. priyanshu@campussphere.edu"
                  size="small"
                  {...register('email')}
                  error={!!errors.email}
                  helperText={errors.email?.message}
                />
              </Box>

              <Box>
                <Typography component="label" htmlFor="reg-password-input" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}>
                  Temporary Password
                </Typography>
                <TextField
                  id="reg-password-input"
                  type="password"
                  fullWidth
                  placeholder="At least 6 characters..."
                  size="small"
                  {...register('password')}
                  error={!!errors.password}
                  helperText={errors.password?.message}
                />
              </Box>

              {/* HOD / Faculty / Student: Department select */}
              {selectedRole !== 'SUPER_ADMIN' && selectedRole !== 'COLLEGE_ADMIN' && (
                <Box>
                  <Typography component="label" htmlFor="reg-dept-select" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}>
                    Department
                  </Typography>
                  <TextField
                    id="reg-dept-select"
                    select
                    fullWidth
                    size="small"
                    {...register('departmentId')}
                    error={!!errors.departmentId}
                    helperText={errors.departmentId?.message}
                  >
                    <MenuItem value="">Choose Department...</MenuItem>
                    {depts?.map((d) => (
                      <MenuItem key={d._id} value={d._id}>
                        {d.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>
              )}

              {/* HOD Specific Scope Select */}
              {selectedRole === 'HOD' && (
                <Box>
                  <Typography component="label" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}>
                    HOD Scope
                  </Typography>
                  <Controller
                    name="shift"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        select
                        fullWidth
                        size="small"
                        error={!!errors.shift}
                        helperText={errors.shift?.message}
                      >
                        <MenuItem value="">Choose HOD Scope...</MenuItem>
                        <MenuItem value="GENERAL">General (single HOD for the whole department)</MenuItem>
                        <MenuItem value="MORNING">Morning Shift (Day Scholars)</MenuItem>
                        <MenuItem value="EVENING">Evening Shift (Hostellers)</MenuItem>
                      </TextField>
                    )}
                  />
                </Box>
              )}

              {/* Student specific cascading selectors */}
              {selectedRole === 'STUDENT' && (
                <>
                  <Box>
                    <Typography component="label" htmlFor="reg-course-select" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}>
                      Degree Course
                    </Typography>
                    <TextField
                      id="reg-course-select"
                      select
                      fullWidth
                      size="small"
                      {...register('courseId')}
                      error={!!errors.courseId}
                      helperText={errors.courseId?.message}
                    >
                      <MenuItem value="">Choose Course...</MenuItem>
                      {courses?.map((c) => (
                        <MenuItem key={c._id} value={c._id}>
                          {c.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography component="label" htmlFor="reg-branch-select" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}>
                        Branch
                      </Typography>
                      <TextField
                        id="reg-branch-select"
                        select
                        fullWidth
                        disabled={!selectedCourse}
                        size="small"
                        {...register('branchId')}
                        error={!!errors.branchId}
                        helperText={errors.branchId?.message}
                      >
                        {!selectedCourse ? (
                          <MenuItem value="">Select course...</MenuItem>
                        ) : (
                          filteredBranches?.map((b) => (
                            <MenuItem key={b._id} value={b._id}>
                              {b.name}
                            </MenuItem>
                          ))
                        )}
                      </TextField>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography component="label" htmlFor="reg-sem-select" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}>
                        Semester
                      </Typography>
                      <TextField
                        id="reg-sem-select"
                        select
                        fullWidth
                        disabled={!selectedCourse}
                        size="small"
                        {...register('semester', { valueAsNumber: true })}
                        error={!!errors.semester}
                        helperText={errors.semester?.message}
                      >
                        {!selectedCourse ? (
                          <MenuItem value="">Select course...</MenuItem>
                        ) : (
                          semesterOptions.map((num) => (
                            <MenuItem key={num} value={num}>
                              Semester {num}
                            </MenuItem>
                          ))
                        )}
                      </TextField>
                    </Grid>
                  </Grid>
                </>
              )}
            </Box>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            fullWidth
            onClick={onClose}
            sx={{ color: theme.palette.text.secondary, borderColor: theme.palette.divider, fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={registerUser.isPending || !selectedRole}
            sx={{
              bgcolor: theme.palette.primary.main,
              color: theme.palette.ink[900],
              fontWeight: 700,
              '&:hover': { bgcolor: theme.palette.primary.light },
            }}
          >
            {registerUser.isPending ? 'Registering...' : 'Register'}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};

export default UserRegister;
