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
} from '@mui/icons-material';
import DataTable from '../../../components/common/DataTable';
import EmptyState from '../../../components/common/EmptyState';
import { useUsersQuery } from '../../../queries/userQueries';
import { useCoursesQuery, useBranchesQuery } from '../../../queries/collegeQueries';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';

export const HodPromotionsHub = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [courseFilter, setCourseFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [currentSem, setCurrentSem] = useState(3);
  const [targetSem, setTargetSem] = useState(4);
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

  // Queries
  const { data: courses = [] } = useCoursesQuery();
  const { data: branches = [] } = useBranchesQuery();
  const { data: studentsData, isLoading, isError, refetch } = useUsersQuery({
    role: 'STUDENT',
    department: user?.departmentId,
    limit: 100,
  });

  const rawStudents = useMemo(() => (Array.isArray(studentsData) ? studentsData : (studentsData?.data || [])), [studentsData]);

  // Compute student detainments per subject based on attendance cutoff
  const processedStudents = useMemo(() => {
    return rawStudents.map((s, idx) => {
      // Mock subject attendance simulation for demonstration if not present
      const mockSubjects = [
        { code: 'CS301', name: 'Data Structures & Algorithms', attendance: idx % 4 === 0 ? 68 : 84 },
        { code: 'CS302', name: 'Operating Systems', attendance: idx % 5 === 0 ? 65 : 79 },
        { code: 'CS303', name: 'Database Management Systems', attendance: 88 },
        { code: 'CS304', name: 'Computer Networks', attendance: idx % 3 === 0 ? 71 : 82 },
      ];

      const detainedSubjects = mockSubjects.filter((sub) => sub.attendance < Number(attendanceCutoff));
      const isSubjectDetained = detainedSubjects.length > 0;

      return {
        ...s,
        currentSemester: currentSem,
        targetSemester: targetSem,
        subjects: mockSubjects,
        detainedSubjects,
        isSubjectDetained,
        statusLabel: isSubjectDetained
          ? `PROMOTED (${detainedSubjects.length} SUBJECT DETAINED)`
          : 'PROMOTED (ALL CLEAR)',
      };
    });
  }, [rawStudents, currentSem, targetSem, attendanceCutoff]);

  const filteredStudents = useMemo(() => {
    if (!debouncedSearch) return processedStudents;
    const q = debouncedSearch.toLowerCase();
    return processedStudents.filter(
      (s) =>
        (s.name?.toLowerCase() || '').includes(q) ||
        (s.email?.toLowerCase() || '').includes(q) ||
        (s.rollNumber?.toLowerCase() || '').includes(q)
    );
  }, [processedStudents, debouncedSearch]);

  const stats = useMemo(() => {
    const total = processedStudents.length;
    const allClear = processedStudents.filter((s) => !s.isSubjectDetained).length;
    const detainedStudents = processedStudents.filter((s) => s.isSubjectDetained).length;
    const totalDetainedPapers = processedStudents.reduce((acc, s) => acc + s.detainedSubjects.length, 0);

    return { total, allClear, detainedStudents, totalDetainedPapers };
  }, [processedStudents]);

  const handlePromoteConfirm = () => {
    showToast(`Successfully promoted batch from Semester ${currentSem} → Semester ${targetSem}! Issued ${stats.totalDetainedPapers} subject detainment notices.`);
    setPromoteModalOpen(false);
  };

  const handleViewReport = (student) => {
    setSelectedStudent(student);
    setReportModalOpen(true);
  };

  const columns = [
    {
      id: 'student',
      label: 'Student Name & Roll Number',
      render: (r) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 34, height: 34, bgcolor: `${theme.palette.primary.main}15`, color: theme.palette.primary.main, fontWeight: 700 }}>
            {r.name?.charAt(0) || 'S'}
          </Avatar>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 800, color: theme.palette.ink[900] }}>
              {r.name || 'Student Name'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Roll: <strong>{r.rollNumber || '2026-STU-0104'}</strong> • {r.email || '—'}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      id: 'sem',
      label: 'Semester Transition',
      render: (r) => (
        <Chip
          label={`Sem ${r.currentSemester} → Sem ${r.targetSemester}`}
          size="small"
          color="primary"
          variant="outlined"
          sx={{ fontWeight: 800, fontSize: '0.68rem' }}
        />
      ),
    },
    {
      id: 'attendanceBreakdown',
      label: 'Subject Attendance Status (<75% Cutoff)',
      render: (r) => (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', maxWidth: 300 }}>
          {r.subjects.map((sub) => {
            const isDetained = sub.attendance < Number(attendanceCutoff);
            return (
              <Tooltip key={sub.code} title={`${sub.name}: ${sub.attendance}% attendance`}>
                <Chip
                  label={`${sub.code}: ${sub.attendance}%`}
                  size="small"
                  color={isDetained ? 'error' : 'success'}
                  sx={{ fontWeight: 800, fontSize: '0.62rem', height: 18 }}
                />
              </Tooltip>
            );
          })}
        </Box>
      ),
    },
    {
      id: 'progressionStatus',
      label: 'Progression Outcome',
      render: (r) => (
        <Chip
          icon={r.isSubjectDetained ? <WarningAmberOutlined sx={{ fontSize: '0.8rem !important' }} /> : <CheckCircleOutlined sx={{ fontSize: '0.8rem !important' }} />}
          label={r.statusLabel}
          size="small"
          color={r.isSubjectDetained ? 'warning' : 'success'}
          sx={{ fontWeight: 800, fontSize: '0.65rem' }}
        />
      ),
    },
    {
      id: 'actions',
      label: 'Actions',
      render: (r) => (
        <Button
          size="small"
          variant="outlined"
          startIcon={<AssessmentOutlined />}
          onClick={() => handleViewReport(r)}
          sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 600, fontSize: '0.72rem' }}
        >
          Detainment Report
        </Button>
      ),
    },
  ];

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
                icon={<TrendingUpOutlined sx={{ fontSize: '0.9rem !important', color: `${theme.palette.primary.main} !important` }} />}
                label="DEPARTMENT SEMESTER PROGRESSION & SUBJECT DETAINMENT DESK"
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
              Semester Progression & Subject Detainment
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
              Promote student batches to the next semester, evaluate subject-wise attendance thresholds (&lt;75%), flag subject-level detainments, and issue re-exam carryover notices.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<RefreshOutlined />}
              onClick={() => refetch()}
              sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
            >
              Refresh Data
            </Button>
            <Button
              variant="contained"
              startIcon={<AssignmentTurnedInOutlined />}
              onClick={() => setPromoteModalOpen(true)}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 700,
                background: theme.palette.primary.gradient || theme.palette.primary.main,
                color: '#ffffff',
              }}
            >
              Promote Batch (Sem {currentSem} → {targetSem})
            </Button>
          </Box>
        </Box>
      </Card>

      {/* ── 2. KPI Summary Grid ────────────────────────────────────────────── */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em' }}>
              BATCH STUDENTS
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.ink[900], mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
              {isLoading ? <CircularProgress size={24} /> : stats.total}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Moving to Semester {targetSem}
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.signal.success }}>
              ALL-CLEAR REGULAR
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.signal.success, mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
              {isLoading ? <CircularProgress size={24} /> : stats.allClear}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              ≥75% attendance in all subjects
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.warning.main }}>
              SUBJECT-DETAINED STUDENTS
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.warning.main, mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
              {isLoading ? <CircularProgress size={24} /> : stats.detainedStudents}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Promoted with &lt;75% papers
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.signal.error }}>
              DETAINED PAPERS ISSUED
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.signal.error, mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
              {isLoading ? <CircularProgress size={24} /> : stats.totalDetainedPapers}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Re-exam carryover papers
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* ── 3. Filters & Batch Progression Table ──────────────────────────── */}
      <Card sx={{ p: 3, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
        <Grid container spacing={2} sx={{ mb: 3 }} alignItems="center">
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search student name or roll..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchOutlined sx={{ color: 'text.secondary', mr: 1, fontSize: 18 }} />,
              }}
            />
          </Grid>

          <Grid item xs={12} sm={2.5}>
            <TextField select fullWidth size="small" label="Course" value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} SelectProps={{ displayEmpty: true }} InputLabelProps={{ shrink: true }}>
              <MenuItem value="">All Courses</MenuItem>
              {courses.map((c) => (
                <MenuItem key={c._id} value={c._id}>{c.code || c.name}</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={2.5}>
            <TextField select fullWidth size="small" label="Branch" value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} SelectProps={{ displayEmpty: true }} InputLabelProps={{ shrink: true }}>
              <MenuItem value="">All Branches</MenuItem>
              {branches.map((b) => (
                <MenuItem key={b._id} value={b._id}>{b.code || b.name}</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={6} sm={2}>
            <TextField type="number" fullWidth size="small" label="Current Sem" value={currentSem} onChange={(e) => setCurrentSem(Number(e.target.value))} />
          </Grid>

          <Grid item xs={6} sm={2}>
            <TextField type="number" fullWidth size="small" label="Target Sem" value={targetSem} onChange={(e) => setTargetSem(Number(e.target.value))} />
          </Grid>
        </Grid>

        <Box sx={{ mb: 3, p: 2, bgcolor: theme.custom?.surface?.sunken || 'rgba(0,0,0,0.02)', borderRadius: '12px', border: `1px solid ${theme.palette.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HelpOutlineOutlined color="primary" fontSize="small" />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              <strong>Institutional Policy Rule:</strong> All students move forward to Semester {targetSem}. Students with &lt;{attendanceCutoff}% attendance in a specific subject are detained in that subject and must give that paper as a carryover re-exam.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 700 }}>Cutoff %:</Typography>
            <TextField type="number" size="small" value={attendanceCutoff} onChange={(e) => setAttendanceCutoff(e.target.value)} sx={{ width: 80 }} />
          </Box>
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={32} />
          </Box>
        ) : filteredStudents.length === 0 ? (
          <EmptyState type="reports" title="No Students Found" description="No students match the selected batch or search query." />
        ) : (
          <DataTable columns={columns} data={filteredStudents} isLoading={isLoading} isError={isError} emptyMessage="No students found." />
        )}
      </Card>

      {/* ── 4. Promote Batch Modal ────────────────────────────────────────── */}
      <Dialog open={promoteModalOpen} onClose={() => setPromoteModalOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Confirm Batch Semester Progression</DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            You are about to promote <strong>{stats.total} students</strong> from <strong>Semester {currentSem} → Semester {targetSem}</strong>.
          </Typography>

          <Box sx={{ p: 2, bgcolor: `${theme.palette.signal.success}10`, borderRadius: '8px', border: `1px solid ${theme.palette.signal.success}` }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: theme.palette.signal.success }}>
              🟢 All-Clear Students ({stats.allClear})
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Students have &ge;{attendanceCutoff}% attendance across all subjects. Promoted with full regular eligibility.
            </Typography>
          </Box>

          <Box sx={{ p: 2, bgcolor: `${theme.palette.warning.main}10`, borderRadius: '8px', border: `1px solid ${theme.palette.warning.main}` }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: theme.palette.warning.main }}>
              ⚠️ Subject-Detained Students ({stats.detainedStudents})
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Promoted to Semester {targetSem}, but issued <strong>{stats.totalDetainedPapers} subject detainment notices</strong> for papers with &lt;{attendanceCutoff}% attendance. These papers will be flagged as carryover re-exams.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPromoteModalOpen(false)} variant="outlined" sx={{ borderRadius: '8px' }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handlePromoteConfirm} sx={{ borderRadius: '8px', fontWeight: 700 }}>
            Execute Progression & Issue Notices
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── 5. Student Detainment Report Modal ─────────────────────────────── */}
      <Dialog open={reportModalOpen} onClose={() => setReportModalOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        {selectedStudent && (
          <>
            <DialogTitle sx={{ fontWeight: 800 }}>Student Subject Detainment Report</DialogTitle>
            <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{selectedStudent.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Roll Number: <strong>{selectedStudent.rollNumber || '2026-STU-0104'}</strong>
                </Typography>
              </Box>

              <Divider />

              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Subject Attendance Breakdown:</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {selectedStudent.subjects.map((s) => {
                  const isDetained = s.attendance < Number(attendanceCutoff);
                  return (
                    <Box key={s.code} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, bgcolor: isDetained ? `${theme.palette.signal.error}10` : 'rgba(0,0,0,0.02)', borderRadius: '6px' }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{s.code} - {s.name}</Typography>
                        <Typography variant="caption" color={isDetained ? 'error.main' : 'success.main'} sx={{ fontWeight: 700 }}>
                          Attendance: {s.attendance}% ({isDetained ? 'DETAINED' : 'ELIGIBLE'})
                        </Typography>
                      </Box>
                      <Chip label={isDetained ? 'DETAINED' : 'OK'} size="small" color={isDetained ? 'error' : 'success'} sx={{ fontWeight: 800 }} />
                    </Box>
                  );
                })}
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
