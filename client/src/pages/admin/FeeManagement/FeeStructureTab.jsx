import React, { useState } from 'react';
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
  Button,
  Drawer,
  TextField,
  MenuItem,
  Grid,
  CircularProgress,
  Alert,
  Skeleton,
  Chip,
  IconButton,
  Divider,
  useTheme,
} from '@mui/material';
import { AddOutlined, CloseOutlined, LayersOutlined } from '@mui/icons-material';
import { useFeeStructuresQuery, useCreateFeeStructureMutation } from '../../../queries/feeQueries';
import { useCoursesQuery, useBranchesQuery } from '../../../queries/collegeQueries';

const ACADEMIC_YEAR_PATTERN = /^\d{4}-\d{2}$/;
const SEMESTER_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);

const createFeeSchema = z.object({
  courseId: z.string().min(1, 'Course is required'),
  branchId: z.string().optional().or(z.literal('')),
  semester: z.number({ invalid_type_error: 'Semester is required' }).min(1).max(12),
  amount: z.number({ invalid_type_error: 'Amount is required' }).min(0, 'Amount cannot be negative'),
  label: z.string().min(2, 'Label must be at least 2 characters').max(100),
  academicYear: z.string().regex(ACADEMIC_YEAR_PATTERN, 'Format: YYYY-YY (e.g. 2025-26)'),
});

export const FeeStructureTab = () => {
  const theme = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filterCourse, setFilterCourse] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [serverError, setServerError] = useState('');

  const { data: structures, isLoading, isError } = useFeeStructuresQuery({
    courseId: filterCourse || undefined,
    semester: filterSemester || undefined,
    academicYear: filterYear || undefined,
  });

  const { data: courses } = useCoursesQuery();
  const { mutateAsync: createStructure, isLoading: isCreating } = useCreateFeeStructureMutation();

  // Track selected course in the drawer for branch filtering
  const [drawerCourseId, setDrawerCourseId] = useState('');
  const { data: branches } = useBranchesQuery(drawerCourseId || undefined);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: zodResolver(createFeeSchema),
    defaultValues: {
      courseId: '',
      branchId: '',
      semester: '',
      amount: '',
      label: '',
      academicYear: '',
    },
  });

  const handleOpen = () => {
    reset();
    setDrawerCourseId('');
    setServerError('');
    setDrawerOpen(true);
  };

  const handleClose = () => {
    if (!isCreating) {
      setDrawerOpen(false);
      reset();
      setDrawerCourseId('');
      setServerError('');
    }
  };

  const onSubmit = async (data) => {
    setServerError('');
    try {
      const payload = {
        ...data,
        branchId: data.branchId || null,
        semester: Number(data.semester),
        amount: Number(data.amount),
      };
      await createStructure(payload);
      handleClose();
    } catch (err) {
      setServerError(err?.response?.data?.message || 'Failed to create fee structure. Please try again.');
    }
  };

  const renderSkeletons = () =>
    Array.from({ length: 6 }).map((_, i) => (
      <TableRow key={i}>
        {Array.from({ length: 6 }).map((__, j) => (
          <TableCell key={j}><Skeleton variant="text" width="80%" /></TableCell>
        ))}
      </TableRow>
    ));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Toolbar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <TextField
            select
            size="small"
            label="Course"
            value={filterCourse}
            onChange={(e) => setFilterCourse(e.target.value)}
            sx={{ minWidth: 160, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
          >
            <MenuItem value="">All Courses</MenuItem>
            {(courses || []).map((c) => (
              <MenuItem key={c._id || c.id} value={c._id || c.id}>{c.name}</MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Semester"
            value={filterSemester}
            onChange={(e) => setFilterSemester(e.target.value)}
            sx={{ minWidth: 130, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
          >
            <MenuItem value="">All Semesters</MenuItem>
            {SEMESTER_OPTIONS.map((s) => (
              <MenuItem key={s} value={String(s)}>Semester {s}</MenuItem>
            ))}
          </TextField>
          <TextField
            size="small"
            label="Academic Year"
            placeholder="2025-26"
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            sx={{ minWidth: 140, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
          />
        </Box>
        <Button
          variant="contained"
          startIcon={<AddOutlined />}
          onClick={handleOpen}
          sx={{ fontWeight: 700, textTransform: 'none', borderRadius: '10px', px: 2.5 }}
        >
          Add Fee Structure
        </Button>
      </Box>

      {/* Table */}
      {isError ? (
        <Alert severity="error" sx={{ borderRadius: '10px' }}>Failed to load fee structures.</Alert>
      ) : (
        <Card sx={{ border: `1px solid ${theme.custom.border.subtle}`, borderRadius: '14px', boxShadow: 'none', overflow: 'hidden' }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: theme.custom.surface.raised }}>
                  {['Label', 'Course / Branch', 'Semester', 'Academic Year', 'Amount', 'Created By'].map((col) => (
                    <TableCell
                      key={col}
                      sx={{
                        fontFamily: theme.typography.body2.fontFamily,
                        fontWeight: 700,
                        fontSize: '0.72rem',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: theme.palette.text.secondary,
                        py: 1.5,
                        borderBottom: `1px solid ${theme.custom.border.subtle}`,
                      }}
                    >
                      {col}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading
                  ? renderSkeletons()
                  : !structures || structures.length === 0
                  ? (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ py: 6, textAlign: 'center' }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                          <LayersOutlined sx={{ fontSize: 40, color: theme.palette.text.disabled }} />
                          <Typography sx={{ color: theme.palette.text.secondary, fontSize: '0.875rem' }}>
                            No fee structures defined yet. Click &ldquo;Add Fee Structure&rdquo; to get started.
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )
                  : structures.map((s) => (
                    <TableRow key={s.id} hover sx={{ '&:last-child td': { border: 0 }, '& td': { borderBottom: `1px solid ${theme.custom.border.subtle}` } }}>
                      <TableCell>
                        <Typography sx={{ fontFamily: theme.typography.body1.fontFamily, fontSize: '0.875rem', fontWeight: 600, color: theme.palette.ink[900] }}>
                          {s.label}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: '0.82rem' }}>{s.course?.name || '—'}</Typography>
                        {s.branch && (
                          <Typography sx={{ fontSize: '0.75rem', color: theme.palette.text.secondary }}>
                            {s.branch.name}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip label={`Sem ${s.semester}`} size="small" sx={{ fontFamily: theme.typography.mono.fontFamily, fontWeight: 700, fontSize: '0.7rem' }} />
                      </TableCell>
                      <TableCell>
                        <Chip label={s.academicYear} size="small" variant="outlined" sx={{ fontFamily: theme.typography.mono.fontFamily, fontSize: '0.7rem' }} />
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontFamily: theme.typography.mono.fontFamily, fontWeight: 700, fontSize: '0.875rem', color: theme.palette.primary.main }}>
                          ₹{s.amount.toLocaleString('en-IN')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: '0.82rem', color: theme.palette.text.secondary }}>
                          {s.createdBy}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Create Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleClose}
        PaperProps={{
          sx: { width: { xs: '100%', sm: 440 }, bgcolor: theme.palette.background.default },
        }}
      >
        <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.custom.border.subtle}` }}>
          <Typography variant="h6" sx={{ fontFamily: theme.typography.h1.fontFamily, fontWeight: 600, color: theme.palette.ink[900] }}>
            New Fee Structure
          </Typography>
          <IconButton onClick={handleClose} disabled={isCreating} size="small">
            <CloseOutlined fontSize="small" />
          </IconButton>
        </Box>

        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5, overflowY: 'auto', flex: 1 }}>
          {serverError && <Alert severity="error" sx={{ borderRadius: '10px' }}>{serverError}</Alert>}

          <Controller
            name="courseId"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                select
                fullWidth
                size="small"
                label="Course *"
                error={!!errors.courseId}
                helperText={errors.courseId?.message}
                onChange={(e) => {
                  field.onChange(e);
                  setDrawerCourseId(e.target.value);
                  setValue('branchId', '');
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              >
                <MenuItem value="">Select a course</MenuItem>
                {(courses || []).map((c) => (
                  <MenuItem key={c._id || c.id} value={c._id || c.id}>{c.name} ({c.code})</MenuItem>
                ))}
              </TextField>
            )}
          />

          <Controller
            name="branchId"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                select
                fullWidth
                size="small"
                label="Branch (optional — leave blank for all branches)"
                disabled={!drawerCourseId}
                error={!!errors.branchId}
                helperText={errors.branchId?.message || (!drawerCourseId ? 'Select a course first' : '')}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              >
                <MenuItem value="">All branches (course-wide)</MenuItem>
                {(branches || []).map((b) => (
                  <MenuItem key={b._id || b.id} value={b._id || b.id}>{b.name} ({b.code})</MenuItem>
                ))}
              </TextField>
            )}
          />

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Controller
                name="semester"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    size="small"
                    label="Semester *"
                    value={field.value === '' ? '' : field.value}
                    onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                    error={!!errors.semester}
                    helperText={errors.semester?.message}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                  >
                    {SEMESTER_OPTIONS.map((s) => (
                      <MenuItem key={s} value={s}>Semester {s}</MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <Controller
                name="academicYear"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    size="small"
                    label="Academic Year *"
                    placeholder="2025-26"
                    error={!!errors.academicYear}
                    helperText={errors.academicYear?.message}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                  />
                )}
              />
            </Grid>
          </Grid>

          <Controller
            name="label"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                size="small"
                label="Fee Label *"
                placeholder="e.g. Tuition Fee, Lab Fee"
                error={!!errors.label}
                helperText={errors.label?.message}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              />
            )}
          />

          <Controller
            name="amount"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                size="small"
                label="Amount (₹) *"
                type="number"
                inputProps={{ min: 0, step: 1 }}
                value={field.value === '' ? '' : field.value}
                onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                error={!!errors.amount}
                helperText={errors.amount?.message}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              />
            )}
          />
        </Box>

        <Box sx={{ p: 3, borderTop: `1px solid ${theme.custom.border.subtle}`, display: 'flex', gap: 2 }}>
          <Button fullWidth variant="outlined" onClick={handleClose} disabled={isCreating} sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '10px' }}>
            Cancel
          </Button>
          <Button
            fullWidth
            variant="contained"
            onClick={handleSubmit(onSubmit)}
            disabled={isCreating}
            startIcon={isCreating ? <CircularProgress size={16} color="inherit" /> : <AddOutlined />}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '10px' }}
          >
            {isCreating ? 'Creating…' : 'Create Structure'}
          </Button>
        </Box>
      </Drawer>
    </Box>
  );
};

export default FeeStructureTab;
