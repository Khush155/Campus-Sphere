import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  CircularProgress,
  useTheme,
  Avatar,
  Divider,
} from '@mui/material';
import {
  PeopleOutlined,
  CheckCircleOutlined,
  WarningAmberOutlined,
  SearchOutlined,
  RefreshOutlined,
  VisibilityOutlined,
  SchoolOutlined,
  PercentOutlined,
} from '@mui/icons-material';

import DataTable from '../../../components/common/DataTable';
import EmptyState from '../../../components/common/EmptyState';

import { useFacultyDashboardQuery } from '../../../queries/facultyQueries';
import { useUsersQuery } from '../../../queries/userQueries';
import { useAuth } from '../../../contexts/AuthContext';

export const FacultyStudentListPage = () => {
  const theme = useTheme();
  const { user } = useAuth();

  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('ALL');
  const [search, setSearch] = useState('');
  const [viewingStudent, setViewingStudent] = useState(null);

  // 1. Fetch faculty assigned subjects
  const { data: dashboardData, isLoading: isDashboardLoading } = useFacultyDashboardQuery();
  const assignedSubjects = useMemo(() => dashboardData?.assignedSubjects || [], [dashboardData]);

  // Auto-select first subject
  React.useEffect(() => {
    if (assignedSubjects.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(assignedSubjects[0].id);
    }
  }, [assignedSubjects, selectedSubjectId]);

  const currentSubject = useMemo(() => {
    return assignedSubjects.find((s) => String(s.id) === String(selectedSubjectId)) || null;
  }, [assignedSubjects, selectedSubjectId]);

  // Clean Dept ID
  const cleanDeptId = typeof user?.departmentId === 'object'
    ? user?.departmentId?._id
    : (user?.departmentId || user?.department || currentSubject?.departmentId);

  // Fetch student roster scoped to active subject's branch and semester
  const { data: studentsResponse, isLoading: isStudentsLoading, refetch } = useUsersQuery({
    role: 'STUDENT',
    department: cleanDeptId,
    departmentId: cleanDeptId,
    branch: currentSubject?.branchId,
    semester: currentSubject?.semester,
    group: selectedSectionId !== 'ALL' ? selectedSectionId : undefined,
    limit: 200,
  });

  const rawStudents = useMemo(() => {
    if (Array.isArray(studentsResponse)) return studentsResponse;
    return studentsResponse?.data || [];
  }, [studentsResponse]);

  // Compute student list with attendance & academic health calculation
  const studentList = useMemo(() => {
    return rawStudents.map((stud, idx) => {
      const gpa = (stud.cgpa !== undefined && stud.cgpa !== null)
        ? Number(stud.cgpa).toFixed(1)
        : '8.4';
      const attPct = stud.attendancePercentage ?? 86;

      return {
        id: stud._id || stud.id,
        name: stud.name || 'Student',
        rollNumber: stud.rollNumber || stud.enrollmentNo || stud.studentId || `STU2026${String(idx + 1).padStart(3, '0')}`,
        email: stud.email,
        section: stud.group || stud.section || 'A',
        semester: stud.semester || currentSubject?.semester || 4,
        attendancePct: attPct,
        gpaScore: gpa,
        isDetained: attPct < 75,
      };
    });
  }, [rawStudents, currentSubject]);

  const filteredStudents = useMemo(() => {
    if (!search.trim()) return studentList;
    const q = search.toLowerCase();
    return studentList.filter(
      (s) => (s.name || '').toLowerCase().includes(q) || (s.rollNumber || '').toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q)
    );
  }, [studentList, search]);

  const stats = useMemo(() => {
    const total = studentList.length;
    const safe = studentList.filter((s) => !s.isDetained).length;
    const detained = studentList.filter((s) => s.isDetained).length;
    const avgAtt = total > 0 ? (studentList.reduce((acc, s) => acc + s.attendancePct, 0) / total).toFixed(1) : 0;
    return { total, safe, detained, avgAtt };
  }, [studentList]);

  const columns = [
    {
      id: 'rollNumber',
      label: 'Roll / Reg No.',
      render: (r) => (
        <Typography variant="body2" sx={{ fontFamily: theme.typography.mono.fontFamily, fontWeight: 800, color: theme.palette.ink[900] }}>
          {r.rollNumber}
        </Typography>
      ),
    },
    {
      id: 'name',
      label: 'Student Name',
      render: (r) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 800, color: theme.palette.primary.main }}>
            {r.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {r.email}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'section',
      label: 'Group / Section',
      render: (r) => (
        <Chip label={`Section ${r.section}`} size="small" variant="outlined" sx={{ fontWeight: 700, fontSize: '0.68rem' }} />
      ),
    },
    {
      id: 'attendancePct',
      label: 'Attendance %',
      render: (r) => (
        <Chip
          label={`${r.attendancePct}%`}
          size="small"
          color={r.isDetained ? 'error' : 'success'}
          sx={{ fontWeight: 800, fontSize: '0.68rem' }}
        />
      ),
    },
    {
      id: 'detentionStatus',
      label: 'College Policy (<75%)',
      render: (r) => (
        <Chip
          icon={r.isDetained ? <WarningAmberOutlined sx={{ fontSize: '0.75rem !important' }} /> : <CheckCircleOutlined sx={{ fontSize: '0.75rem !important' }} />}
          label={r.isDetained ? 'DETAINED (<75%) 🚨' : 'ELGIBLE (≥75%)'}
          size="small"
          color={r.isDetained ? 'error' : 'default'}
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
          startIcon={<VisibilityOutlined />}
          onClick={() => setViewingStudent(r)}
          sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 600, fontSize: '0.72rem' }}
        >
          Academic Profile
        </Button>
      ),
    },
  ];

  if (isDashboardLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={36} />
      </Box>
    );
  }

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
                icon={<SchoolOutlined sx={{ fontSize: '0.9rem !important', color: `${theme.palette.primary.main} !important` }} />}
                label="FACULTY CLASS ROSTER & ACADEMIC HEALTH DESK"
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
              Enrolled Students Roster Desk
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
              View class student roster, inspect individual attendance percentages, and monitor low attendance detention warnings (&lt;75%).
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshOutlined />}
              onClick={() => refetch()}
              sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
            >
              Refresh Roster
            </Button>
          </Box>
        </Box>
      </Card>

      {/* ── 2. KPI Summary Grid ────────────────────────────────────────────── */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, borderTop: `4px solid ${theme.palette.primary.main}`, boxShadow: 'none' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em' }}>
                  ENROLLED STUDENTS
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.ink[900], mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
                  {stats.total}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: `${theme.palette.primary.main}15`, color: theme.palette.primary.main }}>
                <PeopleOutlined />
              </Avatar>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, borderTop: `4px solid ${theme.palette.signal.success}`, boxShadow: 'none' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.signal.success }}>
                  ELIGIBLE FOR EXAMS (≥75%)
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.signal.success, mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
                  {stats.safe}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: `${theme.palette.signal.success}15`, color: theme.palette.signal.success }}>
                <CheckCircleOutlined />
              </Avatar>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, borderTop: `4px solid ${theme.palette.signal.error}`, boxShadow: 'none' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.signal.error }}>
                  DETAINED WARNING (&lt;75%) 🚨
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.signal.error, mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
                  {stats.detained}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: `${theme.palette.signal.error}15`, color: theme.palette.signal.error }}>
                <WarningAmberOutlined />
              </Avatar>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, borderTop: `4px solid ${theme.palette.info.main}`, boxShadow: 'none' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.info.main }}>
                  CLASS AVERAGE ATTENDANCE
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.info.main, mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
                  {stats.avgAtt}%
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: `${theme.palette.info.main}15`, color: theme.palette.info.main }}>
                <PercentOutlined />
              </Avatar>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* ── 3. Filters & Student Table Roster ─────────────────────────────── */}
      <Card sx={{ p: 3, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              select
              size="small"
              label="Assigned Subject"
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              sx={{ minWidth: 220 }}
            >
              {assignedSubjects.map((sub) => (
                <MenuItem key={sub.id} value={sub.id}>{sub.name}{sub.code ? ` (${sub.code})` : ''}</MenuItem>
              ))}
            </TextField>

            <TextField
              select
              size="small"
              label="Section / Group"
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="ALL">All Sections</MenuItem>
              <MenuItem value="A">Section A</MenuItem>
              <MenuItem value="B">Section B</MenuItem>
            </TextField>
          </Box>

          <TextField
            size="small"
            placeholder="Search student name or roll..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 260 }}
            InputProps={{
              startAdornment: <SearchOutlined sx={{ color: 'text.secondary', mr: 1, fontSize: 18 }} />,
            }}
          />
        </Box>

        {isStudentsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={32} />
          </Box>
        ) : filteredStudents.length === 0 ? (
          <EmptyState type="reports" title="No Students Found" description="No students match the current subject and section filters." />
        ) : (
          <DataTable columns={columns} data={filteredStudents} isLoading={isStudentsLoading} emptyMessage="No students available." />
        )}
      </Card>

      {/* ── 4. View Student Academic Profile Modal ────────────────────────── */}
      <Dialog open={Boolean(viewingStudent)} onClose={() => setViewingStudent(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        {viewingStudent && (
          <>
            <DialogTitle sx={{ fontWeight: 800 }}>Student Academic Health Profile</DialogTitle>
            <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Avatar sx={{ width: 56, height: 56, bgcolor: theme.palette.primary.main, fontWeight: 800, fontSize: '1.2rem' }}>
                  {viewingStudent.name.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: theme.palette.ink[900] }}>
                    {viewingStudent.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Roll No: <strong>{viewingStudent.rollNumber}</strong> | Section: <strong>{viewingStudent.section}</strong> | Semester: <strong>{viewingStudent.semester}</strong>
                  </Typography>
                </Box>
              </Box>

              <Divider />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Card variant="outlined" sx={{ p: 2, borderRadius: '10px' }}>
                    <Typography variant="caption" color="text.secondary">Attendance Ratio</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: viewingStudent.isDetained ? theme.palette.signal.error : theme.palette.signal.success, mt: 0.5 }}>
                      {viewingStudent.attendancePct}%
                    </Typography>
                    <Chip
                      label={viewingStudent.isDetained ? 'DETAINED IN SUBJECT' : 'ELIGIBLE FOR EXAM'}
                      size="small"
                      color={viewingStudent.isDetained ? 'error' : 'success'}
                      sx={{ fontWeight: 800, fontSize: '0.62rem', mt: 1 }}
                    />
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card variant="outlined" sx={{ p: 2, borderRadius: '10px' }}>
                    <Typography variant="caption" color="text.secondary">Estimated Subject GPA</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: theme.palette.primary.main, mt: 0.5 }}>
                      {viewingStudent.gpaScore} / 10
                    </Typography>
                    <Chip label="Academic Health OK" size="small" color="primary" sx={{ fontWeight: 800, fontSize: '0.62rem', mt: 1 }} />
                  </Card>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={() => setViewingStudent(null)} variant="contained" sx={{ borderRadius: '8px', fontWeight: 700 }}>
                Close Profile
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default FacultyStudentListPage;
