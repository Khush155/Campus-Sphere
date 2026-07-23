import React, { useState, useMemo } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Chip, Alert, Snackbar, Link, useTheme, Autocomplete,
  CircularProgress, Grid, Card, CardContent, Divider, IconButton, Tooltip,
  List, ListItem, ListItemText, ListItemIcon, Avatar
} from '@mui/material';
import {
  AddOutlined, VideoCall, Place, CheckCircle, Cancel, Schedule,
  VisibilityOutlined, Groups, EventNote,
  PostAddOutlined, AssignmentOutlined
} from '@mui/icons-material';
import DataTable from '../../../components/common/DataTable';
import {
  useMeetingsQuery,
  useCreateMeetingsMutation,
  useUpdateMeetingStatusMutation,
  useAddMeetingActionItemMutation,
} from '../../../queries/hodQueries';
import { useUsersQuery } from '../../../queries/userQueries';
import { useAuth } from '../../../contexts/AuthContext';

const MEETING_TYPES = ['IN_PERSON', 'VIRTUAL', 'HYBRID'];
const STATUS_COLORS = {
  SCHEDULED: 'warning', IN_PROGRESS: 'info', COMPLETED: 'success',
  CANCELLED: 'error', POSTPONED: 'default',
};
const TYPE_ICONS = { VIRTUAL: <VideoCall fontSize="small" />, IN_PERSON: <Place fontSize="small" />, HYBRID: <Groups fontSize="small" /> };

const HodMeetingsHub = () => {
  const theme = useTheme();
  const { user } = useAuth();

  // Modal States
  const [openModal, setOpenModal] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [actionItemModalOpen, setActionItemModalOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Create Form
  const [formData, setFormData] = useState({
    title: '', agenda: '', meetingDate: '', location: '',
    meetingLink: '', meetingType: 'IN_PERSON', participants: []
  });

  // Action Item Form
  const [actionItemData, setActionItemData] = useState({
    description: '', assignedTo: null, dueDate: ''
  });

  // Toast
  const [toast, setToast] = useState({ open: false, msg: '', severity: 'success' });
  const showToast = (msg, severity = 'success') => setToast({ open: true, msg, severity });

  // Debounce search
  React.useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Queries
  const { data: meetings = [], isLoading } = useMeetingsQuery();
  const createMutation = useCreateMeetingsMutation();
  const updateStatusMutation = useUpdateMeetingStatusMutation();
  const addActionItemMutation = useAddMeetingActionItemMutation();

  // Robust department ID extraction
  const cleanDeptId = typeof user?.departmentId === 'object'
    ? user?.departmentId?._id
    : (user?.departmentId || user?.department?._id || user?.department);

  // Fetch users (if cleanDeptId exists filter by dept, otherwise fetch all users)
  const { data: usersData, isLoading: isLoadingUsers } = useUsersQuery(
    cleanDeptId ? { limit: 500, departmentId: cleanDeptId } : { limit: 500 }
  );
  
  // Deduplicate users by _id, exclude the HOD themselves from the list
  const availableUsers = useMemo(() => {
    const raw = Array.isArray(usersData) ? usersData : (usersData?.data || []);
    const seen = new Set();
    const currentUserId = user?.id || user?._id;

    return raw.filter(u => {
      if (!u) return false;
      const uid = String(u._id || u.id || '');
      if (!uid || seen.has(uid)) return false;
      seen.add(uid);
      if (currentUserId && String(currentUserId) === uid) return false;
      return true;
    });
  }, [usersData, user]);

  // Client-side filtering
  const filteredMeetings = useMemo(() => {
    let list = Array.isArray(meetings) ? meetings : [];
    if (statusFilter) list = list.filter(m => m.status === statusFilter);
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(m =>
        (m.title?.toLowerCase() || '').includes(q) ||
        (m.agenda?.toLowerCase() || '').includes(q) ||
        (m.organizerId?.name?.toLowerCase() || '').includes(q)
      );
    }
    return list;
  }, [meetings, statusFilter, debouncedSearch]);

  // KPI stats
  const stats = useMemo(() => {
    const all = Array.isArray(meetings) ? meetings : [];
    return {
      total: all.length,
      scheduled: all.filter(m => m.status === 'SCHEDULED').length,
      completed: all.filter(m => m.status === 'COMPLETED').length,
      cancelled: all.filter(m => m.status === 'CANCELLED').length,
    };
  }, [meetings]);

  // Handlers
  const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleClose = () => {
    setOpenModal(false);
    setFormData({ title: '', agenda: '', meetingDate: '', location: '', meetingLink: '', meetingType: 'IN_PERSON', participants: [] });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      participants: formData.participants.map(p => p._id || p.id || p)
    }, {
      onSuccess: () => {
        handleClose();
        showToast('Meeting scheduled successfully.');
      },
      onError: (err) => showToast(err.response?.data?.message || 'Failed to create meeting.', 'error'),
    });
  };

  const handleStatusChange = async (id, status) => {
    try {
      await updateStatusMutation.mutateAsync({ id, status });
      showToast(`Meeting marked as ${status.replace('_', ' ')}.`);
      if (selectedMeeting?._id === id) {
        setSelectedMeeting(prev => prev ? { ...prev, status } : null);
      }
    } catch {
      showToast('Failed to update status.', 'error');
    }
  };

  const handleOpenDetail = (row) => {
    setSelectedMeeting(row);
    setDetailModalOpen(true);
  };

  const handleAddActionItem = () => {
    if (!selectedMeeting || !actionItemData.description.trim()) return;
    addActionItemMutation.mutate({
      id: selectedMeeting._id,
      description: actionItemData.description,
      assignedTo: actionItemData.assignedTo?._id || actionItemData.assignedTo?.id || null,
      dueDate: actionItemData.dueDate || null,
    }, {
      onSuccess: () => {
        showToast('Action item added successfully.');
        setActionItemData({ description: '', assignedTo: null, dueDate: '' });
        setActionItemModalOpen(false);
      },
      onError: (err) => showToast(err.response?.data?.message || 'Failed to add action item.', 'error'),
    });
  };

  // Columns
  const columns = [
    {
      id: 'title', label: 'Meeting',
      render: (r) => (
        <Box onClick={() => handleOpenDetail(r)} sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
          <Typography variant="body2" fontWeight={700} color="primary.main">{r.title}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {r.agenda}
          </Typography>
        </Box>
      )
    },
    {
      id: 'meetingType', label: 'Type',
      render: (r) => (
        <Chip size="small" icon={TYPE_ICONS[r.meetingType] || <Place fontSize="small" />}
          label={r.meetingType?.replace('_', ' ')} variant="outlined"
          color={r.meetingType === 'VIRTUAL' ? 'info' : r.meetingType === 'HYBRID' ? 'secondary' : 'default'} />
      )
    },
    {
      id: 'meetingDate', label: 'Date & Time',
      render: (r) => {
        const d = new Date(r.meetingDate);
        const isPast = d < new Date() && r.status === 'SCHEDULED';
        return (
          <Box>
            <Typography variant="body2" fontWeight={600} color={isPast ? 'error.main' : 'text.primary'}>
              {d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </Typography>
          </Box>
        );
      }
    },
    {
      id: 'location', label: 'Venue',
      render: (r) => r.meetingLink ? (
        <Box>
          <Link href={r.meetingLink} target="_blank" rel="noopener" underline="hover" color="primary" variant="body2" fontWeight={600}>
            Join Meeting 🔗
          </Link>
          {r.location && <Typography variant="caption" display="block" color="text.secondary">{r.location}</Typography>}
        </Box>
      ) : <Typography variant="body2">{r.location || '—'}</Typography>
    },
    {
      id: 'participants', label: 'Participants',
      render: (r) => {
        const count = r.participants?.length || 0;
        return (
          <Tooltip title={count > 0 ? r.participants.map(p => p.name || p).join(', ') : 'No participants'}>
            <Chip label={`${count} invited`} size="small" variant="outlined" icon={<Groups fontSize="small" />} />
          </Tooltip>
        );
      }
    },
    {
      id: 'status', label: 'Status',
      render: (r) => <Chip label={r.status?.replace('_', ' ')} size="small" color={STATUS_COLORS[r.status] || 'default'} sx={{ fontWeight: 700 }} />
    },
    {
      id: 'actions', label: 'Actions',
      render: (r) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="View Details">
            <IconButton size="small" color="primary" onClick={() => handleOpenDetail(r)}>
              <VisibilityOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
          {r.status === 'SCHEDULED' && (
            <>
              <Tooltip title="Mark Completed">
                <IconButton size="small" color="success" onClick={() => handleStatusChange(r._id, 'COMPLETED')} disabled={updateStatusMutation.isPending}>
                  <CheckCircle fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Cancel Meeting">
                <IconButton size="small" color="error" onClick={() => handleStatusChange(r._id, 'CANCELLED')} disabled={updateStatusMutation.isPending}>
                  <Cancel fontSize="small" />
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">Meetings Management</Typography>
          <Typography variant="body2" color="text.secondary">
            Schedule, track, and manage departmental meetings with participants, action items, and minutes.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddOutlined />} onClick={() => setOpenModal(true)} sx={{ borderRadius: 2 }}>
          Schedule Meeting
        </Button>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={2}>
        {[
          { label: 'TOTAL', value: stats.total, color: 'text.primary', icon: <EventNote /> },
          { label: 'UPCOMING', value: stats.scheduled, color: 'warning.main', icon: <Schedule /> },
          { label: 'COMPLETED', value: stats.completed, color: 'success.main', icon: <CheckCircle /> },
          { label: 'CANCELLED', value: stats.cancelled, color: 'error.main', icon: <Cancel /> },
        ].map((kpi, idx) => (
          <Grid item xs={6} sm={3} key={idx}>
            <Card sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ bgcolor: 'action.hover', color: kpi.color, width: 40, height: 40 }}>{kpi.icon}</Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>{kpi.label}</Typography>
                  <Typography variant="h5" fontWeight={800} color={kpi.color}>{kpi.value}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Filter Bar */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small" placeholder="Search meetings..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: 1, minWidth: 220, bgcolor: 'background.paper' }}
        />
        <TextField select size="small" label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} sx={{ minWidth: 160, bgcolor: 'background.paper' }}>
          <MenuItem value="">All Statuses</MenuItem>
          <MenuItem value="SCHEDULED">Scheduled</MenuItem>
          <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
          <MenuItem value="COMPLETED">Completed</MenuItem>
          <MenuItem value="CANCELLED">Cancelled</MenuItem>
          <MenuItem value="POSTPONED">Postponed</MenuItem>
        </TextField>
      </Box>

      {/* Data Table */}
      <DataTable columns={columns} data={filteredMeetings} isLoading={isLoading} emptyMessage="No meetings found." />

      {/* === Create Meeting Modal === */}
      <Dialog open={openModal} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Schedule New Meeting</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent dividers>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField label="Meeting Title" name="title" value={formData.title} onChange={handleChange} required fullWidth />
              <TextField label="Agenda" name="agenda" value={formData.agenda} onChange={handleChange} required fullWidth multiline rows={3} placeholder="Describe the purpose and topics of discussion..." />
              <TextField label="Meeting Date & Time" name="meetingDate" type="datetime-local" value={formData.meetingDate} onChange={handleChange} required fullWidth InputLabelProps={{ shrink: true }} />
              <TextField select label="Meeting Type" name="meetingType" value={formData.meetingType} onChange={handleChange} fullWidth>
                {MEETING_TYPES.map(t => <MenuItem key={t} value={t}>{t.replace(/_/g, ' ')}</MenuItem>)}
              </TextField>
              <TextField label="Location / Room" name="location" value={formData.location} onChange={handleChange} required fullWidth placeholder="e.g. HOD Chamber, Conference Room A" />
              {(formData.meetingType === 'VIRTUAL' || formData.meetingType === 'HYBRID') && (
                <TextField
                  label="Meeting Link"
                  name="meetingLink"
                  value={formData.meetingLink}
                  onChange={handleChange}
                  fullWidth
                  required={formData.meetingType === 'VIRTUAL'}
                  placeholder="https://meet.google.com/xxx or Zoom link"
                  helperText={formData.meetingType === 'VIRTUAL' ? 'Required for virtual meetings' : 'Optional for hybrid meetings'}
                />
              )}

              <Divider />

              <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
                Select Participants
              </Typography>

              <Autocomplete
                multiple
                options={availableUsers}
                getOptionLabel={(option) => {
                  if (typeof option === 'string') return option;
                  if (!option) return '';
                  const roleStr = option.role ? ` (${option.role.replace(/_/g, ' ')})` : '';
                  return `${option.name || option.email || 'User'}${roleStr}`;
                }}
                isOptionEqualToValue={(option, value) => {
                  if (!option || !value) return false;
                  const optId = option._id || option.id || option;
                  const valId = value._id || value.id || value;
                  return String(optId) === String(valId);
                }}
                filterSelectedOptions
                value={formData.participants}
                onChange={(_, newValue) => {
                  const seen = new Set();
                  const deduped = newValue.filter(u => {
                    const id = String(u._id || u.id || u);
                    if (seen.has(id)) return false;
                    seen.add(id);
                    return true;
                  });
                  setFormData(p => ({ ...p, participants: deduped }));
                }}
                loading={isLoadingUsers}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Participants"
                    placeholder="Search faculty or students..."
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
                    <Chip
                      key={option._id || option.id || index}
                      variant="outlined"
                      label={`${option.name || 'User'} (${(option.role || '').replace(/_/g, ' ')})`}
                      size="small"
                      avatar={<Avatar>{(option.name || '?')[0]}</Avatar>}
                      {...getTagProps({ index })}
                    />
                  ))
                }
                renderOption={(props, option) => {
                  const key = option._id || option.id || props.key;
                  return (
                    <li {...props} key={key}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 28, height: 28, fontSize: 14 }}>{(option.name || '?')[0]}</Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>{option.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{(option.role || '').replace(/_/g, ' ')} • {option.email}</Typography>
                        </Box>
                      </Box>
                    </li>
                  );
                }}
              />

              {formData.participants.length > 0 && (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  <strong>{formData.participants.length}</strong> participant(s) selected.
                </Alert>
              )}
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={createMutation.isPending} sx={{ borderRadius: 2 }}>
              {createMutation.isPending ? 'Scheduling...' : 'Schedule Meeting'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* === Meeting Detail Modal === */}
      <Dialog open={detailModalOpen} onClose={() => setDetailModalOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        {selectedMeeting && (
          <>
            <DialogTitle sx={{ pb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="h6" fontWeight={800}>{selectedMeeting.title}</Typography>
                <Chip label={selectedMeeting.status?.replace('_', ' ')} size="small" color={STATUS_COLORS[selectedMeeting.status] || 'default'} sx={{ fontWeight: 700 }} />
              </Box>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 3 }}>
              {/* Meeting Info */}
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2, mb: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
                {[
                  ['Type', selectedMeeting.meetingType?.replace(/_/g, ' ')],
                  ['Date & Time', new Date(selectedMeeting.meetingDate).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })],
                  ['Location', selectedMeeting.location || '—'],
                  ['Organizer', selectedMeeting.organizerId?.name || '—'],
                ].map(([label, val]) => (
                  <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary">{label}:</Typography>
                    <Typography variant="caption" fontWeight={700}>{val}</Typography>
                  </Box>
                ))}
                {selectedMeeting.meetingLink && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">Meeting Link:</Typography>
                    <Link href={selectedMeeting.meetingLink} target="_blank" rel="noopener" variant="caption" fontWeight={700}>
                      Join Meeting 🔗
                    </Link>
                  </Box>
                )}
              </Box>

              {/* Agenda */}
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Agenda</Typography>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, mb: 3 }}>
                {selectedMeeting.agenda}
              </Typography>

              <Divider sx={{ my: 2 }} />

              {/* Participants List */}
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                Participants ({selectedMeeting.participants?.length || 0})
              </Typography>
              {selectedMeeting.participants?.length > 0 ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                  {selectedMeeting.participants.map((p, idx) => (
                    <Chip
                      key={p._id || idx}
                      avatar={<Avatar>{(p.name || '?')[0]}</Avatar>}
                      label={`${p.name || 'Unknown'} (${(p.role || '').replace(/_/g, ' ')})`}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>No specific participants — open/department-wide meeting.</Typography>
              )}

              {/* RSVP Summary */}
              {selectedMeeting.attendees?.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>RSVP Status</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                    {selectedMeeting.attendees.map((a, idx) => (
                      <Chip
                        key={idx}
                        label={`${a.userId?.name || 'Unknown'}: ${a.rsvpStatus}`}
                        size="small"
                        color={a.rsvpStatus === 'ACCEPTED' ? 'success' : a.rsvpStatus === 'DECLINED' ? 'error' : 'default'}
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </>
              )}

              {/* Minutes of Meeting */}
              {selectedMeeting.minutesOfMeeting && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Minutes of Meeting</Typography>
                  <Box sx={{ p: 2, bgcolor: 'info.50', border: '1px solid', borderColor: 'info.light', borderRadius: 2, mb: 3 }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{selectedMeeting.minutesOfMeeting}</Typography>
                  </Box>
                </>
              )}

              {/* Action Items */}
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography variant="subtitle2" fontWeight={700}>
                  Action Items ({selectedMeeting.actionItems?.length || 0})
                </Typography>
                {selectedMeeting.status !== 'CANCELLED' && (
                  <Button size="small" variant="outlined" startIcon={<PostAddOutlined />} onClick={() => setActionItemModalOpen(true)}>
                    Add Action Item
                  </Button>
                )}
              </Box>
              {selectedMeeting.actionItems?.length > 0 ? (
                <List dense disablePadding>
                  {selectedMeeting.actionItems.map((item, idx) => (
                    <ListItem key={item._id || idx} sx={{ bgcolor: 'grey.50', borderRadius: 1, mb: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <AssignmentOutlined fontSize="small" color={item.status === 'COMPLETED' ? 'success' : item.status === 'OVERDUE' ? 'error' : 'action'} />
                      </ListItemIcon>
                      <ListItemText
                        primary={item.description}
                        secondary={
                          <Box component="span" sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                            {item.assignedTo && <Chip size="small" label={`Assigned: ${item.assignedTo?.name || 'Unknown'}`} variant="outlined" />}
                            {item.dueDate && <Chip size="small" label={`Due: ${new Date(item.dueDate).toLocaleDateString('en-IN')}`} variant="outlined" />}
                            <Chip size="small" label={item.status} color={item.status === 'COMPLETED' ? 'success' : item.status === 'OVERDUE' ? 'error' : 'default'} />
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">No action items yet.</Typography>
              )}

              {/* Postpone Info */}
              {selectedMeeting.status === 'POSTPONED' && selectedMeeting.postponedTo && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Alert severity="warning" sx={{ borderRadius: 2 }}>
                    <strong>Postponed to:</strong> {new Date(selectedMeeting.postponedTo).toLocaleString('en-IN')}
                    {selectedMeeting.postponedReason && <> — {selectedMeeting.postponedReason}</>}
                  </Alert>
                </>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 2.5 }}>
              {selectedMeeting.status === 'SCHEDULED' && (
                <>
                  <Button variant="contained" color="success" onClick={() => handleStatusChange(selectedMeeting._id, 'COMPLETED')} disabled={updateStatusMutation.isPending} sx={{ borderRadius: 2 }}>
                    Complete
                  </Button>
                  <Button variant="outlined" color="error" onClick={() => handleStatusChange(selectedMeeting._id, 'CANCELLED')} disabled={updateStatusMutation.isPending} sx={{ borderRadius: 2 }}>
                    Cancel Meeting
                  </Button>
                </>
              )}
              <Button variant="outlined" onClick={() => setDetailModalOpen(false)} sx={{ borderRadius: 2 }}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* === Add Action Item Modal === */}
      <Dialog open={actionItemModalOpen} onClose={() => setActionItemModalOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Add Action Item</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Typography variant="body2" color="text.secondary">
              For meeting: <strong>{selectedMeeting?.title}</strong>
            </Typography>
            <TextField
              label="Action Item Description" fullWidth required multiline rows={2}
              value={actionItemData.description}
              onChange={(e) => setActionItemData(p => ({ ...p, description: e.target.value }))}
              placeholder="Describe the task or follow-up item..."
            />
            <Autocomplete
              options={availableUsers}
              getOptionLabel={(option) => {
                if (typeof option === 'string') return option;
                if (!option) return '';
                const roleStr = option.role ? ` (${option.role.replace(/_/g, ' ')})` : '';
                return `${option.name || option.email || 'User'}${roleStr}`;
              }}
              isOptionEqualToValue={(option, value) => {
                if (!option || !value) return false;
                const optId = option._id || option.id || option;
                const valId = value._id || value.id || value;
                return String(optId) === String(valId);
              }}
              value={actionItemData.assignedTo}
              onChange={(_, newValue) => setActionItemData(p => ({ ...p, assignedTo: newValue }))}
              renderInput={(params) => <TextField {...params} label="Assign To (Optional)" placeholder="Select a person..." />}
              renderOption={(props, option) => {
                const key = option._id || option.id || props.key;
                return (
                  <li {...props} key={key}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>{(option.name || '?')[0]}</Avatar>
                      <Typography variant="body2">{option.name}</Typography>
                    </Box>
                  </li>
                );
              }}
            />
            <TextField
              label="Due Date" type="date" fullWidth
              value={actionItemData.dueDate}
              onChange={(e) => setActionItemData(p => ({ ...p, dueDate: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setActionItemModalOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddActionItem} disabled={addActionItemMutation.isPending || !actionItemData.description.trim()} sx={{ borderRadius: 2 }}>
            {addActionItemMutation.isPending ? 'Adding...' : 'Add Item'}
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

export default HodMeetingsHub;
