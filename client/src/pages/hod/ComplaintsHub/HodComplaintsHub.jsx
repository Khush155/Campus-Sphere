/* eslint-disable */
import React, { useState, useMemo } from 'react';
import { 
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, MenuItem, Chip, IconButton, Tooltip, Snackbar, Alert,
  Grid, Card, CardContent, Divider, useTheme, Stepper, Step, StepLabel
} from '@mui/material';
import {
  CheckCircleOutlined, HourglassTopOutlined, EngineeringOutlined, VisibilityOutlined,
  SearchOutlined, PersonOutlined, WarningAmberOutlined, EscalatorWarningOutlined
} from '@mui/icons-material';
import DataTable from '../../../components/common/DataTable';
import EmptyState from '../../../components/common/EmptyState';
import { useComplaintsQuery, useUpdateComplaintStatusMutation } from '../../../queries/hodQueries';

const CATEGORIES = [
  { value: 'ACADEMIC', label: 'Academic' },
  { value: 'INFRASTRUCTURE', label: 'Infrastructure' },
  { value: 'HARASSMENT', label: 'Harassment' },
  { value: 'ADMINISTRATIVE', label: 'Administrative' },
  { value: 'FACULTY_CONDUCT', label: 'Faculty Conduct' },
  { value: 'OTHER', label: 'Other' },
];

const STATUS_OPTIONS = [
  { value: 'UNDER_REVIEW', label: 'Under Review', color: 'info' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: 'warning' },
  { value: 'RESOLVED', label: 'Resolved', color: 'success' },
  { value: 'CLOSED', label: 'Closed', color: 'default' },
  { value: 'ESCALATED', label: 'Escalated', color: 'error' },
];

const PRIORITY_COLORS = { LOW: 'default', MEDIUM: 'info', HIGH: 'warning', CRITICAL: 'error' };
const STATUS_COLORS = { OPEN: 'warning', UNDER_REVIEW: 'info', IN_PROGRESS: 'secondary', RESOLVED: 'success', CLOSED: 'default', ESCALATED: 'error' };

const HodComplaintsHub = () => {
  const theme = useTheme();

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

  // Toast
  const [toast, setToast] = useState({ open: false, msg: '', severity: 'success' });
  const showToast = (msg, severity = 'success') => setToast({ open: true, msg, severity });

  // Debounce search
  React.useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Queries & Mutations
  const { data: complaints = [], isLoading, isError } = useComplaintsQuery();
  const updateStatusMutation = useUpdateComplaintStatusMutation();

  // Client-side filtering
  const filteredComplaints = useMemo(() => {
    let list = Array.isArray(complaints) ? complaints : [];
    if (statusFilter) list = list.filter(c => c.status === statusFilter);
    if (categoryFilter) list = list.filter(c => c.category === categoryFilter);
    if (priorityFilter) list = list.filter(c => c.priority === priorityFilter);
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(c =>
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
      open: all.filter(c => c.status === 'OPEN').length,
      inProgress: all.filter(c => c.status === 'IN_PROGRESS' || c.status === 'UNDER_REVIEW').length,
      resolved: all.filter(c => c.status === 'RESOLVED' || c.status === 'CLOSED').length,
      slaBreach: all.filter(c => c.slaBreached).length,
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
      id: selectedComplaint._id,
      status: actionStatus,
      note: actionNote || `Status changed to ${actionStatus}`,
    };
    if (actionStatus === 'RESOLVED' || actionStatus === 'CLOSED') {
      payload.resolutionRemarks = resolutionRemarks;
    }
    updateStatusMutation.mutate(payload, {
      onSuccess: () => {
        showToast(`Complaint marked as ${actionStatus} successfully.`);
        setActionModalOpen(false);
        setDetailModalOpen(false);
        setSelectedComplaint(null);
      },
      onError: (err) => showToast(err.response?.data?.message || 'Failed to update status', 'error'),
    });
  };

  const columns = [
    {
      id: 'priority',
      label: 'Priority',
      render: (r) => (
        <Chip label={r.priority || 'MEDIUM'} size="small" color={PRIORITY_COLORS[r.priority] || 'default'} sx={{ fontWeight: 700 }} />
      )
    },
    {
      id: 'title',
      label: 'Complaint',
      render: (r) => (
        <Box onClick={() => handleOpenDetail(r)} sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
          <Typography variant="body2" fontWeight={700} color="primary.main">{r.title}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {r.description}
          </Typography>
        </Box>
      )
    },
    {
      id: 'submittedBy',
      label: 'Submitted By',
      render: (r) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonOutlined color="action" fontSize="small" />
          <Box>
            <Typography variant="body2" fontWeight={600}>{r.submittedBy?.name || '—'}</Typography>
            <Typography variant="caption" color="text.secondary">{r.submittedBy?.role || ''}</Typography>
          </Box>
        </Box>
      )
    },
    {
      id: 'category',
      label: 'Category',
      render: (r) => <Chip label={r.category?.replace('_', ' ') || '—'} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
    },
    {
      id: 'status',
      label: 'Status',
      render: (r) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Chip label={r.status?.replace('_', ' ') || 'OPEN'} size="small" color={STATUS_COLORS[r.status] || 'default'} sx={{ fontWeight: 700 }} />
          {r.slaBreached && (
            <Tooltip title="SLA Breached (> 7 days)">
              <WarningAmberOutlined color="error" fontSize="small" />
            </Tooltip>
          )}
        </Box>
      )
    },
    {
      id: 'createdAt',
      label: 'Filed On',
      render: (r) => new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    },
    {
      id: 'actions',
      label: 'Actions',
      render: (r) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="View Details">
            <IconButton size="small" color="primary" onClick={() => handleOpenDetail(r)}>
              <VisibilityOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
          {r.status !== 'RESOLVED' && r.status !== 'CLOSED' && (
            <>
              <Tooltip title="Mark In Progress">
                <IconButton size="small" color="warning" onClick={() => handleOpenAction(r, 'IN_PROGRESS')} disabled={updateStatusMutation.isPending}>
                  <EngineeringOutlined fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Resolve Complaint">
                <IconButton size="small" color="success" onClick={() => handleOpenAction(r, 'RESOLVED')} disabled={updateStatusMutation.isPending}>
                  <CheckCircleOutlined fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      )
    },
  ];

  return (
    <Box sx={{ p: { xs: 1, sm: 3 }, display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box>
        <Typography variant="h4" fontWeight="bold" sx={{ color: theme.palette.ink?.[900] || 'text.primary' }}>
          Complaint Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Review, investigate, and resolve complaints filed by students and faculty in your department.
        </Typography>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={2}>
        {[
          { label: 'TOTAL FILED', value: stats.total, color: 'text.primary' },
          { label: 'OPEN / PENDING', value: stats.open, color: 'warning.main' },
          { label: 'IN PROGRESS', value: stats.inProgress, color: 'info.main' },
          { label: 'RESOLVED / CLOSED', value: stats.resolved, color: 'success.main' },
        ].map((kpi, idx) => (
          <Grid item xs={6} sm={3} key={idx}>
            <Card sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>{kpi.label}</Typography>
                <Typography variant="h4" fontWeight={800} color={kpi.color} sx={{ mt: 0.5 }}>{kpi.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {stats.slaBreach > 0 && (
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          <strong>{stats.slaBreach}</strong> complaint(s) have breached the 7-day SLA resolution deadline!
        </Alert>
      )}

      {/* Filter Bar */}
      <Box sx={{ p: 2, borderRadius: '12px', bgcolor: 'rgba(28, 46, 69, 0.02)', border: `1px solid ${theme.palette.divider}` }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth size="small"
              placeholder="Search complaint or reporter..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{ startAdornment: <SearchOutlined fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} /> }}
              sx={{ bgcolor: 'background.paper' }}
            />
          </Grid>
          <Grid item xs={6} sm={3} md={3}>
            <TextField select fullWidth size="small" label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} sx={{ bgcolor: 'background.paper' }}>
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="OPEN">Open</MenuItem>
              {STATUS_OPTIONS.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6} sm={3} md={3}>
            <TextField select fullWidth size="small" label="Category" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} sx={{ bgcolor: 'background.paper' }}>
              <MenuItem value="">All Categories</MenuItem>
              {CATEGORIES.map(c => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6} sm={3} md={3}>
            <TextField select fullWidth size="small" label="Priority" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} sx={{ bgcolor: 'background.paper' }}>
              <MenuItem value="">All Priorities</MenuItem>
              <MenuItem value="LOW">Low</MenuItem>
              <MenuItem value="MEDIUM">Medium</MenuItem>
              <MenuItem value="HIGH">High</MenuItem>
              <MenuItem value="CRITICAL">Critical</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Box>

      {/* Data Table */}
      {filteredComplaints.length === 0 && !isLoading ? (
        <EmptyState type="complaint" title="No Complaints Found" description="No complaints match your current filter criteria." />
      ) : (
        <DataTable columns={columns} data={filteredComplaints} isLoading={isLoading} isError={isError} emptyMessage="No complaints found." />
      )}

      {/* Complaint Detail Modal */}
      <Dialog open={detailModalOpen} onClose={() => setDetailModalOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        {selectedComplaint && (
          <>
            <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="h6" fontWeight={800}>{selectedComplaint.title}</Typography>
                <Chip label={selectedComplaint.status?.replace('_', ' ') || 'OPEN'} size="small" color={STATUS_COLORS[selectedComplaint.status] || 'default'} sx={{ fontWeight: 700 }} />
              </Box>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 3 }}>
              {/* Metadata */}
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2, mb: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
                {[
                  ['Filed By', `${selectedComplaint.submittedBy?.name || '—'} (${selectedComplaint.submittedBy?.role || ''})`],
                  ['Category', selectedComplaint.category?.replace('_', ' ')],
                  ['Priority', selectedComplaint.priority],
                  ['Filed On', new Date(selectedComplaint.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })],
                  ['SLA Deadline', selectedComplaint.slaDeadline ? new Date(selectedComplaint.slaDeadline).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'],
                ].map(([label, val]) => (
                  <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary">{label}:</Typography>
                    <Typography variant="caption" fontWeight={700}>{val}</Typography>
                  </Box>
                ))}
                {selectedComplaint.slaBreached && (
                  <Alert severity="error" sx={{ mt: 1, py: 0 }}>SLA Breached — Resolution exceeded 7 days</Alert>
                )}
              </Box>

              {/* Description */}
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Complaint Description</Typography>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, mb: 3 }}>
                {selectedComplaint.description}
              </Typography>

              {/* Resolution Remarks */}
              {selectedComplaint.resolutionRemarks && (
                <Box sx={{ p: 2, bgcolor: 'success.50', border: '1px solid', borderColor: 'success.light', borderRadius: 2, mb: 3 }}>
                  <Typography variant="subtitle2" fontWeight={700} color="success.dark" sx={{ mb: 0.5 }}>Resolution Remarks</Typography>
                  <Typography variant="body2">{selectedComplaint.resolutionRemarks}</Typography>
                </Box>
              )}

              {/* Status History Timeline */}
              {selectedComplaint.statusHistory?.length > 0 && (
                <>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>Status History</Typography>
                  <Stepper orientation="vertical" activeStep={selectedComplaint.statusHistory.length - 1}>
                    {selectedComplaint.statusHistory.map((entry, idx) => (
                      <Step key={idx} completed>
                        <StepLabel>
                          <Typography variant="body2" fontWeight={600}>{entry.status?.replace('_', ' ')}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {entry.timestamp ? new Date(entry.timestamp).toLocaleString('en-IN') : ''} — {entry.note || ''}
                          </Typography>
                        </StepLabel>
                      </Step>
                    ))}
                  </Stepper>
                </>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 2.5 }}>
              {selectedComplaint.status !== 'RESOLVED' && selectedComplaint.status !== 'CLOSED' && (
                <Button variant="contained" color="warning" onClick={() => { setDetailModalOpen(false); handleOpenAction(selectedComplaint, 'IN_PROGRESS'); }} sx={{ borderRadius: 2, mr: 1 }}>
                  Update Status
                </Button>
              )}
              <Button variant="outlined" onClick={() => setDetailModalOpen(false)} sx={{ borderRadius: 2 }}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Action / Status Update Modal */}
      <Dialog open={actionModalOpen} onClose={() => setActionModalOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Update Complaint Status</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Updating status for: <strong>{selectedComplaint?.title}</strong>
          </Typography>

          <TextField
            select fullWidth label="New Status" value={actionStatus}
            onChange={(e) => setActionStatus(e.target.value)} sx={{ mb: 2 }}
          >
            {STATUS_OPTIONS.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
          </TextField>

          <TextField
            label="Action Note" fullWidth multiline rows={2} value={actionNote}
            onChange={(e) => setActionNote(e.target.value)} sx={{ mb: 2 }}
            placeholder="Describe what action was taken..."
          />

          {(actionStatus === 'RESOLVED' || actionStatus === 'CLOSED') && (
            <TextField
              label="Resolution Remarks" fullWidth multiline rows={3} value={resolutionRemarks}
              onChange={(e) => setResolutionRemarks(e.target.value)}
              placeholder="Explain how the complaint was resolved..."
            />
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setActionModalOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color={actionStatus === 'RESOLVED' ? 'success' : actionStatus === 'ESCALATED' ? 'error' : 'primary'}
            onClick={handleActionConfirm}
            disabled={updateStatusMutation.isPending || !actionStatus}
            sx={{ borderRadius: 2 }}
          >
            {updateStatusMutation.isPending ? 'Updating...' : `Set ${actionStatus?.replace('_', ' ')}`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast */}
      <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast(t => ({ ...t, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={toast.severity} onClose={() => setToast(t => ({ ...t, open: false }))} sx={{ borderRadius: 2 }}>{toast.msg}</Alert>
      </Snackbar>
    </Box>
  );
};

export default HodComplaintsHub;
