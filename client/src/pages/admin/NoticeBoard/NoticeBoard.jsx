import React, { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Box,
  Typography,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  Chip,
  Button,
  Drawer,
  Alert,
  useTheme,
  Grid,
  Skeleton,
  Autocomplete,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from '@mui/material';
import {
  MoreVertOutlined,
  AddOutlined,
  CampaignOutlined,
  ArchiveOutlined,
  CheckCircleOutlined,
  VisibilityOutlined,
  EditOutlined,
  PublishOutlined,
  DraftsOutlined,
  DeleteOutline,
  ViewListOutlined,
  GridViewOutlined,
} from '@mui/icons-material';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

import {
  useNoticesQuery,
  useNoticeQuery,
  useCreateNoticeMutation,
  useUpdateNoticeMutation,
  useArchiveNoticeMutation,
} from '../../../queries/noticeQueries';
import { useDepartmentsQuery } from '../../../queries/collegeQueries';
import Pagination from '../../../components/common/Pagination';
import ConfirmDeleteModal from '../../../components/common/ConfirmDeleteModal';
import EmptyState from '../../../components/common/EmptyState';
import { useToast } from '../../../contexts/ToastContext';

// Zod Edit Validation Schema
const noticeFormSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(150, 'Title cannot exceed 150 characters')
    .trim(),
  content: z
    .string()
    .min(1, 'Content is required')
    .max(5000, 'Content cannot exceed 5000 characters')
    .trim(),
  priority: z.enum(['NORMAL', 'IMPORTANT', 'URGENT']),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
  targetRoles: z.array(z.string()).default([]),
  targetDepartments: z.array(z.string()).default([]),
  targetSemesters: z.array(z.number()).default([]),
});

export const NoticeBoard = () => {
  const theme = useTheme();
  const { showToast } = useToast();

  // Filter and search state
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [viewMode, setViewMode] = useState('list');

  // Drawer / Action State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeNoticeId, setActiveNoticeId] = useState(null);
  const [archiveId, setArchiveId] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [viewNotice, setViewNotice] = useState(null);

  // Queries
  const { data: depts } = useDepartmentsQuery();
  const { data: noticesData, isLoading } = useNoticesQuery({
    page,
    limit,
    search,
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
  });

  const archiveNotice = useArchiveNoticeMutation();
  const updateNotice = useUpdateNoticeMutation();

  // KPI Calculations
  const allNotices = noticesData?.data || [];
  const publishedCount = allNotices.filter((n) => n.status === 'PUBLISHED').length;
  const urgentCount = allNotices.filter((n) => n.priority === 'URGENT').length;
  const archivedCount = allNotices.filter((n) => n.status === 'ARCHIVED').length;

  const handleMenuOpen = (event, notice) => {
    setMenuAnchor(event.currentTarget);
    setSelectedNotice(notice);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedNotice(null);
  };

  const handleOpenCreate = () => {
    setActiveNoticeId(null);
    setDrawerOpen(true);
  };

  const handleOpenEdit = (notice) => {
    setActiveNoticeId(notice._id);
    setDrawerOpen(true);
    handleMenuClose();
  };

  const handleViewNoticeClick = (notice) => {
    setViewNotice(notice);
    handleMenuClose();
  };

  const handlePublishToggle = async (notice) => {
    try {
      const newStatus = notice.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
      await updateNotice.mutateAsync({ id: notice._id, data: { status: newStatus } });
      showToast(`Notice ${newStatus === 'PUBLISHED' ? 'published' : 'reverted to draft'}.`);
      handleMenuClose();
    } catch (err) {
      showToast('Failed to update notice status.', { severity: 'error' });
    }
  };

  const handleArchiveConfirm = async () => {
    if (archiveId) {
      try {
        await archiveNotice.mutateAsync(archiveId);
        showToast('Announcement archived successfully.');
        setArchiveId(null);
      } catch (err) {
        showToast('Failed to archive notice.', { severity: 'error' });
      }
    }
  };

  const handleOpenArchive = (notice) => {
    setArchiveId(notice._id);
    handleMenuClose();
  };

  const handleRestoreNotice = async (notice) => {
    try {
      await updateNotice.mutateAsync({ id: notice._id, data: { status: 'DRAFT' } });
      showToast('Notice restored to draft state.');
      handleMenuClose();
    } catch (err) {
      showToast('Failed to restore notice.', { severity: 'error' });
    }
  };

  const getPriorityLabelStyle = (priority) => {
    switch (priority) {
      case 'URGENT':
        return {
          bgcolor: 'rgba(239, 68, 68, 0.12)',
          color: theme.palette.signal.error,
        };
      case 'IMPORTANT':
        return {
          bgcolor: 'rgba(245, 158, 11, 0.12)',
          color: 'rgb(217, 119, 6)',
        };
      case 'NORMAL':
      default:
        return {
          bgcolor: 'rgba(107, 114, 128, 0.12)',
          color: theme.palette.text.secondary,
        };
    }
  };

  const getStatusLabelStyle = (status) => {
    switch (status) {
      case 'PUBLISHED':
        return {
          bgcolor: 'rgba(16, 185, 129, 0.12)',
          color: theme.palette.signal.success,
        };
      case 'DRAFT':
        return {
          bgcolor: 'rgba(59, 130, 246, 0.12)',
          color: theme.palette.primary.main,
        };
      case 'ARCHIVED':
      default:
        return {
          bgcolor: 'rgba(107, 114, 128, 0.15)',
          color: theme.palette.text.secondary,
        };
    }
  };

  const getAudienceSummary = (notice) => {
    const roles = notice.targetRoles || [];
    const deptsList = notice.targetDepartments || [];
    const semesters = notice.targetSemesters || [];

    let rolesPart = 'All Roles';
    if (roles.length > 0) {
      rolesPart = roles.map((r) => r.replace('_', ' ')).join(', ');
    }

    let deptsPart = 'All Departments';
    if (deptsList.length > 0) {
      deptsPart = deptsList.map((d) => d.code || d.name || d).join(', ');
    }

    let semestersPart = '';
    if (roles.length === 0 || roles.includes('STUDENT')) {
      if (semesters.length > 0) {
        semestersPart = ` (Sem ${semesters.sort().join(', ')})`;
      }
    }

    return `${rolesPart} · ${deptsPart}${semestersPart}`;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      {/* ── 1. Hero Header Banner Card ─────────────────────────────────────── */}
      <Card
        sx={{
          p: 3.5,
          borderRadius: '16px',
          border: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
          background: `linear-gradient(135deg, ${theme.palette.primary.main}0F 0%, ${theme.palette.brass?.[500] || '#b8863e'}08 100%)`,
          boxShadow: theme.custom?.elevation?.raised || 'none',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, flexWrap: 'wrap' }}>
            <Chip
              icon={<CampaignOutlined sx={{ fontSize: '0.9rem !important', color: `${theme.palette.primary.main} !important` }} />}
              label="CAMPUS BROADCAST CENTER"
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
            <Chip
              label={`${noticesData?.meta?.total || 0} Total Notices`}
              size="small"
              sx={{
                bgcolor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                fontFamily: theme.typography.mono.fontFamily,
                fontSize: '0.72rem',
                fontWeight: 600,
              }}
            />
            <Chip
              label={`${publishedCount} Active Published`}
              size="small"
              sx={{
                bgcolor: 'rgba(16, 185, 129, 0.1)',
                color: theme.palette.signal.success,
                fontFamily: theme.typography.mono.fontFamily,
                fontSize: '0.72rem',
                fontWeight: 600,
              }}
            />
            {urgentCount > 0 && (
              <Chip
                label={`${urgentCount} Urgent`}
                size="small"
                sx={{
                  bgcolor: 'rgba(239, 68, 68, 0.1)',
                  color: theme.palette.signal.error,
                  fontFamily: theme.typography.mono.fontFamily,
                  fontSize: '0.72rem',
                  fontWeight: 700,
                }}
              />
            )}
            {archivedCount > 0 && (
              <Chip
                label={`${archivedCount} Archived`}
                size="small"
                sx={{
                  bgcolor: 'rgba(107, 114, 128, 0.1)',
                  color: theme.palette.text.secondary,
                  fontFamily: theme.typography.mono.fontFamily,
                  fontSize: '0.72rem',
                  fontWeight: 600,
                }}
              />
            )}
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
            Notice Board Management
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontFamily: theme.typography.body2.fontFamily,
              color: theme.palette.text.secondary,
              maxWidth: 640,
            }}
          >
            Publish, edit, and target critical broadcast notices to students, faculty, or specific departments.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddOutlined />}
          onClick={handleOpenCreate}
          sx={{
            background: theme.palette.primary.gradient || theme.palette.primary.main,
            color: '#ffffff',
            fontWeight: 700,
            px: 3,
            py: 1.25,
            borderRadius: '8px',
            textTransform: 'none',
            boxShadow: `0 4px 16px ${theme.palette.primary.main}40`,
            '&:hover': {
              filter: 'brightness(1.1)',
            },
          }}
        >
          Create Notice
        </Button>
      </Card>

      {/* ── 2. Filters & Searches ─────────────────────────────────────────── */}
      <Card sx={{ p: 2.5, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', borderRadius: '12px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1, flexWrap: 'wrap' }}>
            <TextField
              size="small"
              placeholder="Search notices by title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ minWidth: 240, flexGrow: 1 }}
            />
            <TextField
              select
              size="small"
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{ minWidth: 140 }}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="DRAFT">DRAFT</MenuItem>
              <MenuItem value="PUBLISHED">PUBLISHED</MenuItem>
              <MenuItem value="ARCHIVED">ARCHIVED</MenuItem>
            </TextField>
            <TextField
              select
              size="small"
              label="Priority"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              sx={{ minWidth: 140 }}
            >
              <MenuItem value="">All Priorities</MenuItem>
              <MenuItem value="NORMAL">NORMAL</MenuItem>
              <MenuItem value="IMPORTANT">IMPORTANT</MenuItem>
              <MenuItem value="URGENT">URGENT</MenuItem>
            </TextField>
          </Box>

          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, nextMode) => {
              if (nextMode) setViewMode(nextMode);
            }}
            size="small"
            sx={{ ml: 'auto' }}
          >
            <ToggleButton value="list" aria-label="list view">
              <Tooltip title="List View">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <ViewListOutlined fontSize="small" />
                  <Typography variant="caption" sx={{ fontWeight: 700, display: { xs: 'none', md: 'inline' } }}>
                    List
                  </Typography>
                </Box>
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="block" aria-label="block view">
              <Tooltip title="Block / Card View">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <GridViewOutlined fontSize="small" />
                  <Typography variant="caption" sx={{ fontWeight: 700, display: { xs: 'none', md: 'inline' } }}>
                    Block
                  </Typography>
                </Box>
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Card>

      {/* ── 3. Main Data View (List or Block) ─────────────────────────────────── */}
      {isLoading ? (
        <TableContainer component={Card} sx={{ border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', borderRadius: '12px' }}>
          <Table>
            <TableBody>
              {[1, 2, 3, 4, 5].map((idx) => (
                <TableRow key={idx}>
                  <TableCell><Skeleton variant="text" width="60%" height={24} /></TableCell>
                  <TableCell><Skeleton variant="rectangular" width={60} height={20} /></TableCell>
                  <TableCell><Skeleton variant="rectangular" width={70} height={20} /></TableCell>
                  <TableCell><Skeleton variant="text" width="80%" height={20} /></TableCell>
                  <TableCell><Skeleton variant="text" width="40%" height={20} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : !noticesData?.data || noticesData.data.length === 0 ? (
        <EmptyState
          type="notices"
          title={search || statusFilter || priorityFilter ? 'No Matching Notices' : 'No Notices Configured'}
          description={
            search || statusFilter || priorityFilter
              ? 'No notices match your filters. Try modifying your criteria.'
              : 'Create announcements and broadcasts to reach your target students or faculty.'
          }
          actionText={search || statusFilter || priorityFilter ? 'Reset Filters' : 'Create Notice'}
          onAction={
            search || statusFilter || priorityFilter
              ? () => {
                  setSearch('');
                  setStatusFilter('');
                  setPriorityFilter('');
                }
              : handleOpenCreate
          }
        />
      ) : (
        <>
          {viewMode === 'list' ? (
            <TableContainer component={Card} sx={{ border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', borderRadius: '12px' }}>
              <Table aria-label="Notices configuration table" size="small">
                <TableHead sx={{ bgcolor: theme.custom?.surface?.sunken || 'rgba(28, 46, 69, 0.02)' }}>
                  <TableRow>
                    <TableCell sx={{ py: 1.5, fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>TITLE</TableCell>
                    <TableCell sx={{ py: 1.5, fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>PRIORITY</TableCell>
                    <TableCell sx={{ py: 1.5, fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>STATUS</TableCell>
                    <TableCell sx={{ py: 1.5, fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>TARGETED TO</TableCell>
                    <TableCell sx={{ py: 1.5, fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>PUBLISHED DATE</TableCell>
                    <TableCell align="right" sx={{ py: 1.5, fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>ACTIONS</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {noticesData.data.map((notice) => (
                    <TableRow
                      key={notice._id}
                      sx={{
                        '&:hover': { bgcolor: theme.custom?.interaction?.hoverTint || 'rgba(0,0,0,0.02)' },
                      }}
                    >
                      <TableCell
                        onClick={() => setViewNotice(notice)}
                        sx={{
                          py: 1.5,
                          fontWeight: 600,
                          cursor: 'pointer',
                          '&:hover': { color: theme.palette.primary.main, textDecoration: 'underline' },
                        }}
                      >
                        {notice.title}
                      </TableCell>
                      <TableCell sx={{ py: 1.5 }}>
                        <Chip
                          label={notice.priority}
                          size="small"
                          sx={{
                            ...getPriorityLabelStyle(notice.priority),
                            fontFamily: theme.typography.mono.fontFamily,
                            fontWeight: 700,
                            fontSize: '0.68rem',
                            borderRadius: '6px',
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ py: 1.5 }}>
                        <Chip
                          label={notice.status}
                          size="small"
                          sx={{
                            ...getStatusLabelStyle(notice.status),
                            fontFamily: theme.typography.mono.fontFamily,
                            fontWeight: 700,
                            fontSize: '0.68rem',
                            borderRadius: '6px',
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ py: 1.5, fontSize: '0.82rem' }}>{getAudienceSummary(notice)}</TableCell>
                      <TableCell sx={{ py: 1.5, fontSize: '0.82rem', color: theme.palette.text.secondary }}>
                        {notice.publishedAt ? new Date(notice.publishedAt).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell align="right" sx={{ py: 1.5 }}>
                        <IconButton aria-label="notice actions menu" size="small" onClick={(e) => handleMenuOpen(e, notice)}>
                          <MoreVertOutlined fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            /* ── BLOCK / GRID CARDS VIEW ──────────────────────────────────── */
            <Grid container spacing={2.5}>
              {noticesData.data.map((notice) => (
                <Grid item xs={12} sm={6} md={4} key={notice._id}>
                  <Card
                    sx={{
                      p: 3,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: '14px',
                      border: `1px solid ${theme.palette.divider}`,
                      boxShadow: 'none',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: `0 8px 24px ${theme.palette.primary.main}15`,
                        borderColor: theme.palette.primary.main,
                      },
                    }}
                  >
                    {/* Top Priority Bar Accent */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 4,
                        bgcolor:
                          notice.priority === 'URGENT'
                            ? theme.palette.signal.error
                            : notice.priority === 'IMPORTANT'
                            ? 'rgb(217, 119, 6)'
                            : theme.palette.primary.main,
                      }}
                    />

                    {/* Header Chips & Menu */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, mt: 0.5 }}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip
                          label={notice.priority}
                          size="small"
                          sx={{
                            ...getPriorityLabelStyle(notice.priority),
                            fontFamily: theme.typography.mono.fontFamily,
                            fontWeight: 800,
                            fontSize: '0.68rem',
                            borderRadius: '6px',
                          }}
                        />
                        <Chip
                          label={notice.status}
                          size="small"
                          sx={{
                            ...getStatusLabelStyle(notice.status),
                            fontFamily: theme.typography.mono.fontFamily,
                            fontWeight: 800,
                            fontSize: '0.68rem',
                            borderRadius: '6px',
                          }}
                        />
                      </Box>
                      <IconButton size="small" onClick={(e) => handleMenuOpen(e, notice)}>
                        <MoreVertOutlined fontSize="small" />
                      </IconButton>
                    </Box>

                    {/* Title */}
                    <Typography
                      variant="h6"
                      onClick={() => setViewNotice(notice)}
                      sx={{
                        fontSize: '1rem',
                        fontWeight: 700,
                        fontFamily: theme.typography.h1.fontFamily,
                        color: theme.palette.ink[900],
                        cursor: 'pointer',
                        lineHeight: 1.35,
                        mb: 1.25,
                        '&:hover': { color: theme.palette.primary.main },
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {notice.title}
                    </Typography>

                    {/* Content Snippet */}
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        fontSize: '0.84rem',
                        lineHeight: 1.5,
                        mb: 2,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        flexGrow: 1,
                      }}
                    >
                      {notice.content}
                    </Typography>

                    <Divider sx={{ my: 1.5 }} />

                    {/* Footer Meta & Actions */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, color: theme.palette.text.secondary, fontSize: '0.72rem' }}>
                          Target: {getAudienceSummary(notice)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.68rem', fontFamily: theme.typography.mono.fontFamily }}>
                          {notice.publishedAt ? new Date(notice.publishedAt).toLocaleDateString() : 'Draft'}
                        </Typography>
                      </Box>

                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<VisibilityOutlined fontSize="small" />}
                        onClick={() => setViewNotice(notice)}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 700,
                          fontSize: '0.74rem',
                          borderRadius: '8px',
                        }}
                      >
                        Read
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          {/* Pagination */}
          <Box sx={{ mt: 3 }}>
            <Pagination
              page={page}
              totalPages={noticesData.meta?.totalPages || 1}
              total={noticesData.meta?.total || 0}
              limit={limit}
              onPageChange={(newPage) => setPage(newPage)}
            />
          </Box>
        </>
      )}

      {/* ── 4. Notice Reader Preview Drawer ───────────────────────────────── */}
      <Drawer
        anchor="right"
        open={Boolean(viewNotice)}
        onClose={() => setViewNotice(null)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 480 }, p: 4, bgcolor: theme.palette.background.paper } }}
      >
        {viewNotice && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1.5 }}>
              <Chip
                label={viewNotice.priority}
                size="small"
                sx={{
                  ...getPriorityLabelStyle(viewNotice.priority),
                  fontFamily: theme.typography.mono.fontFamily,
                  fontWeight: 700,
                  fontSize: '0.72rem',
                }}
              />
              <Chip
                label={viewNotice.status}
                size="small"
                sx={{
                  ...getStatusLabelStyle(viewNotice.status),
                  fontFamily: theme.typography.mono.fontFamily,
                  fontWeight: 700,
                  fontSize: '0.72rem',
                }}
              />
            </Box>

            <Box>
              <Typography variant="h5" sx={{ fontFamily: theme.typography.h1.fontFamily, fontWeight: 700, color: theme.palette.ink[900], mb: 1 }}>
                {viewNotice.title}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Published: {viewNotice.publishedAt ? new Date(viewNotice.publishedAt).toLocaleString() : 'Draft Mode'}
              </Typography>
            </Box>

            <Divider />

            <Typography variant="body2" sx={{ color: theme.palette.text.primary, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
              {viewNotice.content}
            </Typography>

            <Divider />

            <Box sx={{ bgcolor: theme.custom?.surface?.sunken || 'rgba(0,0,0,0.02)', p: 2, borderRadius: '8px' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.ink[900], display: 'block', mb: 0.5 }}>
                Target Audience Breakdown
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.82rem' }}>
                {getAudienceSummary(viewNotice)}
              </Typography>
            </Box>

            <Box sx={{ mt: 'auto', display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              <Button variant="outlined" onClick={() => setViewNotice(null)} sx={{ flex: 1 }}>
                Close
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteOutline />}
                onClick={() => {
                  handleOpenArchive(viewNotice);
                  setViewNotice(null);
                }}
                sx={{ fontWeight: 700, flex: 1, textTransform: 'none' }}
              >
                Delete Notice
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  setActiveNoticeId(viewNotice._id);
                  setViewNotice(null);
                  setDrawerOpen(true);
                }}
                sx={{
                  background: theme.palette.primary.gradient || theme.palette.primary.main,
                  color: '#ffffff',
                  fontWeight: 700,
                  flex: 1,
                }}
              >
                Edit Notice
              </Button>
            </Box>
          </Box>
        )}
      </Drawer>

      {/* Drawer Form (Edit/Create lazy wrapper) */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 460 }, p: 4, bgcolor: theme.palette.background.paper } }}
      >
        {drawerOpen && (
          <NoticeEditFormWrapper
            noticeId={activeNoticeId}
            onClose={() => setDrawerOpen(false)}
            onSaveSuccess={() => {
              setDrawerOpen(false);
              setPage(1);
            }}
            depts={depts || []}
            theme={theme}
          />
        )}
      </Drawer>

      {/* Row Action Menu */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}>
        <MenuItem onClick={() => handleViewNoticeClick(selectedNotice)}>
          <VisibilityOutlined sx={{ fontSize: 18, mr: 1.25, color: theme.palette.primary.main }} />
          View Broadcast
        </MenuItem>
        <MenuItem onClick={() => handleOpenEdit(selectedNotice)}>
          <EditOutlined sx={{ fontSize: 18, mr: 1.25 }} />
          Edit Notice
        </MenuItem>
        {selectedNotice?.status === 'DRAFT' && (
          <MenuItem onClick={() => handlePublishToggle(selectedNotice)}>
            <PublishOutlined sx={{ fontSize: 18, mr: 1.25, color: theme.palette.signal.success }} />
            Publish Now
          </MenuItem>
        )}
        {selectedNotice?.status === 'PUBLISHED' && (
          <MenuItem onClick={() => handlePublishToggle(selectedNotice)}>
            <DraftsOutlined sx={{ fontSize: 18, mr: 1.25 }} />
            Revert to Draft
          </MenuItem>
        )}
        {selectedNotice?.status === 'ARCHIVED' ? (
          <MenuItem onClick={() => handleRestoreNotice(selectedNotice)}>
            <CheckCircleOutlined sx={{ fontSize: 18, mr: 1.25 }} />
            Restore to Draft
          </MenuItem>
        ) : (
          <MenuItem onClick={() => handleOpenArchive(selectedNotice)}>
            <ArchiveOutlined sx={{ fontSize: 18, mr: 1.25 }} />
            Archive Notice
          </MenuItem>
        )}
        <MenuItem onClick={() => handleOpenArchive(selectedNotice)} sx={{ color: theme.palette.signal.error }}>
          <DeleteOutline sx={{ fontSize: 18, mr: 1.25 }} />
          Delete Notice
        </MenuItem>
      </Menu>

      {/* Soft Archive Confirmation Modal */}
      <ConfirmDeleteModal
        open={!!archiveId}
        onClose={() => setArchiveId(null)}
        onConfirm={handleArchiveConfirm}
        title="Archive Announcement Notice"
        description="This will hide the notice from all recipient feeds, keeping a draft record in history. Are you sure you want to archive?"
        actionText="Archive"
        typedConfirmation={false}
      />
    </Box>
  );
};

/**
 * Lazy Wrapper component to fetch notice content for edit load state.
 */
const NoticeEditFormWrapper = ({ noticeId, onClose, onSaveSuccess, depts, theme }) => {
  const { data: notice, isLoading } = useNoticeQuery(noticeId);

  if (noticeId && (isLoading || !notice)) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, height: '100%', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
          <Box>
            <Skeleton variant="text" width="50%" height={32} />
            <Skeleton variant="text" width="30%" height={20} />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 2 }}>
            <Skeleton variant="rectangular" height={40} />
            <Skeleton variant="rectangular" height={120} />
            <Skeleton variant="rectangular" height={40} />
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <NoticeEditFormContent
      notice={notice}
      onClose={onClose}
      onSaveSuccess={onSaveSuccess}
      depts={depts}
      theme={theme}
    />
  );
};

const NoticeEditFormContent = ({ notice, onClose: _onClose, onSaveSuccess, depts, theme }) => {
  const { showToast } = useToast();
  const createNotice = useCreateNoticeMutation();
  const updateNotice = useUpdateNoticeMutation();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(noticeFormSchema),
    defaultValues: {
      title: notice?.title || '',
      content: notice?.content || '',
      priority: notice?.priority || 'NORMAL',
      status: notice?.status || 'DRAFT',
      targetRoles: notice?.targetRoles || [],
      targetDepartments: notice?.targetDepartments?.map((d) => d._id || d) || [],
      targetSemesters: notice?.targetSemesters || [],
    },
  });

  const selectedRoles = watch('targetRoles');
  const selectedDepts = watch('targetDepartments');
  const selectedSemesters = watch('targetSemesters');

  const showSemesters = selectedRoles.length === 0 || selectedRoles.includes('STUDENT');

  useEffect(() => {
    if (selectedRoles.length > 0 && !selectedRoles.includes('STUDENT')) {
      setValue('targetSemesters', []);
    }
  }, [selectedRoles, setValue]);

  const previewText = useMemo(() => {
    const roleLabels = {
      SUPER_ADMIN: 'Super Admins',
      COLLEGE_ADMIN: 'College Admins',
      HOD: 'HODs',
      FACULTY: 'Faculty',
      STUDENT: 'Students',
    };

    let rolesStr = 'everyone';
    if (selectedRoles.length > 0) {
      rolesStr = selectedRoles.map((r) => roleLabels[r] || r).join(', ');
    }

    let deptsStr = 'all departments';
    if (selectedDepts.length > 0) {
      const matched = depts.filter((d) => selectedDepts.includes(d._id));
      if (matched.length > 0) {
        deptsStr = matched.map((d) => d.code || d.name).join(', ');
      }
    }

    let semsStr = '';
    if (showSemesters) {
      if (selectedSemesters.length > 0) {
        semsStr = ` (Semesters: ${selectedSemesters.sort().join(', ')})`;
      } else {
        semsStr = ' (all semesters)';
      }
    }

    return `This will be visible to: ${rolesStr} in ${deptsStr}${semsStr}.`;
  }, [selectedRoles, selectedDepts, selectedSemesters, showSemesters, depts]);

  const handleFormSubmit = async (data) => {
    try {
      if (notice?._id) {
        await updateNotice.mutateAsync({ id: notice._id, data });
        showToast('Announcement notice updated successfully.');
      } else {
        await createNotice.mutateAsync(data);
        showToast('Announcement notice created successfully.');
      }
      onSaveSuccess();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save notice.', { severity: 'error' });
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(handleFormSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 4, height: '100%', justifyContent: 'space-between' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontFamily: theme.typography.h1.fontFamily, fontWeight: 800, color: theme.palette.ink[900], mb: 0.5 }}>
            {notice?._id ? 'Edit Announcement Notice' : 'Create Announcement Notice'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Draft, prioritize, and broadcast news to specific nodes.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Box>
            <Typography component="label" htmlFor="notice-title-input" sx={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}>
              Notice Title
            </Typography>
            <TextField
              id="notice-title-input"
              fullWidth
              size="small"
              placeholder="e.g. End Semester Exam registrations"
              {...register('title')}
              error={!!errors.title}
              helperText={errors.title?.message}
            />
          </Box>

          <Box>
            <Typography component="label" htmlFor="notice-content-input" sx={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}>
              Content Body
            </Typography>
            <TextField
              id="notice-content-input"
              fullWidth
              multiline
              rows={4}
              placeholder="Write announcement description here..."
              {...register('content')}
              error={!!errors.content}
              helperText={errors.content?.message}
            />
          </Box>

          <Box>
            <Typography component="label" htmlFor="notice-priority-input" sx={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}>
              Priority Level
            </Typography>
            <Controller
              name="priority"
              control={control}
              render={({ field }) => (
                <TextField {...field} id="notice-priority-input" select fullWidth size="small">
                  <MenuItem value="NORMAL">Normal</MenuItem>
                  <MenuItem value="IMPORTANT">Important</MenuItem>
                  <MenuItem value="URGENT">Urgent</MenuItem>
                </TextField>
              )}
            />
          </Box>

          <Box>
            <Typography component="label" htmlFor="notice-roles-input" sx={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}>
              Target Roles
            </Typography>
            <Controller
              name="targetRoles"
              control={control}
              render={({ field: { value, onChange } }) => (
                <Autocomplete
                  multiple
                  id="notice-roles-input"
                  options={['SUPER_ADMIN', 'COLLEGE_ADMIN', 'HOD', 'FACULTY', 'STUDENT']}
                  getOptionLabel={(option) => option.replace('_', ' ')}
                  value={value}
                  onChange={(_, newValue) => onChange(newValue)}
                  renderInput={(params) => (
                    <TextField {...params} size="small" placeholder="All roles (leave empty to target everyone)" />
                  )}
                />
              )}
            />
          </Box>

          <Box>
            <Typography component="label" htmlFor="notice-depts-input" sx={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}>
              Target Departments
            </Typography>
            <Controller
              name="targetDepartments"
              control={control}
              render={({ field: { value, onChange } }) => (
                <Autocomplete
                  multiple
                  id="notice-depts-input"
                  options={depts.map((d) => d._id)}
                  getOptionLabel={(option) => {
                    const match = depts.find((d) => d._id === option);
                    return match ? `${match.name} (${match.code})` : option;
                  }}
                  value={value}
                  onChange={(_, newValue) => onChange(newValue)}
                  renderInput={(params) => (
                    <TextField {...params} size="small" placeholder="All departments (leave empty for everyone)" />
                  )}
                />
              )}
            />
          </Box>

          {showSemesters && (
            <Box>
              <Typography component="label" htmlFor="notice-sems-input" sx={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}>
                Target Semesters
              </Typography>
              <Controller
                name="targetSemesters"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <Autocomplete
                    multiple
                    id="notice-sems-input"
                    options={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
                    getOptionLabel={(option) => `Semester ${option}`}
                    value={value}
                    onChange={(_, newValue) => onChange(newValue)}
                    renderInput={(params) => (
                      <TextField {...params} size="small" placeholder="All semesters (leave empty for all)" />
                    )}
                  />
                )}
              />
            </Box>
          )}
        </Box>
      </Box>

      <Box sx={{ mt: 3 }}>
        <Alert severity="info" sx={{ mb: 2, fontFamily: theme.typography.body2.fontFamily, fontSize: '0.78rem' }}>
          {previewText}
        </Alert>

        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Button
              fullWidth
              variant="outlined"
              color="primary"
              onClick={handleSubmit((data) => handleFormSubmit({ ...data, status: 'DRAFT' }))}
              sx={{ py: 1, textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}
            >
              Save as Draft
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={handleSubmit((data) => handleFormSubmit({ ...data, status: 'PUBLISHED' }))}
              sx={{
                py: 1,
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: '8px',
                background: theme.palette.primary.gradient || theme.palette.primary.main,
                color: '#ffffff',
              }}
            >
              Publish Notice
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default NoticeBoard;
