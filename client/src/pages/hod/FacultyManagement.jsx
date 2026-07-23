import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
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
  Chip,
  CircularProgress,
  TextField,
  IconButton,
  Drawer,
  Button,
  MenuItem,
  useTheme,
  Grid
} from '@mui/material';
import { SearchOutlined, EditOutlined, Close } from '@mui/icons-material';
import { useUsersQuery, useUpdateUserMutation } from '../../queries/userQueries';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';

// Validation schema for HOD Faculty Edit form
const facultyEditSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long').max(100, 'Name cannot exceed 100 characters').trim(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
});

const FacultyManagement = () => {
  const theme = useTheme();
  
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  
  // Edit drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState(null);

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Queries & Mutations
  const { data: usersData, isLoading } = useUsersQuery({
    role: 'FACULTY',
    page,
    limit: 10,
    search: debouncedSearch || undefined
  });

  const updateFacultyMutation = useUpdateUserMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(facultyEditSchema),
    defaultValues: {
      name: '',
      status: 'ACTIVE',
    },
  });

  const handleOpenEdit = (user) => {
    setSelectedFaculty(user);
    reset({
      name: user.name || '',
      status: user.status || 'ACTIVE',
    });
    setDrawerOpen(true);
  };

  const onSubmit = async (data) => {
    if (!selectedFaculty) return;
    try {
      await updateFacultyMutation.mutateAsync({
        id: selectedFaculty.id,
        data,
      });
      setDrawerOpen(false);
      setSelectedFaculty(null);
    } catch (err) {
      // Handled globally
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: theme.palette.ink?.[900] || 'text.primary' }}>
          Faculty Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          View and manage the faculty members assigned to your department.
        </Typography>
      </Box>

      {/* Filter Bar */}
      <Box sx={{ p: 2, borderRadius: '12px', bgcolor: 'rgba(28, 46, 69, 0.02)', border: `1px solid ${theme.palette.divider}` }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchOutlined fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              sx={{ bgcolor: 'background.paper' }}
            />
          </Grid>
        </Grid>
      </Box>

      {/* Data Table */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={32} />
        </Box>
      ) : !usersData?.data || usersData.data.length === 0 ? (
        <EmptyState
          type="users"
          title="No Faculty Found"
          description={search ? "No faculty members match your search criteria." : "No faculty members have been assigned to your department yet."}
          actionText={search ? "Clear Search" : ""}
          onAction={search ? () => setSearch('') : undefined}
        />
      ) : (
        <TableContainer component={Card} sx={{ border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', borderRadius: '12px' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', py: 2 }}>NAME</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', py: 2 }}>EMAIL</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', py: 2 }}>ROLE</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', py: 2 }}>STATUS</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.8rem', py: 2 }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {usersData.data.map((user) => {
                const isInactive = user.status === 'INACTIVE';
                return (
                  <TableRow key={user.id} hover sx={{ opacity: isInactive ? 0.6 : 1 }}>
                    <TableCell sx={{ fontWeight: 600 }}>{user.name}</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        label="FACULTY"
                        size="small"
                        sx={{
                          bgcolor: 'action.hover',
                          color: 'primary.main',
                          fontWeight: 700,
                          fontSize: '0.65rem'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: isInactive ? 'error.main' : 'success.main' }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: isInactive ? 'error.main' : 'success.main' }}>
                          {user.status}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton aria-label="edit faculty" size="small" onClick={() => handleOpenEdit(user)}>
                        <EditOutlined fontSize="small" sx={{ color: 'text.secondary' }} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          <Box sx={{ p: 2 }}>
            <Pagination
              page={page}
              totalPages={usersData.meta.totalPages}
              total={usersData.meta.total}
              limit={usersData.meta.limit}
              onPageChange={setPage}
            />
          </Box>
        </TableContainer>
      )}

      {/* Edit Faculty Details Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 400 }, p: 4, bgcolor: theme.palette.background.paper } }}
      >
        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 4.5, height: '100%', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.ink?.[900] || 'text.primary', mb: 0.5 }}>
                  Edit Faculty Details
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Update the profile name and status of this faculty member.
                </Typography>
              </Box>
              <IconButton onClick={() => setDrawerOpen(false)} size="small">
                <Close fontSize="small" />
              </IconButton>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box>
                <Typography component="label" htmlFor="faculty-name-input" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink?.[900] || 'text.primary', mb: 1 }}>
                  Faculty Full Name
                </Typography>
                <TextField
                  id="faculty-name-input"
                  fullWidth
                  placeholder="e.g. Dr. Alan Turing"
                  {...register('name')}
                  error={!!errors.name}
                  helperText={errors.name?.message}
                  size="small"
                />
              </Box>

              <Box>
                <Typography component="label" htmlFor="faculty-status-input" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink?.[900] || 'text.primary', mb: 1 }}>
                  Status
                </Typography>
                <TextField
                  id="faculty-status-input"
                  select
                  fullWidth
                  {...register('status')}
                  error={!!errors.status}
                  helperText={errors.status?.message}
                  size="small"
                >
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="INACTIVE">Inactive</MenuItem>
                </TextField>
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => setDrawerOpen(false)}
              sx={{ color: 'text.secondary', borderColor: 'divider', fontWeight: 600 }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={updateFacultyMutation.isPending}
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                fontWeight: 700,
                '&:hover': { bgcolor: 'primary.dark' },
              }}
            >
              {updateFacultyMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
};

export default FacultyManagement;
