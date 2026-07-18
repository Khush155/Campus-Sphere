import React, { useState } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Chip, Alert, Snackbar, IconButton, Tooltip,
} from '@mui/material';
import { AddOutlined, Delete, PriorityHigh, NotificationsActive } from '@mui/icons-material';
import DataTable from '../../../components/common/DataTable';
import { useNoticesQuery, useCreateNoticesMutation, useDeleteNoticeMutation } from '../../../queries/hodQueries';

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];
const AUDIENCES = ['ALL', 'FACULTY', 'STUDENTS', 'HOD_ONLY'];
const PRIORITY_COLORS = { LOW: 'default', MEDIUM: 'info', HIGH: 'error' };

const HodNoticesHub = () => {
  const [openModal, setOpenModal] = useState(false);
  const [toast, setToast] = useState({ open: false, msg: '', severity: 'success' });
  const [formData, setFormData] = useState({
    title: '', content: '', priority: 'MEDIUM', targetAudience: 'ALL', expiresAt: '',
  });

  const { data: notices = [], isLoading } = useNoticesQuery();
  const createMutation = useCreateNoticesMutation();
  const deleteMutation = useDeleteNoticeMutation();

  const showToast = (msg, severity = 'success') => setToast({ open: true, msg, severity });

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete notice: "${title}"?`)) return;
    try {
      await deleteMutation.mutateAsync(id);
      showToast('Notice deleted.');
    } catch {
      showToast('Failed to delete.', 'error');
    }
  };

  const columns = [
    {
      id: 'priority', label: '!', render: (r) =>
        r.priority === 'HIGH'
          ? <Tooltip title="High Priority"><PriorityHigh color="error" /></Tooltip>
          : null
    },
    { id: 'title', label: 'Title', render: (r) => <Typography fontWeight={700}>{r.title}</Typography> },
    { id: 'content', label: 'Content', render: (r) => <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.content}</Typography> },
    {
      id: 'priority', label: 'Priority', render: (r) => (
        <Chip label={r.priority} size="small" color={PRIORITY_COLORS[r.priority] || 'default'} />
      )
    },
    {
      id: 'targetAudience', label: 'Audience', render: (r) => (
        <Chip icon={<NotificationsActive fontSize="small" />} label={r.targetAudience} size="small" variant="outlined" />
      )
    },
    {
      id: 'expiresAt', label: 'Expires', render: (r) => r.expiresAt
        ? <Typography variant="caption" color="text.secondary">{new Date(r.expiresAt).toLocaleDateString('en-IN')}</Typography>
        : <Typography variant="caption" color="text.disabled">No expiry</Typography>
    },
    { id: 'authorId', label: 'Author', render: (r) => `${r.authorId?.name || '—'} (${r.authorId?.role || ''})` },
    { id: 'createdAt', label: 'Posted', render: (r) => new Date(r.createdAt).toLocaleDateString('en-IN') },
    {
      id: 'delete', label: '', render: (r) => (
        <Tooltip title="Delete Notice">
          <IconButton size="small" color="error" onClick={() => handleDelete(r._id, r.title)}>
            <Delete fontSize="small" />
          </IconButton>
        </Tooltip>
      )
    },
  ];

  const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData, {
      onSuccess: () => { setOpenModal(false); showToast('Notice published.'); },
      onError: (err) => showToast(err.response?.data?.message || 'Failed to publish notice.', 'error'),
    });
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">Notices Management</Typography>
          <Typography variant="body2" color="text.secondary">
            Publish notices with priority levels and audience targeting. Expired notices are automatically hidden.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddOutlined />} onClick={() => setOpenModal(true)}>
          Publish Notice
        </Button>
      </Box>

      <DataTable columns={columns} data={notices} isLoading={isLoading} emptyMessage="No active notices." />

      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Publish New Notice</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent dividers>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="Notice Title" name="title" value={formData.title} onChange={handleChange} required fullWidth />
              <TextField label="Content" name="content" value={formData.content} onChange={handleChange} required multiline rows={4} fullWidth />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField select label="Priority" name="priority" value={formData.priority} onChange={handleChange} fullWidth>
                  {PRIORITIES.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                </TextField>
                <TextField select label="Target Audience" name="targetAudience" value={formData.targetAudience} onChange={handleChange} fullWidth>
                  {AUDIENCES.map(a => <MenuItem key={a} value={a}>{a.replace('_', ' ')}</MenuItem>)}
                </TextField>
              </Box>
              <TextField
                label="Expires On (optional)"
                name="expiresAt"
                type="date"
                value={formData.expiresAt}
                onChange={handleChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
                helperText="Notice will auto-disappear after this date"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenModal(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Publishing...' : 'Publish Notice'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast(t => ({ ...t, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={toast.severity} onClose={() => setToast(t => ({ ...t, open: false }))} sx={{ borderRadius: 2 }}>{toast.msg}</Alert>
      </Snackbar>
    </Box>
  );
};

export default HodNoticesHub;
