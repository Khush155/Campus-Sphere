/* eslint-disable */
import React, { useState, useMemo } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Chip, Alert, Snackbar, Tooltip, LinearProgress,
  Grid, Card, CardContent, InputAdornment, IconButton, useTheme, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material';
import {
  AddOutlined, WarningAmber, CheckCircle, LocalHospital, DownloadOutlined,
  SearchOutlined, FilterListOutlined, RefreshOutlined, EventOutlined
} from '@mui/icons-material';
import DataTable from '../../../components/common/DataTable';
import EmptyState from '../../../components/common/EmptyState';
import {
  useAttendanceQuery,
  useAttendanceSummaryQuery,
  useBulkMarkAttendanceMutation,
  useApproveMedicalLeaveMutation,
} from '../../../queries/hodQueries';
import { useSubjectsQuery, useBranchesQuery } from '../../../queries/collegeQueries';
import { useUsersQuery } from '../../../queries/userQueries';
import { useAuth } from '../../../contexts/AuthContext';

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

const HodAttendanceHub = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const cleanDeptId = getCleanId(user?.departmentId || user?.department);

  // View & Tab state
  const [viewMode, setViewMode] = useState('records'); // 'records' | 'summary'

  // Filter States
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedSessionType, setSelectedSessionType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [toast, setToast] = useState({ open: false, msg: '', severity: 'success' });

  // Bulk Mark Modal States
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkFormData, setBulkFormData] = useState({
    subjectId: '',
    date: new Date().toISOString().split('T')[0],
    sessionType: 'LECTURE'
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
  }, [subjects]);

  const { data: records = [], isLoading: recordsLoading } = useAttendanceQuery({
    subjectId: selectedSubjectId || undefined,
    sessionType: selectedSessionType || undefined,
    status: selectedStatus || undefined,
    date: selectedDate || undefined,
  });

  const { data: summaryData, isLoading: summaryLoading } = useAttendanceSummaryQuery(selectedSubjectId);
  const { data: studentsData } = useUsersQuery({ role: 'STUDENT', department: cleanDeptId, limit: 100 });

  const approveMedical = useApproveMedicalLeaveMutation();
  const bulkMarkMutation = useBulkMarkAttendanceMutation();

  const showToast = (msg, severity = 'success') => setToast({ open: true, msg, severity });

  // Filter records locally for search text (Student Name/Email)
  const filteredRecords = useMemo(() => {
    if (!records) return [];
    if (!debouncedSearch) return records;
    const query = debouncedSearch.toLowerCase();
    return records.filter(r => {
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
    return list.filter(s => (s.name?.toLowerCase() || '').includes(query) || (s.email?.toLowerCase() || '').includes(query));
  }, [summaryData, debouncedSearch]);

  const isAnyFilterActive = useMemo(() => {
    return Boolean(selectedSubjectId || selectedSessionType || selectedStatus || selectedDate || search);
  }, [selectedSubjectId, selectedSessionType, selectedStatus, selectedDate, search]);

  const handleClearFilters = () => {
    setSelectedSubjectId(subjects[0]?._id || '');
    setSelectedSessionType('');
    setSelectedStatus('');
    setSelectedDate('');
    setSearch('');
    setDebouncedSearch('');
  };

  const handleApproveMedical = async (id, name) => {
    try {
      await approveMedical.mutateAsync(id);
      showToast(`Medical leave approved for ${name}. Absence excluded from % calculation.`);
    } catch {
      showToast('Failed to approve medical leave.', 'error');
    }
  };

  // CSV Download (DL) Handler
  const handleDownloadCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';

    if (viewMode === 'records') {
      csvContent += 'Student Name,Student Email,Subject Code,Subject Name,Session Type,Date,Status,Medical Approved\n';
      filteredRecords.forEach(r => {
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
      filteredSummary.forEach(s => {
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
      sessionType: 'LECTURE'
    });
    
    // Initialize student statuses to PRESENT by default
    const studentsList = studentsData?.users || studentsData?.data || [];
    const defaultStatuses = {};
    studentsList.forEach(s => {
      defaultStatuses[s._id || s.id] = 'PRESENT';
    });
    setBulkStudentStatuses(defaultStatuses);
    setBulkModalOpen(true);
  };

  const handleBulkStatusChange = (studentId, status) => {
    setBulkStudentStatuses(prev => ({ ...prev, [studentId]: status }));
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    if (!bulkFormData.subjectId) {
      showToast('Please select a subject', 'error');
      return;
    }

    const recordsPayload = Object.keys(bulkStudentStatuses).map(studentId => ({
      studentId,
      status: bulkStudentStatuses[studentId]
    }));

    if (recordsPayload.length === 0) {
      showToast('No students found to mark attendance', 'error');
      return;
    }

    try {
      await bulkMarkMutation.mutateAsync({
        subjectId: bulkFormData.subjectId,
        date: bulkFormData.date,
        sessionType: bulkFormData.sessionType,
        records: recordsPayload
      });
      showToast('Bulk attendance marked successfully!');
      setBulkModalOpen(false);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to mark attendance', 'error');
    }
  };

  // Columns for raw records
  const recordColumns = [
    { id: 'studentId', label: 'Student', render: (r) => (
      <Box>
        <Typography variant="body2" fontWeight={600}>{r.studentId?.name || '—'}</Typography>
        <Typography variant="caption" color="text.secondary">{r.studentId?.email || '—'}</Typography>
      </Box>
    )},
    { id: 'subjectId', label: 'Subject', render: (r) => r.subjectId ? `${r.subjectId.name} (${r.subjectId.code})` : '—' },
    { id: 'sessionType', label: 'Session', render: (r) => <Chip label={r.sessionType || 'LECTURE'} size="small" variant="outlined" /> },
    { id: 'date', label: 'Date', render: (r) => new Date(r.date).toLocaleDateString('en-IN') },
    {
      id: 'status', label: 'Status', render: (r) => {
        const colors = { PRESENT: 'success', ABSENT: 'error', EXCUSED: 'warning', MEDICAL_LEAVE: 'info' };
        return <Chip label={r.status} size="small" color={colors[r.status] || 'default'} sx={{ fontWeight: 'bold' }} />;
      }
    },
    {
      id: 'actions', label: 'Actions', render: (r) =>
        r.status === 'ABSENT' && !r.isMedicalApproved ? (
          <Tooltip title="Approve as Medical Leave — exempts from % calculation">
            <Button
              size="small" variant="outlined" color="info"
              startIcon={<LocalHospital fontSize="small" />}
              onClick={() => handleApproveMedical(r._id, r.studentId?.name)}
              sx={{ borderRadius: '6px' }}
            >
              Approve Medical
            </Button>
          </Tooltip>
        ) : r.status === 'MEDICAL_LEAVE' ? (
          <Chip label="Medical Approved" size="small" color="info" icon={<LocalHospital />} />
        ) : null
    },
  ];

  // Columns for summary view
  const summaryColumns = [
    { id: 'name', label: 'Student Name', render: (r) => (
      <Box>
        <Typography variant="body2" fontWeight={600}>{r.name || '—'}</Typography>
        <Typography variant="caption" color="text.secondary">{r.email || '—'}</Typography>
      </Box>
    )},
    { id: 'present', label: 'Present', render: (r) => <Typography color="success.main" fontWeight={700}>{r.present}</Typography> },
    { id: 'absent', label: 'Absent', render: (r) => <Typography color="error.main" fontWeight={700}>{r.absent}</Typography> },
    { id: 'medicalLeave', label: 'Medical', render: (r) => <Typography color="info.main">{r.medicalLeave || 0}</Typography> },
    { id: 'total', label: 'Total Classes', render: (r) => r.total },
    { id: 'percentage', label: 'Attendance %', render: (r) => <AttendanceBar pct={r.percentage} /> },
    {
      id: 'isAtRisk', label: 'Status', render: (r) => r.isAtRisk ? (
        <Chip icon={<WarningAmber />} label="AT RISK — Action Needed" size="small" color="error" sx={{ fontWeight: 'bold' }} />
      ) : (
        <Chip icon={<CheckCircle />} label="Adequate" size="small" color="success" variant="outlined" sx={{ fontWeight: 'bold' }} />
      )
    },
  ];

  const stats = summaryData?.stats || {};
  const activeStudents = studentsData?.users || studentsData?.data || [];

  return (
    <Box sx={{ p: { xs: 1, sm: 3 }, display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Top Header & Main Action Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" sx={{ color: theme.palette.ink?.[900] || 'text.primary' }}>
            Attendance Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Monitor department attendance, track at-risk students (&lt;{AT_RISK_THRESHOLD}%), approve medical exemptions, and export records.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<DownloadOutlined />}
            onClick={handleDownloadCSV}
            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
          >
            Export CSV (DL)
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddOutlined />}
            onClick={handleOpenBulkModal}
            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
          >
            Mark Attendance
          </Button>
        </Box>
      </Box>

      {/* View Toggle Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', gap: 1 }}>
        <Button
          variant={viewMode === 'records' ? 'contained' : 'text'}
          onClick={() => setViewMode('records')}
          sx={{ borderRadius: '8px 8px 0 0', fontWeight: 700 }}
        >
          Raw Attendance Logs
        </Button>
        <Button
          variant={viewMode === 'summary' ? 'contained' : 'text'}
          onClick={() => setViewMode('summary')}
          sx={{ borderRadius: '8px 8px 0 0', fontWeight: 700 }}
        >
          Summary & At-Risk Analytics
        </Button>
      </Box>

      {/* Filter Bar */}
      <Box sx={{ p: 2, borderRadius: '12px', bgcolor: 'rgba(28, 46, 69, 0.02)', border: `1px solid ${theme.palette.divider}` }}>
        <Grid container spacing={2} alignItems="center">
          {/* Subject Dropdown */}
          <Grid item xs={12} sm={4} md={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Select Subject"
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              sx={{ bgcolor: 'background.paper' }}
            >
              <MenuItem value="">All Department Subjects</MenuItem>
              {subjects.map((sub) => (
                <MenuItem key={sub._id} value={sub._id}>
                  {sub.name} ({sub.code})
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Search Input */}
          <Grid item xs={12} sm={4} md={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by student name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchOutlined fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              sx={{ bgcolor: 'background.paper' }}
            />
          </Grid>

          {/* Session Type Filter */}
          <Grid item xs={6} sm={2} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Session"
              value={selectedSessionType}
              onChange={(e) => setSelectedSessionType(e.target.value)}
              sx={{ bgcolor: 'background.paper' }}
            >
              <MenuItem value="">All Sessions</MenuItem>
              {SESSION_TYPES.map(st => (
                <MenuItem key={st} value={st}>{st}</MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Status Filter (Only in raw records mode) */}
          {viewMode === 'records' && (
            <Grid item xs={6} sm={2} md={2}>
              <TextField
                select
                fullWidth
                size="small"
                label="Status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                sx={{ bgcolor: 'background.paper' }}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="PRESENT">Present</MenuItem>
                <MenuItem value="ABSENT">Absent</MenuItem>
                <MenuItem value="MEDICAL_LEAVE">Medical Leave</MenuItem>
                <MenuItem value="EXCUSED">Excused</MenuItem>
              </TextField>
            </Grid>
          )}

          {/* Date Selector (Only in raw records mode) */}
          {viewMode === 'records' && (
            <Grid item xs={6} sm={2} md={2}>
              <TextField
                type="date"
                fullWidth
                size="small"
                label="Date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ bgcolor: 'background.paper' }}
              />
            </Grid>
          )}

          {isAnyFilterActive && (
            <Grid item xs={12} md={1.5}>
              <Button
                variant="outlined"
                color="secondary"
                size="small"
                fullWidth
                onClick={handleClearFilters}
                sx={{ height: 40, fontWeight: 600 }}
              >
                Clear
              </Button>
            </Grid>
          )}
        </Grid>
      </Box>

      {/* Summary KPI Cards */}
      {viewMode === 'summary' && stats.totalStudents !== undefined && (
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Card sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  TOTAL STUDENTS ENROLLED
                </Typography>
                <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5 }}>
                  {stats.totalStudents || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ borderRadius: 3, border: `1px solid ${theme.palette.error.light}`, bgcolor: 'error.50' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="caption" color="error.main" fontWeight={700}>
                  AT-RISK STUDENTS (&lt;{AT_RISK_THRESHOLD}%)
                </Typography>
                <Typography variant="h4" fontWeight={800} color="error.main" sx={{ mt: 0.5 }}>
                  {stats.atRiskCount || 0} ({stats.atRiskPercentage || 0}%)
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  ATTENDANCE THRESHOLD
                </Typography>
                <Typography variant="h4" fontWeight={800} color="info.main" sx={{ mt: 0.5 }}>
                  {AT_RISK_THRESHOLD}% Minimum
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Data Table View */}
      {viewMode === 'summary' ? (
        filteredSummary.length === 0 ? (
          <EmptyState
            type="attendance"
            title="No Attendance Summary Found"
            description="No attendance data has been recorded yet."
          />
        ) : (
          <DataTable
            columns={summaryColumns}
            data={filteredSummary}
            isLoading={summaryLoading}
            emptyMessage="No summary records found."
          />
        )
      ) : (
        filteredRecords.length === 0 ? (
          <EmptyState
            type="attendance"
            title="No Attendance Records Found"
            description={isAnyFilterActive ? "No attendance logs match your filter criteria." : "No attendance has been marked for your department yet."}
            actionText={isAnyFilterActive ? "Clear Filters" : ""}
            onAction={isAnyFilterActive ? handleClearFilters : undefined}
          />
        ) : (
          <DataTable
            columns={recordColumns}
            data={filteredRecords}
            isLoading={recordsLoading}
            emptyMessage="No attendance records found."
          />
        )
      )}

      {/* Bulk Attendance Marking Modal */}
      <Dialog open={bulkModalOpen} onClose={() => setBulkModalOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Mark Department Attendance</DialogTitle>
        <form onSubmit={handleBulkSubmit}>
          <DialogContent dividers>
            <Grid container spacing= {2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  fullWidth
                  label="Subject"
                  value={bulkFormData.subjectId}
                  onChange={(e) => setBulkFormData({ ...bulkFormData, subjectId: e.target.value })}
                  required
                >
                  {subjects.map(s => (
                    <MenuItem key={s._id} value={s._id}>{s.name} ({s.code})</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={6} sm={4}>
                <TextField
                  type="date"
                  fullWidth
                  label="Date"
                  value={bulkFormData.date}
                  onChange={(e) => setBulkFormData({ ...bulkFormData, date: e.target.value })}
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6} sm={4}>
                <TextField
                  select
                  fullWidth
                  label="Session Type"
                  value={bulkFormData.sessionType}
                  onChange={(e) => setBulkFormData({ ...bulkFormData, sessionType: e.target.value })}
                  required
                >
                  {SESSION_TYPES.map(st => (
                    <MenuItem key={st} value={st}>{st}</MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>

            {activeStudents.length === 0 ? (
              <Alert severity="warning" sx={{ borderRadius: 2 }}>No active students found in your department to mark attendance.</Alert>
            ) : (
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: 'grey.50' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>STUDENT NAME</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>EMAIL</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>MARK STATUS</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {activeStudents.map((st) => {
                      const stId = st._id || st.id;
                      const currentStatus = bulkStudentStatuses[stId] || 'PRESENT';
                      return (
                        <TableRow key={stId} hover>
                          <TableCell sx={{ fontWeight: 600 }}>{st.name}</TableCell>
                          <TableCell color="text.secondary">{st.email}</TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                              {['PRESENT', 'ABSENT', 'EXCUSED', 'MEDICAL_LEAVE'].map((status) => (
                                <Chip
                                  key={status}
                                  label={status}
                                  size="small"
                                  color={currentStatus === status ? (status === 'PRESENT' ? 'success' : status === 'ABSENT' ? 'error' : status === 'EXCUSED' ? 'warning' : 'info') : 'default'}
                                  variant={currentStatus === status ? 'filled' : 'outlined'}
                                  onClick={() => handleBulkStatusChange(stId, status)}
                                  sx={{ cursor: 'pointer', fontWeight: 600 }}
                                />
                              ))}
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setBulkModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={bulkMarkMutation.isLoading} sx={{ borderRadius: 2 }}>
              {bulkMarkMutation.isLoading ? 'Saving...' : 'Submit Attendance'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast(t => ({ ...t, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={toast.severity} onClose={() => setToast(t => ({ ...t, open: false }))} sx={{ borderRadius: 2 }}>
          {toast.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default HodAttendanceHub;
