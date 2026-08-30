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

  const isDark = theme.palette.mode === 'dark';

  const deptId = user?.departmentId?._id || user?.departmentId || user?.department?._id || user?.department;

  // Queries
  const { data: facultyData, isLoading: loadingFaculty, refetch: refetchFaculty } = useUsersQuery({
    role: 'FACULTY',
    department: deptId,
    limit: 1,
  });
  const { data: studentData, isLoading: loadingStudents, refetch: refetchStudents } = useUsersQuery({
    role: 'STUDENT',
    department: deptId,
    limit: 1,
  });
  const { data: subjectData, isLoading: loadingSubjects, refetch: refetchSubjects } = useSubjectsQuery({
    department: deptId,
  });
  const { data: depts } = useDepartmentsQuery();
  const { data: activeSession } = useActiveSessionQuery();
  const { data: recentNotices, isLoading: loadingNotices } = useRecentNoticesQuery();

  const deptInfo = depts?.find((d) => String(d._id) === String(deptId));

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
          p: { xs: 2.5, sm: 3.5 },
          borderRadius: '22px',
          border: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
          background: isDark
            ? 'linear-gradient(135deg, rgba(79, 70, 229, 0.14) 0%, rgba(184, 134, 62, 0.08) 100%)'
            : 'linear-gradient(135deg, rgba(79, 70, 229, 0.06) 0%, rgba(184, 134, 62, 0.04) 100%)',
          backdropFilter: 'blur(12px)',
          boxShadow: isDark
            ? '0 18px 40px -15px rgba(0,0,0,0.5)'
            : '0 18px 40px -15px rgba(79, 70, 229, 0.08)',
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
              borderRadius: '18px',
              border: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
              borderTop: `4px solid ${theme.palette.primary.main}`,
              bgcolor: theme.custom?.surface?.raised || theme.palette.background.paper,
              boxShadow: theme.custom?.elevation?.raised || 'none',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: isDark ? '0 12px 28px rgba(0,0,0,0.3)' : '0 12px 28px rgba(0,0,0,0.06)',
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
              borderRadius: '18px',
              border: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
              borderTop: `4px solid ${theme.palette.signal?.success || '#10b981'}`,
              bgcolor: theme.custom?.surface?.raised || theme.palette.background.paper,
              boxShadow: theme.custom?.elevation?.raised || 'none',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: isDark ? '0 12px 28px rgba(0,0,0,0.3)' : '0 12px 28px rgba(0,0,0,0.06)',
                borderColor: theme.palette.signal?.success || '#10b981',
              },
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.signal?.success || '#10b981' }}>
                ENROLLED STUDENTS
              </Typography>
              <Avatar sx={{ bgcolor: `${theme.palette.signal?.success || '#10b981'}15`, color: theme.palette.signal?.success || '#10b981', width: 40, height: 40 }}>
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
              borderRadius: '18px',
              border: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
              borderTop: `4px solid ${theme.palette.brass?.[500] || '#b8863e'}`,
              bgcolor: theme.custom?.surface?.raised || theme.palette.background.paper,
              boxShadow: theme.custom?.elevation?.raised || 'none',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: isDark ? '0 12px 28px rgba(0,0,0,0.3)' : '0 12px 28px rgba(0,0,0,0.06)',
                borderColor: theme.palette.brass?.[500] || '#b8863e',
              },
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.brass?.[500] || '#b8863e' }}>
                CURRICULUM SUBJECTS
              </Typography>
              <Avatar sx={{ bgcolor: `${theme.palette.brass?.[500] || '#b8863e'}15`, color: theme.palette.brass?.[500] || '#b8863e', width: 40, height: 40 }}>
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
              borderRadius: '18px',
              border: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
              borderTop: `4px solid ${theme.palette.signal?.info || '#3b82f6'}`,
              bgcolor: theme.custom?.surface?.raised || theme.palette.background.paper,
              boxShadow: theme.custom?.elevation?.raised || 'none',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: isDark ? '0 12px 28px rgba(0,0,0,0.3)' : '0 12px 28px rgba(0,0,0,0.06)',
                borderColor: theme.palette.signal?.info || '#3b82f6',
              },
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.signal?.info || '#3b82f6' }}>
                SCHEDULE STATUS
              </Typography>
              <Avatar sx={{ bgcolor: `${theme.palette.signal?.info || '#3b82f6'}15`, color: theme.palette.signal?.info || '#3b82f6', width: 40, height: 40 }}>
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
            <Grid item xs={12} sm={6} md={4} key={act.title} sx={{ display: 'flex' }}>
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
                  width: '100%',
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    bgcolor: `${theme.palette.primary.main}06`,
                    transform: 'translateX(4px)',
                  },
                }}
              >
                <Avatar sx={{ bgcolor: `${theme.palette.primary.main}12`, color: theme.palette.primary.main, flexShrink: 0 }}>
                  {act.icon}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: theme.palette.ink[900] }}>
                    {act.title}
                  </Typography>
                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mt: 0.2 }}>
                    {act.desc}
                  </Typography>
                </Box>
                <ArrowForwardOutlined sx={{ fontSize: 18, color: theme.palette.text.secondary, flexShrink: 0 }} />
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
          <Card sx={{
            borderRadius: '16px',
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: 'none',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}>
            {/* Fixed Header */}
            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 3,
              pb: 2,
              borderBottom: `1px solid ${theme.palette.divider}`,
              flexShrink: 0,
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <NotificationsOutlined sx={{ color: theme.palette.primary.main }} />
                <Typography variant="h6" sx={{ fontWeight: 800, color: theme.palette.ink[900] }}>
                  Recent Notices
                </Typography>
              </Box>
              {recentNotices && recentNotices.length > 0 && (
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600 }}>
                  {recentNotices.length} notice{recentNotices.length !== 1 ? 's' : ''}
                </Typography>
              )}
            </Box>

            {/* Latest notices */}
            <Box sx={{ flex: 1, p: 2 }}>
              {loadingNotices ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress size={28} />
                </Box>
              ) : !recentNotices || recentNotices.length === 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 4, gap: 1 }}>
                  <NotificationsOutlined sx={{ fontSize: 36, color: theme.palette.text.disabled }} />
                  <Typography variant="body2" color="text.secondary">
                    No active announcements at this time.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {recentNotices.map((n, idx) => (
                    <Paper
                      key={n._id || n.id || `notice-${idx}`}
                      onClick={() => navigate('/hod/notices')}
                      sx={{
                        p: 2,
                        borderRadius: '10px',
                        border: `1px solid ${theme.palette.divider}`,
                        boxShadow: 'none',
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                        '&:hover': { bgcolor: `${theme.palette.primary.main}06`, borderColor: theme.palette.primary.main },
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5, gap: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: theme.palette.ink[900], flex: 1, lineHeight: 1.3 }}>
                          {n.title}
                        </Typography>
                        <Chip
                          label={n.priority || 'NORMAL'}
                          size="small"
                          color={n.priority === 'URGENT' ? 'error' : n.priority === 'IMPORTANT' ? 'warning' : 'default'}
                          sx={{ fontWeight: 800, fontSize: '0.6rem', height: 18, flexShrink: 0 }}
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {n.content}
                      </Typography>
                    </Paper>
                  ))}
                </Box>
              )}
            </Box>

            {/* Sticky Footer CTA */}
            <Box sx={{
              p: 2,
              pt: 1.5,
              borderTop: `1px solid ${theme.palette.divider}`,
              flexShrink: 0,
            }}>
              <Button
                fullWidth
                variant="outlined"
                size="small"
                onClick={() => navigate('/hod/notices')}
                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}
              >
                View All Notices →
              </Button>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default HodDashboard;
