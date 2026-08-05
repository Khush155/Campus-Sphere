import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  Divider,
  CircularProgress,
  Chip,
  Button,
  useTheme,
  Avatar,
} from '@mui/material';
import {
  BarChartOutlined,
  TrendingUpOutlined,
  PercentOutlined,
  RefreshOutlined,
  WarningAmberOutlined,
  CheckCircleOutlined,
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  BarChart as RechartsBarChart,
  Bar,
  Cell,
  PieChart as RechartsPieChart,
  Pie,
} from 'recharts';

// Import backend analytics query hook
import { useFacultyAnalyticsQuery } from '../../../queries/facultyQueries';

export const AnalyticsPage = () => {
  const theme = useTheme();

  // Query analytics from backend
  const { data: metrics, isLoading, error, refetch } = useFacultyAnalyticsQuery();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={36} />
      </Box>
    );
  }

  if (error || !metrics) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="error" sx={{ fontWeight: 700 }}>
          Failed to load analytics metrics. Please refresh or check your faculty profile session.
        </Typography>
      </Box>
    );
  }

  const monthlyTrendData = Array.isArray(metrics.monthlyTrend) ? metrics.monthlyTrend : [];
  const distributionData = Array.isArray(metrics.distribution) ? metrics.distribution : [];
  const performanceData = Array.isArray(metrics.performance) ? metrics.performance : [];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      {/* ── 1. Hero Identity Banner ────────────────────────────────────────── */}
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <Chip
                icon={<BarChartOutlined sx={{ fontSize: '0.9rem !important', color: `${theme.palette.primary.main} !important` }} />}
                label="FACULTY ATTENDANCE & ACADEMIC ANALYTICS DESK"
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
            </Box>
            <Typography variant="h4" sx={{ fontFamily: theme.typography.h1.fontFamily, fontWeight: 800, color: theme.palette.ink[900] }}>
              Faculty Teaching & Student Analytics
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
              Visualized lecture attendance metrics, student performance trends, subject-wise pass rates, and grade distributions.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshOutlined />}
              onClick={() => refetch()}
              sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
            >
              Refresh Analytics
            </Button>
          </Box>
        </Box>
      </Card>

      {/* ── 2. KPI Summary Grid ────────────────────────────────────────────── */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em' }}>
                  AVERAGE ATTENDANCE
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.ink[900], mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
                  {metrics.averageAttendance}%
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: `${theme.palette.primary.main}15`, color: theme.palette.primary.main }}>
                <PercentOutlined />
              </Avatar>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.signal.success }}>
                  HIGHEST ATTENDANCE
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.signal.success, mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
                  {metrics.highestAttendance}%
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: `${theme.palette.signal.success}15`, color: theme.palette.signal.success }}>
                <TrendingUpOutlined />
              </Avatar>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.info.main }}>
                  AVERAGE GPA SCORE
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.info.main, mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
                  {metrics.averageGradeGpa} / 10
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: `${theme.palette.info.main}15`, color: theme.palette.info.main }}>
                <CheckCircleOutlined />
              </Avatar>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.signal.error }}>
                  ABSENCE RISK ALERTS
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.signal.error, mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
                  {metrics.absenceAlerts}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: `${theme.palette.signal.error}15`, color: theme.palette.signal.error }}>
                <WarningAmberOutlined />
              </Avatar>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* ── 3. Charts Grid ─────────────────────────────────────────────────── */}
      <Grid container spacing={2.5}>
        {/* Line Chart: Monthly Trend */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ p: 3, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: theme.palette.ink[900], mb: 2 }}>
              Monthly Semester Trend (Attendance vs Average Grade %)
            </Typography>
            <Box sx={{ width: '100%', height: 320 }}>
              <ResponsiveContainer>
                <LineChart data={monthlyTrendData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis dataKey="month" stroke={theme.palette.text.secondary} style={{ fontSize: '0.75rem' }} />
                  <YAxis stroke={theme.palette.text.secondary} style={{ fontSize: '0.75rem' }} domain={[50, 100]} />
                  <ChartTooltip
                    contentStyle={{
                      backgroundColor: theme.palette.background.paper,
                      borderColor: theme.palette.divider,
                      borderRadius: '8px',
                    }}
                  />
                  <Legend verticalAlign="top" height={36} />
                  <Line
                    type="monotone"
                    dataKey="attendance"
                    name="Attendance %"
                    stroke={theme.palette.primary.main}
                    strokeWidth={3}
                    activeDot={{ r: 8 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="averageGrade"
                    name="Average Grade %"
                    stroke={theme.palette.signal.success}
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </Grid>

        {/* Pie Chart: Attendance Distribution */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ p: 3, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: theme.palette.ink[900], mb: 1 }}>
              Attendance Distribution (%)
            </Typography>
            <Box sx={{ width: '100%', height: 240, display: 'flex', justifyContent: 'center' }}>
              <ResponsiveContainer>
                <RechartsPieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || theme.palette.primary.main} />
                    ))}
                  </Pie>
                  <ChartTooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </Box>
            <Divider sx={{ my: 1.5 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {distributionData.map((entry, idx) => (
                <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: entry.color || theme.palette.primary.main }} />
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>
                      {entry.name}
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ fontWeight: 800, fontFamily: theme.typography.mono.fontFamily }}>
                    {entry.value}%
                  </Typography>
                </Box>
              ))}
            </Box>
          </Card>
        </Grid>

        {/* Bar Chart: Subject-wise Performance */}
        <Grid item xs={12}>
          <Card sx={{ p: 3, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: theme.palette.ink[900], mb: 2 }}>
              Subject-wise Average Attendance &amp; Exam Passing Rate (%)
            </Typography>
            <Box sx={{ width: '100%', height: 320 }}>
              <ResponsiveContainer>
                <RechartsBarChart data={performanceData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis dataKey="name" stroke={theme.palette.text.secondary} style={{ fontSize: '0.75rem' }} />
                  <YAxis stroke={theme.palette.text.secondary} style={{ fontSize: '0.75rem' }} domain={[50, 100]} />
                  <ChartTooltip
                    contentStyle={{
                      backgroundColor: theme.palette.background.paper,
                      borderColor: theme.palette.divider,
                      borderRadius: '8px',
                    }}
                  />
                  <Legend verticalAlign="top" height={36} />
                  <Bar dataKey="attendance" name="Attendance %" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="passingRate" name="Exam Pass Rate %" fill={theme.palette.signal.success} radius={[4, 4, 0, 0]} />
                </RechartsBarChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalyticsPage;
