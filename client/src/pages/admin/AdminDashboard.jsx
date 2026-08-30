import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  Grid,
  List,
  CircularProgress,
  Skeleton,
  Tooltip,
  useTheme,
  Divider,
  Button,
  Alert,
  Avatar,
  Chip,
  Paper,
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
  AccountBalanceWalletOutlined,
  AutorenewOutlined,
  SpeedOutlined,
  HubOutlined,
  PersonAddOutlined,
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
const KpiCard = ({ label, value, subLabel, route, icon, isLoading, isError, onRetry, color }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const accentColor = color || theme.palette.primary.main;

  return (
    <Card
      onClick={() => !isError && navigate(route)}
      sx={{
        p: 3,
        border: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
        borderRadius: '18px',
        boxShadow: theme.custom?.elevation?.raised || '0 4px 14px rgba(0,0,0,0.03)',
        cursor: isError ? 'default' : 'pointer',
        bgcolor: theme.custom?.surface?.raised || theme.palette.background.paper,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '5px',
          height: '100%',
          bgcolor: accentColor,
          opacity: 0.85,
          transition: 'width 0.25s ease',
        },
        '&:hover': isError
          ? {}
          : {
              transform: 'translateY(-4px)',
              boxShadow: theme.custom?.elevation?.overlay || '0 14px 28px rgba(0,0,0,0.08)',
              borderColor: accentColor,
              '&::before': {
                width: '7px',
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
            <Skeleton variant="text" width={70} height={42} sx={{ mb: 0.5 }} />
            <Skeleton variant="text" width={100} height={18} />
          </>
        ) : isError ? (
          <Box>
            <Typography sx={{ fontSize: '0.78rem', color: theme.palette.signal?.error || '#ef4444', mb: 0.5 }}>
              {"Couldn't load"}
            </Typography>
            <Button
              size="small"
              startIcon={<RefreshOutlined sx={{ fontSize: 14 }} />}
              onClick={(e) => {
                e.stopPropagation();
                onRetry?.();
              }}
              sx={{ textTransform: 'none', fontSize: '0.72rem', p: 0, minWidth: 0 }}
            >
              Retry
            </Button>
          </Box>
        ) : (
          <>
            <Typography
              sx={{
                fontFamily: theme.typography.mono?.fontFamily || 'monospace',
                fontSize: '2.4rem',
                fontWeight: 800,
                color: theme.palette.text.primary,
                lineHeight: 1,
                mb: 0.75,
                letterSpacing: '-0.03em',
              }}
            >
              {value ?? 0}
            </Typography>
            <Typography
              sx={{
                fontFamily: theme.typography.body2.fontFamily,
                fontSize: '0.78rem',
                fontWeight: 800,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: theme.palette.text.secondary,
              }}
            >
              {label}
            </Typography>
            {subLabel && (
              <Typography
                variant="caption"
                sx={{ display: 'block', color: 'text.secondary', mt: 0.5, fontSize: '0.7rem' }}
              >
                {subLabel}
              </Typography>
            )}
          </>
        )}
      </Box>
      <Box
        className="kpi-icon-box"
        sx={{
          width: 58,
          height: 58,
          borderRadius: '14px',
          bgcolor: `${accentColor}10`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: accentColor,
          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          '& svg': { fontSize: '1.9rem' },
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
        borderRadius: '10px',
        boxShadow: theme.custom?.elevation?.overlay || theme.shadows[4],
      }}
    >
      <Typography sx={{ fontFamily: theme.typography.body2.fontFamily, fontSize: '0.8rem', color: theme.palette.text.secondary }}>
        {payload[0].payload.departmentName}
      </Typography>
      <Typography sx={{ fontFamily: theme.typography.mono?.fontFamily || 'monospace', fontSize: '0.95rem', fontWeight: 800, color: theme.palette.primary.main, mt: 0.5 }}>
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
  const isDark = theme.palette.mode === 'dark';

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

  // ── Student-to-Faculty Ratio ──
  const studentFacultyRatio = React.useMemo(() => {
    const students = stats?.totalStudents || 0;
    const faculty = stats?.totalFaculty || 0;
    if (faculty === 0) return '—';
    const ratio = Math.round(students / faculty);
    return `${ratio} : 1`;
  }, [stats]);

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
    const semLabel = activeSession.semesterType === 'ODD' ? 'Odd Semester Term' : 'Even Semester Term';
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mt: 0.75, flexWrap: 'wrap' }}>
        <Box
          sx={{
            width: 9,
            height: 9,
            borderRadius: '50%',
            bgcolor: '#10b981',
            boxShadow: '0 0 10px #10b981',
            animation: 'pulse 2s infinite',
            '@keyframes pulse': {
              '0%': { transform: 'scale(0.95)', boxShadow: '0 0 0 0 rgba(16, 185, 129, 0.7)' },
              '70%': { transform: 'scale(1)', boxShadow: '0 0 0 8px rgba(16, 185, 129, 0)' },
              '100%': { transform: 'scale(0.95)', boxShadow: '0 0 0 0 rgba(16, 185, 129, 0)' },
            },
          }}
        />
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
          Active Session: <Box component="span" sx={{ fontWeight: 800, color: 'text.primary' }}>{activeSession.academicYear}</Box> · {semLabel}
        </Typography>
      </Box>
    );
  };

  // ── KPI cards config ──
  const kpiCards = [
    {
      label: 'Total Students',
      subLabel: 'Active Enrolled Cohorts',
      value: stats?.totalStudents,
      route: '/admin/users?role=STUDENT',
      icon: <SchoolOutlined />,
      color: theme.palette.primary.main,
    },
    {
      label: 'Faculty Staff',
      subLabel: 'Instructional Professors',
      value: stats?.totalFaculty,
      route: '/admin/users?role=FACULTY',
      icon: <PersonOutline />,
      color: theme.palette.secondary.main,
    },
    {
      label: 'Departments',
      subLabel: 'Academic Disciplines',
      value: stats?.totalDepartments,
      route: '/admin/college-setup/departments',
      icon: <BusinessOutlined />,
      color: theme.palette.brass?.[500] || '#b8863e',
    },
    {
      label: 'Degree Courses',
      subLabel: 'UG & PG Degree Streams',
      value: stats?.totalCourses,
      route: '/admin/college-setup/courses',
      icon: <MenuBookOutlined />,
      color: '#10b981',
    },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5, position: 'relative' }}>
      {/* ── 1. Hero Welcome Header Card (Glassmorphic Luxury Command Bar) ── */}
      <Card
        sx={{
          p: 3.5,
          borderRadius: '22px',
          border: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
          background: isDark
            ? 'linear-gradient(135deg, rgba(79, 70, 229, 0.12) 0%, rgba(14, 165, 233, 0.06) 100%)'
            : 'linear-gradient(135deg, rgba(79, 70, 229, 0.07) 0%, rgba(14, 165, 233, 0.03) 100%)',
          backdropFilter: 'blur(12px)',
          boxShadow: theme.custom?.elevation?.raised || '0 8px 24px rgba(0,0,0,0.03)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2.5,
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
                fontFamily: theme.typography.mono?.fontFamily || 'monospace',
                fontWeight: 800,
                fontSize: '0.68rem',
                letterSpacing: '0.06em',
                borderRadius: '8px',
              }}
            />
          </Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 800,
              color: 'text.primary',
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
              mb: 0.5,
            }}
          >
            {getGreeting()}
          </Typography>
          {renderSessionSubtext()}
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          {isSuperAdmin ? (
            <Button
              variant="contained"
              startIcon={<AddOutlined />}
              onClick={() => navigate('/admin/users?register=true')}
              sx={{
                fontWeight: 800,
                px: 2.75,
                py: 1.15,
                borderRadius: '12px',
                textTransform: 'none',
                boxShadow: `0 4px 18px ${theme.palette.primary.main}40`,
              }}
            >
              Register User
            </Button>
          ) : (
            <Button
              variant="contained"
              startIcon={<PersonAddOutlined />}
              onClick={() => navigate('/admin/admissions')}
              sx={{
                fontWeight: 800,
                px: 2.75,
                py: 1.15,
                borderRadius: '12px',
                textTransform: 'none',
                boxShadow: `0 4px 18px ${theme.palette.primary.main}40`,
              }}
            >
              Student Admissions
            </Button>
          )}

          <Button
            variant="outlined"
            startIcon={<DateRangeOutlined />}
            onClick={() => navigate('/admin/academic-calendar')}
            sx={{
              fontWeight: 700,
              px: 2.25,
              py: 1.15,
              borderRadius: '12px',
              textTransform: 'none',
              borderColor: theme.palette.divider,
            }}
          >
            Academic Calendar
          </Button>

          <Button
            variant="outlined"
            startIcon={<AssessmentOutlined />}
            onClick={() => navigate('/admin/reports')}
            sx={{
              fontWeight: 700,
              px: 2.25,
              py: 1.15,
              borderRadius: '12px',
              textTransform: 'none',
              borderColor: theme.palette.divider,
            }}
          >
            Export Reports
          </Button>
        </Box>
      </Card>

      {/* ── 2. Executive Institutional Vital Signs Strip ──────────────────── */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: '14px',
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: isDark ? 'background.paper' : '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
            }}
          >
            <Avatar sx={{ bgcolor: 'rgba(79, 70, 229, 0.1)', color: 'primary.main', width: 40, height: 40, borderRadius: '10px' }}>
              <SpeedOutlined fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.68rem' }}>
                Student / Faculty Ratio
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>
                {studentFacultyRatio}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: '14px',
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: isDark ? 'background.paper' : '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
            }}
          >
            <Avatar sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', width: 40, height: 40, borderRadius: '10px' }}>
              <HubOutlined fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.68rem' }}>
                Avg Cohort per Dept
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>
                {stats?.totalDepartments ? Math.round((stats?.totalStudents || 0) / stats.totalDepartments) : 0} Students
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: '14px',
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: isDark ? 'background.paper' : '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
            }}
          >
            <Avatar sx={{ bgcolor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', width: 40, height: 40, borderRadius: '10px' }}>
              <AccountBalanceWalletOutlined fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.68rem' }}>
                Fee Clearance
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>
                Active Management
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: '14px',
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: isDark ? 'background.paper' : '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
            }}
          >
            <Avatar sx={{ bgcolor: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4', width: 40, height: 40, borderRadius: '10px' }}>
              <ShieldOutlined fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.68rem' }}>
                Audit Stream
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>
                Active &amp; Immutable
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* ── 3. Insights Strip ─────────────────────────────────────────────── */}
      <Card
        sx={{
          p: 2.5,
          border: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
          bgcolor: theme.custom?.surface?.raised || theme.palette.background.paper,
          borderRadius: '18px',
        }}
      >
        {loadingInsights ? (
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <Skeleton variant="circular" width={10} height={10} />
            <Skeleton variant="text" width={260} height={20} />
          </Box>
        ) : errorInsights ? (
          <Alert severity="warning" sx={{ borderRadius: '10px' }}>
            {"Couldn't load institutional insights."}
          </Alert>
        ) : !insights || insights.length === 0 ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <CheckCircleOutlineOutlined sx={{ color: '#10b981', fontSize: 24 }} />
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontWeight: 600 }}>
              {"All institutional systems operational — zero critical policy or configuration items pending."}
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
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
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
                      borderRadius: '10px',
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
                        sx={{ color: 'text.primary', fontWeight: 600 }}
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
                        borderRadius: '8px',
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

      {/* ── 4. KPI Cards Grid ─────────────────────────────────────────────── */}
      <Grid container spacing={3}>
        {kpiCards.map((kpi) => (
          <Grid item xs={12} sm={6} md={3} key={kpi.label}>
            <KpiCard
              label={kpi.label}
              subLabel={kpi.subLabel}
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

      {/* ── 5. Analytics Chart + Expanded 6-Tile Quick Navigation Matrix ─── */}
      <Grid container spacing={3}>
        {/* Left: Department Student Distribution */}
        <Grid item xs={12} lg={7}>
          <Card
            sx={{
              p: 3,
              border: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
              borderRadius: '20px',
              boxShadow: theme.custom?.elevation?.raised || 'none',
              height: '420px',
              display: 'flex',
              flexDirection: 'column',
              bgcolor: theme.custom?.surface?.raised || theme.palette.background.paper,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
              <Box>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}
                >
                  Student Enrollment by Department
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Live cohort distribution across academic departments
                </Typography>
              </Box>
              <Button
                size="small"
                onClick={() => navigate('/admin/college-setup/departments')}
                endIcon={<ArrowForwardOutlined sx={{ fontSize: 14 }} />}
                sx={{ textTransform: 'none', fontWeight: 800, color: theme.palette.primary.main }}
              >
                Manage Setup
              </Button>
            </Box>

            <Box sx={{ flexGrow: 1, minHeight: 0 }}>
              {loadingDistribution ? (
                <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                  <CircularProgress size={30} sx={{ color: theme.palette.primary.main }} />
                </Box>
              ) : errorDistribution ? (
                <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography sx={{ color: theme.palette.signal?.error || '#ef4444', fontSize: '0.85rem' }}>
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
                  <SchoolOutlined sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5 }} />
                  <Typography
                    sx={{
                      color: 'text.secondary',
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
                    sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}
                  >
                    Register First Student
                  </Button>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={distribution}
                    layout="vertical"
                    margin={{ left: 10, right: 25, top: 10, bottom: 10 }}
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
                        fontWeight: 600,
                      }}
                      width={140}
                    />
                    <ChartTooltip
                      cursor={{ fill: `${theme.palette.primary.main}0D` }}
                      content={<CustomChartTooltip />}
                    />
                    <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={22}>
                      {distribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={theme.palette.primary.main}
                          fillOpacity={Math.max(0.45, 1 - index * 0.12)}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Card>
        </Grid>

        {/* Right: Expanded 6-Tile Quick Navigation Matrix */}
        <Grid item xs={12} lg={5}>
          <Card
            sx={{
              p: 3,
              border: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
              borderRadius: '20px',
              boxShadow: theme.custom?.elevation?.raised || 'none',
              height: '420px',
              display: 'flex',
              flexDirection: 'column',
              bgcolor: theme.custom?.surface?.raised || theme.palette.background.paper,
            }}
          >
            <Typography
              variant="h6"
              sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5 }}
            >
              Institutional Operations Hub
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 2 }}>
              High-priority management workflows and administrative desks
            </Typography>

            <Grid container spacing={1.5} sx={{ flexGrow: 1, overflowY: 'auto' }}>
              {[
                {
                  label: 'User Roster',
                  desc: 'Students, Faculty & HODs',
                  route: '/admin/users',
                  icon: <PersonOutline sx={{ fontSize: 22 }} />,
                  accent: theme.palette.primary.main,
                },
                {
                  label: 'Curriculum',
                  desc: 'Depts, Branches & Subjects',
                  route: '/admin/college-setup/departments',
                  icon: <MenuBookOutlined sx={{ fontSize: 22 }} />,
                  accent: theme.palette.secondary.main,
                },
                {
                  label: 'Fee Clearance',
                  desc: 'Dues & Official Receipts',
                  route: '/admin/fee-clearance',
                  icon: <AccountBalanceWalletOutlined sx={{ fontSize: 22 }} />,
                  accent: '#10b981',
                },
                {
                  label: 'Bulk Promotions',
                  desc: 'Batch term advancements',
                  route: '/admin/bulk-promotion',
                  icon: <AutorenewOutlined sx={{ fontSize: 22 }} />,
                  accent: '#f59e0b',
                },
                {
                  label: 'Audit Trail',
                  desc: 'Security & Role Logs',
                  route: '/admin/audit-logs',
                  icon: <HistoryOutlined sx={{ fontSize: 22 }} />,
                  accent: '#06b6d4',
                },
                {
                  label: 'Notice Board',
                  desc: 'Dispatch broadcasts',
                  route: '/admin/notices',
                  icon: <CampaignOutlined sx={{ fontSize: 22 }} />,
                  accent: '#ec4899',
                },
              ].map((action) => (
                <Grid item xs={12} sm={6} key={action.label}>
                  <Paper
                    elevation={0}
                    onClick={() => navigate(action.route)}
                    sx={{
                      p: 1.75,
                      borderRadius: '14px',
                      border: `1px solid ${theme.palette.divider}`,
                      bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#fafafa',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        bgcolor: `${action.accent}10`,
                        borderColor: action.accent,
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 38,
                        height: 38,
                        borderRadius: '10px',
                        bgcolor: `${action.accent}15`,
                        color: action.accent,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {action.icon}
                    </Box>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2, fontSize: '0.85rem' }}>
                        {action.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {action.desc}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Card>
        </Grid>
      </Grid>

      {/* ── 6. Activity Timeline / Recent Announcements ────────────────────── */}
      <Card
        sx={{
          p: 3,
          border: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
          borderRadius: '20px',
          boxShadow: theme.custom?.elevation?.raised || 'none',
          bgcolor: theme.custom?.surface?.raised || theme.palette.background.paper,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              sx={{
                width: 40,
                height: 40,
                borderRadius: '12px',
                bgcolor: `${theme.palette.primary.main}15`,
                color: theme.palette.primary.main,
              }}
            >
              {isSuperAdmin ? <HistoryOutlined sx={{ fontSize: 22 }} /> : <CampaignOutlined sx={{ fontSize: 22 }} />}
            </Avatar>
            <Box>
              <Typography
                variant="h6"
                sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}
              >
                {isSuperAdmin ? 'Institutional Activity & Security Audit Timeline' : 'Recent Announcements'}
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: '0.78rem' }}>
                {isSuperAdmin ? 'Real-time audit log stream across system accounts, roles, and institutional parameters' : 'Latest notices dispatched across departments'}
              </Typography>
            </Box>
          </Box>

          {isSuperAdmin && (
            <Button
              size="small"
              onClick={() => navigate('/admin/audit-logs')}
              endIcon={<ArrowForwardOutlined sx={{ fontSize: 14 }} />}
              sx={{ textTransform: 'none', fontWeight: 800, color: theme.palette.primary.main }}
            >
              View Full Audit Register
            </Button>
          )}
        </Box>

        <Divider sx={{ mb: 2.5 }} />

        {isSuperAdmin ? (
          loadingAudits ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[...Array(4)].map((_, i) => (
                <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Skeleton variant="text" width="65%" height={22} />
                  <Skeleton variant="text" width="10%" height={22} />
                </Box>
              ))}
            </Box>
          ) : errorAudits ? (
            <Typography sx={{ color: theme.palette.signal?.error || '#ef4444', fontSize: '0.85rem', textAlign: 'center', py: 3 }}>
              {"Couldn't load recent activity stream."}
            </Typography>
          ) : !auditLogs?.logs || auditLogs.logs.length === 0 ? (
            <Typography sx={{ color: theme.palette.text.secondary, fontSize: '0.85rem', py: 3, textAlign: 'center' }}>
              No activity recorded yet — administrative operations will automatically stream here.
            </Typography>
          ) : (
            <List sx={{ p: 0, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {auditLogs.logs.map((log, idx) => (
                <Box
                  key={log._id || idx}
                  sx={{
                    p: 1.75,
                    borderRadius: '12px',
                    bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#fafafa',
                    border: `1px solid ${theme.palette.divider}`,
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(79, 70, 229, 0.04)',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 34,
                          height: 34,
                          borderRadius: '10px',
                          bgcolor: `${theme.palette.primary.main}12`,
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
                            fontSize: '0.9rem',
                            color: 'text.primary',
                            fontWeight: 700,
                          }}
                        >
                          {humanizeAuditAction(log)}
                        </Typography>
                        <Typography
                          sx={{
                            fontFamily: theme.typography.mono?.fontFamily || 'monospace',
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
                          fontFamily: theme.typography.mono?.fontFamily || 'monospace',
                          fontSize: '0.75rem',
                          color: theme.palette.text.secondary,
                          whiteSpace: 'nowrap',
                          fontWeight: 600,
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
            <Typography sx={{ color: theme.palette.signal?.error || '#ef4444', fontSize: '0.85rem', textAlign: 'center', py: 3 }}>
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
                    borderRadius: '12px',
                    bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#fafafa',
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
                    <Box>
                      <Typography
                        sx={{
                          fontSize: '0.92rem',
                          color: 'text.primary',
                          fontWeight: 700,
                        }}
                      >
                        {notice.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
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
                          fontFamily: theme.typography.mono?.fontFamily || 'monospace',
                          fontSize: '0.72rem',
                          color: theme.palette.text.secondary,
                          whiteSpace: 'nowrap',
                          fontWeight: 600,
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
