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
} from '@mui/material';
import { MoreVertOutlined, AddOutlined } from '@mui/icons-material';
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
  expiresAt: z.string().optional().or(z.null()).or(z.literal('')),
});

const NoticeBoard = () => {
  const theme = useTheme();

  // Filter and search state
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Drawer / Action State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeNoticeId, setActiveNoticeId] = useState(null);
  const [archiveId, setArchiveId] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedNotice, setSelectedNotice] = useState(null);

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

  const handleArchiveConfirm = async () => {
    if (archiveId) {
      await archiveNotice.mutateAsync(archiveId);
      setArchiveId(null);
    }
  };

  const handleOpenArchive = (notice) => {
    setArchiveId(notice._id);
    handleMenuClose();
  };

  const handleRestoreNotice = async (notice) => {
    try {
      await updateNotice.mutateAsync({ id: notice._id, data: { status: 'DRAFT' } });
      handleMenuClose();
    } catch (err) {
      // Handled globally
    }
  };

  const getPriorityLabelStyle = (priority) => {
    switch (priority) {
      case 'URGENT':
        return {
          bgcolor: 'rgba(239, 68, 68, 0.1)',
          color: theme.palette.signal.error,
        };
      case 'IMPORTANT':
        return {
          bgcolor: 'rgba(245, 158, 11, 0.1)',
          color: 'rgb(217, 119, 6)',
        };
      case 'NORMAL':
      default:
        return {
          bgcolor: 'rgba(107, 114, 128, 0.1)',
          color: theme.palette.text.secondary,
        };
    }
  };

  const getStatusLabelStyle = (status) => {
    switch (status) {
      case 'PUBLISHED':
        return {
          bgcolor: 'rgba(16, 185, 129, 0.1)',
          color: theme.palette.signal.success,
        };
      case 'DRAFT':
        return {
          bgcolor: 'rgba(59, 130, 246, 0.1)',
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
    <Box sx={{ p: 4 }}>
      {/* 1. Header Toolbar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4.5 }}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: theme.typography.h1.fontFamily, fontWeight: 800, color: theme.palette.ink[900], mb: 0.5 }}>
            Notice Board Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Publish, edit, and target critical notices to students, faculty, or departments.
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddOutlined />}
          onClick={handleOpenCreate}
          sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700 }}
        >
          Create Notice
        </Button>
      </Box>

      {/* 2. Filters & Searches */}
      <Card sx={{ p: 2.5, mb: 3.5, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', borderRadius: '12px' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search notices by title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              select
              size="small"
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="DRAFT">DRAFT</MenuItem>
              <MenuItem value="PUBLISHED">PUBLISHED</MenuItem>
              <MenuItem value="ARCHIVED">ARCHIVED</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              select
              size="small"
              label="Priority"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <MenuItem value="">All Priorities</MenuItem>
              <MenuItem value="NORMAL">NORMAL</MenuItem>
              <MenuItem value="IMPORTANT">IMPORTANT</MenuItem>
              <MenuItem value="URGENT">URGENT</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Card>

      {/* 3. Main Data Table */}
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
          <TableContainer component={Card} sx={{ border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', borderRadius: '12px' }}>
            <Table aria-label="Notices configuration table">
              <TableHead sx={{ bgcolor: 'rgba(28, 46, 69, 0.02)' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>TITLE</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>PRIORITY</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>STATUS</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>TARGETED TO</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>PUBLISHED DATE</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>ACTIONS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {noticesData.data.map((notice) => (
                  <TableRow key={notice._id} sx={{ '&:hover': { bgcolor: theme.custom.interaction.hoverTint } }}>
                    <TableCell sx={{ fontWeight: 600 }}>{notice.title}</TableCell>
                    <TableCell>
                      <Chip
                        label={notice.priority}
                        size="small"
                        sx={{
                          ...getPriorityLabelStyle(notice.priority),
                          fontWeight: 700,
                          fontSize: '0.68rem',
                          borderRadius: '6px',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={notice.status}
                        size="small"
                        sx={{
                          ...getStatusLabelStyle(notice.status),
                          fontWeight: 700,
                          fontSize: '0.68rem',
                          borderRadius: '6px',
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.82rem' }}>{getAudienceSummary(notice)}</TableCell>
                    <TableCell sx={{ fontSize: '0.82rem', color: theme.palette.text.secondary }}>
                      {notice.publishedAt ? new Date(notice.publishedAt).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={(e) => handleMenuOpen(e, notice)}>
                        <MoreVertOutlined fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

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
        <MenuItem onClick={() => handleOpenEdit(selectedNotice)}>Edit Notice</MenuItem>
        {selectedNotice?.status === 'ARCHIVED' ? (
          <MenuItem onClick={() => handleRestoreNotice(selectedNotice)}>Restore to Draft</MenuItem>
        ) : (
          <MenuItem onClick={() => handleOpenArchive(selectedNotice)} sx={{ color: theme.palette.signal.error }}>
            Archive
          </MenuItem>
        )}
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
      expiresAt: notice?.expiresAt ? new Date(notice.expiresAt).toISOString().split('T')[0] : '',
    },
  });

  const selectedRoles = watch('targetRoles');
  const selectedDepts = watch('targetDepartments');
  const selectedSemesters = watch('targetSemesters');

  // Progressive disclosure for semesters autocomplete:
  // Render if student role is selected, or if targetRoles is empty (means all roles, hence includes student).
  const showSemesters = selectedRoles.length === 0 || selectedRoles.includes('STUDENT');

  // Clear semesters if student role is deselected
  useEffect(() => {
    if (selectedRoles.length > 0 && !selectedRoles.includes('STUDENT')) {
      setValue('targetSemesters', []);
    }
  }, [selectedRoles, setValue]);

  // Compute dynamic audience summary preview
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
    const payload = {
      ...data,
      expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString() : null,
    };

    try {
      if (notice?._id) {
        await updateNotice.mutateAsync({ id: notice._id, data: payload });
      } else {
        await createNotice.mutateAsync(payload);
      }
      onSaveSuccess();
    } catch (err) {
      // Handled globally
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(handleFormSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 4, height: '100%', justifyContent: 'space-between' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontFamily: theme.typography.h1.fontFamily, fontWeight: 800, color: theme.palette.ink[900], mb: 0.5 }}>
            {notice?._id ? 'Edit announcement Notice' : 'Create announcements Notice'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Draft, prioritize, and broadcast news to specific nodes.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Title */}
          <Box>
            <Typography component="label" sx={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}>
              Notice Title
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="e.g. End Semester Exam registrations"
              {...register('title')}
              error={!!errors.title}
              helperText={errors.title?.message}
            />
          </Box>

          {/* Content */}
          <Box>
            <Typography component="label" sx={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}>
              Content Body
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder="Write announcement description here..."
              {...register('content')}
              error={!!errors.content}
              helperText={errors.content?.message}
            />
          </Box>

          {/* Priority */}
          <Box>
            <Typography component="label" sx={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}>
              Priority level
            </Typography>
            <Controller
              name="priority"
              control={control}
              render={({ field }) => (
                <TextField {...field} select fullWidth size="small">
                  <MenuItem value="NORMAL">Normal</MenuItem>
                  <MenuItem value="IMPORTANT">Important</MenuItem>
                  <MenuItem value="URGENT">Urgent</MenuItem>
                </TextField>
              )}
            />
          </Box>

          {/* Target Roles */}
          <Box>
            <Typography component="label" sx={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}>
              Target roles
            </Typography>
            <Controller
              name="targetRoles"
              control={control}
              render={({ field: { value, onChange } }) => (
                <Autocomplete
                  multiple
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

          {/* Target Departments */}
          <Box>
            <Typography component="label" sx={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}>
              Target Departments
            </Typography>
            <Controller
              name="targetDepartments"
              control={control}
              render={({ field: { value, onChange } }) => (
                <Autocomplete
                  multiple
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

          {/* Target Semesters (Student-only progressive disclosure) */}
          {showSemesters && (
            <Box>
              <Typography component="label" sx={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}>
                Target semesters
              </Typography>
              <Controller
                name="targetSemesters"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <Autocomplete
                    multiple
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

          {/* Expiry Date */}
          <Box>
            <Typography component="label" sx={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}>
              Expiry Date (Optional)
            </Typography>
            <TextField
              type="date"
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
              {...register('expiresAt')}
              error={!!errors.expiresAt}
              helperText={errors.expiresAt?.message}
            />
          </Box>
        </Box>
      </Box>

      {/* Live Preview & Buttons */}
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
              sx={{ py: 1, textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}
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
