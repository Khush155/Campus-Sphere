// client/src/pages/faculty/analytics/AnalyticsPage.jsx
//
// Page component rendering the Attendance & Marks Analytics.
// Visualized via Recharts Line, Bar, and Pie components.

import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  IconButton,
  Divider,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  TrendingUp as TrendIcon,
  PieChart as PieIcon,
  BarChart as BarIcon,
  Percent as PercentIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
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
import { useTheme } from '@mui/material/styles';

// ─────────────────────────────────────────────────────────────
// Mock Datasets
// ─────────────────────────────────────────────────────────────
const monthlyTrendData = [
  { month: 'Jan', attendance: 82, averageGrade: 74 },
  { month: 'Feb', attendance: 85, averageGrade: 76 },
  { month: 'Mar', attendance: 88, averageGrade: 78 },
  { month: 'Apr', attendance: 84, averageGrade: 79 },
  { month: 'May', attendance: 89, averageGrade: 82 },
];

const subjectAttendanceData = [
  { name: 'Data Structures (CSE201)', attendance: 88, passingRate: 95 },
  { name: 'Database Systems (CSE305)', attendance: 84, passingRate: 91 },
  { name: 'Operating Systems (CSE302)', attendance: 81, passingRate: 88 },
];

const sectionDistributionData = [
  { name: 'CSE-A (DSA)', value: 45, color: '#4f46e5' },
  { name: 'CSE-A (DBMS)', value: 35, color: '#10b981' },
  { name: 'CSE-B (DBMS)', value: 12, color: '#3b82f6' },
  { name: 'CSE-A (OS)', value: 8, color: '#f59e0b' },
];

export const AnalyticsPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* ── Page Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
        <IconButton
          onClick={() => navigate('/faculty')}
          size="small"
          sx={{ bgcolor: 'action.hover', '&:hover': { bgcolor: 'action.selected' } }}
        >
          <BackIcon fontSize="small" />
        </IconButton>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>
            Attendance & Grades Analytics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Visualized lecture attendance metrics, performance metrics, and subject trends
          </Typography>
        </Box>
      </Box>

      {/* ── Top Metrics Cards Row ── */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Metric 1 */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            variant="outlined"
            sx={{
              p: 3,
              borderRadius: 3.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
                AVERAGE ATTENDANCE
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
                86.4%
              </Typography>
            </Box>
            <Box sx={{ p: 1.5, borderRadius: '50%', bgcolor: 'rgba(79, 70, 229, 0.08)' }}>
              <PercentIcon sx={{ color: '#4f46e5' }} />
            </Box>
          </Paper>
        </Grid>

        {/* Metric 2 */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            variant="outlined"
            sx={{
              p: 3,
              borderRadius: 3.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
                HIGHEST ATTENDANCE
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
                89%
              </Typography>
            </Box>
            <Box sx={{ p: 1.5, borderRadius: '50%', bgcolor: 'rgba(16, 185, 129, 0.08)' }}>
              <TrendIcon sx={{ color: '#10b981' }} />
            </Box>
          </Paper>
        </Grid>

        {/* Metric 3 */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            variant="outlined"
            sx={{
              p: 3,
              borderRadius: 3.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
                AVERAGE GRADES GPA
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
                8.1 / 10
              </Typography>
            </Box>
            <Box sx={{ p: 1.5, borderRadius: '50%', bgcolor: 'rgba(59, 130, 246, 0.08)' }}>
              <BarIcon sx={{ color: '#3b82f6' }} />
            </Box>
          </Paper>
        </Grid>

        {/* Metric 4 */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            variant="outlined"
            sx={{
              p: 3,
              borderRadius: 3.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
                ABSENCE ALERTS COUNT
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'error.main' }}>
                4
              </Typography>
            </Box>
            <Box sx={{ p: 1.5, borderRadius: '50%', bgcolor: 'rgba(239, 68, 68, 0.08)' }}>
              <PieIcon sx={{ color: '#ef4444' }} />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* ── Charts Grid ── */}
      <Grid container spacing={4}>
        {/* Line Chart: Monthly Trend */}
        <Grid item xs={12} lg={8}>
          <Paper variant="outlined" sx={{ p: 4, borderRadius: 4 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 3 }}>
              Monthly Semester Trend (Attendance vs Average Grade %)
            </Typography>
            <Box sx={{ width: '100%', height: 320 }}>
              <ResponsiveContainer>
                <LineChart data={monthlyTrendData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis dataKey="month" stroke={theme.palette.text.secondary} style={{ fontSize: '0.75rem' }} />
                  <YAxis stroke={theme.palette.text.secondary} style={{ fontSize: '0.75rem' }} domain={[60, 100]} />
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
                    stroke="#4f46e5"
                    strokeWidth={3}
                    activeDot={{ r: 8 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="averageGrade"
                    name="Average Grade %"
                    stroke="#06b6d4"
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Pie Chart: Section-wise Class Size */}
        <Grid item xs={12} lg={4}>
          <Paper variant="outlined" sx={{ p: 4, borderRadius: 4, height: '100%' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5 }}>
              Subject Attendance Share
            </Typography>
            <Box sx={{ width: '100%', height: 260, display: 'flex', justifyContent: 'center' }}>
              <ResponsiveContainer>
                <RechartsPieChart>
                  <Pie
                    data={sectionDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {sectionDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </Box>
            <Divider sx={{ my: 1.5 }} />
            {/* Custom Legends list */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {sectionDistributionData.map((entry, idx) => (
                <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: entry.color }} />
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      {entry.name}
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>
                    {entry.value}%
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Bar Chart: Subject-wise Performance */}
        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 4, borderRadius: 4 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 3 }}>
              Subject-wise Average Attendance & Exam Passing Rate (%)
            </Typography>
            <Box sx={{ width: '100%', height: 320 }}>
              <ResponsiveContainer>
                <RechartsBarChart data={subjectAttendanceData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
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
                  <Bar dataKey="attendance" name="Attendance %" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="passingRate" name="Exam Pass Rate %" fill="#10b981" radius={[4, 4, 0, 0]} />
                </RechartsBarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalyticsPage;
