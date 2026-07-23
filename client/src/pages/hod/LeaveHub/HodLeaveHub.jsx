/* eslint-disable */
import React, { useState, useMemo } from 'react';
import { 
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, MenuItem, Chip, IconButton, Tooltip, Snackbar, Alert,
  Grid, Card, CardContent, useTheme
} from '@mui/material';
import {
  CheckCircleOutlined, CancelOutlined, HourglassTopOutlined,
  SearchOutlined, EventOutlined, PersonOutlined
} from '@mui/icons-material';
import DataTable from '../../../components/common/DataTable';
import EmptyState from '../../../components/common/EmptyState';
import { useLeaveQuery, useUpdateLeaveStatusMutation } from '../../../queries/hodQueries';

const LEAVE_TYPES = [
  { value: 'SICK', label: 'Sick Leave' },
  { value: 'CASUAL', label: 'Casual Leave' },
  { value: 'ACADEMIC', label: 'Academic Leave' },
  { value: 'EMERGENCY', label: 'Emergency Leave' },
  { value: 'MEDICAL', label: 'Medical Exemption Leave' },
];

const HodLeaveHub = () => {
  const theme = useTheme();

  // Modal States for Approval & Rejection
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [remarks, setRemarks] = useState('');

  // Filter & Search States
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Toast Notification State
  const [toast, setToast] = useState({ open: false, msg: '', severity: 'success' });
  const showToast = (msg, severity = 'success') => setToast({ open: true, msg, severity });

  // Debounce search
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Query leave requests for department faculty
  const { data: leaves = [], isLoading, isError } = useLeaveQuery({
    status: statusFilter || undefined,
    leaveType: typeFilter || undefined,
  });

  const updateStatusMutation = useUpdateLeaveStatusMutation();

  // Client-side search filtering (Faculty Name or Email)
  const filteredLeaves = useMemo(() => {
    if (!leaves) return [];
    if (!debouncedSearch) return leaves;
    const q = debouncedSearch.toLowerCase();
    return leaves.filter(r => {
      const name = r.userId?.name?.toLowerCase() || '';
      const email = r.userId?.email?.toLowerCase() || '';
      const reason = r.reason?.toLowerCase() || '';
      return name.includes(q) || email.includes(q) || reason.includes(q);
    });
  }, [leaves, debouncedSearch]);

  // Compute KPI Stats
  const stats = useMemo(() => {
    const total = leaves.length;
    const pending = leaves.filter(l => l.status === 'PENDING').length;
    const approved = leaves.filter(l => l.status === 'APPROVED').length;
    const rejected = leaves.filter(l => l.status === 'REJECTED').length;
    return { total, pending, approved, rejected };
  }, [leaves]);

  const openApproveModal = (row) => {
    setSelectedLeave(row);
    setRemarks('');
    setApproveModalOpen(true);
  };

  const openRejectModal = (row) => {
    setSelectedLeave(row);
    setRemarks('');
    setRejectModalOpen(true);
  };

  const handleApproveConfirm = () => {
    if (selectedLeave) {
      updateStatusMutation.mutate(
        { id: selectedLeave._id, status: 'APPROVED', remarks },
        {
          onSuccess: () => {
            showToast(`Leave request approved for ${selectedLeave.userId?.name || 'Faculty Member'}.`);
            setApproveModalOpen(false);
            setSelectedLeave(null);
          },
          onError: (err) => showToast(err.response?.data?.message || 'Failed to approve leave', 'error')
        }
      );
    }
  };

  const handleRejectConfirm = () => {
    if (selectedLeave) {
      updateStatusMutation.mutate(
        { id: selectedLeave._id, status: 'REJECTED', remarks },
        {
          onSuccess: () => {
            showToast(`Leave request rejected for ${selectedLeave.userId?.name || 'Faculty Member'}.`);
            setRejectModalOpen(false);
            setSelectedLeave(null);
          },
          onError: (err) => showToast(err.response?.data?.message || 'Failed to reject leave', 'error')
        }
      );
    }
  };

  const columns = [
    { 
      id: 'faculty', 
      label: 'Faculty Member',
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <PersonOutlined color="action" fontSize="small" />
          <Box>
            <Typography variant="body2" fontWeight={600}>{row.userId?.name || 'Faculty Member'}</Typography>
            <Typography variant="caption" color="text.secondary">{row.userId?.email || '—'}</Typography>
          </Box>
        </Box>
      )
    },
    { 
      id: 'leaveType', 
      label: 'Leave Type',
      render: (row) => (
        <Chip 
          label={row.leaveType || 'CASUAL'} 
          size="small" 
          color={row.leaveType === 'MEDICAL' || row.leaveType === 'SICK' ? 'info' : 'secondary'} 
          variant="outlined" 
          sx={{ fontWeight: 600 }}
        />
      )
    },
    { 
      id: 'startDate', 
      label: 'Start Date',
      render: (row) => row.startDate ? new Date(row.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
    },
    { 
      id: 'endDate', 
      label: 'End Date',
      render: (row) => row.endDate ? new Date(row.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
    },
    { 
      id: 'totalDays', 
      label: 'Duration',
      render: (row) => <Chip label={`${row.totalDays || 1} day(s)`} size="small" variant="outlined" />
    },
    { id: 'reason', label: 'Reason', render: (row) => row.reason || '—' },
    { 
      id: 'status', 
      label: 'Status',
      render: (row) => {
        const statusColors = { PENDING: 'warning', APPROVED: 'success', REJECTED: 'error' };
        return (
          <Chip 
            label={row.status || 'PENDING'} 
            size="small" 
            color={statusColors[row.status] || 'default'} 
            sx={{ fontWeight: 700 }}
          />
        );
      }
    },
  ];

  const customActions = (row) => {
    if (row.status !== 'PENDING') return null;
    return (
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        <Tooltip title="Approve Faculty Leave">
          <IconButton size="small" color="success" onClick={() => openApproveModal(row)} disabled={updateStatusMutation.isPending}>
            <CheckCircleOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Reject Faculty Leave">
          <IconButton size="small" color="error" onClick={() => openRejectModal(row)} disabled={updateStatusMutation.isPending}>
            <CancelOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    );
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 3 }, display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" sx={{ color: theme.palette.ink?.[900] || 'text.primary' }}>
            Faculty Leave Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Review and approve leave applications submitted by faculty members in your department.
          </Typography>
        </Box>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={3}>
          <Card sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>TOTAL APPLICATIONS</Typography>
              <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5 }}>{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card sx={{ borderRadius: 3, border: `1px solid ${theme.palette.warning.light}`, bgcolor: 'warning.50' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="warning.main" fontWeight={700}>PENDING APPROVAL</Typography>
              <Typography variant="h4" fontWeight={800} color="warning.main" sx={{ mt: 0.5 }}>{stats.pending}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card sx={{ borderRadius: 3, border: `1px solid ${theme.palette.success.light}`, bgcolor: 'success.50' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="success.main" fontWeight={700}>APPROVED LEAVES</Typography>
              <Typography variant="h4" fontWeight={800} color="success.main" sx={{ mt: 0.5 }}>{stats.approved}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>REJECTED</Typography>
              <Typography variant="h4" fontWeight={800} color="error.main" sx={{ mt: 0.5 }}>{stats.rejected}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter Bar */}
      <Box sx={{ p: 2, borderRadius: '12px', bgcolor: 'rgba(28, 46, 69, 0.02)', border: `1px solid ${theme.palette.divider}` }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search faculty name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchOutlined fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              sx={{ bgcolor: 'background.paper' }}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={4}>
            <TextField
              select
              fullWidth
              size="small"
              label="Filter by Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{ bgcolor: 'background.paper' }}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="PENDING">Pending Approval</MenuItem>
              <MenuItem value="APPROVED">Approved</MenuItem>
              <MenuItem value="REJECTED">Rejected</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={6} sm={4} md={4}>
            <TextField
              select
              fullWidth
              size="small"
              label="Filter by Leave Type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              sx={{ bgcolor: 'background.paper' }}
            >
              <MenuItem value="">All Leave Types</MenuItem>
              {LEAVE_TYPES.map(lt => (
                <MenuItem key={lt.value} value={lt.value}>{lt.label}</MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Box>

      {/* Data Table */}
      {filteredLeaves.length === 0 && !isLoading ? (
        <EmptyState
          type="leave"
          title="No Faculty Leave Applications"
          description="There are currently no faculty leave applications matching your filter criteria under your department."
        />
      ) : (
        <DataTable 
          columns={columns} 
          data={filteredLeaves} 
          isLoading={isLoading} 
          isError={isError} 
          emptyMessage="No leave records found."
          customActions={customActions}
        />
      )}

      {/* Approve Confirmation Modal */}
      <Dialog open={approveModalOpen} onClose={() => setApproveModalOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Approve Faculty Leave Request</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Approve leave for <strong>{selectedLeave?.userId?.name || 'Faculty Member'}</strong> ({selectedLeave?.leaveType}) from {selectedLeave?.startDate ? new Date(selectedLeave.startDate).toLocaleDateString('en-IN') : ''} to {selectedLeave?.endDate ? new Date(selectedLeave.endDate).toLocaleDateString('en-IN') : ''}?
          </Typography>
          <TextField
            label="Approval Remarks (Optional)"
            fullWidth
            multiline
            rows={2}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Add any notes or substitute arrangements for this leave approval..."
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setApproveModalOpen(false)}>Cancel</Button>
          <Button onClick={handleApproveConfirm} color="success" variant="contained" disabled={updateStatusMutation.isPending} sx={{ borderRadius: 2 }}>
            {updateStatusMutation.isPending ? 'Approving...' : 'Confirm Approval'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Confirmation Modal */}
      <Dialog open={rejectModalOpen} onClose={() => setRejectModalOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Reject Faculty Leave Request</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Are you sure you want to reject the leave request for <strong>{selectedLeave?.userId?.name || 'Faculty Member'}</strong>?
          </Typography>
          <TextField
            label="Rejection Reason / Remarks"
            fullWidth
            multiline
            rows={2}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Explain why this leave application is being rejected..."
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setRejectModalOpen(false)}>Cancel</Button>
          <Button onClick={handleRejectConfirm} color="error" variant="contained" disabled={updateStatusMutation.isPending} sx={{ borderRadius: 2 }}>
            {updateStatusMutation.isPending ? 'Rejecting...' : 'Confirm Rejection'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast Notification */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast(t => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setToast(t => ({ ...t, open: false }))} severity={toast.severity} sx={{ width: '100%', borderRadius: 2 }}>
          {toast.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default HodLeaveHub;
