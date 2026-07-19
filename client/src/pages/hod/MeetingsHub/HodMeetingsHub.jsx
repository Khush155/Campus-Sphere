/* eslint-disable */
import React, { useState } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Chip, Alert, Snackbar, Link, useTheme, Autocomplete, CircularProgress
} from '@mui/material';
import { AddOutlined, VideoCall, Place, CheckCircle, Cancel, Schedule } from '@mui/icons-material';
import DataTable from '../../../components/common/DataTable';
import {
  useMeetingsQuery,
  useCreateMeetingsMutation,
  useUpdateMeetingStatusMutation,
} from '../../../queries/hodQueries';
import { useUsersQuery } from '../../../queries/userQueries';

const MEETING_TYPES = ['IN_PERSON', 'VIRTUAL', 'HYBRID'];
const STATUS_COLORS = {
  SCHEDULED: 'warning', IN_PROGRESS: 'info', COMPLETED: 'success',
  CANCELLED: 'error', POSTPONED: 'default',
};

const HodMeetingsHub = () => {
  const theme = useTheme();
  const [openModal, setOpenModal] = useState(false);
  const [toast, setToast] = useState({ open: false, msg: '', severity: 'success' });
  const [formData, setFormData] = useState({
    title: '', agenda: '', meetingDate: '', location: '',
    meetingLink: '', meetingType: 'IN_PERSON', participants: []
  });

  const { data: meetings = [], isLoading } = useMeetingsQuery();
  const createMutation = useCreateMeetingsMutation();
  const updateStatusMutation = useUpdateMeetingStatusMutation();

  // Fetch users for handpicking participants (limit high enough to show department users)
  const { data: usersData, isLoading: isLoadingUsers } = useUsersQuery({ limit: 500 });
  const availableUsers = usersData?.data || [];

  const showToast = (msg, severity = 'success') => setToast({ open: true, msg, severity });

  const handleStatusChange = async (id, status) => {
    try {
      await updateStatusMutation.mutateAsync({ id, status });
      showToast(`Meeting marked as ${status}.`);
    } catch {
      showToast('Failed to update status.', 'error');
    }
  };

  const columns = [
    { id: 'title', label: 'Title', render: (r) => <Typography fontWeight={700}>{r.title}</Typography> },
    {
      id: 'meetingType', label: 'Type', render: (r) => (
        <Chip
          size="small"
          icon={r.meetingType === 'VIRTUAL' ? <VideoCall fontSize="small" /> : <Place fontSize="small" />}
          label={r.meetingType}
          variant="outlined"
          color={r.meetingType === 'VIRTUAL' ? 'info' : 'default'}
        />
      )
    },
    { id: 'meetingDate', label: 'Date & Time', render: (r) => new Date(r.meetingDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) },
    {
      id: 'location', label: 'Location / Link', render: (r) => r.meetingLink ? (
        <Link href={r.meetingLink} target="_blank" rel="noopener" underline="hover" color="primary">
          Join Meeting 🔗
        </Link>
      ) : r.location
    },
    { id: 'organizerId', label: 'Organizer', render: (r) => r.organizerId?.name || '—' },
    { id: 'participants', label: 'Participants', render: (r) => `${r.participants?.length || 0} invited` },
    {
      id: 'status', label: 'Status', render: (r) => (
        <Chip label={r.status} size="small" color={STATUS_COLORS[r.status] || 'default'} />
      )
    },
    {
      id: 'actionItems', label: 'Action Items', render: (r) =>
        r.actionItems?.length > 0
          ? <Chip label={`${r.actionItems.length} items`} size="small" color="warning" />
          : <Typography variant="caption" color="text.disabled">None</Typography>
    },
    {
      id: 'actions', label: 'Actions', render: (r) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {r.status === 'SCHEDULED' && (
            <Button size="small" variant="outlined" color="success" startIcon={<CheckCircle fontSize="small" />}
              onClick={() => handleStatusChange(r._id, 'COMPLETED')}>Complete</Button>
          )}
          {r.status === 'SCHEDULED' && (
            <Button size="small" variant="outlined" color="error" startIcon={<Cancel fontSize="small" />}
              onClick={() => handleStatusChange(r._id, 'CANCELLED')}>Cancel</Button>
          )}
        </Box>
      )
    },
  ];

  const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      participants: formData.participants.map(p => p._id)
    }, {
      onSuccess: () => { 
        setOpenModal(false); 
        showToast('Meeting scheduled successfully.');
        setFormData({ title: '', agenda: '', meetingDate: '', location: '', meetingLink: '', meetingType: 'IN_PERSON', participants: [] });
      },
      onError: (err) => showToast(err.response?.data?.message || 'Failed to create meeting.', 'error'),
    });
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">Meetings Management</Typography>
          <Typography variant="body2" color="text.secondary">
            Schedule in-person, virtual, or hybrid meetings. Add meeting links, action items, and track RSVPs.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddOutlined />} onClick={() => setOpenModal(true)}>
          Schedule Meeting
        </Button>
      </Box>

      <DataTable columns={columns} data={meetings} isLoading={isLoading} emptyMessage="No meetings scheduled." />

      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Schedule New Meeting</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent dividers>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="Meeting Title" name="title" value={formData.title} onChange={handleChange} required fullWidth />
              <TextField label="Agenda" name="agenda" value={formData.agenda} onChange={handleChange} required fullWidth multiline rows={3} />
              <TextField label="Meeting Date & Time" name="meetingDate" type="datetime-local" value={formData.meetingDate} onChange={handleChange} required fullWidth InputLabelProps={{ shrink: true }} />
              <TextField select label="Meeting Type" name="meetingType" value={formData.meetingType} onChange={handleChange} fullWidth>
                {MEETING_TYPES.map(t => <MenuItem key={t} value={t}>{t.replace('_', ' ')}</MenuItem>)}
              </TextField>
              <TextField
                label="Location / Room"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                fullWidth
                placeholder="e.g. HOD Chamber, Conference Room A"
              />
              <TextField
                label="Meeting Link (for Virtual / Hybrid)"
                name="meetingLink"
                value={formData.meetingLink}
                onChange={handleChange}
                fullWidth
                placeholder="https://meet.google.com/xxx or Zoom link"
                helperText={formData.meetingType === 'VIRTUAL' ? '⚠️ Required for virtual meetings' : 'Optional for in-person'}
                error={formData.meetingType === 'VIRTUAL' && !formData.meetingLink}
              />
              
              <Autocomplete
                multiple
                options={availableUsers}
                getOptionLabel={(option) => `${option.name} (${option.role.replace('_', ' ')})`}
                isOptionEqualToValue={(option, value) => option._id === value._id}
                value={formData.participants}
                onChange={(_, newValue) => setFormData(p => ({ ...p, participants: newValue }))}
                loading={isLoadingUsers}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Handpick Participants (Optional)"
                    placeholder="Select Faculty or Merit Students"
                    helperText="Leave empty if this is an open/department-wide meeting without specific RSVPs."
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <React.Fragment>
                          {isLoadingUsers ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </React.Fragment>
                      ),
                    }}
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip variant="outlined" label={option.name} size="small" {...getTagProps({ index })} />
                  ))
                }
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenModal(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Scheduling...' : 'Schedule Meeting'}
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

export default HodMeetingsHub;

