// client/src/pages/faculty/marks/components/MarksSummaryCard.jsx
//
// Presentational dashboard card calculating and displaying live class stats
// (highest, lowest, averages, pass/fail rates, absent counts).

import React from 'react';
import { Card, Grid, Box, Typography, Divider } from '@mui/material';
import {
  PeopleAlt as TotalIcon,
  EmojiEvents as HighScoreIcon,
  TrendingDown as LowScoreIcon,
  Functions as AverageIcon,
  DoneOutline as PassIcon,
  PersonOff as AbsentIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

/**
 * Metric Item helper.
 */
const MetricBox = ({ title, value, icon, color, isDark }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      p: 1.5,
    }}
  >
    <Box
      sx={{
        width: 44,
        height: 44,
        borderRadius: 2.5,
        bgcolor: isDark ? 'rgba(255,255,255,0.05)' : `${color}08`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : `${color}20`}`,
      }}
    >
      {React.cloneElement(icon, { sx: { color: isDark ? '#ffffff' : color, fontSize: 22 } })}
    </Box>
    <Box>
      <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
        {title}
      </Typography>
      <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>
        {value}
      </Typography>
    </Box>
  </Box>
);

export const MarksSummaryCard = ({ records = [] }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Calculate live statistics
  const stats = React.useMemo(() => {
    const total = records.length;
    if (total === 0) {
      return { total: 0, highest: '-', lowest: '-', average: '-', passRate: '-', failRate: '-', absent: 0 };
    }

    let highest = -Infinity;
    let lowest = Infinity;
    let sum = 0;
    let gradedCount = 0;
    let passCount = 0;
    let failCount = 0;
    let absentCount = 0;

    records.forEach((row) => {
      if (row.marksObtained === '') {
        return; // Skip ungraded students from calculations
      }
      if (row.marksObtained === null) {
        absentCount++;
        // Absent students count as failures for percentage calculations
        failCount++;
      } else {
        const score = Number(row.marksObtained);
        gradedCount++;
        sum += score;

        if (score > highest) highest = score;
        if (score < lowest) lowest = score;

        // Pass threshold is set at 40% of maxMarks
        const passBoundary = row.maxMarks * 0.4;
        if (score >= passBoundary) {
          passCount++;
        } else {
          failCount++;
        }
      }
    });

    const averageScore = gradedCount > 0 ? (sum / gradedCount).toFixed(1) : '0';
    const passPercentage = total > 0 ? ((passCount / total) * 100).toFixed(0) : '0';
    const failPercentage = total > 0 ? ((failCount / total) * 100).toFixed(0) : '0';

    return {
      total,
      highest: gradedCount > 0 ? highest : '-',
      lowest: gradedCount > 0 ? lowest : '-',
      average: averageScore,
      passRate: `${passPercentage}%`,
      failRate: `${failPercentage}%`,
      absent: absentCount,
    };
  }, [records]);

  return (
    <Card
      elevation={0}
      variant="outlined"
      sx={{
        p: 2,
        mb: 3,
        borderRadius: 3,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: isDark ? 'background.paper' : '#ffffff',
      }}
    >
      <Grid container spacing={2} alignItems="center">
        {/* Total Students */}
        <Grid item xs={6} sm={4} md={2.5}>
          <MetricBox
            title="Total Students"
            value={stats.total}
            icon={<TotalIcon />}
            color="#4f46e5"
            isDark={isDark}
          />
        </Grid>
        
        <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' }, mx: 1.5 }} />

        {/* Class Average */}
        <Grid item xs={6} sm={4} md={2.5}>
          <MetricBox
            title="Class Average"
            value={stats.average}
            icon={<AverageIcon />}
            color="#06b6d4"
            isDark={isDark}
          />
        </Grid>

        <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' }, mx: 1.5 }} />

        {/* Highest / Lowest Scores */}
        <Grid item xs={12} sm={4} md={3.2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <MetricBox
              title="Highest Score"
              value={stats.highest}
              icon={<HighScoreIcon />}
              color="#eab308"
              isDark={isDark}
            />
            <MetricBox
              title="Lowest Score"
              value={stats.lowest}
              icon={<LowScoreIcon />}
              color="#a855f7"
              isDark={isDark}
            />
          </Box>
        </Grid>

        <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' }, mx: 1.5 }} />

        {/* Pass / Fail & Absent Count */}
        <Grid item xs={12} sm={12} md={3}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
            <MetricBox
              title="Pass / Fail %"
              value={`${stats.passRate} / ${stats.failRate}`}
              icon={<PassIcon />}
              color="#10b981"
              isDark={isDark}
            />
            <MetricBox
              title="Absent Count"
              value={stats.absent}
              icon={<AbsentIcon />}
              color="#ef4444"
              isDark={isDark}
            />
          </Box>
        </Grid>
      </Grid>
    </Card>
  );
};

export default MarksSummaryCard;
