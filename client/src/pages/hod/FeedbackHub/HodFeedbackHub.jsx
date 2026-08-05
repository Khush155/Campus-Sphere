import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  Rating,
  Grid,
  Card,
  useTheme,
  CircularProgress,
  Avatar,
  Divider,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import {
  StarOutlined,
  SearchOutlined,
  RefreshOutlined,
  RateReviewOutlined,
  PersonOutlined,
  SchoolOutlined,
  ThumbUpOutlined,
  ThumbDownOutlined,
  VisibilityOutlined,
} from '@mui/icons-material';
import DataTable from '../../../components/common/DataTable';
import EmptyState from '../../../components/common/EmptyState';
import { useFeedbackQuery, useFeedbackAnalyticsQuery } from '../../../queries/hodQueries';

export const HodFeedbackHub = () => {
  const theme = useTheme();
  const [viewMode, setViewMode] = useState('analytics'); // 'analytics' | 'stream'

  // Modals & Filters
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [ratingFilter, setRatingFilter] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  React.useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Queries
  const { data: feedbackData = [], isLoading, isError, refetch } = useFeedbackQuery();
  const { data: analyticsData = {} } = useFeedbackAnalyticsQuery();

  const feedbackList = useMemo(() => (Array.isArray(feedbackData) ? feedbackData : []), [feedbackData]);

  // Filtered raw feedback stream
  const filteredStream = useMemo(() => {
    let list = feedbackList;
    if (ratingFilter) {
      list = list.filter((f) => Math.floor(f.rating) === Number(ratingFilter));
    }
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(
        (f) =>
          (f.targetUser?.name?.toLowerCase() || '').includes(q) ||
          (f.submittedBy?.name?.toLowerCase() || '').includes(q) ||
          (f.comments?.toLowerCase() || '').includes(q)
      );
    }
    return list;
  }, [feedbackList, ratingFilter, debouncedSearch]);

  // Global KPIs
  const stats = useMemo(() => {
    const total = feedbackList.length;
    if (total === 0) return { total: 0, avg: 0, positivePct: 0, negativeCount: 0 };

    const sum = feedbackList.reduce((acc, f) => acc + (f.rating || 0), 0);
    const avg = (sum / total).toFixed(1);
    const positive = feedbackList.filter((f) => f.rating >= 4).length;
    const negative = feedbackList.filter((f) => f.rating <= 2).length;
    const positivePct = Math.round((positive / total) * 100);

    return { total, avg, positivePct, negativeCount: negative };
  }, [feedbackList]);

  // Faculty analytics per person
  const facultyAnalyticsList = Array.isArray(analyticsData.perFaculty) ? analyticsData.perFaculty : [];

  const handleOpenDetail = (row) => {
    setSelectedFeedback(row);
    setDetailModalOpen(true);
  };

  const columns = [
    {
      id: 'targetUser',
      label: 'Evaluated Faculty / Member',
      render: (r) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 34, height: 34, bgcolor: `${theme.palette.primary.main}15`, color: theme.palette.primary.main, fontWeight: 700 }}>
            {r.targetUser?.name?.charAt(0) || 'F'}
          </Avatar>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 800, color: theme.palette.ink[900] }}>
              {r.targetUser?.name || 'Faculty Member'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {r.targetUser?.email || r.targetRole || 'FACULTY'}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      id: 'rating',
      label: 'Student Rating',
      render: (r) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Rating value={r.rating || 0} precision={0.5} readOnly size="small" />
          <Typography variant="caption" sx={{ fontWeight: 800, fontFamily: theme.typography.mono.fontFamily }}>
            {r.rating} / 5
          </Typography>
        </Box>
      ),
    },
    {
      id: 'comments',
      label: 'Evaluation Comments',
      render: (r) => (
        <Typography
          variant="body2"
          sx={{
            maxWidth: 280,
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            fontStyle: 'italic',
          }}
        >
          {`"${r.comments || 'No comments'}"`}
        </Typography>
      ),
    },
    {
      id: 'submittedBy',
      label: 'Evaluator',
      render: (r) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {r.submittedBy?.name || 'Anonymous Student'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {r.submittedBy?.role || 'STUDENT'}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'date',
      label: 'Submitted Date',
      render: (r) => new Date(r.createdAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    },
    {
      id: 'actions',
      label: 'Actions',
      render: (r) => (
        <Button
          size="small"
          variant="outlined"
          startIcon={<VisibilityOutlined />}
          onClick={() => handleOpenDetail(r)}
          sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 600, fontSize: '0.72rem' }}
        >
          View Comment
        </Button>
      ),
    },
  ];

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
                icon={<RateReviewOutlined sx={{ fontSize: '0.9rem !important', color: `${theme.palette.primary.main} !important` }} />}
                label="DEPARTMENT FACULTY & COURSE EVALUATION ANALYTICS DESK"
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
              Faculty Feedback & Teaching Evaluation
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
              Review student evaluations, track faculty teaching satisfaction scores, analyze feedback distributions, and monitor course quality index.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshOutlined />}
              onClick={() => refetch()}
              sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
            >
              Refresh Feedbacks
            </Button>
          </Box>
        </Box>
      </Card>

      {/* ── 2. KPI Summary Grid ────────────────────────────────────────────── */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em' }}>
              TOTAL EVALUATIONS
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.ink[900], mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
              {isLoading ? <CircularProgress size={24} /> : stats.total}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Student feedback submissions
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.primary.main }}>
              AVG DEPARTMENT RATING
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mt: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.primary.main, fontFamily: theme.typography.mono.fontFamily }}>
                {isLoading ? <CircularProgress size={24} /> : stats.avg}
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">/ 5.0 ⭐</Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Overall teaching score
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.signal.success }}>
              SATISFACTION RATE (≥4⭐)
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.signal.success, mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
              {isLoading ? <CircularProgress size={24} /> : `${stats.positivePct}%`}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Positive student reviews
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.warning.main }}>
              IMPROVEMENT REVIEWS (≤2⭐)
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.warning.main, mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
              {isLoading ? <CircularProgress size={24} /> : stats.negativeCount}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Low rating submissions
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* ── 3. Mode Switcher & Content ────────────────────────────────────── */}
      <Card sx={{ p: 3, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <TextField
            size="small"
            placeholder="Search faculty name, submitter, or review text..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 260 }}
            InputProps={{
              startAdornment: <SearchOutlined sx={{ color: 'text.secondary', mr: 1, fontSize: 18 }} />,
            }}
          />

          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, next) => next && setViewMode(next)}
            size="small"
            sx={{ bgcolor: theme.custom?.surface?.sunken || 'rgba(0,0,0,0.03)' }}
          >
            <ToggleButton value="analytics">
              <SchoolOutlined sx={{ fontSize: 18, mr: 0.5 }} /> Faculty Evaluations ({facultyAnalyticsList.length})
            </ToggleButton>
            <ToggleButton value="stream">
              <StarOutlined sx={{ fontSize: 18, mr: 0.5 }} /> Raw Feedback Stream ({feedbackList.length})
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* ── 4. Main Body: Faculty Cards vs Feedback Stream Table ──────────── */}
        {viewMode === 'analytics' ? (
          facultyAnalyticsList.length === 0 ? (
            <EmptyState
              type="reports"
              title="No Faculty Evaluation Records"
              description="No student reviews or faculty evaluations have been registered for this department."
            />
          ) : (
            <Grid container spacing={2.5}>
              {facultyAnalyticsList.map((item) => {
                const avg = Number(item.avgRating || 0).toFixed(1);
                return (
                  <Grid item xs={12} sm={6} md={4} key={item._id}>
                    <Card
                      sx={{
                        p: 3,
                        borderRadius: '16px',
                        border: `1px solid ${theme.palette.divider}`,
                        boxShadow: 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        justify: 'space-between',
                        gap: 2,
                        height: '100%',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          transform: 'translateY(-3px)',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <Avatar sx={{ width: 44, height: 44, bgcolor: `${theme.palette.primary.main}15`, color: theme.palette.primary.main, fontWeight: 800 }}>
                          <PersonOutlined />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: theme.palette.ink[900] }}>
                            Faculty Review Summary
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            {item.totalReviews} student evaluation(s)
                          </Typography>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                            <Rating value={Number(avg)} precision={0.1} readOnly size="small" />
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: theme.palette.primary.main, fontFamily: theme.typography.mono.fontFamily }}>
                              {avg} ⭐
                            </Typography>
                          </Box>
                        </Box>
                      </Box>

                      <Divider />

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: theme.palette.signal.success }}>
                          <ThumbUpOutlined fontSize="small" />
                          <Typography variant="caption" sx={{ fontWeight: 800 }}>
                            {item.positiveReviews || 0} Positive
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: theme.palette.signal.error }}>
                          <ThumbDownOutlined fontSize="small" />
                          <Typography variant="caption" sx={{ fontWeight: 800 }}>
                            {item.negativeReviews || 0} Critical
                          </Typography>
                        </Box>
                      </Box>

                      {item.recentComment && (
                        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {`"${item.recentComment}"`}
                        </Typography>
                      )}
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )
        ) : (
          <>
            <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
              <TextField
                select
                size="small"
                label="Filter by Star Rating"
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
                sx={{ minWidth: 200 }}
                SelectProps={{ displayEmpty: true }}
                InputLabelProps={{ shrink: true }}
              >
                <MenuItem value="">All Ratings</MenuItem>
                <MenuItem value="5">5 Stars ⭐⭐⭐⭐⭐</MenuItem>
                <MenuItem value="4">4 Stars ⭐⭐⭐⭐</MenuItem>
                <MenuItem value="3">3 Stars ⭐⭐⭐</MenuItem>
                <MenuItem value="2">2 Stars ⭐⭐</MenuItem>
                <MenuItem value="1">1 Star ⭐</MenuItem>
              </TextField>
            </Box>

            <DataTable columns={columns} data={filteredStream} isLoading={isLoading} isError={isError} emptyMessage="No feedback records found." />
          </>
        )}
      </Card>

      {/* ── 5. View Comment Modal ─────────────────────────────────────────── */}
      <Dialog open={detailModalOpen} onClose={() => setDetailModalOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        {selectedFeedback && (
          <>
            <DialogTitle sx={{ fontWeight: 800 }}>Student Evaluation Details</DialogTitle>
            <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Rating value={selectedFeedback.rating || 0} precision={0.5} readOnly />
                <Typography variant="h6" sx={{ fontWeight: 800, color: theme.palette.ink[900] }}>
                  {selectedFeedback.rating} / 5
                </Typography>
              </Box>

              <Typography variant="caption" color="text.secondary">
                Evaluated: <strong>{selectedFeedback.targetUser?.name || 'Faculty Member'}</strong> ({selectedFeedback.targetRole || 'FACULTY'})
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Submitted By: <strong>{selectedFeedback.submittedBy?.name || 'Anonymous Student'}</strong>
              </Typography>

              <Divider />

              <Typography variant="body2" sx={{ bgcolor: theme.custom?.surface?.sunken || 'rgba(0,0,0,0.02)', p: 2, borderRadius: '8px', fontStyle: 'italic', lineHeight: 1.6 }}>
                {`"${selectedFeedback.comments}"`}
              </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={() => setDetailModalOpen(false)} variant="contained" sx={{ borderRadius: '8px', fontWeight: 700 }}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default HodFeedbackHub;
