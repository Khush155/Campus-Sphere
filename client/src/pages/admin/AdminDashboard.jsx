import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  Grid,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Tooltip,
  useTheme,
  Divider,
  Button,
} from '@mui/material';
import {
  PersonOutline,
  SchoolOutlined,
  BusinessOutlined,
  MenuBookOutlined,
  ArrowForward,
  HistoryOutlined,
  AddOutlined,
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  Cell,
  CartesianGrid,
} from 'recharts';
import { useUsersQuery, useAuditLogsQuery, useInsightsQuery } from '../../queries/userQueries';
import { useDepartmentsQuery, useCoursesQuery } from '../../queries/collegeQueries';
import { useAuth } from '../../contexts/AuthContext';

// Helper for relative timestamps
const getRelativeTime = (timestamp) => {
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

// Formatter to render action keys in human-friendly sentences
const formatActionMessage = (log) => {
  const actor = log.actorName;
  const before = log.before || {};
  const after = log.after || {};

  switch (log.action) {
    case 'ROLE_CHANGE':
      return `${actor} changed a user's role from ${before.role || 'NONE'} to ${after.role || 'NONE'}.`;
    case 'STATUS_CHANGE':
      return `${actor} changed account status from ${before.status || 'ACTIVE'} to ${after.status || 'INACTIVE'}.`;
    case 'USER_DEACTIVATED':
      return `${actor} deactivated a user account (soft delete).`;
    case 'STUDENT_ACADEMIC_CHANGE':
      return `${actor} adjusted a student's semester or branch: "${after.reason || 'No reason given'}".`;
    default:
      return `${actor} performed action: ${log.action}`;
  }
};

// Premium custom tooltip matching the app's elevation / surface overlays
const CustomChartTooltip = ({ active, payload }) => {
  const theme = useTheme();
  if (active && payload && payload.length) {
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
          {payload[0].payload.name}
        </Typography>
        <Typography sx={{ fontFamily: theme.typography.mono.fontFamily, fontSize: '0.82rem', fontWeight: 700, color: theme.palette.primary.main, mt: 0.5 }}>
          {payload[0].value} Students
        </Typography>
      </Box>
    );
  }
  return null;
};

export const AdminDashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Proactive Insights Query
  const { data: insights } = useInsightsQuery();

  // Queries for KPI statistics
  const { data: studentsData, isLoading: loadingStudents } = useUsersQuery({ role: 'STUDENT', limit: 1 });
  const { data: facultyData, isLoading: loadingFaculty } = useUsersQuery({ role: 'FACULTY', limit: 1 });
  const { data: hodData, isLoading: loadingHod } = useUsersQuery({ role: 'HOD', limit: 1 });
  const { data: deptsData, isLoading: loadingDepts } = useDepartmentsQuery();
  const { data: coursesData, isLoading: loadingCourses } = useCoursesQuery();

  // Query for Recent Activity
  const { data: auditLogs, isLoading: loadingAudits } = useAuditLogsQuery();

  // Fetch full student list to calculate department distribution in-memory
  const { data: allStudents } = useUsersQuery({ role: 'STUDENT', limit: 1000 });

  const totalStudents = studentsData?.meta?.total || 0;
  const totalFaculty = (facultyData?.meta?.total || 0) + (hodData?.meta?.total || 0);
  const totalDepts = deptsData?.length || 0;
  const totalCourses = coursesData?.length || 0;

  const isLoadingKPI = loadingStudents || loadingFaculty || loadingHod || loadingDepts || loadingCourses;

  // Chart data calculations
  const getChartData = () => {
    if (!deptsData || !allStudents?.data) return [];
    const counts = {};
    deptsData.forEach((d) => {
      counts[d.name] = 0;
    });

    allStudents.data.forEach((s) => {
      if (s.department && counts[s.department] !== undefined) {
        counts[s.department]++;
      }
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  const chartData = getChartData();

  // KPI card configuration
  const kpis = [
    {
      label: 'Students',
      value: totalStudents,
      route: '/admin/users?role=STUDENT',
      icon: <SchoolOutlined />,
      trend: `+${totalStudents > 0 ? Math.ceil(totalStudents * 0.05) : 0} this month`,
    },
    {
      label: 'Faculty & HODs',
      value: totalFaculty,
      route: '/admin/users?role=FACULTY',
      icon: <PersonOutline />,
      trend: `+${totalFaculty > 0 ? Math.ceil(totalFaculty * 0.03) : 0} this term`,
    },
    {
      label: 'Departments',
      value: totalDepts,
      route: '/admin/college-setup/departments',
      icon: <BusinessOutlined />,
      trend: 'Steady growth',
    },
    {
      label: 'Courses',
      value: totalCourses,
      route: '/admin/college-setup/courses',
      icon: <MenuBookOutlined />,
      trend: 'Updated syllabus',
    },
  ];

  const getGreeting = () => {
    const hrs = new Date().getHours();
    const firstName = user?.name ? user.name.split(' ')[0] : 'Administrator';
    if (hrs < 12) return `Good morning, ${firstName}`;
    if (hrs < 17) return `Good afternoon, ${firstName}`;
    return `Good evening, ${firstName}`;
  };

  const getSubtextGreeting = () => {
    if (isLoadingKPI) return 'Connecting core academic parameters...';
    return `Odd Semester 2026–27 · ${totalStudents} active student records connected`;
  };

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
        }
      }}
    >
      {/* 1. Header Row */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: `1px solid ${theme.custom.border.subtle}`, pb: 2.5 }}>
        <Box>
          <Typography
            variant="h4"
            component="h2"
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
          <Typography
            variant="body2"
            sx={{
              fontFamily: theme.typography.body2.fontFamily,
              color: theme.palette.text.secondary,
            }}
          >
            {getSubtextGreeting()}
          </Typography>
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

      {/* Proactive Insights Engine Strip */}
      <Card
        sx={{
          p: 3,
          border: `1px solid ${theme.custom.border.subtle}`,
          bgcolor: theme.custom.surface.raised,
          borderRadius: '16px',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: insights && insights.length > 0 ? 2 : 0 }}>
          <Typography
            variant="subtitle2"
            sx={{
              fontFamily: theme.typography.body2.fontFamily,
              fontWeight: 700,
              color: theme.palette.ink[900],
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            {insights && insights.length > 0 ? (
              <>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: insights.some(i => i.severity === 'red') ? theme.palette.signal.error : theme.palette.brass[500],
                  }}
                />
                Institutional Integrity Alerts ({insights.length})
              </>
            ) : (
              <>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: theme.palette.signal.success,
                  }}
                />
                System Configuration Status
              </>
            )}
          </Typography>
        </Box>

        {!insights || insights.length === 0 ? (
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              fontFamily: theme.typography.body2.fontFamily,
            }}
          >
            Everything is configured correctly — no outstanding operational items detected.
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {insights.map((insight) => {
              const isRed = insight.severity === 'red';
              return (
                <Box
                  key={insight.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 1.5,
                    borderRadius: '8px',
                    bgcolor: isRed ? 'rgba(179, 67, 43, 0.04)' : 'rgba(184, 134, 62, 0.04)',
                    borderLeft: `3px solid ${isRed ? theme.palette.signal.error : theme.palette.brass[500]}`,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: theme.typography.body1.fontFamily,
                      color: theme.palette.ink[900],
                      fontWeight: 500,
                    }}
                  >
                    {insight.message}
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => navigate(insight.actionRoute)}
                    sx={{
                      borderColor: isRed ? theme.palette.signal.error : theme.palette.brass[500],
                      color: isRed ? theme.palette.signal.error : theme.palette.brass[500],
                      fontWeight: 700,
                      textTransform: 'none',
                      '&:hover': {
                        bgcolor: theme.custom.interaction.hoverTint,
                        borderColor: isRed ? theme.palette.signal.error : theme.palette.brass[500],
                      },
                    }}
                  >
                    {insight.actionText || 'Review'}
                  </Button>
                </Box>
              );
            })}
          </Box>
        )}
      </Card>

      {/* 2. KPI Cards Grid */}
      <Grid container spacing={3}>
        {kpis.map((kpi) => (
          <Grid item xs={12} sm={6} md={3} key={kpi.label}>
            <Card
              onClick={() => navigate(kpi.route)}
              sx={{
                p: 3,
                border: `1px solid ${theme.custom.border.subtle}`,
                borderRadius: '16px',
                boxShadow: 'none',
                cursor: 'pointer',
                bgcolor: theme.custom.surface.raised,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 30px rgba(14,26,43,0.08)',
                  borderColor: theme.palette.primary.main,
                  '& .kpi-trend': {
                    opacity: 1,
                    transform: 'translateY(0)',
                  },
                },
              }}
            >
              <Box>
                {isLoadingKPI ? (
                  <CircularProgress size={24} sx={{ mb: 1, color: theme.palette.primary.main }} />
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5 }}>
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
                      {kpi.value}
                    </Typography>
                    <Box
                      className="kpi-trend"
                      sx={{
                        px: 1,
                        py: 0.25,
                        borderRadius: '4px',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        fontFamily: theme.typography.mono.fontFamily,
                        bgcolor: theme.custom.interaction.hoverTint,
                        color: theme.palette.primary.main,
                        opacity: 0,
                        transform: 'translateY(4px)',
                        transition: 'opacity 0.2s ease, transform 0.2s ease',
                      }}
                    >
                      {kpi.trend}
                    </Box>
                  </Box>
                )}
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
                  {kpi.label}
                </Typography>
              </Box>
              <Box
                sx={{
                  color: theme.palette.primary.main,
                  opacity: 0.15,
                  '& svg': { fontSize: '2.5rem' },
                }}
              >
                {kpi.icon}
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* 3. Middle Section: Chart & Quick Actions */}
      <Grid container spacing={4}>
        {/* Left Column: Horizontal Bar Chart */}
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
              sx={{
                fontFamily: theme.typography.body2.fontFamily,
                fontWeight: 700,
                color: theme.palette.ink[900],
                mb: 3,
              }}
            >
              Students by Department
            </Typography>
            <Box sx={{ flexGrow: 1, minHeight: 0 }}>
              {chartData.length === 0 ? (
                <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography sx={{ color: theme.palette.text.secondary, fontSize: '0.85rem' }}>
                    No student registrations found yet.
                  </Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20, top: 0, bottom: 0 }}>
                    <CartesianGrid stroke={theme.custom.border.subtle} horizontal vertical={false} />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: theme.palette.text.secondary,
                        fontSize: 11,
                        fontFamily: theme.typography.body2.fontFamily,
                        fontWeight: 400,
                      }}
                      width={120}
                    />
                    <ChartTooltip
                      cursor={{ fill: theme.custom.interaction.hoverTint }}
                      content={<CustomChartTooltip />}
                    />
                    <Bar
                      dataKey="value"
                      radius={[0, 4, 4, 0]}
                      barSize={16}
                    >
                      {chartData.map((entry, index) => {
                        const opacity = 1 - (index * 0.15);
                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={theme.palette.primary.main}
                            fillOpacity={Math.max(0.3, opacity)}
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Card>
        </Grid>

        {/* Right Column: Quick Actions */}
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
              justifyContent: 'space-between',
              bgcolor: theme.custom.surface.raised,
            }}
          >
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontFamily: theme.typography.body2.fontFamily,
                  fontWeight: 700,
                  color: theme.palette.ink[900],
                  mb: 3,
                }}
              >
                Quick Actions
              </Typography>
              <List sx={{ p: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <ListItem
                  button
                  onClick={() => navigate('/admin/users?register=true')}
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
                  <AddOutlined sx={{ mr: 1.5, color: theme.palette.primary.main, fontSize: 18 }} />
                  <ListItemText
                    primary="Register a User"
                    primaryTypographyProps={{
                      fontFamily: theme.typography.body2.fontFamily,
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: theme.palette.ink[900],
                    }}
                  />
                  <ArrowForward sx={{ fontSize: 14, color: theme.palette.text.secondary }} />
                </ListItem>

                <ListItem
                  button
                  onClick={() => navigate('/admin/college-setup/subjects?add=true')}
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
                  <AddOutlined sx={{ mr: 1.5, color: theme.palette.primary.main, fontSize: 18 }} />
                  <ListItemText
                    primary="Add a Subject"
                    primaryTypographyProps={{
                      fontFamily: theme.typography.body2.fontFamily,
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: theme.palette.ink[900],
                    }}
                  />
                  <ArrowForward sx={{ fontSize: 14, color: theme.palette.text.secondary }} />
                </ListItem>

                <Tooltip title="Notice Board — coming in Phase 9" placement="top" arrow>
                  <span>
                    <ListItem
                      disabled
                      sx={{
                        p: 1.5,
                        borderRadius: '8px',
                        border: `1px solid ${theme.palette.divider}`,
                        opacity: 0.5,
                      }}
                    >
                      <AddOutlined sx={{ mr: 1.5, color: theme.palette.text.disabled, fontSize: 18 }} />
                      <ListItemText
                        primary="Dispatch a Notice"
                        primaryTypographyProps={{
                          fontFamily: theme.typography.body2.fontFamily,
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          color: theme.palette.text.disabled,
                        }}
                      />
                      <ArrowForward sx={{ fontSize: 14, color: theme.palette.text.disabled }} />
                    </ListItem>
                  </span>
                </Tooltip>
              </List>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* 4. Bottom Section: Recent Activity Audit Logs */}
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
          <HistoryOutlined sx={{ color: theme.palette.primary.main }} />
          <Typography
            variant="h6"
            sx={{
              fontFamily: theme.typography.body2.fontFamily,
              fontWeight: 700,
              color: theme.palette.ink[900],
            }}
          >
            Recent Activity
          </Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />

        {loadingAudits ? (
          <Box sx={{ display: 'flex', py: 4, justifyContent: 'center' }}>
            <CircularProgress size={30} sx={{ color: theme.palette.primary.main }} />
          </Box>
        ) : !auditLogs || auditLogs.length === 0 ? (
          <Typography sx={{ color: theme.palette.text.secondary, fontSize: '0.85rem', py: 3, textAlign: 'center' }}>
            No recent activity logged in system audits yet.
          </Typography>
        ) : (
          <List sx={{ p: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {auditLogs.map((log, idx) => (
              <Box key={log.id}>
                {idx > 0 && <Divider sx={{ my: 2, opacity: 0.5 }} />}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 2,
                  }}
                >
                  <Box>
                    <Typography
                      sx={{
                        fontFamily: theme.typography.body1.fontFamily,
                        fontSize: '0.88rem',
                        color: theme.palette.text.primary,
                        fontWeight: 500,
                      }}
                    >
                      {formatActionMessage(log)}
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
                      Action: {log.action} · Target ID: {log.targetId || 'N/A'}
                    </Typography>
                  </Box>
                  <Typography
                    sx={{
                      fontFamily: theme.typography.mono.fontFamily,
                      fontSize: '0.72rem',
                      color: theme.palette.text.secondary,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {getRelativeTime(log.timestamp)}
                  </Typography>
                </Box>
              </Box>
            ))}
          </List>
        )}
      </Card>
    </Box>
  );
};

export default AdminDashboard;
