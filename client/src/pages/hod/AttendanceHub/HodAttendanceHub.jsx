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
  LinearProgress,
  Grid,
  Card,
  useTheme,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Avatar,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import {
  WarningAmber,
  CheckCircle,
  LocalHospital,
  DownloadOutlined,
  SearchOutlined,
  RefreshOutlined,
  FactCheckOutlined,
  SchoolOutlined,
} from '@mui/icons-material';
import DataTable from '../../../components/common/DataTable';
import EmptyState from '../../../components/common/EmptyState';
import {
  useAttendanceQuery,
  useAttendanceSummaryQuery,
  useBulkMarkAttendanceMutation,
  useApproveMedicalLeaveMutation,
} from '../../../queries/hodQueries';
import { useSubjectsQuery } from '../../../queries/collegeQueries';
import { useUsersQuery } from '../../../queries/userQueries';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';

const SESSION_TYPES = ['LECTURE', 'LAB', 'TUTORIAL'];
const AT_RISK_THRESHOLD = 75;

const AttendanceBar = ({ pct }) => {
  const color = pct < AT_RISK_THRESHOLD ? 'error' : pct < 85 ? 'warning' : 'success';
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 140 }}>
      <LinearProgress
        variant="determinate"
        value={Math.min(pct, 100)}
        color={color}
        sx={{ flex: 1, height: 8, borderRadius: 4 }}
      />
      <Typography variant="caption" fontWeight={700} color={`${color}.main`}>
        {pct}%
      </Typography>
    </Box>
  );
};

const getCleanId = (val) => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (val._id) return String(val._id);
  if (val.id) return String(val.id);
  return String(val);
};

export const HodAttendanceHub = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const { showToast } = useToast();
  const cleanDeptId = getCleanId(user?.departmentId || user?.department);

  // View & Tab state
  const [viewMode, setViewMode] = useState('summary'); // 'summary' | 'records'

  // Filter States
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedSessionType, setSelectedSessionType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Bulk Mark Modal States
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkFormData, setBulkFormData] = useState({
    subjectId: '',
    date: new Date().toISOString().split('T')[0],
    sessionType: 'LECTURE',
  });
  const [bulkStudentStatuses, setBulkStudentStatuses] = useState({});

  // Debounce search input
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Queries
  const { data: subjects = [] } = useSubjectsQuery(cleanDeptId ? { departmentId: cleanDeptId } : {});

  // Set default subject selection for Summary mode if subjects are loaded
  React.useEffect(() => {
    if (subjects.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(String(subjects[0]._id || subjects[0].id));
    }
  }, [subjects, selectedSubjectId]);

  const { data: records = [], isLoading: recordsLoading, refetch: refetchRecords } = useAttendanceQuery({
    subjectId: selectedSubjectId || undefined,
    sessionType: selectedSessionType || undefined,
    status: selectedStatus || undefined,
    date: selectedDate || undefined,
  });

  const { data: summaryData, isLoading: summaryLoading, refetch: refetchSummary } = useAttendanceSummaryQuery(selectedSubjectId);
  const { data: studentsData } = useUsersQuery({ role: 'STUDENT', department: cleanDeptId, limit: 100 });

  const approveMedical = useApproveMedicalLeaveMutation();
  const bulkMarkMutation = useBulkMarkAttendanceMutation();

  const handleRefresh = () => {
    refetchRecords();
    refetchSummary();
  };

  // Filter records locally for search text (Student Name/Email)
  const filteredRecords = useMemo(() => {
    if (!records) return [];
    if (!debouncedSearch) return records;
    const query = debouncedSearch.toLowerCase();
    return records.filter((r) => {
      const studentName = r.studentId?.name?.toLowerCase() || '';
      const studentEmail = r.studentId?.email?.toLowerCase() || '';
      const subjectName = r.subjectId?.name?.toLowerCase() || '';
      return studentName.includes(query) || studentEmail.includes(query) || subjectName.includes(query);
    });
  }, [records, debouncedSearch]);

  // Filter summary list locally for search text
  const filteredSummary = useMemo(() => {
    const list = summaryData?.summary || [];
    if (!debouncedSearch) return list;
    const query = debouncedSearch.toLowerCase();
    return list.filter((s) => (s.name?.toLowerCase() || '').includes(query) || (s.email?.toLowerCase() || '').includes(query));
  }, [summaryData, debouncedSearch]);

  const summaryList = summaryData?.summary || [];
  const atRiskStudents = summaryList.filter((s) => s.isAtRisk);
  const adequateStudents = summaryList.filter((s) => !s.isAtRisk);
  const medicalCount = summaryList.reduce((acc, s) => acc + (s.medicalLeave || 0), 0);

  const handleApproveMedical = async (id, name) => {
    try {
      await approveMedical.mutateAsync(id);
      showToast(`Medical leave approved for ${name}. Absence excluded from calculation.`);
      handleRefresh();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to approve medical leave.', { severity: 'error' });
    }
  };

  // CSV Download Handler
  const handleDownloadCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';

    if (viewMode === 'records') {
      csvContent += 'Student Name,Student Email,Subject Code,Subject Name,Session Type,Date,Status,Medical Approved\n';
      filteredRecords.forEach((r) => {
        const studentName = `"${r.studentId?.name || 'N/A'}"`;
        const studentEmail = `"${r.studentId?.email || 'N/A'}"`;
        const subjectCode = `"${r.subjectId?.code || 'N/A'}"`;
        const subjectName = `"${r.subjectId?.name || 'N/A'}"`;
        const sessionType = `"${r.sessionType || 'LECTURE'}"`;
        const dateStr = `"${new Date(r.date).toLocaleDateString('en-IN')}"`;
        const status = `"${r.status || 'N/A'}"`;
        const medical = r.isMedicalApproved ? 'YES' : 'NO';

        csvContent += `${studentName},${studentEmail},${subjectCode},${subjectName},${sessionType},${dateStr},${status},${medical}\n`;
      });
    } else {
      csvContent += 'Student Name,Student Email,Present,Absent,Medical Leave,Total Classes,Attendance %,Status\n';
      filteredSummary.forEach((s) => {
        const studentName = `"${s.name || 'N/A'}"`;
        const studentEmail = `"${s.email || 'N/A'}"`;
        const present = s.present || 0;
        const absent = s.absent || 0;
        const medical = s.medicalLeave || 0;
        const total = s.total || 0;
        const percentage = `${s.percentage || 0}%`;
        const status = s.isAtRisk ? 'AT RISK' : 'ADEQUATE';

        csvContent += `${studentName},${studentEmail},${present},${absent},${medical},${total},${percentage},${status}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `attendance_${viewMode}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open Bulk Mark Modal
  const handleOpenBulkModal = () => {
    const initialSubject = selectedSubjectId || (subjects[0]?._id || subjects[0]?.id || '');
    setBulkFormData({
      subjectId: initialSubject,
      date: new Date().toISOString().split('T')[0],
      sessionType: 'LECTURE',
    });

    const students = studentsData?.data || [];
    const initialMap = {};
    students.forEach((st) => {
      initialMap[st.id || st._id] = 'PRESENT';
    });
    setBulkStudentStatuses(initialMap);
    setBulkModalOpen(true);
  };

  const handleBulkStatusChange = (studentId, status) => {
    setBulkStudentStatuses((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleBulkMarkSubmit = async (e) => {
    e.preventDefault();
    const studentsList = Object.entries(bulkStudentStatuses).map(([studentId, status]) => ({
      studentId,
      status,
    }));

    if (studentsList.length === 0) {
      showToast('No students available for bulk marking.', { severity: 'error' });
      return;
    }

    try {
      await bulkMarkMutation.mutateAsync({
        subjectId: bulkFormData.subjectId,
        date: bulkFormData.date,
        sessionType: bulkFormData.sessionType,
        students: studentsList,
      });
      showToast('Bulk attendance session recorded successfully!');
      setBulkModalOpen(false);
      handleRefresh();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit bulk attendance', { severity: 'error' });
    }
  };

  const recordColumns = [
    {
      id: 'student',
      label: 'Student Name & Email',
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: `${theme.palette.primary.main}15`, color: theme.palette.primary.main, fontSize: '0.85rem', fontWeight: 700 }}>
            {row.studentId?.name?.charAt(0) || 'S'}
          </Avatar>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.ink[900] }}>
              {row.studentId?.name || 'Student'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {row.studentId?.email || 'N/A'}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      id: 'subject',
      label: 'Subject',
      render: (row) => row.subjectId?.name || 'N/A',
    },
    {
      id: 'date',
      label: 'Session Date',
      render: (row) => new Date(row.date).toLocaleDateString('en-IN'),
    },
    {
      id: 'type',
      label: 'Session Type',
      render: (row) => (
        <Chip label={row.sessionType || 'LECTURE'} size="small" variant="outlined" sx={{ fontWeight: 700, fontSize: '0.68rem' }} />
      ),
    },
    {
      id: 'status',
      label: 'Attendance Status',
      render: (row) => (
        <Chip
          label={row.status || 'PRESENT'}
          size="small"
          color={row.status === 'PRESENT' ? 'success' : row.status === 'ABSENT' ? 'error' : 'warning'}
          sx={{ fontWeight: 800, fontSize: '0.65rem' }}
        />
      ),
    },
    {
      id: 'medical',
      label: 'Medical Action',
      render: (row) =>
        row.status === 'ABSENT' && !row.isMedicalApproved ? (
          <Button
            size="small"
            variant="outlined"
            color="info"
            startIcon={<LocalHospital />}
            onClick={() => handleApproveMedical(row._id || row.id, row.studentId?.name)}
            sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 600, fontSize: '0.72rem' }}
          >
            Approve Medical
          </Button>
        ) : row.isMedicalApproved ? (
          <Chip icon={<CheckCircle sx={{ fontSize: '0.8rem !important' }} />} label="Medical Excused" size="small" color="info" sx={{ fontWeight: 800, fontSize: '0.62rem' }} />
        ) : (
          <Typography variant="caption" color="text.disabled">—</Typography>
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
                icon={<FactCheckOutlined sx={{ fontSize: '0.9rem !important', color: `${theme.palette.primary.main} !important` }} />}
                label="DEPARTMENT ATTENDANCE ANALYTICS & LOW-ATTENDANCE WARNINGS DESK"
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
              Attendance Analytics & Low-Attendance Warnings
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
              Track attendance percentages per subject, detect at-risk students (&lt;75%), approve medical leave exemptions, and export attendance CSVs.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<RefreshOutlined />}
              onClick={handleRefresh}
              sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
            >
              Refresh
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadOutlined />}
              onClick={handleDownloadCSV}
              sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
            >
              Export CSV
            </Button>
            <Button
              variant="contained"
              startIcon={<FactCheckOutlined />}
              onClick={handleOpenBulkModal}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 700,
                background: theme.palette.primary.gradient || theme.palette.primary.main,
                color: '#ffffff',
              }}
            >
              Mark Session Attendance
            </Button>
          </Box>
        </Box>
      </Card>

      {/* ── 2. KPI Summary Grid ────────────────────────────────────────────── */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em' }}>
              SUBJECT STUDENTS
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.ink[900], mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
              {summaryLoading ? <CircularProgress size={24} /> : summaryList.length}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Tracked in selected subject
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.signal.success }}>
              ADEQUATE ATTENDANCE (&gt;75%)
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.signal.success, mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
              {summaryLoading ? <CircularProgress size={24} /> : adequateStudents.length}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Eligible for examinations
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.signal.error }}>
              AT-RISK STUDENTS (&lt;75%)
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.signal.error, mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
              {summaryLoading ? <CircularProgress size={24} /> : atRiskStudents.length}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Low-attendance warnings
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.info?.main || '#0288d1' }}>
              MEDICAL LEAVES EXCUSED
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.info?.main || '#0288d1', mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
              {summaryLoading ? <CircularProgress size={24} /> : medicalCount}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Approved medical exemptions
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* ── 3. Filters & Mode Switcher ──────────────────────────────────────── */}
      <Card sx={{ p: 3, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, flex: 1, flexWrap: 'wrap', maxWidth: 850 }}>
            <TextField
              size="small"
              placeholder="Search student name, email, subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ flex: 1, minWidth: 220 }}
              InputProps={{
                startAdornment: <SearchOutlined sx={{ color: 'text.secondary', mr: 1, fontSize: 18 }} />,
              }}
            />

            <TextField
              select
              size="small"
              label="Subject"
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              sx={{ minWidth: 200 }}
              SelectProps={{ displayEmpty: true }}
              InputLabelProps={{ shrink: true }}
            >
              <MenuItem value="">All Subjects</MenuItem>
              {subjects.map((sub) => (
                <MenuItem key={sub._id || sub.id} value={sub._id || sub.id}>
                  {sub.name} ({sub.code})
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              size="small"
              label="Session Type"
              value={selectedSessionType}
              onChange={(e) => setSelectedSessionType(e.target.value)}
              sx={{ minWidth: 140 }}
              SelectProps={{ displayEmpty: true }}
              InputLabelProps={{ shrink: true }}
            >
              <MenuItem value="">All Types</MenuItem>
              {SESSION_TYPES.map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              size="small"
              label="Status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              sx={{ minWidth: 140 }}
              SelectProps={{ displayEmpty: true }}
              InputLabelProps={{ shrink: true }}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="PRESENT">PRESENT</MenuItem>
              <MenuItem value="ABSENT">ABSENT</MenuItem>
              <MenuItem value="MEDICAL_LEAVE">MEDICAL LEAVE</MenuItem>
            </TextField>

            <TextField
              type="date"
              size="small"
              label="Session Date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              sx={{ minWidth: 150 }}
              InputLabelProps={{ shrink: true }}
            />
          </Box>

          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, next) => next && setViewMode(next)}
            size="small"
            sx={{ bgcolor: theme.custom?.surface?.sunken || 'rgba(0,0,0,0.03)' }}
          >
            <ToggleButton value="summary">
              <SchoolOutlined sx={{ fontSize: 18, mr: 0.5 }} /> % Summary View
            </ToggleButton>
            <ToggleButton value="records">
              <FactCheckOutlined sx={{ fontSize: 18, mr: 0.5 }} /> Daily Sessions View
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* ── 4. Main Attendance View: Summary vs Daily Sessions ─────────────── */}
        {viewMode === 'summary' ? (
          summaryLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress size={32} />
            </Box>
          ) : filteredSummary.length === 0 ? (
            <EmptyState
              type="reports"
              title="No Attendance Summary Available"
              description="Select a subject with recorded attendance sessions to view percentage breakdown."
            />
          ) : (
            <TableContainer>
              <Table size="medium">
                <TableHead sx={{ bgcolor: theme.custom?.surface?.sunken || 'rgba(0,0,0,0.02)' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>STUDENT NAME & EMAIL</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>CLASSES ATTENDED</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>ABSENT / MEDICAL</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>ATTENDANCE PERCENTAGE</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>EXAM ELIGIBILITY</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredSummary.map((s) => (
                    <TableRow key={s.studentId} hover>
                      <TableCell sx={{ fontWeight: 600 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: `${theme.palette.primary.main}15`, color: theme.palette.primary.main, fontSize: '0.85rem', fontWeight: 700 }}>
                            {s.name?.charAt(0) || 'S'}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.ink[900] }}>
                              {s.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {s.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell sx={{ fontFamily: theme.typography.mono.fontFamily, fontWeight: 700 }}>
                        {s.present || 0} / {s.total || 0} Sessions
                      </TableCell>

                      <TableCell sx={{ fontFamily: theme.typography.mono.fontFamily }}>
                        <Typography variant="caption" color="error.main" sx={{ fontWeight: 700, mr: 1 }}>
                          {s.absent || 0} Absent
                        </Typography>
                        {s.medicalLeave > 0 && (
                          <Chip label={`${s.medicalLeave} Medical`} size="small" color="info" sx={{ fontSize: '0.62rem', height: 18 }} />
                        )}
                      </TableCell>

                      <TableCell>
                        <AttendanceBar pct={s.percentage || 0} />
                      </TableCell>

                      <TableCell align="right">
                        {s.isAtRisk ? (
                          <Chip
                            icon={<WarningAmber sx={{ fontSize: '0.8rem !important' }} />}
                            label="AT RISK (<75%)"
                            size="small"
                            color="error"
                            sx={{ fontWeight: 800, fontSize: '0.65rem' }}
                          />
                        ) : (
                          <Chip
                            icon={<CheckCircle sx={{ fontSize: '0.8rem !important' }} />}
                            label="ELIGIBLE FOR EXAMS"
                            size="small"
                            color="success"
                            sx={{ fontWeight: 800, fontSize: '0.65rem' }}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )
        ) : (
          <DataTable
            columns={recordColumns}
            data={filteredRecords}
            isLoading={recordsLoading}
            emptyMessage="No daily session attendance records found."
          />
        )}
      </Card>

      {/* ── 5. Bulk Mark Attendance Modal ─────────────────────────────────── */}
      <Dialog open={bulkModalOpen} onClose={() => setBulkModalOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Mark Session Attendance</DialogTitle>
        <form onSubmit={handleBulkMarkSubmit}>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Subject"
                  value={bulkFormData.subjectId}
                  onChange={(e) => setBulkFormData({ ...bulkFormData, subjectId: e.target.value })}
                  required
                >
                  {subjects.map((sub) => (
                    <MenuItem key={sub._id || sub.id} value={sub._id || sub.id}>
                      {sub.name} ({sub.code})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  type="date"
                  fullWidth
                  size="small"
                  label="Session Date"
                  value={bulkFormData.date}
                  onChange={(e) => setBulkFormData({ ...bulkFormData, date: e.target.value })}
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Session Type"
                  value={bulkFormData.sessionType}
                  onChange={(e) => setBulkFormData({ ...bulkFormData, sessionType: e.target.value })}
                  required
                >
                  {SESSION_TYPES.map((t) => (
                    <MenuItem key={t} value={t}>
                      {t}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>

            <Paper sx={{ p: 2, maxHeight: 320, overflowY: 'auto', border: `1px solid ${theme.palette.divider}` }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5 }}>
                Department Student Attendance Roll:
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {(studentsData?.data || []).map((st) => {
                  const stId = st.id || st._id;
                  const currentStatus = bulkStudentStatuses[stId] || 'PRESENT';

                  return (
                    <Box key={stId} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, borderBottom: `1px solid ${theme.palette.divider}` }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {st.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {st.rollNumber ? `Roll: ${st.rollNumber}` : st.email}
                        </Typography>
                      </Box>

                      <ToggleButtonGroup
                        value={currentStatus}
                        exclusive
                        onChange={(_, next) => next && handleBulkStatusChange(stId, next)}
                        size="small"
                      >
                        <ToggleButton value="PRESENT" color="success" sx={{ fontSize: '0.7rem', fontWeight: 700 }}>
                          PRESENT
                        </ToggleButton>
                        <ToggleButton value="ABSENT" color="error" sx={{ fontSize: '0.7rem', fontWeight: 700 }}>
                          ABSENT
                        </ToggleButton>
                        <ToggleButton value="MEDICAL_LEAVE" color="warning" sx={{ fontSize: '0.7rem', fontWeight: 700 }}>
                          MEDICAL
                        </ToggleButton>
                      </ToggleButtonGroup>
                    </Box>
                  );
                })}
              </Box>
            </Paper>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setBulkModalOpen(false)} variant="outlined" sx={{ borderRadius: '8px' }}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={bulkMarkMutation.isPending} sx={{ borderRadius: '8px', fontWeight: 700 }}>
              {bulkMarkMutation.isPending ? 'Submitting Session...' : 'Submit Session Attendance'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default HodAttendanceHub;
