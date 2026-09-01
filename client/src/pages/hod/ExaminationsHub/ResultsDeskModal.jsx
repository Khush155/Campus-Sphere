import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Chip,
  Switch,
  FormControlLabel,
  InputAdornment,
  CircularProgress,
  Avatar,
  useTheme,
  Alert,
} from '@mui/material';
import {
  GradingOutlined,
  PublishOutlined,
  CheckCircleOutlined,
  CancelOutlined,
  PersonOffOutlined,
  PeopleOutlined,
  Close,
  BarChart,
  SchoolOutlined,
} from '@mui/icons-material';
import {
  useExamStudentsForGradingQuery,
  useBatchPublishResultsMutation,
} from '../../../queries/hodQueries';
import { useToast } from '../../../contexts/ToastContext';

const GRADE_COLORS = {
  O: 'success',
  'A+': 'success',
  A: 'primary',
  'B+': 'secondary',
  B: 'info',
  C: 'warning',
  F: 'error',
  AB: 'default',
};

const computeGrade = (percentage, isAbsent) => {
  if (isAbsent) return { grade: 'AB', gradePoint: 0, status: 'ABSENT' };
  if (percentage >= 91) return { grade: 'O', gradePoint: 10, status: 'PASS' };
  if (percentage >= 81) return { grade: 'A+', gradePoint: 9, status: 'PASS' };
  if (percentage >= 71) return { grade: 'A', gradePoint: 8, status: 'PASS' };
  if (percentage >= 61) return { grade: 'B+', gradePoint: 7, status: 'PASS' };
  if (percentage >= 51) return { grade: 'B', gradePoint: 6, status: 'PASS' };
  if (percentage >= 40) return { grade: 'C', gradePoint: 5, status: 'PASS' };
  return { grade: 'F', gradePoint: 0, status: 'FAIL' };
};

export const ResultsDeskModal = ({ open, onClose, examination, onSuccess }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { showToast } = useToast();

  const examId = examination?._id || examination?.id;
  const totalMarks = Number(examination?.totalMarks) || 100;
  const passingMarks = Number(examination?.passingMarks) || 40;

  const { data: gradingData, isLoading } = useExamStudentsForGradingQuery(open ? examId : null);
  const publishMutation = useBatchPublishResultsMutation();

  const [studentRows, setStudentRows] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Sync rows whenever grading data arrives
  useEffect(() => {
    if (gradingData?.students) {
      const rows = gradingData.students.map((s) => {
        const hasMarks = s.marksObtained !== '' && s.marksObtained !== null && s.marksObtained !== undefined;
        const marksNum = hasMarks ? Number(s.marksObtained) : 0;
        const pct = hasMarks ? Math.round((marksNum / totalMarks) * 100 * 100) / 100 : 0;
        const evalGrade = computeGrade(pct, s.isAbsent);

        return {
          studentId: s.studentId,
          name: s.name,
          email: s.email,
          rollNumber: s.rollNumber,
          group: s.group,
          marksObtained: hasMarks ? s.marksObtained : '',
          isAbsent: Boolean(s.isAbsent),
          percentage: hasMarks ? pct : null,
          grade: s.grade || (hasMarks ? evalGrade.grade : null),
          gradePoint: s.gradePoint !== null ? s.gradePoint : (hasMarks ? evalGrade.gradePoint : null),
          status: s.status || (hasMarks ? evalGrade.status : null),
        };
      });
      setStudentRows(rows);
    }
  }, [gradingData, totalMarks]);

  const handleMarkChange = (studentId, rawValue) => {
    setStudentRows((prev) =>
      prev.map((r) => {
        if (r.studentId !== studentId) return r;
        if (rawValue === '') {
          return { ...r, marksObtained: '', percentage: null, grade: null, gradePoint: null, status: null };
        }
        let num = parseFloat(rawValue);
        if (isNaN(num)) num = 0;
        if (num < 0) num = 0;
        if (num > totalMarks) num = totalMarks;

        const pct = Math.round((num / totalMarks) * 100 * 100) / 100;
        const evalGrade = computeGrade(pct, r.isAbsent);

        return {
          ...r,
          marksObtained: num,
          percentage: pct,
          grade: evalGrade.grade,
          gradePoint: evalGrade.gradePoint,
          status: evalGrade.status,
        };
      })
    );
  };

  const handleAbsentToggle = (studentId, isAbsent) => {
    setStudentRows((prev) =>
      prev.map((r) => {
        if (r.studentId !== studentId) return r;
        if (isAbsent) {
          return {
            ...r,
            isAbsent: true,
            marksObtained: 0,
            percentage: 0,
            grade: 'AB',
            gradePoint: 0,
            status: 'ABSENT',
          };
        }
        return {
          ...r,
          isAbsent: false,
          marksObtained: '',
          percentage: null,
          grade: null,
          gradePoint: null,
          status: null,
        };
      })
    );
  };

  // Quick stats computed live from studentRows
  const stats = useMemo(() => {
    const total = studentRows.length;
    const evaluated = studentRows.filter((r) => r.marksObtained !== '' || r.isAbsent).length;
    const passed = studentRows.filter((r) => !r.isAbsent && r.status === 'PASS').length;
    const failed = studentRows.filter((r) => !r.isAbsent && r.status === 'FAIL').length;
    const absent = studentRows.filter((r) => r.isAbsent).length;
    const passPct = evaluated > 0 ? Math.round((passed / Math.max(evaluated - absent, 1)) * 100) : 0;
    return { total, evaluated, passed, failed, absent, passPct };
  }, [studentRows]);

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return studentRows;
    const q = searchQuery.toLowerCase();
    return studentRows.filter(
      (r) =>
        r.name?.toLowerCase().includes(q) ||
        r.rollNumber?.toLowerCase().includes(q) ||
        r.group?.toLowerCase().includes(q)
    );
  }, [studentRows, searchQuery]);

  const handlePublish = () => {
    const readyResults = studentRows
      .filter((r) => r.marksObtained !== '' || r.isAbsent)
      .map((r) => ({
        studentId: r.studentId,
        marksObtained: r.isAbsent ? 0 : Number(r.marksObtained || 0),
        isAbsent: r.isAbsent,
      }));

    if (readyResults.length === 0) {
      showToast('Please enter marks for at least one student before publishing.', { severity: 'warning' });
      return;
    }

    publishMutation.mutate(
      { examId, results: readyResults },
      {
        onSuccess: (res) => {
          showToast(res?.message || `Published results for ${readyResults.length} students!`, { severity: 'success' });
          if (onSuccess) onSuccess();
          onClose();
        },
        onError: (err) => {
          showToast(err.response?.data?.message || 'Failed to publish examination results.', { severity: 'error' });
        },
      }
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '20px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <DialogTitle
        sx={{
          px: 3.5,
          py: 2.5,
          borderBottom: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            sx={{
              width: 44,
              height: 44,
              borderRadius: '12px',
              bgcolor: `${theme.palette.primary.main}15`,
              color: theme.palette.primary.main,
            }}
          >
            <GradingOutlined />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
              Results & Marks Evaluation Desk
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {examination?.title} •{' '}
              <strong>{examination?.subjectId?.name || 'Subject'}</strong> ({examination?.subjectId?.code})
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            icon={<SchoolOutlined sx={{ fontSize: '0.85rem !important' }} />}
            label={`${examination?.courseId?.code || 'Course'} • ${examination?.branchId?.code || 'Branch'} • Sem ${examination?.semester || '—'}`}
            color="primary"
            variant="outlined"
            size="small"
            sx={{ fontWeight: 800, fontSize: '0.72rem' }}
          />
          <Button
            size="small"
            onClick={onClose}
            sx={{ minWidth: 36, width: 36, height: 36, p: 0, borderRadius: '50%', color: 'text.secondary' }}
          >
            <Close fontSize="small" />
          </Button>
        </Box>
      </DialogTitle>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <DialogContent sx={{ p: 3.5, overflowY: 'auto' }}>
        {/* KPI Mini-Bar */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Total Enrolled', value: stats.total, color: 'text.primary', icon: <PeopleOutlined fontSize="small" /> },
            { label: 'Evaluated', value: `${stats.evaluated} / ${stats.total}`, color: 'primary.main', icon: <GradingOutlined fontSize="small" /> },
            { label: 'Passed', value: stats.passed, color: 'success.main', icon: <CheckCircleOutlined fontSize="small" /> },
            { label: 'Failed', value: stats.failed, color: 'error.main', icon: <CancelOutlined fontSize="small" /> },
            { label: 'Absent', value: stats.absent, color: 'warning.main', icon: <PersonOffOutlined fontSize="small" /> },
            { label: 'Pass Rate', value: `${stats.passPct}%`, color: 'info.main', icon: <BarChart fontSize="small" /> },
          ].map((k) => (
            <Grid item xs={6} sm={4} md={2} key={k.label}>
              <Paper
                elevation={0}
                sx={{
                  p: 1.75,
                  borderRadius: '12px',
                  border: `1px solid ${theme.palette.divider}`,
                  bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                  textAlign: 'center',
                }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.62rem' }}>
                  {k.label}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 900, color: k.color, mt: 0.25 }}>
                  {k.value}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Search bar & instructions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search student by name, roll number, or group..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ minWidth: { xs: '100%', sm: 320 }, bgcolor: isDark ? 'background.paper' : '#fff' }}
          />
          <Typography variant="caption" color="text.secondary">
            Max Marks: <strong>{totalMarks}</strong> &bull; Passing Marks: <strong>{passingMarks}</strong>
          </Typography>
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
            <CircularProgress size={36} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Loading enrolled class students for this cohort...
            </Typography>
          </Box>
        ) : studentRows.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: '12px', my: 3 }}>
            No students currently found enrolled in Course{' '}
            <strong>{examination?.courseId?.code || 'Course'}</strong>, Branch{' '}
            <strong>{examination?.branchId?.name || 'Branch'}</strong>, Semester{' '}
            <strong>{examination?.semester}</strong>. Please ensure students are assigned to this branch and semester in the Student Roster.
          </Alert>
        ) : (
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{
              borderRadius: '14px',
              border: `1px solid ${theme.palette.divider}`,
              overflow: 'hidden',
            }}
          >
            <Table size="small">
              <TableHead sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Student Candidate</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Roll Number</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Group</TableCell>
                  <TableCell sx={{ fontWeight: 800, width: 220 }}>Marks Scored (Max {totalMarks})</TableCell>
                  <TableCell sx={{ fontWeight: 800, textAlign: 'center' }}>Absent?</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Grade Point</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRows.map((r) => (
                  <TableRow
                    key={r.studentId}
                    hover
                    sx={{
                      bgcolor: r.isAbsent
                        ? isDark
                          ? 'rgba(245, 158, 11, 0.05)'
                          : 'rgba(245, 158, 11, 0.03)'
                        : 'inherit',
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            fontSize: 13,
                            fontWeight: 800,
                            bgcolor: `${theme.palette.primary.main}15`,
                            color: theme.palette.primary.main,
                          }}
                        >
                          {r.name?.charAt(0) || 'S'}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {r.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {r.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={r.rollNumber}
                        size="small"
                        sx={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.72rem' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {r.group || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        placeholder="0"
                        disabled={r.isAbsent}
                        value={r.marksObtained}
                        onChange={(e) => handleMarkChange(r.studentId, e.target.value)}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">/ {totalMarks}</InputAdornment>,
                          inputProps: { min: 0, max: totalMarks, step: '0.5' },
                          sx: { borderRadius: '8px', fontWeight: 800, fontFamily: 'monospace' },
                        }}
                        sx={{ width: 150 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <FormControlLabel
                        control={
                          <Switch
                            size="small"
                            checked={r.isAbsent}
                            color="warning"
                            onChange={(e) => handleAbsentToggle(r.studentId, e.target.checked)}
                          />
                        }
                        label={<Typography variant="caption" sx={{ fontWeight: 700 }}>{r.isAbsent ? 'ABSENT' : 'PRE'}</Typography>}
                        sx={{ m: 0 }}
                      />
                    </TableCell>
                    <TableCell>
                      {r.grade ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <Chip
                            label={`${r.grade} (${r.gradePoint} pt)`}
                            size="small"
                            color={GRADE_COLORS[r.grade] || 'default'}
                            sx={{ fontWeight: 900, fontSize: '0.68rem', fontFamily: 'monospace' }}
                          />
                        </Box>
                      ) : (
                        <Typography variant="caption" color="text.disabled">—</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {r.status ? (
                        <Chip
                          label={r.status}
                          size="small"
                          color={r.status === 'PASS' ? 'success' : r.status === 'ABSENT' ? 'warning' : 'error'}
                          sx={{ fontWeight: 800, fontSize: '0.65rem' }}
                        />
                      ) : (
                        <Typography variant="caption" color="text.secondary">Unevaluated</Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <DialogActions sx={{ px: 3.5, py: 2.5, borderTop: `1px solid ${theme.palette.divider}`, gap: 1.5 }}>
        <Button onClick={onClose} variant="outlined" sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700 }}>
          Cancel
        </Button>
        <Button
          onClick={handlePublish}
          variant="contained"
          disabled={publishMutation.isPending || studentRows.length === 0}
          startIcon={publishMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <PublishOutlined />}
          sx={{
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 800,
            px: 3.5,
            background: theme.palette.primary.gradient || theme.palette.primary.main,
            color: '#fff',
          }}
        >
          {publishMutation.isPending ? 'Publishing Results...' : 'Publish Official Results'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ResultsDeskModal;
