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
  useCoursesQuery,
  useCreateCourseMutation,
  useUpdateCourseMutation,
  useDeleteCourseMutation,
} from '../../../queries/collegeQueries';
import ConfirmDeleteModal from '../../../components/common/ConfirmDeleteModal';
import EmptyState from '../../../components/common/EmptyState';

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

  // Toggles
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // Queries
  const { data: courses, isLoading } = useCoursesQuery();

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

  // Auto-calculate semesters based on duration select: 2 semesters per year
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
      durationYears: course.durationYears,
      semesters: course.semesters,
    });
    setDrawerOpen(true);
  };

  const onSubmit = async (data) => {
    try {
      if (editId) {
        await updateCourse.mutateAsync({ id: editId, data });
      } else {
        await createCourse.mutateAsync(data);
      }
      setDrawerOpen(false);
    } catch (err) {
      // Handled globally
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteId) {
      await deleteCourse.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <Box>
      {/* 2. List Grid Table */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={32} sx={{ color: theme.palette.primary.main }} />
        </Box>
      ) : !courses || courses.length === 0 ? (
        <EmptyState
          type="courses"
          title="No Courses Registered"
          description="Register standard degree courses (e.g. B.Tech, MCA) to design academic tracks."
          actionText="Add Course"
          onAction={handleOpenCreate}
        />
      ) : (
        <TableContainer component={Card} sx={{ border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', borderRadius: '12px' }}>
          <Table aria-label="courses catalog table">
            <TableHead sx={{ bgcolor: 'rgba(28, 46, 69, 0.02)' }}>
              <TableRow>
                <TableCell sx={{ fontFamily: theme.typography.body2.fontFamily, fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>
                  COURSE CODE
                </TableCell>
                <TableCell sx={{ fontFamily: theme.typography.body2.fontFamily, fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>
                  COURSE NAME
                </TableCell>
                <TableCell sx={{ fontFamily: theme.typography.body2.fontFamily, fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>
                  DURATION
                </TableCell>
                <TableCell sx={{ fontFamily: theme.typography.body2.fontFamily, fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>
                  TOTAL SEMESTERS
                </TableCell>
                <TableCell align="right" sx={{ fontFamily: theme.typography.body2.fontFamily, fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>
                  ACTIONS
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {courses.map((course, index) => (
                <TableRow
                  key={course._id}
                  className="staggered-row"
                  style={{ animationDelay: `${index * 25}ms` }}
                  sx={{ '&:hover': { bgcolor: theme.custom.interaction.hoverTint } }}
                >
                  <TableCell sx={{ fontFamily: theme.typography.mono.fontFamily, fontSize: '0.78rem', fontWeight: 600 }}>
                    {course.code}
                  </TableCell>
                  <TableCell sx={{ fontFamily: theme.typography.body1.fontFamily, fontSize: '0.88rem', fontWeight: 600 }}>
                    {course.name}
                  </TableCell>
                  <TableCell sx={{ fontFamily: theme.typography.body2.fontFamily, fontSize: '0.85rem' }}>
                    {course.durationYears} {course.durationYears === 1 ? 'Year' : 'Years'}
                  </TableCell>
                  <TableCell sx={{ fontFamily: theme.typography.mono.fontFamily, fontSize: '0.82rem', color: theme.palette.text.secondary }}>
                    {course.semesters} Semesters
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
                {editId ? 'Modify Course' : 'Create Course'}
              </Typography>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                {editId ? 'Update details of the degree program.' : 'Configure a new educational path.'}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box>
                <Typography component="label" htmlFor="course-name-input" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}>
                  Course Name
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
                  placeholder="e.g. B.TECH"
                  disabled={!!editId}
                  {...register('code')}
                  error={!!errors.code}
                  helperText={errors.code?.message}
                  size="small"
                  inputProps={{ style: { textTransform: 'uppercase' } }}
                />
              </Box>

              <Box>
                <Typography component="label" htmlFor="course-duration-input" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}>
                  Duration (Years)
                </Typography>
                <TextField
                  id="course-duration-input"
                  select
                  fullWidth
                  {...register('durationYears', { valueAsNumber: true })}
                  error={!!errors.durationYears}
                  helperText={errors.durationYears?.message}
                  size="small"
                >
                  <MenuItem value={1}>1 Year</MenuItem>
                  <MenuItem value={2}>2 Years</MenuItem>
                  <MenuItem value={3}>3 Years</MenuItem>
                  <MenuItem value={4}>4 Years</MenuItem>
                  <MenuItem value={5}>5 Years</MenuItem>
                  <MenuItem value={6}>6 Years</MenuItem>
                </TextField>
              </Box>

              <Box sx={{ p: 2, borderRadius: '8px', bgcolor: 'rgba(28, 46, 69, 0.02)', border: `1px dashed ${theme.palette.divider}` }}>
                <Typography sx={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: theme.palette.ink[900], mb: 0.5, fontFamily: theme.typography.body2.fontFamily }}>
                  AUTO-CALCULATED SEMESTERS
                </Typography>
                <Typography sx={{ fontFamily: theme.typography.mono.fontFamily, fontSize: '0.85rem', fontWeight: 600, color: theme.palette.primary.main }}>
                  {durationValue ? durationValue * 2 : 0} Semesters
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: theme.palette.text.secondary }}>
                  Computed at a standard rate of 2 semesters per year.
                </Typography>
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
        title="Delete Course"
        description="Are you sure you want to delete this course? This action is permanent and might fail if branches or subjects are linked to it."
        actionText="Delete"
        typedConfirmation
        confirmationWord="DELETE"
      />
    </Box>
  );
};

export default CourseTab;
