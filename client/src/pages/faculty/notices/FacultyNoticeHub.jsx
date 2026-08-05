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
  Tooltip,
  Grid,
  useTheme,
  Card,
  CircularProgress,
  Avatar,
  Divider,
} from '@mui/material';
import {
  AddOutlined,
  NotificationsActiveOutlined,
  VisibilityOutlined,
  SearchOutlined,
  RefreshOutlined,
  CampaignOutlined,
  WarningAmberOutlined,
  InfoOutlined,
  NotificationsOutlined,
} from '@mui/icons-material';
import DataTable from '../../../components/common/DataTable';
import EmptyState from '../../../components/common/EmptyState';
import ConfirmDeleteModal from '../../../components/common/ConfirmDeleteModal';
import { useNoticesQuery, useCreateNoticesMutation, useDeleteNoticeMutation } from '../../../queries/hodQueries';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';

const PRIORITIES = [
  { value: 'NORMAL', label: 'Normal', color: 'info' },
  { value: 'IMPORTANT', label: 'Important', color: 'warning' },
  { value: 'URGENT', label: 'Urgent', color: 'error' },
];

const AUDIENCE_OPTIONS = [
  { label: 'Students Only', roles: ['STUDENT'] },
  { label: 'Students & Faculty', roles: ['STUDENT', 'FACULTY'] },
  { label: 'All Users (Students, Faculty & HODs)', roles: [] },
];

const getCleanId = (val) => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (val._id) return String(val._id);
  if (val.id) return String(val.id);
  return String(val);
};

export const FacultyNoticeHub = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const { showToast } = useToast();
  const cleanDeptId = getCleanId(user?.departmentId || user?.department);

  // Modal States
  const [openPublishModal, setOpenPublishModal] = useState(false);
  const [openReadModal, setOpenReadModal] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'NORMAL',
    audienceIndex: 0, // Default: Students Only
    status: 'PUBLISHED',
  });

  // Search & Filter States
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Debounce Search
  React.useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Queries & Mutations
  const { data: noticesData = [], isLoading, refetch } = useNoticesQuery({ priority: priorityFilter || undefined });
  const createMutation = useCreateNoticesMutation();
  const deleteMutation = useDeleteNoticeMutation();

  const rawList = useMemo(() => (Array.isArray(noticesData) ? noticesData : []), [noticesData]);

  const filteredNotices = useMemo(() => {
    let list = rawList;
    if (priorityFilter) {
      list = list.filter((n) => n.priority === priorityFilter);
    }
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(
        (n) => (n.title?.toLowerCase() || '').includes(q) || (n.content?.toLowerCase() || '').includes(q)
      );
    }
    return list;
  }, [rawList, priorityFilter, debouncedSearch]);

  const stats = useMemo(() => {
    const total = rawList.length;
    const urgent = rawList.filter((n) => n.priority === 'URGENT').length;
    const important = rawList.filter((n) => n.priority === 'IMPORTANT').length;
    const normal = rawList.filter((n) => n.priority === 'NORMAL').length;
    return { total, urgent, important, normal };
  }, [rawList]);

  const handleOpenPublish = () => setOpenPublishModal(true);
  const handleClosePublish = () => {
    setOpenPublishModal(false);
    setFormData({
      title: '',
      content: '',
      priority: 'NORMAL',
      audienceIndex: 0,
      status: 'PUBLISHED',
    });
  };

  const handleOpenRead = (notice) => {
    setSelectedNotice(notice);
    setOpenReadModal(true);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTargetId) return;
    deleteMutation.mutate(deleteTargetId, {
      onSuccess: () => {
        showToast('Notice deleted successfully!');
        setDeleteTargetId(null);
      },
      onError: (err) => {
        showToast(`Deletion failed: ${err.response?.data?.message || err.message}`, { severity: 'error' });
        setDeleteTargetId(null);
      },
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || formData.title.trim().length === 0) {
      showToast('Please enter a notice title.', { severity: 'error' });
      return;
    }
    if (!formData.content || formData.content.trim().length === 0) {
      showToast('Please enter notice content.', { severity: 'error' });
      return;
    }

    const targetAudienceObj = AUDIENCE_OPTIONS[formData.audienceIndex] || AUDIENCE_OPTIONS[0];

    const payload = {
      title: formData.title.trim(),
      content: formData.content.trim(),
      priority: formData.priority,
      status: formData.status,
      targetRoles: targetAudienceObj.roles,
      targetDepartments: cleanDeptId ? [cleanDeptId] : [],
    };

    createMutation.mutate(payload, {
      onSuccess: () => {
        handleClosePublish();
        showToast('Notice published successfully! Students and department can now view it.');
      },
      onError: (err) => showToast(err.response?.data?.message || 'Failed to publish notice.', { severity: 'error' }),
    });
  };

  const columns = [
    {
      id: 'priority',
      label: 'Priority',
      render: (r) => {
        const colorMap = { NORMAL: 'info', IMPORTANT: 'warning', URGENT: 'error' };
        return (
          <Chip
            label={r.priority || 'NORMAL'}
            size="small"
            color={colorMap[r.priority] || 'default'}
            sx={{ fontWeight: 800, fontSize: '0.68rem' }}
          />
        );
      },
    },
    {
      id: 'title',
      label: 'Notice Title & Details',
      render: (r) => (
        <Box onClick={() => handleOpenRead(r)} sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
          <Typography variant="body2" sx={{ fontWeight: 800, color: theme.palette.ink[900] }}>
            {r.title}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {r.content}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'targetRoles',
      label: 'Target Audience',
      render: (r) => {
        const roles = r.targetRoles || [];
        const label = roles.length === 0 ? 'All Users' : roles.join(', ');
        return (
          <Chip
            icon={<NotificationsActiveOutlined sx={{ fontSize: '0.75rem !important' }} />}
            label={label}
            size="small"
            variant="outlined"
            sx={{ fontWeight: 700, fontSize: '0.68rem' }}
          />
        );
      },
    },
    {
      id: 'status',
      label: 'Status',
      render: (r) => (
        <Chip
          label={r.status || 'PUBLISHED'}
          size="small"
          color={r.status === 'PUBLISHED' ? 'success' : r.status === 'DRAFT' ? 'warning' : 'default'}
          sx={{ fontWeight: 800, fontSize: '0.65rem' }}
        />
      ),
    },
    {
      id: 'createdAt',
      label: 'Posted Date',
      render: (r) => new Date(r.createdAt || r.publishedAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    },
    {
      id: 'actions',
      label: 'Actions',
      render: (r) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Read Full Notice">
            <Button
              size="small"
              variant="outlined"
              startIcon={<VisibilityOutlined />}
              onClick={() => handleOpenRead(r)}
              sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 600, fontSize: '0.72rem' }}
            >
              Read
            </Button>
          </Tooltip>
        </Box>
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
                icon={<CampaignOutlined sx={{ fontSize: '0.9rem !important', color: `${theme.palette.primary.main} !important` }} />}
                label="FACULTY NOTICE BOARD & OFFICIAL BROADCAST DESK"
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
              Notice Board & Broadcast Feed
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
              Publish official class circulars, issue urgent academic alerts, and read department notifications.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<RefreshOutlined />}
              onClick={() => refetch()}
              sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
            >
              Refresh Feed
            </Button>
            <Button
              variant="contained"
              startIcon={<AddOutlined />}
              onClick={handleOpenPublish}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 700,
                background: theme.palette.primary.gradient || theme.palette.primary.main,
                color: '#ffffff',
              }}
            >
              Publish Class Notice
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
                  TOTAL NOTICES
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.ink[900], mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
                  {stats.total}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: `${theme.palette.primary.main}15`, color: theme.palette.primary.main }}>
                <NotificationsOutlined />
              </Avatar>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.signal.error }}>
                  URGENT ALERTS
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.signal.error, mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
                  {stats.urgent}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: `${theme.palette.signal.error}15`, color: theme.palette.signal.error }}>
                <WarningAmberOutlined />
              </Avatar>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.warning.main }}>
                  IMPORTANT CIRCULARS
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.warning.main, mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
                  {stats.important}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: `${theme.palette.warning.main}15`, color: theme.palette.warning.main }}>
                <InfoOutlined />
              </Avatar>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.info.main }}>
                  NORMAL BROADCASTS
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.info.main, mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
                  {stats.normal}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: `${theme.palette.info.main}15`, color: theme.palette.info.main }}>
                <CampaignOutlined />
              </Avatar>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* ── 3. Filters & Notice Table ─────────────────────────────────────── */}
      <Card sx={{ p: 3, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <TextField
            size="small"
            placeholder="Search notice title or content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 260 }}
            InputProps={{
              startAdornment: <SearchOutlined sx={{ color: 'text.secondary', mr: 1, fontSize: 18 }} />,
            }}
          />

          <TextField
            select
            size="small"
            label="Filter Priority"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            sx={{ minWidth: 180 }}
            SelectProps={{ displayEmpty: true }}
            InputLabelProps={{ shrink: true }}
          >
            <MenuItem value="">All Priorities</MenuItem>
            {PRIORITIES.map((p) => (
              <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
            ))}
          </TextField>
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={32} />
          </Box>
        ) : filteredNotices.length === 0 ? (
          <EmptyState type="reports" title="No Notices Found" description="No notice broadcasts match your search filters." />
        ) : (
          <DataTable columns={columns} data={filteredNotices} isLoading={isLoading} emptyMessage="No notices available." />
        )}
      </Card>

      {/* ── 4. Publish Notice Modal ───────────────────────────────────────── */}
      <Dialog open={openPublishModal} onClose={handleClosePublish} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Publish New Notice Broadcast</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Notice Title" name="title" value={formData.title} onChange={handleChange} required fullWidth />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField select label="Priority Level" name="priority" value={formData.priority} onChange={handleChange} fullWidth>
                  {PRIORITIES.map((p) => (
                    <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField select label="Target Audience" name="audienceIndex" value={formData.audienceIndex} onChange={handleChange} fullWidth>
                  {AUDIENCE_OPTIONS.map((opt, idx) => (
                    <MenuItem key={idx} value={idx}>{opt.label}</MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
            <TextField label="Notice Content" name="content" value={formData.content} onChange={handleChange} required fullWidth multiline rows={4} />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleClosePublish} variant="outlined" sx={{ borderRadius: '8px' }}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={createMutation.isPending} sx={{ borderRadius: '8px', fontWeight: 700 }}>
              {createMutation.isPending ? 'Publishing...' : 'Publish Notice'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ── 5. Read Full Notice Modal ─────────────────────────────────────── */}
      <Dialog open={openReadModal} onClose={() => setOpenReadModal(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        {selectedNotice && (
          <>
            <DialogTitle sx={{ fontWeight: 800 }}>{selectedNotice.title}</DialogTitle>
            <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Chip label={selectedNotice.priority} size="small" color={selectedNotice.priority === 'URGENT' ? 'error' : selectedNotice.priority === 'IMPORTANT' ? 'warning' : 'info'} sx={{ fontWeight: 800 }} />
                <Typography variant="caption" color="text.secondary">
                  Posted on {new Date(selectedNotice.createdAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </Typography>
              </Box>

              <Divider />

              <Typography variant="body1" sx={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                {selectedNotice.content}
              </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={() => setOpenReadModal(false)} variant="contained" sx={{ borderRadius: '8px', fontWeight: 700 }}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ── 6. Confirm Delete Modal ───────────────────────────────────────── */}
      <ConfirmDeleteModal
        open={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Notice Broadcast?"
        description="Are you sure you want to remove this notice from the department broadcast feed?"
        isLoading={deleteMutation.isPending}
      />
    </Box>
  );
};

export default FacultyNoticeHub;
