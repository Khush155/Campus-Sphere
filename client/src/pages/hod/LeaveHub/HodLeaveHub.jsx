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
  InputAdornment,
  alpha,
} from '@mui/material';
import {
  SearchOutlined,
  EventNoteOutlined,
  RefreshOutlined,
  CheckOutlined,
  CloseOutlined,
  PendingActionsOutlined,
  CheckCircleOutlined,
  CancelOutlined,
  FormatListBulletedOutlined,
  DoneAllOutlined,
} from '@mui/icons-material';
import DataTable from '../../../components/common/DataTable';
import EmptyState from '../../../components/common/EmptyState';
import { useLeaveQuery, useUpdateLeaveStatusMutation } from '../../../queries/hodQueries';
import { useToast } from '../../../contexts/ToastContext';

const LEAVE_TYPES = [
  { value: 'SICK', label: 'Sick Leave', color: '#ef4444' },
  { value: 'CASUAL', label: 'Casual Leave', color: '#8b5cf6' },
  { value: 'ACADEMIC', label: 'Academic Leave', color: '#3b82f6' },
  { value: 'EMERGENCY', label: 'Emergency Leave', color: '#f59e0b' },
  { value: 'MEDICAL', label: 'Medical Exemption', color: '#06b6d4' },
];

const getLeaveDaysLeft = (startDate) => {
  if (!startDate) return null;
  const start = new Date(startDate);
  const now = new Date();
  return Math.ceil((start - now) / (1000 * 60 * 60 * 24));
};

const isLeaveUrgent = (startDate) => {
  const days = getLeaveDaysLeft(startDate);
  return days !== null && days >= 0 && days <= 2;
};

const isLeaveActive = (startDate, endDate) => {
  const now = new Date();
  return new Date(startDate) <= now && new Date(endDate) >= now;
};

// Visual date-range bar component
const DateRangeBar = ({ startDate, endDate }) => {
  const theme = useTheme();
  if (!startDate || !endDate) return <Typography variant="caption" color="text.disabled">—</Typography>;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();
  const totalMs = end - start;
  const elapsedMs = Math.min(Math.max(now - start, 0), totalMs);
  const progress = totalMs > 0 ? (elapsedMs / totalMs) * 100 : 0;
  const active = isLeaveActive(startDate, endDate);
  const past = end < now;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.68rem' }}>
          {start.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
        </Typography>
        <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.68rem' }}>
          {end.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
        </Typography>
      </Box>
      <Box sx={{ height: 6, borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.12), overflow: 'hidden', minWidth: 100 }}>
        <Box
          sx={{
            height: '100%',
            borderRadius: 3,
            width: `${progress}%`,
            bgcolor: past
              ? theme.palette.text.disabled
              : active
              ? theme.palette.warning.main
              : theme.palette.primary.main,
            transition: 'width 0.5s ease',
          }}
        />
      </Box>
      {active && (
        <Typography variant="caption" sx={{ color: 'warning.main', fontWeight: 700, fontSize: '0.62rem' }}>
          • In Progress
        </Typography>
      )}
    </Box>
  );
};

const KpiCard = ({ label, value, sublabel, accentColor, icon }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <Card
      sx={{
        p: 2.5,
        borderRadius: '18px',
        border: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
        borderTop: `4px solid ${accentColor}`,
        bgcolor: theme.custom?.surface?.raised || theme.palette.background.paper,
        boxShadow: theme.custom?.elevation?.raised || 'none',
        height: '100%',
        transition: 'all 0.25s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: isDark ? '0 12px 28px rgba(0,0,0,0.3)' : '0 12px 28px rgba(0,0,0,0.06)',
          borderColor: accentColor,
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: '0.06em', color: accentColor, textTransform: 'uppercase', fontSize: '0.65rem' }}>
          {label}
        </Typography>
        <Box sx={{ color: accentColor, opacity: 0.75 }}>{icon}</Box>
      </Box>
      <Typography variant="h3" sx={{ fontWeight: 900, color: accentColor, mt: 1, fontFamily: theme.typography.mono?.fontFamily || 'monospace', lineHeight: 1.1 }}>
        {value}
      </Typography>
      {sublabel && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          {sublabel}
        </Typography>
      )}
    </Card>
  );
};

export const HodLeaveHub = () => {
  const theme = useTheme();
  const { showToast } = useToast();

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [bulkApproveOpen, setBulkApproveOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [remarks, setRemarks] = useState('');

  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  React.useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(handler);
  }, [search]);

  const { data: leaves = [], isLoading, isError, refetch } = useLeaveQuery({
    status: statusFilter || undefined,
    leaveType: typeFilter || undefined,
  });

  const updateStatusMutation = useUpdateLeaveStatusMutation();

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

  const stats = useMemo(() => ({
    total: leaves.length,
    pending: leaves.filter((l) => l.status === 'PENDING').length,
    approved: leaves.filter((l) => l.status === 'APPROVED').length,
    rejected: leaves.filter((l) => l.status === 'REJECTED').length,
  }), [leaves]);

  const pendingLeaves = useMemo(() => leaves.filter((l) => l.status === 'PENDING'), [leaves]);

  const openApproveModal = (row) => { setSelectedLeave(row); setRemarks(''); setApproveModalOpen(true); };
  const openRejectModal = (row) => { setSelectedLeave(row); setRemarks(''); setRejectModalOpen(true); };

  const handleApproveConfirm = () => {
    if (!selectedLeave) return;
    updateStatusMutation.mutate(
      { id: selectedLeave._id || selectedLeave.id, status: 'APPROVED', remarks },
      {
        onSuccess: () => { showToast(`Leave approved for ${selectedLeave.userId?.name || 'Faculty Member'}.`); setApproveModalOpen(false); setSelectedLeave(null); refetch(); },
        onError: (err) => showToast(err.response?.data?.message || 'Failed to approve leave', { severity: 'error' }),
      }
    );
  };

  const handleRejectConfirm = () => {
    if (!selectedLeave) return;
    updateStatusMutation.mutate(
      { id: selectedLeave._id || selectedLeave.id, status: 'REJECTED', remarks },
      {
        onSuccess: () => { showToast(`Leave rejected for ${selectedLeave.userId?.name || 'Faculty Member'}.`); setRejectModalOpen(false); setSelectedLeave(null); refetch(); },
        onError: (err) => showToast(err.response?.data?.message || 'Failed to reject leave', { severity: 'error' }),
      }
    );
  };

  const handleBulkApprove = async () => {
    let successCount = 0;
    for (const leave of pendingLeaves) {
      try {
        await updateStatusMutation.mutateAsync({ id: leave._id || leave.id, status: 'APPROVED', remarks: 'Bulk approved by HOD.' });
        successCount++;
      } catch (_) { /* skip */ }
    }
    showToast(`Bulk approved ${successCount} pending leave requests.`);
    setBulkApproveOpen(false);
    refetch();
  };

  const getLeaveTypeColor = (type) => LEAVE_TYPES.find((t) => t.value === type)?.color || theme.palette.primary.main;

  const columns = [
    {
      id: 'faculty',
      label: 'Faculty Member',
      render: (row) => {
        const urgent = isLeaveUrgent(row.startDate) && row.status === 'PENDING';
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ position: 'relative', flexShrink: 0 }}>
              <Avatar sx={{ width: 36, height: 36, bgcolor: `${theme.palette.primary.main}15`, color: theme.palette.primary.main, fontWeight: 700, fontSize: 15 }}>
                {row.userId?.name?.charAt(0) || 'F'}
              </Avatar>
              {urgent && (
                <Box
                  sx={{
                    position: 'absolute', top: -2, right: -2, width: 10, height: 10,
                    borderRadius: '50%', bgcolor: 'error.main', border: `2px solid ${theme.palette.background.paper}`,
                    animation: 'pulse 1.5s infinite',
                    '@keyframes pulse': {
                      '0%': { boxShadow: '0 0 0 0 rgba(239,68,68,0.7)' },
                      '70%': { boxShadow: '0 0 0 6px rgba(239,68,68,0)' },
                      '100%': { boxShadow: '0 0 0 0 rgba(239,68,68,0)' },
                    },
                  }}
                />
              )}
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 800, color: theme.palette.ink?.[900] || '#1a1a1a' }}>
                  {row.userId?.name || 'Faculty Member'}
                </Typography>
                {urgent && (
                  <Chip label="URGENT" size="small" color="error" sx={{ height: 16, fontSize: '0.55rem', fontWeight: 800 }} />
                )}
              </Box>
              <Typography variant="caption" color="text.secondary">{row.userId?.email || '—'}</Typography>
            </Box>
          </Box>
        );
      },
    },
    {
      id: 'leaveType',
      label: 'Leave Category',
      render: (row) => {
        const typeColor = getLeaveTypeColor(row.leaveType);
        return (
          <Chip
            label={LEAVE_TYPES.find((t) => t.value === row.leaveType)?.label || row.leaveType || 'CASUAL'}
            size="small"
            sx={{
              fontWeight: 800, fontSize: '0.65rem',
              bgcolor: `${typeColor}15`, color: typeColor,
              border: `1px solid ${typeColor}30`,
            }}
          />
        );
      },
    },
    {
      id: 'dateRange',
      label: 'Leave Duration',
      render: (row) => <DateRangeBar startDate={row.startDate} endDate={row.endDate} />,
    },
    {
      id: 'totalDays',
      label: 'Days',
      render: (row) => (
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 900, fontFamily: 'monospace', lineHeight: 1, color: theme.palette.primary.main }}>
            {row.totalDays || 1}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.62rem' }}>day{(row.totalDays || 1) !== 1 ? 's' : ''}</Typography>
        </Box>
      ),
    },
    {
      id: 'reason',
      label: 'Reason',
      render: (row) => (
        <Tooltip title={row.reason || 'No reason provided'} placement="top" arrow>
          <Typography
            variant="body2"
            sx={{
              maxWidth: 180, fontStyle: 'italic', color: 'text.secondary',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'default',
            }}
          >
            &quot;{row.reason || 'No reason provided'}&quot;
          </Typography>
        </Tooltip>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      render: (row) => {
        const statusMap = {
          PENDING: { color: 'warning', icon: <PendingActionsOutlined sx={{ fontSize: '0.8rem !important' }} /> },
          APPROVED: { color: 'success', icon: <CheckCircleOutlined sx={{ fontSize: '0.8rem !important' }} /> },
          REJECTED: { color: 'error', icon: <CancelOutlined sx={{ fontSize: '0.8rem !important' }} /> },
        };
        const s = statusMap[row.status] || statusMap.PENDING;
        return <Chip icon={s.icon} label={row.status || 'PENDING'} size="small" color={s.color} sx={{ fontWeight: 800, fontSize: '0.65rem' }} />;
      },
    },
    {
      id: 'actions',
      label: 'Quick Review',
      render: (row) => row.status === 'PENDING' ? (
        <Box sx={{ display: 'flex', gap: 0.75 }}>
          <Tooltip title="Approve Leave Request">
            <Button
              size="small" variant="contained" color="success"
              startIcon={<CheckOutlined />}
              onClick={() => openApproveModal(row)}
              disabled={updateStatusMutation.isPending}
              sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 700, fontSize: '0.72rem', minWidth: 90 }}
            >
              Approve
            </Button>
          </Tooltip>
          <Tooltip title="Reject Leave Request">
            <Button
              size="small" variant="outlined" color="error"
              startIcon={<CloseOutlined />}
              onClick={() => openRejectModal(row)}
              disabled={updateStatusMutation.isPending}
              sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 600, fontSize: '0.72rem', minWidth: 80 }}
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

  const isDark = theme.palette.mode === 'dark';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* ── 1. Hero Banner ─────────────────────────────────────────────────── */}
      <Card
        sx={{
          p: { xs: 2.5, md: 3.5 },
          borderRadius: '22px',
          border: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
          background: isDark
            ? 'linear-gradient(135deg, rgba(79, 70, 229, 0.14) 0%, rgba(184, 134, 62, 0.08) 100%)'
            : 'linear-gradient(135deg, rgba(79, 70, 229, 0.06) 0%, rgba(184, 134, 62, 0.04) 100%)',
          backdropFilter: 'blur(12px)',
          boxShadow: isDark
            ? '0 18px 40px -15px rgba(0,0,0,0.5)'
            : '0 18px 40px -15px rgba(79, 70, 229, 0.08)',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Chip
              icon={<EventNoteOutlined sx={{ fontSize: '0.9rem !important', color: `${theme.palette.primary.main} !important` }} />}
              label="DEPARTMENT FACULTY & STAFF LEAVE APPROVAL DESK"
              size="small"
              sx={{ bgcolor: `${theme.palette.primary.main}15`, color: theme.palette.primary.main, fontWeight: 800, fontSize: '0.68rem', letterSpacing: '0.05em', mb: 1.5 }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h4" sx={{ fontFamily: theme.typography.h1?.fontFamily, fontWeight: 800, color: theme.palette.ink?.[900] || '#1a1a1a' }}>
                Faculty Leave Management
              </Typography>
              {stats.pending > 0 && (
                <Chip
                  label={`${stats.pending} Pending`}
                  color="warning"
                  sx={{ fontWeight: 800, fontSize: '0.75rem', animation: stats.pending > 0 ? 'none' : undefined }}
                />
              )}
            </Box>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5, maxWidth: 560 }}>
              Review leave applications submitted by department professors, manage approval workflows, and track leave quotas.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            {stats.pending > 0 && (
              <Button
                variant="outlined"
                color="success"
                startIcon={<DoneAllOutlined />}
                onClick={() => setBulkApproveOpen(true)}
                sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700 }}
              >
                Approve All Pending
              </Button>
            )}
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

      {/* ── 2. KPI Cards ───────────────────────────────────────────────────── */}
      <Grid container spacing={2.5}>
        {[
          { label: 'Total Applications', value: stats.total, sublabel: 'Submitted leave requests', accentColor: theme.palette.ink?.[700] || '#374151', icon: <FormatListBulletedOutlined sx={{ fontSize: 20 }} /> },
          { label: 'Pending Approval', value: stats.pending, sublabel: 'Awaiting HOD action', accentColor: theme.palette.warning.main, icon: <PendingActionsOutlined sx={{ fontSize: 20 }} /> },
          { label: 'Approved Leaves', value: stats.approved, sublabel: 'Sanctioned leaves', accentColor: theme.palette.success.main, icon: <CheckCircleOutlined sx={{ fontSize: 20 }} /> },
          { label: 'Rejected Leaves', value: stats.rejected, sublabel: 'Declined leave requests', accentColor: theme.palette.error.main, icon: <CancelOutlined sx={{ fontSize: 20 }} /> },
        ].map((kpi) => (
          <Grid item xs={12} sm={6} md={3} key={kpi.label}>
            <KpiCard {...kpi} color={kpi.accentColor} />
          </Grid>
        ))}
      </Grid>

      {/* ── 3. Leave Type Legend ───────────────────────────────────────────── */}
      <Card sx={{ px: 2.5, py: 1.75, borderRadius: '12px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '0.62rem' }}>
            Leave Type Legend
          </Typography>
          {LEAVE_TYPES.map((t) => (
            <Box key={t.value} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: t.color }} />
              <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem', color: 'text.secondary' }}>
                {t.label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Card>

      {/* ── 4. Filter Bar + Table ──────────────────────────────────────────── */}
      <Card sx={{ borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', overflow: 'hidden' }}>
        {/* Filter Toolbar */}
        <Box sx={{ px: 3, pt: 2.5, pb: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={5}>
              <TextField
                fullWidth size="small"
                placeholder="Search faculty name, email, or reason..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchOutlined sx={{ color: 'text.secondary', fontSize: 18 }} /></InputAdornment> }}
              />
            </Grid>
            <Grid item xs={12} sm={3.5}>
              <TextField
                select fullWidth size="small" label="Leave Status"
                value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                SelectProps={{ displayEmpty: true }} InputLabelProps={{ shrink: true }}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="PENDING">⏳ Pending Only</MenuItem>
                <MenuItem value="APPROVED">✅ Approved Only</MenuItem>
                <MenuItem value="REJECTED">❌ Rejected Only</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3.5}>
              <TextField
                select fullWidth size="small" label="Leave Category"
                value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
                SelectProps={{ displayEmpty: true }} InputLabelProps={{ shrink: true }}
              >
                <MenuItem value="">All Categories</MenuItem>
                {LEAVE_TYPES.map((t) => (
                  <MenuItem key={t.value} value={t.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: t.color, flexShrink: 0 }} />
                      {t.label}
                    </Box>
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>

          {/* Active filter info */}
          {(statusFilter || typeFilter || search) && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5 }}>
              <Typography variant="caption" color="text.secondary">
                Showing <strong>{filteredLeaves.length}</strong> of {leaves.length} results
              </Typography>
              <Button size="small" sx={{ fontSize: '0.68rem', textTransform: 'none', py: 0 }} onClick={() => { setStatusFilter(''); setTypeFilter(''); setSearch(''); }}>
                Clear all filters
              </Button>
            </Box>
          )}
        </Box>

        {/* Table */}
        <Box sx={{ p: 3 }}>
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
        </Box>
      </Card>

      {/* ── 5. Approve Leave Modal ────────────────────────────────────────── */}
      <Dialog open={approveModalOpen} onClose={() => setApproveModalOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 800, borderBottom: `1px solid ${theme.palette.divider}`, pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: `${theme.palette.success.main}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckOutlined sx={{ color: theme.palette.success.main, fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>Approve Leave Request</Typography>
              <Typography variant="caption" color="text.secondary">{selectedLeave?.userId?.name}</Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 2.5, pb: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Approving <strong>{selectedLeave?.totalDays || 1} day(s)</strong> of <strong>{selectedLeave?.leaveType}</strong> leave starting{' '}
            <strong>{selectedLeave?.startDate ? new Date(selectedLeave.startDate).toLocaleDateString('en-IN') : '—'}</strong>.
          </Typography>
          <TextField fullWidth multiline rows={3} label="HOD Remarks (Optional)" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="e.g. Approved. Alternate class coverage verified." />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1.5 }}>
          <Button onClick={() => setApproveModalOpen(false)} variant="outlined" sx={{ borderRadius: '8px' }}>Cancel</Button>
          <Button variant="contained" color="success" onClick={handleApproveConfirm} disabled={updateStatusMutation.isPending} sx={{ borderRadius: '8px', fontWeight: 700, px: 3 }}>
            {updateStatusMutation.isPending ? 'Approving...' : 'Confirm Approval'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── 6. Reject Leave Modal ─────────────────────────────────────────── */}
      <Dialog open={rejectModalOpen} onClose={() => setRejectModalOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 800, borderBottom: `1px solid ${theme.palette.divider}`, pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: `${theme.palette.error.main}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CloseOutlined sx={{ color: theme.palette.error.main, fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>Reject Leave Request</Typography>
              <Typography variant="caption" color="text.secondary">{selectedLeave?.userId?.name}</Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 2.5, pb: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Rejecting <strong>{selectedLeave?.totalDays || 1} day(s)</strong> of <strong>{selectedLeave?.leaveType}</strong> leave for <strong>{selectedLeave?.userId?.name}</strong>.
          </Typography>
          <TextField fullWidth multiline rows={3} label="Reason for Rejection *" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="e.g. Examination duties assigned for the requested dates." required />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1.5 }}>
          <Button onClick={() => setRejectModalOpen(false)} variant="outlined" sx={{ borderRadius: '8px' }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleRejectConfirm} disabled={updateStatusMutation.isPending} sx={{ borderRadius: '8px', fontWeight: 700, px: 3 }}>
            {updateStatusMutation.isPending ? 'Rejecting...' : 'Confirm Rejection'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── 7. Bulk Approve Confirm Modal ─────────────────────────────────── */}
      <Dialog open={bulkApproveOpen} onClose={() => setBulkApproveOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 800, borderBottom: `1px solid ${theme.palette.divider}`, pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: `${theme.palette.success.main}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DoneAllOutlined sx={{ color: theme.palette.success.main, fontSize: 20 }} />
            </Box>
            Bulk Approve All Pending
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 2.5 }}>
          <Typography variant="body2" color="text.secondary">
            This will approve all <strong>{stats.pending}</strong> pending leave requests with the remark &quot;Bulk approved by HOD.&quot; Are you sure?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1.5 }}>
          <Button onClick={() => setBulkApproveOpen(false)} variant="outlined" sx={{ borderRadius: '8px' }}>Cancel</Button>
          <Button variant="contained" color="success" onClick={handleBulkApprove} disabled={updateStatusMutation.isPending} sx={{ borderRadius: '8px', fontWeight: 700, px: 3 }}>
            {updateStatusMutation.isPending ? 'Processing...' : `Approve All ${stats.pending} Requests`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HodLeaveHub;
