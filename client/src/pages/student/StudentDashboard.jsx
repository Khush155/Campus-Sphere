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
  LocationOnOutlined as RoomIcon,
  PersonOutlined as InstructorIcon,
  AccessTimeOutlined as TimeIcon,
} from '@mui/icons-material';

import { useAuth } from '../../contexts/AuthContext';
import { useMyProfileQuery } from '../../queries/userProfileQueries';
import { useStudentAttendanceQuery, useStudentAssignmentsQuery, useStudentGpaQuery } from '../../queries/studentQueries';
import { useSubjectsQuery } from '../../queries/collegeQueries';
import { useTimetableQuery } from '../../queries/timetableQueries';
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

  // Queries
  const { data: attendanceData = [] } = useStudentAttendanceQuery(studentId);
  const { data: assignmentsData = [] } = useStudentAssignmentsQuery();
  const { data: timetableData = [] } = useTimetableQuery();
  const { data: noticesData = [] } = useFeedQuery();
  const { data: gpaData } = useStudentGpaQuery(studentId);
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

  // Enrolled Subjects Count
  const enrolledSubjectsCount = useMemo(() => {
    if (Array.isArray(liveSubjects)) return liveSubjects.length;
    if (liveSubjects?.data && Array.isArray(liveSubjects.data)) return liveSubjects.data.length;
    return 0;
  }, [liveSubjects]);

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

  // Today's Day Name
  const todayDayName = useMemo(() => {
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    return days[new Date().getDay()];
  }, []);

  // Today's Timetable Slots
  const todaysSchedule = useMemo(() => {
    if (!timetableData) return [];
    const list = Array.isArray(timetableData) ? timetableData : (timetableData.data || []);
    return list.filter((slot) => {
      const day = (slot.dayOfWeek || slot.day || '').toUpperCase();
      return day === todayDayName;
    });
  }, [timetableData, todayDayName]);

  const pendingAssignments = useMemo(() => {
    if (!assignmentsData) return [];
    const list = Array.isArray(assignmentsData) ? assignmentsData : (assignmentsData.data || []);
    return list.filter((a) => !a.mySubmission && (a.status === 'PUBLISHED' || a.status === 'OPEN'));
  }, [assignmentsData]);

  const recentNotices = useMemo(() => {
    if (!noticesData) return [];
    const list = Array.isArray(noticesData) ? noticesData : (noticesData.data || []);
    return list.slice(0, 5);
  }, [noticesData]);

  const shift = studentMeta?.shift || currentUser?.shift || 'MORNING';

  return (
    <Container maxWidth="xl" sx={{ py: 3.5 }}>
      {/* ── 1. Hero Student Profile Banner Card ────────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 4 },
          mb: 3.5,
          borderRadius: '24px',
          background: isDark
            ? 'linear-gradient(135deg, rgba(79, 70, 229, 0.25) 0%, rgba(6, 182, 212, 0.2) 100%)'
            : 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(79, 70, 229, 0.25)',
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
              <Box sx={{ position: 'relative' }}>
                <Avatar
                  src={currentUser?.profilePicUrl}
                  sx={{
                    width: 82,
                    height: 82,
                    bgcolor: 'rgba(255, 255, 255, 0.25)',
                    fontSize: '2rem',
                    fontWeight: 800,
                    border: '3px solid rgba(255, 255, 255, 0.5)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                  }}
                >
                  {currentUser?.name?.charAt(0) || 'S'}
                </Avatar>
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    bgcolor: '#10b981',
                    border: '3px solid #ffffff',
                    position: 'absolute',
                    bottom: 4,
                    right: 4,
                  }}
                />
              </Box>

              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mb: 0.75 }}>
                  <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em', fontSize: { xs: '1.5rem', sm: '2.1rem' } }}>
                    {greeting.text}, {currentUser?.name || 'Student'}! {greeting.icon}
                  </Typography>
                  <Chip
                    icon={shift === 'EVENING' ? <EveningIcon sx={{ color: '#ffffff !important' }} /> : <MorningIcon sx={{ color: '#ffffff !important' }} />}
                    label={shift === 'EVENING' ? '🌙 Evening Shift' : '☀️ Morning Shift'}
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      color: '#ffffff',
                      fontWeight: 800,
                      backdropFilter: 'blur(10px)',
                    }}
                  />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap', opacity: 0.95 }}>
                  <Chip label={`ROLL: ${studentMeta?.rollNumber || currentUser?.rollNumber || 'N/A'}`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.18)', color: '#ffffff', fontWeight: 700 }} />
                  <Chip label={`${studentMeta?.course || 'B.Tech'} • ${studentMeta?.branch || branchObj?.code || 'N/A'}`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.18)', color: '#ffffff', fontWeight: 700 }} />
                  <Chip label={`Sem ${currentSemester} • Group ${studentMeta?.group || currentUser?.group || 'N/A'}`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.18)', color: '#ffffff', fontWeight: 700 }} />
                </Box>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
            <Box sx={{ display: 'flex', gap: 1.5, justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
              <Button
                variant="contained"
                onClick={() => navigate('/student/profile')}
                startIcon={<IdCardIcon />}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: '#ffffff',
                  fontWeight: 800,
                  px: 2.5,
                  py: 1.25,
                  borderRadius: '14px',
                  textTransform: 'none',
                  backdropFilter: 'blur(10px)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                }}
              >
                ID Card
              </Button>

              <Button
                variant="contained"
                onClick={() => navigate('/student/timetable')}
                startIcon={<TimetableIcon sx={{ color: '#ffffff !important' }} />}
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.25)',
                  color: '#ffffff !important',
                  fontWeight: 800,
                  px: 2.5,
                  py: 1.25,
                  borderRadius: '14px',
                  textTransform: 'none',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.35)' },
                }}
              >
                Schedule
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* ── 2. Metric KPI Cards Grid ───────────────────────────────────────── */}
      <Grid container spacing={3} sx={{ mb: 3.5 }}>
        {/* Attendance Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            onClick={() => navigate('/student/attendance')}
            sx={{
              p: 2.5,
              borderRadius: '20px',
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: isDark ? 'background.paper' : '#ffffff',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 24px rgba(79, 70, 229, 0.12)',
              },
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ bgcolor: `${theme.palette.primary.main}15`, color: theme.palette.primary.main, width: 46, height: 46 }}>
                <AttendanceIcon />
              </Avatar>
              <Chip
                label={attendanceStats.status === 'GOOD' ? 'Safe (≥75%)' : 'At Risk (<75%)'}
                size="small"
                color={attendanceStats.status === 'GOOD' ? 'success' : 'error'}
                sx={{ fontWeight: 800, fontSize: '0.7rem' }}
              />
            </Box>
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5 }}>
                {attendanceStats.percentage}%
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 1.5 }}>
                Overall Attendance ({attendanceStats.attendedClasses}/{attendanceStats.totalClasses} Lectures)
              </Typography>
              <LinearProgress
                variant="determinate"
                value={attendanceStats.percentage}
                color={attendanceStats.status === 'GOOD' ? 'primary' : 'error'}
                sx={{ height: 8, borderRadius: 4 }}
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
              borderRadius: '20px',
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: isDark ? 'background.paper' : '#ffffff',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 24px rgba(6, 182, 212, 0.12)',
              },
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ bgcolor: `${theme.palette.info.main}15`, color: theme.palette.info.main, width: 46, height: 46 }}>
                <AcademicIcon />
              </Avatar>
              <Chip label={`Semester ${currentSemester}`} size="small" color="info" sx={{ fontWeight: 800, fontSize: '0.7rem' }} />
            </Box>
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5 }}>
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
              borderRadius: '20px',
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: isDark ? 'background.paper' : '#ffffff',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 24px rgba(245, 158, 11, 0.12)',
              },
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ bgcolor: `${theme.palette.warning.main}15`, color: theme.palette.warning.main, width: 46, height: 46 }}>
                <AssignmentIcon />
              </Avatar>
              <Chip label="Pending" size="small" color="warning" sx={{ fontWeight: 800, fontSize: '0.7rem' }} />
            </Box>
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5 }}>
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
              borderRadius: '20px',
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: isDark ? 'background.paper' : '#ffffff',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 24px rgba(16, 185, 129, 0.12)',
              },
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ bgcolor: `${theme.palette.success.main}15`, color: theme.palette.success.main, width: 46, height: 46 }}>
                <GradeIcon />
              </Avatar>
              <Chip label={gpaLabelInfo.label} size="small" color={gpaLabelInfo.color} sx={{ fontWeight: 800, fontSize: '0.7rem' }} />
            </Box>
            <Box>
              <Typography variant={gpaValue ? 'h3' : 'h6'} sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5 }}>
                {gpaValue || 'Evaluation Pending'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                Current Semester CGPA / Grade
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* ── 3. Main Content Split Grid ───────────────────────────────────── */}
      <Grid container spacing={3.5}>
        {/* Today's Schedule Timeline */}
        <Grid item xs={12} md={7}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: '24px',
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: isDark ? 'background.paper' : '#ffffff',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                <TimetableIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary' }}>
                  Today&apos;s Class Schedule ({todayDayName})
                </Typography>
              </Box>
              <Button size="small" onClick={() => navigate('/student/timetable')} endIcon={<ArrowIcon />} sx={{ textTransform: 'none', fontWeight: 800 }}>
                Full Timetable
              </Button>
            </Box>

            {todaysSchedule.length === 0 ? (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <Avatar sx={{ width: 56, height: 56, mx: 'auto', mb: 1.5, bgcolor: `${theme.palette.primary.main}15`, color: theme.palette.primary.main }}>
                  <TimetableIcon fontSize="large" />
                </Avatar>
                <Typography variant="subtitle1" color="text.primary" sx={{ fontWeight: 800, mb: 0.5 }}>
                  No classes scheduled for today! 🎉
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Enjoy your study break or check your full weekly schedule.
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {todaysSchedule.map((slot, index) => (
                  <Paper
                    key={slot._id || index}
                    variant="outlined"
                    sx={{
                      p: 2.25,
                      borderRadius: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderLeft: `6px solid ${theme.palette.primary.main}`,
                      transition: 'background-color 0.2s',
                      '&:hover': {
                        bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(79, 70, 229, 0.02)',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: `${theme.palette.primary.main}15`, color: theme.palette.primary.main, width: 44, height: 44, fontSize: '0.9rem', fontWeight: 800 }}>
                        P{index + 1}
                      </Avatar>

                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2, mb: 0.5 }}>
                          {slot.subjectId?.name || slot.subject || 'Lecture Session'}
                        </Typography>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <RoomIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                              Room: {slot.roomNumber || slot.room || 'N/A'}
                            </Typography>
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <InstructorIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                              {slot.facultyId?.name || slot.faculty || 'Unassigned'}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Box>

                    <Chip
                      icon={<TimeIcon fontSize="small" />}
                      label={`${slot.startTime} - ${slot.endTime}`}
                      sx={{ fontWeight: 800, bgcolor: `${theme.palette.primary.main}12`, color: theme.palette.primary.main, px: 1 }}
                    />
                  </Paper>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Quick Actions & Recent Notices */}
        <Grid item xs={12} md={5}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
            {/* Quick Actions Panel */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: '24px',
                border: `1px solid ${theme.palette.divider}`,
                bgcolor: isDark ? 'background.paper' : '#ffffff',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', mb: 2 }}>
                Student Quick Services
              </Typography>

              <Grid container spacing={1.5}>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<LeaveIcon />}
                    onClick={() => navigate('/student/leave')}
                    sx={{ borderRadius: '14px', py: 1.5, fontWeight: 800, textTransform: 'none', justifyContent: 'flex-start' }}
                  >
                    Apply Leave
                  </Button>
                </Grid>

                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<AssignmentIcon />}
                    onClick={() => navigate('/student/assignments')}
                    sx={{ borderRadius: '14px', py: 1.5, fontWeight: 800, textTransform: 'none', justifyContent: 'flex-start' }}
                  >
                    Assignments
                  </Button>
                </Grid>

                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<FeeIcon />}
                    onClick={() => navigate('/fees')}
                    sx={{ borderRadius: '14px', py: 1.5, fontWeight: 800, textTransform: 'none', justifyContent: 'flex-start' }}
                  >
                    Fee Statement
                  </Button>
                </Grid>

                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<AcademicIcon />}
                    onClick={() => navigate('/student/academics')}
                    sx={{ borderRadius: '14px', py: 1.5, fontWeight: 800, textTransform: 'none', justifyContent: 'flex-start' }}
                  >
                    Curriculum
                  </Button>
                </Grid>
              </Grid>
            </Paper>

            {/* Recent Announcements Feed */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: '24px',
                border: `1px solid ${theme.palette.divider}`,
                bgcolor: isDark ? 'background.paper' : '#ffffff',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <NoticeIcon color="info" />
                  <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary' }}>
                    Announcements Radar
                  </Typography>
                </Box>

                <Button size="small" onClick={() => navigate('/student/notices')} sx={{ textTransform: 'none', fontWeight: 800 }}>
                  View All
                </Button>
              </Box>

              {recentNotices.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center', fontWeight: 600 }}>
                  No active notices published.
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {recentNotices.map((notice, idx) => (
                    <React.Fragment key={notice._id || idx}>
                      {idx > 0 && <Divider />}
                      <Box
                        onClick={() => setSelectedNotice(notice)}
                        sx={{
                          py: 1,
                          px: 1,
                          borderRadius: '12px',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s',
                          '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' },
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', fontSize: '0.88rem' }}>
                            {notice.title}
                          </Typography>
                          <Chip label="NOTICE" size="small" color="info" sx={{ fontWeight: 800, fontSize: '0.62rem', height: 18 }} />
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
          </Box>
        </Grid>
      </Grid>

      {/* Notice Detail Dialog */}
      <Dialog
        open={Boolean(selectedNotice)}
        onClose={() => setSelectedNotice(null)}
        PaperProps={{ sx: { borderRadius: '24px', p: 1, maxWidth: 540 } }}
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
          <Button onClick={() => setSelectedNotice(null)} variant="contained" sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 800 }}>
            Close Announcement
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default StudentDashboard;
