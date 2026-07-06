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
} from '@mui/material';
import { EditOutlined, DeleteOutline, FilterListOutlined } from '@mui/icons-material';
import {
  useSubjectsQuery,
  useBranchesQuery,
  useDepartmentsQuery,
  useCreateSubjectMutation,
  useUpdateSubjectMutation,
  useDeleteSubjectMutation,
} from '../../../queries/collegeQueries';
import ConfirmDeleteModal from '../../../components/common/ConfirmDeleteModal';
import EmptyState from '../../../components/common/EmptyState';

// Schema for Subject Validation
const subjectFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long').max(100, 'Name cannot exceed 100 characters').trim(),
  code: z
    .string()
    .min(2, 'Code must be at least 2 characters')
    .max(10, 'Code cannot exceed 10 characters')
    .trim()
    .toUpperCase(),
  credits: z
    .number({ required_error: 'Credits count is required' })
    .min(1, 'Credits must be at least 1')
    .max(10, 'Credits cannot exceed 10'),
  type: z.enum(['CORE', 'ELECTIVE'], {
    errorMap: () => ({ message: 'Type must be CORE or ELECTIVE' }),
  }),
  branchId: z
    .string({ required_error: 'Parent branch is required' })
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid branch ID format'),
  departmentId: z
    .string({ required_error: 'Hosting department is required' })
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid department ID format'),
  semester: z
    .number({ required_error: 'Semester mapping is required' })
    .min(1, 'Semester must be at least 1'),
});

export const SubjectTab = ({ setOnAddClick }) => {
  const theme = useTheme();

  // Toggles
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // Table Filters State
  const [filterBranch, setFilterBranch] = useState('');
  const [filterSemester, setFilterSemester] = useState('');

  // Queries
  const { data: subjects, isLoading: loadingSubjects } = useSubjectsQuery({
    branchId: filterBranch || undefined,
    semester: filterSemester || undefined,
  });
  const { data: branches, isLoading: loadingBranches } = useBranchesQuery();
  const { data: depts, isLoading: loadingDepts } = useDepartmentsQuery();

  // Mutations
  const createSubject = useCreateSubjectMutation();
  const updateSubject = useUpdateSubjectMutation();
  const deleteSubject = useDeleteSubjectMutation();

  const isSaving = createSubject.isPending || updateSubject.isPending;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(subjectFormSchema),
    defaultValues: {
      name: '',
      code: '',
      credits: 4,
      type: 'CORE',
      branchId: '',
      departmentId: '',
      semester: 1,
    },
  });

  const watchBranchId = watch('branchId');
  const [maxSemesters, setMaxSemesters] = useState(8);

  // Binds semester selections limits dynamically to the selected branch parent course duration
  useEffect(() => {
    if (watchBranchId && branches) {
      const selectedBranch = branches.find((b) => String(b._id) === String(watchBranchId));
      if (selectedBranch && selectedBranch.courseId) {
        // If semesters count is present in populated courseId
        const semsCount = selectedBranch.courseId.semesters || (selectedBranch.courseId.durationYears * 2);
        setMaxSemesters(semsCount);
        // Correct semester value if out of bounds
        const currentSem = watch('semester');
        if (currentSem > semsCount) {
          setValue('semester', 1);
        }
      }
    }
  }, [watchBranchId, branches, setValue, watch]);

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
      credits: 4,
      type: 'CORE',
      branchId: '',
      departmentId: '',
      semester: 1,
    });
    setDrawerOpen(true);
  };

  const handleOpenEdit = (subject) => {
    setEditId(subject._id);
    reset({
      name: subject.name,
      code: subject.code,
      credits: subject.credits,
      type: subject.type,
      branchId: subject.branchId?._id || subject.branchId || '',
      departmentId: subject.departmentId?._id || subject.departmentId || '',
      semester: subject.semester,
    });
    setDrawerOpen(true);
  };

  const onSubmit = async (data) => {
    try {
      if (editId) {
        await updateSubject.mutateAsync({ id: editId, data });
      } else {
        await createSubject.mutateAsync(data);
      }
      setDrawerOpen(false);
    } catch (err) {
      // Handled globally
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteId) {
      await deleteSubject.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  // Generate semester dropdown selections up to maxSemesters bounds
  const semesterOptions = [];
  for (let i = 1; i <= maxSemesters; i++) {
    semesterOptions.push(i);
  }

  // Check if subject add param is present in URL (Quick Action shortcut)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('add') === 'true') {
      handleOpenCreate();
      // Remove query param to prevent drawer opening repeatedly
      window.history.replaceState(null, '', window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* 1. Filter Bar + Add Button Row */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 2,
          p: 2.5,
          borderRadius: '12px',
          bgcolor: 'rgba(28, 46, 69, 0.02)',
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, flexGrow: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: theme.palette.text.secondary }}>
            <FilterListOutlined fontSize="small" />
            <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, fontFamily: theme.typography.body2.fontFamily }}>
              FILTERS
            </Typography>
          </Box>
          <TextField
            select
            label="Branch"
            value={filterBranch}
            onChange={(e) => setFilterBranch(e.target.value)}
            size="small"
            sx={{
              minWidth: 160,
              bgcolor: 'background.paper',
              '& .MuiInputLabel-root': { fontSize: '0.8rem' },
            }}
          >
            <MenuItem value="">All Branches</MenuItem>
            {branches?.map((b) => (
              <MenuItem key={b._id} value={b._id}>
                {b.name} ({b.code})
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Semester"
            value={filterSemester}
            onChange={(e) => setFilterSemester(e.target.value)}
            size="small"
            sx={{
              minWidth: 120,
              bgcolor: 'background.paper',
              '& .MuiInputLabel-root': { fontSize: '0.8rem' },
            }}
          >
            <MenuItem value="">All Semesters</MenuItem>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12].map((num) => (
              <MenuItem key={num} value={num}>
                Semester {num}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </Box>

      {/* 2. List Grid Table */}
      {loadingSubjects || loadingBranches || loadingDepts ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={32} sx={{ color: theme.palette.primary.main }} />
        </Box>
      ) : !subjects || subjects.length === 0 ? (
        <EmptyState
          type="subjects"
          title={filterBranch || filterSemester ? "No Matching Subjects" : "No Curriculum Subjects"}
          description={
            filterBranch || filterSemester
              ? "No subjects match your active search filters. Try resetting the filters above."
              : "Design and assign curriculum subjects to your course tracks."
          }
          actionText={filterBranch || filterSemester ? "Clear Filters" : "Add Subject"}
          onAction={
            filterBranch || filterSemester
              ? () => {
                  setFilterBranch('');
                  setFilterSemester('');
                }
              : handleOpenCreate
          }
        />
      ) : (
        <TableContainer component={Card} sx={{ border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', borderRadius: '12px' }}>
          <Table aria-label="subjects directory table">
            <TableHead sx={{ bgcolor: 'rgba(28, 46, 69, 0.02)' }}>
              <TableRow>
                <TableCell sx={{ fontFamily: theme.typography.body2.fontFamily, fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>
                  SUBJECT CODE
                </TableCell>
                <TableCell sx={{ fontFamily: theme.typography.body2.fontFamily, fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>
                  SUBJECT NAME
                </TableCell>
                <TableCell sx={{ fontFamily: theme.typography.body2.fontFamily, fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>
                  TYPE / CREDITS
                </TableCell>
                <TableCell sx={{ fontFamily: theme.typography.body2.fontFamily, fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>
                  BRANCH / SEMESTER
                </TableCell>
                <TableCell align="right" sx={{ fontFamily: theme.typography.body2.fontFamily, fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>
                  ACTIONS
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {subjects.map((sub, index) => (
                <TableRow
                  key={sub._id}
                  className="staggered-row"
                  style={{ animationDelay: `${index * 25}ms` }}
                  sx={{ '&:hover': { bgcolor: theme.custom.interaction.hoverTint } }}
                >
                  <TableCell sx={{ fontFamily: theme.typography.mono.fontFamily, fontSize: '0.78rem', fontWeight: 600 }}>
                    {sub.code}
                  </TableCell>
                  <TableCell sx={{ fontFamily: theme.typography.body1.fontFamily, fontSize: '0.88rem', fontWeight: 600 }}>
                    {sub.name}
                  </TableCell>
                  <TableCell sx={{ fontFamily: theme.typography.body2.fontFamily, fontSize: '0.82rem' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          px: 1,
                          py: 0.2,
                          borderRadius: '4px',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          bgcolor: sub.type === 'CORE' ? 'rgba(28, 46, 69, 0.06)' : 'rgba(184, 134, 62, 0.1)',
                          color: sub.type === 'CORE' ? theme.palette.ink[900] : theme.palette.primary.main,
                          fontFamily: theme.typography.mono.fontFamily,
                        }}
                      >
                        {sub.type}
                      </Box>
                      <Typography variant="body2" sx={{ fontFamily: theme.typography.mono.fontFamily, fontSize: '0.8rem', color: theme.palette.text.secondary }}>
                        {sub.credits} Credits
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontFamily: theme.typography.body2.fontFamily, fontSize: '0.85rem' }}>
                    {sub.branchId?.code || 'N/A'} ·{' '}
                    <Box component="span" sx={{ fontFamily: theme.typography.mono.fontFamily, color: theme.palette.text.secondary }}>
                      Sem {sub.semester}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      <IconButton aria-label="edit subject" size="small" onClick={() => handleOpenEdit(sub)}>
                        <EditOutlined fontSize="small" sx={{ color: theme.palette.text.secondary }} />
                      </IconButton>
                      <IconButton aria-label="delete subject" size="small" onClick={() => setDeleteId(sub._id)}>
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
                {editId ? 'Modify Subject' : 'Create Subject'}
              </Typography>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                {editId ? 'Update details of the subject node.' : 'Map a new subject to a specialization branch.'}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box>
                <Typography component="label" htmlFor="sub-name-input" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}>
                  Subject Name
                </Typography>
                <TextField
                  id="sub-name-input"
                  fullWidth
                  placeholder="e.g. Advanced Operating Systems"
                  {...register('name')}
                  error={!!errors.name}
                  helperText={errors.name?.message}
                  size="small"
                />
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography component="label" htmlFor="sub-code-input" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}>
                    Subject Code
                  </Typography>
                  <TextField
                    id="sub-code-input"
                    fullWidth
                    placeholder="e.g. CS501"
                    disabled={!!editId}
                    {...register('code')}
                    error={!!errors.code}
                    helperText={errors.code?.message}
                    size="small"
                    inputProps={{ style: { textTransform: 'uppercase' } }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography component="label" htmlFor="sub-credits-input" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}>
                    Credits
                  </Typography>
                  <TextField
                    id="sub-credits-input"
                    type="number"
                    fullWidth
                    {...register('credits', { valueAsNumber: true })}
                    error={!!errors.credits}
                    helperText={errors.credits?.message}
                    size="small"
                  />
                </Grid>
              </Grid>

              <Box>
                <Typography component="label" htmlFor="sub-type-input" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}>
                  Course Type
                </Typography>
                <TextField
                  id="sub-type-input"
                  select
                  fullWidth
                  {...register('type')}
                  error={!!errors.type}
                  helperText={errors.type?.message}
                  size="small"
                >
                  <MenuItem value="CORE">CORE</MenuItem>
                  <MenuItem value="ELECTIVE">ELECTIVE</MenuItem>
                </TextField>
              </Box>

              <Box>
                <Typography component="label" htmlFor="sub-dept-input" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}>
                  Hosting Department
                </Typography>
                <TextField
                  id="sub-dept-input"
                  select
                  fullWidth
                  {...register('departmentId')}
                  error={!!errors.departmentId}
                  helperText={errors.departmentId?.message}
                  size="small"
                >
                  <MenuItem value="">Select Hosting Department...</MenuItem>
                  {depts?.map((d) => (
                    <MenuItem key={d._id} value={d._id}>
                      {d.name} ({d.code})
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography component="label" htmlFor="sub-branch-input" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}>
                    Parent Branch
                  </Typography>
                  <TextField
                    id="sub-branch-input"
                    select
                    fullWidth
                    {...register('branchId')}
                    error={!!errors.branchId}
                    helperText={errors.branchId?.message}
                    size="small"
                  >
                    <MenuItem value="">Select Branch...</MenuItem>
                    {branches?.map((b) => (
                      <MenuItem key={b._id} value={b._id}>
                        {b.name} ({b.code})
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={6}>
                  <Typography component="label" htmlFor="sub-sem-input" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}>
                    Semester
                  </Typography>
                  <TextField
                    id="sub-sem-input"
                    select
                    fullWidth
                    disabled={!watchBranchId}
                    {...register('semester', { valueAsNumber: true })}
                    error={!!errors.semester}
                    helperText={errors.semester?.message}
                    size="small"
                  >
                    {!watchBranchId ? (
                      <MenuItem value="">Choose branch first...</MenuItem>
                    ) : (
                      semesterOptions.map((num) => (
                        <MenuItem key={num} value={num}>
                          Semester {num}
                        </MenuItem>
                      ))
                    )}
                  </TextField>
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
        title="Delete Subject"
        description="Are you sure you want to delete this subject? This action is permanent."
        actionText="Delete"
        typedConfirmation
        confirmationWord="DELETE"
      />
    </Box>
  );
};

export default SubjectTab;
