import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  Grid,
  Card,
  useTheme,
  CircularProgress,
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  SearchOutlined,
  EventNoteOutlined,
  RefreshOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@mui/icons-material';
import DataTable from '../../../components/common/DataTable';
import EmptyState from '../../../components/common/EmptyState';
import { useLeaveQuery, useUpdateLeaveStatusMutation } from '../../../queries/hodQueries';
import { useToast } from '../../../contexts/ToastContext';

const LEAVE_TYPES = [
  { value: 'SICK', label: 'Sick Leave' },
  { value: 'CASUAL', label: 'Casual Leave' },
  { value: 'ACADEMIC', label: 'Academic Leave' },
  { value: 'EMERGENCY', label: 'Emergency Leave' },
  { value: 'MEDICAL', label: 'Medical Exemption Leave' },
];

export const HodLeaveHub = () => {
  const theme = useTheme();
  const { showToast } = useToast();

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

  // Debounce search
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Query leave requests for department faculty
  const { data: leaves = [], isLoading, isError, refetch } = useLeaveQuery({
    status: statusFilter || undefined,
    leaveType: typeFilter || undefined,
  });

  const updateStatusMutation = useUpdateLeaveStatusMutation();

  // Client-side search filtering (Faculty Name, Email, or Reason)
  const filteredLeaves = useMemo(() => {
    if (!leaves) return [];
    if (!debouncedSearch) return leaves;
    const q = debouncedSearch.toLowerCase();
    return leaves.filter((r) => {
      const name = r.userId?.name?.toLowerCase() || '';
      const email = r.userId?.email?.toLowerCase() || '';
      const reason = r.reason?.toLowerCase() || '';
      return name.includes(q) || email.includes(q) || reason.includes(q);
    });
  }, [leaves, debouncedSearch]);

  // Compute KPI Stats
  const stats = useMemo(() => {
    const total = leaves.length;
    const pending = leaves.filter((l) => l.status === 'PENDING').length;
    const approved = leaves.filter((l) => l.status === 'APPROVED').length;
    const rejected = leaves.filter((l) => l.status === 'REJECTED').length;
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
        { id: selectedLeave._id || selectedLeave.id, status: 'APPROVED', remarks },
        {
          onSuccess: () => {
            showToast(`Leave request approved for ${selectedLeave.userId?.name || 'Faculty Member'}.`);
            setApproveModalOpen(false);
            setSelectedLeave(null);
            refetch();
          },
          onError: (err) => showToast(err.response?.data?.message || 'Failed to approve leave', { severity: 'error' }),
        }
      );
    }
  };

  const handleRejectConfirm = () => {
    if (selectedLeave) {
      updateStatusMutation.mutate(
        { id: selectedLeave._id || selectedLeave.id, status: 'REJECTED', remarks },
        {
          onSuccess: () => {
            showToast(`Leave request rejected for ${selectedLeave.userId?.name || 'Faculty Member'}.`);
            setRejectModalOpen(false);
            setSelectedLeave(null);
            refetch();
          },
          onError: (err) => showToast(err.response?.data?.message || 'Failed to reject leave', { severity: 'error' }),
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
          <Avatar sx={{ width: 34, height: 34, bgcolor: `${theme.palette.primary.main}15`, color: theme.palette.primary.main, fontWeight: 700 }}>
            {row.userId?.name?.charAt(0) || 'F'}
          </Avatar>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 800, color: theme.palette.ink[900] }}>
              {row.userId?.name || 'Faculty Member'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {row.userId?.email || '—'}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      id: 'leaveType',
      label: 'Leave Category',
      render: (row) => (
        <Chip
          label={row.leaveType || 'CASUAL'}
          size="small"
          color={row.leaveType === 'MEDICAL' || row.leaveType === 'SICK' ? 'info' : row.leaveType === 'ACADEMIC' ? 'primary' : 'secondary'}
          variant="outlined"
          sx={{ fontWeight: 800, fontSize: '0.68rem' }}
        />
      ),
    },
    {
      id: 'startDate',
      label: 'Start Date',
      render: (row) => (row.startDate ? new Date(row.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'),
    },
    {
      id: 'endDate',
      label: 'End Date',
      render: (row) => (row.endDate ? new Date(row.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'),
    },
    {
      id: 'totalDays',
      label: 'Duration',
      render: (row) => <Chip label={`${row.totalDays || 1} day(s)`} size="small" variant="outlined" sx={{ fontWeight: 700 }} />,
    },
    {
      id: 'reason',
      label: 'Reason for Leave',
      render: (row) => (
        <Typography variant="body2" sx={{ maxWidth: 220, truncate: true, fontStyle: 'italic' }}>
          {`"${row.reason || 'No reason provided'}"`}
        </Typography>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      render: (row) => {
        const statusColors = { PENDING: 'warning', APPROVED: 'success', REJECTED: 'error' };
        return <Chip label={row.status || 'PENDING'} size="small" color={statusColors[row.status] || 'default'} sx={{ fontWeight: 800, fontSize: '0.65rem' }} />;
      },
    },
    {
      id: 'actions',
      label: 'Quick Review',
      render: (row) =>
        row.status === 'PENDING' ? (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Approve Leave">
              <Button
                size="small"
                variant="contained"
                color="success"
                startIcon={<CheckOutlined />}
                onClick={() => openApproveModal(row)}
                disabled={updateStatusMutation.isPending}
                sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 700, fontSize: '0.72rem' }}
              >
                Approve
              </Button>
            </Tooltip>
            <Tooltip title="Reject Leave">
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<CloseOutlined />}
                onClick={() => openRejectModal(row)}
                disabled={updateStatusMutation.isPending}
                sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 600, fontSize: '0.72rem' }}
              >
                Reject
              </Button>
            </Tooltip>
          </Box>
        ) : (
          <Typography variant="caption" color="text.disabled">—</Typography>
        ),
    },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      {/* ── 1. Hero Identity Banner ────────────────────────────────────────── */}
      <Card
        sx={{
          p: 3.5,
          borderRadius: '16px',
          border: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
          background: `linear-gradient(135deg, ${theme.palette.primary.main}0D 0%, ${theme.palette.brass?.[500] || '#b8863e'}0A 100%)`,
          boxShadow: 'none',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <Chip
                icon={<EventNoteOutlined sx={{ fontSize: '0.9rem !important', color: `${theme.palette.primary.main} !important` }} />}
                label="DEPARTMENT FACULTY & STAFF LEAVE APPROVAL DESK"
                size="small"
                sx={{
                  bgcolor: `${theme.palette.primary.main}15`,
                  color: theme.palette.primary.main,
                  fontWeight: 800,
                  fontFamily: theme.typography.mono.fontFamily,
                  letterSpacing: '0.05em',
                  fontSize: '0.7rem',
                }}
              />
            </Box>
            <Typography variant="h4" sx={{ fontFamily: theme.typography.h1.fontFamily, fontWeight: 800, color: theme.palette.ink[900] }}>
              Faculty Staff Leave Management
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
              Review leave applications submitted by department professors, manage casual/sick/academic leave quotas, and process approval remarks.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshOutlined />}
              onClick={() => refetch()}
              sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
            >
              Refresh
            </Button>
          </Box>
        </Box>
      </Card>

      {/* ── 2. KPI Summary Grid ────────────────────────────────────────────── */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em' }}>
              TOTAL APPLICATIONS
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.ink[900], mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
              {isLoading ? <CircularProgress size={24} /> : stats.total}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Submitted leave requests
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.warning.main }}>
              PENDING APPROVAL
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.warning.main, mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
              {isLoading ? <CircularProgress size={24} /> : stats.pending}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Awaiting HOD action
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.signal.success }}>
              APPROVED LEAVES
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.signal.success, mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
              {isLoading ? <CircularProgress size={24} /> : stats.approved}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Sanctioned leave requests
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.signal.error }}>
              REJECTED LEAVES
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.signal.error, mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
              {isLoading ? <CircularProgress size={24} /> : stats.rejected}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Declined leave requests
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* ── 3. Filters & Leave Directory Table ───────────────────────────── */}
      <Card sx={{ p: 3, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
        <Grid container spacing={2} sx={{ mb: 3 }} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search faculty name, email, or reason..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchOutlined sx={{ color: 'text.secondary', mr: 1, fontSize: 18 }} />,
              }}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              select
              fullWidth
              size="small"
              label="Leave Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              SelectProps={{ displayEmpty: true }}
              InputLabelProps={{ shrink: true }}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="PENDING">Pending Only</MenuItem>
              <MenuItem value="APPROVED">Approved Only</MenuItem>
              <MenuItem value="REJECTED">Rejected Only</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              select
              fullWidth
              size="small"
              label="Leave Category"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              SelectProps={{ displayEmpty: true }}
              InputLabelProps={{ shrink: true }}
            >
              <MenuItem value="">All Categories</MenuItem>
              {LEAVE_TYPES.map((t) => (
                <MenuItem key={t.value} value={t.value}>
                  {t.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={32} />
          </Box>
        ) : filteredLeaves.length === 0 ? (
          <EmptyState
            type="reports"
            title="No Leave Applications Found"
            description="No faculty leave applications match the active search or filter criteria."
          />
        ) : (
          <DataTable columns={columns} data={filteredLeaves} isLoading={isLoading} isError={isError} emptyMessage="No leave applications found." />
        )}
      </Card>

      {/* ── 4. Approve Leave Modal ────────────────────────────────────────── */}
      <Dialog open={approveModalOpen} onClose={() => setApproveModalOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 800, color: theme.palette.signal.success }}>Approve Faculty Leave Request</DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to approve leave for <strong>{selectedLeave?.userId?.name}</strong>?
          </Typography>

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Optional HOD Remarks / Notes"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="e.g. Approved. Alternate class coverage verified."
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setApproveModalOpen(false)} variant="outlined" sx={{ borderRadius: '8px' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleApproveConfirm}
            disabled={updateStatusMutation.isPending}
            sx={{ borderRadius: '8px', fontWeight: 700 }}
          >
            {updateStatusMutation.isPending ? 'Approving...' : 'Confirm Approval'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── 5. Reject Leave Modal ─────────────────────────────────────────── */}
      <Dialog open={rejectModalOpen} onClose={() => setRejectModalOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 800, color: theme.palette.signal.error }}>Reject Faculty Leave Request</DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to decline leave for <strong>{selectedLeave?.userId?.name}</strong>?
          </Typography>

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Reason / Remarks for Rejection"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="e.g. Examination duties assigned for requested dates."
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRejectModalOpen(false)} variant="outlined" sx={{ borderRadius: '8px' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleRejectConfirm}
            disabled={updateStatusMutation.isPending}
            sx={{ borderRadius: '8px', fontWeight: 700 }}
          >
            {updateStatusMutation.isPending ? 'Rejecting...' : 'Confirm Rejection'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HodLeaveHub;
