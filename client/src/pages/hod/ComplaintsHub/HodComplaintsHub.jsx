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
  Divider,
} from '@mui/material';
import {
  ReportProblemOutlined,
  SearchOutlined,
  RefreshOutlined,
  VisibilityOutlined,
  EditOutlined,
  WarningAmberOutlined,
  CheckCircleOutlined,
  AccessTimeOutlined,
} from '@mui/icons-material';
import DataTable from '../../../components/common/DataTable';
import EmptyState from '../../../components/common/EmptyState';
import {
  useComplaintsQuery,
  useUpdateComplaintStatusMutation,
} from '../../../queries/hodQueries';
import { useToast } from '../../../contexts/ToastContext';

const CATEGORIES = [
  { value: 'ACADEMIC', label: 'Academic' },
  { value: 'INFRASTRUCTURE', label: 'Infrastructure' },
  { value: 'HARASSMENT', label: 'Harassment' },
  { value: 'ADMINISTRATIVE', label: 'Administrative' },
  { value: 'FACULTY_CONDUCT', label: 'Faculty Conduct' },
  { value: 'OTHER', label: 'Other' },
];

const STATUS_OPTIONS = [
  { value: 'UNDER_REVIEW', label: 'Under Review' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'ESCALATED', label: 'Escalated' },
];

const KpiCard = ({ title, value, subtitle, accentColor, icon }) => {
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
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
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
          {title}
        </Typography>
        {icon && <Box sx={{ color: accentColor, opacity: 0.8 }}>{icon}</Box>}
      </Box>
      <Typography variant="h3" sx={{ fontWeight: 900, color: accentColor, mt: 1, fontFamily: theme.typography.mono?.fontFamily || 'monospace', lineHeight: 1.1 }}>
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          {subtitle}
        </Typography>
      )}
    </Card>
  );
};

export const HodComplaintsHub = () => {
  const theme = useTheme();
  const { showToast } = useToast();

  // Modal States
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [actionStatus, setActionStatus] = useState('');
  const [actionNote, setActionNote] = useState('');
  const [resolutionRemarks, setResolutionRemarks] = useState('');

  // Filter & Search States
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  React.useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Queries & Mutations
  const { data: complaints = [], isLoading, isError, refetch } = useComplaintsQuery();
  const updateStatusMutation = useUpdateComplaintStatusMutation();

  // Client-side filtering
  const filteredComplaints = useMemo(() => {
    let list = Array.isArray(complaints) ? complaints : [];
    if (statusFilter) list = list.filter((c) => c.status === statusFilter);
    if (categoryFilter) list = list.filter((c) => c.category === categoryFilter);
    if (priorityFilter) list = list.filter((c) => c.priority === priorityFilter);
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(
        (c) =>
          (c.title?.toLowerCase() || '').includes(q) ||
          (c.description?.toLowerCase() || '').includes(q) ||
          (c.submittedBy?.name?.toLowerCase() || '').includes(q) ||
          (c.submittedBy?.email?.toLowerCase() || '').includes(q)
      );
    }
    return list;
  }, [complaints, statusFilter, categoryFilter, priorityFilter, debouncedSearch]);

  // KPI Stats
  const stats = useMemo(() => {
    const all = Array.isArray(complaints) ? complaints : [];
    return {
      total: all.length,
      open: all.filter((c) => c.status === 'OPEN').length,
      inProgress: all.filter((c) => c.status === 'IN_PROGRESS' || c.status === 'UNDER_REVIEW').length,
      resolved: all.filter((c) => c.status === 'RESOLVED' || c.status === 'CLOSED').length,
      slaBreach: all.filter((c) => c.slaBreached).length,
    };
  }, [complaints]);

  // Handlers
  const handleOpenDetail = (row) => {
    setSelectedComplaint(row);
    setDetailModalOpen(true);
  };

  const handleOpenAction = (row, defaultStatus = '') => {
    setSelectedComplaint(row);
    setActionStatus(defaultStatus || 'IN_PROGRESS');
    setActionNote('');
    setResolutionRemarks('');
    setActionModalOpen(true);
  };

  const handleActionConfirm = () => {
    if (!selectedComplaint || !actionStatus) return;
    const payload = {
      id: selectedComplaint._id || selectedComplaint.id,
      status: actionStatus,
      note: actionNote || `Status updated to ${actionStatus}`,
    };
    if (actionStatus === 'RESOLVED' || actionStatus === 'CLOSED') {
      payload.resolutionRemarks = resolutionRemarks;
    }

    updateStatusMutation.mutate(payload, {
      onSuccess: () => {
        showToast(`Grievance ticket status updated to ${actionStatus}.`);
        setActionModalOpen(false);
        setSelectedComplaint(null);
        refetch();
      },
      onError: (err) => showToast(err.response?.data?.message || 'Failed to update ticket status', { severity: 'error' }),
    });
  };

  const columns = [
    {
      id: 'title',
      label: 'Ticket Title & Category',
      render: (r) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 34, height: 34, bgcolor: `${theme.palette.signal.error}15`, color: theme.palette.signal.error }}>
            <ReportProblemOutlined sx={{ fontSize: 18 }} />
          </Avatar>
          <Box
            onClick={() => handleOpenDetail(r)}
            sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
          >
            <Typography variant="body2" sx={{ fontWeight: 800, color: theme.palette.ink[900] }}>
              {r.title}
            </Typography>
            <Chip label={r.category || 'OTHER'} size="small" variant="outlined" sx={{ fontWeight: 700, fontSize: '0.62rem', height: 18, mt: 0.3 }} />
          </Box>
        </Box>
      ),
    },
    {
      id: 'submittedBy',
      label: 'Submitted By',
      render: (r) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {r.submittedBy?.name || 'Anonymous User'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {r.submittedBy?.email || 'N/A'}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'priority',
      label: 'Priority',
      render: (r) => {
        const colorMap = { LOW: 'default', MEDIUM: 'info', HIGH: 'warning', CRITICAL: 'error' };
        return (
          <Chip
            label={r.priority || 'MEDIUM'}
            size="small"
            color={colorMap[r.priority] || 'default'}
            sx={{ fontWeight: 800, fontSize: '0.65rem' }}
          />
        );
      },
    },
    {
      id: 'sla',
      label: 'SLA Status',
      render: (r) =>
        r.slaBreached ? (
          <Chip icon={<WarningAmberOutlined sx={{ fontSize: '0.8rem !important' }} />} label="SLA BREACHED" size="small" color="error" sx={{ fontWeight: 800, fontSize: '0.62rem' }} />
        ) : (
          <Chip icon={<AccessTimeOutlined sx={{ fontSize: '0.8rem !important' }} />} label="SLA OK" size="small" color="success" sx={{ fontWeight: 800, fontSize: '0.62rem' }} />
        ),
    },
    {
      id: 'status',
      label: 'Status',
      render: (r) => {
        const statusColors = { OPEN: 'warning', UNDER_REVIEW: 'info', IN_PROGRESS: 'secondary', RESOLVED: 'success', CLOSED: 'default', ESCALATED: 'error' };
        return <Chip label={r.status || 'OPEN'} size="small" color={statusColors[r.status] || 'default'} sx={{ fontWeight: 800, fontSize: '0.65rem' }} />;
      },
    },
    {
      id: 'actions',
      label: 'Actions',
      render: (r) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<VisibilityOutlined />}
            onClick={() => handleOpenDetail(r)}
            sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 600, fontSize: '0.72rem' }}
          >
            Details
          </Button>
          <Button
            size="small"
            variant="contained"
            startIcon={<EditOutlined />}
            onClick={() => handleOpenAction(r)}
            sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 700, fontSize: '0.72rem' }}
          >
            Update
          </Button>
        </Box>
      ),
    },
  ];

  const isDark = theme.palette.mode === 'dark';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      {/* ── 1. Hero Identity Banner ────────────────────────────────────────── */}
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <Chip
                icon={<ReportProblemOutlined sx={{ fontSize: '0.9rem !important', color: `${theme.palette.primary.main} !important` }} />}
                label="DEPARTMENT GRIEVANCE & SERVICE LEVEL DESK"
                size="small"
                sx={{
                  bgcolor: `${theme.palette.primary.main}15`,
                  color: theme.palette.primary.main,
                  fontWeight: 800,
                  fontFamily: theme.typography.mono?.fontFamily || 'monospace',
                  letterSpacing: '0.05em',
                  fontSize: '0.7rem',
                }}
              />
            </Box>
            <Typography variant="h4" sx={{ fontFamily: theme.typography.h1?.fontFamily, fontWeight: 800, color: theme.palette.ink[900] }}>
              Department Grievances & Complaints
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
              Monitor student & faculty grievance tickets, track SLA resolution timers, update investigation status, and issue resolution notes.
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
        <Grid item xs={12} sm={6} md={2.4}>
          <KpiCard
            title="TOTAL TICKETS"
            value={isLoading ? <CircularProgress size={24} /> : stats.total}
            subtitle="Registered grievances"
            accentColor={theme.palette.ink[900]}
            icon={<ReportProblemOutlined sx={{ fontSize: 20 }} />}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <KpiCard
            title="OPEN TICKETS"
            value={isLoading ? <CircularProgress size={24} /> : stats.open}
            subtitle="Pending investigation"
            accentColor={theme.palette.warning.main}
            icon={<WarningAmberOutlined sx={{ fontSize: 20 }} />}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <KpiCard
            title="IN PROGRESS"
            value={isLoading ? <CircularProgress size={24} /> : stats.inProgress}
            subtitle="Under active review"
            accentColor={theme.palette.info?.main || '#0288d1'}
            icon={<AccessTimeOutlined sx={{ fontSize: 20 }} />}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <KpiCard
            title="RESOLVED TICKETS"
            value={isLoading ? <CircularProgress size={24} /> : stats.resolved}
            subtitle="Successfully resolved"
            accentColor={theme.palette.signal.success}
            icon={<CheckCircleOutlined sx={{ fontSize: 20 }} />}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <KpiCard
            title="SLA BREACHED"
            value={isLoading ? <CircularProgress size={24} /> : stats.slaBreach}
            subtitle="Overdue resolution time"
            accentColor={theme.palette.signal.error}
            icon={<WarningAmberOutlined sx={{ fontSize: 20 }} />}
          />
        </Grid>
      </Grid>

      {/* ── 3. Filters & Grievances Directory Table ───────────────────────── */}
      <Card sx={{ p: 3, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
        <Grid container spacing={2} sx={{ mb: 3 }} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search title, description, or submitter..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchOutlined sx={{ color: 'text.secondary', mr: 1, fontSize: 18 }} />,
              }}
            />
          </Grid>

          <Grid item xs={12} sm={2.6}>
            <TextField
              select
              fullWidth
              size="small"
              label="Ticket Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              SelectProps={{ displayEmpty: true }}
              InputLabelProps={{ shrink: true }}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="OPEN">Open Only</MenuItem>
              <MenuItem value="UNDER_REVIEW">Under Review</MenuItem>
              <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
              <MenuItem value="RESOLVED">Resolved Only</MenuItem>
              <MenuItem value="ESCALATED">Escalated Only</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} sm={2.7}>
            <TextField
              select
              fullWidth
              size="small"
              label="Category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              SelectProps={{ displayEmpty: true }}
              InputLabelProps={{ shrink: true }}
            >
              <MenuItem value="">All Categories</MenuItem>
              {CATEGORIES.map((c) => (
                <MenuItem key={c.value} value={c.value}>
                  {c.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={2.7}>
            <TextField
              select
              fullWidth
              size="small"
              label="Priority"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              SelectProps={{ displayEmpty: true }}
              InputLabelProps={{ shrink: true }}
            >
              <MenuItem value="">All Priorities</MenuItem>
              <MenuItem value="LOW">Low</MenuItem>
              <MenuItem value="MEDIUM">Medium</MenuItem>
              <MenuItem value="HIGH">High</MenuItem>
              <MenuItem value="CRITICAL">Critical</MenuItem>
            </TextField>
          </Grid>
        </Grid>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={32} />
          </Box>
        ) : filteredComplaints.length === 0 ? (
          <EmptyState
            type="reports"
            title="No Grievance Tickets Found"
            description="No complaints match the active search or status filter criteria."
          />
        ) : (
          <DataTable columns={columns} data={filteredComplaints} isLoading={isLoading} isError={isError} emptyMessage="No complaints found." />
        )}
      </Card>

      {/* ── 4. View Detail Modal ─────────────────────────────────────────── */}
      <Dialog open={detailModalOpen} onClose={() => setDetailModalOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        {selectedComplaint && (
          <>
            <DialogTitle sx={{ fontWeight: 800 }}>Grievance Ticket Details</DialogTitle>
            <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: theme.palette.ink[900] }}>
                  {selectedComplaint.title}
                </Typography>
                <Chip label={selectedComplaint.status || 'OPEN'} size="small" color="primary" sx={{ fontWeight: 800 }} />
              </Box>

              <Divider />

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Typography variant="caption" color="text.secondary">
                  Submitted By: <strong>{selectedComplaint.submittedBy?.name || 'Anonymous User'}</strong> ({selectedComplaint.submittedBy?.email})
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Category: <strong>{selectedComplaint.category || 'OTHER'}</strong>
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Priority: <strong>{selectedComplaint.priority || 'MEDIUM'}</strong>
                </Typography>
              </Box>

              <Typography variant="body2" sx={{ bgcolor: theme.custom?.surface?.sunken || 'rgba(0,0,0,0.02)', p: 2, borderRadius: '8px', border: `1px solid ${theme.palette.divider}`, lineHeight: 1.6 }}>
                {selectedComplaint.description}
              </Typography>

              {selectedComplaint.resolutionRemarks && (
                <Box sx={{ p: 2, bgcolor: `${theme.palette.signal.success}10`, borderRadius: '8px', border: `1px solid ${theme.palette.signal.success}` }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: theme.palette.signal.success, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleOutlined sx={{ fontSize: 18 }} /> Official Resolution Notes:
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, color: theme.palette.ink[900] }}>
                    {selectedComplaint.resolutionRemarks}
                  </Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={() => setDetailModalOpen(false)} variant="outlined" sx={{ borderRadius: '8px' }}>
                Close
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  setDetailModalOpen(false);
                  handleOpenAction(selectedComplaint);
                }}
                sx={{ borderRadius: '8px', fontWeight: 700 }}
              >
                Update Ticket Status
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ── 5. Update Status Modal ────────────────────────────────────────── */}
      <Dialog open={actionModalOpen} onClose={() => setActionModalOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Update Grievance Status</DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField select fullWidth label="New Status" value={actionStatus} onChange={(e) => setActionStatus(e.target.value)} required>
            {STATUS_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            multiline
            rows={2}
            label="Internal Update Note"
            value={actionNote}
            onChange={(e) => setActionNote(e.target.value)}
            placeholder="e.g. Investigation assigned to committee."
          />

          {(actionStatus === 'RESOLVED' || actionStatus === 'CLOSED') && (
            <TextField
              required
              fullWidth
              multiline
              rows={3}
              label="Official Resolution Remarks"
              value={resolutionRemarks}
              onChange={(e) => setResolutionRemarks(e.target.value)}
              placeholder="e.g. Issue investigated and resolved with faculty."
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setActionModalOpen(false)} variant="outlined" sx={{ borderRadius: '8px' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleActionConfirm}
            disabled={updateStatusMutation.isPending}
            sx={{ borderRadius: '8px', fontWeight: 700 }}
          >
            {updateStatusMutation.isPending ? 'Updating...' : 'Save Ticket Status'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HodComplaintsHub;
