import React, { useState } from 'react';
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
} from '@mui/icons-material';
import DataTable from '../../../components/common/DataTable';
import EmptyState from '../../../components/common/EmptyState';
import {
  useExaminationsQuery,
  useCreateExaminationsMutation,
  useExamStatsQuery,
  useToggleMarksEntryMutation,
} from '../../../queries/hodQueries';
import { useSubjectsQuery } from '../../../queries/collegeQueries';
import { useToast } from '../../../contexts/ToastContext';

const EXAM_TYPES = ['INTERNAL', 'EXTERNAL', 'PRACTICAL', 'VIVA'];
const DATESHEET_SLOTS = ['MORNING', 'AFTERNOON', 'EVENING'];
const GRADE_COLORS = {
  O: 'success',
  'A+': 'success',
  A: 'primary',
  'B+': 'info',
  B: 'info',
  C: 'warning',
  F: 'error',
  AB: 'default',
};

const StatCard = ({ label, value, color }) => (
  <Paper sx={{ p: 2, textAlign: 'center', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.08)', boxShadow: 'none' }}>
    <Typography variant="h4" fontWeight={800} color={`${color}.main`}>
      {value ?? '—'}
    </Typography>
    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
      {label}
    </Typography>
  </Paper>
);

export const HodExaminationsHub = () => {
  const theme = useTheme();
  const { showToast } = useToast();
  const [openModal, setOpenModal] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [syllabusInput, setSyllabusInput] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    type: 'INTERNAL',
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
  const createMutation = useCreateExaminationsMutation();
  const toggleMarksMutation = useToggleMarksEntryMutation();

  const totalExams = exams.length;
  const scheduledExams = exams.filter((e) => e.status === 'SCHEDULED').length;
  const publishedExams = exams.filter((e) => e.status === 'RESULTS_PUBLISHED').length;

  const columns = [
    {
      id: 'title',
      label: 'Exam Title & Code',
      render: (r) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <EventNoteOutlined sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 800, color: theme.palette.ink[900] }}>
              {r.title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {r.subjectId ? `${r.subjectId.name} (${r.subjectId.code})` : 'General'}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      id: 'type',
      label: 'Exam Type',
      render: (r) => (
        <Chip label={r.type || 'INTERNAL'} size="small" color="primary" variant="outlined" sx={{ fontWeight: 800, fontSize: '0.68rem' }} />
      ),
    },
    {
      id: 'date',
      label: 'Date & Venue',
      render: (r) => (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {new Date(r.date).toLocaleDateString('en-IN')} ({r.datesheetSlot || 'MORNING'})
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Venue: {r.venue || 'TBA'}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'marks',
      label: 'Marks Criteria',
      render: (r) => (
        <Typography variant="caption" sx={{ fontFamily: theme.typography.mono.fontFamily, fontWeight: 700 }}>
          Pass: {r.passingMarks || 0} / Max: {r.totalMarks || 100}
        </Typography>
      ),
    },
    {
      id: 'documents',
      label: 'Official Documents',
      render: (r) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          {r.datesheetPdfUrl ? (
            <Button size="small" variant="outlined" href={r.datesheetPdfUrl} target="_blank" startIcon={<DescriptionOutlined />} sx={{ fontSize: '0.7rem', textTransform: 'none', borderRadius: '6px' }}>
              Datesheet
            </Button>
          ) : null}
          {r.seatingPlanPdfUrl ? (
            <Button size="small" variant="outlined" color="secondary" href={r.seatingPlanPdfUrl} target="_blank" startIcon={<DescriptionOutlined />} sx={{ fontSize: '0.7rem', textTransform: 'none', borderRadius: '6px' }}>
              Seating
            </Button>
          ) : null}
          {!r.datesheetPdfUrl && !r.seatingPlanPdfUrl && <Typography variant="caption" color="text.disabled">—</Typography>}
        </Box>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      render: (r) => {
        const colors = { SCHEDULED: 'warning', COMPLETED: 'default', RESULTS_PUBLISHED: 'success', CANCELLED: 'error' };
        return <Chip label={r.status || 'SCHEDULED'} size="small" color={colors[r.status] || 'default'} sx={{ fontWeight: 800, fontSize: '0.65rem' }} />;
      },
    },
    {
      id: 'stats',
      label: 'Performance Analytics',
      render: (r) => (
        <Button
          size="small"
          variant="outlined"
          startIcon={<BarChart sx={{ fontSize: '0.9rem !important' }} />}
          onClick={() => setSelectedExamId(r.status === 'RESULTS_PUBLISHED' ? (r._id || r.id) : null)}
          disabled={r.status !== 'RESULTS_PUBLISHED'}
          sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 700, fontSize: '0.72rem' }}
        >
          {r.status === 'RESULTS_PUBLISHED' ? 'Class Stats' : 'Pending Results'}
        </Button>
      ),
    },
    {
      id: 'marksEntryLock',
      label: 'Faculty Marks Entry',
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
                    onSuccess: () => showToast(`Marks entry permission ${targetState ? 'UNLOCKED' : 'LOCKED'} for faculty.`),
                    onError: (err) => showToast(`Failed: ${err.message}`, { severity: 'error' }),
                  }
                );
              }}
            />
          }
          label={
            <Chip
              icon={r.marksEntryEnabled ? <LockOpenOutlined sx={{ fontSize: '0.75rem !important' }} /> : <LockOutlined sx={{ fontSize: '0.75rem !important' }} />}
              label={r.marksEntryEnabled ? 'UNLOCKED' : 'LOCKED'}
              size="small"
              color={r.marksEntryEnabled ? 'success' : 'default'}
              sx={{ fontWeight: 800, fontSize: '0.62rem' }}
            />
          }
        />
      ),
    },
  ];

  const handleChange = (e) => setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = new FormData();
    Object.entries(formData).forEach(([key, val]) => payload.append(key, val));

    const syllabus = syllabusInput
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    syllabus.forEach((item) => payload.append('syllabus[]', item));

    if (datesheetFile) payload.append('datesheet', datesheetFile);
    if (seatingPlanFile) payload.append('seatingPlan', seatingPlanFile);

    createMutation.mutate(payload, {
      onSuccess: () => {
        setOpenModal(false);
        setDatesheetFile(null);
        setSeatingPlanFile(null);
        showToast('Examination scheduled successfully.');
        refetch();
      },
      onError: (err) => showToast(err.response?.data?.message || 'Failed to schedule exam', { severity: 'error' }),
    });
  };

  const cs = statsData?.classStats || {};

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      {/* ── 1. Hero Identity Banner ────────────────────────────────────────── */}
      <Card
        sx={{
          p: 3.5,
          borderRadius: '16px',
          border: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
          background: `linear-gradient(135deg, ${theme.palette.primary.main}0D 0%, ${theme.palette.brass?.[500] || '#b8863e'}0A 100%)`,
          boxShadow: 'none',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <Chip
                icon={<AssignmentOutlined sx={{ fontSize: '0.9rem !important', color: `${theme.palette.primary.main} !important` }} />}
                label="DEPARTMENT EXAMINATIONS & INTERNAL MARKS DESK"
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
              Examinations & Internal Marks Control
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
              Schedule mid-terms and semester exams, upload datesheets & seating plans, view class performance statistics, and publish results.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<RefreshOutlined />}
              onClick={() => refetch()}
              sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddOutlined />}
              onClick={() => setOpenModal(true)}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 700,
                background: theme.palette.primary.gradient || theme.palette.primary.main,
                color: '#ffffff',
              }}
            >
              Schedule New Exam
            </Button>
          </Box>
        </Box>
      </Card>

      {/* ── 2. KPI Summary Grid ────────────────────────────────────────────── */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em' }}>
              TOTAL EXAMINATIONS
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.ink[900], mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
              {isLoading ? <CircularProgress size={24} /> : totalExams}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Scheduled & published exams
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.warning.main }}>
              UPCOMING / SCHEDULED
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.warning.main, mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
              {isLoading ? <CircularProgress size={24} /> : scheduledExams}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Pending exam conduct
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.signal.success }}>
              RESULTS PUBLISHED
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.signal.success, mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
              {isLoading ? <CircularProgress size={24} /> : publishedExams}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Graded & published exams
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.primary.main }}>
              ACTIVE SUBJECTS
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.primary.main, mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
              {isLoading ? <CircularProgress size={24} /> : subjectsData.length}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Subjects in curriculum
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* ── 3. Class Performance Analytics Panel ──────────────────────────── */}
      {selectedExamId && statsData && (
        <Card sx={{ p: 3.5, borderRadius: '16px', border: `1px solid ${theme.palette.primary.main}`, boxShadow: 'none' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: theme.palette.ink[900] }}>
              Class Performance Statistics — {statsData.examination?.title}
            </Typography>
            <Button size="small" variant="outlined" onClick={() => setSelectedExamId(null)} sx={{ borderRadius: '6px' }}>
              Close Performance Panel
            </Button>
          </Box>

          <Grid container spacing={2} sx={{ mb: 2.5 }}>
            <Grid item xs={6} sm={2}>
              <StatCard label="Total Students" value={cs.totalStudents} color="primary" />
            </Grid>
            <Grid item xs={6} sm={2}>
              <StatCard label="Passed" value={cs.passed} color="success" />
            </Grid>
            <Grid item xs={6} sm={2}>
              <StatCard label="Failed" value={cs.failed} color="error" />
            </Grid>
            <Grid item xs={6} sm={2}>
              <StatCard label="Pass Rate %" value={`${cs.passPercentage}%`} color="info" />
            </Grid>
            <Grid item xs={6} sm={2}>
              <StatCard label="Avg Marks" value={cs.avgMarks} color="warning" />
            </Grid>
            <Grid item xs={6} sm={2}>
              <StatCard label="Need Remedial" value={cs.requiresRemedial} color="error" />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5 }}>
            Grade Distribution:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {(statsData.gradeDistribution || []).map((g) => (
              <Chip key={g._id} label={`${g._id}: ${g.count} Students`} color={GRADE_COLORS[g._id] || 'default'} size="small" sx={{ fontWeight: 800 }} />
            ))}
          </Box>
        </Card>
      )}

      {/* ── 4. Main Examinations Table ────────────────────────────────────── */}
      <Card sx={{ p: 3, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={32} />
          </Box>
        ) : exams.length === 0 ? (
          <EmptyState
            type="reports"
            title="No Examinations Scheduled"
            description="No mid-term or semester examinations have been scheduled yet."
            actionText="Schedule First Exam"
            onAction={() => setOpenModal(true)}
          />
        ) : (
          <DataTable columns={columns} data={exams} isLoading={isLoading} emptyMessage="No examinations scheduled." />
        )}
      </Card>

      {/* ── 5. Schedule Exam Modal ────────────────────────────────────────── */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Schedule New Examination</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Exam Title" name="title" value={formData.title} onChange={handleChange} required fullWidth placeholder="e.g. Mid-Term Theory Examination" />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField select label="Exam Type" name="type" value={formData.type} onChange={handleChange} required fullWidth>
                  {EXAM_TYPES.map((t) => (
                    <MenuItem key={t} value={t}>
                      {t}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField select label="Curriculum Subject" name="subjectId" value={formData.subjectId} onChange={handleChange} required fullWidth>
                  <MenuItem value="" disabled>
                    Select Subject
                  </MenuItem>
                  {subjectsData.map((s) => (
                    <MenuItem key={s._id || s.id} value={s._id || s.id}>
                      {s.name} ({s.code}) - Sem {s.semester}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>

            <TextField label="Exam Date" name="date" type="date" value={formData.date} onChange={handleChange} required fullWidth InputLabelProps={{ shrink: true }} />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField label="Total Marks" name="totalMarks" type="number" value={formData.totalMarks} onChange={handleChange} required fullWidth />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Passing Marks" name="passingMarks" type="number" value={formData.passingMarks} onChange={handleChange} required fullWidth />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField label="Venue / Room" name="venue" value={formData.venue} onChange={handleChange} fullWidth placeholder="e.g. Hall A, Block 3" />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Duration (mins)" name="duration" type="number" value={formData.duration} onChange={handleChange} fullWidth placeholder="180" />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField select label="Datesheet Slot" name="datesheetSlot" value={formData.datesheetSlot} onChange={handleChange} fullWidth>
                  {DATESHEET_SLOTS.map((s) => (
                    <MenuItem key={s} value={s}>
                      {s}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField label="Reporting Time" name="reportingTime" placeholder="09:00 AM" value={formData.reportingTime} onChange={handleChange} fullWidth />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block', fontWeight: 700 }}>
                  Datesheet PDF (Optional)
                </Typography>
                <TextField type="file" inputProps={{ accept: 'application/pdf' }} onChange={(e) => setDatesheetFile(e.target.files[0])} fullWidth size="small" />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block', fontWeight: 700 }}>
                  Seating Plan PDF (Optional)
                </Typography>
                <TextField type="file" inputProps={{ accept: 'application/pdf' }} onChange={(e) => setSeatingPlanFile(e.target.files[0])} fullWidth size="small" />
              </Grid>
            </Grid>

            <TextField
              label="Syllabus Topics (one per line)"
              multiline
              rows={3}
              value={syllabusInput}
              onChange={(e) => setSyllabusInput(e.target.value)}
              placeholder="Topic 1&#10;Topic 2&#10;Topic 3"
              fullWidth
              helperText="Students will see this as the official exam syllabus."
            />
            <TextField label="Special Instructions" name="instructions" value={formData.instructions} onChange={handleChange} multiline rows={2} fullWidth />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setOpenModal(false)} variant="outlined" sx={{ borderRadius: '8px' }}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={createMutation.isPending} sx={{ borderRadius: '8px', fontWeight: 700 }}>
              {createMutation.isPending ? 'Scheduling...' : 'Schedule Exam'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default HodExaminationsHub;
