import React, { useState, useMemo } from 'react';
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
  Avatar,
  IconButton,
  Tooltip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  InputAdornment,
} from '@mui/material';
import {
  PersonAddOutlined,
  FileUploadOutlined,
  FileDownloadOutlined,
  CheckCircleOutlined,
  AutoAwesomeOutlined,
  SchoolOutlined,
  BadgeOutlined,
  DeleteOutline,
  SearchOutlined,
  QrCode2Outlined,
  CloudUploadOutlined,
  ErrorOutline,
  ArrowForwardOutlined,
  RestartAltOutlined,
  GroupsOutlined,
  VerifiedUserOutlined,
  AccountBalanceOutlined,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import {
  useDepartmentsQuery,
  useCoursesQuery,
  useBranchesQuery,
} from '../../../queries/collegeQueries';
import { useRegisterMutation, useUsersQuery } from '../../../queries/userQueries';
import { useToast } from '../../../contexts/ToastContext';

// Single admission validation schema
const singleAdmissionSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long').max(60, 'Name cannot exceed 60 characters').trim(),
  email: z.string().min(1, 'Email cannot be empty').email('Invalid email address format').trim().toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  rollNumber: z.string().min(1, 'Roll number is required').trim(),
  departmentId: z.string().min(1, 'Please select a department'),
  courseId: z.string().min(1, 'Please select a degree course'),
  branchId: z.string().min(1, 'Please select a branch specialization'),
  semester: z.number().min(1, 'Semester is required').max(12, 'Semester cannot exceed 12'),
  gender: z.string().optional(),
});

export const AdmissionsHub = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [tabIndex, setTabIndex] = useState(0);

  // CSV Batch Upload state
  const [csvFile, setCsvFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [csvProcessing, setCsvProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [batchSearch, setBatchSearch] = useState('');

  // Admission Confirmation Pass Modal
  const [successModalData, setSuccessModalData] = useState(null);

  // Queries & Mutations
  const { data: depts, isLoading: loadingDepts } = useDepartmentsQuery();
  const { data: courses, isLoading: loadingCourses } = useCoursesQuery();
  const { data: branches, isLoading: loadingBranches } = useBranchesQuery();
  const { data: studentsData } = useUsersQuery({ role: 'STUDENT', limit: 10 });
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
      gender: 'MALE',
    },
  });

  const watchName = watch('name');
  const watchEmail = watch('email');
  const watchRoll = watch('rollNumber');
  const selectedDept = watch('departmentId');
  const selectedCourse = watch('courseId');
  const selectedBranch = watch('branchId');
  const watchSemester = watch('semester');

  // Filtered branches by course
  const filteredBranches = useMemo(() => {
    if (!selectedCourse || !branches) return [];
    return branches.filter(
      (b) => String(b.courseId?._id || b.courseId) === String(selectedCourse)
    );
  }, [selectedCourse, branches]);

  // Object references for live card preview
  const deptObj = useMemo(() => depts?.find((d) => String(d._id) === String(selectedDept)), [depts, selectedDept]);
  const courseObj = useMemo(() => courses?.find((c) => String(c._id) === String(selectedCourse)), [courses, selectedCourse]);
  const branchObj = useMemo(() => branches?.find((b) => String(b._id) === String(selectedBranch)), [branches, selectedBranch]);

  // Quick Demo Auto-fill
  const handleAutoFillDemo = () => {
    const randomNum = Math.floor(100 + Math.random() * 900);
    const demoDept = depts?.[0];
    const demoCourse = courses?.[0];
    const matchingBranches = branches?.filter(
      (b) => String(b.courseId?._id || b.courseId) === String(demoCourse?._id)
    );
    const demoBranch = matchingBranches?.[0] || branches?.[0];

    const currentYear = new Date().getFullYear();
    const branchCode = demoBranch?.code || 'CSE';

    setValue('name', 'Aarav Mehta');
    setValue('email', `aarav.mehta.${randomNum}@campussphere.edu`);
    setValue('password', 'Student@123');
    setValue('rollNumber', `${currentYear}-${branchCode}-${randomNum}`);
    if (demoDept) setValue('departmentId', String(demoDept._id));
    if (demoCourse) setValue('courseId', String(demoCourse._id));
    if (demoBranch) setValue('branchId', String(demoBranch._id));
    setValue('semester', 1);
    showToast('Auto-filled student demo data into admission form.');
  };

  // Auto suggest roll number based on course & branch selection
  const handleAutoSuggestRollNo = () => {
    const currentYear = new Date().getFullYear();
    const branchCode = branchObj?.code || courseObj?.code || 'STD';
    const randomSeq = Math.floor(100 + Math.random() * 900);
    const suggested = `${currentYear}-${branchCode}-${randomSeq}`;
    setValue('rollNumber', suggested);
  };

  // Submit Single Admission
  const onSingleSubmit = async (data) => {
    try {
      const res = await registerMutation.mutateAsync({
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

      const studentRecord = res.data?.user || {
        name: data.name,
        email: data.email,
        rollNumber: data.rollNumber,
      };

      setSuccessModalData({
        ...studentRecord,
        deptName: deptObj?.name || 'Department',
        courseName: courseObj?.name || 'Course',
        branchName: branchObj?.name || 'Branch',
        semester: data.semester,
      });

      showToast(`Student ${data.name} admitted successfully!`);
      reset({
        name: '',
        email: '',
        password: 'Student@123',
        rollNumber: '',
        departmentId: '',
        courseId: '',
        branchId: '',
        semester: 1,
        gender: 'MALE',
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
    const sampleRow1 = ['Rohan Sharma', 'rohan.sharma@campussphere.edu', '2026-CSE-101', 'CSE-DEPT', 'B.TECH', 'CSE', '1'];
    const sampleRow2 = ['Priya Patel', 'priya.patel@campussphere.edu', '2026-ECE-102', 'ECE-DEPT', 'B.TECH', 'ECE', '1'];
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), sampleRow1.join(','), sampleRow2.join(',')].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'student_batch_admissions_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Downloaded sample admissions CSV template.');
  };

  // Handle CSV file upload & client-side validation
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
        const name = parts[0] || '';
        const email = parts[1] || '';
        const rollNumber = parts[2] || '';
        const deptCode = parts[3] || '';
        const courseCode = parts[4] || '';
        const branchCode = parts[5] || '';
        const semester = parts[6] || '1';

        let validationStatus = 'VALID';
        let statusMessage = 'Ready for enrollment';

        if (!name || !email || !rollNumber) {
          validationStatus = 'INVALID';
          statusMessage = 'Missing required name/email/roll fields';
        }

        return {
          id: idx + 1,
          name,
          email,
          rollNumber,
          deptCode,
          courseCode,
          branchCode,
          semester,
          validationStatus,
          statusMessage,
        };
      });

      setParsedRows(rows);
      showToast(`Parsed ${rows.length} student admission record(s) from CSV.`);
    };
    reader.readAsText(file);
  };

  // Delete parsed row from preview
  const handleDeleteParsedRow = (id) => {
    setParsedRows((prev) => prev.filter((r) => r.id !== id));
    showToast('Removed student row from batch preview.');
  };

  // Submit Batch CSV Admissions
  const handleProcessBatchImport = async () => {
    const validRows = parsedRows.filter((r) => r.validationStatus !== 'INVALID');
    if (validRows.length === 0) {
      showToast('No valid rows available to import.', { severity: 'error' });
      return;
    }

    setCsvProcessing(true);
    setBatchProgress(0);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      const matchedDept = depts?.find((d) => d.code === row.deptCode) || depts?.[0];
      const matchedCourse = courses?.find((c) => c.code === row.courseCode) || courses?.[0];
      const matchedBranch = branches?.find((b) => b.code === row.branchCode) || branches?.[0];

      if (matchedDept && matchedCourse && matchedBranch) {
        try {
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
        } catch (e) {
          failCount++;
        }
      } else {
        failCount++;
      }

      setBatchProgress(Math.round(((i + 1) / validRows.length) * 100));
    }

    setCsvProcessing(false);
    showToast(`Batch Import Complete: ${successCount} enrolled successfully, ${failCount} skipped/failed.`);
    setParsedRows([]);
    setCsvFile(null);
  };

  // Filtered parsed rows for search
  const filteredParsedRows = useMemo(() => {
    if (!batchSearch.trim()) return parsedRows;
    const query = batchSearch.toLowerCase();
    return parsedRows.filter(
      (r) =>
        r.name.toLowerCase().includes(query) ||
        r.email.toLowerCase().includes(query) ||
        r.rollNumber.toLowerCase().includes(query) ||
        r.deptCode.toLowerCase().includes(query)
    );
  }, [parsedRows, batchSearch]);

  const recentStudentsList = studentsData?.data || [];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      {/* ── 1. Header Identity & Admission KPI Dashboard ─────────────────────── */}
      <Card
        sx={{
          p: 3.5,
          borderRadius: '16px',
          border: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
          background: `linear-gradient(135deg, ${theme.palette.primary.main}12 0%, ${theme.palette.secondary.main}08 100%)`,
          boxShadow: 'none',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <Chip
                icon={<SchoolOutlined sx={{ fontSize: '0.9rem !important', color: `${theme.palette.primary.main} !important` }} />}
                label="STUDENT ADMISSIONS COMMAND CENTER"
                size="small"
                sx={{
                  bgcolor: `${theme.palette.primary.main}18`,
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
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5, maxWidth: 640 }}>
              Admit new students into academic programs with live roll number auto-generation, department quota verification, and bulk CSV spreadsheet enrollment.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<FileDownloadOutlined />}
              onClick={handleDownloadSampleCsv}
              sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
            >
              CSV Template
            </Button>
            <Button
              variant="contained"
              startIcon={<GroupsOutlined />}
              onClick={() => navigate('/admin/users')}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 700,
                background: theme.palette.primary.gradient || theme.palette.primary.main,
                color: '#ffffff',
              }}
            >
              View Student Roster
            </Button>
          </Box>
        </Box>

        {/* Admission Executive KPI Strip */}
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12} sm={4}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: '12px',
                bgcolor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <Avatar sx={{ bgcolor: `${theme.palette.primary.main}15`, color: theme.palette.primary.main, width: 44, height: 44 }}>
                <PersonAddOutlined fontSize="small" />
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Departments Available
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: theme.palette.ink[900] }}>
                  {loadingDepts ? '...' : depts?.length || 0} Academic Depts
                </Typography>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: '12px',
                bgcolor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <Avatar sx={{ bgcolor: `${theme.palette.signal.success}15`, color: theme.palette.signal.success, width: 44, height: 44 }}>
                <AccountBalanceOutlined fontSize="small" />
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Degree Courses
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: theme.palette.ink[900] }}>
                  {loadingCourses ? '...' : courses?.length || 0} Programs Active
                </Typography>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: '12px',
                bgcolor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <Avatar sx={{ bgcolor: `${theme.palette.signal.info}15`, color: theme.palette.signal.info, width: 44, height: 44 }}>
                <VerifiedUserOutlined fontSize="small" />
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Branch Specializations
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: theme.palette.ink[900] }}>
                  {loadingBranches ? '...' : branches?.length || 0} Specializations
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Card>

      {/* ── 2. Admissions Studio Tabs ────────────────────────────────────────── */}
      <Card sx={{ borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, pt: 1, bgcolor: theme.custom?.surface?.sunken || 'rgba(0,0,0,0.01)' }}>
          <Tabs value={tabIndex} onChange={(e, val) => setTabIndex(val)} sx={{ '& .MuiTab-root': { py: 2 } }}>
            <Tab label="Single Admission Desk" icon={<PersonAddOutlined />} iconPosition="start" sx={{ fontWeight: 700, textTransform: 'none' }} />
            <Tab label="Bulk CSV Batch Import Studio" icon={<FileUploadOutlined />} iconPosition="start" sx={{ fontWeight: 700, textTransform: 'none' }} />
            <Tab label="Recent Admissions Log" icon={<GroupsOutlined />} iconPosition="start" sx={{ fontWeight: 700, textTransform: 'none' }} />
          </Tabs>
        </Box>

        <Box sx={{ p: { xs: 2.5, md: 4 } }}>
          {/* ── TAB 0: Single Admission Desk (Form + Live Digital Pass Preview) ── */}
          {tabIndex === 0 && (
            <Grid container spacing={4}>
              {/* Left Column: Admission Form */}
              <Grid item xs={12} lg={7}>
                <Box component="form" onSubmit={handleSubmit(onSingleSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: theme.palette.ink[900] }}>
                        New Student Admission Form
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Fill in student academic credentials to generate an official enrollment account.
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      startIcon={<AutoAwesomeOutlined />}
                      onClick={handleAutoFillDemo}
                      sx={{ textTransform: 'none', fontWeight: 700, color: theme.palette.primary.main }}
                    >
                      Fill Demo Data
                    </Button>
                  </Box>

                  <Grid container spacing={2.5}>
                    <Grid item xs={12} sm={6}>
                      <Typography component="label" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, mb: 1 }}>
                        Student Full Name *
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="e.g. Aarav Mehta"
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
                        placeholder="e.g. aarav.mehta@campussphere.edu"
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
                          Auto-Suggest
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
                        Temporary Password *
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        type="text"
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
                        value={selectedDept || ''}
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
                        value={selectedCourse || ''}
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
                        value={selectedBranch || ''}
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
                        Initial Semester *
                      </Typography>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        value={watchSemester ?? 1}
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

                  <Box sx={{ mt: 1, display: 'flex', gap: 2 }}>
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
                      {registerMutation.isPending ? 'Processing Admission...' : 'Confirm & Admit Student'}
                    </Button>
                    <Button
                      type="button"
                      variant="outlined"
                      onClick={() => reset()}
                      startIcon={<RestartAltOutlined />}
                      sx={{ borderRadius: '8px', color: theme.palette.text.secondary, borderColor: theme.palette.divider }}
                    >
                      Reset Form
                    </Button>
                  </Box>
                </Box>
              </Grid>

              {/* Right Column: Live Student Admission Digital Card Preview */}
              <Grid item xs={12} lg={5}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3.5,
                    borderRadius: '16px',
                    border: `1px solid ${theme.palette.primary.main}30`,
                    background: `linear-gradient(145deg, ${theme.palette.background.paper} 0%, ${theme.palette.primary.main}08 100%)`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    position: 'sticky',
                    top: 24,
                  }}
                >
                  <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                    <Chip
                      label="LIVE ID CARD PREVIEW"
                      size="small"
                      sx={{
                        bgcolor: `${theme.palette.primary.main}15`,
                        color: theme.palette.primary.main,
                        fontWeight: 800,
                        fontSize: '0.65rem',
                      }}
                    />
                    <BadgeOutlined sx={{ color: theme.palette.primary.main }} />
                  </Box>

                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      bgcolor: `${theme.palette.primary.main}20`,
                      color: theme.palette.primary.main,
                      fontWeight: 800,
                      fontSize: '2rem',
                      mb: 2,
                      border: `3px solid ${theme.palette.primary.main}`,
                    }}
                  >
                    {watchName ? watchName.charAt(0).toUpperCase() : 'S'}
                  </Avatar>

                  <Typography variant="h6" sx={{ fontWeight: 800, color: theme.palette.ink[900] }}>
                    {watchName || 'Student Name'}
                  </Typography>

                  <Typography variant="body2" sx={{ fontFamily: theme.typography.mono.fontFamily, color: theme.palette.primary.main, fontWeight: 700, mt: 0.5 }}>
                    {watchRoll || '2026-ROLL-NUMBER'}
                  </Typography>

                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                    {watchEmail || 'student.email@campussphere.edu'}
                  </Typography>

                  <Box sx={{ width: '100%', bgcolor: theme.palette.background.paper, p: 2, borderRadius: '12px', border: `1px solid ${theme.palette.divider}`, textAlign: 'left', mb: 2.5 }}>
                    <Grid container spacing={1.5}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                          DEPARTMENT
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>
                          {deptObj?.code || 'Not Selected'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                          DEGREE COURSE
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>
                          {courseObj?.code || 'Not Selected'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                          SPECIALIZATION
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>
                          {branchObj?.code || 'Not Selected'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                          SEMESTER
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>
                          Semester {watchSemester || 1}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: theme.palette.text.secondary }}>
                    <QrCode2Outlined sx={{ fontSize: 28 }} />
                    <Typography variant="caption" sx={{ fontSize: '0.7rem', textAlign: 'left' }}>
                      Official CampusSphere Digital ID Voucher Generated upon Admission Confirmation
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          )}

          {/* ── TAB 1: Bulk CSV Batch Import Studio ────────────────────────── */}
          {tabIndex === 1 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: theme.palette.ink[900] }}>
                    Bulk CSV Spreadsheet Enrollment Studio
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Upload a batch spreadsheet to enroll dozens or hundreds of students simultaneously into departments.
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<FileDownloadOutlined />}
                  onClick={handleDownloadSampleCsv}
                  sx={{ borderRadius: '8px', fontWeight: 600 }}
                >
                  Download Sample CSV Template
                </Button>
              </Box>

              {/* Upload Dropzone */}
              <Box
                component="label"
                htmlFor="admissions-csv-upload"
                sx={{
                  border: `2px dashed ${theme.palette.primary.main}`,
                  borderRadius: '16px',
                  p: 5,
                  textAlign: 'center',
                  bgcolor: `${theme.palette.primary.main}04`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: `${theme.palette.primary.main}0E`,
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
                <CloudUploadOutlined sx={{ fontSize: 52, color: theme.palette.primary.main, mb: 1.5 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: theme.palette.ink[900] }}>
                  {csvFile ? csvFile.name : 'Click to Upload or Drag & Drop Admissions CSV File'}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  Columns Required: Name, Email, RollNumber, DepartmentCode, CourseCode, BranchCode, Semester
                </Typography>
              </Box>

              {/* Progress indicator during batch processing */}
              {csvProcessing && (
                <Paper elevation={0} sx={{ p: 3, borderRadius: '12px', border: `1px solid ${theme.palette.primary.main}40`, bgcolor: `${theme.palette.primary.main}08` }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                      Executing Batch Student Enrollment...
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: theme.palette.primary.main }}>
                      {batchProgress}%
                    </Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={batchProgress} sx={{ height: 8, borderRadius: 4 }} />
                </Paper>
              )}

              {/* Parsed Rows Preview Table with Search & Filtering */}
              {parsedRows.length > 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <TextField
                      size="small"
                      placeholder="Search parsed records by name, email, roll no..."
                      value={batchSearch}
                      onChange={(e) => setBatchSearch(e.target.value)}
                      sx={{ width: 320 }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchOutlined sx={{ fontSize: 20, color: theme.palette.text.secondary }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                    <Button
                      variant="contained"
                      disabled={csvProcessing}
                      startIcon={csvProcessing ? <CircularProgress size={18} color="inherit" /> : <CheckCircleOutlined />}
                      onClick={handleProcessBatchImport}
                      sx={{
                        fontWeight: 700,
                        borderRadius: '8px',
                        px: 3,
                        background: theme.palette.primary.gradient || theme.palette.primary.main,
                        color: '#ffffff',
                      }}
                    >
                      {csvProcessing ? 'Enrolling Batch...' : `Confirm & Admit Batch (${parsedRows.length} Students)`}
                    </Button>
                  </Box>

                  <TableContainer sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: '12px', maxHeight: 380 }}>
                    <Table size="small" stickyHeader>
                      <TableHead sx={{ bgcolor: theme.custom?.surface?.sunken || 'rgba(0,0,0,0.02)' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>STUDENT NAME</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>EMAIL</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>ROLL NO</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>DEPT / COURSE / BRANCH</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>SEM</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>STATUS</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>ACTIONS</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredParsedRows.map((r) => (
                          <TableRow key={r.id} hover>
                            <TableCell>{r.id}</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>{r.name}</TableCell>
                            <TableCell sx={{ fontFamily: theme.typography.mono.fontFamily, fontSize: '0.78rem' }}>{r.email}</TableCell>
                            <TableCell sx={{ fontFamily: theme.typography.mono.fontFamily, fontSize: '0.78rem', color: theme.palette.primary.main, fontWeight: 700 }}>
                              {r.rollNumber}
                            </TableCell>
                            <TableCell sx={{ fontSize: '0.78rem' }}>
                              {r.deptCode || '—'} / {r.courseCode || '—'} / {r.branchCode || '—'}
                            </TableCell>
                            <TableCell sx={{ fontFamily: theme.typography.mono.fontFamily }}>Sem {r.semester}</TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                icon={r.validationStatus === 'VALID' ? <CheckCircleOutlined sx={{ fontSize: '0.8rem !important' }} /> : <ErrorOutline sx={{ fontSize: '0.8rem !important' }} />}
                                label={r.statusMessage}
                                color={r.validationStatus === 'VALID' ? 'success' : 'error'}
                                variant="outlined"
                                sx={{ fontSize: '0.7rem', fontWeight: 700 }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Tooltip title="Remove row from batch">
                                <IconButton size="small" onClick={() => handleDeleteParsedRow(r.id)} sx={{ color: theme.palette.signal.error }}>
                                  <DeleteOutline fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </Box>
          )}

          {/* ── TAB 2: Recent Admissions Stream Log ────────────────────────── */}
          {tabIndex === 2 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: theme.palette.ink[900] }}>
                    Recent Student Admissions Activity Stream
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    List of students enrolled in recent sessions across all departments.
                  </Typography>
                </Box>
                <Button
                  size="small"
                  onClick={() => navigate('/admin/users')}
                  endIcon={<ArrowForwardOutlined />}
                  sx={{ textTransform: 'none', fontWeight: 700, color: theme.palette.primary.main }}
                >
                  Manage All Students
                </Button>
              </Box>

              <TableContainer sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: '12px' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: theme.custom?.surface?.sunken || 'rgba(0,0,0,0.02)' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>STUDENT</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>ROLL NUMBER</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>DEPARTMENT</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>COURSE / BRANCH</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>SEMESTER</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>STATUS</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentStudentsList.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4, color: theme.palette.text.secondary }}>
                          No recent student admission records found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      recentStudentsList.slice(0, 8).map((st) => (
                        <TableRow key={st._id || st.id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Avatar sx={{ width: 32, height: 32, bgcolor: `${theme.palette.primary.main}15`, color: theme.palette.primary.main, fontSize: '0.82rem', fontWeight: 700 }}>
                                {st.name?.charAt(0)}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.ink[900] }}>
                                  {st.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {st.email}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ fontFamily: theme.typography.mono.fontFamily, fontWeight: 700, color: theme.palette.primary.main, fontSize: '0.8rem' }}>
                            {st.studentProfile?.rollNumber || st.rollNumber || '—'}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.82rem' }}>
                            {st.departmentId?.name || st.departmentId?.code || '—'}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.82rem' }}>
                            {st.courseId?.code || '—'} / {st.branchId?.code || '—'}
                          </TableCell>
                          <TableCell sx={{ fontFamily: theme.typography.mono.fontFamily, fontSize: '0.82rem' }}>
                            Sem {st.studentProfile?.semester || st.semester || 1}
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={st.status || 'ACTIVE'}
                              size="small"
                              color={st.status === 'INACTIVE' ? 'error' : 'success'}
                              sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </Box>
      </Card>

      {/* ── 3. Student Admission Receipt Confirmation Modal ─────────────────── */}
      {Boolean(successModalData) && (
        <Dialog
          open
          onClose={() => setSuccessModalData(null)}
          maxWidth="xs"
          fullWidth
          PaperProps={{ sx: { borderRadius: 4, p: 1 } }}
        >
          <DialogTitle sx={{ textAlign: 'center', pt: 3, pb: 1 }}>
            <Avatar sx={{ width: 64, height: 64, bgcolor: `${theme.palette.signal.success}18`, color: theme.palette.signal.success, mx: 'auto', mb: 1.5 }}>
              <CheckCircleOutlined sx={{ fontSize: 36 }} />
            </Avatar>
            <Typography variant="h5" sx={{ fontWeight: 800, color: theme.palette.ink[900] }}>
              Admission Confirmed!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Official student account has been created.
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: '12px', bgcolor: theme.custom?.surface?.sunken || 'rgba(0,0,0,0.02)', border: `1px solid ${theme.palette.divider}` }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary">NAME</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{successModalData?.name}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary">ROLL NUMBER</Typography>
                  <Typography variant="body2" sx={{ fontFamily: theme.typography.mono.fontFamily, fontWeight: 800, color: theme.palette.primary.main }}>
                    {successModalData?.rollNumber}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary">EMAIL</Typography>
                  <Typography variant="body2" sx={{ fontFamily: theme.typography.mono.fontFamily, fontSize: '0.78rem' }}>
                    {successModalData?.email}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary">COURSE / BRANCH</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {successModalData?.courseName} ({successModalData?.branchName})
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 1, justifyContent: 'space-between' }}>
            <Button variant="outlined" onClick={() => setSuccessModalData(null)} sx={{ borderRadius: '8px' }}>
              Close
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                setSuccessModalData(null);
                navigate('/admin/users');
              }}
              sx={{
                borderRadius: '8px',
                fontWeight: 700,
                background: theme.palette.primary.gradient || theme.palette.primary.main,
                color: '#ffffff',
              }}
            >
              View in Users Roster
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default AdmissionsHub;
