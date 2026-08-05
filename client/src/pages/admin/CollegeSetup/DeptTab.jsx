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
  InputAdornment,
} from '@mui/material';
import { EditOutlined, DeleteOutline, MenuBook, Close, SearchOutlined } from '@mui/icons-material';
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
import { useToast } from '../../../contexts/ToastContext';

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
  const { showToast } = useToast();

  // Search state
  const [search, setSearch] = useState('');

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
  const { data: allSubjects } = useSubjectsQuery();

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
        showToast('Department details updated successfully.');
      } else {
        await createDept.mutateAsync(data);
        showToast('Department created successfully.');
      }
      setDrawerOpen(false);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save department.', { severity: 'error' });
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteId) {
      try {
        await deleteDept.mutateAsync(deleteId);
        showToast('Department deleted successfully.');
        setDeleteId(null);
      } catch (err) {
        showToast(err.response?.data?.message || 'Failed to delete department.', { severity: 'error' });
      }
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

  // Dependency Guard calculation for active deletion item
  const getDeleteWarningMessage = () => {
    if (!deleteId) return null;
    const linkedHod = hodsData?.data?.find(h => String(h.departmentId) === String(deleteId));
    const linkedSubs = allSubjects?.filter(s => String(s.departmentId?._id || s.departmentId) === String(deleteId));

    if (linkedHod || (linkedSubs && linkedSubs.length > 0)) {
      const parts = [];
      if (linkedHod) parts.push(`HOD (${linkedHod.name})`);
      if (linkedSubs?.length > 0) parts.push(`${linkedSubs.length} linked subject(s)`);
      return `⚠️ Warning: This department currently has ${parts.join(' and ')} associated with it. Deleting it may impact system data.`;
    }
    return null;
  };

  // Filter departments by search text
  const filteredDepts = depts?.filter(
    (dept) =>
      dept.name.toLowerCase().includes(search.toLowerCase()) ||
      dept.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* 1. Search Bar */}
      {depts && depts.length > 0 && (
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
            placeholder="Search departments by name or code..."
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
      ) : !depts || depts.length === 0 ? (
        <EmptyState
          type="departments"
          title="No Departments Configured"
          description="Setup a new institutional department node to manage subjects and courses."
          actionText="Add Department"
          onAction={handleOpenCreate}
        />
      ) : filteredDepts?.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center', borderRadius: '12px', border: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
            No departments match your search &quot;{search}&quot;.
          </Typography>
        </Card>
      ) : (
        <TableContainer component={Card} sx={{ border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', borderRadius: '12px' }}>
          <Table aria-label="departments directory table">
            <TableHead sx={{ bgcolor: theme.custom?.surface?.sunken || 'rgba(28, 46, 69, 0.02)' }}>
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
              {filteredDepts.map((dept, index) => (
                <TableRow
                  key={dept._id}
                  className="staggered-row"
                  style={{ animationDelay: `${index * 25}ms` }}
                  sx={{ '&:hover': { bgcolor: theme.custom?.interaction?.hoverTint || 'rgba(0,0,0,0.02)' } }}
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
                  disabled={!!editId}
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
                  multiline
                  rows={3}
                  placeholder="Brief overview of department scope..."
                  {...register('description')}
                  error={!!errors.description}
                  helperText={errors.description?.message}
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
                background: theme.palette.primary.gradient || theme.palette.primary.main,
                color: '#ffffff',
                fontWeight: 700,
                boxShadow: `0 4px 14px ${theme.palette.primary.main}35`,
              }}
            >
              {isSaving ? 'Saving...' : editId ? 'Update Department' : 'Create Department'}
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
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <MenuItem key={s} value={s}>
                  Semester {s}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {isLoadingDeptSubjects ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress size={28} sx={{ color: theme.palette.primary.main }} />
            </Box>
          ) : !deptSubjects || deptSubjects.length === 0 ? (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Typography sx={{ color: theme.palette.text.secondary, fontSize: '0.88rem' }}>
                No subjects found for this department.
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Card} sx={{ border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', borderRadius: '8px' }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: theme.custom?.surface?.sunken || 'rgba(28, 46, 69, 0.02)' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>CODE</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>NAME</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>CREDITS</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>TYPE</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>SEMESTER</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {deptSubjects.map((sub) => (
                    <TableRow key={sub._id}>
                      <TableCell sx={{ fontFamily: theme.typography.mono.fontFamily, fontSize: '0.75rem', fontWeight: 600 }}>
                        {sub.code}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.82rem', fontWeight: 600 }}>{sub.name}</TableCell>
                      <TableCell sx={{ fontFamily: theme.typography.mono.fontFamily, fontSize: '0.75rem' }}>
                        {sub.credits}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>{sub.type}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem' }}>Sem {sub.semester}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Drawer>

      {/* Confirmation Modal with Dependency Warning */}
      <ConfirmDeleteModal
        open={Boolean(deleteId)}
        title="Delete Department"
        description={
          getDeleteWarningMessage() ||
          "Are you sure you want to delete this department? This action cannot be undone if subjects or faculty are associated with it."
        }
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        isDeleting={deleteDept.isPending}
      />
    </Box>
  );
};

export default DeptTab;
