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
  Avatar,
} from '@mui/material';
import {
  ReportProblemOutlined,
  BuildOutlined,
  CheckCircleOutlined,
  PendingActionsOutlined,
  AddOutlined,
  RefreshOutlined,
} from '@mui/icons-material';

import DataTable from '../../../components/common/DataTable';
import EmptyState from '../../../components/common/EmptyState';

import { useComplaintsQuery, useCreateComplaintMutation } from '../../../queries/hodQueries';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';

const CATEGORY_OPTIONS = [
  'Classroom Projector / Smartboard Failure',
  'Lab Computer & Hardware Malfunction',
  'Air Conditioning & Electrical Issue',
  'Classroom Desk & Furniture Repair',
  'Network / Wi-Fi Connectivity Issue',
  'General Maintenance Request',
];

export const FacultyComplaintHub = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [openReportModal, setOpenReportModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    category: CATEGORY_OPTIONS[0],
    location: 'LH-201',
    description: '',
  });

  // Fetch complaints from backend
  const { data: complaintsData = [], isLoading, refetch } = useComplaintsQuery();
  const createMutation = useCreateComplaintMutation();

  const complaintList = useMemo(() => {
    if (!Array.isArray(complaintsData)) return [];
    // Filter for current user's submitted complaints
    return complaintsData.filter((c) => {
      const uId = typeof c.submittedBy === 'object' ? c.submittedBy?._id : c.submittedBy;
      return String(uId) === String(user?.id || user?._id);
    });
  }, [complaintsData, user]);

  const filteredComplaints = useMemo(() => {
    let list = complaintList;
    if (statusFilter) {
      list = list.filter((c) => c.status === statusFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((c) => (c.title || '').toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q));
    }
    return list;
  }, [complaintList, statusFilter, search]);

  const stats = useMemo(() => {
    const total = complaintList.length;
    const pending = complaintList.filter((c) => c.status === 'PENDING' || c.status === 'SUBMITTED').length;
    const inProgress = complaintList.filter((c) => c.status === 'IN_PROGRESS').length;
    const resolved = complaintList.filter((c) => c.status === 'RESOLVED').length;
    return { total, pending, inProgress, resolved };
  }, [complaintList]);

  const handleOpenReport = () => {
    setFormData({
      title: '',
      category: CATEGORY_OPTIONS[0],
      location: 'LH-201',
      description: '',
    });
    setOpenReportModal(true);
  };

  const handleSubmitReport = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      showToast('Please fill all required fields.', { severity: 'error' });
      return;
    }

    const payload = {
      title: formData.title.trim(),
      category: formData.category,
      location: formData.location.trim(),
      description: formData.description.trim(),
      submittedBy: user?.id || user?._id,
      departmentId: user?.departmentId?._id || user?.departmentId || user?.department,
    };

    createMutation.mutate(payload, {
      onSuccess: () => {
        setOpenReportModal(false);
        showToast('Maintenance ticket reported successfully! Admin technician will inspect.');
        refetch();
      },
      onError: (err) => showToast(err.response?.data?.message || 'Failed to submit ticket.', { severity: 'error' }),
    });
  };

  const columns = [
    {
      id: 'title',
      label: 'Ticket Title & Issue',
      render: (r) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 800, color: theme.palette.ink[900] }}>
            {r.title}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {r.description}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'category',
      label: 'Category & Location',
      render: (r) => (
        <Box>
          <Chip label={r.category || 'General'} size="small" variant="outlined" sx={{ fontWeight: 700, fontSize: '0.65rem' }} />
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.2 }}>
            Location: <strong>{r.location || 'LH-201'}</strong>
          </Typography>
        </Box>
      ),
    },
    {
      id: 'createdAt',
      label: 'Reported Date',
      render: (r) => new Date(r.createdAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    },
    {
      id: 'status',
      label: 'Resolution Status',
      render: (r) => (
        <Chip
          label={r.status || 'PENDING'}
          size="small"
          color={r.status === 'RESOLVED' ? 'success' : r.status === 'IN_PROGRESS' ? 'info' : 'warning'}
          sx={{ fontWeight: 800, fontSize: '0.65rem' }}
        />
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
                icon={<ReportProblemOutlined sx={{ fontSize: '0.9rem !important', color: `${theme.palette.primary.main} !important` }} />}
                label="FACULTY CLASSROOM & INFRASTRUCTURE HELPDESK"
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
              Infrastructure Maintenance Helpdesk
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
              Report classroom projector failures, lab PC malfunctions, AC repair, and track real-time technician resolution.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<RefreshOutlined />}
              onClick={() => refetch()}
              sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
            >
              Refresh Tickets
            </Button>
            <Button
              variant="contained"
              startIcon={<AddOutlined />}
              onClick={handleOpenReport}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 700,
                background: theme.palette.primary.gradient || theme.palette.primary.main,
                color: '#ffffff',
              }}
            >
              Report Maintenance Ticket
            </Button>
          </Box>
        </Box>
      </Card>

      {/* ── 2. KPI Summary Grid ────────────────────────────────────────────── */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em' }}>
                  TOTAL REPORTED TICKETS
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.ink[900], mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
                  {stats.total}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: `${theme.palette.primary.main}15`, color: theme.palette.primary.main }}>
                <ReportProblemOutlined />
              </Avatar>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.warning.main }}>
                  PENDING INSPECTION
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.warning.main, mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
                  {stats.pending}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: `${theme.palette.warning.main}15`, color: theme.palette.warning.main }}>
                <PendingActionsOutlined />
              </Avatar>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.info.main }}>
                  TECHNICIAN REPAIRING
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.info.main, mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
                  {stats.inProgress}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: `${theme.palette.info.main}15`, color: theme.palette.info.main }}>
                <BuildOutlined />
              </Avatar>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.signal.success }}>
                  RESOLVED TICKETS
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.signal.success, mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
                  {stats.resolved}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: `${theme.palette.signal.success}15`, color: theme.palette.signal.success }}>
                <CheckCircleOutlined />
              </Avatar>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* ── 3. Filters & Ticket Roster ────────────────────────────────────── */}
      <Card sx={{ p: 3, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <TextField
            size="small"
            placeholder="Search ticket title or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 260 }}
          />

          <TextField
            select
            size="small"
            label="Resolution Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="">All Ticket Statuses</MenuItem>
            <MenuItem value="PENDING">Pending Inspection</MenuItem>
            <MenuItem value="IN_PROGRESS">Technician Assigned</MenuItem>
            <MenuItem value="RESOLVED">Resolved</MenuItem>
          </TextField>
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={32} />
          </Box>
        ) : filteredComplaints.length === 0 ? (
          <EmptyState type="reports" title="No Maintenance Tickets Found" description="You have not submitted any maintenance tickets matching your search." />
        ) : (
          <DataTable columns={columns} data={filteredComplaints} isLoading={isLoading} emptyMessage="No tickets available." />
        )}
      </Card>

      {/* ── 4. Report Maintenance Ticket Dialog ───────────────────────────── */}
      <Dialog open={openReportModal} onClose={() => setOpenReportModal(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Report Infrastructure Maintenance Ticket</DialogTitle>
        <form onSubmit={handleSubmitReport}>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Issue Title"
              placeholder="e.g. Broken Projector / HDMI Port Failure"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              fullWidth
              required
            />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  select
                  label="Category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  fullWidth
                  required
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <MenuItem key={c} value={c}>{c}</MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={6}>
                <TextField
                  label="Classroom / Lab Location"
                  placeholder="e.g. LH-201, Computer Lab 3"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  fullWidth
                  required
                />
              </Grid>
            </Grid>

            <TextField
              label="Issue Description & Impact"
              placeholder="Describe what is broken and how it affects lecture delivery..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              required
              multiline
              rows={3}
            />
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setOpenReportModal(false)} variant="outlined" sx={{ borderRadius: '8px' }}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={createMutation.isPending} sx={{ borderRadius: '8px', fontWeight: 700 }}>
              {createMutation.isPending ? 'Submitting...' : 'Submit Maintenance Ticket'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default FacultyComplaintHub;
