import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CircularProgress,
  MenuItem,
  useTheme,
  LinearProgress,
  Grid,
} from '@mui/material';
import {
  CheckCircleOutline,
  ArrowForward,
  BusinessOutlined,
  MenuBookOutlined,
  AltRouteOutlined,
  BookOutlined,
} from '@mui/icons-material';
import {
  useCreateDeptMutation,
  useCreateCourseMutation,
  useCreateBranchMutation,
  useCreateSubjectMutation,
  useDepartmentsQuery,
  useCoursesQuery,
  useBranchesQuery,
} from '../../queries/collegeQueries';

// Step 1: Department Validation
const deptSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long').max(100, 'Name cannot exceed 100 characters').trim(),
  code: z.string().min(2, 'Code must be at least 2 characters').max(10, 'Code cannot exceed 10 characters').toUpperCase().trim(),
});

// Step 2: Course Validation
const courseSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2').max(100),
  code: z.string().min(2, 'Code must be at least 2').max(10).toUpperCase().trim(),
  durationYears: z.coerce.number().min(1, 'Duration must be at least 1 year').max(6, 'Duration cannot exceed 6 years'),
});

// Step 3: Branch Validation
const branchSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2').max(100),
  code: z.string().min(2, 'Code must be at least 2').max(10).toUpperCase().trim(),
  courseId: z.string().min(1, 'Course mapping is required'),
});

// Step 4: Subject Validation
const subjectSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2').max(100),
  code: z.string().min(2, 'Code must be at least 2').max(15).toUpperCase().trim(),
  credits: z.coerce.number().min(1).max(6),
  type: z.enum(['THEORY', 'PRACTICAL', 'SESSIONAL']),
  departmentId: z.string().min(1, 'Department mapping is required'),
  branchId: z.string().min(1, 'Branch mapping is required'),
  semester: z.coerce.number().min(1).max(12),
});

export const SetupWizard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [setupSummary, setSetupSummary] = useState({
    dept: null,
    course: null,
    branch: null,
    subject: null,
  });

  // Queries & Mutations
  const { data: depts } = useDepartmentsQuery();
  const { data: courses } = useCoursesQuery();
  const { data: branches } = useBranchesQuery();

  const createDept = useCreateDeptMutation();
  const createCourse = useCreateCourseMutation();
  const createBranch = useCreateBranchMutation();
  const createSubject = useCreateSubjectMutation();

  // Forms
  const {
    register: regDept,
    handleSubmit: submitDept,
    formState: { errors: errorsDept },
  } = useForm({ resolver: zodResolver(deptSchema) });

  const {
    register: regCourse,
    handleSubmit: submitCourse,
    formState: { errors: errorsCourse },
  } = useForm({ resolver: zodResolver(courseSchema) });

  const {
    register: regBranch,
    handleSubmit: submitBranch,
    formState: { errors: errorsBranch },
  } = useForm({ resolver: zodResolver(branchSchema) });

  const {
    register: regSub,
    handleSubmit: submitSub,
    formState: { errors: errorsSub },
  } = useForm({ resolver: zodResolver(subjectSchema) });

  const handleSkip = () => {
    localStorage.setItem('skip_setup_wizard', 'true');
    navigate('/admin/dashboard');
  };

  const onDeptSubmit = async (data) => {
    try {
      const res = await createDept.mutateAsync(data);
      setSetupSummary((prev) => ({ ...prev, dept: res.name }));
      setStep(2);
    } catch (err) {
      return;
    }
  };

  const onCourseSubmit = async (data) => {
    try {
      const res = await createCourse.mutateAsync(data);
      setSetupSummary((prev) => ({ ...prev, course: res.name }));
      setStep(3);
    } catch (err) {
      return;
    }
  };

  const onBranchSubmit = async (data) => {
    try {
      const res = await createBranch.mutateAsync(data);
      setSetupSummary((prev) => ({ ...prev, branch: res.name }));
      setStep(4);
    } catch (err) {
      return;
    }
  };

  const onSubSubmit = async (data) => {
    try {
      const res = await createSubject.mutateAsync(data);
      setSetupSummary((prev) => ({ ...prev, subject: res.name }));
      setStep(5);
    } catch (err) {
      return;
    }
  };

  const handleFinish = () => {
    localStorage.removeItem('skip_setup_wizard');
    navigate('/admin/dashboard');
  };

  const progress = (step / 5) * 100;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: theme.custom.surface.base,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
        position: 'relative',
      }}
    >
      {/* Top Banner Progress Bar */}
      <Box sx={{ width: '100%', maxWidth: '600px', position: 'absolute', top: 40 }}>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 4,
            borderRadius: 2,
            bgcolor: theme.custom.border.subtle,
            '& .MuiLinearProgress-bar': {
              bgcolor: theme.palette.primary.main,
            },
          }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Typography
            sx={{
              fontFamily: theme.typography.mono.fontFamily,
              fontSize: '0.72rem',
              fontWeight: 600,
              color: theme.palette.text.secondary,
            }}
          >
            STEP {step} OF 5
          </Typography>
          {step > 1 && step < 5 && (
            <Button
              size="small"
              onClick={handleSkip}
              sx={{
                p: 0,
                color: theme.palette.text.secondary,
                fontWeight: 600,
                fontSize: '0.75rem',
                textTransform: 'none',
                '&:hover': { background: 'none', color: theme.palette.primary.main },
              }}
            >
              I&apos;ll do this later
            </Button>
          )}
        </Box>
      </Box>

      {/* Steps Animation Box Container */}
      <Card
        sx={{
          width: '100%',
          maxWidth: '600px',
          p: 4.5,
          border: `1px solid ${theme.custom.border.subtle}`,
          boxShadow: theme.custom.elevation.raised,
          bgcolor: theme.custom.surface.raised,
          borderRadius: '16px',
          mt: 4,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* STEP 1: ADD DEPARTMENT */}
        {step === 1 && (
          <Box component="form" onSubmit={submitDept(onDeptSubmit)}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <BusinessOutlined sx={{ color: theme.palette.primary.main, fontSize: 32 }} />
              <Typography
                variant="h4"
                sx={{
                  fontFamily: theme.typography.h1.fontFamily,
                  color: theme.palette.ink[900],
                  fontWeight: 600,
                }}
              >
                Create your first Department
              </Typography>
            </Box>
            <Typography sx={{ color: theme.palette.text.secondary, mb: 4, fontSize: '0.9rem' }}>
              Departments hold your academic branches and courses. Start by adding the central engineering or arts division.
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 4 }}>
              <TextField
                label="Department Name"
                fullWidth
                placeholder="e.g. Computer Science & Engineering"
                {...regDept('name')}
                error={!!errorsDept.name}
                helperText={errorsDept.name?.message}
              />
              <TextField
                label="Department Code"
                fullWidth
                placeholder="e.g. CSE"
                {...regDept('code')}
                error={!!errorsDept.code}
                helperText={errorsDept.code?.message}
              />
            </Box>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={createDept.isPending}
              endIcon={createDept.isPending ? <CircularProgress size={16} /> : <ArrowForward />}
              sx={{
                bgcolor: theme.palette.primary.main,
                color: theme.palette.ink[900],
                fontWeight: 700,
                py: 1.5,
              }}
            >
              Add Department
            </Button>
          </Box>
        )}

        {/* STEP 2: ADD COURSE */}
        {step === 2 && (
          <Box component="form" onSubmit={submitCourse(onCourseSubmit)}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <MenuBookOutlined sx={{ color: theme.palette.primary.main, fontSize: 32 }} />
              <Typography
                variant="h4"
                sx={{
                  fontFamily: theme.typography.h1.fontFamily,
                  color: theme.palette.ink[900],
                  fontWeight: 600,
                }}
              >
                Add a Degree Course
              </Typography>
            </Box>
            <Typography sx={{ color: theme.palette.text.secondary, mb: 4, fontSize: '0.9rem' }}>
              Courses represent degrees awarded (e.g. B.Tech, M.B.A, B.Sc). Specify the academic duration.
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 4 }}>
              <TextField
                label="Course Name"
                fullWidth
                placeholder="e.g. Bachelor of Technology"
                {...regCourse('name')}
                error={!!errorsCourse.name}
                helperText={errorsCourse.name?.message}
              />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    label="Course Code"
                    fullWidth
                    placeholder="e.g. B.TECH"
                    {...regCourse('code')}
                    error={!!errorsCourse.code}
                    helperText={errorsCourse.code?.message}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Duration in Years"
                    type="number"
                    fullWidth
                    placeholder="4"
                    {...regCourse('durationYears')}
                    error={!!errorsCourse.durationYears}
                    helperText={errorsCourse.durationYears?.message}
                  />
                </Grid>
              </Grid>
            </Box>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={createCourse.isPending}
              endIcon={createCourse.isPending ? <CircularProgress size={16} /> : <ArrowForward />}
              sx={{
                bgcolor: theme.palette.primary.main,
                color: theme.palette.ink[900],
                fontWeight: 700,
                py: 1.5,
              }}
            >
              Add Course
            </Button>
          </Box>
        )}

        {/* STEP 3: ADD BRANCH */}
        {step === 3 && (
          <Box component="form" onSubmit={submitBranch(onBranchSubmit)}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <AltRouteOutlined sx={{ color: theme.palette.primary.main, fontSize: 32 }} />
              <Typography
                variant="h4"
                sx={{
                  fontFamily: theme.typography.h1.fontFamily,
                  color: theme.palette.ink[900],
                  fontWeight: 600,
                }}
              >
                Add a Branch Specialization
              </Typography>
            </Box>
            <Typography sx={{ color: theme.palette.text.secondary, mb: 4, fontSize: '0.9rem' }}>
              Branches represent specializations within a course degree (e.g. Computer Science, Information Technology).
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 4 }}>
              <TextField
                select
                label="Parent Degree Course"
                fullWidth
                defaultValue=""
                {...regBranch('courseId')}
                error={!!errorsBranch.courseId}
                helperText={errorsBranch.courseId?.message}
              >
                <MenuItem value="" disabled>Select parent course</MenuItem>
                {courses && courses.length > 0 ? (
                  courses.map((c) => (
                    <MenuItem key={c._id} value={c._id}>
                      {c.name} ({c.code})
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem value="" disabled>Loading courses...</MenuItem>
                )}
              </TextField>
              <TextField
                label="Branch Name"
                fullWidth
                placeholder="e.g. Information Technology"
                {...regBranch('name')}
                error={!!errorsBranch.name}
                helperText={errorsBranch.name?.message}
              />
              <TextField
                label="Branch Code"
                fullWidth
                placeholder="e.g. IT"
                {...regBranch('code')}
                error={!!errorsBranch.code}
                helperText={errorsBranch.code?.message}
              />
            </Box>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={createBranch.isPending}
              endIcon={createBranch.isPending ? <CircularProgress size={16} /> : <ArrowForward />}
              sx={{
                bgcolor: theme.palette.primary.main,
                color: theme.palette.ink[900],
                fontWeight: 700,
                py: 1.5,
              }}
            >
              Add Specialization
            </Button>
          </Box>
        )}

        {/* STEP 4: ADD SUBJECT */}
        {step === 4 && (
          <Box component="form" onSubmit={submitSub(onSubSubmit)}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <BookOutlined sx={{ color: theme.palette.primary.main, fontSize: 32 }} />
              <Typography
                variant="h4"
                sx={{
                  fontFamily: theme.typography.h1.fontFamily,
                  color: theme.palette.ink[900],
                  fontWeight: 600,
                }}
              >
                Add a Curriculum Subject
              </Typography>
            </Box>
            <Typography sx={{ color: theme.palette.text.secondary, mb: 4, fontSize: '0.9rem' }}>
              Add a core curriculum subject node and map it to a specific branch/semester combo.
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 4 }}>
              <TextField
                select
                label="Parent Department"
                fullWidth
                defaultValue=""
                {...regSub('departmentId')}
                error={!!errorsSub.departmentId}
                helperText={errorsSub.departmentId?.message}
              >
                <MenuItem value="" disabled>Select department</MenuItem>
                {depts && depts.length > 0 ? (
                  depts.map((d) => (
                    <MenuItem key={d._id} value={d._id}>
                      {d.name}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem value="" disabled>Loading departments...</MenuItem>
                )}
              </TextField>
              <TextField
                select
                label="Target Branch Specialization"
                fullWidth
                defaultValue=""
                {...regSub('branchId')}
                error={!!errorsSub.branchId}
                helperText={errorsSub.branchId?.message}
              >
                <MenuItem value="" disabled>Select specialization</MenuItem>
                {branches && branches.length > 0 ? (
                  branches.map((b) => (
                    <MenuItem key={b._id} value={b._id}>
                      {b.name}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem value="" disabled>Loading specializations...</MenuItem>
                )}
              </TextField>
              <TextField
                label="Subject Name"
                fullWidth
                placeholder="e.g. Database Management Systems"
                {...regSub('name')}
                error={!!errorsSub.name}
                helperText={errorsSub.name?.message}
              />
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <TextField
                    label="Code"
                    fullWidth
                    placeholder="e.g. CS401"
                    {...regSub('code')}
                    error={!!errorsSub.code}
                    helperText={errorsSub.code?.message}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    select
                    label="Type"
                    fullWidth
                    defaultValue="THEORY"
                    {...regSub('type')}
                    error={!!errorsSub.type}
                    helperText={errorsSub.type?.message}
                  >
                    <MenuItem value="THEORY">Theory</MenuItem>
                    <MenuItem value="PRACTICAL">Practical</MenuItem>
                    <MenuItem value="SESSIONAL">Sessional</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={2}>
                  <TextField
                    label="Credits"
                    type="number"
                    fullWidth
                    placeholder="4"
                    {...regSub('credits')}
                    error={!!errorsSub.credits}
                    helperText={errorsSub.credits?.message}
                  />
                </Grid>
                <Grid item xs={2}>
                  <TextField
                    label="Semester"
                    type="number"
                    fullWidth
                    placeholder="4"
                    {...regSub('semester')}
                    error={!!errorsSub.semester}
                    helperText={errorsSub.semester?.message}
                  />
                </Grid>
              </Grid>
            </Box>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={createSubject.isPending}
              endIcon={createSubject.isPending ? <CircularProgress size={16} /> : <ArrowForward />}
              sx={{
                bgcolor: theme.palette.primary.main,
                color: theme.palette.ink[900],
                fontWeight: 700,
                py: 1.5,
              }}
            >
              Add Subject & Finish Configuration
            </Button>
          </Box>
        )}

        {/* STEP 5: CELEBRATION PAYOFF SUMMARY */}
        {step === 5 && (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <CheckCircleOutline sx={{ color: theme.palette.signal.success, fontSize: 64, mb: 3 }} />
            <Typography
              variant="h3"
              sx={{
                fontFamily: theme.typography.h1.fontFamily,
                color: theme.palette.ink[900],
                fontWeight: 600,
                mb: 1.5,
              }}
            >
              Configuration Complete!
            </Typography>
            <Typography sx={{ color: theme.palette.text.secondary, mb: 4, fontSize: '0.9rem' }}>
              Your college profile setup is complete. The database has been initialized with the following structure:
            </Typography>

            <Card
              sx={{
                p: 2.5,
                bgcolor: theme.custom.surface.sunken,
                border: `1px solid ${theme.custom.border.subtle}`,
                textAlign: 'left',
                mb: 4,
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.ink[900] }}>
                ✓ Department: {setupSummary.dept || 'Configured'}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.ink[900] }}>
                ✓ Course Degree: {setupSummary.course || 'Configured'}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.ink[900] }}>
                ✓ Specialization: {setupSummary.branch || 'Configured'}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.ink[900] }}>
                ✓ Subject: {setupSummary.subject || 'Configured'}
              </Typography>
            </Card>

            <Button
              variant="contained"
              fullWidth
              onClick={handleFinish}
              sx={{
                bgcolor: theme.palette.primary.main,
                color: theme.palette.ink[900],
                fontWeight: 700,
                py: 1.5,
              }}
            >
              Enter Dashboard
            </Button>
          </Box>
        )}
      </Card>
    </Box>
  );
};

export default SetupWizard;
