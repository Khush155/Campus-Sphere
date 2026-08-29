import React, { useState, useMemo } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  Alert,
  Avatar,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  InputAdornment,
  useTheme,
} from '@mui/material';
import {
  CheckCircleOutlineOutlined as AttendanceIcon,
  WarningAmberOutlined as WarningIcon,
  VerifiedUserOutlined as VerifiedIcon,
  FactCheckOutlined as RegisterIcon,
  CalendarMonthOutlined as CalendarIcon,
  CheckCircle as PresentIcon,
  Cancel as AbsentIcon,
  AccessTime as LateIcon,
  LocalHospital as MedicalIcon,
  Close as CloseIcon,
  Search as SearchIcon,
} from '@mui/icons-material';

import { useAuth } from '../../contexts/AuthContext';
import { useStudentSession } from '../../contexts/StudentSessionContext';
import { useMyProfileQuery } from '../../queries/userProfileQueries';
import { useStudentAttendanceQuery, useStudentAttendanceLogsQuery } from '../../queries/studentQueries';

export const StudentAttendancePage = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { user } = useAuth();
  const { data: profile } = useMyProfileQuery();
  const { selectedSemester, isArchivedView } = useStudentSession();

  const currentUser = profile?.user || user;
  const studentId = currentUser?._id || currentUser?.id;

  // View Mode: 0 = Subject Summary Breakdown, 1 = Daily Attendance Register
  const [activeTab, setActiveTab] = useState(0);

  // Subject Register Modal State
  const [registerModalSubject, setRegisterModalSubject] = useState(null);

  // Filters for the Daily Attendance Register Tab
  const [filterSubjectId, setFilterSubjectId] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchDate, setSearchDate] = useState('');

  // Queries
  const { data: attendanceList = [], isLoading: isSummaryLoading } = useStudentAttendanceQuery(studentId);
  const { data: logsData = [], isLoading: isLogsLoading } = useStudentAttendanceLogsQuery();

  const rawAttendanceList = useMemo(() => {
    if (!attendanceList) return [];
    if (Array.isArray(attendanceList)) return attendanceList;
    return attendanceList.summary || attendanceList.records || attendanceList.data || [];
  }, [attendanceList]);

  // Filter subject summary list by selectedSemester
  const displayAttendanceList = useMemo(() => {
    if (!rawAttendanceList || rawAttendanceList.length === 0) return [];
    const hasSemesterTag = rawAttendanceList.some((r) => r.semester !== undefined && r.semester !== null);
    if (hasSemesterTag) {
      const filtered = rawAttendanceList.filter((r) => Number(r.semester) === Number(selectedSemester));
      return filtered.length > 0 ? filtered : [];
    }
    return rawAttendanceList;
  }, [rawAttendanceList, selectedSemester]);

  // Overall attendance statistics
  const overallStats = useMemo(() => {
    if (!displayAttendanceList || displayAttendanceList.length === 0) {
      return { total: 0, attended: 0, pct: 100, isLow: false };
    }
    const total = displayAttendanceList.reduce((acc, curr) => acc + (curr.totalClasses || 0), 0);
    const attended = displayAttendanceList.reduce((acc, curr) => acc + (curr.attendedClasses || 0), 0);
    const pct = total > 0 ? Math.round((attended / total) * 100) : 100;
    return {
      total,
      attended,
      pct,
      isLow: pct < 75,
    };
  }, [displayAttendanceList]);

  // Normalise all daily logs
  const rawLogs = useMemo(() => {
    if (!logsData) return [];
    if (Array.isArray(logsData)) return logsData;
    return logsData.data || logsData.records || [];
  }, [logsData]);

  // Filter daily logs by semester, subject, status, and date query
  const filteredDailyLogs = useMemo(() => {
    return rawLogs.filter((record) => {
      // Semester filter if populated
      const sem = record.subjectId?.semester ?? record.semester;
      if (sem !== undefined && sem !== null && Number(sem) !== Number(selectedSemester)) {
        return false;
      }

      // Subject filter
      if (filterSubjectId !== 'ALL') {
        const subId = typeof record.subjectId === 'object' ? record.subjectId?._id : record.subjectId;
        if (String(subId) !== String(filterSubjectId)) return false;
      }

      // Status filter
      if (filterStatus !== 'ALL') {
        if (record.status !== filterStatus) return false;
      }

      // Search by date string or remarks or faculty
      if (searchDate) {
        const dStr = new Date(record.date).toLocaleDateString();
        const facultyName = record.facultyId?.name || '';
        const remarks = record.remarks || '';
        const q = searchDate.toLowerCase();
        if (!dStr.includes(q) && !facultyName.toLowerCase().includes(q) && !remarks.toLowerCase().includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [rawLogs, selectedSemester, filterSubjectId, filterStatus, searchDate]);

  // Logs for the modal subject register
  const modalSubjectLogs = useMemo(() => {
    if (!registerModalSubject) return [];
    const targetSubId = registerModalSubject.subjectId || registerModalSubject._id;
    return rawLogs.filter((record) => {
      const recSubId = typeof record.subjectId === 'object' ? record.subjectId?._id : record.subjectId;
      return String(recSubId) === String(targetSubId);
    });
  }, [registerModalSubject, rawLogs]);

  // Helper to render formatted date badge
  const formatDate = (dateVal) => {
    if (!dateVal) return 'N/A';
    const d = new Date(dateVal);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Helper to render status chip
  const renderStatusChip = (status) => {
    switch (status) {
      case 'PRESENT':
        return (
          <Chip
            icon={<PresentIcon sx={{ fontSize: '14px !important' }} />}
            label="PRESENT"
            size="small"
            sx={{
              fontWeight: 800,
              fontSize: '0.7rem',
              bgcolor: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              border: '1px solid #10b981',
            }}
          />
        );
      case 'ABSENT':
        return (
          <Chip
            icon={<AbsentIcon sx={{ fontSize: '14px !important' }} />}
            label="ABSENT"
            size="small"
            sx={{
              fontWeight: 800,
              fontSize: '0.7rem',
              bgcolor: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              border: '1px solid #ef4444',
            }}
          />
        );
      case 'LATE':
        return (
          <Chip
            icon={<LateIcon sx={{ fontSize: '14px !important' }} />}
            label="LATE"
            size="small"
            sx={{
              fontWeight: 800,
              fontSize: '0.7rem',
              bgcolor: 'rgba(245, 158, 11, 0.15)',
              color: '#f59e0b',
              border: '1px solid #f59e0b',
            }}
          />
        );
      case 'MEDICAL_LEAVE':
      case 'EXCUSED':
        return (
          <Chip
            icon={<MedicalIcon sx={{ fontSize: '14px !important' }} />}
            label={status === 'MEDICAL_LEAVE' ? 'MEDICAL' : 'EXCUSED'}
            size="small"
            sx={{
              fontWeight: 800,
              fontSize: '0.7rem',
              bgcolor: 'rgba(6, 182, 212, 0.15)',
              color: '#06b6d4',
              border: '1px solid #06b6d4',
            }}
          />
        );
      default:
        return (
          <Chip
            label={status || 'PRESENT'}
            size="small"
            sx={{ fontWeight: 800, fontSize: '0.7rem' }}
          />
        );
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3.5 }}>
      {/* Page Header */}
      <Box sx={{ mb: 3.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
            My Subject Attendance Hub
          </Typography>
          {isArchivedView && (
            <Chip
              label={`SEMESTER ${selectedSemester} ARCHIVED`}
              color="warning"
              size="small"
              sx={{ fontWeight: 800 }}
            />
          )}
        </Box>
        <Typography variant="body1" color="text.secondary">
          {isArchivedView
            ? `Viewing archived attendance records & daily register logs for Semester ${selectedSemester}.`
            : 'Track subject-wise lecture attendance, review day-to-day register logs, and monitor exam clearance.'}
        </Typography>
      </Box>

      {/* Threshold Warning Banner */}
      {overallStats.isLow && (
        <Alert
          severity="warning"
          icon={<WarningIcon fontSize="inherit" />}
          sx={{ mb: 3.5, borderRadius: '16px', fontWeight: 600, border: `1px solid ${theme.palette.warning.main}` }}
        >
          <strong>Attendance Alert:</strong> Your aggregate attendance is currently {overallStats.pct}%, which is below the mandatory 75% threshold. Regular attendance is required to clear exam eligibility.
        </Alert>
      )}

      {/* Roster-Style 4-Color Top-Bordered KPI Grid */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: '14px',
              border: `1px solid ${theme.palette.divider}`,
              borderTop: '4px solid #4f46e5',
              bgcolor: isDark ? 'background.paper' : '#ffffff',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                Aggregate Attendance
              </Typography>
              <Avatar sx={{ bgcolor: 'rgba(79, 70, 229, 0.12)', color: '#4f46e5', width: 40, height: 40, borderRadius: '10px' }}>
                <AttendanceIcon fontSize="small" />
              </Avatar>
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', fontFamily: theme.typography.mono?.fontFamily || 'monospace' }}>
                {overallStats.pct}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={overallStats.pct}
                color={overallStats.pct >= 75 ? 'primary' : 'warning'}
                sx={{ height: 6, borderRadius: 3, mt: 1 }}
              />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: '14px',
              border: `1px solid ${theme.palette.divider}`,
              borderTop: '4px solid #10b981',
              bgcolor: isDark ? 'background.paper' : '#ffffff',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                Lectures Attended
              </Typography>
              <Avatar sx={{ bgcolor: 'rgba(16, 185, 129, 0.12)', color: '#10b981', width: 40, height: 40, borderRadius: '10px' }}>
                <VerifiedIcon fontSize="small" />
              </Avatar>
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', fontFamily: theme.typography.mono?.fontFamily || 'monospace' }}>
                {overallStats.attended} <Typography component="span" variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>/ {overallStats.total}</Typography>
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total scheduled sessions
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: '14px',
              border: `1px solid ${theme.palette.divider}`,
              borderTop: '4px solid #f59e0b',
              bgcolor: isDark ? 'background.paper' : '#ffffff',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                Missed Lectures
              </Typography>
              <Avatar sx={{ bgcolor: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', width: 40, height: 40, borderRadius: '10px' }}>
                <WarningIcon fontSize="small" />
              </Avatar>
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', fontFamily: theme.typography.mono?.fontFamily || 'monospace' }}>
                {Math.max(0, overallStats.total - overallStats.attended)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Absent / Uncredited sessions
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: '14px',
              border: `1px solid ${theme.palette.divider}`,
              borderTop: '4px solid #06b6d4',
              bgcolor: isDark ? 'background.paper' : '#ffffff',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                Exam Clearance
              </Typography>
              <Avatar sx={{ bgcolor: 'rgba(6, 182, 212, 0.12)', color: '#06b6d4', width: 40, height: 40, borderRadius: '10px' }}>
                <AttendanceIcon fontSize="small" />
              </Avatar>
            </Box>
            <Box>
              <Chip
                label={overallStats.pct >= 75 ? 'ELIGIBLE' : 'CONDITIONAL'}
                color={overallStats.pct >= 75 ? 'success' : 'warning'}
                sx={{ fontWeight: 800, borderRadius: '6px' }}
              />
              <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.75 }}>
                {overallStats.pct >= 75 ? 'Hall ticket cleared' : 'Requires HOD waiver'}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabs: Subject Summary vs Date-Wise Attendance Register */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: '16px',
          border: `1px solid ${theme.palette.divider}`,
          bgcolor: isDark ? 'background.paper' : '#ffffff',
          mb: 3.5,
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          sx={{
            px: 2,
            '& .MuiTab-root': {
              fontWeight: 800,
              textTransform: 'none',
              fontSize: '0.95rem',
              py: 2,
            },
          }}
        >
          <Tab
            icon={<AttendanceIcon fontSize="small" />}
            iconPosition="start"
            label={`Subject Breakdown (${displayAttendanceList.length} Subjects)`}
          />
          <Tab
            icon={<RegisterIcon fontSize="small" />}
            iconPosition="start"
            label={`Daily Attendance Register (${filteredDailyLogs.length} Records)`}
          />
        </Tabs>
      </Paper>

      {/* TAB 0: Subject-Wise Table with "View Register" Action */}
      {activeTab === 0 && (
        <Paper
          elevation={0}
          sx={{
            borderRadius: '24px',
            border: `1px solid ${theme.palette.divider}`,
            overflow: 'hidden',
            bgcolor: isDark ? 'background.paper' : '#ffffff',
          }}
        >
          <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary' }}>
                Subject-wise Attendance Breakdown
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Click &ldquo;View Register&rdquo; on any subject to inspect its complete date-wise lecture records.
              </Typography>
            </Box>
          </Box>

          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>SUBJECT</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>TOTAL CLASSES</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>ATTENDED</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>ABSENT</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>PERCENTAGE</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>STATUS</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>DATE REGISTER</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isSummaryLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      Loading attendance records...
                    </TableCell>
                  </TableRow>
                ) : displayAttendanceList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary', fontWeight: 600 }}>
                      No subject attendance recorded yet for Semester {selectedSemester}.
                    </TableCell>
                  </TableRow>
                ) : (
                  displayAttendanceList.map((row) => {
                    const pct = row.attendancePercentage || 0;
                    const absentCount =
                      row.absentClasses !== undefined
                        ? row.absentClasses
                        : Math.max(0, (row.totalClasses || 0) - (row.attendedClasses || 0));
                    const isEligible = pct >= 75;

                    return (
                      <TableRow key={row.subjectId || row.subjectCode} hover>
                        <TableCell>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                            {row.subjectName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {row.subjectCode}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{row.totalClasses}</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: 'success.main' }}>{row.attendedClasses}</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: absentCount > 0 ? 'error.main' : 'text.secondary' }}>
                          {absentCount}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ width: '100%', mr: 1 }}>
                              <LinearProgress
                                variant="determinate"
                                value={pct}
                                color={isEligible ? 'primary' : 'warning'}
                                sx={{ height: 6, borderRadius: 3 }}
                              />
                            </Box>
                            <Typography variant="body2" sx={{ fontWeight: 800, minWidth: 40 }}>
                              {pct}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={isEligible ? 'Safe (≥75%)' : 'At Risk (<75%)'}
                            size="small"
                            color={isEligible ? 'success' : 'error'}
                            sx={{ fontWeight: 800, fontSize: '0.72rem' }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<CalendarIcon fontSize="small" />}
                            onClick={() => setRegisterModalSubject(row)}
                            sx={{
                              borderRadius: '10px',
                              fontWeight: 800,
                              textTransform: 'none',
                              fontSize: '0.78rem',
                              px: 2,
                            }}
                          >
                            View Register
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* TAB 1: Date-Wise Daily Attendance Register */}
      {activeTab === 1 && (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: '24px',
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: isDark ? 'background.paper' : '#ffffff',
          }}
        >
          {/* Controls & Filter Bar */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary' }}>
                Date-Wise Attendance Register
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Inspect lecture entries chronologically, filter by subject, or filter by present/absent status.
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Subject Selector */}
              <FormControl size="small" sx={{ minWidth: 190 }}>
                <InputLabel sx={{ fontWeight: 700 }}>Subject</InputLabel>
                <Select
                  value={filterSubjectId}
                  label="Subject"
                  onChange={(e) => setFilterSubjectId(e.target.value)}
                  sx={{ borderRadius: '10px', fontWeight: 700 }}
                >
                  <MenuItem value="ALL">All Subjects</MenuItem>
                  {displayAttendanceList.map((s) => (
                    <MenuItem key={s.subjectId || s.subjectCode} value={s.subjectId}>
                      {s.subjectCode} — {s.subjectName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Status Selector */}
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel sx={{ fontWeight: 700 }}>Status</InputLabel>
                <Select
                  value={filterStatus}
                  label="Status"
                  onChange={(e) => setFilterStatus(e.target.value)}
                  sx={{ borderRadius: '10px', fontWeight: 700 }}
                >
                  <MenuItem value="ALL">All Statuses</MenuItem>
                  <MenuItem value="PRESENT">Present Only</MenuItem>
                  <MenuItem value="ABSENT">Absent Only</MenuItem>
                  <MenuItem value="LATE">Late Only</MenuItem>
                  <MenuItem value="MEDICAL_LEAVE">Medical Leave</MenuItem>
                </Select>
              </FormControl>

              {/* Quick Search Input */}
              <TextField
                size="small"
                placeholder="Search date or faculty..."
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ width: 220, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
              />
            </Box>
          </Box>

          {/* Daily Logs Table */}
          <TableContainer sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: '16px' }}>
            <Table>
              <TableHead sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>DATE &amp; DAY</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>SUBJECT</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>SESSION TYPE</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>FACULTY INSTRUCTOR</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>STATUS</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>REMARKS / NOTES</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLogsLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      Loading daily attendance register...
                    </TableCell>
                  </TableRow>
                ) : filteredDailyLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        No attendance entries match your filters.
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Try changing the subject or status filter above.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDailyLogs.map((log) => {
                    const subName = log.subjectId?.name || 'Subject';
                    const subCode = log.subjectId?.code || 'SUB';
                    const facultyName = log.facultyId?.name || 'Faculty Instructor';

                    return (
                      <TableRow key={log._id} hover>
                        <TableCell sx={{ fontWeight: 700 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CalendarIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                            {formatDate(log.date)}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 800 }}>
                            {subName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                            {subCode}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={log.sessionType || 'LECTURE'}
                            size="small"
                            variant="outlined"
                            sx={{ fontWeight: 700, fontSize: '0.68rem', borderRadius: '6px' }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>
                          {facultyName}
                        </TableCell>
                        <TableCell>
                          {renderStatusChip(log.status)}
                        </TableCell>
                        <TableCell sx={{ color: log.remarks ? 'text.primary' : 'text.secondary', fontSize: '0.8rem' }}>
                          {log.remarks || '—'}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Dedicated Subject Attendance Register Dialog */}
      <Dialog
        open={Boolean(registerModalSubject)}
        onClose={() => setRegisterModalSubject(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            p: 1,
            bgcolor: isDark ? 'background.paper' : '#ffffff',
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pb: 1 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={registerModalSubject?.subjectCode || 'CODE'}
                color="primary"
                size="small"
                sx={{ fontWeight: 800 }}
              />
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary' }}>
                {registerModalSubject?.subjectName || 'Subject Attendance Register'}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              Date-wise attendance register log for Semester {selectedSemester}
            </Typography>
          </Box>

          <IconButton onClick={() => setRegisterModalSubject(null)} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ pt: 2.5 }}>
          {/* Modal Mini KPI Summary */}
          {registerModalSubject && (
            <Paper
              elevation={0}
              sx={{
                p: 2,
                mb: 3,
                borderRadius: '12px',
                bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(79, 70, 229, 0.04)',
                border: `1px solid ${theme.palette.divider}`,
                display: 'flex',
                justifyContent: 'space-around',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 2,
              }}
            >
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                  TOTAL CONDUCTED
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary' }}>
                  {registerModalSubject.totalClasses || modalSubjectLogs.length}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                  ATTENDED
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: 'success.main' }}>
                  {registerModalSubject.attendedClasses || modalSubjectLogs.filter((l) => l.status === 'PRESENT' || l.status === 'LATE').length}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                  ABSENT
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: 'error.main' }}>
                  {registerModalSubject.absentClasses !== undefined
                    ? registerModalSubject.absentClasses
                    : modalSubjectLogs.filter((l) => l.status === 'ABSENT').length}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                  ATTENDANCE RATE
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>
                  {registerModalSubject.attendancePercentage || 0}%
                </Typography>
              </Box>
            </Paper>
          )}

          {/* Date-wise table in modal */}
          <TableContainer sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: '12px' }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>DATE</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>SESSION TYPE</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>FACULTY</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>STATUS</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>REMARKS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {modalSubjectLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary', fontWeight: 600 }}>
                      No individual lecture log entries found for this subject yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  modalSubjectLogs.map((log) => (
                    <TableRow key={log._id} hover>
                      <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                        {formatDate(log.date)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={log.sessionType || 'LECTURE'}
                          size="small"
                          variant="outlined"
                          sx={{ fontWeight: 700, fontSize: '0.65rem', height: 20 }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.82rem' }}>
                        {log.facultyId?.name || 'Faculty'}
                      </TableCell>
                      <TableCell>
                        {renderStatusChip(log.status)}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.78rem', color: log.remarks ? 'text.primary' : 'text.secondary' }}>
                        {log.remarks || '—'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setRegisterModalSubject(null)}
            variant="contained"
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 800, px: 3 }}
          >
            Close Register
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default StudentAttendancePage;
