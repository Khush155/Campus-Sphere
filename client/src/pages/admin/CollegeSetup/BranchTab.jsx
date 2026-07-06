import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
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
} from '@mui/material';
import { EditOutlined, DeleteOutline } from '@mui/icons-material';
import {
  useBranchesQuery,
  useCoursesQuery,
  useCreateBranchMutation,
  useUpdateBranchMutation,
  useDeleteBranchMutation,
} from '../../../queries/collegeQueries';
import ConfirmDeleteModal from '../../../components/common/ConfirmDeleteModal';
import EmptyState from '../../../components/common/EmptyState';

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

  // Toggles
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // Queries
  const { data: branches, isLoading: loadingBranches } = useBranchesQuery();
  const { data: courses, isLoading: loadingCourses } = useCoursesQuery();

  // Mutations
  const createBranch = useCreateBranchMutation();
  const updateBranch = useUpdateBranchMutation();
  const deleteBranch = useDeleteBranchMutation();

  const isSaving = createBranch.isPending || updateBranch.isPending;

  const {
    register,
    handleSubmit,
    reset,
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
      courseId: branch.courseId?._id || branch.courseId || '',
    });
    setDrawerOpen(true);
  };

  const onSubmit = async (data) => {
    try {
      if (editId) {
        await updateBranch.mutateAsync({ id: editId, data });
      } else {
        await createBranch.mutateAsync(data);
      }
      setDrawerOpen(false);
    } catch (err) {
      // Handled globally
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteId) {
      await deleteBranch.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <Box>
      {/* 2. List Grid Table */}
      {loadingBranches || loadingCourses ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={32} sx={{ color: theme.palette.primary.main }} />
        </Box>
      ) : !branches || branches.length === 0 ? (
        <EmptyState
          type="branches"
          title="No Branches Configured"
          description="Map specialization branches (e.g. CSE, ECE) to parent degree programs."
          actionText="Add Branch"
          onAction={handleOpenCreate}
        />
      ) : (
        <TableContainer component={Card} sx={{ border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', borderRadius: '12px' }}>
          <Table aria-label="branches catalog table">
            <TableHead sx={{ bgcolor: 'rgba(28, 46, 69, 0.02)' }}>
              <TableRow>
                <TableCell sx={{ fontFamily: theme.typography.body2.fontFamily, fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>
                  BRANCH CODE
                </TableCell>
                <TableCell sx={{ fontFamily: theme.typography.body2.fontFamily, fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>
                  BRANCH NAME
                </TableCell>
                <TableCell sx={{ fontFamily: theme.typography.body2.fontFamily, fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>
                  PARENT PROGRAM
                </TableCell>
                <TableCell align="right" sx={{ fontFamily: theme.typography.body2.fontFamily, fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>
                  ACTIONS
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {branches.map((branch, index) => (
                <TableRow
                  key={branch._id}
                  className="staggered-row"
                  style={{ animationDelay: `${index * 25}ms` }}
                  sx={{ '&:hover': { bgcolor: theme.custom.interaction.hoverTint } }}
                >
                  <TableCell sx={{ fontFamily: theme.typography.mono.fontFamily, fontSize: '0.78rem', fontWeight: 600 }}>
                    {branch.code}
                  </TableCell>
                  <TableCell sx={{ fontFamily: theme.typography.body1.fontFamily, fontSize: '0.88rem', fontWeight: 600 }}>
                    {branch.name}
                  </TableCell>
                  <TableCell sx={{ fontFamily: theme.typography.body2.fontFamily, fontSize: '0.85rem' }}>
                    {branch.courseId?.name || '—'} ({branch.courseId?.code || 'N/A'})
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
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* 3. Slide Drawer form container */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 400 }, p: 4, bgcolor: theme.palette.background.paper } }}
      >
        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 4.5, height: '100%', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
            <Box>
              <Typography variant="h5" sx={{ fontFamily: theme.typography.h1.fontFamily, fontWeight: 700, color: theme.palette.ink[900], mb: 0.5 }}>
                {editId ? 'Modify Branch' : 'Create Branch'}
              </Typography>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                {editId ? 'Update details of the branch specialization.' : 'Link a new specialization to a degree course.'}
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
                  placeholder="e.g. Computer Science & Eng."
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
                <TextField
                  id="parent-course-input"
                  select
                  fullWidth
                  {...register('courseId')}
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
                bgcolor: theme.palette.primary.main,
                color: theme.palette.ink[900],
                fontWeight: 700,
                '&:hover': { bgcolor: theme.palette.primary.light },
              }}
            >
              {isSaving ? 'Saving...' : editId ? 'Update' : 'Create'}
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* 4. Delete Modal Confirmation */}
      <ConfirmDeleteModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Branch"
        description="Are you sure you want to delete this branch? This action is permanent and might fail if subjects are linked to it."
        actionText="Delete"
        typedConfirmation
        confirmationWord="DELETE"
      />
    </Box>
  );
};

export default BranchTab;
