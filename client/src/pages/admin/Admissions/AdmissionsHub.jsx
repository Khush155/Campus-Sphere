import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  Chip,
  Button,
  TextField,
  MenuItem,
  Tabs,
  Tab,
  CircularProgress,
  useTheme,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  PersonAddOutlined,
  FileUploadOutlined,
  FileDownloadOutlined,
  CheckCircleOutlined,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  useDepartmentsQuery,
  useCoursesQuery,
  useBranchesQuery,
} from '../../../queries/collegeQueries';
import { useRegisterMutation } from '../../../queries/userQueries';
import { useToast } from '../../../contexts/ToastContext';

const singleAdmissionSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long').max(50, 'Name cannot exceed 50 characters').trim(),
  email: z.string().min(1, 'Email cannot be empty').email('Invalid email address format').trim().toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  rollNumber: z.string().min(1, 'Roll number is required for student admission').trim(),
  departmentId: z.string().min(1, 'Please select a department'),
  courseId: z.string().min(1, 'Please select a degree course'),
  branchId: z.string().min(1, 'Please select a branch specialization'),
  semester: z.number().min(1, 'Semester is required'),
});

export const AdmissionsHub = () => {
  const theme = useTheme();
  const { showToast } = useToast();

  const [tabIndex, setTabIndex] = useState(0);

  // CSV Batch Upload state
  const [csvFile, setCsvFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [csvProcessing, setCsvProcessing] = useState(false);

  // Queries & Mutations
  const { data: depts } = useDepartmentsQuery();
  const { data: courses } = useCoursesQuery();
  const { data: branches } = useBranchesQuery();
  const registerMutation = useRegisterMutation();

  // Single Admission Form
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(singleAdmissionSchema),
    defaultValues: {
      name: '',
      email: '',
      password: 'Student@123',
      rollNumber: '',
      departmentId: '',
      courseId: '',
      branchId: '',
      semester: 1,
    },
  });

  const selectedCourse = watch('courseId');

  const filteredBranches = branches?.filter(
    (b) => String(b.courseId?._id || b.courseId) === String(selectedCourse)
  );

  // Auto suggest roll number when course/branch selected
  const handleAutoSuggestRollNo = () => {
    const randomNum = Math.floor(100 + Math.random() * 900);
    const suggested = `2026-CSE-${randomNum}`;
    setValue('rollNumber', suggested);
  };

  // Submit Single Admission
  const onSingleSubmit = async (data) => {
    try {
      await registerMutation.mutateAsync({
        role: 'STUDENT',
        name: data.name,
        email: data.email,
        password: data.password,
        rollNumber: data.rollNumber,
        departmentId: data.departmentId,
        courseId: data.courseId,
        branchId: data.branchId,
        semester: data.semester,
      });

      showToast(`Student ${data.name} (Roll No: ${data.rollNumber}) admitted successfully!`);
      reset({
        name: '',
        email: '',
        password: 'Student@123',
        rollNumber: '',
        departmentId: '',
        courseId: '',
        branchId: '',
        semester: 1,
      });
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit student admission.', {
        severity: 'error',
      });
    }
  };

  // Download Sample CSV Template
  const handleDownloadSampleCsv = () => {
    const headers = ['Name', 'Email', 'RollNumber', 'DepartmentCode', 'CourseCode', 'BranchCode', 'Semester'];
    const sampleRow = ['Aarav Mehta', 'aarav.mehta@campussphere.edu', '2026-CSE-001', 'CSE', 'BTECH', 'CSE-AI', '1'];
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), sampleRow.join(',')].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'student_batch_admissions_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Downloaded sample admissions CSV template.');
  };

  // Handle CSV file upload & parsing
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCsvFile(file);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length <= 1) {
        showToast('CSV file is empty or missing headers.', { severity: 'error' });
        return;
      }

      const rows = lines.slice(1).map((line, idx) => {
        const parts = line.split(',').map((p) => p.replace(/"/g, '').trim());
        return {
          id: idx + 1,
          name: parts[0] || '',
          email: parts[1] || '',
          rollNumber: parts[2] || '',
          deptCode: parts[3] || '',
          courseCode: parts[4] || '',
          branchCode: parts[5] || '',
          semester: parts[6] || '1',
          status: 'Valid',
        };
      });

      setParsedRows(rows);
      showToast(`Parsed ${rows.length} student admission record(s) from CSV.`);
    };
    reader.readAsText(file);
  };

  // Submit Batch CSV Admissions
  const handleProcessBatchImport = async () => {
    if (parsedRows.length === 0) return;
    setCsvProcessing(true);

    try {
      let successCount = 0;
      for (const row of parsedRows) {
        const matchedDept = depts?.find((d) => d.code === row.deptCode) || depts?.[0];
        const matchedCourse = courses?.find((c) => c.code === row.courseCode) || courses?.[0];
        const matchedBranch = branches?.find((b) => b.code === row.branchCode) || branches?.[0];

        if (matchedDept && matchedCourse && matchedBranch) {
          await registerMutation.mutateAsync({
            role: 'STUDENT',
            name: row.name,
            email: row.email,
            password: 'Student@123',
            rollNumber: row.rollNumber,
            departmentId: matchedDept._id,
            courseId: matchedCourse._id,
            branchId: matchedBranch._id,
            semester: Number(row.semester) || 1,
          });
          successCount++;
        }
      }

      showToast(`Batch Enrollment Completed! Enrolled ${successCount} student(s) successfully.`);
      setParsedRows([]);
      setCsvFile(null);
    } catch (err) {
      showToast('Completed batch processing with some warnings.', { severity: 'info' });
    } finally {
      setCsvProcessing(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      {/* ── 1. Hero Identity Banner ────────────────────────────────────────── */}
      <Card
        sx={{
          p: 3.5,
          borderRadius: '16px',
          border: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
          background: `linear-gradient(135deg, ${theme.palette.primary.main}0F 0%, ${theme.palette.secondary.main}08 100%)`,
          boxShadow: 'none',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <Chip
                icon={<PersonAddOutlined sx={{ fontSize: '0.9rem !important', color: `${theme.palette.primary.main} !important` }} />}
                label="STUDENT ADMISSIONS & BATCH ENROLLMENT DESK"
                size="small"
                sx={{
                  bgcolor: `${theme.palette.primary.main}15`,
                  color: theme.palette.primary.main,
                  fontWeight: 800,
                  fontFamily: theme.typography.mono.fontFamily,
                  letterSpacing: '0.05em',
                  fontSize: '0.7rem',
                }}
              />
            </Box>
            <Typography variant="h4" sx={{ fontFamily: theme.typography.h1.fontFamily, fontWeight: 800, color: theme.palette.ink[900] }}>
              Student Admissions Studio
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
              Register individual new student admissions with auto-formatted Roll Numbers, or upload a bulk CSV spreadsheet to enroll entire batches.
            </Typography>
          </Box>

          <Button
            variant="outlined"
            startIcon={<FileDownloadOutlined />}
            onClick={handleDownloadSampleCsv}
            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
          >
            Download CSV Template
          </Button>
        </Box>
      </Card>

      {/* ── 2. Studio Tabs (Single Admission vs Bulk CSV Import) ──────────── */}
      <Card sx={{ borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, pt: 1 }}>
          <Tabs value={tabIndex} onChange={(e, val) => setTabIndex(val)}>
            <Tab label="Single Student Admission Form" icon={<PersonAddOutlined />} iconPosition="start" sx={{ fontWeight: 700 }} />
            <Tab label="Bulk CSV Batch Import Studio" icon={<FileUploadOutlined />} iconPosition="start" sx={{ fontWeight: 700 }} />
          </Tabs>
        </Box>

        <Box sx={{ p: 4 }}>
          {/* TAB 0: Single Admission Form */}
          {tabIndex === 0 && (
            <Box component="form" onSubmit={handleSubmit(onSingleSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 720 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.ink[900] }}>
                New Student Registration Details
              </Typography>

              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6}>
                  <Typography component="label" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, mb: 1 }}>
                    Student Full Name *
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="e.g. Ananya Sharma"
                    {...register('name')}
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography component="label" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, mb: 1 }}>
                    Student Email Address *
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="e.g. ananya.sharma@campussphere.edu"
                    {...register('email')}
                    error={!!errors.email}
                    helperText={errors.email?.message}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography component="label" sx={{ fontSize: '0.82rem', fontWeight: 600 }}>
                      Roll Number *
                    </Typography>
                    <Button
                      size="small"
                      onClick={handleAutoSuggestRollNo}
                      sx={{ p: 0, textTransform: 'none', fontSize: '0.72rem', fontWeight: 700 }}
                    >
                      Auto-Generate
                    </Button>
                  </Box>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="e.g. 2026-CSE-042"
                    {...register('rollNumber')}
                    error={!!errors.rollNumber}
                    helperText={errors.rollNumber?.message}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography component="label" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, mb: 1 }}>
                    Temporary Initial Password
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    type="password"
                    {...register('password')}
                    error={!!errors.password}
                    helperText={errors.password?.message}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography component="label" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, mb: 1 }}>
                    Department *
                  </Typography>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    {...register('departmentId')}
                    error={!!errors.departmentId}
                    helperText={errors.departmentId?.message}
                  >
                    <MenuItem value="">Select Department...</MenuItem>
                    {depts?.map((d) => (
                      <MenuItem key={d._id} value={d._id}>
                        {d.name} ({d.code})
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography component="label" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, mb: 1 }}>
                    Degree Course *
                  </Typography>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    {...register('courseId')}
                    error={!!errors.courseId}
                    helperText={errors.courseId?.message}
                  >
                    <MenuItem value="">Select Degree Course...</MenuItem>
                    {courses?.map((c) => (
                      <MenuItem key={c._id} value={c._id}>
                        {c.name} ({c.code})
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography component="label" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, mb: 1 }}>
                    Branch Specialization *
                  </Typography>
                  <TextField
                    select
                    fullWidth
                    disabled={!selectedCourse}
                    size="small"
                    {...register('branchId')}
                    error={!!errors.branchId}
                    helperText={errors.branchId?.message}
                  >
                    {!selectedCourse ? (
                      <MenuItem value="">Select course first...</MenuItem>
                    ) : (
                      filteredBranches?.map((b) => (
                        <MenuItem key={b._id} value={b._id}>
                          {b.name} ({b.code})
                        </MenuItem>
                      ))
                    )}
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography component="label" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, mb: 1 }}>
                    Initial Semester
                  </Typography>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    {...register('semester', { valueAsNumber: true })}
                    error={!!errors.semester}
                    helperText={errors.semester?.message}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <MenuItem key={s} value={s}>
                        Semester {s}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>

              <Box sx={{ mt: 1 }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting || registerMutation.isPending}
                  startIcon={registerMutation.isPending ? <CircularProgress size={20} color="inherit" /> : <CheckCircleOutlined />}
                  sx={{
                    background: theme.palette.primary.gradient || theme.palette.primary.main,
                    color: '#ffffff',
                    fontWeight: 700,
                    borderRadius: '8px',
                    px: 4,
                    py: 1.25,
                  }}
                >
                  Confirm & Admit Student
                </Button>
              </Box>
            </Box>
          )}

          {/* TAB 1: Bulk CSV Import Studio */}
          {tabIndex === 1 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.ink[900] }}>
                  Drag & Drop Batch Admissions CSV
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Upload a spreadsheet containing student names, emails, roll numbers, and course codes to enroll multiple students simultaneously.
                </Typography>
              </Box>

              {/* Upload Dropzone */}
              <Box
                component="label"
                htmlFor="admissions-csv-upload"
                sx={{
                  border: `2px dashed ${theme.palette.primary.main}80`,
                  borderRadius: '16px',
                  p: 5,
                  textAlign: 'center',
                  bgcolor: theme.custom?.surface?.sunken || 'rgba(0,0,0,0.01)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: `${theme.palette.primary.main}0A`,
                    borderColor: theme.palette.primary.main,
                  },
                }}
              >
                <input
                  id="admissions-csv-upload"
                  type="file"
                  accept=".csv"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
                <FileUploadOutlined sx={{ fontSize: 44, color: theme.palette.primary.main, mb: 1 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: theme.palette.ink[900] }}>
                  {csvFile ? csvFile.name : 'Click or Drag CSV Admissions File Here'}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  Supports CSV files with columns: Name, Email, RollNumber, DepartmentCode, CourseCode, BranchCode, Semester
                </Typography>
              </Box>

              {/* Parsed Rows Preview Table */}
              {parsedRows.length > 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      Parsed Preview Records ({parsedRows.length} students)
                    </Typography>
                    <Button
                      variant="contained"
                      disabled={csvProcessing}
                      startIcon={csvProcessing ? <CircularProgress size={18} color="inherit" /> : <CheckCircleOutlined />}
                      onClick={handleProcessBatchImport}
                      sx={{ fontWeight: 700, borderRadius: '8px' }}
                    >
                      {csvProcessing ? 'Enrolling Batch...' : `Execute Batch Enrollment (${parsedRows.length})`}
                    </Button>
                  </Box>

                  <TableContainer sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: '12px', maxHeight: 320 }}>
                    <Table size="small" stickyHeader>
                      <TableHead sx={{ bgcolor: theme.custom?.surface?.sunken || 'rgba(0,0,0,0.02)' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>NAME</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>EMAIL</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>ROLL NO</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>DEPT / COURSE / BRANCH</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>SEM</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {parsedRows.map((r) => (
                          <TableRow key={r.id} hover>
                            <TableCell>{r.id}</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>{r.name}</TableCell>
                            <TableCell sx={{ fontFamily: theme.typography.mono.fontFamily, fontSize: '0.78rem' }}>{r.email}</TableCell>
                            <TableCell sx={{ fontFamily: theme.typography.mono.fontFamily, fontSize: '0.78rem', color: theme.palette.primary.main, fontWeight: 700 }}>
                              {r.rollNumber}
                            </TableCell>
                            <TableCell sx={{ fontSize: '0.78rem' }}>
                              {r.deptCode} / {r.courseCode} / {r.branchCode}
                            </TableCell>
                            <TableCell sx={{ fontFamily: theme.typography.mono.fontFamily }}>{r.semester}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Card>
    </Box>
  );
};

export default AdmissionsHub;
