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
 * Centralised here — does not duplicate the AuditLogViewer's mapping.
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
      // Humanize raw enum key as fallback: "SOME_ACTION" → "Some action"
      return `${actor} — ${log.action
        .toLowerCase()
        .replace(/_/g, ' ')
        .replace(/^\w/, (c) => c.toUpperCase())}`;
  }
};

// ─── Sub-components ────────────────────────────────────────────────────────────

/** KPI card with skeleton loading, error inline retry, and 0-value safety */
const KpiCard = ({ label, value, route, icon, isLoading, isError, onRetry }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Card
      onClick={() => !isError && navigate(route)}
      sx={{
        p: 3,
        border: `1px solid ${theme.custom.border.subtle}`,
        borderRadius: '16px',
        boxShadow: 'none',
        cursor: isError ? 'default' : 'pointer',
        bgcolor: theme.custom.surface.raised,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        '&:hover': isError ? {} : {
          transform: 'translateY(-2px)',
          boxShadow: '0 12px 30px rgba(14,26,43,0.08)',
          borderColor: theme.palette.primary.main,
        },
      }}
    >
      <Box>
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
                fontSize: '2.2rem',
                fontWeight: 700,
                color: theme.palette.ink[900],
                lineHeight: 1,
                mb: 0.5,
              }}
            >
              {/* value is always a number — 0 is valid and displays correctly */}
              {value ?? 0}
            </Typography>
            <Typography
              sx={{
                fontFamily: theme.typography.body2.fontFamily,
                fontSize: '0.72rem',
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
      <Box sx={{ color: theme.palette.primary.main, opacity: 0.15, '& svg': { fontSize: '2.5rem' } }}>
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
        bgcolor: theme.custom.surface.overlay,
        border: `1px solid ${theme.custom.border.subtle}`,
        borderRadius: '8px',
        boxShadow: theme.custom.elevation.overlay,
      }}
    >
      <Typography sx={{ fontFamily: theme.typography.body2.fontFamily, fontSize: '0.78rem', color: theme.palette.text.secondary }}>
        {payload[0].payload.departmentName}
      </Typography>
      <Typography sx={{ fontFamily: theme.typography.mono.fontFamily, fontSize: '0.82rem', fontWeight: 700, color: theme.palette.primary.main, mt: 0.5 }}>
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

  // ── Isolated queries — one failing doesn't blank the whole page ──
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
      return <Skeleton variant="text" width={280} height={18} />;
    }
    if (!activeSession) {
      return (
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
          No active academic session —{' '}
          <Link
            to="/admin/academic-calendar"
            style={{ color: theme.palette.primary.main, textDecoration: 'none', fontWeight: 600 }}
          >
            set one up in Academic Calendar
          </Link>
        </Typography>
      );
    }
    const semLabel = activeSession.semesterType === 'ODD' ? 'Odd' : 'Even';
    return (
      <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
        {activeSession.academicYear} · {semLabel} Semester
      </Typography>
    );
  };

  // ── KPI cards config ──
  const kpiCards = [
    {
      label: 'Students',
      value: stats?.totalStudents,
      route: '/admin/users?role=STUDENT',
      icon: <SchoolOutlined />,
    },
    {
      label: 'Faculty',
      value: stats?.totalFaculty,
      route: '/admin/users?role=FACULTY',
      icon: <PersonOutline />,
    },
    {
      label: 'Departments',
      value: stats?.totalDepartments,
      route: '/admin/college-setup/departments',
      icon: <BusinessOutlined />,
    },
    {
      label: 'Courses',
      value: stats?.totalCourses,
      route: '/admin/college-setup/courses',
      icon: <MenuBookOutlined />,
    },
  ];

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        position: 'relative',
        minHeight: '80vh',
        '&::before': {
          content: '""',
          position: 'fixed',
          bottom: 0,
          right: 0,
          width: '320px',
          height: '320px',
          opacity: 0.04,
          pointerEvents: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='none' stroke='%23b8863e' stroke-width='0.5'%3E%3Cpath d='M10,90 L90,90 M20,90 L20,30 L80,30 L80,90 M30,30 L30,10 L70,10 L70,30 M50,10 L50,90 M20,50 L80,50 M20,70 L80,70'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'bottom right',
          zIndex: 0,
        },
      }}
    >
      {/* ── 1. Header ─────────────────────────────────────────────────────── */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          borderBottom: `1px solid ${theme.custom.border.subtle}`,
          pb: 2.5,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontFamily: theme.typography.h1.fontFamily,
              fontWeight: 600,
              color: theme.palette.ink[900],
              lineHeight: 1.1,
              mb: 0.5,
            }}
          >
            {getGreeting()}
          </Typography>
          {renderSessionSubtext()}
        </Box>
        <Typography
          sx={{
            fontFamily: theme.typography.mono.fontFamily,
            fontSize: '0.72rem',
            fontWeight: 600,
            letterSpacing: '0.08em',
            color: theme.palette.text.secondary,
            textTransform: 'uppercase',
          }}
        >
          SUPER_ADMIN PORTAL
        </Typography>
      </Box>

      {/* ── 2. Insights Strip ─────────────────────────────────────────────── */}
      <Card
        sx={{
          p: 3,
          border: `1px solid ${theme.custom.border.subtle}`,
          bgcolor: theme.custom.surface.raised,
          borderRadius: '16px',
        }}
      >
        {loadingInsights ? (
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <Skeleton variant="circular" width={8} height={8} />
            <Skeleton variant="text" width={220} height={18} />
          </Box>
        ) : errorInsights ? (
          <Alert severity="warning" sx={{ borderRadius: '8px' }}>
            {"Couldn't load insights — check your connection and refresh."}
          </Alert>
        ) : !insights || insights.length === 0 ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <CheckCircleOutlineOutlined sx={{ color: theme.palette.signal.success, fontSize: 20 }} />
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              {"Everything's set up — no outstanding items."}
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
                Institutional Alerts ({insights.length})
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
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
                        ? 'rgba(184, 134, 62, 0.05)'
                        : 'rgba(99, 102, 241, 0.04)',
                      borderLeft: `3px solid ${accentColor}`,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flex: 1 }}>
                      <InsightIcon sx={{ fontSize: 16, color: accentColor, flexShrink: 0 }} />
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
                      sx={{
                        borderColor: accentColor,
                        color: accentColor,
                        fontWeight: 700,
                        textTransform: 'none',
                        flexShrink: 0,
                        '&:hover': {
                          bgcolor: theme.custom.interaction.hoverTint,
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

      {/* ── 3. KPI Cards ──────────────────────────────────────────────────── */}
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
            />
          </Grid>
        ))}
      </Grid>

      {/* ── 4. Chart + Quick Actions ──────────────────────────────────────── */}
      <Grid container spacing={4}>
        {/* Left: Department Distribution Chart */}
        <Grid item xs={12} md={8}>
          <Card
            sx={{
              p: 3,
              border: `1px solid ${theme.custom.border.subtle}`,
              borderRadius: '16px',
              boxShadow: 'none',
              height: '350px',
              display: 'flex',
              flexDirection: 'column',
              bgcolor: theme.custom.surface.raised,
            }}
          >
            <Typography
              variant="h6"
              sx={{ fontFamily: theme.typography.body2.fontFamily, fontWeight: 700, color: theme.palette.ink[900], mb: 3 }}
            >
              Students by Department
            </Typography>
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
                /* Empty state — specific message, no broken chart frame */
                <Box
                  sx={{
                    display: 'flex',
                    height: '100%',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1,
                  }}
                >
                  <SchoolOutlined sx={{ fontSize: 36, color: theme.palette.text.disabled }} />
                  <Typography
                    sx={{
                      color: theme.palette.text.secondary,
                      fontSize: '0.85rem',
                      textAlign: 'center',
                      maxWidth: 320,
                    }}
                  >
                    No student data yet — once students are enrolled, this chart will show their
                    distribution across departments.
                  </Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={distribution}
                    layout="vertical"
                    margin={{ left: 20, right: 20, top: 0, bottom: 0 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="departmentName"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: theme.palette.text.secondary,
                        fontSize: 11,
                        fontFamily: theme.typography.body2.fontFamily,
                      }}
                      width={120}
                    />
                    <ChartTooltip
                      cursor={{ fill: theme.custom.interaction.hoverTint }}
                      content={<CustomChartTooltip />}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={16}>
                      {distribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={theme.palette.primary.main}
                          fillOpacity={Math.max(0.3, 1 - index * 0.15)}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Card>
        </Grid>

        {/* Right: Quick Actions */}
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              p: 3,
              border: `1px solid ${theme.custom.border.subtle}`,
              borderRadius: '16px',
              boxShadow: 'none',
              height: '350px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              bgcolor: theme.custom.surface.raised,
            }}
          >
            <Typography
              variant="h6"
              sx={{ fontFamily: theme.typography.body2.fontFamily, fontWeight: 700, color: theme.palette.ink[900], mb: 3 }}
            >
              Quick Actions
            </Typography>
            <List sx={{ p: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[
                {
                  label: 'Register a User',
                  route: '/admin/users?register=true',
                  icon: <PersonOutline sx={{ fontSize: 18 }} />,
                },
                {
                  label: 'Add a Subject',
                  route: '/admin/college-setup/subjects?add=true',
                  icon: <MenuBookOutlined sx={{ fontSize: 18 }} />,
                },
                {
                  label: 'Dispatch a Notice',
                  route: '/admin/notices?create=true',
                  icon: <CampaignOutlined sx={{ fontSize: 18 }} />,
                },
              ].map((action) => (
                <ListItemButton
                  key={action.label}
                  onClick={() => navigate(action.route)}
                  sx={{
                    p: 1.5,
                    borderRadius: '8px',
                    border: `1px solid ${theme.custom.border.subtle}`,
                    '&:hover': {
                      bgcolor: theme.custom.interaction.hoverTint,
                      borderColor: theme.palette.primary.main,
                    },
                  }}
                >
                  <Box sx={{ mr: 1.5, color: theme.palette.primary.main }}>{action.icon}</Box>
                  <ListItemText
                    primary={action.label}
                    primaryTypographyProps={{
                      fontFamily: theme.typography.body2.fontFamily,
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: theme.palette.ink[900],
                    }}
                  />
                  <AddOutlined sx={{ fontSize: 14, color: theme.palette.text.secondary }} />
                </ListItemButton>
              ))}
            </List>
          </Card>
        </Grid>
      </Grid>

      {/* ── 5. Recent Activity / Notices ────────────────────────────────────────────── */}
      <Card
        sx={{
          p: 3,
          border: `1px solid ${theme.custom.border.subtle}`,
          borderRadius: '16px',
          boxShadow: 'none',
          bgcolor: theme.custom.surface.raised,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          {isSuperAdmin ? (
            <HistoryOutlined sx={{ color: theme.palette.primary.main }} />
          ) : (
            <CampaignOutlined sx={{ color: theme.palette.primary.main }} />
          )}
          <Typography
            variant="h6"
            sx={{ fontFamily: theme.typography.body2.fontFamily, fontWeight: 700, color: theme.palette.ink[900] }}
          >
            {isSuperAdmin ? 'Recent Activity' : 'Recent Announcements'}
          </Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />

        {isSuperAdmin ? (
          loadingAudits ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[...Array(4)].map((_, i) => (
                <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Skeleton variant="text" width="65%" height={18} />
                  <Skeleton variant="text" width="10%" height={18} />
                </Box>
              ))}
            </Box>
          ) : errorAudits ? (
            <Typography sx={{ color: theme.palette.signal.error, fontSize: '0.85rem', textAlign: 'center', py: 3 }}>
              {"Couldn't load recent activity."}
            </Typography>
          ) : !auditLogs?.logs || auditLogs.logs.length === 0 ? (
            <Typography sx={{ color: theme.palette.text.secondary, fontSize: '0.85rem', py: 3, textAlign: 'center' }}>
              No activity yet — actions like user updates, session activations, and notice dispatches will appear here.
            </Typography>
          ) : (
            <List sx={{ p: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {auditLogs.logs.map((log, idx) => (
                <Box key={log._id || idx}>
                  {idx > 0 && <Divider sx={{ my: 2, opacity: 0.4 }} />}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
                    <Box>
                      <Typography
                        sx={{
                          fontFamily: theme.typography.body1.fontFamily,
                          fontSize: '0.88rem',
                          color: theme.palette.text.primary,
                          fontWeight: 500,
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
                          mt: 0.5,
                        }}
                      >
                        {log.action}
                      </Typography>
                    </Box>
                    <Tooltip title={new Date(log.timestamp).toLocaleString()} arrow>
                      <Typography
                        sx={{
                          fontFamily: theme.typography.mono.fontFamily,
                          fontSize: '0.72rem',
                          color: theme.palette.text.secondary,
                          whiteSpace: 'nowrap',
                          cursor: 'default',
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
          // College Admin layout showing recent notices
          loadingNotices ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[...Array(4)].map((_, i) => (
                <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Skeleton variant="text" width="55%" height={18} />
                  <Skeleton variant="text" width="15%" height={18} />
                </Box>
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
            <List sx={{ p: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {recentNotices.map((notice, idx) => (
                <Box key={notice.id || idx}>
                  {idx > 0 && <Divider sx={{ my: 2, opacity: 0.4 }} />}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
                    <Box>
                      <Typography
                        sx={{
                          fontFamily: theme.typography.body1.fontFamily,
                          fontSize: '0.88rem',
                          color: theme.palette.text.primary,
                          fontWeight: 600,
                        }}
                      >
                        {notice.title}
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: theme.typography.body2.fontFamily,
                          fontSize: '0.78rem',
                          color: theme.palette.text.secondary,
                          mt: 0.5,
                          maxWidth: '600px',
                          display: '-webkit-box',
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {notice.content}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                        <Typography
                          sx={{
                            fontFamily: theme.typography.mono.fontFamily,
                            fontSize: '0.64rem',
                            color: theme.palette.text.secondary,
                            textTransform: 'uppercase',
                          }}
                        >
                          BY {notice.publishedByName}
                        </Typography>
                        <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'text.secondary' }} />
                        <Typography
                          sx={{
                            fontFamily: theme.typography.mono.fontFamily,
                            fontSize: '0.64rem',
                            color:
                              notice.priority === 'URGENT'
                                ? theme.palette.signal.error
                                : notice.priority === 'IMPORTANT'
                                ? theme.palette.brass?.[500] || '#b8863e'
                                : theme.palette.text.secondary,
                            fontWeight: notice.priority !== 'NORMAL' ? 700 : 500,
                          }}
                        >
                          {notice.priority} PRIORITY
                        </Typography>
                      </Box>
                    </Box>
                    <Tooltip title={new Date(notice.publishedAt).toLocaleString()} arrow>
                      <Typography
                        sx={{
                          fontFamily: theme.typography.mono.fontFamily,
                          fontSize: '0.72rem',
                          color: theme.palette.text.secondary,
                          whiteSpace: 'nowrap',
                          cursor: 'default',
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
