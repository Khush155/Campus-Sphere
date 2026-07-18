import React, { useMemo, useState } from 'react';
import {
  Box, Typography, Grid, Paper, Chip, Rating, Avatar, useTheme,
  CircularProgress, Alert, LinearProgress, Divider, TextField, MenuItem,
} from '@mui/material';
import {
  StarRate, InsertComment, ThumbUpAlt, ThumbDownAlt,
  Person, School,
} from '@mui/icons-material';
import DataTable from '../../../components/common/DataTable';
import { useFeedbackQuery } from '../../../queries/hodQueries';

const RATING_COLORS = {
  5: 'success', 4: 'success', 3: 'warning', 2: 'error', 1: 'error',
};

const AnalyticsCard = ({ title, value, subtitle, icon, color }) => {
  const theme = useTheme();
  return (
    <Paper sx={{
      p: 3, display: 'flex', alignItems: 'center', gap: 2, borderRadius: 2,
      border: `1px solid ${theme.palette.divider}`, boxShadow: 'none',
    }}>
      <Box sx={{
        p: 2, borderRadius: 2,
        bgcolor: theme.palette.mode === 'dark' ? `${color}.dark` : `${color}.50`,
        color: `${color}.main`, display: 'flex', alignItems: 'center',
      }}>
        {icon}
      </Box>
      <Box>
        <Typography variant="h4" fontWeight={800}>{value}</Typography>
        <Typography variant="body2" fontWeight={600} color="text.secondary">{title}</Typography>
        {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
      </Box>
    </Paper>
  );
};

/** Renders a per-faculty average bar */
const FacultyRatingBar = ({ name, avg, count }) => {
  const color = avg >= 4 ? 'success' : avg >= 3 ? 'warning' : 'error';
  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ width: 28, height: 28, fontSize: 13, bgcolor: `${color}.main` }}>
            {name?.[0] || '?'}
          </Avatar>
          <Typography variant="body2" fontWeight={600}>{name}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" color="text.secondary">{count} reviews</Typography>
          <Typography variant="body2" fontWeight={700} color={`${color}.main`}>{avg}/5</Typography>
        </Box>
      </Box>
      <LinearProgress
        variant="determinate"
        value={(avg / 5) * 100}
        color={color}
        sx={{ height: 7, borderRadius: 4 }}
      />
    </Box>
  );
};

const HodFeedbackHub = () => {
  const [filterRole, setFilterRole] = useState('ALL');
  const [filterRating, setFilterRating] = useState('ALL');

  const { data: allFeedback = [], isLoading, isError } = useFeedbackQuery();

  // ── Analytics ─────────────────────────────────────────────────────────────
  const analytics = useMemo(() => {
    if (!allFeedback.length) return { avgRating: 0, total: 0, positivePercent: 0, negativePercent: 0 };
    const total = allFeedback.length;
    const sum = allFeedback.reduce((acc, f) => acc + (Number(f.rating) || 0), 0);
    const positive = allFeedback.filter(f => Number(f.rating) >= 4).length;
    const negative = allFeedback.filter(f => Number(f.rating) <= 2).length;
    return {
      avgRating: (sum / total).toFixed(1),
      total,
      positivePercent: Math.round((positive / total) * 100),
      negativePercent: Math.round((negative / total) * 100),
    };
  }, [allFeedback]);

  // ── Per-faculty rating breakdown ───────────────────────────────────────────
  const facultyBreakdown = useMemo(() => {
    const facultyFeedback = allFeedback.filter(f => f.targetRole === 'FACULTY' && f.targetUser);
    const map = {};
    facultyFeedback.forEach(f => {
      const id = f.targetUser?._id || f.targetUser;
      const name = f.targetUser?.name || 'Unknown';
      if (!map[id]) map[id] = { name, ratings: [] };
      map[id].ratings.push(Number(f.rating));
    });
    return Object.values(map)
      .map(f => ({
        name: f.name,
        avg: (f.ratings.reduce((a, b) => a + b, 0) / f.ratings.length).toFixed(1),
        count: f.ratings.length,
      }))
      .sort((a, b) => a.avg - b.avg); // Lowest rated first — needs attention
  }, [allFeedback]);

  // ── Filtered table data ────────────────────────────────────────────────────
  const tableData = useMemo(() => {
    return allFeedback.filter(f => {
      if (filterRole !== 'ALL' && f.targetRole !== filterRole) return false;
      if (filterRating !== 'ALL' && Number(f.rating) !== Number(filterRating)) return false;
      return true;
    });
  }, [allFeedback, filterRole, filterRating]);

  const columns = [
    {
      id: 'submittedBy', label: 'Submitted By', render: (r) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Person fontSize="small" color="action" />
          <Typography variant="body2">{r.submittedBy?.name || '—'}</Typography>
        </Box>
      )
    },
    {
      id: 'targetRole', label: 'Type', render: (r) => (
        <Chip
          size="small"
          icon={r.targetRole === 'FACULTY' ? <School fontSize="small" /> : <Person fontSize="small" />}
          label={`${r.targetRole} Review`}
          color={r.targetRole === 'FACULTY' ? 'primary' : 'secondary'}
          variant="outlined"
        />
      )
    },
    {
      id: 'targetUser', label: 'Reviewed', render: (r) =>
        r.targetUser?.name || <Typography variant="caption" color="text.disabled">Anonymous</Typography>
    },
    {
      id: 'rating', label: 'Rating', render: (r) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Rating value={Number(r.rating)} readOnly size="small" />
          <Chip
            label={r.rating}
            size="small"
            color={RATING_COLORS[Number(r.rating)] || 'default'}
          />
        </Box>
      )
    },
    {
      id: 'comments', label: 'Comments', render: (r) => (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          title={r.comments}
        >
          {r.comments || '—'}
        </Typography>
      )
    },
    {
      id: 'createdAt', label: 'Date', render: (r) =>
        new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    },
  ];

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;

  if (isError) return (
    <Box sx={{ p: 4 }}>
      <Alert severity="error">Failed to load feedback data. Please refresh.</Alert>
    </Box>
  );

  return (
    <Box sx={{ p: { xs: 1, sm: 3 } }}>
      {/* Header — NO submit button for HOD */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold">Faculty Feedback Analytics</Typography>
        <Typography variant="body2" color="text.secondary">
          Read-only view of student-submitted faculty reviews. HOD monitors quality — not submitting.
        </Typography>
      </Box>

      {/* Summary KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <AnalyticsCard
            title="Average Rating"
            value={`${analytics.avgRating} / 5`}
            subtitle="Across all faculty in dept"
            icon={<StarRate fontSize="large" />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <AnalyticsCard
            title="Total Reviews"
            value={analytics.total}
            subtitle="All student submissions"
            icon={<InsertComment fontSize="large" />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <AnalyticsCard
            title="Positive Reviews"
            value={`${analytics.positivePercent}%`}
            subtitle="4★ and above"
            icon={<ThumbUpAlt fontSize="large" />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <AnalyticsCard
            title="Needs Attention"
            value={`${analytics.negativePercent}%`}
            subtitle="2★ and below"
            icon={<ThumbDownAlt fontSize="large" />}
            color="error"
          />
        </Grid>
      </Grid>

      {/* Per-Faculty Rating Breakdown */}
      {facultyBreakdown.length > 0 && (
        <Paper sx={{ p: 3, borderRadius: 2, mb: 4, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>Faculty Rating Breakdown</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            Sorted by lowest-rated first — faculty needing improvement appear at top.
          </Typography>
          <Divider sx={{ mb: 2 }} />
          {facultyBreakdown.map(f => (
            <FacultyRatingBar key={f.name} name={f.name} avg={f.avg} count={f.count} />
          ))}
        </Paper>
      )}

      {/* Filters + Table */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          select size="small" label="Filter by Role" value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)} sx={{ minWidth: 160 }}
        >
          <MenuItem value="ALL">All Roles</MenuItem>
          <MenuItem value="FACULTY">Faculty Reviews</MenuItem>
          <MenuItem value="STUDENT">Student Reviews</MenuItem>
        </TextField>
        <TextField
          select size="small" label="Filter by Rating" value={filterRating}
          onChange={(e) => setFilterRating(e.target.value)} sx={{ minWidth: 160 }}
        >
          <MenuItem value="ALL">All Ratings</MenuItem>
          {[5, 4, 3, 2, 1].map(r => <MenuItem key={r} value={r}>{r} ★</MenuItem>)}
        </TextField>
        <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
          Showing {tableData.length} of {allFeedback.length} reviews
        </Typography>
      </Box>

      <DataTable
        columns={columns}
        data={tableData}
        isLoading={isLoading}
        isError={isError}
        emptyMessage="No feedback received yet from students."
      />
    </Box>
  );
};

export default HodFeedbackHub;
