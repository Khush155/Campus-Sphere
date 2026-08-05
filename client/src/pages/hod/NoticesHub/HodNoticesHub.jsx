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
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  AddOutlined,
  DeleteOutlined,
  CampaignOutlined,
  SearchOutlined,
  VisibilityOutlined,
  RefreshOutlined,
} from '@mui/icons-material';
import DataTable from '../../../components/common/DataTable';
import EmptyState from '../../../components/common/EmptyState';
import ConfirmDeleteModal from '../../../components/common/ConfirmDeleteModal';
import {
  useNoticesQuery,
  useCreateNoticesMutation,
  useDeleteNoticeMutation,
} from '../../../queries/hodQueries';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';

const PRIORITIES = [
  { value: 'NORMAL', label: 'Normal', color: 'info' },
  { value: 'IMPORTANT', label: 'Important', color: 'warning' },
  { value: 'URGENT', label: 'Urgent', color: 'error' },
];

const AUDIENCE_OPTIONS = [
  { label: 'All Users (Students, Faculty & HODs)', roles: [] },
  { label: 'Students & Faculty', roles: ['STUDENT', 'FACULTY'] },
  { label: 'Students Only', roles: ['STUDENT'] },
  { label: 'Faculty Only', roles: ['FACULTY'] },
  { label: 'HODs Only', roles: ['HOD'] },
];

const getCleanId = (val) => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (val._id) return String(val._id);
  if (val.id) return String(val.id);
  return String(val);
};

export const HodNoticesHub = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const { showToast } = useToast();
  const cleanDeptId = getCleanId(user?.departmentId || user?.department);

  // Modal States
  const [openPublishModal, setOpenPublishModal] = useState(false);
  const [openReadModal, setOpenReadModal] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [deleteNoticeId, setDeleteNoticeId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'NORMAL',
    audienceIndex: 0,
    status: 'PUBLISHED',
  });

  // Search & Filter States
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Debounce Search
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Queries & Mutations
  const { data: noticesData = [], isLoading, isError, refetch } = useNoticesQuery({ priority: priorityFilter || undefined });
  const createMutation = useCreateNoticesMutation();
  const deleteMutation = useDeleteNoticeMutation();

  const noticesList = useMemo(() => {
    if (!Array.isArray(noticesData)) return [];
    if (!debouncedSearch) return noticesData;
    const q = debouncedSearch.toLowerCase();
    return noticesData.filter(
      (n) => (n.title?.toLowerCase() || '').includes(q) || (n.content?.toLowerCase() || '').includes(q)
    );
  }, [noticesData, debouncedSearch]);

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
    if (!deleteNoticeId) return;
    deleteMutation.mutate(deleteNoticeId, {
      onSuccess: () => {
        showToast('Notice deleted successfully.');
        setDeleteNoticeId(null);
        refetch();
      },
      onError: (err) => {
        showToast(err.response?.data?.message || 'Failed to delete notice.', { severity: 'error' });
        setDeleteNoticeId(null);
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
        showToast('Notice published successfully to targeted audience!');
        refetch();
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
      label: 'Notice Title & Preview',
      render: (r) => (
        <Box
          onClick={() => handleOpenRead(r)}
          sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
        >
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
      id: 'target',
      label: 'Target Audience',
      render: (r) => {
        const roles = r.targetRoles || [];
        const label = roles.length === 0 ? 'All Users' : roles.join(', ');
        return <Chip label={label} size="small" variant="outlined" sx={{ fontWeight: 700, fontSize: '0.65rem' }} />;
      },
    },
    {
      id: 'author',
      label: 'Posted By',
      render: (r) => r.createdByName || r.createdById?.name || 'Department Office',
    },
    {
      id: 'date',
      label: 'Publish Date',
      render: (r) => new Date(r.createdAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    },
    {
      id: 'actions',
      label: 'Actions',
      render: (r) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Read Full Notice">
            <IconButton size="small" color="primary" onClick={() => handleOpenRead(r)}>
              <VisibilityOutlined sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Notice">
            <IconButton size="small" color="error" onClick={() => setDeleteNoticeId(r._id || r.id)}>
              <DeleteOutlined sx={{ fontSize: 18 }} />
            </IconButton>
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
                label="DEPARTMENT NOTICES, CIRCULARS & BROADCAST DESK"
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
              Department Notices & Circulars
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
              Broadcast official announcements, publish urgent academic alerts, target specific student/faculty audiences, and manage department circulars.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<RefreshOutlined />}
              onClick={() => refetch()}
              sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
            >
              Refresh
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
              Publish New Notice
            </Button>
          </Box>
        </Box>
      </Card>

      {/* ── 2. Filters & Directory Table ────────────────────────────────── */}
      <Card sx={{ p: 3, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
        <Grid container spacing={2} sx={{ mb: 3 }} alignItems="center">
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search notice title or content..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchOutlined sx={{ color: 'text.secondary', mr: 1, fontSize: 18 }} />,
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              size="small"
              label="Priority Level"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              SelectProps={{ displayEmpty: true }}
              InputLabelProps={{ shrink: true }}
            >
              <MenuItem value="">All Priorities</MenuItem>
              <MenuItem value="NORMAL">Normal Priority</MenuItem>
              <MenuItem value="IMPORTANT">Important Only</MenuItem>
              <MenuItem value="URGENT">Urgent Only</MenuItem>
            </TextField>
          </Grid>
        </Grid>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={32} />
          </Box>
        ) : noticesList.length === 0 ? (
          <EmptyState
            type="reports"
            title="No Department Notices Found"
            description="No notices match the active search or priority filter criteria."
            actionText="Publish New Notice"
            onAction={handleOpenPublish}
          />
        ) : (
          <DataTable columns={columns} data={noticesList} isLoading={isLoading} isError={isError} emptyMessage="No notices found." />
        )}
      </Card>

      {/* ── 4. Publish Notice Modal ───────────────────────────────────────── */}
      <Dialog open={openPublishModal} onClose={handleClosePublish} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Publish Official Department Notice</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Notice Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              fullWidth
              placeholder="e.g. Mid-Term Examination Schedule Released"
            />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField select label="Priority Level" name="priority" value={formData.priority} onChange={handleChange} required fullWidth>
                  {PRIORITIES.map((p) => (
                    <MenuItem key={p.value} value={p.value}>
                      {p.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField select label="Target Audience" name="audienceIndex" value={formData.audienceIndex} onChange={handleChange} required fullWidth>
                  {AUDIENCE_OPTIONS.map((a, idx) => (
                    <MenuItem key={idx} value={idx}>
                      {a.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>

            <TextField
              label="Notice Content & Body"
              name="content"
              value={formData.content}
              onChange={handleChange}
              required
              multiline
              rows={5}
              fullWidth
              placeholder="Type the full text of the announcement here..."
            />
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

      {/* ── 5. Read Notice Modal ──────────────────────────────────────────── */}
      <Dialog open={openReadModal} onClose={() => setOpenReadModal(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        {selectedNotice && (
          <>
            <DialogTitle sx={{ fontWeight: 800 }}>{selectedNotice.title}</DialogTitle>
            <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip label={selectedNotice.priority || 'NORMAL'} size="small" color={selectedNotice.priority === 'URGENT' ? 'error' : selectedNotice.priority === 'IMPORTANT' ? 'warning' : 'info'} sx={{ fontWeight: 800 }} />
                <Chip label={`Posted ${new Date(selectedNotice.createdAt || Date.now()).toLocaleDateString('en-IN')}`} size="small" variant="outlined" />
              </Box>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-line', color: theme.palette.ink[900], lineHeight: 1.6 }}>
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

      {/* Confirm Delete Notice Modal */}
      {deleteNoticeId && (
        <ConfirmDeleteModal
          open={Boolean(deleteNoticeId)}
          title="Delete Department Notice"
          content="Are you sure you want to delete this notice? It will be removed from all student & faculty broadcast feeds."
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeleteNoticeId(null)}
          isDeleting={deleteMutation.isPending}
        />
      )}
    </Box>
  );
};

export default HodNoticesHub;
