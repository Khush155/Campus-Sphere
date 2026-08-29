import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Chip,
  Button,
  Avatar,
  LinearProgress,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  useTheme,
} from '@mui/material';
import {
  SchoolOutlined as AcademicIcon,
  CheckCircleOutlineOutlined as AttendanceIcon,
  AssignmentOutlined as AssignmentIcon,
  ReceiptLongOutlined as FeeIcon,
  DateRangeOutlined as TimetableIcon,
  EventNoteOutlined as LeaveIcon,
  CampaignOutlined as NoticeIcon,
  ArrowForwardOutlined as ArrowIcon,
  WbSunnyOutlined as MorningIcon,
  NightsStayOutlined as EveningIcon,
  GradeOutlined as GradeIcon,
  BadgeOutlined as IdCardIcon,
  Close as CloseIcon,
  FolderOutlined as DocumentIcon,
  VerifiedUserOutlined as VerifiedIcon,
  HourglassEmptyOutlined as PendingIcon,
  TrendingUpOutlined as ProgressIcon,
  CheckCircle as DoneIcon,
  MenuBookOutlined as BookIcon,
  ConfirmationNumberOutlined as HallTicketIcon,
} from '@mui/icons-material';

import { useAuth } from '../../contexts/AuthContext';
import { useMyProfileQuery } from '../../queries/userProfileQueries';
import {
  useStudentAttendanceQuery,
  useStudentAssignmentsQuery,
  useStudentGpaQuery,
  useStudentDocumentsQuery,
} from '../../queries/studentQueries';
import { useSubjectsQuery } from '../../queries/collegeQueries';
import { useFeedQuery } from '../../queries/noticeQueries';

// Helper to determine time-of-day greeting
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return { text: 'Good Morning', icon: '☀️' };
  if (hour < 17) return { text: 'Good Afternoon', icon: '🌤️' };
  return { text: 'Good Evening', icon: '🌙' };
};

export const StudentDashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isDark = theme.palette.mode === 'dark';
  const { user } = useAuth();
  const { data: profile } = useMyProfileQuery();

  const [selectedNotice, setSelectedNotice] = useState(null);

  const currentUser = profile?.user || user;
  const studentMeta = profile?.profileMeta || {};

  const greeting = getGreeting();

  const studentId = currentUser?._id || currentUser?.id;
  const branchObj = currentUser?.branchId;
  const branchId = typeof branchObj === 'object' ? branchObj?._id : branchObj;
  const currentSemester = studentMeta?.semester || currentUser?.semester || 1;
  const courseName = studentMeta?.course || currentUser?.courseId?.name || 'B.Tech';
  const branchName = studentMeta?.branch || currentUser?.branchId?.name || 'Computer Science & Engineering';
  const rollNumber = currentUser?.rollNumber || studentMeta?.rollNumber || '2310993001';

  // Live Queries
  const { data: attendanceData = [] } = useStudentAttendanceQuery(studentId);
  const { data: assignmentsData = [] } = useStudentAssignmentsQuery();
  const { data: noticesData = [] } = useFeedQuery();
  const { data: gpaData } = useStudentGpaQuery(studentId);
  const { data: documentsData = [] } = useStudentDocumentsQuery();
  const { data: liveSubjects = [] } = useSubjectsQuery({
    branchId: branchId || undefined,
    semester: currentSemester || undefined,
  });

  // Calculate dynamic GPA and label
  const gpaValue = useMemo(() => {
    if (gpaData?.gpa !== undefined && gpaData?.gpa !== null && Number(gpaData.gpa) > 0) {
      return Number(gpaData.gpa).toFixed(2);
    }
    if (currentUser?.cgpa !== undefined && currentUser?.cgpa !== null && Number(currentUser.cgpa) > 0) {
      return Number(currentUser.cgpa).toFixed(2);
    }
    return null;
  }, [gpaData, currentUser]);

  const gpaLabelInfo = useMemo(() => {
    if (!gpaValue) return { label: 'Pending', color: 'info' };
    const num = parseFloat(gpaValue);
    if (num >= 8.5) return { label: 'Distinction', color: 'success' };
    if (num >= 6.0) return { label: 'Passed', color: 'success' };
    if (num > 0) return { label: 'Improvement', color: 'warning' };
    return { label: 'Pending', color: 'info' };
  }, [gpaValue]);

  // Enrolled Subjects List
  const enrolledCoursesList = useMemo(() => {
    if (Array.isArray(liveSubjects)) return liveSubjects;
    if (liveSubjects?.data && Array.isArray(liveSubjects.data)) return liveSubjects.data;
    return [];
  }, [liveSubjects]);

  const enrolledSubjectsCount = enrolledCoursesList.length || 6;

  // Attendance Overall Calculation
  const attendanceStats = useMemo(() => {
    const list = attendanceData?.summary || (Array.isArray(attendanceData) ? attendanceData : (attendanceData?.records || attendanceData?.data || []));
    if (!list || list.length === 0) {
      return { percentage: 100, totalClasses: 0, attendedClasses: 0, status: 'GOOD' };
    }
    const total = list.reduce((acc, curr) => acc + (curr.totalClasses || 0), 0);
    const attended = list.reduce((acc, curr) => acc + (curr.attendedClasses || 0), 0);
    const pct = total > 0 ? Math.round((attended / total) * 100) : 100;
    return {
      percentage: pct,
      totalClasses: total,
      attendedClasses: attended,
      status: pct >= 75 ? 'GOOD' : 'WARNING',
    };
  }, [attendanceData]);

  // Pending Assignments
  const pendingAssignments = useMemo(() => {
    if (!assignmentsData) return [];
    const list = Array.isArray(assignmentsData) ? assignmentsData : (assignmentsData.data || []);
    return list.filter((a) => !a.mySubmission && (a.status === 'PUBLISHED' || a.status === 'OPEN'));
  }, [assignmentsData]);

  // Sorted Imminent Deadlines (Next 3)
  const upcomingDeadlines = useMemo(() => {
    if (!assignmentsData) return [];
    const list = Array.isArray(assignmentsData) ? assignmentsData : (assignmentsData.data || []);
    return list
      .filter((a) => a.dueDate)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 3);
  }, [assignmentsData]);

  // Recent Institutional Notices
  const recentNotices = useMemo(() => {
    if (!noticesData) return [];
    const list = Array.isArray(noticesData) ? noticesData : (noticesData.data || []);
    return list.slice(0, 4);
  }, [noticesData]);

  const shift = studentMeta?.shift || currentUser?.shift || 'MORNING';
  const totalDues = (currentUser?.feeDues?.tuition || 0) + (currentUser?.feeDues?.hostel || 0);
  const documentsCount = Array.isArray(documentsData) ? documentsData.length : 0;

  return (
    <Container maxWidth="xl" sx={{ py: 3.5 }}>
      {/* ── 1. Executive Student Command Header ────────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3.5 },
          mb: 3.5,
          borderRadius: '20px',
          border: `1px solid ${theme.palette.divider}`,
          background: isDark
            ? 'linear-gradient(135deg, rgba(79, 70, 229, 0.14) 0%, rgba(6, 182, 212, 0.08) 100%)'
            : 'linear-gradient(135deg, rgba(79, 70, 229, 0.06) 0%, rgba(6, 182, 212, 0.04) 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Grid container spacing={3} alignItems="center" justifyContent="space-between">
          <Grid item xs={12} md={7}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
              <Box sx={{ position: 'relative' }}>
                <Avatar
                  src={currentUser?.profilePicUrl}
                  sx={{
                    width: 72,
                    height: 72,
                    bgcolor: 'primary.main',
                    color: '#ffffff',
                    fontSize: '1.75rem',
                    fontWeight: 800,
                    border: `3px solid ${theme.palette.background.paper}`,
                    boxShadow: '0 8px 20px rgba(79, 70, 229, 0.25)',
                  }}
                >
                  {currentUser?.name?.charAt(0) || 'S'}
                </Avatar>
                <Box
                  sx={{
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    bgcolor: '#10b981',
                    border: `2px solid ${theme.palette.background.paper}`,
                    position: 'absolute',
                    bottom: 2,
                    right: 2,
                  }}
                />
              </Box>

              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap', mb: 0.5 }}>
                  <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em', color: 'text.primary' }}>
                    {greeting.text}, {currentUser?.name || 'Student'}! {greeting.icon}
                  </Typography>
                  <Chip
                    icon={<VerifiedIcon sx={{ fontSize: '14px !important', color: '#10b981 !important' }} />}
                    label="Verified Scholar"
                    size="small"
                    sx={{
                      bgcolor: 'rgba(16, 185, 129, 0.12)',
                      color: '#10b981',
                      fontWeight: 800,
                      fontSize: '0.68rem',
                      height: 22,
                      borderRadius: '6px',
                    }}
                  />
                  <Chip
                    icon={shift === 'EVENING' ? <EveningIcon sx={{ fontSize: '14px !important' }} /> : <MorningIcon sx={{ fontSize: '14px !important' }} />}
                    label={shift === 'EVENING' ? 'Evening Shift' : 'Morning Shift'}
                    size="small"
                    variant="outlined"
                    sx={{ fontWeight: 700, fontSize: '0.68rem', height: 22, borderRadius: '6px' }}
                  />
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  {courseName} · {branchName} • <strong style={{ color: theme.palette.text.primary }}>Sem {currentSemester}</strong> • Roll: <code style={{ fontFamily: 'monospace' }}>{rollNumber}</code>
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Academic Term Progress Track */}
          <Grid item xs={12} md={5}>
            <Box
              sx={{
                p: 2,
                borderRadius: '14px',
                bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.8)',
                border: `1px solid ${theme.palette.divider}`,
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <ProgressIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.primary', textTransform: 'uppercase' }}>
                    Term Progression · Week 6 of 16
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main', fontFamily: 'monospace' }}>
                  38% Term Complete
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={38}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(79, 70, 229, 0.12)',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 3,
                    background: 'linear-gradient(90deg, #4f46e5 0%, #06b6d4 100%)',
                  },
                }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.25 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  Current Phase: Continuous Evaluation Window
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    startIcon={<IdCardIcon fontSize="small" />}
                    onClick={() => navigate('/student/profile')}
                    sx={{ textTransform: 'none', fontWeight: 800, fontSize: '0.72rem', py: 0.25, borderRadius: '6px' }}
                  >
                    ID Card
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<TimetableIcon fontSize="small" />}
                    onClick={() => navigate('/student/timetable')}
                    sx={{ textTransform: 'none', fontWeight: 800, fontSize: '0.72rem', py: 0.25, borderRadius: '6px' }}
                  >
                    Timetable
                  </Button>
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* ── 2. Top Metric KPI Grids (4 Roster-Style Top-Bordered Cards) ────────── */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        {/* Attendance Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            onClick={() => navigate('/student/attendance')}
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
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: '0 8px 24px rgba(79, 70, 229, 0.15)',
              },
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ bgcolor: 'rgba(79, 70, 229, 0.12)', color: '#4f46e5', width: 44, height: 44, borderRadius: '10px' }}>
                <AttendanceIcon fontSize="small" />
              </Avatar>
              <Chip
                label={attendanceStats.status === 'GOOD' ? 'Safe (≥75%)' : 'At Risk (<75%)'}
                size="small"
                color={attendanceStats.status === 'GOOD' ? 'success' : 'error'}
                sx={{ fontWeight: 800, fontSize: '0.7rem', borderRadius: '6px' }}
              />
            </Box>
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5, fontFamily: theme.typography.mono?.fontFamily || 'monospace' }}>
                {attendanceStats.percentage}%
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 1.5 }}>
                Overall Attendance ({attendanceStats.attendedClasses}/{attendanceStats.totalClasses} Lectures)
              </Typography>
              <LinearProgress
                variant="determinate"
                value={attendanceStats.percentage}
                color={attendanceStats.status === 'GOOD' ? 'primary' : 'error'}
                sx={{ height: 6, borderRadius: 3 }}
              />
            </Box>
          </Paper>
        </Grid>

        {/* Enrolled Subjects */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            onClick={() => navigate('/student/academics')}
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
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: '0 8px 24px rgba(6, 182, 212, 0.15)',
              },
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ bgcolor: 'rgba(6, 182, 212, 0.12)', color: '#06b6d4', width: 44, height: 44, borderRadius: '10px' }}>
                <AcademicIcon fontSize="small" />
              </Avatar>
              <Chip label={`Semester ${currentSemester}`} size="small" color="info" sx={{ fontWeight: 800, fontSize: '0.7rem', borderRadius: '6px' }} />
            </Box>
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5, fontFamily: theme.typography.mono?.fontFamily || 'monospace' }}>
                {enrolledSubjectsCount}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                Active Enrolled Subjects
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Pending Assignments */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            onClick={() => navigate('/student/assignments')}
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
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: '0 8px 24px rgba(245, 158, 11, 0.15)',
              },
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ bgcolor: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', width: 44, height: 44, borderRadius: '10px' }}>
                <AssignmentIcon fontSize="small" />
              </Avatar>
              <Chip
                label={pendingAssignments.length > 0 ? `${pendingAssignments.length} Pending` : 'All Done'}
                size="small"
                color={pendingAssignments.length > 0 ? 'warning' : 'success'}
                sx={{ fontWeight: 800, fontSize: '0.7rem', borderRadius: '6px' }}
              />
            </Box>
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5, fontFamily: theme.typography.mono?.fontFamily || 'monospace' }}>
                {pendingAssignments.length}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                Coursework Assignments Due
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Academic GPA / Grade */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            onClick={() => navigate('/student/examinations')}
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
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.15)',
              },
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ bgcolor: 'rgba(16, 185, 129, 0.12)', color: '#10b981', width: 44, height: 44, borderRadius: '10px' }}>
                <GradeIcon fontSize="small" />
              </Avatar>
              <Chip label={gpaLabelInfo.label} size="small" color={gpaLabelInfo.color} sx={{ fontWeight: 800, fontSize: '0.7rem', borderRadius: '6px' }} />
            </Box>
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5, fontFamily: theme.typography.mono?.fontFamily || 'monospace' }}>
                {gpaValue ? `${gpaValue} / 10` : 'Evaluating'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                Current Semester Performance
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* ── 3. Balanced Operational Command Center Grid ─────────────────────── */}
      <Grid container spacing={3}>
        {/* Left Column (md=7): Services, Deadlines & Enrolled Curriculum */}
        <Grid item xs={12} md={7}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* 1. Student Command Services Hub (4 Vibrant Tiles with Live Badges) */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: '16px',
                border: `1px solid ${theme.palette.divider}`,
                bgcolor: isDark ? 'background.paper' : '#ffffff',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.01em' }}>
                  Student Command Services
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                  Quick Operational Portals
                </Typography>
              </Box>

              <Grid container spacing={2}>
                {[
                  {
                    title: 'Coursework Desk',
                    subtitle: 'Submissions & Feedback',
                    badge: `${pendingAssignments.length} Due`,
                    color: '#f59e0b',
                    icon: <AssignmentIcon fontSize="small" />,
                    path: '/student/assignments',
                  },
                  {
                    title: 'Fee Clearance',
                    subtitle: 'Accounts & Receipts',
                    badge: totalDues === 0 ? 'Cleared ✓' : `₹${totalDues} Due`,
                    color: totalDues === 0 ? '#10b981' : '#ef4444',
                    icon: <FeeIcon fontSize="small" />,
                    path: '/student/fees',
                  },
                  {
                    title: 'Official Certificates',
                    subtitle: 'Bonafide, NOC & Transcripts',
                    badge: `${documentsCount} Active`,
                    color: '#06b6d4',
                    icon: <DocumentIcon fontSize="small" />,
                    path: '/student/documents',
                  },
                  {
                    title: 'Leave Applications',
                    subtitle: 'HOD Approval Desk',
                    badge: 'Direct HOD',
                    color: '#4f46e5',
                    icon: <LeaveIcon fontSize="small" />,
                    path: '/student/leave',
                  },
                ].map((service) => (
                  <Grid item xs={12} sm={6} key={service.title}>
                    <Paper
                      elevation={0}
                      onClick={() => navigate(service.path)}
                      sx={{
                        p: 2,
                        borderRadius: '12px',
                        border: `1px solid ${theme.palette.divider}`,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        height: '100%',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 20px rgba(0,0,0,0.06)',
                          borderColor: service.color,
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                        <Avatar sx={{ bgcolor: `${service.color}15`, color: service.color, width: 38, height: 38, borderRadius: '10px' }}>
                          {service.icon}
                        </Avatar>
                        <Chip
                          label={service.badge}
                          size="small"
                          sx={{
                            fontWeight: 800,
                            fontSize: '0.68rem',
                            height: 22,
                            bgcolor: `${service.color}15`,
                            color: service.color,
                            borderRadius: '6px',
                          }}
                        />
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                          {service.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                          {service.subtitle}
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Paper>

            {/* 2. Coursework Deadlines Radar */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: '16px',
                border: `1px solid ${theme.palette.divider}`,
                borderTop: '4px solid #f59e0b',
                bgcolor: isDark ? 'background.paper' : '#ffffff',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PendingIcon sx={{ color: '#f59e0b' }} fontSize="small" />
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary' }}>
                    Coursework Deadlines Radar
                  </Typography>
                </Box>
                <Button
                  size="small"
                  onClick={() => navigate('/student/assignments')}
                  endIcon={<ArrowIcon fontSize="small" />}
                  sx={{ textTransform: 'none', fontWeight: 800, fontSize: '0.75rem' }}
                >
                  All Coursework
                </Button>
              </Box>

              {upcomingDeadlines.length === 0 ? (
                <Box sx={{ py: 3, textAlign: 'center' }}>
                  <DoneIcon sx={{ color: '#10b981', fontSize: 38, mb: 0.5 }} />
                  <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                    All Coursework Submitted! 🎉
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    You are all caught up with your academic submissions for this week.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {upcomingDeadlines.map((item) => {
                    const dueDateObj = new Date(item.dueDate);
                    const isPast = dueDateObj < new Date();
                    return (
                      <Box
                        key={item._id}
                        onClick={() => navigate('/student/assignments')}
                        sx={{
                          p: 1.75,
                          borderRadius: '10px',
                          border: `1px solid ${theme.palette.divider}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s',
                          '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' },
                        }}
                      >
                        <Box sx={{ maxWidth: '68%' }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.subjectId?.name || item.subject || 'Coursework'}
                          </Typography>
                        </Box>
                        <Chip
                          label={isPast ? 'Overdue' : dueDateObj.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                          size="small"
                          color={isPast ? 'error' : 'warning'}
                          sx={{ fontWeight: 800, fontSize: '0.68rem', borderRadius: '6px' }}
                        />
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Paper>

            {/* 3. Active Enrolled Curriculum Snapshot */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: '16px',
                border: `1px solid ${theme.palette.divider}`,
                bgcolor: isDark ? 'background.paper' : '#ffffff',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BookIcon color="primary" fontSize="small" />
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary' }}>
                    Enrolled Semester Curriculum ({courseName} · Sem {currentSemester})
                  </Typography>
                </Box>
                <Button
                  size="small"
                  onClick={() => navigate('/student/academics')}
                  endIcon={<ArrowIcon fontSize="small" />}
                  sx={{ textTransform: 'none', fontWeight: 800, fontSize: '0.75rem' }}
                >
                  Full Syllabus
                </Button>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                {(enrolledCoursesList.length > 0 ? enrolledCoursesList.slice(0, 4) : [
                  { _id: '1', name: 'Data Structures & Algorithms', code: 'CS201', credits: 4, type: 'THEORY' },
                  { _id: '2', name: 'Database Management Systems', code: 'CS202', credits: 4, type: 'THEORY' },
                  { _id: '3', name: 'Object Oriented Programming Lab', code: 'CS203P', credits: 2, type: 'PRACTICAL' },
                  { _id: '4', name: 'Discrete Mathematics', code: 'MA201', credits: 3, type: 'THEORY' },
                ]).map((subject) => (
                  <Box
                    key={subject._id || subject.code}
                    sx={{
                      p: 1.5,
                      borderRadius: '10px',
                      border: `1px solid ${theme.palette.divider}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      bgcolor: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 32, height: 32, fontSize: '0.75rem', fontWeight: 800, bgcolor: 'rgba(79, 70, 229, 0.1)', color: 'primary.main', borderRadius: '8px' }}>
                        {subject.code ? subject.code.slice(0, 2) : 'CS'}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', fontSize: '0.85rem' }}>
                          {subject.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Code: {subject.code || 'N/A'} • {subject.type || 'Core Subject'}
                        </Typography>
                      </Box>
                    </Box>

                    <Chip
                      label={`${subject.credits || 4} Credits`}
                      size="small"
                      sx={{ fontWeight: 800, fontSize: '0.68rem', borderRadius: '6px', bgcolor: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4' }}
                    />
                  </Box>
                ))}
              </Box>
            </Paper>
          </Box>
        </Grid>

        {/* Right Column (md=5): Announcements, Standing & Master Timetable Banner */}
        <Grid item xs={12} md={5}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* 1. Master Timetable Access Banner */}
            <Paper
              elevation={0}
              onClick={() => navigate('/student/timetable')}
              sx={{
                p: 2.5,
                borderRadius: '16px',
                border: `1px solid ${theme.palette.divider}`,
                borderLeft: '6px solid #4f46e5',
                bgcolor: isDark ? 'background.paper' : '#ffffff',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 24px rgba(79, 70, 229, 0.12)',
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'rgba(79, 70, 229, 0.12)', color: '#4f46e5', width: 44, height: 44, borderRadius: '12px' }}>
                    <TimetableIcon fontSize="small" />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>
                      Weekly Class Timetable
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      View all periods, lecture halls &amp; weekly lab timings
                    </Typography>
                  </Box>
                </Box>
                <ArrowIcon sx={{ color: 'primary.main', fontSize: 20 }} />
              </Box>
            </Paper>

            {/* 2. Institutional Circulars Feed */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: '16px',
                border: `1px solid ${theme.palette.divider}`,
                bgcolor: isDark ? 'background.paper' : '#ffffff',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <NoticeIcon color="primary" fontSize="small" />
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary' }}>
                    Institutional Circulars
                  </Typography>
                </Box>
                <Button size="small" onClick={() => navigate('/student/notices')} sx={{ textTransform: 'none', fontWeight: 800 }}>
                  All Notices
                </Button>
              </Box>

              {recentNotices.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center', fontWeight: 600 }}>
                  No published circulars currently active.
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                  {recentNotices.map((notice, idx) => (
                    <React.Fragment key={notice._id || idx}>
                      {idx > 0 && <Divider />}
                      <Box
                        onClick={() => setSelectedNotice(notice)}
                        sx={{
                          py: 1,
                          px: 1,
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s',
                          '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' },
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', fontSize: '0.85rem' }}>
                            {notice.title}
                          </Typography>
                          <Chip
                            label={notice.priority === 'HIGH' ? 'URGENT' : notice.category || 'NOTICE'}
                            size="small"
                            color={notice.priority === 'HIGH' ? 'error' : 'default'}
                            sx={{ fontWeight: 800, fontSize: '0.62rem', height: 18, borderRadius: '4px' }}
                          />
                        </Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            lineHeight: 1.4,
                          }}
                        >
                          {notice.content}
                        </Typography>
                      </Box>
                    </React.Fragment>
                  ))}
                </Box>
              )}
            </Paper>

            {/* 3. Academic Standing & Examination Clearance */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: '16px',
                border: `1px solid ${theme.palette.divider}`,
                bgcolor: isDark ? 'background.paper' : '#ffffff',
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', mb: 2 }}>
                Academic &amp; Exam Clearance
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Attendance Clearance (75% Req.)
                  </Typography>
                  <Chip
                    label={attendanceStats.percentage >= 75 ? 'ELIGIBLE' : 'DEBARRED'}
                    size="small"
                    color={attendanceStats.percentage >= 75 ? 'success' : 'error'}
                    sx={{ fontWeight: 800, fontSize: '0.68rem', borderRadius: '6px' }}
                  />
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Semester Tuition Clearance
                  </Typography>
                  <Chip
                    label={totalDues === 0 ? 'CLEARED' : 'PENDING'}
                    size="small"
                    color={totalDues === 0 ? 'success' : 'warning'}
                    sx={{ fontWeight: 800, fontSize: '0.68rem', borderRadius: '6px' }}
                  />
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Disciplinary Good Standing
                  </Typography>
                  <Chip
                    label="CLEAN RECORD"
                    size="small"
                    color="success"
                    sx={{ fontWeight: 800, fontSize: '0.68rem', borderRadius: '6px' }}
                  />
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Button
                fullWidth
                variant="outlined"
                startIcon={<HallTicketIcon />}
                onClick={() => navigate('/student/examinations')}
                sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 800, py: 1 }}
              >
                View Hall Ticket / Results
              </Button>
            </Paper>
          </Box>
        </Grid>
      </Grid>

      {/* ── 4. Notice Detail Dialog ───────────────────────────────────────── */}
      <Dialog
        open={Boolean(selectedNotice)}
        onClose={() => setSelectedNotice(null)}
        PaperProps={{ sx: { borderRadius: '16px', p: 1, maxWidth: 520 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {selectedNotice?.title}
          <IconButton size="small" onClick={() => setSelectedNotice(null)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
            {selectedNotice?.content}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSelectedNotice(null)} variant="contained" sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 800 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default StudentDashboard;
