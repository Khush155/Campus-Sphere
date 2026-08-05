import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  Grid,
  List,
  ListItemButton,
  ListItemText,
  CircularProgress,
  Skeleton,
  Tooltip,
  useTheme,
  Divider,
  Button,
  Alert,
  Avatar,
  Chip,
} from '@mui/material';
import {
  PersonOutline,
  SchoolOutlined,
  BusinessOutlined,
  MenuBookOutlined,
  HistoryOutlined,
  AddOutlined,
  CampaignOutlined,
  RefreshOutlined,
  CheckCircleOutlineOutlined,
  WarningAmberOutlined,
  InfoOutlined,
  ArrowForwardOutlined,
  ShieldOutlined,
  DateRangeOutlined,
  AssessmentOutlined,
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  Cell,
} from 'recharts';
import {
  useDashboardStatsQuery,
  useDepartmentDistributionQuery,
  useDashboardInsightsQuery,
  useRecentNoticesQuery,
} from '../../queries/dashboardQueries';
import { useAuditLogsQuery } from '../../queries/auditLogQueries';
import { useAuth } from '../../contexts/AuthContext';
import { useActiveSessionQuery } from '../../queries/academicSessionQueries';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getRelativeTime = (timestamp) => {
  if (!timestamp) return '—';
  const ms = new Date() - new Date(timestamp);
  const secs = Math.floor(ms / 1000);
  const mins = Math.floor(secs / 60);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (secs < 60) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

/**
 * Maps audit action enums to human-readable sentences for the Recent Activity list.
 */
const humanizeAuditAction = (log) => {
  const actor = log.actorId?.name || 'Someone';
  const before = log.before || {};
  const after = log.after || {};

  switch (log.action) {
    case 'ROLE_CHANGE':
      return `${actor} changed a role from ${before.role || '—'} to ${after.role || '—'}`;
    case 'STATUS_CHANGE':
      return `${actor} changed account status to ${after.status || '—'}`;
    case 'USER_DEACTIVATED':
      return `${actor} deactivated a user account`;
    case 'SHIFT_CHANGE':
      return `${actor} changed an HOD shift from ${before.shift || '—'} to ${after.shift || '—'}`;
    case 'STUDENT_ACADEMIC_CHANGE':
      return `${actor} updated a student's academic placement`;
    case 'NOTICE_UPDATED':
      return `${actor} updated a notice`;
    case 'NOTICE_ARCHIVED':
      return `${actor} archived a notice`;
    case 'COLLEGE_PROFILE_UPDATED':
      return `${actor} updated the college profile`;
    case 'ACADEMIC_SESSION_ACTIVATED':
      return `${actor} activated academic session ${after.academicYear || ''}`;
    case 'SESSIONS_FORCE_REVOKED':
      return `${actor} force-revoked ${after.sessionsRevoked ?? 'all'} session(s)`;
    case 'HOD_ASSIGNED':
      return `${actor} assigned an HOD`;
    default:
      return `${actor} — ${log.action
        .toLowerCase()
        .replace(/_/g, ' ')
        .replace(/^\w/, (c) => c.toUpperCase())}`;
  }
};

/** Action icon chooser for audit log items */
const getAuditIcon = (action, theme) => {
  switch (action) {
    case 'ROLE_CHANGE':
    case 'USER_DEACTIVATED':
    case 'HOD_ASSIGNED':
      return <PersonOutline sx={{ fontSize: 16, color: theme.palette.primary.main }} />;
    case 'ACADEMIC_SESSION_ACTIVATED':
    case 'SHIFT_CHANGE':
      return <DateRangeOutlined sx={{ fontSize: 16, color: theme.palette.brass?.[500] || '#b8863e' }} />;
    case 'NOTICE_UPDATED':
    case 'NOTICE_ARCHIVED':
      return <CampaignOutlined sx={{ fontSize: 16, color: theme.palette.secondary.main }} />;
    default:
      return <ShieldOutlined sx={{ fontSize: 16, color: theme.palette.text.secondary }} />;
  }
};

// ─── Sub-components ────────────────────────────────────────────────────────────

/** Premium KPI Card with smooth hover effects, icon container, and zero-safety */
const KpiCard = ({ label, value, route, icon, isLoading, isError, onRetry, color }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const accentColor = color || theme.palette.primary.main;

  return (
    <Card
      onClick={() => !isError && navigate(route)}
      sx={{
        p: 3,
        border: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
        borderRadius: '16px',
        boxShadow: theme.custom?.elevation?.raised || '0 4px 12px rgba(0,0,0,0.04)',
        cursor: isError ? 'default' : 'pointer',
        bgcolor: theme.custom?.surface?.raised || theme.palette.background.paper,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '4px',
          height: '100%',
          bgcolor: accentColor,
          opacity: 0.8,
          transition: 'width 0.2s ease',
        },
        '&:hover': isError ? {} : {
          transform: 'translateY(-4px)',
          boxShadow: theme.custom?.elevation?.overlay || '0 12px 24px rgba(0,0,0,0.08)',
          borderColor: accentColor,
          '&::before': {
            width: '6px',
            opacity: 1,
          },
          '& .kpi-icon-box': {
            transform: 'scale(1.08) rotate(-4deg)',
            bgcolor: `${accentColor}18`,
          },
        },
      }}
    >
      <Box sx={{ zIndex: 1 }}>
        {isLoading ? (
          <>
            <Skeleton variant="text" width={60} height={40} sx={{ mb: 0.5 }} />
            <Skeleton variant="text" width={80} height={16} />
          </>
        ) : isError ? (
          <Box>
            <Typography sx={{ fontSize: '0.78rem', color: theme.palette.signal.error, mb: 0.5 }}>
              {"Couldn't load"}
            </Typography>
            <Button
              size="small"
              startIcon={<RefreshOutlined sx={{ fontSize: 14 }} />}
              onClick={(e) => { e.stopPropagation(); onRetry?.(); }}
              sx={{ textTransform: 'none', fontSize: '0.72rem', p: 0, minWidth: 0 }}
            >
              Retry
            </Button>
          </Box>
        ) : (
          <>
            <Typography
              sx={{
                fontFamily: theme.typography.mono.fontFamily,
                fontSize: '2.25rem',
                fontWeight: 700,
                color: theme.palette.ink[900],
                lineHeight: 1,
                mb: 0.75,
                letterSpacing: '-0.02em',
              }}
            >
              {value ?? 0}
            </Typography>
            <Typography
              sx={{
                fontFamily: theme.typography.body2.fontFamily,
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: theme.palette.text.secondary,
              }}
            >
              {label}
            </Typography>
          </>
        )}
      </Box>
      <Box
        className="kpi-icon-box"
        sx={{
          width: 56,
          height: 56,
          borderRadius: '12px',
          bgcolor: `${accentColor}10`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: accentColor,
          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          '& svg': { fontSize: '1.85rem' },
        }}
      >
        {icon}
      </Box>
    </Card>
  );
};

/** Premium chart tooltip matching app surface styles */
const CustomChartTooltip = ({ active, payload }) => {
  const theme = useTheme();
  if (!active || !payload?.length) return null;
  return (
    <Box
      sx={{
        p: 1.5,
        bgcolor: theme.custom?.surface?.overlay || theme.palette.background.paper,
        border: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
        borderRadius: '8px',
        boxShadow: theme.custom?.elevation?.overlay || theme.shadows[4],
      }}
    >
      <Typography sx={{ fontFamily: theme.typography.body2.fontFamily, fontSize: '0.78rem', color: theme.palette.text.secondary }}>
        {payload[0].payload.departmentName}
      </Typography>
      <Typography sx={{ fontFamily: theme.typography.mono.fontFamily, fontSize: '0.88rem', fontWeight: 700, color: theme.palette.primary.main, mt: 0.5 }}>
        {payload[0].value} Student{payload[0].value !== 1 ? 's' : ''}
      </Typography>
    </Box>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────

export const AdminDashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();

  // ── Queries ──
  const {
    data: stats,
    isLoading: loadingStats,
    isError: errorStats,
    refetch: refetchStats,
  } = useDashboardStatsQuery();

  const {
    data: distribution,
    isLoading: loadingDistribution,
    isError: errorDistribution,
  } = useDepartmentDistributionQuery();

  const {
    data: insights,
    isLoading: loadingInsights,
    isError: errorInsights,
  } = useDashboardInsightsQuery();

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const {
    data: auditLogs,
    isLoading: loadingAudits,
    isError: errorAudits,
  } = useAuditLogsQuery({ limit: 8 }, { enabled: isSuperAdmin });

  const {
    data: recentNotices,
    isLoading: loadingNotices,
    isError: errorNotices,
  } = useRecentNoticesQuery({ enabled: !isSuperAdmin });

  const { data: activeSession, isLoading: loadingSession } = useActiveSessionQuery();

  // ── Greeting ──
  const getGreeting = () => {
    const hrs = new Date().getHours();
    const firstName = user?.name?.split(' ')[0] || 'Administrator';
    if (hrs < 12) return `Good morning, ${firstName}`;
    if (hrs < 17) return `Good afternoon, ${firstName}`;
    return `Good evening, ${firstName}`;
  };

  // ── Active session subtext ──
  const renderSessionSubtext = () => {
    if (loadingSession) {
      return <Skeleton variant="text" width={240} height={18} />;
    }
    if (!activeSession) {
      return (
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
          No active academic session —{' '}
          <Link
            to="/admin/academic-calendar"
            style={{ color: theme.palette.primary.main, textDecoration: 'none', fontWeight: 600 }}
          >
            set up session
          </Link>
        </Typography>
      );
    }
    const semLabel = activeSession.semesterType === 'ODD' ? 'Odd Semester' : 'Even Semester';
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            bgcolor: theme.palette.signal.success,
            boxShadow: `0 0 8px ${theme.palette.signal.success}`,
          }}
        />
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
          Active Session: <Box component="span" sx={{ fontWeight: 700, color: theme.palette.ink[900] }}>{activeSession.academicYear}</Box> · {semLabel}
        </Typography>
      </Box>
    );
  };

  // ── KPI cards config ──
  const kpiCards = [
    {
      label: 'Total Students',
      value: stats?.totalStudents,
      route: '/admin/users?role=STUDENT',
      icon: <SchoolOutlined />,
      color: theme.palette.primary.main,
    },
    {
      label: 'Faculty Staff',
      value: stats?.totalFaculty,
      route: '/admin/users?role=FACULTY',
      icon: <PersonOutline />,
      color: theme.palette.secondary.main,
    },
    {
      label: 'Departments',
      value: stats?.totalDepartments,
      route: '/admin/college-setup/departments',
      icon: <BusinessOutlined />,
      color: theme.palette.brass?.[500] || '#b8863e',
    },
    {
      label: 'Degree Courses',
      value: stats?.totalCourses,
      route: '/admin/college-setup/courses',
      icon: <MenuBookOutlined />,
      color: theme.palette.signal.success,
    },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5, position: 'relative' }}>
      {/* ── 1. Hero Welcome Header Card ───────────────────────────────────── */}
      <Card
        sx={{
          p: 3.5,
          borderRadius: '16px',
          border: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
          background: `linear-gradient(135deg, ${theme.palette.primary.main}0D 0%, ${theme.palette.secondary.main}08 100%)`,
          boxShadow: theme.custom?.elevation?.raised || 'none',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <Chip
              icon={<ShieldOutlined sx={{ fontSize: '0.9rem !important', color: `${theme.palette.primary.main} !important` }} />}
              label={isSuperAdmin ? 'SUPER ADMIN COMMAND CENTER' : 'COLLEGE ADMIN PORTAL'}
              size="small"
              sx={{
                bgcolor: `${theme.palette.primary.main}15`,
                color: theme.palette.primary.main,
                fontFamily: theme.typography.mono.fontFamily,
                fontWeight: 700,
                fontSize: '0.68rem',
                letterSpacing: '0.06em',
                borderRadius: '6px',
              }}
            />
          </Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontFamily: theme.typography.h1.fontFamily,
              fontWeight: 600,
              color: theme.palette.ink[900],
              lineHeight: 1.15,
              mb: 0.5,
            }}
          >
            {getGreeting()}
          </Typography>
          {renderSessionSubtext()}
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <Button
            variant="contained"
            startIcon={<AddOutlined />}
            onClick={() => navigate('/admin/users?register=true')}
            sx={{
              bgcolor: theme.palette.primary.main,
              color: '#ffffff',
              fontWeight: 700,
              px: 2.5,
              py: 1,
              borderRadius: '8px',
              textTransform: 'none',
              boxShadow: `0 4px 14px ${theme.palette.primary.main}35`,
              '&:hover': {
                bgcolor: theme.palette.primary.dark,
              },
            }}
          >
            Register User
          </Button>

          <Button
            variant="outlined"
            startIcon={<AssessmentOutlined />}
            onClick={() => navigate('/admin/reports')}
            sx={{
              borderColor: theme.custom?.border?.subtle || theme.palette.divider,
              color: theme.palette.text.primary,
              fontWeight: 600,
              px: 2.5,
              py: 1,
              borderRadius: '8px',
              textTransform: 'none',
              bgcolor: theme.palette.background.paper,
              '&:hover': {
                borderColor: theme.palette.primary.main,
                bgcolor: theme.custom?.interaction?.hoverTint,
              },
            }}
          >
            Reports Export
          </Button>
        </Box>
      </Card>

      {/* ── 2. Insights Strip ─────────────────────────────────────────────── */}
      <Card
        sx={{
          p: 2.5,
          border: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
          bgcolor: theme.custom?.surface?.raised || theme.palette.background.paper,
          borderRadius: '16px',
        }}
      >
        {loadingInsights ? (
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <Skeleton variant="circular" width={8} height={8} />
            <Skeleton variant="text" width={240} height={18} />
          </Box>
        ) : errorInsights ? (
          <Alert severity="warning" sx={{ borderRadius: '8px' }}>
            {"Couldn't load institutional insights."}
          </Alert>
        ) : !insights || insights.length === 0 ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <CheckCircleOutlineOutlined sx={{ color: theme.palette.signal.success, fontSize: 22 }} />
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
              {"Everything's set up — all systems operational with no pending items."}
            </Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: insights.some((i) => i.severity === 'warning')
                    ? theme.palette.brass?.[500] || '#b8863e'
                    : theme.palette.primary.main,
                }}
              />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: theme.palette.ink[900] }}>
                Institutional Operational Insights ({insights.length})
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
              {insights.map((insight) => {
                const isWarning = insight.severity === 'warning';
                const accentColor = isWarning
                  ? theme.palette.brass?.[500] || '#b8863e'
                  : theme.palette.primary.main;
                const InsightIcon = isWarning ? WarningAmberOutlined : InfoOutlined;
                return (
                  <Box
                    key={insight.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 2,
                      p: 1.5,
                      borderRadius: '8px',
                      bgcolor: isWarning
                        ? 'rgba(184, 134, 62, 0.06)'
                        : `${theme.palette.primary.main}08`,
                      borderLeft: `3px solid ${accentColor}`,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flex: 1 }}>
                      <InsightIcon sx={{ fontSize: 18, color: accentColor, flexShrink: 0 }} />
                      <Typography
                        variant="body2"
                        sx={{ color: theme.palette.ink[900], fontWeight: 500 }}
                      >
                        {insight.message}
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => navigate(insight.actionRoute)}
                      endIcon={<ArrowForwardOutlined sx={{ fontSize: 14 }} />}
                      sx={{
                        borderColor: accentColor,
                        color: accentColor,
                        fontWeight: 700,
                        textTransform: 'none',
                        flexShrink: 0,
                        borderRadius: '6px',
                        '&:hover': {
                          bgcolor: `${accentColor}12`,
                          borderColor: accentColor,
                        },
                      }}
                    >
                      {insight.actionText || 'Review'}
                    </Button>
                  </Box>
                );
              })}
            </Box>
          </>
        )}
      </Card>

      {/* ── 3. KPI Cards Grid ─────────────────────────────────────────────── */}
      <Grid container spacing={3}>
        {kpiCards.map((kpi) => (
          <Grid item xs={12} sm={6} md={3} key={kpi.label}>
            <KpiCard
              label={kpi.label}
              value={kpi.value}
              route={kpi.route}
              icon={kpi.icon}
              isLoading={loadingStats}
              isError={errorStats}
              onRetry={refetchStats}
              color={kpi.color}
            />
          </Grid>
        ))}
      </Grid>

      {/* ── 4. Analytics Chart + Quick Actions ────────────────────────────── */}
      <Grid container spacing={3}>
        {/* Left: Department Student Distribution */}
        <Grid item xs={12} md={8}>
          <Card
            sx={{
              p: 3,
              border: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
              borderRadius: '16px',
              boxShadow: theme.custom?.elevation?.raised || 'none',
              height: '360px',
              display: 'flex',
              flexDirection: 'column',
              bgcolor: theme.custom?.surface?.raised || theme.palette.background.paper,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
              <Typography
                variant="h6"
                sx={{ fontFamily: theme.typography.body2.fontFamily, fontWeight: 700, color: theme.palette.ink[900] }}
              >
                Students Distribution by Department
              </Typography>
              <Button
                size="small"
                onClick={() => navigate('/admin/college-setup/departments')}
                endIcon={<ArrowForwardOutlined sx={{ fontSize: 14 }} />}
                sx={{ textTransform: 'none', fontWeight: 600, color: theme.palette.primary.main }}
              >
                Manage Setup
              </Button>
            </Box>

            <Box sx={{ flexGrow: 1, minHeight: 0 }}>
              {loadingDistribution ? (
                <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                  <CircularProgress size={28} sx={{ color: theme.palette.primary.main }} />
                </Box>
              ) : errorDistribution ? (
                <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography sx={{ color: theme.palette.signal.error, fontSize: '0.85rem' }}>
                    {"Couldn't load distribution data."}
                  </Typography>
                </Box>
              ) : !distribution || distribution.length === 0 ? (
                <Box
                  sx={{
                    display: 'flex',
                    height: '100%',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1.5,
                  }}
                >
                  <SchoolOutlined sx={{ fontSize: 42, color: theme.palette.text.secondary, opacity: 0.5 }} />
                  <Typography
                    sx={{
                      color: theme.palette.text.secondary,
                      fontSize: '0.85rem',
                      textAlign: 'center',
                      maxWidth: 340,
                    }}
                  >
                    No department student distribution data available yet.
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => navigate('/admin/users?register=true')}
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                  >
                    Register First Student
                  </Button>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={distribution}
                    layout="vertical"
                    margin={{ left: 10, right: 20, top: 0, bottom: 0 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="departmentName"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: theme.palette.text.secondary,
                        fontSize: 12,
                        fontFamily: theme.typography.body2.fontFamily,
                        fontWeight: 500,
                      }}
                      width={130}
                    />
                    <ChartTooltip
                      cursor={{ fill: `${theme.palette.primary.main}0D` }}
                      content={<CustomChartTooltip />}
                    />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={18}>
                      {distribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={theme.palette.primary.main}
                          fillOpacity={Math.max(0.4, 1 - index * 0.15)}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Card>
        </Grid>

        {/* Right: Quick Action Cards */}
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              p: 3,
              border: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
              borderRadius: '16px',
              boxShadow: theme.custom?.elevation?.raised || 'none',
              height: '360px',
              display: 'flex',
              flexDirection: 'column',
              bgcolor: theme.custom?.surface?.raised || theme.palette.background.paper,
            }}
          >
            <Typography
              variant="h6"
              sx={{ fontFamily: theme.typography.body2.fontFamily, fontWeight: 700, color: theme.palette.ink[900], mb: 2.5 }}
            >
              Quick Management Actions
            </Typography>

            <List sx={{ p: 0, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {[
                {
                  label: 'Register User',
                  desc: 'Create Student, Faculty, or HOD',
                  route: '/admin/users?register=true',
                  icon: <PersonOutline sx={{ fontSize: 20 }} />,
                  accent: theme.palette.primary.main,
                },
                {
                  label: 'Manage Curriculum',
                  desc: 'Add Courses, Branches, & Subjects',
                  route: '/admin/college-setup/subjects',
                  icon: <MenuBookOutlined sx={{ fontSize: 20 }} />,
                  accent: theme.palette.secondary.main,
                },
                {
                  label: 'Publish Announcement',
                  desc: 'Dispatch notice to campus audience',
                  route: '/admin/notices',
                  icon: <CampaignOutlined sx={{ fontSize: 20 }} />,
                  accent: theme.palette.brass?.[500] || '#b8863e',
                },
              ].map((action) => (
                <ListItemButton
                  key={action.label}
                  onClick={() => navigate(action.route)}
                  sx={{
                    p: 1.75,
                    borderRadius: '12px',
                    border: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
                    bgcolor: theme.palette.background.paper,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: `${action.accent}0A`,
                      borderColor: action.accent,
                      transform: 'translateX(4px)',
                      '& .action-arrow': {
                        transform: 'translateX(3px)',
                        color: action.accent,
                      },
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '10px',
                      bgcolor: `${action.accent}12`,
                      color: action.accent,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 1.75,
                      flexShrink: 0,
                    }}
                  >
                    {action.icon}
                  </Box>
                  <ListItemText
                    primary={action.label}
                    secondary={action.desc}
                    primaryTypographyProps={{
                      fontFamily: theme.typography.body1.fontFamily,
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      color: theme.palette.ink[900],
                    }}
                    secondaryTypographyProps={{
                      fontFamily: theme.typography.body2.fontFamily,
                      fontSize: '0.72rem',
                      color: theme.palette.text.secondary,
                      mt: 0.25,
                    }}
                  />
                  <ArrowForwardOutlined className="action-arrow" sx={{ fontSize: 16, color: theme.palette.text.secondary, transition: 'all 0.2s ease' }} />
                </ListItemButton>
              ))}
            </List>
          </Card>
        </Grid>
      </Grid>

      {/* ── 5. Activity Timeline / Recent Announcements ────────────────────── */}
      <Card
        sx={{
          p: 3,
          border: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
          borderRadius: '16px',
          boxShadow: theme.custom?.elevation?.raised || 'none',
          bgcolor: theme.custom?.surface?.raised || theme.palette.background.paper,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: `${theme.palette.primary.main}15`,
                color: theme.palette.primary.main,
              }}
            >
              {isSuperAdmin ? <HistoryOutlined sx={{ fontSize: 20 }} /> : <CampaignOutlined sx={{ fontSize: 20 }} />}
            </Avatar>
            <Box>
              <Typography
                variant="h6"
                sx={{ fontFamily: theme.typography.body2.fontFamily, fontWeight: 700, color: theme.palette.ink[900] }}
              >
                {isSuperAdmin ? 'Institutional Activity Timeline' : 'Recent Announcements'}
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: '0.75rem' }}>
                {isSuperAdmin ? 'Real-time audit log stream across system accounts and configuration' : 'Latest notices dispatched across departments'}
              </Typography>
            </Box>
          </Box>

          {isSuperAdmin && (
            <Button
              size="small"
              onClick={() => navigate('/admin/audit-logs')}
              endIcon={<ArrowForwardOutlined sx={{ fontSize: 14 }} />}
              sx={{ textTransform: 'none', fontWeight: 600, color: theme.palette.primary.main }}
            >
              View All Logs
            </Button>
          )}
        </Box>

        <Divider sx={{ mb: 2.5 }} />

        {isSuperAdmin ? (
          loadingAudits ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[...Array(4)].map((_, i) => (
                <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Skeleton variant="text" width="65%" height={20} />
                  <Skeleton variant="text" width="10%" height={20} />
                </Box>
              ))}
            </Box>
          ) : errorAudits ? (
            <Typography sx={{ color: theme.palette.signal.error, fontSize: '0.85rem', textAlign: 'center', py: 3 }}>
              {"Couldn't load recent activity stream."}
            </Typography>
          ) : !auditLogs?.logs || auditLogs.logs.length === 0 ? (
            <Typography sx={{ color: theme.palette.text.secondary, fontSize: '0.85rem', py: 3, textAlign: 'center' }}>
              No activity recorded yet — actions performed in the system will automatically log here.
            </Typography>
          ) : (
            <List sx={{ p: 0, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {auditLogs.logs.map((log, idx) => (
                <Box
                  key={log._id || idx}
                  sx={{
                    p: 1.75,
                    borderRadius: '10px',
                    bgcolor: theme.palette.background.paper,
                    border: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      bgcolor: theme.custom?.interaction?.hoverTint || 'rgba(0,0,0,0.02)',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '8px',
                          bgcolor: `${theme.palette.primary.main}10`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {getAuditIcon(log.action, theme)}
                      </Box>
                      <Box>
                        <Typography
                          sx={{
                            fontFamily: theme.typography.body1.fontFamily,
                            fontSize: '0.88rem',
                            color: theme.palette.text.primary,
                            fontWeight: 600,
                          }}
                        >
                          {humanizeAuditAction(log)}
                        </Typography>
                        <Typography
                          sx={{
                            fontFamily: theme.typography.mono.fontFamily,
                            fontSize: '0.68rem',
                            color: theme.palette.text.secondary,
                            textTransform: 'uppercase',
                            mt: 0.25,
                          }}
                        >
                          {log.action}
                        </Typography>
                      </Box>
                    </Box>

                    <Tooltip title={new Date(log.timestamp).toLocaleString()} arrow>
                      <Typography
                        sx={{
                          fontFamily: theme.typography.mono.fontFamily,
                          fontSize: '0.72rem',
                          color: theme.palette.text.secondary,
                          whiteSpace: 'nowrap',
                          fontWeight: 500,
                        }}
                      >
                        {getRelativeTime(log.timestamp)}
                      </Typography>
                    </Tooltip>
                  </Box>
                </Box>
              ))}
            </List>
          )
        ) : (
          /* College Admin Notices list */
          loadingNotices ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} variant="text" width="100%" height={24} />
              ))}
            </Box>
          ) : errorNotices ? (
            <Typography sx={{ color: theme.palette.signal.error, fontSize: '0.85rem', textAlign: 'center', py: 3 }}>
              {"Couldn't load recent announcements."}
            </Typography>
          ) : !recentNotices || recentNotices.length === 0 ? (
            <Typography sx={{ color: theme.palette.text.secondary, fontSize: '0.85rem', py: 3, textAlign: 'center' }}>
              No notices published yet — announcements dispatched to the institution will appear here.
            </Typography>
          ) : (
            <List sx={{ p: 0, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {recentNotices.map((notice, idx) => (
                <Box
                  key={notice.id || idx}
                  sx={{
                    p: 2,
                    borderRadius: '10px',
                    bgcolor: theme.palette.background.paper,
                    border: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
                    <Box>
                      <Typography
                        sx={{
                          fontFamily: theme.typography.body1.fontFamily,
                          fontSize: '0.9rem',
                          color: theme.palette.text.primary,
                          fontWeight: 600,
                        }}
                      >
                        {notice.title}
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: theme.typography.body2.fontFamily,
                          fontSize: '0.8rem',
                          color: theme.palette.text.secondary,
                          mt: 0.5,
                        }}
                      >
                        {notice.content}
                      </Typography>
                    </Box>
                    <Tooltip title={new Date(notice.publishedAt).toLocaleString()} arrow>
                      <Typography
                        sx={{
                          fontFamily: theme.typography.mono.fontFamily,
                          fontSize: '0.72rem',
                          color: theme.palette.text.secondary,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {getRelativeTime(notice.publishedAt)}
                      </Typography>
                    </Tooltip>
                  </Box>
                </Box>
              ))}
            </List>
          )
        )}
      </Card>
    </Box>
  );
};

export default AdminDashboard;
