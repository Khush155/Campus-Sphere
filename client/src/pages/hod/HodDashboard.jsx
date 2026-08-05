import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  Grid,
  CircularProgress,
  useTheme,
  Button,
  Avatar,
  Chip,
  Paper,
  Divider,
} from '@mui/material';
import {
  PeopleOutlined,
  MenuBookOutlined,
  AssignmentIndOutlined,
  ArrowForwardOutlined,
  NotificationsOutlined,
  CalendarMonthOutlined,
  SwapHorizOutlined,
  FactCheckOutlined,
  WorkOutlined,
  SchoolOutlined,
  RefreshOutlined,
  GroupsOutlined,
} from '@mui/icons-material';
import { useUsersQuery } from '../../queries/userQueries';
import { useSubjectsQuery, useDepartmentsQuery } from '../../queries/collegeQueries';
import { useRecentNoticesQuery } from '../../queries/dashboardQueries';
import { useActiveSessionQuery } from '../../queries/academicSessionQueries';
import { useAuth } from '../../contexts/AuthContext';

export const HodDashboard = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Queries
  const { data: facultyData, isLoading: loadingFaculty, refetch: refetchFaculty } = useUsersQuery({
    role: 'FACULTY',
    department: user?.departmentId,
    limit: 1,
  });
  const { data: studentData, isLoading: loadingStudents, refetch: refetchStudents } = useUsersQuery({
    role: 'STUDENT',
    department: user?.departmentId,
    limit: 1,
  });
  const { data: subjectData, isLoading: loadingSubjects, refetch: refetchSubjects } = useSubjectsQuery({
    department: user?.departmentId,
  });
  const { data: depts } = useDepartmentsQuery();
  const { data: activeSession } = useActiveSessionQuery();
  const { data: recentNotices, isLoading: loadingNotices } = useRecentNoticesQuery(5);

  const deptInfo = depts?.find((d) => String(d._id) === String(user?.departmentId));

  const totalFaculty = facultyData?.meta?.total ?? facultyData?.data?.length ?? 0;
  const totalStudents = studentData?.meta?.total ?? studentData?.data?.length ?? 0;
  const totalSubjects = subjectData?.length ?? 0;

  const handleRefresh = () => {
    refetchFaculty();
    refetchStudents();
    refetchSubjects();
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      {/* ── 1. Hero Identity Header ────────────────────────────────────────── */}
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, flexWrap: 'wrap' }}>
              <Chip
                icon={<SchoolOutlined sx={{ fontSize: '0.9rem !important', color: `${theme.palette.primary.main} !important` }} />}
                label="HEAD OF DEPARTMENT WORKSPACE"
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
              {deptInfo && (
                <Chip
                  label={`DEPT OF ${deptInfo.name.toUpperCase()} (${deptInfo.code})`}
                  size="small"
                  sx={{
                    bgcolor: `${theme.palette.brass?.[500] || '#b8863e'}18`,
                    color: theme.palette.brass?.[500] || '#b8863e',
                    fontWeight: 800,
                    fontSize: '0.7rem',
                  }}
                />
              )}
            </Box>
            <Typography variant="h4" sx={{ fontFamily: theme.typography.h1.fontFamily, fontWeight: 800, color: theme.palette.ink[900] }}>
              Welcome back, {user?.name || 'Department Head'}
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
              Overseeing faculty workloads, student progress, curriculum subjects, timetables, and departmental operations.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshOutlined />}
              onClick={handleRefresh}
              sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              onClick={() => navigate('/hod/reports')}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 700,
                background: theme.palette.primary.gradient || theme.palette.primary.main,
                color: '#ffffff',
              }}
            >
              View Analytics
            </Button>
          </Box>
        </Box>
      </Card>

      {/* ── 2. KPI Summary Grid ────────────────────────────────────────────── */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            onClick={() => navigate('/hod/faculty')}
            sx={{
              p: 3,
              borderRadius: '14px',
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: 'none',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                borderColor: theme.palette.primary.main,
              },
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em' }}>
                DEPARTMENT FACULTY
              </Typography>
              <Avatar sx={{ bgcolor: `${theme.palette.primary.main}15`, color: theme.palette.primary.main, width: 40, height: 40 }}>
                <GroupsOutlined />
              </Avatar>
            </Box>
            <Typography variant="h3" sx={{ fontWeight: 800, color: theme.palette.ink[900], fontFamily: theme.typography.mono.fontFamily }}>
              {loadingFaculty ? <CircularProgress size={24} /> : totalFaculty}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Assigned professors & instructors
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            onClick={() => navigate('/hod/students')}
            sx={{
              p: 3,
              borderRadius: '14px',
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: 'none',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                borderColor: theme.palette.primary.main,
              },
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.signal.success }}>
                ENROLLED STUDENTS
              </Typography>
              <Avatar sx={{ bgcolor: `${theme.palette.signal.success}15`, color: theme.palette.signal.success, width: 40, height: 40 }}>
                <PeopleOutlined />
              </Avatar>
            </Box>
            <Typography variant="h3" sx={{ fontWeight: 800, color: theme.palette.ink[900], fontFamily: theme.typography.mono.fontFamily }}>
              {loadingStudents ? <CircularProgress size={24} /> : totalStudents}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Across active branches & sems
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            onClick={() => navigate('/hod/subjects')}
            sx={{
              p: 3,
              borderRadius: '14px',
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: 'none',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                borderColor: theme.palette.primary.main,
              },
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.warning.main }}>
                CURRICULUM SUBJECTS
              </Typography>
              <Avatar sx={{ bgcolor: `${theme.palette.warning.main}15`, color: theme.palette.warning.main, width: 40, height: 40 }}>
                <MenuBookOutlined />
              </Avatar>
            </Box>
            <Typography variant="h3" sx={{ fontWeight: 800, color: theme.palette.ink[900], fontFamily: theme.typography.mono.fontFamily }}>
              {loadingSubjects ? <CircularProgress size={24} /> : totalSubjects}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Active department courses
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            onClick={() => navigate('/hod/timetable')}
            sx={{
              p: 3,
              borderRadius: '14px',
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: 'none',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                borderColor: theme.palette.primary.main,
              },
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.brass?.[500] || '#b8863e' }}>
                SCHEDULE STATUS
              </Typography>
              <Avatar sx={{ bgcolor: `${theme.palette.brass?.[500] || '#b8863e'}15`, color: theme.palette.brass?.[500] || '#b8863e', width: 40, height: 40 }}>
                <CalendarMonthOutlined />
              </Avatar>
            </Box>
            <Typography variant="h3" sx={{ fontWeight: 800, color: theme.palette.ink[900], fontFamily: theme.typography.mono.fontFamily }}>
              ACTIVE
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Weekly Timetable Grid
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* ── 3. Quick Workspace Actions Grid ───────────────────────────────── */}
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 800, color: theme.palette.ink[900], mb: 2 }}>
          Department Workspace Operations
        </Typography>

        <Grid container spacing={2}>
          {[
            {
              title: 'Faculty Workload Allocation',
              desc: 'Assign subjects and lab hours to faculty members',
              icon: <AssignmentIndOutlined />,
              path: '/hod/faculty-assignment',
            },
            {
              title: 'Student Directory & Roll Numbers',
              desc: 'View student profiles, Roll Nos, and batch promotion',
              icon: <PeopleOutlined />,
              path: '/hod/students',
            },
            {
              title: 'Timetable Generator Studio',
              desc: 'Generate & edit weekly timetable schedule grids',
              icon: <CalendarMonthOutlined />,
              path: '/hod/timetable',
            },
            {
              title: 'Cross-Dept Teaching Requests',
              desc: 'Request guest or inter-department faculty teaching',
              icon: <SwapHorizOutlined />,
              path: '/hod/cross-dept-requests',
            },
            {
              title: 'Attendance Analytics & Alerts',
              desc: 'Monitor student attendance and low-attendance warnings',
              icon: <FactCheckOutlined />,
              path: '/hod/attendance',
            },
            {
              title: 'Placements & Capstone Internships',
              desc: 'Post campus recruitment drives and issue official NOCs',
              icon: <WorkOutlined />,
              path: '/hod/placements',
            },
          ].map((act) => (
            <Grid item xs={12} sm={6} md={4} key={act.title}>
              <Paper
                onClick={() => navigate(act.path)}
                sx={{
                  p: 2.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  borderRadius: '12px',
                  border: `1px solid ${theme.palette.divider}`,
                  boxShadow: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    bgcolor: `${theme.palette.primary.main}06`,
                    transform: 'translateX(4px)',
                  },
                }}
              >
                <Avatar sx={{ bgcolor: `${theme.palette.primary.main}12`, color: theme.palette.primary.main }}>
                  {act.icon}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: theme.palette.ink[900] }}>
                    {act.title}
                  </Typography>
                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mt: 0.2 }}>
                    {act.desc}
                  </Typography>
                </Box>
                <ArrowForwardOutlined sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* ── 4. Split Screen: Department Status & Recent Campus Notices ──── */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Card sx={{ p: 3, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: theme.palette.ink[900], mb: 2 }}>
              Department Status Overview
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Department Name:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.ink[900] }}>
                  {deptInfo?.name || 'General'}
                </Typography>
              </Box>
              <Divider />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Active Academic Session:
                </Typography>
                <Chip
                  label={activeSession?.academicYear || '2025-2026'}
                  size="small"
                  color="primary"
                  sx={{ fontWeight: 800, fontFamily: theme.typography.mono.fontFamily }}
                />
              </Box>
              <Divider />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Shift Scope:
                </Typography>
                <Chip
                  label={user?.shift || 'GENERAL'}
                  size="small"
                  sx={{ fontWeight: 800, fontFamily: theme.typography.mono.fontFamily, bgcolor: `${theme.palette.brass?.[500] || '#b8863e'}18`, color: theme.palette.brass?.[500] || '#b8863e' }}
                />
              </Box>
              <Divider />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Department Code:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 800, fontFamily: theme.typography.mono.fontFamily }}>
                  {deptInfo?.code || 'CS'}
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
          <Card sx={{ p: 3, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <NotificationsOutlined sx={{ color: theme.palette.primary.main }} />
                <Typography variant="h6" sx={{ fontWeight: 800, color: theme.palette.ink[900] }}>
                  Recent Institutional Notices
                </Typography>
              </Box>
              <Button size="small" onClick={() => navigate('/hod/notices')} sx={{ textTransform: 'none', fontWeight: 700 }}>
                View All Notices
              </Button>
            </Box>

            {loadingNotices ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={28} />
              </Box>
            ) : !recentNotices || recentNotices.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                No active announcements at this time.
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {recentNotices.slice(0, 4).map((n) => (
                  <Paper
                    key={n._id}
                    onClick={() => navigate('/hod/notices')}
                    sx={{
                      p: 2,
                      borderRadius: '10px',
                      border: `1px solid ${theme.palette.divider}`,
                      boxShadow: 'none',
                      cursor: 'pointer',
                      '&:hover': { bgcolor: `${theme.palette.primary.main}04` },
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: theme.palette.ink[900] }}>
                        {n.title}
                      </Typography>
                      <Chip
                        label={n.priority || 'NORMAL'}
                        size="small"
                        color={n.priority === 'URGENT' ? 'error' : n.priority === 'IMPORTANT' ? 'warning' : 'default'}
                        sx={{ fontWeight: 800, fontSize: '0.6rem', height: 18 }}
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {n.content}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            )}
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default HodDashboard;
