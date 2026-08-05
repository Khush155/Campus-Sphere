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
  Grid,
  InputAdornment,
} from '@mui/material';
import { EditOutlined, DeleteOutline, SearchOutlined } from '@mui/icons-material';
import {
  useCoursesQuery,
  useBranchesQuery,
  useCreateCourseMutation,
  useUpdateCourseMutation,
  useDeleteCourseMutation,
} from '../../../queries/collegeQueries';
import ConfirmDeleteModal from '../../../components/common/ConfirmDeleteModal';
import EmptyState from '../../../components/common/EmptyState';
import { useToast } from '../../../contexts/ToastContext';

// Schema for Course Validation
const courseFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long').max(100, 'Name cannot exceed 100 characters').trim(),
  code: z
    .string()
    .min(2, 'Code must be at least 2 characters')
    .max(10, 'Code cannot exceed 10 characters')
    .trim()
    .toUpperCase(),
  durationYears: z
    .number()
    .min(1, 'Duration must be at least 1 year')
    .max(6, 'Duration cannot exceed 6 years'),
  semesters: z
    .number()
    .min(1, 'Semesters count must be at least 1'),
});

export const CourseTab = ({ setOnAddClick }) => {
  const theme = useTheme();
  const { showToast } = useToast();

  // Search state
  const [search, setSearch] = useState('');

  // Toggles
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // Queries
  const { data: courses, isLoading } = useCoursesQuery();
  const { data: branches } = useBranchesQuery();

  // Mutations
  const createCourse = useCreateCourseMutation();
  const updateCourse = useUpdateCourseMutation();
  const deleteCourse = useDeleteCourseMutation();

  const isSaving = createCourse.isPending || updateCourse.isPending;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      name: '',
      code: '',
      durationYears: 4,
      semesters: 8,
    },
  });

  const durationValue = watch('durationYears');

  // Auto-calculate semesters: 2 semesters per year
  useEffect(() => {
    if (durationValue) {
      setValue('semesters', Number(durationValue) * 2);
    }
  }, [durationValue, setValue]);

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
      durationYears: 4,
      semesters: 8,
    });
    setDrawerOpen(true);
  };

  const handleOpenEdit = (course) => {
    setEditId(course._id);
    reset({
      name: course.name,
      code: course.code,
      durationYears: course.durationYears || 4,
      semesters: course.semesters || 8,
    });
    setDrawerOpen(true);
  };

  const onSubmit = async (data) => {
    try {
      if (editId) {
        await updateCourse.mutateAsync({ id: editId, data });
        showToast('Degree course details updated successfully.');
      } else {
        await createCourse.mutateAsync(data);
        showToast('Degree course created successfully.');
      }
      setDrawerOpen(false);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save course.', { severity: 'error' });
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteId) {
      try {
        await deleteCourse.mutateAsync(deleteId);
        showToast('Degree course deleted successfully.');
        setDeleteId(null);
      } catch (err) {
        showToast(err.response?.data?.message || 'Failed to delete course.', { severity: 'error' });
      }
    }
  };

  // Dependency Guard for Course deletion
  const getDeleteWarningMessage = () => {
    if (!deleteId) return null;
    const linkedBranches = branches?.filter(b => String(b.courseId?._id || b.courseId) === String(deleteId));
    if (linkedBranches && linkedBranches.length > 0) {
      return `⚠️ Warning: This degree course has ${linkedBranches.length} academic branch(es) registered under it (${linkedBranches.map(b => b.code).join(', ')}). Deleting it will impact dependent branches.`;
    }
    return null;
  };

  // Filter courses by search input
  const filteredCourses = courses?.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* 1. Search Bar */}
      {courses && courses.length > 0 && (
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
            placeholder="Search degree courses by name or code..."
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

      {/* 2. List Grid Container */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={32} sx={{ color: theme.palette.primary.main }} />
        </Box>
      ) : !courses || courses.length === 0 ? (
        <EmptyState
          type="courses"
          title="No Degree Courses Configured"
          description="Create a degree course structure (e.g. B.Tech, M.Tech, MCA) to define academic programs."
          actionText="Add Course"
          onAction={handleOpenCreate}
        />
      ) : filteredCourses?.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center', borderRadius: '12px', border: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
            No degree courses match your search &quot;{search}&quot;.
          </Typography>
        </Card>
      ) : (
        <TableContainer component={Card} sx={{ border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', borderRadius: '12px' }}>
          <Table aria-label="courses directory table">
            <TableHead sx={{ bgcolor: theme.custom?.surface?.sunken || 'rgba(28, 46, 69, 0.02)' }}>
              <TableRow>
                <TableCell sx={{ fontFamily: theme.typography.body2.fontFamily, fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>
                  CODE
                </TableCell>
                <TableCell sx={{ fontFamily: theme.typography.body2.fontFamily, fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>
                  DEGREE NAME
                </TableCell>
                <TableCell sx={{ fontFamily: theme.typography.body2.fontFamily, fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>
                  DURATION
                </TableCell>
                <TableCell sx={{ fontFamily: theme.typography.body2.fontFamily, fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>
                  SEMESTERS COUNT
                </TableCell>
                <TableCell align="right" sx={{ fontFamily: theme.typography.body2.fontFamily, fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>
                  ACTIONS
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCourses.map((course, index) => (
                <TableRow
                  key={course._id}
                  className="staggered-row"
                  style={{ animationDelay: `${index * 25}ms` }}
                  sx={{ '&:hover': { bgcolor: theme.custom?.interaction?.hoverTint || 'rgba(0,0,0,0.02)' } }}
                >
                  <TableCell sx={{ fontFamily: theme.typography.mono.fontFamily, fontSize: '0.78rem', fontWeight: 600 }}>
                    {course.code}
                  </TableCell>
                  <TableCell sx={{ fontFamily: theme.typography.body1.fontFamily, fontSize: '0.88rem', fontWeight: 600 }}>
                    {course.name}
                  </TableCell>
                  <TableCell sx={{ fontFamily: theme.typography.body2.fontFamily, fontSize: '0.82rem' }}>
                    {course.durationYears} {course.durationYears === 1 ? 'Year' : 'Years'}
                  </TableCell>
                  <TableCell sx={{ fontFamily: theme.typography.mono.fontFamily, fontSize: '0.82rem', fontWeight: 600 }}>
                    {course.semesters || course.durationYears * 2} Semesters
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      <IconButton aria-label="edit course" size="small" onClick={() => handleOpenEdit(course)}>
                        <EditOutlined fontSize="small" sx={{ color: theme.palette.text.secondary }} />
                      </IconButton>
                      <IconButton aria-label="delete course" size="small" onClick={() => setDeleteId(course._id)}>
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
                {editId ? 'Modify Degree Course' : 'Create Degree Course'}
              </Typography>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                {editId ? 'Update details of the degree program.' : 'Setup a new academic degree course.'}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box>
                <Typography component="label" htmlFor="course-name-input" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}>
                  Degree Course Name
                </Typography>
                <TextField
                  id="course-name-input"
                  fullWidth
                  placeholder="e.g. Bachelor of Technology"
                  {...register('name')}
                  error={!!errors.name}
                  helperText={errors.name?.message}
                  size="small"
                />
              </Box>

              <Box>
                <Typography component="label" htmlFor="course-code-input" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}>
                  Course Code
                </Typography>
                <TextField
                  id="course-code-input"
                  fullWidth
                  placeholder="e.g. BTECH"
                  disabled={!!editId}
                  {...register('code')}
                  error={!!errors.code}
                  helperText={errors.code?.message}
                  size="small"
                  inputProps={{ style: { textTransform: 'uppercase' } }}
                />
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography component="label" htmlFor="duration-input" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}>
                    Duration (Years)
                  </Typography>
                  <TextField
                    id="duration-input"
                    select
                    fullWidth
                    {...register('durationYears', { valueAsNumber: true })}
                    error={!!errors.durationYears}
                    helperText={errors.durationYears?.message}
                    size="small"
                  >
                    {[1, 2, 3, 4, 5, 6].map((yrs) => (
                      <MenuItem key={yrs} value={yrs}>
                        {yrs} {yrs === 1 ? 'Year' : 'Years'}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={6}>
                  <Typography component="label" htmlFor="semesters-input" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}>
                    Total Semesters
                  </Typography>
                  <TextField
                    id="semesters-input"
                    type="number"
                    fullWidth
                    disabled
                    {...register('semesters', { valueAsNumber: true })}
                    error={!!errors.semesters}
                    helperText={errors.semesters?.message}
                    size="small"
                  />
                </Grid>
              </Grid>
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
              {isSaving ? 'Saving...' : editId ? 'Update Course' : 'Create Course'}
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* Confirmation Modal with Dependency Warning */}
      <ConfirmDeleteModal
        open={Boolean(deleteId)}
        title="Delete Degree Course"
        description={
          getDeleteWarningMessage() ||
          "Are you sure you want to delete this degree course? This action cannot be undone if branches or students are associated with it."
        }
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        isDeleting={deleteCourse.isPending}
      />
    </Box>
  );
};

export default CourseTab;
