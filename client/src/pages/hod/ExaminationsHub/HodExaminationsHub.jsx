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
  Paper,
  useTheme,
  Divider,
  Card,
  CircularProgress,
  Switch,
  FormControlLabel,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  AddOutlined,
  BarChart,
  AssignmentOutlined,
  RefreshOutlined,
  DescriptionOutlined,
  EventNoteOutlined,
  LockOutlined,
  LockOpenOutlined,
  CalendarMonthOutlined,
  AccessTimeOutlined,
  CheckCircleOutlined,
  ScheduleOutlined,
  FilterListOutlined,
  DeleteOutline,
  GradingOutlined,
  SchoolOutlined,
} from '@mui/icons-material';
import DataTable from '../../../components/common/DataTable';
import EmptyState from '../../../components/common/EmptyState';
import {
  useExaminationsQuery,
  useCreateExaminationsMutation,
  useExamStatsQuery,
  useToggleMarksEntryMutation,
  useDeleteExaminationMutation,
} from '../../../queries/hodQueries';
import { useSubjectsQuery, useCoursesQuery, useBranchesQuery } from '../../../queries/collegeQueries';
import { useToast } from '../../../contexts/ToastContext';
import ResultsDeskModal from './ResultsDeskModal';

const EXAM_TYPES = ['INTERNAL', 'EXTERNAL', 'PRACTICAL', 'VIVA'];
const DATESHEET_SLOTS = ['MORNING', 'AFTERNOON', 'EVENING'];

const GRADE_COLORS = {
  O: '#22c55e',
  'A+': '#16a34a',
  A: '#3b82f6',
  'B+': '#6366f1',
  B: '#8b5cf6',
  C: '#f59e0b',
  F: '#ef4444',
  AB: '#94a3b8',
};

const getDaysInfo = (dateStr) => {
  if (!dateStr) return null;
  const exam = new Date(dateStr);
  const now = new Date();
  const diff = Math.ceil((exam - now) / (1000 * 60 * 60 * 24));
  return diff;
};

const KpiCard = ({ label, value, color, icon, sublabel, accentColor }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const finalColor = accentColor || color;
  return (
    <Card
      sx={{
        p: 2.5,
        borderRadius: '18px',
        border: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
        borderTop: `4px solid ${finalColor}`,
        bgcolor: theme.custom?.surface?.raised || theme.palette.background.paper,
        boxShadow: theme.custom?.elevation?.raised || 'none',
        height: '100%',
        transition: 'all 0.25s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: isDark ? '0 12px 28px rgba(0,0,0,0.3)' : '0 12px 28px rgba(0,0,0,0.06)',
          borderColor: finalColor,
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: '0.06em', color: finalColor, textTransform: 'uppercase', fontSize: '0.65rem' }}>
          {label}
        </Typography>
        <Box sx={{ color: finalColor, opacity: 0.7 }}>{icon}</Box>
      </Box>
      <Typography variant="h3" sx={{ fontWeight: 900, color: finalColor, mt: 1, fontFamily: theme.typography.mono?.fontFamily || 'monospace', lineHeight: 1.1 }}>
        {value}
      </Typography>
      {sublabel && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          {sublabel}
        </Typography>
      )}
    </Card>
  );
};

export const HodExaminationsHub = () => {
  const theme = useTheme();
  const { showToast } = useToast();
  const [openModal, setOpenModal] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [selectedExamForGrading, setSelectedExamForGrading] = useState(null);
  const [examToDelete, setExamToDelete] = useState(null);
  const [syllabusInput, setSyllabusInput] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [courseFilter, setCourseFilter] = useState('ALL');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [semesterFilter, setSemesterFilter] = useState('ALL');

  const [formData, setFormData] = useState({
    title: '',
    type: 'INTERNAL',
    courseId: '',
    branchId: '',
    semester: '',
    academicYear: '2025-2026',
    subjectId: '',
    date: '',
    totalMarks: '',
    passingMarks: '',
    venue: '',
    duration: '',
    datesheetSlot: 'MORNING',
    reportingTime: '',
    instructions: '',
  });
  const [datesheetFile, setDatesheetFile] = useState(null);
  const [seatingPlanFile, setSeatingPlanFile] = useState(null);

  const { data: exams = [], isLoading, refetch } = useExaminationsQuery();
  const { data: statsData } = useExamStatsQuery(selectedExamId);
  const { data: subjectsData = [] } = useSubjectsQuery({ limit: 1000 });
  const { data: courses = [] } = useCoursesQuery();
  const { data: branches = [] } = useBranchesQuery();

  const createMutation = useCreateExaminationsMutation();
  const toggleMarksMutation = useToggleMarksEntryMutation();
  const deleteMutation = useDeleteExaminationMutation();

  const totalExams = exams.length;
  const scheduledExams = exams.filter((e) => e.status === 'SCHEDULED').length;
  const publishedExams = exams.filter((e) => e.status === 'RESULTS_PUBLISHED').length;
  const completedExams = exams.filter((e) => e.status === 'COMPLETED').length;

  // Filtered exams with Course, Branch, and Semester scoping
  const filteredExams = useMemo(() => {
    let list = exams;
    if (typeFilter !== 'ALL') list = list.filter((e) => e.type === typeFilter);
    if (statusFilter !== 'ALL') list = list.filter((e) => e.status === statusFilter);
    if (courseFilter !== 'ALL') list = list.filter((e) => (e.courseId?._id || e.courseId) === courseFilter);
    if (branchFilter !== 'ALL') list = list.filter((e) => (e.branchId?._id || e.branchId) === branchFilter);
    if (semesterFilter !== 'ALL') list = list.filter((e) => Number(e.semester) === Number(semesterFilter));
    return list;
  }, [exams, typeFilter, statusFilter, courseFilter, branchFilter, semesterFilter]);

  const columns = [
    {
      id: 'title',
      label: 'Exam Title & Subject',
      render: (r) => {
        const days = getDaysInfo(r.date);
        let urgencyEl = null;
        if (r.status === 'SCHEDULED') {
          if (days !== null && days <= 3 && days >= 0) {
            urgencyEl = (
              <Chip label={days === 0 ? 'Today!' : `${days}d left`} size="small" color="error" sx={{ height: 18, fontSize: '0.58rem', fontWeight: 800, ml: 0.5 }} />
            );
          } else if (days !== null && days <= 7) {
            urgencyEl = (
              <Chip label={`${days}d left`} size="small" color="warning" sx={{ height: 18, fontSize: '0.58rem', fontWeight: 800, ml: 0.5 }} />
            );
          }
        }
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 36, height: 36, borderRadius: '10px',
                bgcolor: `${theme.palette.primary.main}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <EventNoteOutlined sx={{ color: theme.palette.primary.main, fontSize: 18 }} />
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 800, color: theme.palette.ink?.[900] || '#1a1a1a' }}>
                  {r.title}
                </Typography>
                {urgencyEl}
              </Box>
              <Typography variant="caption" color="text.secondary">
                {r.subjectId ? `${r.subjectId.name} (${r.subjectId.code})` : 'General'}
              </Typography>
            </Box>
          </Box>
        );
      },
    },
    {
      id: 'cohort',
      label: 'Target Cohort',
      render: (r) => {
        const cCode = r.courseId?.code || 'Course';
        const bCode = r.branchId?.code || 'Branch';
        const sem = r.semester ? `Sem ${r.semester}` : '';
        return (
          <Box>
            <Chip
              icon={<SchoolOutlined sx={{ fontSize: '0.75rem !important' }} />}
              label={`${cCode} • ${bCode}`}
              size="small"
              variant="outlined"
              color="primary"
              sx={{ fontWeight: 800, fontSize: '0.68rem', mb: 0.25 }}
            />
            {sem && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 700 }}>
                {sem} {r.academicYear ? `(${r.academicYear})` : ''}
              </Typography>
            )}
          </Box>
        );
      },
    },
    {
      id: 'type',
      label: 'Type',
      render: (r) => (
        <Chip label={r.type || 'INTERNAL'} size="small" color="primary" variant="outlined" sx={{ fontWeight: 800, fontSize: '0.68rem' }} />
      ),
    },
    {
      id: 'date',
      label: 'Date & Venue',
      render: (r) => {
        return (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CalendarMonthOutlined sx={{ fontSize: 13, color: 'text.secondary' }} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.3 }}>
              <AccessTimeOutlined sx={{ fontSize: 12, color: 'text.disabled' }} />
              <Typography variant="caption" color="text.secondary">
                {r.datesheetSlot || 'MORNING'} • {r.venue || 'TBA'}
              </Typography>
            </Box>
          </Box>
        );
      },
    },
    {
      id: 'marks',
      label: 'Marks',
      render: (r) => (
        <Box>
          <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700, display: 'block' }}>
            Max: {r.totalMarks || 100}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Pass: {r.passingMarks || 0}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'documents',
      label: 'Documents',
      render: (r) => (
        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
          {r.datesheetPdfUrl ? (
            <Tooltip title="View Datesheet PDF">
              <Button size="small" variant="outlined" href={r.datesheetPdfUrl} target="_blank" startIcon={<DescriptionOutlined />} sx={{ fontSize: '0.68rem', textTransform: 'none', borderRadius: '6px', py: 0.25 }}>
                Datesheet
              </Button>
            </Tooltip>
          ) : null}
          {r.seatingPlanPdfUrl ? (
            <Tooltip title="View Seating Plan PDF">
              <Button size="small" variant="outlined" color="secondary" href={r.seatingPlanPdfUrl} target="_blank" startIcon={<DescriptionOutlined />} sx={{ fontSize: '0.68rem', textTransform: 'none', borderRadius: '6px', py: 0.25 }}>
                Seating
              </Button>
            </Tooltip>
          ) : null}
          {!r.datesheetPdfUrl && !r.seatingPlanPdfUrl && <Typography variant="caption" color="text.disabled">—</Typography>}
        </Box>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      render: (r) => {
        const cfg = {
          SCHEDULED: { color: 'warning', icon: <ScheduleOutlined sx={{ fontSize: '0.8rem !important' }} /> },
          COMPLETED: { color: 'default', icon: <CheckCircleOutlined sx={{ fontSize: '0.8rem !important' }} /> },
          RESULTS_PUBLISHED: { color: 'success', icon: <CheckCircleOutlined sx={{ fontSize: '0.8rem !important' }} /> },
          CANCELLED: { color: 'error', icon: null },
        };
        const c = cfg[r.status] || cfg.SCHEDULED;
        return <Chip icon={c.icon} label={r.status || 'SCHEDULED'} size="small" color={c.color} sx={{ fontWeight: 800, fontSize: '0.65rem' }} />;
      },
    },
    {
      id: 'actions',
      label: 'Evaluation & Actions',
      render: (r) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
          <Button
            size="small"
            variant={r.status === 'RESULTS_PUBLISHED' ? 'outlined' : 'contained'}
            color="primary"
            startIcon={<GradingOutlined sx={{ fontSize: 15 }} />}
            onClick={() => setSelectedExamForGrading(r)}
            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, fontSize: '0.72rem', py: 0.4, px: 1.2 }}
          >
            {r.status === 'RESULTS_PUBLISHED' ? 'Review Desk' : 'Results Desk'}
          </Button>
          {r.status === 'RESULTS_PUBLISHED' && (
            <Tooltip title="View Class Performance Stats">
              <IconButton
                size="small"
                color="info"
                onClick={() => setSelectedExamId(selectedExamId === (r._id || r.id) ? null : (r._id || r.id))}
                sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: '8px', p: 0.6 }}
              >
                <BarChart sx={{ fontSize: 17 }} />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Delete Examination">
            <IconButton
              size="small"
              color="error"
              onClick={() => setExamToDelete(r)}
              sx={{
                border: `1px solid ${theme.palette.error.main}30`,
                bgcolor: `${theme.palette.error.main}08`,
                borderRadius: '8px',
                p: 0.6,
                '&:hover': { bgcolor: `${theme.palette.error.main}20`, borderColor: theme.palette.error.main },
              }}
            >
              <DeleteOutline sx={{ fontSize: 17 }} />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
    {
      id: 'marksEntryLock',
      label: 'Marks Entry',
      render: (r) => (
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={Boolean(r.marksEntryEnabled)}
              onChange={(e) => {
                const targetState = e.target.checked;
                toggleMarksMutation.mutate(
                  { examId: r._id || r.id, marksEntryEnabled: targetState },
                  {
                    onSuccess: () => showToast(`Marks entry ${targetState ? 'UNLOCKED' : 'LOCKED'} for faculty.`),
                    onError: (err) => showToast(`Failed: ${err.message}`, { severity: 'error' }),
                  }
                );
              }}
            />
          }
          label={
            <Chip
              icon={r.marksEntryEnabled ? <LockOpenOutlined sx={{ fontSize: '0.75rem !important' }} /> : <LockOutlined sx={{ fontSize: '0.75rem !important' }} />}
              label={r.marksEntryEnabled ? 'OPEN' : 'LOCKED'}
              size="small"
              color={r.marksEntryEnabled ? 'success' : 'default'}
              sx={{ fontWeight: 800, fontSize: '0.62rem' }}
            />
          }
        />
      ),
    },
  ];

  const handleCourseChange = (e) => {
    const cId = e.target.value;
    setFormData((p) => ({
      ...p,
      courseId: cId,
      branchId: '',
      semester: '',
      subjectId: '',
    }));
  };

  const handleBranchChange = (e) => {
    const bId = e.target.value;
    setFormData((p) => ({
      ...p,
      branchId: bId,
      subjectId: '',
    }));
  };

  const handleSubjectSelect = (subId) => {
    const sub = subjectsData.find((s) => (s._id || s.id) === subId);
    if (sub) {
      const bId = sub.branchId?._id || sub.branchId;
      const branch = branches.find((b) => (b._id || b.id) === bId);
      const cId = branch?.courseId?._id || branch?.courseId;
      setFormData((prev) => ({
        ...prev,
        subjectId: subId,
        branchId: prev.branchId || bId || '',
        courseId: prev.courseId || cId || '',
        semester: prev.semester || sub.semester || '',
      }));
    } else {
      setFormData((prev) => ({ ...prev, subjectId: subId }));
    }
  };

  const handleDeleteExam = () => {
    if (!examToDelete) return;
    deleteMutation.mutate(examToDelete._id || examToDelete.id, {
      onSuccess: () => {
        showToast('Examination deleted successfully.');
        setExamToDelete(null);
        if (selectedExamId === (examToDelete._id || examToDelete.id)) {
          setSelectedExamId(null);
        }
        refetch();
      },
      onError: (err) => {
        showToast(err.response?.data?.message || 'Failed to delete examination', { severity: 'error' });
      },
    });
  };

  const selectedCourse = useMemo(() => {
    return courses.find((c) => (c._id || c.id) === formData.courseId) || null;
  }, [courses, formData.courseId]);

  const maxSemesters = useMemo(() => {
    return (selectedCourse?.durationYears || 4) * 2;
  }, [selectedCourse]);

  const availableBranchesForForm = useMemo(() => {
    if (!formData.courseId) return branches;
    return branches.filter((b) => (b.courseId?._id || b.courseId) === formData.courseId);
  }, [branches, formData.courseId]);

  const availableSubjectsForForm = useMemo(() => {
    return subjectsData.filter((s) => {
      if (formData.branchId && (s.branchId?._id || s.branchId) !== formData.branchId) return false;
      if (formData.semester && Number(s.semester) !== Number(formData.semester)) return false;
      return true;
    });
  }, [subjectsData, formData.branchId, formData.semester]);

  const handleChange = (e) => setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = new FormData();
    Object.entries(formData).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        payload.append(key, val);
      }
    });
    const syllabus = syllabusInput.split('\n').map((s) => s.trim()).filter(Boolean);
    syllabus.forEach((item) => payload.append('syllabus[]', item));
    if (datesheetFile) payload.append('datesheet', datesheetFile);
    if (seatingPlanFile) payload.append('seatingPlan', seatingPlanFile);
    createMutation.mutate(payload, {
      onSuccess: () => {
        setOpenModal(false);
        setDatesheetFile(null);
        setSeatingPlanFile(null);
        setSyllabusInput('');
        setFormData({
          title: '',
          type: 'INTERNAL',
          courseId: '',
          branchId: '',
          semester: '',
          academicYear: '2025-2026',
          subjectId: '',
          date: '',
          totalMarks: '',
          passingMarks: '',
          venue: '',
          duration: '',
          datesheetSlot: 'MORNING',
          reportingTime: '',
          instructions: '',
        });
        showToast('Examination scheduled successfully.');
        refetch();
      },
      onError: (err) => showToast(err.response?.data?.message || 'Failed to schedule exam', { severity: 'error' }),
    });
  };

  const cs = statsData?.classStats || {};
  const gradeDistribution = statsData?.gradeDistribution || [];
  const maxGradeCount = Math.max(...gradeDistribution.map((g) => g.count), 1);

  const isDark = theme.palette.mode === 'dark';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* ── 1. Hero Banner ─────────────────────────────────────────────────── */}
      <Card
        sx={{
          p: { xs: 2.5, md: 3.5 },
          borderRadius: '22px',
          border: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
          background: isDark
            ? 'linear-gradient(135deg, rgba(79, 70, 229, 0.14) 0%, rgba(184, 134, 62, 0.08) 100%)'
            : 'linear-gradient(135deg, rgba(79, 70, 229, 0.06) 0%, rgba(184, 134, 62, 0.04) 100%)',
          backdropFilter: 'blur(12px)',
          boxShadow: isDark
            ? '0 18px 40px -15px rgba(0,0,0,0.5)'
            : '0 18px 40px -15px rgba(79, 70, 229, 0.08)',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Chip
              icon={<AssignmentOutlined sx={{ fontSize: '0.9rem !important', color: `${theme.palette.primary.main} !important` }} />}
              label="DEPARTMENT EXAMINATIONS & MARKS CONTROL"
              size="small"
              sx={{ bgcolor: `${theme.palette.primary.main}15`, color: theme.palette.primary.main, fontWeight: 800, fontSize: '0.68rem', letterSpacing: '0.05em', mb: 1.5 }}
            />
            <Typography variant="h4" sx={{ fontFamily: theme.typography.h1?.fontFamily, fontWeight: 800, color: theme.palette.ink?.[900] || '#1a1a1a' }}>
              Examinations & Internal Marks
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5, maxWidth: 560 }}>
              Schedule mid-terms and semester exams, upload datesheets & seating plans, control faculty marks entry access, and view class performance analytics.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button variant="outlined" startIcon={<RefreshOutlined />} onClick={() => refetch()} sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}>
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddOutlined />}
              onClick={() => setOpenModal(true)}
              sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, background: theme.palette.primary.gradient || theme.palette.primary.main, color: '#fff' }}
            >
              Schedule Exam
            </Button>
          </Box>
        </Box>
      </Card>

      {/* ── 2. KPI Cards ───────────────────────────────────────────────────── */}
      <Grid container spacing={2.5}>
        {[
          { label: 'Total Examinations', value: totalExams, accentColor: theme.palette.ink?.[700] || '#374151', sublabel: 'All scheduled & completed', icon: <AssignmentOutlined sx={{ fontSize: 20 }} /> },
          { label: 'Upcoming / Scheduled', value: scheduledExams, accentColor: theme.palette.warning.main, sublabel: 'Pending conduct', icon: <ScheduleOutlined sx={{ fontSize: 20 }} /> },
          { label: 'Completed', value: completedExams, accentColor: theme.palette.info.main, sublabel: 'Conducted exams', icon: <CheckCircleOutlined sx={{ fontSize: 20 }} /> },
          { label: 'Results Published', value: publishedExams, accentColor: theme.palette.success.main, sublabel: 'Graded & published', icon: <BarChart sx={{ fontSize: 20 }} /> },
        ].map((kpi) => (
          <Grid item xs={12} sm={6} md={3} key={kpi.label}>
            <KpiCard {...kpi} color={kpi.accentColor} />
          </Grid>
        ))}
      </Grid>

      {/* ── 3. Class Performance Analytics Panel ──────────────────────────── */}
      {selectedExamId && statsData && (
        <Card sx={{ p: 3.5, borderRadius: '16px', border: `2px solid ${theme.palette.primary.main}30`, boxShadow: `0 0 0 4px ${theme.palette.primary.main}08`, background: `${theme.palette.primary.main}04` }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="overline" sx={{ color: theme.palette.primary.main, fontWeight: 800, letterSpacing: '0.1em' }}>
                PERFORMANCE ANALYTICS
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: theme.palette.ink?.[900] || '#1a1a1a' }}>
                {statsData.examination?.title}
              </Typography>
            </Box>
            <Button size="small" variant="outlined" onClick={() => setSelectedExamId(null)} sx={{ borderRadius: '6px' }}>
              Close Panel
            </Button>
          </Box>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            {[
              { label: 'Total Students', value: cs.totalStudents, color: 'primary.main' },
              { label: 'Passed', value: cs.passed, color: 'success.main' },
              { label: 'Failed', value: cs.failed, color: 'error.main' },
              { label: 'Pass Rate', value: `${cs.passPercentage ?? 0}%`, color: 'info.main' },
              { label: 'Avg Marks', value: cs.avgMarks, color: 'warning.main' },
              { label: 'Need Remedial', value: cs.requiresRemedial, color: 'error.main' },
            ].map((s) => (
              <Grid item xs={6} sm={4} md={2} key={s.label}>
                <Paper sx={{ p: 2, textAlign: 'center', borderRadius: '12px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
                  <Typography variant="h4" fontWeight={900} sx={{ color: s.color }}>
                    {s.value ?? '—'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    {s.label}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2 }}>
            Grade Distribution
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
            {gradeDistribution.map((g) => (
              <Box key={g._id} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 900, minWidth: 30, textAlign: 'center', color: GRADE_COLORS[g._id] || '#94a3b8', fontFamily: 'monospace' }}
                >
                  {g._id}
                </Typography>
                <Box sx={{ flex: 1, height: 10, borderRadius: 5, bgcolor: `${GRADE_COLORS[g._id] || '#94a3b8'}20`, overflow: 'hidden' }}>
                  <Box
                    sx={{
                      height: '100%',
                      borderRadius: 5,
                      bgcolor: GRADE_COLORS[g._id] || '#94a3b8',
                      width: `${(g.count / maxGradeCount) * 100}%`,
                      transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
                    }}
                  />
                </Box>
                <Typography variant="caption" sx={{ fontWeight: 800, minWidth: 60, color: GRADE_COLORS[g._id] || '#94a3b8', fontFamily: 'monospace' }}>
                  {g.count} student{g.count !== 1 ? 's' : ''}
                </Typography>
              </Box>
            ))}
          </Box>
        </Card>
      )}

      {/* ── 4. Filter Bar + Table ──────────────────────────────────────────── */}
      <Card sx={{ borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', overflow: 'hidden' }}>
        {/* Filter Bar */}
        <Box sx={{ px: 3, pt: 2.5, pb: 2, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          {/* Course filter */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SchoolOutlined sx={{ fontSize: 16, color: 'text.secondary' }} />
            <TextField
              select
              size="small"
              label="Course"
              value={courseFilter}
              onChange={(e) => {
                setCourseFilter(e.target.value);
                setBranchFilter('ALL');
                setSemesterFilter('ALL');
              }}
              sx={{ minWidth: 130 }}
            >
              <MenuItem value="ALL">All Courses</MenuItem>
              {courses.map((c) => (
                <MenuItem key={c._id || c.id} value={c._id || c.id}>
                  {c.code || c.name}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {/* Branch filter */}
          <TextField
            select
            size="small"
            label="Branch"
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="ALL">All Branches</MenuItem>
            {branches
              .filter((b) => courseFilter === 'ALL' || (b.courseId?._id || b.courseId) === courseFilter)
              .map((b) => (
                <MenuItem key={b._id || b.id} value={b._id || b.id}>
                  {b.code || b.name}
                </MenuItem>
              ))}
          </TextField>

          {/* Semester filter */}
          <TextField
            select
            size="small"
            label="Semester"
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
            sx={{ minWidth: 110 }}
          >
            <MenuItem value="ALL">All Sem</MenuItem>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((sm) => (
              <MenuItem key={sm} value={String(sm)}>
                Sem {sm}
              </MenuItem>
            ))}
          </TextField>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterListOutlined sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: '0.05em' }}>
              TYPE
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
            {['ALL', ...EXAM_TYPES].map((t) => (
              <Chip
                key={t}
                label={t}
                size="small"
                onClick={() => setTypeFilter(t)}
                color={typeFilter === t ? 'primary' : 'default'}
                variant={typeFilter === t ? 'filled' : 'outlined'}
                sx={{ fontWeight: 700, cursor: 'pointer', fontSize: '0.68rem' }}
              />
            ))}
          </Box>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: '0.05em' }}>
              STATUS
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
            {['ALL', 'SCHEDULED', 'COMPLETED', 'RESULTS_PUBLISHED', 'CANCELLED'].map((s) => {
              const colors = { SCHEDULED: 'warning', COMPLETED: 'info', RESULTS_PUBLISHED: 'success', CANCELLED: 'error' };
              return (
                <Chip
                  key={s}
                  label={s === 'RESULTS_PUBLISHED' ? 'PUBLISHED' : s}
                  size="small"
                  onClick={() => setStatusFilter(s)}
                  color={statusFilter === s ? (colors[s] || 'primary') : 'default'}
                  variant={statusFilter === s ? 'filled' : 'outlined'}
                  sx={{ fontWeight: 700, cursor: 'pointer', fontSize: '0.68rem' }}
                />
              );
            })}
          </Box>

          <Box sx={{ ml: 'auto' }}>
            <Typography variant="caption" color="text.secondary">
              Showing <strong>{filteredExams.length}</strong> of {totalExams} exams
            </Typography>
          </Box>
        </Box>

        {/* Table */}
        <Box sx={{ p: 3 }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress size={32} />
            </Box>
          ) : filteredExams.length === 0 ? (
            <EmptyState
              type="reports"
              title={totalExams === 0 ? 'No Examinations Scheduled' : 'No Exams Match Filters'}
              description={totalExams === 0 ? 'Schedule your first mid-term or semester examination.' : 'Try adjusting the type, course, or status filter.'}
              actionText={totalExams === 0 ? 'Schedule First Exam' : undefined}
              onAction={totalExams === 0 ? () => setOpenModal(true) : undefined}
            />
          ) : (
            <DataTable columns={columns} data={filteredExams} isLoading={isLoading} emptyMessage="No examinations found." />
          )}
        </Box>
      </Card>

      {/* ── 5. Schedule Exam Modal with Cascading Academic Scoping ─────────── */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 800, borderBottom: `1px solid ${theme.palette.divider}`, pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: `${theme.palette.primary.main}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <EventNoteOutlined sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
            </Box>
            Schedule New Examination
          </Box>
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ pt: 3 }}>
            <Grid container spacing={2.5}>
              {/* Row 1: Title */}
              <Grid item xs={12}>
                <TextField label="Exam Title" name="title" value={formData.title} onChange={handleChange} required fullWidth placeholder="e.g. Mid-Term Theory Examination — Semester 4" />
              </Grid>

              {/* Row 2: Academic Scoping (Course, Branch, Semester, Academic Year) */}
              <Grid item xs={12} sm={3}>
                <TextField
                  select
                  label="Target Course"
                  name="courseId"
                  value={formData.courseId}
                  onChange={handleCourseChange}
                  required
                  fullWidth
                >
                  <MenuItem value="" disabled>Select Course</MenuItem>
                  {courses.map((c) => (
                    <MenuItem key={c._id || c.id} value={c._id || c.id}>
                      {c.name} ({c.code})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  select
                  label="Target Branch"
                  name="branchId"
                  value={formData.branchId}
                  onChange={handleBranchChange}
                  required
                  fullWidth
                >
                  <MenuItem value="" disabled>Select Branch</MenuItem>
                  {availableBranchesForForm.map((b) => (
                    <MenuItem key={b._id || b.id} value={b._id || b.id}>
                      {b.name} ({b.code})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  select
                  label="Semester"
                  name="semester"
                  value={formData.semester}
                  onChange={(e) => setFormData((p) => ({ ...p, semester: e.target.value, subjectId: '' }))}
                  required
                  fullWidth
                >
                  <MenuItem value="" disabled>Select Semester</MenuItem>
                  {Array.from({ length: maxSemesters }, (_, i) => i + 1).map((sm) => (
                    <MenuItem key={sm} value={sm}>
                      Semester {sm}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  label="Academic Year"
                  name="academicYear"
                  value={formData.academicYear}
                  onChange={handleChange}
                  fullWidth
                  placeholder="2025-2026"
                />
              </Grid>

              {/* Row 3: Type + Subject */}
              <Grid item xs={12} sm={4}>
                <TextField select label="Exam Type" name="type" value={formData.type} onChange={handleChange} required fullWidth>
                  {EXAM_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={8}>
                <TextField
                  select
                  label="Curriculum Subject"
                  name="subjectId"
                  value={formData.subjectId}
                  onChange={(e) => handleSubjectSelect(e.target.value)}
                  required
                  fullWidth
                >
                  <MenuItem value="" disabled>
                    {availableSubjectsForForm.length === 0 ? 'No subjects found for selected Branch/Sem' : 'Select Subject'}
                  </MenuItem>
                  {availableSubjectsForForm.map((s) => (
                    <MenuItem key={s._id || s.id} value={s._id || s.id}>
                      {s.name} ({s.code}) &bull; Sem {s.semester} &bull; {s.type || 'THEORY'}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Row 4: Date + Slot + Reporting */}
              <Grid item xs={12} sm={4}>
                <TextField label="Exam Date" name="date" type="date" value={formData.date} onChange={handleChange} required fullWidth InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField select label="Datesheet Slot" name="datesheetSlot" value={formData.datesheetSlot} onChange={handleChange} fullWidth>
                  {DATESHEET_SLOTS.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField label="Reporting Time" name="reportingTime" placeholder="09:00 AM" value={formData.reportingTime} onChange={handleChange} fullWidth />
              </Grid>

              {/* Row 5: Marks + Duration + Venue */}
              <Grid item xs={12} sm={3}>
                <TextField label="Total Marks" name="totalMarks" type="number" value={formData.totalMarks} onChange={handleChange} required fullWidth />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField label="Passing Marks" name="passingMarks" type="number" value={formData.passingMarks} onChange={handleChange} required fullWidth />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField label="Duration (mins)" name="duration" type="number" value={formData.duration} onChange={handleChange} fullWidth placeholder="180" />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField label="Venue / Room" name="venue" value={formData.venue} onChange={handleChange} fullWidth placeholder="Hall A, Block 3" />
              </Grid>

              {/* Row 6: File Uploads */}
              <Grid item xs={12}>
                <Divider>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>OFFICIAL DOCUMENTS (OPTIONAL)</Typography>
                </Divider>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block', fontWeight: 700 }}>Datesheet PDF</Typography>
                <TextField type="file" inputProps={{ accept: 'application/pdf' }} onChange={(e) => setDatesheetFile(e.target.files[0])} fullWidth size="small" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block', fontWeight: 700 }}>Seating Plan PDF</Typography>
                <TextField type="file" inputProps={{ accept: 'application/pdf' }} onChange={(e) => setSeatingPlanFile(e.target.files[0])} fullWidth size="small" />
              </Grid>

              {/* Row 7: Syllabus + Instructions */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Syllabus Topics (one per line)"
                  multiline rows={4}
                  value={syllabusInput}
                  onChange={(e) => setSyllabusInput(e.target.value)}
                  placeholder={'Topic 1\nTopic 2\nTopic 3'}
                  fullWidth
                  helperText="Students will see this as the official exam syllabus."
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Special Instructions" name="instructions" value={formData.instructions} onChange={handleChange} multiline rows={4} fullWidth placeholder="e.g. Calculators not allowed. Bring college ID." />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, gap: 1.5 }}>
            <Button onClick={() => setOpenModal(false)} variant="outlined" sx={{ borderRadius: '8px' }}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={createMutation.isPending} sx={{ borderRadius: '8px', fontWeight: 700, px: 4 }}>
              {createMutation.isPending ? 'Scheduling...' : 'Schedule Examination'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ── 6. Confirm Delete Exam Dialog ───────────────────────────────── */}
      <Dialog
        open={Boolean(examToDelete)}
        onClose={() => setExamToDelete(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '18px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: 'error.main', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: '10px',
              bgcolor: 'rgba(239, 68, 68, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <DeleteOutline sx={{ color: 'error.main', fontSize: 22 }} />
          </Box>
          Delete Examination
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Are you sure you want to permanently delete this examination?
          </Typography>
          <Box
            sx={{
              p: 1.75,
              borderRadius: '10px',
              bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
              border: `1px solid ${theme.palette.divider}`,
              mb: 2,
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 800 }}>
              {examToDelete?.title}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Subject: <strong>{examToDelete?.subjectId?.name} ({examToDelete?.subjectId?.code})</strong>
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Cohort: {examToDelete?.courseId?.code || 'Course'} &bull; {examToDelete?.branchId?.code || 'Branch'} &bull; Sem {examToDelete?.semester}
            </Typography>
          </Box>
          <Typography variant="caption" color="error.main" sx={{ fontWeight: 700 }}>
            ⚠ Warning: This action cannot be undone and will permanently delete all evaluated results and grades associated with this examination.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1.5 }}>
          <Button onClick={() => setExamToDelete(null)} variant="outlined" sx={{ borderRadius: '8px', fontWeight: 700 }}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteExam}
            variant="contained"
            color="error"
            disabled={deleteMutation.isPending}
            startIcon={<DeleteOutline />}
            sx={{ borderRadius: '8px', fontWeight: 800, px: 3 }}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete Exam'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── 7. Results & Marks Evaluation Desk Modal ────────────────────── */}
      <ResultsDeskModal
        open={Boolean(selectedExamForGrading)}
        onClose={() => setSelectedExamForGrading(null)}
        examination={selectedExamForGrading}
        onSuccess={() => refetch()}
      />
    </Box>
  );
};

export default HodExaminationsHub;
