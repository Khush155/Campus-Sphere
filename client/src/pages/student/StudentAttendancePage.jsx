import React, { useMemo } from 'react';
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
  useTheme,
} from '@mui/material';
import {
  CheckCircleOutlineOutlined as AttendanceIcon,
  WarningAmberOutlined as WarningIcon,
  VerifiedUserOutlined as VerifiedIcon,
} from '@mui/icons-material';

import { useAuth } from '../../contexts/AuthContext';
import { useMyProfileQuery } from '../../queries/userProfileQueries';
import { useStudentAttendanceQuery } from '../../queries/studentQueries';

export const StudentAttendancePage = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { user } = useAuth();
  const { data: profile } = useMyProfileQuery();

  const currentUser = profile?.user || user;
  const { data: attendanceList = [], isLoading } = useStudentAttendanceQuery(currentUser?._id || currentUser?.id);

  const rawAttendanceList = useMemo(() => {
    if (!attendanceList) return [];
    if (Array.isArray(attendanceList)) return attendanceList;
    return attendanceList.summary || attendanceList.records || attendanceList.data || [];
  }, [attendanceList]);

  // Overall attendance calculation
  const overallStats = useMemo(() => {
    if (!rawAttendanceList || rawAttendanceList.length === 0) {
      return { total: 0, attended: 0, pct: 100, isLow: false };
    }
    const total = rawAttendanceList.reduce((acc, curr) => acc + (curr.totalClasses || 0), 0);
    const attended = rawAttendanceList.reduce((acc, curr) => acc + (curr.attendedClasses || 0), 0);
    const pct = total > 0 ? Math.round((attended / total) * 100) : 100;
    return {
      total,
      attended,
      pct,
      isLow: pct < 75,
    };
  }, [rawAttendanceList]);

  return (
    <Container maxWidth="xl" sx={{ py: 3.5 }}>
      {/* Page Header */}
      <Box sx={{ mb: 3.5 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em', mb: 0.5 }}>
          My Subject Attendance Hub
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track subject-wise lecture attendance, medical credit allowances, and exam eligibility status.
        </Typography>
      </Box>

      {/* Threshold Warning Banner */}
      {overallStats.isLow && (
        <Alert
          severity="warning"
          icon={<WarningIcon fontSize="inherit" />}
          sx={{ mb: 3.5, borderRadius: '16px', fontWeight: 600, border: `1px solid ${theme.palette.warning.main}` }}
        >
          <strong>Attendance Alert:</strong> Your overall aggregate attendance is below 75% ({overallStats.pct}%). Please maintain regular attendance to avoid examination detention.
        </Alert>
      )}

      {/* Overview Cards (4 Roster-Style Top-Bordered Cards) */}
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
                Overall Aggregate
              </Typography>
              <Avatar sx={{ bgcolor: 'rgba(79, 70, 229, 0.12)', color: '#4f46e5', width: 40, height: 40, borderRadius: '10px' }}>
                <AttendanceIcon fontSize="small" />
              </Avatar>
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mb: 1, fontFamily: theme.typography.mono?.fontFamily || 'monospace' }}>
                {overallStats.pct}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={overallStats.pct}
                color={overallStats.pct >= 75 ? 'primary' : 'warning'}
                sx={{ height: 6, borderRadius: 3 }}
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

      {/* Subject Wise Table */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: '24px',
          border: `1px solid ${theme.palette.divider}`,
          overflow: 'hidden',
          bgcolor: isDark ? 'background.paper' : '#ffffff',
        }}
      >
        <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary' }}>
            Subject-wise Attendance Breakdown
          </Typography>
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
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    Loading attendance records...
                  </TableCell>
                </TableRow>
              ) : rawAttendanceList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary', fontWeight: 600 }}>
                    No subject attendance recorded yet for this semester.
                  </TableCell>
                </TableRow>
              ) : (
                rawAttendanceList.map((row) => {
                  const pct = row.attendancePercentage || 0;
                  const absentCount = row.absentClasses !== undefined ? row.absentClasses : Math.max(0, (row.totalClasses || 0) - (row.attendedClasses || 0));
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
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
};

export default StudentAttendancePage;
