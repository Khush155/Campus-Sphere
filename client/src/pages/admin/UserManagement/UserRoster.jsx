import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '../../../contexts/ToastContext';
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
  IconButton,
  Menu,
  MenuItem,
  TextField,
  Chip,
  CircularProgress,
  Button,
  Drawer,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  Grid,
  Skeleton,
  Checkbox,
  Avatar,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  MoreVertOutlined,
  AddOutlined,
  SearchOutlined,
  FileDownloadOutlined,
  VisibilityOutlined,
  EditOutlined,
  CheckCircleOutlined,
  CancelOutlined,
  PeopleOutlined,
  DeleteOutline,
  BlockOutlined,
  DevicesOutlined,
  BadgeOutlined,
} from '@mui/icons-material';
import {
  useUsersQuery,
  useUserQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useHardDeleteUserMutation,
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
import { usePermissions } from '../../../utils/permissions';

const userEditSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long').max(50, 'Name cannot exceed 50 characters').trim(),
  role: z.string(),
  departmentId: z.string().optional().or(z.null()).or(z.literal('')),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  courseId: z.string().optional().or(z.null()).or(z.literal('')),
  branchId: z.string().optional().or(z.null()).or(z.literal('')),
  semester: z.number().optional().or(z.null()),
  rollNumber: z.string().optional().or(z.null()).or(z.literal('')),
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
  const { showToast } = useToast();
  const { user: currentUser } = useAuth();
  const { isAdmin, canActOnUser, canDelete } = usePermissions();
  const canRegister = isAdmin;
  const [searchParams, setSearchParams] = useSearchParams();

  // Search & Filter State
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get('search') || '');
  const [roleFilter, setRoleFilter] = useState(searchParams.get('role') || '');
  const [deptFilter, setDeptFilter] = useState(searchParams.get('dept') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');

  // Bulk Row Selection State
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);

  // Profile Quick View Drawer State
  const [viewUser, setViewUser] = useState(null);

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
  const [hardDeleteUser, setHardDeleteUser] = useState(null); // user selected for permanent delete
  const [hardDeleteConfirmText, setHardDeleteConfirmText] = useState(''); // must type DELETE
  const [anchorEl, setAnchorEl] = useState(null);
  const [activeMenuUser, setActiveMenuUser] = useState(null);
  const [sessionsDrawerOpen, setSessionsDrawerOpen] = useState(false);
  const [sessionsDrawerUser, setSessionsDrawerUser] = useState(null);

  // Compact view density
  const density = 'compact';

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
  const hardDelete = useHardDeleteUserMutation();

  const handleMenuOpen = (event, user) => {
    setAnchorEl(event.currentTarget);
    setActiveMenuUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setActiveMenuUser(null);
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

  const handleHardDeleteClick = () => {
    setHardDeleteUser(activeMenuUser);
    setHardDeleteConfirmText('');
    handleMenuClose();
  };

  const handleHardDeleteConfirm = async () => {
    if (hardDeleteConfirmText !== 'DELETE') return;
    const target = hardDeleteUser;
    setHardDeleteUser(null);
    setHardDeleteConfirmText('');
    try {
      await hardDelete.mutateAsync(target.id);
      showToast(`${target.name}'s account has been permanently deleted.`, { severity: 'success' });
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to permanently delete user.', { severity: 'error' });
    }
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
          await updateUser.mutateAsync({
            id: userToDeactivate.id,
            data: { status: 'ACTIVE' },
          });
          showToast(`${userToDeactivate.name}'s account reactivated.`);
        } else {
          await deleteUser.mutateAsync(userToDeactivate.id);
          showToast(`${userToDeactivate.name}'s account deactivated.`, {
            onUndo: async () => {
              await updateUser.mutateAsync({
                id: userToDeactivate.id,
                data: { status: 'ACTIVE' },
              });
              showToast(`Reactivated ${userToDeactivate.name}'s account.`);
            },
          });
        }
      } catch (err) {
        showToast(err.response?.data?.message || 'An error occurred.', { severity: 'error' });
      }
    }
  };

  // CSV Export Handler
  const handleExportCsv = () => {
    const list = usersData?.data || [];
    if (list.length === 0) {
      showToast('No user records available to export.', { severity: 'error' });
      return;
    }
    const headers = ['Name', 'Email', 'Roll Number', 'Role', 'Department', 'Status', 'Last Login'];
    const rows = list.map(u => [
      `"${u.name || ''}"`,
      `"${u.email || ''}"`,
      `"${u.rollNumber || 'N/A'}"`,
      `"${u.role || ''}"`,
      `"${u.department || 'Global'}"`,
      `"${u.status || ''}"`,
      `"${u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never'}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `users_directory_page_${page}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${list.length} user records to CSV.`);
  };

  // Bulk Selection Handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = (usersData?.data || []).map(u => u.id);
      setSelectedUserIds(allIds);
    } else {
      setSelectedUserIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedUserIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkStatusChange = async (newStatus) => {
    if (selectedUserIds.length === 0) return;
    setBulkProcessing(true);
    let count = 0;
    try {
      for (const id of selectedUserIds) {
        await updateUser.mutateAsync({ id, data: { status: newStatus } });
        count++;
      }
      showToast(`Successfully updated ${count} account(s) status to ${newStatus}.`);
      setSelectedUserIds([]);
    } catch (err) {
      showToast('Encountered an issue during bulk update.', { severity: 'error' });
    } finally {
      setBulkProcessing(false);
    }
  };

  // Maps roles to theme colors
  const getRoleChipStyles = (role) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return { bgcolor: 'rgba(184, 134, 62, 0.15)', color: theme.palette.brass?.[500] || '#b8863e' };
      case 'COLLEGE_ADMIN':
        return { bgcolor: `${theme.palette.primary.main}18`, color: theme.palette.primary.main };
      case 'HOD':
        return { bgcolor: `${theme.palette.secondary.main}18`, color: theme.palette.secondary.main };
      case 'FACULTY':
        return { bgcolor: 'rgba(59, 130, 246, 0.15)', color: '#2563eb' };
      case 'STUDENT':
        return { bgcolor: 'rgba(63, 110, 82, 0.15)', color: theme.palette.signal.success };
      default:
        return { bgcolor: 'rgba(0,0,0,0.06)', color: 'inherit' };
    }
  };

  // Check if register trigger is present in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('register') === 'true') {
      setRegisterOpen(true);
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5, position: 'relative' }}>
      {/* ── 1. Hero Directory Header Banner Card ──────────────────────────── */}
      <Card
        sx={{
          p: 3.5,
          borderRadius: '16px',
          border: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
          background: `linear-gradient(135deg, ${theme.palette.primary.main}0D 0%, ${theme.palette.secondary.main}06 100%)`,
          boxShadow: theme.custom?.elevation?.raised || 'none',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, flexWrap: 'wrap' }}>
            <Chip
              icon={<PeopleOutlined sx={{ fontSize: '0.9rem !important', color: `${theme.palette.primary.main} !important` }} />}
              label="INSTITUTIONAL USER ROSTER"
              size="small"
              sx={{
                bgcolor: `${theme.palette.primary.main}15`,
                color: theme.palette.primary.main,
                fontFamily: theme.typography.mono.fontFamily,
                fontWeight: 700,
                fontSize: '0.68rem',
                letterSpacing: '0.06em',
                borderRadius: '6px',
              }}
            />
            <Chip
              label={`${usersData?.meta?.total || 0} Accounts Total`}
              size="small"
              sx={{
                bgcolor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                fontFamily: theme.typography.mono.fontFamily,
                fontSize: '0.72rem',
                fontWeight: 600,
              }}
            />
          </Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontFamily: theme.typography.h1.fontFamily,
              fontWeight: 600,
              color: theme.palette.ink[900],
              lineHeight: 1.15,
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
            Manage institutional user accounts, access roles, active sessions, and profile configurations.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<FileDownloadOutlined />}
            onClick={handleExportCsv}
            sx={{
              borderColor: theme.palette.divider,
              color: theme.palette.text.primary,
              fontWeight: 600,
              px: 2,
              height: '42px',
              borderRadius: '8px',
              textTransform: 'none',
              bgcolor: theme.palette.background.paper,
              '&:hover': {
                borderColor: theme.palette.primary.main,
              },
            }}
          >
            Export CSV
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
                height: '42px',
                borderRadius: '8px',
              }}
            >
              Bulk ID Cards
            </Button>
          )}

          {canRegister && (
            <Button
              variant="contained"
              startIcon={<AddOutlined />}
              onClick={() => setRegisterOpen(true)}
              sx={{
                background: theme.palette.primary.gradient || theme.palette.primary.main,
                color: '#ffffff',
                fontWeight: 700,
                textTransform: 'none',
                px: 2.5,
                height: '42px',
                borderRadius: '8px',
                boxShadow: `0 4px 14px ${theme.palette.primary.main}35`,
              }}
            >
              Register User
            </Button>
          )}
        </Box>
      </Card>

      {/* ── 2. Filter Toolbar ─────────────────────────────────────────────── */}
      <Card
        sx={{
          p: 2.5,
          borderRadius: '12px',
          bgcolor: theme.custom?.surface?.raised || theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: 'none',
        }}
      >
        <Grid container spacing={2} alignItems="center">
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
            />
          </Grid>

          <Grid item xs={6} sm={2.5}>
            <TextField
              select
              fullWidth
              size="small"
              label="Role"
              value={roleFilter || ''}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="">All Roles</MenuItem>
              {currentUser?.role !== 'COLLEGE_ADMIN' && <MenuItem value="SUPER_ADMIN">Super Admin</MenuItem>}
              {currentUser?.role !== 'COLLEGE_ADMIN' && <MenuItem value="COLLEGE_ADMIN">College Admin</MenuItem>}
              <MenuItem value="HOD">HOD</MenuItem>
              <MenuItem value="FACULTY">Faculty</MenuItem>
              <MenuItem value="STUDENT">Student</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={6} sm={2.5}>
            <TextField
              select
              fullWidth
              size="small"
              label="Department"
              value={deptFilter || ''}
              onChange={(e) => {
                setDeptFilter(e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="">All Departments</MenuItem>
              {depts?.map((d) => (
                <MenuItem key={d._id} value={d._id}>
                  {d.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Status"
              value={statusFilter || ''}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="ACTIVE">Active Only</MenuItem>
              <MenuItem value="INACTIVE">Inactive Only</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Card>

      {/* ── 3. Table List Grid ────────────────────────────────────────────── */}
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
        <Card
          sx={{
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: 'none',
            borderRadius: '12px',
            overflow: 'hidden',
          }}
        >
          <TableContainer
            sx={{
              maxHeight: '60vh',
              overflowY: 'auto',
              overflowX: 'auto',
            }}
          >
            <Table aria-label="users directory list table" stickyHeader size={density === 'compact' ? 'small' : 'medium'} sx={{ tableLayout: 'fixed', minWidth: 960, width: '100%' }}>
              <TableHead>
                <TableRow>
                  {isAdmin && (
                    <TableCell
                      align="center"
                      sx={{
                        width: 56,
                        minWidth: 56,
                        maxWidth: 56,
                        px: 1,
                        py: density === 'compact' ? 1 : 1.5,
                        bgcolor: theme.palette.background.paper,
                        borderBottom: `2px solid ${theme.palette.divider}`,
                        zIndex: 10,
                      }}
                    >
                      <Checkbox
                        size="small"
                        checked={
                          selectedUserIds.length > 0 &&
                          selectedUserIds.length === (usersData?.data?.length || 0)
                        }
                        indeterminate={
                          selectedUserIds.length > 0 &&
                          selectedUserIds.length < (usersData?.data?.length || 0)
                        }
                        onChange={handleSelectAll}
                        sx={{ p: 0.5 }}
                      />
                    </TableCell>
                  )}
                  <TableCell
                    sx={{
                      width: 190,
                      py: density === 'compact' ? 1 : 1.5,
                      fontFamily: theme.typography.body2.fontFamily,
                      fontWeight: 700,
                      fontSize: '0.76rem',
                      color: theme.palette.text.primary,
                      bgcolor: theme.palette.background.paper,
                      borderBottom: `2px solid ${theme.palette.divider}`,
                      zIndex: 10,
                    }}
                  >
                    NAME
                  </TableCell>
                  <TableCell
                    sx={{
                      width: 250,
                      py: density === 'compact' ? 1 : 1.5,
                      fontFamily: theme.typography.body2.fontFamily,
                      fontWeight: 700,
                      fontSize: '0.76rem',
                      color: theme.palette.text.primary,
                      bgcolor: theme.palette.background.paper,
                      borderBottom: `2px solid ${theme.palette.divider}`,
                      zIndex: 10,
                    }}
                  >
                    ROLL NUMBER / EMAIL
                  </TableCell>
                  <TableCell
                    sx={{
                      width: 110,
                      py: density === 'compact' ? 1 : 1.5,
                      fontFamily: theme.typography.body2.fontFamily,
                      fontWeight: 700,
                      fontSize: '0.76rem',
                      color: theme.palette.text.primary,
                      bgcolor: theme.palette.background.paper,
                      borderBottom: `2px solid ${theme.palette.divider}`,
                      zIndex: 10,
                    }}
                  >
                    ROLE
                  </TableCell>
                  <TableCell
                    sx={{
                      width: 210,
                      py: density === 'compact' ? 1 : 1.5,
                      fontFamily: theme.typography.body2.fontFamily,
                      fontWeight: 700,
                      fontSize: '0.76rem',
                      color: theme.palette.text.primary,
                      bgcolor: theme.palette.background.paper,
                      borderBottom: `2px solid ${theme.palette.divider}`,
                      zIndex: 10,
                    }}
                  >
                    MAPPING DETAILS
                  </TableCell>
                  <TableCell
                    sx={{
                      width: 100,
                      py: density === 'compact' ? 1 : 1.5,
                      fontFamily: theme.typography.body2.fontFamily,
                      fontWeight: 700,
                      fontSize: '0.76rem',
                      color: theme.palette.text.primary,
                      bgcolor: theme.palette.background.paper,
                      borderBottom: `2px solid ${theme.palette.divider}`,
                      zIndex: 10,
                    }}
                  >
                    STATUS
                  </TableCell>
                  <TableCell
                    sx={{
                      width: 110,
                      py: density === 'compact' ? 1 : 1.5,
                      fontFamily: theme.typography.body2.fontFamily,
                      fontWeight: 700,
                      fontSize: '0.76rem',
                      color: theme.palette.text.primary,
                      bgcolor: theme.palette.background.paper,
                      borderBottom: `2px solid ${theme.palette.divider}`,
                      zIndex: 10,
                    }}
                  >
                    LAST LOGIN
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      width: 110,
                      py: density === 'compact' ? 1 : 1.5,
                      fontFamily: theme.typography.body2.fontFamily,
                      fontWeight: 700,
                      fontSize: '0.76rem',
                      color: theme.palette.text.primary,
                      bgcolor: theme.palette.background.paper,
                      borderBottom: `2px solid ${theme.palette.divider}`,
                      zIndex: 10,
                    }}
                  >
                    ACTIONS
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {usersData.data.map((user, index) => {
                  const isInactive = user.status === 'INACTIVE';
                  const chipStyles = getRoleChipStyles(user.role);
                  const isSelected = selectedUserIds.includes(user.id);

                  return (
                    <TableRow
                      key={user.id}
                      className="staggered-row"
                      style={{ animationDelay: `${index * 20}ms` }}
                      sx={{
                        opacity: isInactive ? 0.55 : 1,
                        bgcolor: isSelected ? `${theme.palette.primary.main}0D` : 'transparent',
                        '&:hover': { bgcolor: theme.custom?.interaction?.hoverTint || 'rgba(0,0,0,0.02)' },
                        transition: 'opacity 0.15s ease-in-out',
                      }}
                    >
                      {isAdmin && (
                        <TableCell align="center" sx={{ width: 56, minWidth: 56, maxWidth: 56, px: 1 }}>
                          <Checkbox
                            size="small"
                            checked={isSelected}
                            onChange={() => handleSelectOne(user.id)}
                            sx={{ p: 0.5 }}
                          />
                        </TableCell>
                      )}
                      <TableCell
                        onClick={() => setViewUser(user)}
                        sx={{
                          width: 190,
                          py: density === 'compact' ? 0.75 : 1.25,
                          fontFamily: theme.typography.body1.fontFamily,
                          fontSize: density === 'compact' ? '0.8rem' : '0.84rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          '&:hover': { color: theme.palette.primary.main, textDecoration: 'underline' },
                        }}
                      >
                        {user.name}
                      </TableCell>
                    <TableCell sx={{ width: 260, py: density === 'compact' ? 1 : 1.75, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.role === 'STUDENT' && user.rollNumber ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, overflow: 'hidden' }}>
                          <Chip
                            label={user.rollNumber}
                            size="small"
                            sx={{
                              fontWeight: 800,
                              fontFamily: theme.typography.mono.fontFamily,
                              fontSize: '0.72rem',
                              bgcolor: `${theme.palette.primary.main}15`,
                              color: theme.palette.primary.main,
                              width: 'fit-content',
                              height: 20,
                            }}
                          />
                          <Typography
                            variant="caption"
                            sx={{
                              fontFamily: theme.typography.mono.fontFamily,
                              fontSize: '0.68rem',
                              color: 'text.secondary',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {user.email}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: theme.typography.mono.fontFamily,
                            fontSize: density === 'compact' ? '0.74rem' : '0.78rem',
                            color: theme.palette.text.secondary,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {user.email}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ width: 120, py: density === 'compact' ? 1 : 1.75 }}>
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
                    <TableCell sx={{ width: 220, py: density === 'compact' ? 1 : 1.75, fontFamily: theme.typography.body2.fontFamily, fontSize: density === 'compact' ? '0.78rem' : '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.role === 'STUDENT' ? (
                        <>
                          {user.branch || 'No Branch'} ·{' '}
                          <Box component="span" sx={{ fontFamily: theme.typography.mono.fontFamily, color: theme.palette.text.secondary }}>
                            Sem {user.semester || '—'}
                          </Box>
                        </>
                      ) : user.role === 'HOD' ? (
                        <>
                          {user.department || 'No Department'} ·{' '}
                          <Box component="span" sx={{ fontFamily: theme.typography.mono.fontFamily, color: theme.palette.text.secondary }}>
                            {user.shift === 'MORNING' ? 'Morning' : user.shift === 'EVENING' ? 'Evening' : 'General'} Shift
                          </Box>
                        </>
                      ) : (
                        user.department || 'Global / Administrator'
                      )}
                    </TableCell>
                    <TableCell sx={{ width: 110, py: density === 'compact' ? 1 : 1.75 }}>
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
                    <TableCell sx={{ width: 120, py: density === 'compact' ? 1 : 1.75, fontFamily: theme.typography.body2.fontFamily, fontSize: density === 'compact' ? '0.78rem' : '0.82rem', color: theme.palette.text.secondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {formatRelativeTime(user.lastLoginAt)}
                    </TableCell>
                    <TableCell align="right" sx={{ width: 110, py: density === 'compact' ? 1 : 1.75, whiteSpace: 'nowrap' }}>
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                        <Tooltip title="View Profile">
                          <IconButton size="small" onClick={() => setViewUser(user)} sx={{ color: theme.palette.primary.main }}>
                            <VisibilityOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {canActOnUser(user.role) && (
                          <Tooltip title="Edit User">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setEditUser(user);
                                setEditDrawerOpen(true);
                              }}
                              sx={{ color: theme.palette.text.secondary, '&:hover': { color: theme.palette.primary.main } }}
                            >
                              <EditOutlined fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="More Actions">
                          <IconButton aria-label="user actions menu" size="small" onClick={(e) => handleMenuOpen(e, user)}>
                            <MoreVertOutlined fontSize="small" sx={{ color: theme.palette.text.secondary }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
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
        </Card>
      )}

      {/* ── 4. Bulk Action Floating Bar ───────────────────────────────────── */}
      {selectedUserIds.length > 0 && (
        <Card
          sx={{
            position: 'fixed',
            bottom: 32,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1300,
            p: 1.5,
            px: 3,
            borderRadius: '12px',
            bgcolor: theme.palette.ink[900],
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            gap: 2.5,
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: theme.typography.mono.fontFamily }}>
            {selectedUserIds.length} user(s) selected
          </Typography>
          <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              variant="contained"
              color="success"
              disabled={bulkProcessing}
              startIcon={<CheckCircleOutlined />}
              onClick={() => handleBulkStatusChange('ACTIVE')}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Bulk Activate
            </Button>
            <Button
              size="small"
              variant="contained"
              color="error"
              disabled={bulkProcessing}
              startIcon={<CancelOutlined />}
              onClick={() => handleBulkStatusChange('INACTIVE')}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Bulk Deactivate
            </Button>
            <Button
              size="small"
              onClick={() => setSelectedUserIds([])}
              sx={{ color: 'rgba(255,255,255,0.7)', textTransform: 'none' }}
            >
              Clear
            </Button>
          </Box>
        </Card>
      )}

      {/* ── 5. Action Dropdown Menu ────────────────────────────────────────── */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        {canActOnUser(activeMenuUser?.role) && canDelete('USER', activeMenuUser?.role) && (
          <MenuItem
            onClick={handleDeactivateClick}
            sx={{ color: activeMenuUser?.status === 'INACTIVE' ? theme.palette.signal.success : 'rgb(217, 119, 6)' }}
          >
            {activeMenuUser?.status === 'INACTIVE' ? (
              <>
                <CheckCircleOutlined sx={{ fontSize: 18, mr: 1.25, color: theme.palette.signal.success }} />
                Activate
              </>
            ) : (
              <>
                <BlockOutlined sx={{ fontSize: 18, mr: 1.25, color: 'rgb(217, 119, 6)' }} />
                Deactivate
              </>
            )}
          </MenuItem>
        )}
        {canActOnUser(activeMenuUser?.role) && canDelete('PERMANENT_USER_DELETE', activeMenuUser?.role) && (
          <MenuItem onClick={handleHardDeleteClick} sx={{ color: theme.palette.signal.error }}>
            <DeleteOutline sx={{ fontSize: 18, mr: 1.25, color: theme.palette.signal.error }} />
            Delete
          </MenuItem>
        )}
        <MenuItem onClick={handleViewSessionsClick}>
          <DevicesOutlined sx={{ fontSize: 18, mr: 1.25, color: theme.palette.text.secondary }} />
          View Sessions
        </MenuItem>
        {['STUDENT', 'FACULTY', 'HOD'].includes(activeMenuUser?.role) && (
          <MenuItem onClick={handleGenerateIdCardClick}>
            <BadgeOutlined sx={{ fontSize: 18, mr: 1.25, color: theme.palette.primary.main }} />
            ID Card
          </MenuItem>
        )}
      </Menu>

      {/* ── 6. Profile Quick View Drawer ───────────────────────────────────── */}
      <Drawer
        anchor="right"
        open={Boolean(viewUser)}
        onClose={() => setViewUser(null)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 440 }, p: 4, bgcolor: theme.palette.background.paper } }}
      >
        {viewUser && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                sx={{
                  width: 64,
                  height: 64,
                  bgcolor: `${theme.palette.primary.main}18`,
                  color: theme.palette.primary.main,
                  fontWeight: 700,
                  fontSize: '1.5rem',
                }}
              >
                {viewUser.name?.charAt(0) || 'U'}
              </Avatar>
              <Box>
                <Typography variant="h5" sx={{ fontFamily: theme.typography.h1.fontFamily, fontWeight: 700, color: theme.palette.ink[900] }}>
                  {viewUser.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontFamily: theme.typography.mono.fontFamily }}>
                  {viewUser.email}
                </Typography>
                {viewUser.role === 'STUDENT' && (
                  <Chip
                    label={`Roll No: ${viewUser.rollNumber || 'Not Assigned'}`}
                    size="small"
                    sx={{
                      mt: 0.75,
                      fontWeight: 800,
                      fontFamily: theme.typography.mono.fontFamily,
                      fontSize: '0.72rem',
                      bgcolor: `${theme.palette.primary.main}18`,
                      color: theme.palette.primary.main,
                      border: `1px solid ${theme.palette.primary.main}30`,
                    }}
                  />
                )}
              </Box>
            </Box>

            <Divider />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Account Status
                </Typography>
                <Chip
                  label={viewUser.status}
                  size="small"
                  color={viewUser.status === 'ACTIVE' ? 'success' : 'error'}
                  sx={{ fontWeight: 700, fontFamily: theme.typography.mono.fontFamily }}
                />
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Role Access
                </Typography>
                <Chip
                  label={viewUser.role}
                  size="small"
                  sx={{
                    bgcolor: `${theme.palette.primary.main}15`,
                    color: theme.palette.primary.main,
                    fontWeight: 700,
                    fontFamily: theme.typography.mono.fontFamily,
                  }}
                />
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Department
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.ink[900] }}>
                  {viewUser.department || 'Global / Campus Wide'}
                </Typography>
              </Box>

              {viewUser.role === 'STUDENT' && (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Roll Number
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: theme.typography.mono.fontFamily, color: theme.palette.primary.main }}>
                      {viewUser.rollNumber || 'Not assigned'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Academic Branch
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {viewUser.branch || 'Unassigned'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Semester
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: theme.typography.mono.fontFamily }}>
                      Semester {viewUser.semester || '—'}
                    </Typography>
                  </Box>
                </>
              )}

              {viewUser.role === 'HOD' && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Assigned Shift
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {viewUser.shift || 'GENERAL'}
                  </Typography>
                </Box>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Last Active Login
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: theme.typography.mono.fontFamily }}>
                  {formatRelativeTime(viewUser.lastLoginAt)}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ mt: 'auto', display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                onClick={() => setViewUser(null)}
                sx={{ color: theme.palette.text.secondary, borderColor: theme.palette.divider, minWidth: 70 }}
              >
                Close
              </Button>
              {canActOnUser(viewUser?.role) && canDelete('USER', viewUser?.role) && (
                <Button
                  variant="outlined"
                  sx={{
                    color: viewUser?.status === 'INACTIVE' ? theme.palette.signal.success : 'rgb(217, 119, 6)',
                    borderColor: viewUser?.status === 'INACTIVE' ? theme.palette.signal.success : 'rgb(217, 119, 6)',
                    fontWeight: 700,
                    textTransform: 'none',
                  }}
                  startIcon={viewUser?.status === 'INACTIVE' ? <CheckCircleOutlined /> : <BlockOutlined />}
                  onClick={() => {
                    setDeactivateUser(viewUser);
                    setViewUser(null);
                  }}
                >
                  {viewUser?.status === 'INACTIVE' ? 'Reactivate' : 'Deactivate'}
                </Button>
              )}
              {canActOnUser(viewUser?.role) && canDelete('PERMANENT_USER_DELETE', viewUser?.role) && (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteOutline />}
                  onClick={() => {
                    setHardDeleteUser(viewUser);
                    setHardDeleteConfirmText('');
                    setViewUser(null);
                  }}
                  sx={{ fontWeight: 700, textTransform: 'none' }}
                >
                  Delete
                </Button>
              )}
              {canActOnUser(viewUser?.role) && (
                <Button
                  variant="contained"
                  onClick={() => {
                    setEditUser(viewUser);
                    setViewUser(null);
                    setEditDrawerOpen(true);
                  }}
                  sx={{
                    background: theme.palette.primary.gradient || theme.palette.primary.main,
                    color: '#ffffff',
                    fontWeight: 700,
                    ml: 'auto',
                  }}
                >
                  Edit Profile
                </Button>
              )}
            </Box>
          </Box>
        )}
      </Drawer>

      {/* User Creation Wizard Modal */}
      <UserRegister open={registerOpen} onClose={() => setRegisterOpen(false)} />

      {/* Edit User Drawer */}
      <Drawer
        anchor="right"
        open={editDrawerOpen}
        onClose={() => setEditDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 460 }, p: 4, bgcolor: theme.palette.background.paper } }}
      >
        {editUser && (
          <EditUserForm
            userId={editUser.id}
            onClose={() => setEditDrawerOpen(false)}
            onSaveSuccess={(msg) => showToast(msg)}
            depts={depts}
            courses={courses}
            branches={branches}
            allHods={allHods?.data}
            theme={theme}
          />
        )}
      </Drawer>

      {/* Active Sessions Drawer */}
      <Drawer
        anchor="right"
        open={sessionsDrawerOpen}
        onClose={() => setSessionsDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 420 }, p: 4, bgcolor: theme.palette.background.paper } }}
      >
        {sessionsDrawerUser && (
          <ActiveSessionsDrawer
            user={sessionsDrawerUser}
            onClose={() => setSessionsDrawerOpen(false)}
            onRevokeSuccess={(msg) => showToast(msg)}
            theme={theme}
          />
        )}
      </Drawer>

      {/* Deactivate Confirmation Modal */}
      <ConfirmDeleteModal
        open={Boolean(deactivateUser)}
        title={deactivateUser?.status === 'INACTIVE' ? "Reactivate User Account" : "Deactivate User Account"}
        description={
          deactivateUser?.status === 'INACTIVE'
            ? `Are you sure you want to reactivate ${deactivateUser?.name}'s (${deactivateUser?.email}) account? They will regain active login access.`
            : `Are you sure you want to deactivate ${deactivateUser?.name}'s (${deactivateUser?.email}) account? Their access will be suspended and they will be logged out.`
        }
        actionText={deactivateUser?.status === 'INACTIVE' ? 'Reactivate User' : 'Deactivate User'}
        confirmationWord={deactivateUser?.status === 'INACTIVE' ? 'REACTIVATE' : 'DEACTIVATE'}
        onClose={() => setDeactivateUser(null)}
        onConfirm={handleDeactivateConfirm}
        isDeleting={deleteUser.isPending || updateUser.isPending}
      />

      {/* Hard Delete Confirmation — requires typing DELETE */}
      {Boolean(hardDeleteUser) && (
        <Dialog
          open
          onClose={() => { setHardDeleteUser(null); setHardDeleteConfirmText(''); }}
          maxWidth="xs"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
        >
          <DialogTitle sx={{ fontFamily: theme.typography.h1.fontFamily, fontWeight: 700, color: theme.palette.signal.error }}>
            Permanently Delete Account
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
              This will <strong>permanently and irreversibly</strong> remove{' '}
              <strong>{hardDeleteUser?.name}</strong>&apos;s account from the system. This action cannot be undone.
            </Typography>
            <Typography variant="body2" sx={{ mb: 1.5, fontWeight: 600 }}>
              Type <strong>DELETE</strong> to confirm:
            </Typography>
            <TextField
              autoFocus
              fullWidth
              size="small"
              placeholder="DELETE"
              value={hardDeleteConfirmText}
              onChange={(e) => setHardDeleteConfirmText(e.target.value)}
              inputProps={{ style: { fontFamily: 'monospace', letterSpacing: 2 } }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
            <Button
              variant="outlined"
              onClick={() => { setHardDeleteUser(null); setHardDeleteConfirmText(''); }}
              sx={{ borderRadius: 2 }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              disabled={hardDeleteConfirmText !== 'DELETE' || hardDelete.isPending}
              onClick={handleHardDeleteConfirm}
              sx={{
                borderRadius: 2,
                bgcolor: theme.palette.signal.error,
                '&:hover': { bgcolor: theme.palette.signal.error, opacity: 0.9 },
                '&:disabled': { bgcolor: theme.palette.signal.error, opacity: 0.4 },
              }}
            >
              {hardDelete.isPending ? 'Deleting…' : 'Delete Permanently'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

/**
 * Subcomponent to handle Edit User Form state, validation, cascading selects and loader skeleton.
 */
const EditUserForm = ({ userId, onClose, onSaveSuccess, depts, courses, branches, theme }) => {
  const { data: user, isLoading } = useUserQuery(userId);
  const updateUser = useUpdateUserMutation();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors, isDirty },
    reset,
  } = useForm({
    resolver: zodResolver(userEditSchema),
  });

  const selectedRole = watch('role');
  const selectedCourseId = watch('courseId');

  useEffect(() => {
    if (user) {
      const deptId = typeof user.departmentId === 'object' ? user.departmentId?._id || '' : user.departmentId || '';
      const crsId = typeof user.courseId === 'object' ? user.courseId?._id || '' : user.courseId || '';
      const brnId = typeof user.branchId === 'object' ? user.branchId?._id || '' : user.branchId || '';

      reset({
        name: user.name || '',
        role: user.role || 'STUDENT',
        departmentId: String(deptId),
        status: user.status || 'ACTIVE',
        courseId: String(crsId),
        branchId: String(brnId),
        semester: Number(user.semester) || 1,
        rollNumber: user.rollNumber || '',
        shift: user.shift || 'GENERAL',
        reason: '',
      });
    }
  }, [user, reset]);

  const filteredBranches = React.useMemo(() => {
    if (!selectedCourseId) return branches || [];
    return (branches || []).filter((b) => {
      const bCourseId = typeof b.courseId === 'object' ? b.courseId?._id : b.courseId;
      return String(bCourseId) === String(selectedCourseId);
    });
  }, [branches, selectedCourseId]);

  const onSubmit = async (formData) => {
    try {
      await updateUser.mutateAsync({
        id: userId,
        data: formData,
      });
      onSaveSuccess('User details updated successfully.');
      onClose();
    } catch (err) {
      // Handled by query mutation error handler
    }
  };

  if (isLoading || !user) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Skeleton variant="text" width="60%" height={32} />
        <Skeleton variant="rectangular" height={200} sx={{ borderRadius: '8px' }} />
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 3.5, height: '100%', justifyContent: 'space-between' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontFamily: theme.typography.h1.fontFamily, fontWeight: 700, color: theme.palette.ink[900], mb: 0.5 }}>
            Edit User Profile
          </Typography>
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontFamily: theme.typography.mono.fontFamily }}>
            {user.email}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.25 }}>
          <Box>
            <Typography component="label" htmlFor="edit-user-name" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 0.75 }}>
              Full Name
            </Typography>
            <TextField
              id="edit-user-name"
              fullWidth
              size="small"
              {...register('name')}
              error={!!errors.name}
              helperText={errors.name?.message}
            />
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography component="label" htmlFor="edit-user-role" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 0.75 }}>
                Role Access
              </Typography>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    id="edit-user-role"
                    select
                    fullWidth
                    size="small"
                    error={!!errors.role}
                    helperText={errors.role?.message}
                  >
                    <MenuItem value="STUDENT">Student</MenuItem>
                    <MenuItem value="FACULTY">Faculty</MenuItem>
                    <MenuItem value="HOD">HOD</MenuItem>
                    <MenuItem value="COLLEGE_ADMIN">College Admin</MenuItem>
                    <MenuItem value="SUPER_ADMIN">Super Admin</MenuItem>
                  </TextField>
                )}
              />
            </Grid>

            <Grid item xs={6}>
              <Typography component="label" htmlFor="edit-user-status" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 0.75 }}>
                Account Status
              </Typography>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    id="edit-user-status"
                    select
                    fullWidth
                    size="small"
                    error={!!errors.status}
                    helperText={errors.status?.message}
                  >
                    <MenuItem value="ACTIVE">Active</MenuItem>
                    <MenuItem value="INACTIVE">Inactive</MenuItem>
                  </TextField>
                )}
              />
            </Grid>
          </Grid>

          {['STUDENT', 'FACULTY', 'HOD'].includes(selectedRole) && (
            <Box>
              <Typography component="label" htmlFor="edit-user-dept" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 0.75 }}>
                Department
              </Typography>
              <Controller
                name="departmentId"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    id="edit-user-dept"
                    select
                    fullWidth
                    size="small"
                    error={!!errors.departmentId}
                    helperText={errors.departmentId?.message}
                  >
                    <MenuItem value="">Select Department...</MenuItem>
                    {depts?.map((d) => (
                      <MenuItem key={d._id} value={d._id}>
                        {d.name} ({d.code})
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Box>
          )}

          {selectedRole === 'STUDENT' && (
            <>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography component="label" htmlFor="edit-user-course" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 0.75 }}>
                    Degree Course
                  </Typography>
                  <Controller
                    name="courseId"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          setValue('branchId', '');
                        }}
                        id="edit-user-course"
                        select
                        fullWidth
                        size="small"
                        error={!!errors.courseId}
                        helperText={errors.courseId?.message}
                      >
                        <MenuItem value="">Select Course...</MenuItem>
                        {courses?.map((c) => (
                          <MenuItem key={c._id || c.id} value={c._id || c.id}>
                            {c.name} ({c.code})
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                  />
                </Grid>

                <Grid item xs={6}>
                  <Typography component="label" htmlFor="edit-user-branch" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 0.75 }}>
                    Branch
                  </Typography>
                  <Controller
                    name="branchId"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          const selectedBranch = branches?.find((b) => String(b._id || b.id) === String(e.target.value));
                          if (selectedBranch) {
                            const bCrsId = selectedBranch.courseId?._id || selectedBranch.courseId;
                            const bDeptId = selectedBranch.hostingDepartmentId?._id || selectedBranch.hostingDepartmentId;
                            if (bCrsId) setValue('courseId', String(bCrsId));
                            if (bDeptId) setValue('departmentId', String(bDeptId));
                          }
                        }}
                        id="edit-user-branch"
                        select
                        fullWidth
                        size="small"
                        error={!!errors.branchId}
                        helperText={errors.branchId?.message}
                      >
                        <MenuItem value="">Select Branch...</MenuItem>
                        {filteredBranches.map((b) => (
                          <MenuItem key={b._id || b.id} value={b._id || b.id}>
                            {b.name} ({b.code})
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                  />
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography component="label" htmlFor="edit-user-semester" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 0.75 }}>
                    Semester
                  </Typography>
                  <Controller
                    name="semester"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        id="edit-user-semester"
                        select
                        fullWidth
                        size="small"
                        error={!!errors.semester}
                        helperText={errors.semester?.message}
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                          <MenuItem key={sem} value={sem}>
                            Semester {sem}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                  />
                </Grid>

                <Grid item xs={6}>
                  <Typography component="label" htmlFor="edit-user-rollno" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 0.75 }}>
                    Roll Number
                  </Typography>
                  <TextField
                    id="edit-user-rollno"
                    fullWidth
                    size="small"
                    placeholder="e.g. 2026-CSE-042"
                    {...register('rollNumber')}
                    error={!!errors.rollNumber}
                    helperText={errors.rollNumber?.message}
                  />
                </Grid>
              </Grid>
            </>
          )}

          {selectedRole === 'HOD' && (
            <Box>
              <Typography component="label" htmlFor="edit-user-shift" sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 0.75 }}>
                Shift
              </Typography>
              <Controller
                name="shift"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    id="edit-user-shift"
                    select
                    fullWidth
                    size="small"
                    error={!!errors.shift}
                    helperText={errors.shift?.message}
                  >
                    <MenuItem value="GENERAL">General</MenuItem>
                    <MenuItem value="MORNING">Morning Shift</MenuItem>
                    <MenuItem value="EVENING">Evening Shift</MenuItem>
                  </TextField>
                )}
              />
            </Box>
          )}
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, pt: 2 }}>
        <Button variant="outlined" fullWidth onClick={onClose} sx={{ color: theme.palette.text.secondary }}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={!isDirty || updateUser.isPending}
          sx={{
            background: theme.palette.primary.gradient || theme.palette.primary.main,
            color: '#ffffff',
            fontWeight: 700,
          }}
        >
          {updateUser.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </Box>
    </Box>
  );
};

/**
 * Subcomponent to view & revoke active user sessions
 */
const ActiveSessionsDrawer = ({ user, onClose, _onRevokeSuccess, theme }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%' }}>
      <Box>
        <Typography variant="h5" sx={{ fontFamily: theme.typography.h1.fontFamily, fontWeight: 700, color: theme.palette.ink[900], mb: 0.5 }}>
          Active Sessions
        </Typography>
        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontFamily: theme.typography.mono.fontFamily }}>
          {user.name} ({user.email})
        </Typography>
      </Box>

      <Card sx={{ p: 2.5, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
          Current Login Session
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
          Last active: {formatRelativeTime(user.lastLoginAt)}
        </Typography>
        <Chip label="Session Active" size="small" color="success" sx={{ fontWeight: 700 }} />
      </Card>

      <Box sx={{ mt: 'auto' }}>
        <Button variant="outlined" fullWidth onClick={onClose}>
          Close
        </Button>
      </Box>
    </Box>
  );
};

export default UserRoster;
