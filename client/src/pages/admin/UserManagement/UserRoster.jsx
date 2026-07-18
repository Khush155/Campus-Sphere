import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  Chip,
  CircularProgress,
  Button,
  Drawer,
  Alert,
  useTheme,
  Grid,
  Snackbar,
  Skeleton,
} from '@mui/material';
import {
  MoreVertOutlined,
  AddOutlined,
  SearchOutlined,
} from '@mui/icons-material';
import {
  useUsersQuery,
  useUserQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
} from '../../../queries/userQueries';
import {
  useDepartmentsQuery,
  useCoursesQuery,
  useBranchesQuery,
} from '../../../queries/collegeQueries';
import Pagination from '../../../components/common/Pagination';
import ConfirmDeleteModal from '../../../components/common/ConfirmDeleteModal';
import UserRegister from './UserRegister';
import EmptyState from '../../../components/common/EmptyState';
import { useAuth } from '../../../contexts/AuthContext';

const userEditSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long').max(50, 'Name cannot exceed 50 characters').trim(),
  role: z.string(),
  departmentId: z.string().optional().or(z.null()).or(z.literal('')),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  courseId: z.string().optional().or(z.null()).or(z.literal('')),
  branchId: z.string().optional().or(z.null()).or(z.literal('')),
  semester: z.number().optional().or(z.null()),
  reason: z.string().optional(),
  shift: z.string().optional().or(z.null()).or(z.literal('')),
}).superRefine((data, ctx) => {
  if (data.role === 'HOD') {
    if (!data.shift || !['GENERAL', 'MORNING', 'EVENING'].includes(data.shift)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Shift is required for HOD role and must be GENERAL, MORNING, or EVENING',
        path: ['shift'],
      });
    }
  }
  if (['HOD', 'FACULTY', 'STUDENT'].includes(data.role)) {
    if (!data.departmentId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Department is required for this role',
        path: ['departmentId'],
      });
    }
  }
});

const formatRelativeTime = (dateString) => {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffSec < 60) {
    return 'Just now';
  } else if (diffMin < 60) {
    return `${diffMin}m ago`;
  } else if (diffHr < 24) {
    return `${diffHr}h ago`;
  } else if (diffDays === 1) {
    return '1 day ago';
  } else {
    return `${diffDays} days ago`;
  }
};

export const UserRoster = () => {
  const theme = useTheme();
  const { user: authUser } = useAuth();
  const isSuperAdmin = authUser?.role === 'SUPER_ADMIN';
  const [searchParams, setSearchParams] = useSearchParams();

  // Search & Filter State
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get('search') || '');
  const [roleFilter, setRoleFilter] = useState(searchParams.get('role') || '');
  const [deptFilter, setDeptFilter] = useState(searchParams.get('dept') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');

  // Sync filters state to browser URL query params
  useEffect(() => {
    const params = {};
    if (debouncedSearch) params.search = debouncedSearch;
    if (roleFilter) params.role = roleFilter;
    if (deptFilter) params.dept = deptFilter;
    if (statusFilter) params.status = statusFilter;
    if (page > 1) params.page = page;
    setSearchParams(params, { replace: true });
  }, [debouncedSearch, roleFilter, deptFilter, statusFilter, page, setSearchParams]);

  // Dialog & Drawer toggles
  const [registerOpen, setRegisterOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [deactivateUser, setDeactivateUser] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [activeMenuUser, setActiveMenuUser] = useState(null);
  const [sessionsDrawerOpen, setSessionsDrawerOpen] = useState(false);
  const [sessionsDrawerUser, setSessionsDrawerUser] = useState(null);

  // Density switcher state
  const [density, setDensity] = useState(localStorage.getItem('roster_density') || 'comfortable');

  // Toast Notification Snackbar State
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastAction, setToastAction] = useState(null);

  const showToast = (message, action = null) => {
    setToastMessage(message);
    setToastAction(action ? { run: action } : null);
    setToastOpen(true);
  };

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Queries
  const { data: usersData, isLoading: loadingUsers } = useUsersQuery({
    page,
    limit: 15,
    role: roleFilter || undefined,
    department: deptFilter || undefined,
    status: statusFilter || undefined,
    search: debouncedSearch || undefined,
  });

  const { data: depts } = useDepartmentsQuery();
  const { data: courses } = useCoursesQuery();
  const { data: branches } = useBranchesQuery();
  const { data: allHods } = useUsersQuery({ role: 'HOD', limit: 100 });

  // Mutations
  const updateUser = useUpdateUserMutation();
  const deleteUser = useDeleteUserMutation();



  const handleMenuOpen = (event, user) => {
    setAnchorEl(event.currentTarget);
    setActiveMenuUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setActiveMenuUser(null);
  };

  const handleEditClick = () => {
    setEditUser(activeMenuUser);
    setEditDrawerOpen(true);
    handleMenuClose();
  };

  const handleViewSessionsClick = () => {
    setSessionsDrawerUser(activeMenuUser);
    setSessionsDrawerOpen(true);
    handleMenuClose();
  };

  const handleDeactivateClick = () => {
    setDeactivateUser(activeMenuUser);
    handleMenuClose();
  };

  const handleGenerateIdCardClick = () => {
    if (activeMenuUser) {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
      const token = localStorage.getItem('accessToken');
      window.open(`${baseUrl}/id-cards/${activeMenuUser.id}?token=${token}`, '_blank');
    }
    handleMenuClose();
  };

  const handleDeactivateConfirm = async () => {
    if (deactivateUser) {
      const userToDeactivate = deactivateUser;
      setDeactivateUser(null);

      try {
        if (userToDeactivate.status === 'INACTIVE') {
          // Reactivate account
          await updateUser.mutateAsync({
            id: userToDeactivate.id,
            data: { status: 'ACTIVE' },
          });
          showToast(`${userToDeactivate.name}'s account reactivated.`);
        } else {
          // Deactivate account (soft delete)
          await deleteUser.mutateAsync(userToDeactivate.id);
          showToast(`${userToDeactivate.name}'s account deactivated.`, () => async () => {
            await updateUser.mutateAsync({
              id: userToDeactivate.id,
              data: { status: 'ACTIVE' },
            });
            showToast(`Reactivated ${userToDeactivate.name}'s account.`);
          });
        }
      } catch (err) {
        if (err.response?.data?.message) {
          showToast(err.response.data.message);
        } else {
          showToast('An unexpected error occurred.', null, 'error');
        }
      }
    }
  };

  // Maps roles to theme colors
  const getRoleChipStyles = (role) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return { bgcolor: 'rgba(184, 134, 62, 0.1)', color: theme.palette.primary.main };
      case 'COLLEGE_ADMIN':
        return { bgcolor: 'rgba(14, 26, 43, 0.08)', color: theme.palette.ink[900] };
      case 'HOD':
        return { bgcolor: 'rgba(217, 184, 118, 0.15)', color: '#a27431' };
      case 'FACULTY':
        return { bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' };
      case 'STUDENT':
        return { bgcolor: 'rgba(63, 110, 82, 0.1)', color: theme.palette.signal.success };
      default:
        return { bgcolor: 'rgba(0,0,0,0.06)', color: 'inherit' };
    }
  };



  // Check if register trigger is present in URL (Quick Action shortcut)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('register') === 'true') {
      setRegisterOpen(true);
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* 1. Header Toolbar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Box>
          <Typography
            variant="h4"
            component="h2"
            sx={{
              fontFamily: theme.typography.h1.fontFamily,
              fontWeight: 600,
              color: theme.palette.ink[900],
              mb: 0.5,
            }}
          >
            Users Directory
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontFamily: theme.typography.body2.fontFamily,
              color: theme.palette.text.secondary,
            }}
          >
            Manage logins, account roles mapping, and configurations profile bounds.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <Button
            variant="outlined"
            onClick={() => {
              const nextD = density === 'comfortable' ? 'compact' : 'comfortable';
              setDensity(nextD);
              localStorage.setItem('roster_density', nextD);
            }}
            sx={{
              borderColor: theme.custom.border.subtle,
              color: theme.palette.text.secondary,
              fontWeight: 600,
              textTransform: 'none',
              px: 2,
              height: '40px',
              '&:hover': {
                borderColor: theme.palette.primary.main,
                color: theme.palette.primary.main,
                bgcolor: theme.custom.interaction.hoverTint,
              },
            }}
          >
            {density === 'comfortable' ? 'Compact View' : 'Comfortable View'}
          </Button>

          {(roleFilter || deptFilter) && (
            <Button
              variant="outlined"
              onClick={() => {
                const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
                const token = localStorage.getItem('accessToken');
                const params = new URLSearchParams();
                if (deptFilter) params.append('departmentId', deptFilter);
                if (roleFilter) params.append('role', roleFilter);
                params.append('token', token);
                window.open(`${baseUrl}/id-cards/bulk?${params.toString()}`, '_blank');
              }}
              sx={{
                borderColor: theme.palette.primary.main,
                color: theme.palette.primary.main,
                fontWeight: 600,
                textTransform: 'none',
                px: 2,
                height: '40px',
                '&:hover': {
                  bgcolor: theme.custom.interaction.hoverTint,
                  borderColor: theme.palette.primary.main,
                },
              }}
            >
              Bulk ID Cards
            </Button>
          )}

          {isSuperAdmin && (
            <Button
              variant="contained"
              startIcon={<AddOutlined />}
              onClick={() => setRegisterOpen(true)}
              sx={{
                bgcolor: theme.palette.primary.main,
                color: theme.palette.ink[900],
                fontWeight: 700,
                textTransform: 'none',
                px: 2.5,
                height: '40px',
                '&:hover': { bgcolor: theme.palette.primary.light },
              }}
            >
              Register User
            </Button>
          )}
        </Box>
      </Box>

      {/* 2. Filter Bar */}
      <Box
        sx={{
          p: 2.5,
          borderRadius: '12px',
          bgcolor: 'rgba(28, 46, 69, 0.02)',
          border: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <Grid container spacing={2} alignItems="center">
          {/* Search Box */}
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search name, email, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchOutlined fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              sx={{ bgcolor: 'background.paper' }}
            />
          </Grid>

          {/* Role Filter */}
          <Grid item xs={6} sm={2.5}>
            <TextField
              select
              fullWidth
              size="small"
              label="Role"
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              sx={{ bgcolor: 'background.paper' }}
            >
              <MenuItem value="">All Roles</MenuItem>
              <MenuItem value="SUPER_ADMIN">Super Admin</MenuItem>
              <MenuItem value="COLLEGE_ADMIN">College Admin</MenuItem>
              <MenuItem value="HOD">HOD</MenuItem>
              <MenuItem value="FACULTY">Faculty</MenuItem>
              <MenuItem value="STUDENT">Student</MenuItem>
            </TextField>
          </Grid>

          {/* Department Filter */}
          <Grid item xs={6} sm={2.5}>
            <TextField
              select
              fullWidth
              size="small"
              label="Department"
              value={deptFilter}
              onChange={(e) => {
                setDeptFilter(e.target.value);
                setPage(1);
              }}
              sx={{ bgcolor: 'background.paper' }}
            >
              <MenuItem value="">All Departments</MenuItem>
              {depts?.map((d) => (
                <MenuItem key={d._id} value={d._id}>
                  {d.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Status Filter */}
          <Grid item xs={12} sm={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              sx={{ bgcolor: 'background.paper' }}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="ACTIVE">Active Only</MenuItem>
              <MenuItem value="INACTIVE">Inactive Only</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Box>

      {/* 3. Table List Grid */}
      {loadingUsers ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={32} sx={{ color: theme.palette.primary.main }} />
        </Box>
      ) : !usersData?.data || usersData.data.length === 0 ? (
        <EmptyState
          type="users"
          title={search || roleFilter || deptFilter || statusFilter ? "No Matching Users" : "No Registered Accounts"}
          description={
            search || roleFilter || deptFilter || statusFilter
              ? "No registered users match your search criteria. Try modifying your filters."
              : "Register students, faculties, or administrative personnel profiles."
          }
          actionText={search || roleFilter || deptFilter || statusFilter ? "Reset Filters" : "Register User"}
          onAction={
            search || roleFilter || deptFilter || statusFilter
              ? () => {
                  setSearch('');
                  setRoleFilter('');
                  setDeptFilter('');
                  setStatusFilter('');
                }
              : () => setRegisterOpen(true)
          }
        />
      ) : (
        <TableContainer
          component={Card}
          sx={{
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: 'none',
            borderRadius: '12px',
            maxHeight: '60vh',
            overflowY: 'auto',
          }}
        >
          <Table aria-label="users directory list table" stickyHeader size={density === 'compact' ? 'small' : 'medium'}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ py: density === 'compact' ? 1 : 2, fontFamily: theme.typography.body2.fontFamily, fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>
                  NAME
                </TableCell>
                <TableCell sx={{ py: density === 'compact' ? 1 : 2, fontFamily: theme.typography.body2.fontFamily, fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>
                  ID / EMAIL
                </TableCell>
                <TableCell sx={{ py: density === 'compact' ? 1 : 2, fontFamily: theme.typography.body2.fontFamily, fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>
                  ROLE
                </TableCell>
                <TableCell sx={{ py: density === 'compact' ? 1 : 2, fontFamily: theme.typography.body2.fontFamily, fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>
                  MAPPING DETAILS
                </TableCell>
                <TableCell sx={{ py: density === 'compact' ? 1 : 2, fontFamily: theme.typography.body2.fontFamily, fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>
                  HOD SCOPE
                </TableCell>
                <TableCell sx={{ py: density === 'compact' ? 1 : 2, fontFamily: theme.typography.body2.fontFamily, fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>
                  STATUS
                </TableCell>
                <TableCell sx={{ py: density === 'compact' ? 1 : 2, fontFamily: theme.typography.body2.fontFamily, fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>
                  LAST LOGIN
                </TableCell>
                <TableCell align="right" sx={{ py: density === 'compact' ? 1 : 2, fontFamily: theme.typography.body2.fontFamily, fontWeight: 700, fontSize: '0.8rem', color: theme.palette.ink[900] }}>
                  ACTIONS
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {usersData.data.map((user, index) => {
                const isInactive = user.status === 'INACTIVE';
                const chipStyles = getRoleChipStyles(user.role);

                return (
                  <TableRow
                    key={user.id}
                    className="staggered-row"
                    style={{ animationDelay: `${index * 25}ms` }}
                    sx={{
                      opacity: isInactive ? 0.55 : 1,
                      '&:hover': { bgcolor: theme.custom.interaction.hoverTint },
                      transition: 'opacity 0.15s ease-in-out',
                    }}
                  >
                    <TableCell sx={{ py: density === 'compact' ? 1 : 1.75, fontFamily: theme.typography.body1.fontFamily, fontSize: density === 'compact' ? '0.82rem' : '0.88rem', fontWeight: 600 }}>
                      {user.name}
                    </TableCell>
                    <TableCell sx={{ py: density === 'compact' ? 1 : 1.75, fontFamily: theme.typography.mono.fontFamily, fontSize: density === 'compact' ? '0.74rem' : '0.78rem', color: theme.palette.text.secondary }}>
                      {user.email}
                    </TableCell>
                    <TableCell sx={{ py: density === 'compact' ? 1 : 1.75 }}>
                      <Chip
                        label={user.role.replace('_', ' ')}
                        size="small"
                        sx={{
                          bgcolor: chipStyles.bgcolor,
                          color: chipStyles.color,
                          fontFamily: theme.typography.mono.fontFamily,
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          borderRadius: '6px',
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: density === 'compact' ? 1 : 1.75, fontFamily: theme.typography.body2.fontFamily, fontSize: density === 'compact' ? '0.78rem' : '0.82rem' }}>
                      {user.role === 'STUDENT' ? (
                        <>
                          {user.branch || 'No Branch'} ·{' '}
                          <Box component="span" sx={{ fontFamily: theme.typography.mono.fontFamily, color: theme.palette.text.secondary }}>
                            Sem {user.semester || '—'}
                          </Box>
                        </>
                      ) : (
                        user.department || 'Global / Administrator'
                      )}
                    </TableCell>
                    <TableCell sx={{ py: density === 'compact' ? 1 : 1.75, fontFamily: theme.typography.body2.fontFamily, fontSize: density === 'compact' ? '0.78rem' : '0.82rem' }}>
                      {user.role === 'HOD' ? (
                        user.shift === 'GENERAL' || !user.shift ? 'General' :
                        user.shift === 'MORNING' ? 'Morning' :
                        user.shift === 'EVENING' ? 'Evening' : 'General'
                      ) : '—'}
                    </TableCell>
                    <TableCell sx={{ py: density === 'compact' ? 1 : 1.75 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            bgcolor: isInactive ? theme.palette.signal.error : theme.palette.signal.success,
                          }}
                        />
                        <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 600, color: isInactive ? theme.palette.signal.error : theme.palette.signal.success }}>
                          {user.status}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: density === 'compact' ? 1 : 1.75, fontFamily: theme.typography.body2.fontFamily, fontSize: density === 'compact' ? '0.78rem' : '0.82rem', color: theme.palette.text.secondary }}>
                      {formatRelativeTime(user.lastLoginAt)}
                    </TableCell>
                    <TableCell align="right" sx={{ py: density === 'compact' ? 1 : 1.75 }}>
                      <IconButton aria-label="user actions menu" size="small" onClick={(e) => handleMenuOpen(e, user)}>
                        <MoreVertOutlined fontSize="small" sx={{ color: theme.palette.text.secondary }} />
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

      {/* 4. Action Dropdown Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        {isSuperAdmin && <MenuItem onClick={handleEditClick}>Edit Profile</MenuItem>}
        {isSuperAdmin && (
          <MenuItem onClick={handleDeactivateClick}>
            {activeMenuUser?.status === 'INACTIVE' ? 'Activate Account' : 'Deactivate'}
          </MenuItem>
        )}
        <MenuItem onClick={handleViewSessionsClick} sx={{ color: 'primary.main' }}>View Sessions</MenuItem>
        {['STUDENT', 'FACULTY', 'HOD'].includes(activeMenuUser?.role) && (
          <MenuItem onClick={handleGenerateIdCardClick}>Generate ID Card</MenuItem>
        )}
      </Menu>

      {/* 5. User Creation Wizard Modal */}
      <UserRegister open={registerOpen} onClose={() => setRegisterOpen(false)} />

      {/* 6. Edit User Slide-in Drawer */}
      <Drawer
        anchor="right"
        open={editDrawerOpen}
        onClose={() => {
          setEditDrawerOpen(false);
          setEditUser(null);
        }}
        PaperProps={{ sx: { width: { xs: '100%', sm: 400 }, p: 4, bgcolor: theme.palette.background.paper } }}
      >
        {editDrawerOpen && editUser && (
          <EditUserForm
            key={editUser.id}
            userId={editUser.id}
            onClose={() => {
              setEditDrawerOpen(false);
              setEditUser(null);
            }}
            onSaveSuccess={() => {
              setEditDrawerOpen(false);
              setEditUser(null);
              showToast('User profile updated successfully.');
            }}
            depts={depts}
            courses={courses}
            branches={branches}
            allHods={allHods}
            theme={theme}
          />
        )}
      </Drawer>

      {/* 7. Confirm Deactivate Modal */}
      <ConfirmDeleteModal
        open={!!deactivateUser}
        onClose={() => setDeactivateUser(null)}
        onConfirm={handleDeactivateConfirm}
        title={deactivateUser?.status === 'INACTIVE' ? 'Activate User Account' : 'Deactivate User Account'}
        description={
          deactivateUser?.status === 'INACTIVE'
            ? `This will reactivate ${deactivateUser?.name || 'the user'}'s account and allow them to sign back in.`
            : `This will deactivate ${deactivateUser?.name || 'the user'}'s account. Their marks, attendance, and fee history records will be fully preserved in institutional archives.`
        }
        actionText={deactivateUser?.status === 'INACTIVE' ? 'Activate' : 'Deactivate'}
        typedConfirmation={deactivateUser?.status !== 'INACTIVE'} // Only require typing to deactivate
        confirmationWord="DEACTIVATE"
      />

      {/* 8. View Sessions Drawer */}
      <Drawer
        anchor="right"
        open={sessionsDrawerOpen}
        onClose={() => {
          setSessionsDrawerOpen(false);
          setSessionsDrawerUser(null);
        }}
        PaperProps={{ sx: { width: { xs: '100%', sm: 400 }, p: 4, bgcolor: theme.palette.background.paper } }}
      >
        {sessionsDrawerOpen && sessionsDrawerUser && (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, flexGrow: 1 }}>
              <Box sx={{ borderBottom: `1px solid ${theme.custom.border.subtle}`, pb: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.ink[900], mb: 0.5 }}>
                  Active Sessions
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Manage active login sessions for {sessionsDrawerUser.name}
                </Typography>
              </Box>

              {/* Current Session Mock Details */}
              <Card sx={{ border: `1px solid ${theme.custom.border.subtle}`, borderRadius: '12px', boxShadow: 'none' }}>
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: theme.palette.primary.main, mb: 1 }}>
                    Current Device (This Session)
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                    Browser: Chrome on Windows
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    IP Address: {sessionsDrawerUser.lastLoginIp || '192.168.1.105'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Last Active: {sessionsDrawerUser.lastLoginAt ? new Date(sessionsDrawerUser.lastLoginAt).toLocaleString() : 'Just now'}
                  </Typography>
                </CardContent>
              </Card>

              {/* Info alert */}
              <Alert severity="info" sx={{ borderRadius: '8px' }}>
                Session and Device Management backend tracking will be fully configured in the upcoming Phase 11.
              </Alert>
            </Box>

            <Button
              variant="outlined"
              fullWidth
              onClick={() => {
                setSessionsDrawerOpen(false);
                setSessionsDrawerUser(null);
              }}
              sx={{ mt: 'auto', fontWeight: 600, color: theme.palette.text.secondary, borderColor: theme.palette.divider }}
            >
              Close
            </Button>
          </Box>
        )}
      </Drawer>

      {/* 8. Toast Action Snackbar */}
      <Snackbar
        open={toastOpen}
        autoHideDuration={6000}
        onClose={() => setToastOpen(false)}
        message={toastMessage}
        action={
          toastAction ? (
            <Button
              color="secondary"
              size="small"
              onClick={() => {
                toastAction.run();
                setToastOpen(false);
              }}
              sx={{ fontWeight: 700 }}
            >
              UNDO
            </Button>
          ) : null
        }
      />
    </Box>
  );
};

/**
 * Subcomponent to handle Edit User Form state, validation, cascading selects and loader skeleton.
 */
const EditUserForm = ({ userId, onClose, onSaveSuccess, depts, courses, branches, allHods, theme }) => {
  const { data: user, isLoading } = useUserQuery(userId);

  if (isLoading || !user) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4.5, height: '100%', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
          <Box>
            <Skeleton variant="text" width="60%" height={32} />
            <Skeleton variant="text" width="40%" height={20} />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 2 }}>
            <Box>
              <Skeleton variant="text" width="30%" height={20} sx={{ mb: 1 }} />
              <Skeleton variant="rectangular" height={40} sx={{ borderRadius: '8px' }} />
            </Box>
            <Box>
              <Skeleton variant="text" width="30%" height={20} sx={{ mb: 1 }} />
              <Skeleton variant="rectangular" height={40} sx={{ borderRadius: '8px' }} />
            </Box>
            <Box>
              <Skeleton variant="text" width="30%" height={20} sx={{ mb: 1 }} />
              <Skeleton variant="rectangular" height={40} sx={{ borderRadius: '8px' }} />
            </Box>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Skeleton variant="rectangular" width="50%" height={40} sx={{ borderRadius: '8px' }} />
          <Skeleton variant="rectangular" width="50%" height={40} sx={{ borderRadius: '8px' }} />
        </Box>
      </Box>
    );
  }

  return (
    <EditUserFormContent
      user={user}
      onClose={onClose}
      onSaveSuccess={onSaveSuccess}
      depts={depts}
      courses={courses}
      branches={branches}
      allHods={allHods}
      theme={theme}
    />
  );
};

const EditUserFormContent = ({ user, onClose, onSaveSuccess, depts, courses, branches, allHods, theme }) => {
  const updateUser = useUpdateUserMutation();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(userEditSchema),
    shouldUnregister: false,
    defaultValues: {
      name: user.name,
      role: user.role,
      status: user.status,
      departmentId: user.departmentId || '',
      courseId: user.courseId || '',
      branchId: user.branchId || '',
      semester: user.semester || 1,
      reason: '',
      shift: user.shift || '',
    },
  });

  const editRoleValue = watch('role');
  const editDeptValue = watch('departmentId');
  const editCourseValue = watch('courseId');
  const editBranchValue = watch('branchId');
  const editSemesterValue = watch('semester');
  const editShiftValue = watch('shift');

  const [hodWarning, setHodWarning] = useState('');

  // Warn if assigning role HOD to a department that already has one
  useEffect(() => {
    if (user && editRoleValue === 'HOD' && editDeptValue && allHods?.data) {
      const deptObj = depts?.find((d) => String(d._id) === String(editDeptValue));
      const deptName = deptObj ? deptObj.name : 'this department';

      const existingInDept = allHods.data.filter(
        (h) => String(h.departmentId) === String(editDeptValue) && String(h.id) !== String(user.id) && h.status === 'ACTIVE'
      );

      if (existingInDept.length === 0) {
        setHodWarning('');
        return;
      }

      if (!editShiftValue) {
        const generalHod = existingInDept.find(h => h.shift === 'GENERAL');
        if (generalHod) {
          setHodWarning(`${deptName} already has a General HOD: ${generalHod.name}. You must reassign them before adding another HOD.`);
        } else {
          const shifts = existingInDept.map(h => `${h.name} (${h.shift})`).join(', ');
          setHodWarning(`${deptName} already has active HOD(s): ${shifts}. Please choose an available shift.`);
        }
        return;
      }

      if (editShiftValue === 'GENERAL') {
        const existing = existingInDept[0];
        setHodWarning(
          `${deptName} already has an active HOD: ${existing.name} (${existing.shift || 'GENERAL'}). Assigning a General HOD will conflict.`
        );
      } else {
        const conflicting = existingInDept.find(
          (h) => h.shift === 'GENERAL' || h.shift === editShiftValue
        );
        if (conflicting) {
          const reason = conflicting.shift === 'GENERAL'
            ? `${deptName} currently has a General HOD (${conflicting.name}). Reassign them before adding a ${editShiftValue} HOD.`
            : `${deptName} already has a ${editShiftValue}-shift HOD: ${conflicting.name}.`;
          setHodWarning(reason);
        } else {
          setHodWarning('');
        }
      }
    } else {
      setHodWarning('');
    }
  }, [user, editRoleValue, editDeptValue, editShiftValue, allHods, depts]);

  // Progressive cascading selects filters for course lengths bounds
  const getActiveCourseSemesters = useCallback(() => {
    const selectedCourse = courses?.find(c => String(c._id) === String(editCourseValue));
    if (selectedCourse) return selectedCourse.semesters || (selectedCourse.durationYears * 2);
    return 8;
  }, [courses, editCourseValue]);

  const semLimit = getActiveCourseSemesters();
  const semesterChoices = [];
  for (let i = 1; i <= semLimit; i++) {
    semesterChoices.push(i);
  }

  // Filter specialization branches cascading select based on course selection
  const filteredBranches = branches?.filter(
    (b) => String(b.courseId?._id || b.courseId) === String(editCourseValue)
  );

  const isStudentAcademicChanged = () => {
    if (!user || user.role !== 'STUDENT') return false;
    const branchChanged = String(editBranchValue) !== String(user.branchId || '');
    const semesterChanged = Number(editSemesterValue) !== Number(user.semester || 1);
    return branchChanged || semesterChanged;
  };

  // Reset child selections ONLY if the user explicitly changes the course dropdown value after mounting
  const prevCourseRef = useRef(user.courseId || '');
  useEffect(() => {
    if (editCourseValue !== prevCourseRef.current) {
      setValue('branchId', '');
      setValue('semester', 1);
      prevCourseRef.current = editCourseValue;
    }
  }, [editCourseValue, setValue]);

  const onEditSubmit = async (data) => {
    try {
      const payload = {
        name: data.name,
        role: data.role,
        status: data.status,
        departmentId: data.departmentId || null,
        courseId: data.courseId || null,
        branchId: data.branchId || null,
        semester: data.role === 'STUDENT' ? (data.semester || 1) : null,
        shift: data.role === 'HOD' ? data.shift : null,
      };

      if (isStudentAcademicChanged()) {
        payload.reason = data.reason;
      }

      await updateUser.mutateAsync({ id: user.id, data: payload });
      onSaveSuccess();
    } catch (err) {
      if (err.response?.data?.message) {
        setHodWarning(err.response.data.message);
      } else {
        setHodWarning('An unexpected error occurred during update.');
      }
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onEditSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 4.5, height: '100%', justifyContent: 'space-between' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
        <Box>
          <Typography variant="h5" sx={{ fontFamily: theme.typography.h1.fontFamily, fontWeight: 700, color: theme.palette.ink[900], mb: 0.5 }}>
            Edit Account Profile
          </Typography>
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
            Update roles, department mappings, and academic structures.
          </Typography>
        </Box>

        {hodWarning && (
          <Alert severity="warning" sx={{ fontFamily: theme.typography.body2.fontFamily, fontSize: '0.8rem' }}>
            {hodWarning}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Box>
            <Typography component="label" htmlFor="edit-name-input" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}>
              Full Name
            </Typography>
            <TextField
              id="edit-name-input"
              fullWidth
              size="small"
              {...register('name')}
              error={!!errors.name}
              helperText={errors.name?.message}
            />
          </Box>

          <Box>
            <Typography component="label" htmlFor="edit-role-select" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}>
              Account Role
            </Typography>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  id="edit-role-select"
                  select
                  fullWidth
                  size="small"
                  error={!!errors.role}
                  helperText={errors.role?.message}
                >
                  <MenuItem value="SUPER_ADMIN">Super Admin</MenuItem>
                  <MenuItem value="COLLEGE_ADMIN">College Admin</MenuItem>
                  <MenuItem value="HOD">HOD</MenuItem>
                  <MenuItem value="FACULTY">Faculty</MenuItem>
                  <MenuItem value="STUDENT">Student</MenuItem>
                </TextField>
              )}
            />
          </Box>

          <Box>
            <Typography component="label" htmlFor="edit-status-select" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}>
              Account Status
            </Typography>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  id="edit-status-select"
                  select
                  fullWidth
                  size="small"
                  error={!!errors.status}
                  helperText={errors.status?.message}
                >
                  <MenuItem value="ACTIVE">ACTIVE</MenuItem>
                  <MenuItem value="INACTIVE">INACTIVE</MenuItem>
                </TextField>
              )}
            />
          </Box>

          {/* Progressive disclosure fields based on role */}
          {editRoleValue !== 'SUPER_ADMIN' && editRoleValue !== 'COLLEGE_ADMIN' && (
            <Box>
              <Typography component="label" htmlFor="edit-dept-select" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}>
                Department
              </Typography>
              <Controller
                name="departmentId"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    id="edit-dept-select"
                    select
                    fullWidth
                    size="small"
                    error={!!errors.departmentId}
                    helperText={errors.departmentId?.message}
                  >
                    <MenuItem value="">Choose Department...</MenuItem>
                    {depts?.map((d) => (
                      <MenuItem key={d._id} value={d._id}>
                        {d.name}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Box>
          )}

          {editRoleValue === 'HOD' && (
            <Box>
              <Typography component="label" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}>
                HOD Scope
              </Typography>
              <Controller
                name="shift"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    size="small"
                    error={!!errors.shift}
                    helperText={errors.shift?.message}
                  >
                    <MenuItem value="">Choose HOD Scope...</MenuItem>
                    <MenuItem value="GENERAL">General (single HOD for the whole department)</MenuItem>
                    <MenuItem value="MORNING">Morning Shift (Day Scholars)</MenuItem>
                    <MenuItem value="EVENING">Evening Shift (Hostellers)</MenuItem>
                  </TextField>
                )}
              />
            </Box>
          )}

          {editRoleValue === 'STUDENT' && (
            <>
              <Box>
                <Typography component="label" htmlFor="edit-course-select" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}>
                  Parent Course
                </Typography>
                <Controller
                  name="courseId"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      id="edit-course-select"
                      select
                      fullWidth
                      size="small"
                      error={!!errors.courseId}
                      helperText={errors.courseId?.message}
                    >
                      <MenuItem value="">Choose Course...</MenuItem>
                      {courses?.map((c) => (
                        <MenuItem key={c._id} value={c._id}>
                          {c.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Box>

              <Box>
                <Typography component="label" htmlFor="edit-branch-select" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}>
                  Specialization Branch
                </Typography>
                <Controller
                  name="branchId"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      id="edit-branch-select"
                      select
                      fullWidth
                      size="small"
                      error={!!errors.branchId}
                      helperText={errors.branchId?.message}
                    >
                      <MenuItem value="">Choose Branch...</MenuItem>
                      {filteredBranches?.map((b) => (
                        <MenuItem key={b._id} value={b._id}>
                          {b.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Box>

              <Box>
                <Typography component="label" htmlFor="edit-semester-select" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}>
                  Semester Bounded
                </Typography>
                <Controller
                  name="semester"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      id="edit-semester-select"
                      select
                      fullWidth
                      size="small"
                      error={!!errors.semester}
                      helperText={errors.semester?.message}
                    >
                      {semesterChoices.map((num) => (
                        <MenuItem key={num} value={num}>
                          Semester {num}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Box>
            </>
          )}

          {isStudentAcademicChanged() && (
            <Box>
              <Typography component="label" htmlFor="edit-reason-input" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}>
                Reasoning for Change (Required)
              </Typography>
              <TextField
                id="edit-reason-input"
                fullWidth
                size="small"
                placeholder="Provide reasoning for updating study attributes..."
                {...register('reason')}
                error={!!errors.reason}
                helperText={errors.reason?.message}
              />
            </Box>
          )}
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="outlined"
          fullWidth
          onClick={onClose}
          sx={{ color: theme.palette.text.secondary, borderColor: theme.palette.divider, fontWeight: 600 }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={updateUser.isPending}
          sx={{
            bgcolor: theme.palette.primary.main,
            color: theme.palette.ink[900],
            fontWeight: 700,
            '&:hover': { bgcolor: theme.palette.primary.light },
          }}
        >
          {updateUser.isPending ? 'Updating...' : 'Save'}
        </Button>
      </Box>
    </Box>
  );
};

export default UserRoster;
