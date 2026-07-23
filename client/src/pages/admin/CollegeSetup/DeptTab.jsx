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
import { EditOutlined, DeleteOutline, MenuBook, Close } from '@mui/icons-material';
import {
  useDepartmentsQuery,
  useCreateDeptMutation,
  useUpdateDeptMutation,
  useDeleteDeptMutation,
  useSubjectsQuery,
} from '../../../queries/collegeQueries';
import { useUsersQuery } from '../../../queries/userQueries';
import ConfirmDeleteModal from '../../../components/common/ConfirmDeleteModal';
import EmptyState from '../../../components/common/EmptyState';

// Schema for Department Validation
const deptFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long').max(100, 'Name cannot exceed 100 characters').trim(),
  code: z
    .string()
    .min(2, 'Code must be at least 2 characters')
    .max(10, 'Code cannot exceed 10 characters')
    .trim()
    .toUpperCase(),
  description: z.string().max(200, 'Description cannot exceed 200 characters').trim().optional().or(z.literal('')),
});

export const DeptTab = ({ setOnAddClick }) => {
  const theme = useTheme();

  // Dialog & Drawer toggles
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // Subjects view state
  const [selectedDeptForSubjects, setSelectedDeptForSubjects] = useState(null);
  const [filterDrawerSemester, setFilterDrawerSemester] = useState('');

  // Queries
  const { data: depts, isLoading } = useDepartmentsQuery();
  const { data: hodsData } = useUsersQuery({ role: 'HOD', limit: 100 });

  const { data: deptSubjects, isLoading: isLoadingDeptSubjects } = useSubjectsQuery({
    departmentId: selectedDeptForSubjects?._id,
    semester: filterDrawerSemester || undefined,
  });

  // Mutations
  const createDept = useCreateDeptMutation();
  const updateDept = useUpdateDeptMutation();
  const deleteDept = useDeleteDeptMutation();

  const isSaving = createDept.isPending || updateDept.isPending;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(deptFormSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
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
      description: '',
    });
    setDrawerOpen(true);
  };

  const handleOpenEdit = (dept) => {
    setEditId(dept._id);
    reset({
      name: dept.name,
      code: dept.code,
      description: dept.description || '',
    });
    setDrawerOpen(true);
  };

  const handleOpenSubjects = (dept) => {
    setSelectedDeptForSubjects(dept);
    setFilterDrawerSemester('');
  };

  const onSubmit = async (data) => {
    try {
      if (editId) {
        await updateDept.mutateAsync({ id: editId, data });
      } else {
        await createDept.mutateAsync(data);
      }
      setDrawerOpen(false);
    } catch (err) {
      // Handled by react-query / global error handlers
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteId) {
      await deleteDept.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  // Find dynamic HOD name mapped in the directory list
  const getDeptHodName = (deptId) => {
    if (!hodsData?.data) return 'No HOD Assigned';
    const matches = hodsData.data.filter(
      (h) => String(h.departmentId) === String(deptId) && h.status === 'ACTIVE'
    );
    if (matches.length === 0) return 'No HOD Assigned';
    return matches
      .map((h) => {
        if (h.shift === 'MORNING') return `${h.name} (Morning)`;
        if (h.shift === 'EVENING') return `${h.name} (Evening)`;
        return h.name;
      })
      .join(', ');
  };

  return (
    <Box>
      {/* 2. List Grid Container */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={32} sx={{ color: theme.palette.primary.main }} />
        </Box>
      ) : !depts || depts.length === 0 ? (
        <EmptyState
          type="departments"
          title="No Departments Configured"
          description="Setup a new institutional department node to manage subjects and courses."
          actionText="Add Department"
          onAction={handleOpenCreate}
        />
      ) : (
        <TableContainer component={Card} sx={{ border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', borderRadius: '12px' }}>
          <Table aria-label="departments directory table">
            <TableHead sx={{ bgcolor: 'rgba(28, 46, 69, 0.02)' }}>
              <TableRow>
                <TableCell sx={{ fontFamily: theme.typography.body2.fontFamily, fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>
                  CODE
                </TableCell>
                <TableCell sx={{ fontFamily: theme.typography.body2.fontFamily, fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>
                  NAME
                </TableCell>
                <TableCell sx={{ fontFamily: theme.typography.body2.fontFamily, fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>
                  HOD ASSIGNED
                </TableCell>
                <TableCell sx={{ fontFamily: theme.typography.body2.fontFamily, fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>
                  DESCRIPTION
                </TableCell>
                <TableCell align="right" sx={{ fontFamily: theme.typography.body2.fontFamily, fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>
                  ACTIONS
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {depts.map((dept, index) => (
                <TableRow
                  key={dept._id}
                  className="staggered-row"
                  style={{ animationDelay: `${index * 25}ms` }}
                  sx={{ '&:hover': { bgcolor: theme.custom.interaction.hoverTint } }}
                >
                  <TableCell sx={{ fontFamily: theme.typography.mono.fontFamily, fontSize: '0.78rem', fontWeight: 600 }}>
                    {dept.code}
                  </TableCell>
                  <TableCell sx={{ fontFamily: theme.typography.body1.fontFamily, fontSize: '0.88rem', fontWeight: 600 }}>
                    {dept.name}
                  </TableCell>
                  <TableCell
                    sx={{
                      fontFamily: theme.typography.body2.fontFamily,
                      fontSize: '0.82rem',
                      color: getDeptHodName(dept._id) === 'No HOD Assigned' ? theme.palette.text.secondary : theme.palette.text.primary,
                      fontStyle: getDeptHodName(dept._id) === 'No HOD Assigned' ? 'italic' : 'normal',
                    }}
                  >
                    {getDeptHodName(dept._id)}
                  </TableCell>
                  <TableCell sx={{ fontFamily: theme.typography.body2.fontFamily, fontSize: '0.85rem', color: theme.palette.text.secondary }}>
                    {dept.description || '—'}
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      <IconButton aria-label="view subjects" size="small" onClick={() => handleOpenSubjects(dept)}>
                        <MenuBook fontSize="small" sx={{ color: theme.palette.primary.main }} />
                      </IconButton>
                      <IconButton aria-label="edit department" size="small" onClick={() => handleOpenEdit(dept)}>
                        <EditOutlined fontSize="small" sx={{ color: theme.palette.text.secondary }} />
                      </IconButton>
                      <IconButton aria-label="delete department" size="small" onClick={() => setDeleteId(dept._id)}>
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

      {/* 3. Slide Drawer Form Container */}
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
                {editId ? 'Modify Department' : 'Create Department'}
              </Typography>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                {editId ? 'Update details of the department record.' : 'Setup a new department academic node.'}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box>
                <Typography component="label" htmlFor="dept-name-input" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}>
                  Department Name
                </Typography>
                <TextField
                  id="dept-name-input"
                  fullWidth
                  placeholder="e.g. Computer Science"
                  {...register('name')}
                  error={!!errors.name}
                  helperText={errors.name?.message}
                  size="small"
                />
              </Box>

              <Box>
                <Typography component="label" htmlFor="dept-code-input" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}>
                  Department Code
                </Typography>
                <TextField
                  id="dept-code-input"
                  fullWidth
                  placeholder="e.g. CSE"
                  disabled={!!editId} // Codes are identifiers, disable editing once created
                  {...register('code')}
                  error={!!errors.code}
                  helperText={errors.code?.message}
                  size="small"
                  inputProps={{ style: { textTransform: 'uppercase' } }}
                />
              </Box>

              <Box>
                <Typography component="label" htmlFor="dept-description-input" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}>
                  Description (Optional)
                </Typography>
                <TextField
                  id="dept-description-input"
                  fullWidth
                  placeholder="Brief department outline..."
                  {...register('description')}
                  error={!!errors.description}
                  helperText={errors.description?.message}
                  multiline
                  rows={3}
                  size="small"
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

      {/* 5. View Subjects Drawer */}
      <Drawer
        anchor="right"
        open={Boolean(selectedDeptForSubjects)}
        onClose={() => setSelectedDeptForSubjects(null)}
        PaperProps={{ sx: { width: { xs: '100%', md: 750 }, p: 4, bgcolor: theme.palette.background.paper } }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h5" sx={{ fontFamily: theme.typography.h1.fontFamily, fontWeight: 700, color: theme.palette.ink[900] }}>
                {selectedDeptForSubjects?.name} Subjects
              </Typography>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                {isLoadingDeptSubjects ? 'Loading...' : `${deptSubjects?.length || 0} subjects linked to this department`}
              </Typography>
            </Box>
            <IconButton onClick={() => setSelectedDeptForSubjects(null)} size="small">
              <Close fontSize="small" />
            </IconButton>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              select
              label="Filter by Semester"
              value={filterDrawerSemester}
              onChange={(e) => setFilterDrawerSemester(e.target.value)}
              size="small"
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="">All Semesters</MenuItem>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <MenuItem key={num} value={num.toString()}>
                  Semester {num}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {isLoadingDeptSubjects ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress size={32} sx={{ color: theme.palette.primary.main }} />
            </Box>
          ) : !deptSubjects || deptSubjects.length === 0 ? (
            <EmptyState
              type="subjects"
              title="No subjects mapped"
              description="No subjects are currently assigned to this department."
              actionText=""
              onAction={() => {}}
            />
          ) : (
            <TableContainer component={Card} sx={{ border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', borderRadius: '12px', flexGrow: 1, overflowY: 'auto' }}>
              <Table aria-label="department subjects list table">
                <TableHead sx={{ bgcolor: 'rgba(28, 46, 69, 0.02)' }}>
                  <TableRow>
                    <TableCell sx={{ fontFamily: theme.typography.body2.fontFamily, fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>
                      SUBJECT NAME
                    </TableCell>
                    <TableCell sx={{ fontFamily: theme.typography.body2.fontFamily, fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>
                      CODE
                    </TableCell>
                    <TableCell sx={{ fontFamily: theme.typography.body2.fontFamily, fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>
                      SEMESTER
                    </TableCell>
                    <TableCell sx={{ fontFamily: theme.typography.body2.fontFamily, fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>
                      BRANCH
                    </TableCell>
                    <TableCell sx={{ fontFamily: theme.typography.body2.fontFamily, fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>
                      COURSE
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {deptSubjects.map((sub) => (
                    <TableRow key={sub._id} sx={{ '&:hover': { bgcolor: theme.custom.interaction.hoverTint } }}>
                      <TableCell sx={{ fontFamily: theme.typography.body1.fontFamily, fontSize: '0.88rem', fontWeight: 600 }}>
                        {sub.name}
                      </TableCell>
                      <TableCell sx={{ fontFamily: theme.typography.mono.fontFamily, fontSize: '0.78rem', fontWeight: 600 }}>
                        {sub.code}
                      </TableCell>
                      <TableCell sx={{ fontFamily: theme.typography.mono.fontFamily, fontSize: '0.82rem', color: theme.palette.text.secondary }}>
                        Sem {sub.semester}
                      </TableCell>
                      <TableCell sx={{ fontFamily: theme.typography.body2.fontFamily, fontSize: '0.85rem' }}>
                        {sub.branchId?.name || '—'} ({sub.branchId?.code || '—'})
                      </TableCell>
                      <TableCell sx={{ fontFamily: theme.typography.body2.fontFamily, fontSize: '0.85rem', fontWeight: 500 }}>
                        {sub.branchId?.courseId?.name || '—'} ({sub.branchId?.courseId?.code || '—'})
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Drawer>

      {/* 4. Delete Modal Confirmation */}
      <ConfirmDeleteModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Department"
        description="Are you sure you want to delete this department? This action is permanent and might fail if courses or subjects are linked to it."
        actionText="Delete"
        typedConfirmation
        confirmationWord="DELETE"
      />
    </Box>
  );
};

export default DeptTab;
