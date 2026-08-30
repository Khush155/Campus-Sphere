import React, { useState, useMemo } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  Typography,
  Chip,
  TextField,
  InputAdornment,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Skeleton,
  useTheme,
} from '@mui/material';
import {
  SearchOutlined as SearchIcon,
  Close as CloseIcon,
  CalendarTodayOutlined as DateIcon,
  PersonOutline as AuthorIcon,
  ArrowForwardOutlined as ArrowIcon,
} from '@mui/icons-material';

import { useFeedQuery } from '../../queries/noticeQueries';
import EmptyState from '../../components/common/EmptyState';

export const StudentNoticeHub = () => {
  const theme = useTheme();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedNotice, setSelectedNotice] = useState(null);

  const { data: responseData, isLoading } = useFeedQuery();

  const notices = useMemo(() => {
    if (!responseData) return [];
    if (Array.isArray(responseData)) return responseData;
    return responseData.data || [];
  }, [responseData]);

  // Filtered notices
  const filteredNotices = useMemo(() => {
    return notices.filter((item) => {
      const matchesSearch =
        search === '' ||
        item.title?.toLowerCase().includes(search.toLowerCase()) ||
        item.content?.toLowerCase().includes(search.toLowerCase()) ||
        item.category?.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        selectedCategory === 'ALL' ||
        (selectedCategory === 'ACADEMIC' && (item.category === 'ACADEMIC' || item.category === 'EXAMINATION')) ||
        (selectedCategory === 'EVENT' && (item.category === 'EVENT' || item.category === 'GENERAL')) ||
        (selectedCategory === 'URGENT' && (item.priority === 'HIGH' || item.priority === 'URGENT')) ||
        item.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [notices, search, selectedCategory]);

  return (
    <Container maxWidth="xl" sx={{ py: 3.5 }}>
      {/* ── 1. Page Header ── */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em', mb: 0.5 }}>
          Student Notice Board
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Official institutional circulars, academic notices, timetable updates, and campus announcements.
        </Typography>
      </Box>

      {/* ── 2. Filter Bar ── */}
      <Card elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, bgcolor: theme.palette.background.paper }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search circulars by headline or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                sx: { borderRadius: '10px' },
              }}
            />
          </Grid>
          <Grid item xs={12} md={7}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {[
                { id: 'ALL', label: 'All Notices' },
                { id: 'ACADEMIC', label: 'Academic & Exams' },
                { id: 'EVENT', label: 'Events & Campus' },
                { id: 'URGENT', label: 'High Priority' },
              ].map((tab) => (
                <Chip
                  key={tab.id}
                  label={tab.label}
                  onClick={() => setSelectedCategory(tab.id)}
                  color={selectedCategory === tab.id ? 'primary' : 'default'}
                  variant={selectedCategory === tab.id ? 'filled' : 'outlined'}
                  sx={{ fontWeight: 700, borderRadius: '10px', cursor: 'pointer' }}
                />
              ))}
            </Box>
          </Grid>
        </Grid>
      </Card>

      {/* ── 4. Notice Grid Cards ── */}
      {isLoading ? (
        <Grid container spacing={2.5}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} md={6} key={i}>
              <Card elevation={0} sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}` }}>
                <Skeleton variant="text" width="60%" height={28} />
                <Skeleton variant="text" width="40%" height={20} sx={{ mb: 2 }} />
                <Skeleton variant="rectangular" height={80} sx={{ borderRadius: '8px' }} />
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : filteredNotices.length === 0 ? (
        <EmptyState
          type="notices"
          title="No Notices Available"
          description="There are currently no official notices matching your search criteria."
        />
      ) : (
        <Grid container spacing={2.5}>
          {filteredNotices.map((notice) => {
            const isHighPriority = notice.priority === 'HIGH' || notice.priority === 'URGENT';
            const accentColor = isHighPriority ? '#ef4444' : notice.category === 'ACADEMIC' ? '#10b981' : '#4f46e5';

            return (
              <Grid item xs={12} md={6} key={notice._id || notice.id}>
                <Card
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: '14px',
                    border: `1px solid ${theme.palette.divider}`,
                    borderLeft: `5px solid ${accentColor}`,
                    bgcolor: theme.palette.background.paper,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    height: '100%',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                    },
                  }}
                >
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, gap: 1 }}>
                      <Chip
                        label={notice.category || 'ANNOUNCEMENT'}
                        size="small"
                        sx={{
                          fontWeight: 800,
                          fontSize: '0.68rem',
                          height: 22,
                          bgcolor: `${accentColor}15`,
                          color: accentColor,
                          borderRadius: '6px',
                        }}
                      />
                      {isHighPriority && (
                        <Chip
                          label="PRIORITY"
                          size="small"
                          color="error"
                          sx={{ fontWeight: 800, fontSize: '0.65rem', height: 20, borderRadius: '6px' }}
                        />
                      )}
                    </Box>

                    <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', mb: 1, lineHeight: 1.3 }}>
                      {notice.title}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: 1.5,
                        mb: 2,
                      }}
                    >
                      {notice.content}
                    </Typography>
                  </Box>

                  <Box sx={{ pt: 2, borderTop: `1px solid ${theme.palette.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: 'text.secondary' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <DateIcon sx={{ fontSize: 14 }} />
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                          {notice.createdAt ? new Date(notice.createdAt).toLocaleDateString('en-IN') : 'Recent'}
                        </Typography>
                      </Box>
                      {notice.createdBy?.name && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <AuthorIcon sx={{ fontSize: 14 }} />
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            {notice.createdBy.name}
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    <Button
                      size="small"
                      endIcon={<ArrowIcon fontSize="small" />}
                      onClick={() => setSelectedNotice(notice)}
                      sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}
                    >
                      Read
                    </Button>
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* ── 5. Notice Detail Dialog ── */}
      <Dialog
        open={Boolean(selectedNotice)}
        onClose={() => setSelectedNotice(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Chip
            label={selectedNotice?.category || 'CIRCULAR'}
            size="small"
            color="primary"
            sx={{ fontWeight: 800, fontSize: '0.7rem' }}
          />
          <IconButton size="small" onClick={() => setSelectedNotice(null)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
            {selectedNotice?.title}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5, color: 'text.secondary' }}>
            <Typography variant="caption">
              Published: {selectedNotice?.createdAt ? new Date(selectedNotice.createdAt).toLocaleDateString('en-IN') : 'Recent'}
            </Typography>
            {selectedNotice?.createdBy?.name && (
              <Typography variant="caption">
                Issued By: {selectedNotice.createdBy.name}
              </Typography>
            )}
          </Box>
          <Typography variant="body1" sx={{ lineHeight: 1.7, color: 'text.primary', whiteSpace: 'pre-line' }}>
            {selectedNotice?.content}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSelectedNotice(null)} variant="outlined" sx={{ borderRadius: '8px', fontWeight: 700 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default StudentNoticeHub;
