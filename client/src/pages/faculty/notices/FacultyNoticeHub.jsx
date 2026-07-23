/* eslint-disable */
import React, { useState, useMemo } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Chip, Alert, Snackbar, IconButton, Tooltip, Grid,
  useTheme, Paper
} from '@mui/material';
import {
  AddOutlined, Delete, NotificationsActive, VisibilityOutlined,
  SearchOutlined, ArrowBack as BackIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../../components/common/DataTable';
import EmptyState from '../../../components/common/EmptyState';
import { useNoticesQuery, useCreateNoticesMutation, useDeleteNoticeMutation } from '../../../queries/hodQueries';
import { useAuth } from '../../../contexts/AuthContext';

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
  const navigate = useNavigate();
  const { user } = useAuth();
  const cleanDeptId = getCleanId(user?.departmentId || user?.department);

  // Modal States
  const [openPublishModal, setOpenPublishModal] = useState(false);
  const [openReadModal, setOpenReadModal] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [noticeToDelete, setNoticeToDelete] = useState(null);

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

  // Toast Notification State
  const [toast, setToast] = useState({ open: false, msg: '', severity: 'success' });
  const showToast = (msg, severity = 'success') => setToast({ open: true, msg, severity });

  // Debounce Search
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Queries & Mutations
  const { data: noticesData = [], isLoading } = useNoticesQuery({ priority: priorityFilter || undefined });
  const createMutation = useCreateNoticesMutation();
  const deleteMutation = useDeleteNoticeMutation();

  const noticesList = useMemo(() => {
    if (!Array.isArray(noticesData)) return [];
    if (!debouncedSearch) return noticesData;
    const q = debouncedSearch.toLowerCase();
    return noticesData.filter(n => (n.title?.toLowerCase() || '').includes(q) || (n.content?.toLowerCase() || '').includes(q));
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

  const handleOpenDelete = (id, title) => {
    setNoticeToDelete({ id, title });
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!noticeToDelete) return;
    try {
      await deleteMutation.mutateAsync(noticeToDelete.id);
      showToast('Notice deleted successfully.');
      setDeleteModalOpen(false);
      setNoticeToDelete(null);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete notice.', 'error');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || formData.title.trim().length === 0) {
      showToast('Please enter a notice title.', 'error');
      return;
    }
    if (!formData.content || formData.content.trim().length === 0) {
      showToast('Please enter notice content.', 'error');
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
        showToast('Notice published successfully! Students and HOD can now view it.');
      },
      onError: (err) => showToast(err.response?.data?.message || 'Failed to publish notice.', 'error'),
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
            sx={{ fontWeight: 700 }}
          />
        );
      }
    },
    {
      id: 'title',
      label: 'Notice Title',
      render: (r) => (
        <Box 
          onClick={() => handleOpenRead(r)} 
          sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
        >
          <Typography variant="body2" fontWeight={700} color="primary.main">
            {r.title}
          </Typography>
          <Typography 
            variant="caption" 
            color="text.secondary" 
            sx={{ 
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {r.content}
          </Typography>
        </Box>
      )
    },
    {
      id: 'targetRoles',
      label: 'Target Audience',
      render: (r) => {
        const roles = r.targetRoles || [];
        const label = roles.length === 0 ? 'All Users' : roles.join(', ');
        return (
          <Chip 
            icon={<NotificationsActive fontSize="small" />} 
            label={label} 
            size="small" 
            variant="outlined" 
            sx={{ fontWeight: 600 }}
          />
        );
      }
    },
    {
      id: 'status',
      label: 'Status',
      render: (r) => (
        <Chip 
          label={r.status || 'PUBLISHED'} 
          size="small" 
          color={r.status === 'PUBLISHED' ? 'success' : r.status === 'DRAFT' ? 'warning' : 'default'} 
          sx={{ fontWeight: 600 }}
        />
      )
    },
    {
      id: 'createdAt',
      label: 'Posted Date',
      render: (r) => new Date(r.createdAt || r.publishedAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    },
    {
      id: 'actions',
      label: 'Actions',
      render: (r) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Read Full Notice">
            <IconButton size="small" color="primary" onClick={() => handleOpenRead(r)}>
              <VisibilityOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
          {(String(r.publishedBy?._id || r.publishedBy) === String(user?.id || user?._id) || user?.role === 'SUPER_ADMIN') && (
            <Tooltip title="Delete Notice">
              <IconButton size="small" color="error" onClick={() => handleOpenDelete(r._id, r.title)}>
                <Delete fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      )
    },
  ];

  return (
    <Box sx={{ p: { xs: 1, sm: 3 }, display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <IconButton onClick={() => navigate('/faculty')} size="small" sx={{ bgcolor: 'action.hover', '&:hover': { bgcolor: 'action.selected' } }}>
            <BackIcon fontSize="small" />
          </IconButton>
          <Box>
            <Typography variant="h4" fontWeight="bold">Notice Board & Announcements</Typography>
            <Typography variant="body2" color="text.secondary">
              Publish class announcements to students, view department notices, and manage your posts.
            </Typography>
          </Box>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<AddOutlined />} 
          onClick={handleOpenPublish} 
          sx={{ borderRadius: '8px', fontWeight: 700, px: 3, py: 1 }}
        >
          Publish Notice
        </Button>
      </Box>

      {/* Filter Bar */}
      <Box sx={{ p: 2, borderRadius: '12px', bgcolor: 'rgba(28, 46, 69, 0.02)', border: `1px solid ${theme.palette.divider}` }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={5}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search notice title or content..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchOutlined fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              sx={{ bgcolor: 'background.paper' }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Priority Level"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              sx={{ bgcolor: 'background.paper' }}
            >
              <MenuItem value="">All Priorities</MenuItem>
              {PRIORITIES.map(p => (
                <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Box>

      {/* Data Table */}
      {noticesList.length === 0 && !isLoading ? (
        <EmptyState
          type="notice"
          title="No Active Notices"
          description="No department or student notices match your filters. Click 'Publish Notice' to broadcast an announcement."
        />
      ) : (
        <DataTable 
          columns={columns} 
          data={noticesList} 
          isLoading={isLoading} 
          emptyMessage="No notices found." 
        />
      )}

      {/* Publish Notice Modal */}
      <Dialog open={openPublishModal} onClose={handleClosePublish} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Publish Notice to Students</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent dividers>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField 
                label="Notice Title" 
                name="title" 
                value={formData.title} 
                onChange={handleChange} 
                required 
                fullWidth 
                placeholder="E.g., Class Rescheduled / Lab Test Announcement"
              />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField 
                    select 
                    label="Priority Level" 
                    name="priority" 
                    value={formData.priority} 
                    onChange={handleChange} 
                    fullWidth
                  >
                    {PRIORITIES.map(p => (
                      <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={6}>
                  <TextField 
                    select 
                    label="Publish Status" 
                    name="status" 
                    value={formData.status} 
                    onChange={handleChange} 
                    fullWidth
                  >
                    <MenuItem value="PUBLISHED">Publish Now</MenuItem>
                    <MenuItem value="DRAFT">Save as Draft</MenuItem>
                  </TextField>
                </Grid>
              </Grid>

              <TextField 
                select 
                label="Target Audience" 
                name="audienceIndex" 
                value={formData.audienceIndex} 
                onChange={handleChange} 
                fullWidth
              >
                {AUDIENCE_OPTIONS.map((opt, idx) => (
                  <MenuItem key={idx} value={idx}>{opt.label}</MenuItem>
                ))}
              </TextField>

              <TextField 
                label="Notice Content Body" 
                name="content" 
                value={formData.content} 
                onChange={handleChange} 
                required 
                multiline 
                rows={5} 
                fullWidth 
                placeholder="Write the announcement details for students..."
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={handleClosePublish}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={createMutation.isPending} sx={{ borderRadius: 2 }}>
              {createMutation.isPending ? 'Publishing...' : 'Publish Announcement'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Read Full Notice Modal */}
      <Dialog open={openReadModal} onClose={() => setOpenReadModal(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        {selectedNotice && (
          <>
            <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="h6" fontWeight={800}>{selectedNotice.title}</Typography>
                <Chip 
                  label={selectedNotice.priority || 'NORMAL'} 
                  size="small" 
                  color={selectedNotice.priority === 'URGENT' ? 'error' : selectedNotice.priority === 'IMPORTANT' ? 'warning' : 'info'} 
                  sx={{ fontWeight: 700 }}
                />
              </Box>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 3 }}>
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2, mb: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary">Published By:</Typography>
                  <Typography variant="caption" fontWeight={700}>
                    {selectedNotice.publishedBy?.name || 'Faculty'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary">Target Audience:</Typography>
                  <Typography variant="caption" fontWeight={700}>
                    {selectedNotice.targetRoles?.length > 0 ? selectedNotice.targetRoles.join(', ') : 'All Users (Students & Faculty)'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary">Posted Date:</Typography>
                  <Typography variant="caption" fontWeight={700}>
                    {new Date(selectedNotice.createdAt || selectedNotice.publishedAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </Typography>
                </Box>
              </Box>

              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, color: 'text.primary' }}>
                {selectedNotice.content}
              </Typography>
            </DialogContent>
            <DialogActions sx={{ p: 2.5 }}>
              <Button variant="contained" onClick={() => setOpenReadModal(false)} sx={{ borderRadius: 2 }}>
                Close Notice
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Delete Notice</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2">
            Are you sure you want to delete the notice <strong>"{noticeToDelete?.title}"</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleConfirmDelete} disabled={deleteMutation.isPending} sx={{ borderRadius: 2 }}>
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast Notification */}
      <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast(t => ({ ...t, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={toast.severity} onClose={() => setToast(t => ({ ...t, open: false }))} sx={{ borderRadius: 2 }}>{toast.msg}</Alert>
      </Snackbar>
    </Box>
  );
};

export default FacultyNoticeHub;
