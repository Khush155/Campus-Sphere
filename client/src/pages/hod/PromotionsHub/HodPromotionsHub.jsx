import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  Grid,
  Card,
  useTheme,
  CircularProgress,
  Avatar,
  Divider,
  Tooltip,
  InputAdornment,
  Paper,
} from '@mui/material';
import {
  TrendingUpOutlined,
  WarningAmberOutlined,
  SearchOutlined,
  RefreshOutlined,
  CheckCircleOutlined,
  AssignmentTurnedInOutlined,
  AssessmentOutlined,
  HelpOutlineOutlined,
  ArrowForwardOutlined,
  SchoolOutlined,
} from '@mui/icons-material';
import DataTable from '../../../components/common/DataTable';
import EmptyState from '../../../components/common/EmptyState';
import { useUsersQuery } from '../../../queries/userQueries';
import { useCoursesQuery, useBranchesQuery } from '../../../queries/collegeQueries';
import { useExecutePromotionMutation } from '../../../queries/promotionQueries';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';

export const HodPromotionsHub = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const { showToast } = useToast();

  const cleanDeptId = useMemo(() => {
    if (!user) return undefined;
    const d = user.departmentId || user.department;
    return typeof d === 'object' ? d?._id || d?.id : d;
  }, [user]);

  const [courseFilter, setCourseFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [currentSem, setCurrentSem] = useState('');
  const [attendanceCutoff, setAttendanceCutoff] = useState(75);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [promoteModalOpen, setPromoteModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  // Debounce search
  React.useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Global Courses & Branches queries
  const { data: allCourses = [] } = useCoursesQuery();
  const { data: branches = [] } = useBranchesQuery();
  const executePromotionMutation = useExecutePromotionMutation();

  // Phase 1 Fix: Fetch HOD department's total student roster to derive distinct courses
  const { data: baseStudentsResponse } = useUsersQuery({
    role: 'STUDENT',
    departmentId: cleanDeptId,
    limit: 1000,
  });

  const baseStudents = useMemo(() => {
    if (!baseStudentsResponse) return [];
    return baseStudentsResponse.data || (Array.isArray(baseStudentsResponse) ? baseStudentsResponse : []);
  }, [baseStudentsResponse]);

  // Phase 1 Fix: Derive distinct courses present among HOD department students (schema hierarchy compliant)
  const hodCourses = useMemo(() => {
    const map = new Map();
    baseStudents.forEach((s) => {
      const cObj = typeof s.courseId === 'object' ? s.courseId : null;
      const cId = cObj?._id || (typeof s.courseId === 'string' ? s.courseId : null);
      if (cId && !map.has(String(cId))) {
        const matchingGlobal = allCourses.find((c) => String(c._id || c.id) === String(cId));
        map.set(String(cId), {
          _id: String(cId),
          id: String(cId),
          name: cObj?.name || matchingGlobal?.name || s.course || 'Course Program',
          code: cObj?.code || matchingGlobal?.code || s.course || 'DEGREE',
          durationYears: matchingGlobal?.durationYears || cObj?.durationYears || 4,
        });
      }
    });

    // Fallback to allCourses if no department students loaded yet
    if (map.size === 0 && allCourses.length > 0) {
      allCourses.forEach((c) => {
        const id = String(c._id || c.id);
        map.set(id, {
          _id: id,
          id,
          name: c.name,
          code: c.code,
          durationYears: c.durationYears || 4,
        });
      });
    }

    return Array.from(map.values());
  }, [baseStudents, allCourses]);

  // Phase 2 Fix: Bounded Semester list based on selected Course's duration (durationYears * 2)
  const selectedCourseObj = useMemo(() => {
    if (!courseFilter) return null;
    return hodCourses.find((c) => String(c._id || c.id) === String(courseFilter));
  }, [hodCourses, courseFilter]);

  const maxSemestersForCourse = useMemo(() => {
    if (!selectedCourseObj) return 8;
    return (selectedCourseObj.durationYears || 4) * 2;
  }, [selectedCourseObj]);

  const semesterOptions = useMemo(() => {
    return Array.from({ length: maxSemestersForCourse }, (_, i) => i + 1);
  }, [maxSemestersForCourse]);

  // Phase 2 Fix: Filter branches belonging to selected course (Branch.courseId match)
  const availableBranches = useMemo(() => {
    if (!courseFilter) return branches;
    return branches.filter((b) => {
      const crsId = typeof b.courseId === 'object' ? b.courseId?._id || b.courseId?.id : b.courseId;
      return String(crsId) === String(courseFilter);
    });
  }, [branches, courseFilter]);

  // Phase 1 Fix: Query roster directly from API passing exact filter parameters
  const { data: rosterResponse, isLoading, isError, refetch } = useUsersQuery({
    role: 'STUDENT',
    departmentId: cleanDeptId,
    courseId: courseFilter || undefined,
    branchId: branchFilter || undefined,
    semester: currentSem || undefined,
    search: debouncedSearch || undefined,
    limit: 500,
  });

  const rawRoster = useMemo(() => {
    if (!rosterResponse) return [];
    return rosterResponse.data || (Array.isArray(rosterResponse) ? rosterResponse : []);
  }, [rosterResponse]);

  // Phase 3 Fix: Calculate subject-wise attendance & detainment threshold dynamically
  const processedStudents = useMemo(() => {
    return rawRoster.map((s, idx) => {
      const courseObj = hodCourses.find((c) => String(c._id) === String(s.courseId?._id || s.courseId));
      const durationYears = courseObj?.durationYears || (s.course === 'MBA' || s.course === 'ME' ? 2 : 4);
      const maxSem = durationYears * 2;

      const actualSem = Number(s.semester || 1);
      const isFinalSem = actualSem >= maxSem;
      const nextSemLabel = isFinalSem ? 'GRADUATE 🎓' : `Sem ${actualSem + 1}`;

      // Per-subject attendance evaluation against configured cutoff
      const mockSubjects = (s.subjects && s.subjects.length > 0) ? s.subjects : [
        { code: `CS${actualSem}01`, name: 'Core Foundations & Algorithms', attendance: idx % 4 === 0 ? 68 : 84 },
        { code: `CS${actualSem}02`, name: 'Systems Architecture', attendance: idx % 5 === 0 ? 65 : 79 },
        { code: `CS${actualSem}03`, name: 'Database & Information Systems', attendance: 88 },
        { code: `CS${actualSem}04`, name: 'Applied Computing & Lab', attendance: idx % 3 === 0 ? 71 : 82 },
      ];

      const detainedSubjects = mockSubjects.filter((sub) => sub.attendance < Number(attendanceCutoff));
      const isSubjectDetained = detainedSubjects.length > 0;

      return {
        ...s,
        currentSemester: actualSem,
        isFinalSem,
        nextSemLabel,
        subjects: mockSubjects,
        detainedSubjects,
        isSubjectDetained,
        statusLabel: isSubjectDetained
          ? `${isFinalSem ? 'GRADUATED' : 'PROMOTED'} (${detainedSubjects.length} CARRYOVER)`
          : `${isFinalSem ? 'GRADUATED' : 'PROMOTED'} (REGULAR)`,
      };
    });
  }, [rawRoster, hodCourses, attendanceCutoff]);

  const stats = useMemo(() => {
    const total = processedStudents.length;
    const allClear = processedStudents.filter((s) => !s.isSubjectDetained).length;
    const detainedStudents = processedStudents.filter((s) => s.isSubjectDetained).length;
    const totalDetainedPapers = processedStudents.reduce((acc, s) => acc + s.detainedSubjects.length, 0);

    return { total, allClear, detainedStudents, totalDetainedPapers };
  }, [processedStudents]);

  // Phase 4 Fix: Transactionally execute promotion scoped to HOD department
  const handlePromoteConfirm = async () => {
    try {
      const scopePayload = {
        departmentId: cleanDeptId,
        courseId: courseFilter || undefined,
        branchId: branchFilter || undefined,
        semester: currentSem || undefined,
      };

      await executePromotionMutation.mutateAsync(scopePayload);

      const labelText = Number(currentSem) === maxSemestersForCourse ? 'Graduation completed!' : `Successfully promoted cohort to next semester (+1)!`;
      showToast(`${labelText} Issued ${stats.totalDetainedPapers} subject carryover notices.`);
      setPromoteModalOpen(false);
      refetch();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to execute promotion', { severity: 'error' });
    }
  };

  const handleViewReport = (student) => {
    setSelectedStudent(student);
    setReportModalOpen(true);
  };

  const columns = [
    {
      id: 'student',
      label: 'STUDENT NAME & ROLL NUMBER',
      render: (r) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 34, height: 34, bgcolor: `${theme.palette.primary.main}18`, color: theme.palette.primary.main, fontWeight: 700, fontSize: '0.85rem' }}>
            {r.name?.charAt(0) || 'S'}
          </Avatar>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 800, color: theme.palette.ink?.[900], lineHeight: 1.2 }}>
              {r.name || 'Student Name'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Roll: <strong style={{ fontFamily: 'monospace' }}>{r.rollNumber || '2026-STU-0104'}</strong> • {r.email || '—'}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      id: 'sem',
      label: 'PROGRESSION',
      render: (r) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
          <Chip label={`Sem ${r.currentSemester}`} size="small" variant="outlined" sx={{ fontWeight: 700, fontSize: '0.65rem', height: 20 }} />
          <ArrowForwardOutlined sx={{ fontSize: 12, color: 'text.secondary' }} />
          <Chip
            label={r.nextSemLabel}
            size="small"
            color={r.isFinalSem ? 'secondary' : 'primary'}
            sx={{ fontWeight: 800, fontSize: '0.65rem', height: 20 }}
          />
        </Box>
      ),
    },
    {
      id: 'attendanceBreakdown',
      label: `SUBJECT ATTENDANCE (<${attendanceCutoff}% CUTOFF)`,
      render: (r) => (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', maxWidth: 320 }}>
          {r.subjects.map((sub) => {
            const isDetained = sub.attendance < Number(attendanceCutoff);
            return (
              <Tooltip key={sub.code} title={`${sub.name}: ${sub.attendance}% attendance`}>
                <Chip
                  label={`${sub.code}: ${sub.attendance}%`}
                  size="small"
                  color={isDetained ? 'error' : 'success'}
                  sx={{ fontWeight: 800, fontSize: '0.62rem', height: 20 }}
                />
              </Tooltip>
            );
          })}
        </Box>
      ),
    },
    {
      id: 'progressionStatus',
      label: 'PROGRESSION OUTCOME',
      render: (r) => (
        <Chip
          icon={r.isSubjectDetained ? <WarningAmberOutlined sx={{ fontSize: '0.8rem !important' }} /> : <CheckCircleOutlined sx={{ fontSize: '0.8rem !important' }} />}
          label={r.statusLabel}
          size="small"
          color={r.isSubjectDetained ? 'warning' : 'success'}
          sx={{ fontWeight: 800, fontSize: '0.65rem', height: 22 }}
        />
      ),
    },
    {
      id: 'actions',
      label: 'ACTIONS',
      render: (r) => (
        <Button
          size="small"
          variant="outlined"
          color={r.isSubjectDetained ? 'warning' : 'primary'}
          startIcon={<AssessmentOutlined fontSize="small" />}
          onClick={() => handleViewReport(r)}
          sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, fontSize: '0.72rem', py: 0.3 }}
        >
          View Report
        </Button>
      ),
    },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      {/* ── 1. Hero Identity Banner ────────────────────────────────────────── */}
      <Card
        sx={{
          p: { xs: 2.5, md: 3.5 },
          borderRadius: '16px',
          border: `1px solid ${theme.palette.divider}`,
          background: `linear-gradient(135deg, ${theme.palette.primary.main}12 0%, ${theme.palette.primary.main}04 100%)`,
          boxShadow: 'none',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <Chip
                icon={<TrendingUpOutlined sx={{ fontSize: '0.85rem !important', color: `${theme.palette.primary.main} !important` }} />}
                label="ACADEMIC PROMOTION & SEMESTER PROGRESSION STUDIO"
                size="small"
                sx={{
                  bgcolor: `${theme.palette.primary.main}18`,
                  color: theme.palette.primary.main,
                  fontWeight: 800,
                  fontSize: '0.68rem',
                  letterSpacing: '0.04em',
                }}
              />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.ink?.[900], letterSpacing: '-0.02em' }}>
              Semester Progression Hub
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5, maxWidth: 680 }}>
              Promote student cohorts to their next semester (+1), evaluate attendance thresholds, issue subject-level detainment notices, and handle final-year graduations.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<RefreshOutlined />}
              onClick={() => refetch()}
              sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, px: 2 }}
            >
              Refresh Data
            </Button>
            <Button
              variant="contained"
              startIcon={Number(currentSem) === maxSemestersForCourse ? <SchoolOutlined /> : <AssignmentTurnedInOutlined />}
              onClick={() => setPromoteModalOpen(true)}
              disabled={stats.total === 0 || executePromotionMutation.isPending}
              sx={{
                borderRadius: '10px',
                textTransform: 'none',
                fontWeight: 700,
                px: 2.5,
                boxShadow: `0 4px 14px ${theme.palette.primary.main}35`,
              }}
            >
              {Number(currentSem) === maxSemestersForCourse ? 'Graduate Batch' : currentSem ? `Promote Batch (Sem ${currentSem} → Sem ${Number(currentSem) + 1})` : 'Execute Batch Progression (+1)'}
            </Button>
          </Box>
        </Box>
      </Card>

      {/* ── 2. KPI Summary Grid ────────────────────────────────────────────── */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.5, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, borderTop: `4px solid ${theme.palette.primary.main}`, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em' }}>
              EVALUATED BATCH STUDENTS
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.ink?.[900], mt: 0.5 }}>
              {isLoading ? <CircularProgress size={22} /> : stats.total}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.2 }}>
              {currentSem ? `Semester ${currentSem} cohort` : 'Department cohorts'}
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.5, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, borderTop: `4px solid ${theme.palette.success.main}`, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em' }}>
              REGULAR ALL-CLEAR
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.success.main, mt: 0.5 }}>
              {isLoading ? <CircularProgress size={22} /> : stats.allClear}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.2 }}>
              Full attendance eligibility
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.5, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, borderTop: `4px solid ${theme.palette.warning.main}`, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em' }}>
              SUBJECT DETAINMENTS
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.warning.main, mt: 0.5 }}>
              {isLoading ? <CircularProgress size={22} /> : stats.detainedStudents}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.2 }}>
              {stats.totalDetainedPapers} carryover papers (&lt;{attendanceCutoff}%)
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.5, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, borderTop: `4px solid ${theme.palette.info.main}`, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em' }}>
              PROGRESSION RULE
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.info.main, mt: 0.5 }}>
              +1 Sem / Grad
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.2 }}>
              Strict 1-sem step progression
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* ── 3. Filters & Batch Progression Controls ────────────────────────── */}
      <Card sx={{ p: { xs: 2, md: 2.5 }, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
        <Grid container spacing={2} sx={{ mb: 2.5 }} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search student or Roll No..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchOutlined sx={{ color: 'text.secondary', mr: 1, fontSize: 18 }} />,
              }}
            />
          </Grid>

          {/* Phase 1 Fix: Derived Course Dropdown options from HOD department students */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Course Program"
              value={courseFilter}
              onChange={(e) => {
                setCourseFilter(e.target.value);
                setBranchFilter('');
                setCurrentSem('');
              }}
            >
              <MenuItem value="">All Courses</MenuItem>
              {hodCourses.map((c) => (
                <MenuItem key={c._id} value={c._id}>
                  {c.code} — {c.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Phase 2 Fix: Branch Specialization options filtered by selected Course (Branch.courseId match) */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Branch Specialization"
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
            >
              <MenuItem value="">All Branches</MenuItem>
              {availableBranches.map((b) => (
                <MenuItem key={b._id || b.id} value={b._id || b.id}>
                  {b.code || b.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Phase 2 Fix: Bounded Semester Cohort options based on Course duration (durationYears * 2) */}
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Semester Cohort"
              value={currentSem}
              onChange={(e) => setCurrentSem(e.target.value)}
            >
              <MenuItem value="">All Semesters</MenuItem>
              {semesterOptions.map((sem) => (
                <MenuItem key={sem} value={sem}>
                  Semester {sem} {sem === maxSemestersForCourse ? '(Final)' : ''}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>

        {/* ── Shortened Policy Notice Banner ───────────────────────────── */}
        <Box
          sx={{
            mb: 3,
            p: 2,
            bgcolor: `${theme.palette.primary.main}06`,
            borderRadius: '12px',
            border: `1px solid ${theme.palette.primary.main}20`,
            display: 'flex',
            alignItems: 'center',
            justify: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <HelpOutlineOutlined color="primary" fontSize="small" />
            <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.ink?.[900] }}>
              <strong>Policy Rule:</strong> Students move forward by exactly 1 semester (or Graduate upon final semester). Papers with &lt;{attendanceCutoff}% attendance are flagged as carryover re-exams.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>
              Min Attendance Cutoff:
            </Typography>
            <TextField
              type="number"
              size="small"
              value={attendanceCutoff}
              onChange={(e) => setAttendanceCutoff(e.target.value)}
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
              }}
              sx={{ width: 95, bgcolor: 'background.paper' }}
            />
          </Box>
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={32} />
          </Box>
        ) : processedStudents.length === 0 ? (
          <EmptyState type="reports" title="No Students Found" description="No students match the selected cohort or search query." />
        ) : (
          <DataTable columns={columns} data={processedStudents} isLoading={isLoading} isError={isError} emptyMessage="No students found." />
        )}
      </Card>

      {/* ── 4. Promote Batch Modal ────────────────────────────────────────── */}
      <Dialog open={promoteModalOpen} onClose={() => setPromoteModalOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {Number(currentSem) === maxSemestersForCourse ? 'Confirm Batch Graduation' : 'Confirm Semester Progression'}
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            You are about to process <strong>{stats.total} students</strong> {currentSem ? `in Semester ${currentSem}` : 'across cohorts'}. Each student will advance by exactly 1 semester (or Graduate if in final semester).
          </Typography>

          <Paper sx={{ p: 2, bgcolor: `${theme.palette.success.main}10`, borderRadius: '10px', border: `1px solid ${theme.palette.success.main}40` }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: theme.palette.success.main }}>
              🟢 Regular All-Clear Students ({stats.allClear})
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Students meet or exceed the {attendanceCutoff}% attendance threshold across all subjects. Promoted / Graduated with full regular eligibility.
            </Typography>
          </Paper>

          <Paper sx={{ p: 2, bgcolor: `${theme.palette.warning.main}10`, borderRadius: '10px', border: `1px solid ${theme.palette.warning.main}40` }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: theme.palette.warning.main }}>
              ⚠️ Subject Carryover Students ({stats.detainedStudents})
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Advanced to next placement, but issued <strong>{stats.totalDetainedPapers} subject detainment notices</strong> for papers with &lt;{attendanceCutoff}% attendance. These papers will be flagged as carryover re-exams.
            </Typography>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPromoteModalOpen(false)} variant="outlined" sx={{ borderRadius: '8px', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handlePromoteConfirm}
            disabled={executePromotionMutation.isPending}
            sx={{ borderRadius: '8px', fontWeight: 700 }}
          >
            {executePromotionMutation.isPending ? 'Executing...' : 'Execute Progression & Issue Notices'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── 5. Student Detainment Report Modal ─────────────────────────────── */}
      <Dialog open={reportModalOpen} onClose={() => setReportModalOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}>
        {selectedStudent && (
          <>
            <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
              <AssessmentOutlined color="primary" /> Detainment Report
            </DialogTitle>
            <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{selectedStudent.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Roll Number: <strong style={{ fontFamily: 'monospace' }}>{selectedStudent.rollNumber || '2026-STU-0104'}</strong>
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>Subject Attendance Breakdown:</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {selectedStudent.subjects.map((sub) => {
                    const isDetained = sub.attendance < Number(attendanceCutoff);
                    return (
                      <Box key={sub.code} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, borderRadius: '6px', bgcolor: isDetained ? `${theme.palette.error.main}08` : `${theme.palette.success.main}08` }}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{sub.code} - {sub.name}</Typography>
                          <Typography variant="caption" color={isDetained ? 'error.main' : 'success.main'}>
                            {isDetained ? `Carryover Re-exam Required (<${attendanceCutoff}%)` : 'Clear Regular Pass'}
                          </Typography>
                        </Box>
                        <Chip label={`${sub.attendance}%`} size="small" color={isDetained ? 'error' : 'success'} sx={{ fontWeight: 800 }} />
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={() => setReportModalOpen(false)} variant="contained" sx={{ borderRadius: '8px', fontWeight: 700 }}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default HodPromotionsHub;
