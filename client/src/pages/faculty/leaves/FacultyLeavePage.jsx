import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  CircularProgress,
  useTheme,
} from '@mui/material';
import {
  AddOutlined,
  EventAvailableOutlined,
  RefreshOutlined,
} from '@mui/icons-material';

import DataTable from '../../../components/common/DataTable';
import EmptyState from '../../../components/common/EmptyState';

import { useLeaveQuery } from '../../../queries/hodQueries';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import api from '../../../services/api';

const LEAVE_TYPES = [
  { value: 'CASUAL', label: 'Casual Leave (CL)' },
  { value: 'SICK', label: 'Sick / Medical Leave (SL)' },
  { value: 'ACADEMIC', label: 'Academic / Duty Leave (DL)' },
  { value: 'EMERGENCY', label: 'Emergency Leave (EL)' },
];

export const FacultyLeavePage = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [openApplyModal, setOpenApplyModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const [formData, setFormData] = useState({
    leaveType: 'CASUAL',
    startDate: '',
    endDate: '',
    reason: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch faculty's leave requests from backend
  const { data: leavesData, isLoading, refetch } = useLeaveQuery();
  const leaveList = useMemo(() => {
    if (!leavesData) return [];
    const list = Array.isArray(leavesData) ? leavesData : (leavesData.data || []);
    // Filter for current user's leaves
    return list.filter((l) => {
      const uId = typeof l.userId === 'object' ? l.userId?._id : l.userId;
      return String(uId) === String(user?.id || user?._id);
    });
  }, [leavesData, user]);

  const filteredLeaves = useMemo(() => {
    let list = leaveList;
    if (statusFilter) {
      list = list.filter((l) => l.status === statusFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((l) => (l.reason || '').toLowerCase().includes(q) || (l.leaveType || '').toLowerCase().includes(q));
    }
    return list;
  }, [leaveList, statusFilter, search]);

  const handleOpenApply = () => {
    setFormData({
      leaveType: 'CASUAL',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      reason: '',
    });
    setOpenApplyModal(true);
  };

  const handleSubmitLeave = async (e) => {
    e.preventDefault();
    if (!formData.startDate || !formData.endDate || !formData.reason) {
      showToast('Please fill all required fields.', { severity: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/leaves', {
        leaveType: formData.leaveType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason,
        departmentId: user?.departmentId?._id || user?.departmentId || user?.department,
      });
      showToast('Leave application submitted to Head of Department (HOD) successfully!');
      setOpenApplyModal(false);
      refetch();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit leave application.', { severity: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      id: 'leaveType',
      label: 'Leave Type',
      render: (r) => (
        <Chip
          label={r.leaveType || 'CASUAL'}
          size="small"
          color={r.leaveType === 'SICK' || r.leaveType === 'MEDICAL' ? 'error' : r.leaveType === 'ACADEMIC' ? 'info' : 'primary'}
          sx={{ fontWeight: 800, fontSize: '0.68rem' }}
        />
      ),
    },
    {
      id: 'dates',
      label: 'Duration & Dates',
      render: (r) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 800, color: theme.palette.ink[900] }}>
            {new Date(r.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} — {new Date(r.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Total: <strong>{r.totalDays || 1} day(s)</strong>
          </Typography>
        </Box>
      ),
    },
    {
      id: 'reason',
      label: 'Reason for Absence',
      render: (r) => (
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
          {r.reason}
        </Typography>
      ),
    },
    {
      id: 'status',
      label: 'HOD Approval Status',
      render: (r) => (
        <Chip
          label={r.status || 'PENDING'}
          size="small"
          color={r.status === 'APPROVED' ? 'success' : r.status === 'REJECTED' ? 'error' : 'warning'}
          sx={{ fontWeight: 800, fontSize: '0.65rem' }}
        />
      ),
    },
    {
      id: 'remarks',
      label: 'HOD Remarks',
      render: (r) => (
        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          {r.remarks || '—'}
        </Typography>
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
                icon={<EventAvailableOutlined sx={{ fontSize: '0.9rem !important', color: `${theme.palette.primary.main} !important` }} />}
                label="FACULTY LEAVE APPLICATION & BALANCE PORTAL"
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
              Faculty Leave Portal
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
              Apply for casual, medical, or academic duty leave, track remaining leave quota, and monitor real-time HOD approval decisions.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<RefreshOutlined />}
              onClick={() => refetch()}
              sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
            >
              Refresh Quota
            </Button>
            <Button
              variant="contained"
              startIcon={<AddOutlined />}
              onClick={handleOpenApply}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 700,
                background: theme.palette.primary.gradient || theme.palette.primary.main,
                color: '#ffffff',
              }}
            >
              Apply for Leave
            </Button>
          </Box>
        </Box>
      </Card>

      {/* ── 2. Filters & Leave History Roster ────────────────────────────── */}
      <Card sx={{ p: 3, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <TextField
            size="small"
            placeholder="Search leave reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 260 }}
          />

          <TextField
            select
            size="small"
            label="Filter Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="PENDING">Pending Approval</MenuItem>
            <MenuItem value="APPROVED">Approved</MenuItem>
            <MenuItem value="REJECTED">Rejected</MenuItem>
          </TextField>
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={32} />
          </Box>
        ) : filteredLeaves.length === 0 ? (
          <EmptyState type="reports" title="No Leave Applications Found" description="You have not submitted any leave applications matching your search." />
        ) : (
          <DataTable columns={columns} data={filteredLeaves} isLoading={isLoading} emptyMessage="No leave records." />
        )}
      </Card>

      {/* ── 4. Apply for Leave Dialog Modal ───────────────────────────────── */}
      <Dialog open={openApplyModal} onClose={() => setOpenApplyModal(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Apply for Faculty Leave</DialogTitle>
        <form onSubmit={handleSubmitLeave}>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              select
              label="Leave Type"
              value={formData.leaveType}
              onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
              fullWidth
              required
            >
              {LEAVE_TYPES.map((t) => (
                <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
              ))}
            </TextField>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  type="date"
                  label="Start Date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  type="date"
                  label="End Date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  required
                />
              </Grid>
            </Grid>

            <TextField
              label="Reason for Leave & Substitute Arrangement"
              placeholder="State reason and mention substitute faculty covering your lectures..."
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              fullWidth
              required
              multiline
              rows={3}
            />
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setOpenApplyModal(false)} variant="outlined" sx={{ borderRadius: '8px' }}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={isSubmitting} sx={{ borderRadius: '8px', fontWeight: 700 }}>
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default FacultyLeavePage;
