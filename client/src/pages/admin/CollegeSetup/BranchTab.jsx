import React, { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Box,
  Button,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Drawer,
  TextField,
  Typography,
  CircularProgress,
  MenuItem,
  useTheme,
  Grid,
  InputAdornment,
  Pagination,
  Chip,
  Tooltip,
} from '@mui/material';
import { EditOutlined, DeleteOutline, SearchOutlined, FilterListOutlined } from '@mui/icons-material';
import {
  useBranchesQuery,
  useCoursesQuery,
  useDepartmentsQuery,
  useSubjectsQuery,
  useCreateBranchMutation,
  useUpdateBranchMutation,
  useDeleteBranchMutation,
} from '../../../queries/collegeQueries';
import ConfirmDeleteModal from '../../../components/common/ConfirmDeleteModal';
import EmptyState from '../../../components/common/EmptyState';
import { useToast } from '../../../contexts/ToastContext';

// Schema for Branch Validation
const branchFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long').max(100, 'Name cannot exceed 100 characters').trim(),
  code: z
    .string()
    .min(2, 'Code must be at least 2 characters')
    .max(10, 'Code cannot exceed 10 characters')
    .trim()
    .toUpperCase(),
  courseId: z
    .string({ required_error: 'Parent course is required' })
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid course ID format'),
  hostingDepartmentId: z.string().optional().nullable(),
});

export const BranchTab = ({ setOnAddClick }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { showToast } = useToast();

  // Search, Filter & Pagination state
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [page, setPage] = useState(0);
  const rowsPerPage = 10;

  // Toggles
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // Queries
  const { data: branches, isLoading: loadingBranches } = useBranchesQuery();
  const { data: courses } = useCoursesQuery();
  const { data: depts } = useDepartmentsQuery();
  const { data: allSubjects } = useSubjectsQuery();

  // Mutations
  const createBranch = useCreateBranchMutation();
  const updateBranch = useUpdateBranchMutation();
  const deleteBranch = useDeleteBranchMutation();

  const isSaving = createBranch.isPending || updateBranch.isPending;

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(branchFormSchema),
    defaultValues: {
      name: '',
      code: '',
      courseId: '',
      hostingDepartmentId: '',
    },
  });

  const watchName = watch('name');
  const watchCode = watch('code');

  // Auto-suggest hosting department in create mode based on branch name/code matching
  useEffect(() => {
    if (!editId && (watchName || watchCode) && depts && depts.length > 0) {
      const nameTokens = (watchName || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((t) => t.length > 1 && !['and', 'of', 'in', 'the', '&'].includes(t));

      const codeStr = (watchCode || '').toUpperCase();

      const match = depts.find((d) => {
        if (codeStr && (d.code === codeStr || codeStr.startsWith(d.code))) {
          return true;
        }
        const dTokens = d.name.toLowerCase().split(/\s+/);
        const overlap = nameTokens.filter((t) => dTokens.includes(t)).length;
        return overlap >= Math.min(2, nameTokens.length);
      });

      if (match) {
        setValue('hostingDepartmentId', match._id);
      }
    }
  }, [watchName, watchCode, depts, editId, setValue]);

  // Register the create trigger with setup hub parent container
  useEffect(() => {
    if (setOnAddClick) {
      setOnAddClick(() => handleOpenCreate);
    }
    return () => {
      if (setOnAddClick) {
        setOnAddClick(null);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setOnAddClick]);

  const handleOpenCreate = () => {
    setEditId(null);
    reset({
      name: '',
      code: '',
      courseId: '',
      hostingDepartmentId: '',
    });
    setDrawerOpen(true);
  };

  const handleOpenEdit = (branch) => {
    setEditId(branch._id);
    reset({
      name: branch.name,
      code: branch.code,
      courseId: typeof branch.courseId === 'object' ? branch.courseId._id : branch.courseId || '',
      hostingDepartmentId: typeof branch.hostingDepartmentId === 'object' ? branch.hostingDepartmentId._id : branch.hostingDepartmentId || '',
    });
    setDrawerOpen(true);
  };

  const onSubmit = async (data) => {
    try {
      if (editId) {
        await updateBranch.mutateAsync({ id: editId, data });
        showToast('Branch updated successfully.');
      } else {
        await createBranch.mutateAsync(data);
        showToast('Branch created successfully.');
      }
      setDrawerOpen(false);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save branch.', { severity: 'error' });
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteId) {
      try {
        await deleteBranch.mutateAsync(deleteId);
        showToast('Branch deleted successfully.');
        setDeleteId(null);
      } catch (err) {
        showToast(err.response?.data?.message || 'Failed to delete branch.', { severity: 'error' });
      }
    }
  };

  // Dependency Guard for Branch deletion
  const getDeleteWarningMessage = () => {
    if (!deleteId) return null;
    const linkedSubs = allSubjects?.filter(s => String(s.branchId?._id || s.branchId) === String(deleteId));
    if (linkedSubs && linkedSubs.length > 0) {
      return `⚠️ Warning: This branch has ${linkedSubs.length} subject(s) assigned under it. Deleting it will impact dependent curriculum data.`;
    }
    return null;
  };

  // Filter branches by search input & department
  const filteredBranches = useMemo(() => {
    return (
      branches?.filter((b) => {
        const matchesSearch =
          !search ||
          b.name.toLowerCase().includes(search.toLowerCase()) ||
          b.code.toLowerCase().includes(search.toLowerCase());
        const deptId = typeof b.hostingDepartmentId === 'object' ? b.hostingDepartmentId?._id : b.hostingDepartmentId;
        const matchesDept = !filterDept || String(deptId) === String(filterDept);
        return matchesSearch && matchesDept;
      }) || []
    );
  }, [branches, search, filterDept]);

  const paginatedBranches = useMemo(() => {
    return filteredBranches.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
  }, [filteredBranches, page, rowsPerPage]);

  const totalPages = Math.ceil((filteredBranches.length || 0) / rowsPerPage);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* 1. Search & Filter Bar */}
      {branches && branches.length > 0 && (
        <Card
          sx={{
            p: 2,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: 'none',
            borderRadius: '12px',
            bgcolor: theme.custom?.surface?.raised || theme.palette.background.paper,
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={search || filterDept ? 5 : 7} md={search || filterDept ? 5 : 7}>
              <TextField
                size="small"
                placeholder="Search branches by name or code..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchOutlined sx={{ fontSize: 20, color: theme.palette.text.secondary }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} sm={search || filterDept ? 5 : 5} md={search || filterDept ? 5 : 5}>
              <TextField
                select
                fullWidth
                size="small"
                value={filterDept}
                onChange={(e) => {
                  setFilterDept(e.target.value);
                  setPage(0);
                }}
                label="Filter by Department"
              >
                <MenuItem value="">All Departments</MenuItem>
                {depts?.map((d) => (
                  <MenuItem key={d._id} value={d._id}>
                    {d.name} ({d.code})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {(search || filterDept) && (
              <Grid item xs={12} sm={2} md={2}>
                <Button
                  fullWidth
                  size="small"
                  variant="outlined"
                  startIcon={<FilterListOutlined />}
                  onClick={() => {
                    setSearch('');
                    setFilterDept('');
                    setPage(0);
                  }}
                  sx={{ textTransform: 'none', fontWeight: 600, height: '40px' }}
                >
                  Reset
                </Button>
              </Grid>
            )}
          </Grid>
        </Card>
      )}

      {/* 2. List Table Container */}
      {loadingBranches ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={32} sx={{ color: theme.palette.primary.main }} />
        </Box>
      ) : !branches || branches.length === 0 ? (
        <EmptyState
          type="branches"
          title="No Academic Branches Configured"
          description="Create a branch under a parent degree course to manage curriculum streams."
          actionText="Add Branch"
          onAction={handleOpenCreate}
        />
      ) : filteredBranches?.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center', borderRadius: '12px', border: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
            No branches match your search &quot;{search}&quot;.
          </Typography>
        </Card>
      ) : (
        <TableContainer component={Card} sx={{ border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', borderRadius: '12px' }}>
          <Table aria-label="branches directory table">
            <TableHead sx={{ bgcolor: theme.custom?.surface?.sunken || 'rgba(28, 46, 69, 0.02)' }}>
              <TableRow>
                <TableCell sx={{ fontFamily: theme.typography.body2.fontFamily, fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>
                  CODE
                </TableCell>
                <TableCell sx={{ fontFamily: theme.typography.body2.fontFamily, fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>
                  NAME
                </TableCell>
                <TableCell sx={{ fontFamily: theme.typography.body2.fontFamily, fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>
                  PARENT DEGREE COURSE
                </TableCell>
                <TableCell sx={{ fontFamily: theme.typography.body2.fontFamily, fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>
                  HOSTING DEPT
                </TableCell>
                <TableCell align="right" sx={{ fontFamily: theme.typography.body2.fontFamily, fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>
                  ACTIONS
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedBranches.map((branch, index) => {
                const parentCourseName = branch.courseId?.name
                  ? `${branch.courseId.name} (${branch.courseId.code})`
                  : '—';
                const hostingDeptName = branch.hostingDepartmentId?.name
                  ? `${branch.hostingDepartmentId.name} (${branch.hostingDepartmentId.code})`
                  : 'Unassigned';
                return (
                  <TableRow
                    key={branch._id}
                    className="staggered-row"
                    style={{ animationDelay: `${index * 25}ms` }}
                    sx={{
                      '&:hover': {
                        bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(79, 70, 229, 0.03)',
                      },
                    }}
                  >
                    <TableCell>
                      <Chip
                        label={branch.code}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{
                          fontFamily: theme.typography.mono?.fontFamily || 'monospace',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          borderRadius: '6px',
                          bgcolor: `${theme.palette.primary.main}0D`,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.9rem' }}>
                        {branch.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={parentCourseName}
                        size="small"
                        sx={{
                          fontSize: '0.74rem',
                          fontWeight: 600,
                          borderRadius: '6px',
                          bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      {branch.hostingDepartmentId ? (
                        <Chip
                          label={hostingDeptName}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.74rem',
                            bgcolor: isDark ? 'rgba(79, 70, 229, 0.15)' : 'rgba(79, 70, 229, 0.08)',
                            color: 'primary.main',
                            borderRadius: '8px',
                          }}
                        />
                      ) : (
                        <Chip
                          label="Unassigned"
                          size="small"
                          variant="outlined"
                          sx={{
                            fontSize: '0.72rem',
                            color: 'text.secondary',
                            borderStyle: 'dashed',
                            fontWeight: 600,
                          }}
                        />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.75 }}>
                        <Tooltip title="Edit Branch" arrow>
                          <IconButton
                            aria-label="edit branch"
                            size="small"
                            onClick={() => handleOpenEdit(branch)}
                            sx={{
                              color: 'text.secondary',
                              borderRadius: '8px',
                              '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' },
                            }}
                          >
                            <EditOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Branch" arrow>
                          <IconButton
                            aria-label="delete branch"
                            size="small"
                            onClick={() => setDeleteId(branch._id)}
                            sx={{
                              color: theme.palette.signal?.error || '#ef4444',
                              borderRadius: '8px',
                              '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)' },
                            }}
                          >
                            <DeleteOutline fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: 'center',
                justify: 'space-between',
                gap: 2,
                px: 3,
                py: 2,
                borderTop: `1px solid ${theme.palette.divider}`,
                bgcolor: theme.custom?.surface?.sunken || 'rgba(28, 46, 69, 0.02)',
              }}
            >
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontWeight: 500, fontSize: '0.82rem' }}>
                Showing <strong>{page * rowsPerPage + 1}–{Math.min(filteredBranches.length, (page + 1) * rowsPerPage)}</strong> of <strong>{filteredBranches.length}</strong> branches
              </Typography>

              <Pagination
                count={totalPages}
                page={page + 1}
                onChange={(_e, newPage) => setPage(newPage - 1)}
                color="primary"
                shape="rounded"
                size="medium"
                showFirstButton
                showLastButton
                sx={{
                  ml: { xs: 0, sm: 'auto' },
                  '& .MuiPaginationItem-root': {
                    fontFamily: theme.typography.body2.fontFamily,
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    borderRadius: '8px',
                  },
                  '& .MuiPaginationItem-page.Mui-selected': {
                    background: theme.palette.primary.gradient || theme.palette.primary.main,
                    color: '#ffffff',
                    fontWeight: 700,
                    boxShadow: `0 2px 8px ${theme.palette.primary.main}40`,
                  },
                }}
              />
            </Box>
          )}
        </TableContainer>
      )}

      {/* Slide Drawer Form Container */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 420 }, p: 4, bgcolor: theme.palette.background.paper } }}
      >
        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 4.5, height: '100%', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
            <Box>
              <Typography variant="h5" sx={{ fontFamily: theme.typography.h1.fontFamily, fontWeight: 700, color: theme.palette.ink[900], mb: 0.5 }}>
                {editId ? 'Modify Branch' : 'Create Branch'}
              </Typography>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                {editId ? 'Update details of the branch stream.' : 'Setup a new academic branch under a parent course.'}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box>
                <Typography component="label" htmlFor="branch-name-input" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}>
                  Branch Name
                </Typography>
                <TextField
                  id="branch-name-input"
                  fullWidth
                  placeholder="e.g. Computer Science Engineering"
                  {...register('name')}
                  error={!!errors.name}
                  helperText={errors.name?.message}
                  size="small"
                />
              </Box>

              <Box>
                <Typography component="label" htmlFor="branch-code-input" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}>
                  Branch Code
                </Typography>
                <TextField
                  id="branch-code-input"
                  fullWidth
                  placeholder="e.g. CSE"
                  disabled={!!editId}
                  {...register('code')}
                  error={!!errors.code}
                  helperText={errors.code?.message}
                  size="small"
                  inputProps={{ style: { textTransform: 'uppercase' } }}
                />
              </Box>

              <Box>
                <Typography component="label" htmlFor="parent-course-input" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}>
                  Parent Course
                </Typography>
                <Controller
                  name="courseId"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      id="parent-course-input"
                      select
                      fullWidth
                      error={!!errors.courseId}
                      helperText={errors.courseId?.message}
                      size="small"
                    >
                      <MenuItem value="">Select Parent Course...</MenuItem>
                      {courses?.map((course) => (
                        <MenuItem key={course._id} value={course._id}>
                          {course.name} ({course.code})
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Box>

              <Box>
                <Typography component="label" htmlFor="hosting-dept-input" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}>
                  Hosting Department (Default / Home Dept)
                </Typography>
                <Controller
                  name="hostingDepartmentId"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      id="hosting-dept-input"
                      select
                      fullWidth
                      error={!!errors.hostingDepartmentId}
                      helperText={errors.hostingDepartmentId?.message || 'Auto-suggested from branch name, overridable'}
                      size="small"
                    >
                      <MenuItem value="">Select Hosting Department...</MenuItem>
                      {depts?.map((dept) => (
                        <MenuItem key={dept._id} value={dept._id}>
                          {dept.name} ({dept.code})
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => setDrawerOpen(false)}
              sx={{ color: theme.palette.text.secondary, borderColor: theme.palette.divider, fontWeight: 600 }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={isSaving}
              sx={{
                background: theme.palette.primary.gradient || theme.palette.primary.main,
                color: '#ffffff',
                fontWeight: 700,
                boxShadow: `0 4px 14px ${theme.palette.primary.main}35`,
              }}
            >
              {isSaving ? 'Saving...' : editId ? 'Update Branch' : 'Create Branch'}
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* Confirmation Modal with Dependency Warning */}
      <ConfirmDeleteModal
        open={Boolean(deleteId)}
        title="Delete Branch"
        actionText="Delete Branch"
        description={
          getDeleteWarningMessage() ||
          "Are you sure you want to delete this branch? This action cannot be undone if subjects or students are associated with it."
        }
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        isDeleting={deleteBranch.isPending}
      />
    </Box>
  );
};

export default BranchTab;
