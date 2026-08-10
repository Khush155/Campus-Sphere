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
    return attendanceList.records || attendanceList.data || [];
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

      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 3.5 }}>
        <Grid item xs={12} sm={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: '20px',
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: isDark ? 'background.paper' : '#ffffff',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
              <Avatar sx={{ bgcolor: `${theme.palette.primary.main}15`, color: theme.palette.primary.main, width: 48, height: 48 }}>
                <AttendanceIcon />
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                  OVERALL AGGREGATE
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
                  {overallStats.pct}%
                </Typography>
              </Box>
            </Box>
            <LinearProgress
              variant="determinate"
              value={overallStats.pct}
              color={overallStats.pct >= 75 ? 'primary' : 'warning'}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Paper>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: '20px',
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: isDark ? 'background.paper' : '#ffffff',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: `${theme.palette.success.main}15`, color: theme.palette.success.main, width: 48, height: 48 }}>
                <VerifiedIcon />
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                  TOTAL LECTURES ATTENDED
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
                  {overallStats.attended} / {overallStats.total}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: '20px',
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: isDark ? 'background.paper' : '#ffffff',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: `${theme.palette.info.main}15`, color: theme.palette.info.main, width: 48, height: 48 }}>
                <AttendanceIcon />
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                  EXAM ELIGIBILITY STATUS
                </Typography>
                <Chip
                  label={overallStats.pct >= 75 ? 'ELIGIBLE' : 'CONDITIONAL'}
                  color={overallStats.pct >= 75 ? 'success' : 'warning'}
                  sx={{ fontWeight: 800, mt: 0.5 }}
                />
              </Box>
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
                <TableCell sx={{ fontWeight: 800 }}>PERCENTAGE</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>STATUS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    Loading attendance records...
                  </TableCell>
                </TableRow>
              ) : rawAttendanceList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary', fontWeight: 600 }}>
                    No subject attendance recorded yet for this semester.
                  </TableCell>
                </TableRow>
              ) : (
                rawAttendanceList.map((row) => {
                  const pct = row.attendancePercentage || 0;
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
                      <TableCell sx={{ fontWeight: 700 }}>{row.attendedClasses}</TableCell>
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
