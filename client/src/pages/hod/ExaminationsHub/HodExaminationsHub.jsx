import React, { useState } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Chip, Alert, Snackbar, Grid, Paper, useTheme, Divider,
} from '@mui/material';
import { AddOutlined, BarChart, School } from '@mui/icons-material';
import DataTable from '../../../components/common/DataTable';
import { useExaminationsQuery, useCreateExaminationsMutation, useExamStatsQuery } from '../../../queries/hodQueries';

const EXAM_TYPES = ['INTERNAL', 'EXTERNAL', 'PRACTICAL', 'VIVA'];
const DATESHEET_SLOTS = ['MORNING', 'AFTERNOON', 'EVENING'];
const GRADE_COLORS = { O: 'success', 'A+': 'success', A: 'primary', 'B+': 'info', B: 'info', C: 'warning', F: 'error', AB: 'default' };

const StatCard = ({ label, value, color }) => (
  <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
    <Typography variant="h4" fontWeight={800} color={`${color}.main`}>{value ?? '—'}</Typography>
    <Typography variant="caption" color="text.secondary">{label}</Typography>
  </Paper>
);

const HodExaminationsHub = () => {
  const theme = useTheme();
  const [openModal, setOpenModal] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [syllabusInput, setSyllabusInput] = useState('');
  const [toast, setToast] = useState({ open: false, msg: '', severity: 'success' });
  const [formData, setFormData] = useState({
    title: '', type: 'INTERNAL', subjectId: '', date: '', totalMarks: '', passingMarks: '',
    venue: '', duration: '', datesheetSlot: 'MORNING', reportingTime: '', instructions: '',
  });
  const [datesheetFile, setDatesheetFile] = useState(null);
  const [seatingPlanFile, setSeatingPlanFile] = useState(null);

  const { data: exams = [], isLoading } = useExaminationsQuery();
  const { data: statsData } = useExamStatsQuery(selectedExamId);
  const createMutation = useCreateExaminationsMutation();

  const showToast = (msg, severity = 'success') => setToast({ open: true, msg, severity });

  const columns = [
    { id: 'title', label: 'Exam Title', render: (r) => <Typography fontWeight={600}>{r.title}</Typography> },
    { id: 'type', label: 'Type', render: (r) => <Chip label={r.type} size="small" variant="outlined" color="primary" /> },
    { id: 'subjectId', label: 'Subject', render: (r) => r.subjectId ? `${r.subjectId.name} (${r.subjectId.code})` : '—' },
    { id: 'date', label: 'Date', render: (r) => new Date(r.date).toLocaleDateString('en-IN') },
    { id: 'venue', label: 'Venue', render: (r) => r.venue || '—' },
    { id: 'datesheetSlot', label: 'Slot', render: (r) => r.datesheetSlot || '—' },
    { id: 'totalMarks', label: 'Max Marks' },
    { id: 'passingMarks', label: 'Pass Marks' },
    {
      id: 'documents', label: 'Documents', render: (r) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          {r.datesheetPdfUrl && <Button size="small" variant="text" href={r.datesheetPdfUrl} target="_blank">Datesheet</Button>}
          {r.seatingPlanPdfUrl && <Button size="small" variant="text" href={r.seatingPlanPdfUrl} target="_blank">Seating</Button>}
          {(!r.datesheetPdfUrl && !r.seatingPlanPdfUrl) && <Typography variant="caption" color="text.disabled">—</Typography>}
        </Box>
      )
    },
    {
      id: 'status', label: 'Status', render: (r) => {
        const colors = { SCHEDULED: 'warning', COMPLETED: 'default', RESULTS_PUBLISHED: 'success', CANCELLED: 'error' };
        return <Chip label={r.status} size="small" color={colors[r.status] || 'default'} />;
      }
    },
    {
      id: 'stats', label: 'Class Stats', render: (r) => (
        <Button
          size="small" variant="outlined" startIcon={<BarChart fontSize="small" />}
          onClick={() => setSelectedExamId(r.status === 'RESULTS_PUBLISHED' ? r._id : null)}
          disabled={r.status !== 'RESULTS_PUBLISHED'}
        >
          View Stats
        </Button>
      )
    },
    {
      id: 'syllabus', label: 'Syllabus', render: (r) => r.syllabus?.length > 0
        ? <Chip label={`${r.syllabus.length} topics`} size="small" color="info" icon={<School fontSize="small" />} />
        : <Typography variant="caption" color="text.disabled">—</Typography>
    },
  ];

  const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = new FormData();
    Object.entries(formData).forEach(([key, val]) => payload.append(key, val));
    
    const syllabus = syllabusInput.split('\n').map(s => s.trim()).filter(Boolean);
    syllabus.forEach(item => payload.append('syllabus[]', item));

    if (datesheetFile) payload.append('datesheet', datesheetFile);
    if (seatingPlanFile) payload.append('seatingPlan', seatingPlanFile);

    createMutation.mutate(payload, {
      onSuccess: () => { 
        setOpenModal(false); 
        setDatesheetFile(null);
        setSeatingPlanFile(null);
        showToast('Examination scheduled successfully.'); 
      },
      onError: (err) => showToast(err.response?.data?.message || 'Failed to create.', 'error'),
    });
  };

  const cs = statsData?.classStats || {};

  return (
    <Box sx={{ p: { xs: 1, sm: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">Examinations Management</Typography>
          <Typography variant="body2" color="text.secondary">
            Schedule exams with syllabus, datesheet, venue. Publish batch results with auto-grading.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddOutlined />} onClick={() => setOpenModal(true)}>
          Schedule Exam
        </Button>
      </Box>

      {/* Class Stats Panel */}
      {selectedExamId && statsData && (
        <Paper sx={{ p: 3, mb: 3, borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight={700}>Class Statistics — {statsData.examination?.title}</Typography>
            <Button size="small" onClick={() => setSelectedExamId(null)}>Close</Button>
          </Box>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6} sm={2}><StatCard label="Total" value={cs.totalStudents} color="primary" /></Grid>
            <Grid item xs={6} sm={2}><StatCard label="Passed" value={cs.passed} color="success" /></Grid>
            <Grid item xs={6} sm={2}><StatCard label="Failed" value={cs.failed} color="error" /></Grid>
            <Grid item xs={6} sm={2}><StatCard label="Pass %" value={`${cs.passPercentage}%`} color="info" /></Grid>
            <Grid item xs={6} sm={2}><StatCard label="Avg Marks" value={cs.avgMarks} color="warning" /></Grid>
            <Grid item xs={6} sm={2}><StatCard label="Need Remedial" value={cs.requiresRemedial} color="error" /></Grid>
          </Grid>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Grade Distribution</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {(statsData.gradeDistribution || []).map(g => (
              <Chip key={g._id} label={`${g._id}: ${g.count}`} color={GRADE_COLORS[g._id] || 'default'} size="small" />
            ))}
          </Box>
        </Paper>
      )}

      <DataTable columns={columns} data={exams} isLoading={isLoading} emptyMessage="No examinations scheduled." />

      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Schedule New Examination</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent dividers>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="Exam Title" name="title" value={formData.title} onChange={handleChange} required fullWidth />
              <TextField select label="Type" name="type" value={formData.type} onChange={handleChange} required fullWidth>
                {EXAM_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
              <TextField label="Subject ID" name="subjectId" value={formData.subjectId} onChange={handleChange} required fullWidth />
              <TextField label="Exam Date" name="date" type="date" value={formData.date} onChange={handleChange} required fullWidth InputLabelProps={{ shrink: true }} />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField label="Total Marks" name="totalMarks" type="number" value={formData.totalMarks} onChange={handleChange} required fullWidth />
                <TextField label="Passing Marks" name="passingMarks" type="number" value={formData.passingMarks} onChange={handleChange} required fullWidth />
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField label="Venue / Room" name="venue" value={formData.venue} onChange={handleChange} fullWidth />
                <TextField label="Duration (mins)" name="duration" type="number" value={formData.duration} onChange={handleChange} fullWidth />
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField select label="Datesheet Slot" name="datesheetSlot" value={formData.datesheetSlot} onChange={handleChange} fullWidth>
                  {DATESHEET_SLOTS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
                <TextField label="Reporting Time" name="reportingTime" placeholder="09:00 AM" value={formData.reportingTime} onChange={handleChange} fullWidth />
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Datesheet PDF (Optional)</Typography>
                  <TextField type="file" inputProps={{ accept: 'application/pdf' }} onChange={e => setDatesheetFile(e.target.files[0])} fullWidth size="small" />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Seating Plan PDF (Optional)</Typography>
                  <TextField type="file" inputProps={{ accept: 'application/pdf' }} onChange={e => setSeatingPlanFile(e.target.files[0])} fullWidth size="small" />
                </Box>
              </Box>
              <TextField
                label="Syllabus Topics (one per line)"
                multiline rows={4}
                value={syllabusInput}
                onChange={(e) => setSyllabusInput(e.target.value)}
                placeholder="Topic 1&#10;Topic 2&#10;Topic 3"
                fullWidth
                helperText="Students will see this as the exam syllabus"
              />
              <TextField label="Special Instructions" name="instructions" value={formData.instructions} onChange={handleChange} multiline rows={2} fullWidth />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenModal(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Scheduling...' : 'Schedule Exam'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast(t => ({ ...t, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={toast.severity} onClose={() => setToast(t => ({ ...t, open: false }))} sx={{ borderRadius: 2 }}>{toast.msg}</Alert>
      </Snackbar>
    </Box>
  );
};

export default HodExaminationsHub;
