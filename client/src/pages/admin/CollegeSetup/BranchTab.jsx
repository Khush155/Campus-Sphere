import React, { useState, useEffect } from 'react';
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
  InputAdornment,
} from '@mui/material';
import { EditOutlined, DeleteOutline, SearchOutlined } from '@mui/icons-material';
import {
  useBranchesQuery,
  useCoursesQuery,
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
});

export const BranchTab = ({ setOnAddClick }) => {
  const theme = useTheme();
  const { showToast } = useToast();

  // Search state
  const [search, setSearch] = useState('');

  // Toggles
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // Queries
  const { data: branches, isLoading: loadingBranches } = useBranchesQuery();
  const { data: courses } = useCoursesQuery();
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
    formState: { errors },
  } = useForm({
    resolver: zodResolver(branchFormSchema),
    defaultValues: {
      name: '',
      code: '',
      courseId: '',
    },
  });

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
    });
    setDrawerOpen(true);
  };

  const handleOpenEdit = (branch) => {
    setEditId(branch._id);
    reset({
      name: branch.name,
      code: branch.code,
      courseId: typeof branch.courseId === 'object' ? branch.courseId._id : branch.courseId || '',
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

  // Filter branches by search input
  const filteredBranches = branches?.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* 1. Search Bar */}
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
          <TextField
            size="small"
            placeholder="Search branches by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlined sx={{ fontSize: 20, color: theme.palette.text.secondary }} />
                </InputAdornment>
              ),
            }}
          />
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
                <TableCell align="right" sx={{ fontFamily: theme.typography.body2.fontFamily, fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>
                  ACTIONS
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredBranches.map((branch, index) => {
                const parentCourseName = branch.courseId?.name
                  ? `${branch.courseId.name} (${branch.courseId.code})`
                  : '—';
                return (
                  <TableRow
                    key={branch._id}
                    className="staggered-row"
                    style={{ animationDelay: `${index * 25}ms` }}
                    sx={{ '&:hover': { bgcolor: theme.custom?.interaction?.hoverTint || 'rgba(0,0,0,0.02)' } }}
                  >
                    <TableCell sx={{ fontFamily: theme.typography.mono.fontFamily, fontSize: '0.78rem', fontWeight: 600 }}>
                      {branch.code}
                    </TableCell>
                    <TableCell sx={{ fontFamily: theme.typography.body1.fontFamily, fontSize: '0.88rem', fontWeight: 600 }}>
                      {branch.name}
                    </TableCell>
                    <TableCell sx={{ fontFamily: theme.typography.body2.fontFamily, fontSize: '0.82rem', color: theme.palette.text.primary }}>
                      {parentCourseName}
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <IconButton aria-label="edit branch" size="small" onClick={() => handleOpenEdit(branch)}>
                          <EditOutlined fontSize="small" sx={{ color: theme.palette.text.secondary }} />
                        </IconButton>
                        <IconButton aria-label="delete branch" size="small" onClick={() => setDeleteId(branch._id)}>
                          <DeleteOutline fontSize="small" sx={{ color: theme.palette.signal.error }} />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
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
