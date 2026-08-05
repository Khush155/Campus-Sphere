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
  Link,
  useTheme,
  Autocomplete,
  CircularProgress,
  Grid,
  Card,
  Divider,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  AddOutlined,
  VideoCallOutlined,
  PlaceOutlined,
  CheckCircleOutlined,
  CancelOutlined,
  SearchOutlined,
  GroupsOutlined,
  EventOutlined,
  RefreshOutlined,
  PostAddOutlined,
  AssignmentOutlined,
  VisibilityOutlined,
  LinkOutlined,
} from '@mui/icons-material';
import DataTable from '../../../components/common/DataTable';
import EmptyState from '../../../components/common/EmptyState';
import {
  useMeetingsQuery,
  useCreateMeetingsMutation,
  useUpdateMeetingStatusMutation,
  useAddMeetingActionItemMutation,
} from '../../../queries/hodQueries';
import { useUsersQuery } from '../../../queries/userQueries';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';

const MEETING_TYPES = [
  { value: 'IN_PERSON', label: 'In-Person Assembly' },
  { value: 'VIRTUAL', label: 'Virtual (Google Meet / Zoom)' },
  { value: 'HYBRID', label: 'Hybrid Assembly' },
];

const STATUS_COLORS = {
  SCHEDULED: 'warning',
  IN_PROGRESS: 'info',
  COMPLETED: 'success',
  CANCELLED: 'error',
  POSTPONED: 'default',
};

export const HodMeetingsHub = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const { showToast } = useToast();

  // Modal States
  const [openModal, setOpenModal] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [actionItemModalOpen, setActionItemModalOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Create Form State
  const [formData, setFormData] = useState({
    title: '',
    agenda: '',
    meetingDate: '',
    location: '',
    meetingLink: '',
    meetingType: 'IN_PERSON',
    participants: [],
  });

  // Action Item Form State
  const [actionItemData, setActionItemData] = useState({
    description: '',
    assignedTo: null,
    dueDate: '',
  });

  // Debounce search
  React.useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Queries
  const { data: meetings = [], isLoading, isError, refetch } = useMeetingsQuery();
  const createMutation = useCreateMeetingsMutation();
  const updateStatusMutation = useUpdateMeetingStatusMutation();
  const addActionItemMutation = useAddMeetingActionItemMutation();

  // Extract HOD Department ID
  const cleanDeptId = typeof user?.departmentId === 'object'
    ? user?.departmentId?._id
    : (user?.departmentId || user?.department?._id || user?.department);

  // Fetch users for participant multi-select
  const { data: usersData, isLoading: isLoadingUsers } = useUsersQuery(
    cleanDeptId ? { limit: 500, departmentId: cleanDeptId } : { limit: 500 }
  );

  const availableUsers = useMemo(() => {
    const raw = Array.isArray(usersData) ? usersData : (usersData?.data || []);
    const seen = new Set();
    const currentUserId = user?.id || user?._id;

    return raw.filter((u) => {
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
    if (statusFilter) list = list.filter((m) => m.status === statusFilter);
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(
        (m) =>
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
      scheduled: all.filter((m) => m.status === 'SCHEDULED').length,
      completed: all.filter((m) => m.status === 'COMPLETED').length,
      cancelled: all.filter((m) => m.status === 'CANCELLED').length,
    };
  }, [meetings]);

  const handleChange = (e) => setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleQuickSelect = (role) => {
    const usersToAdd = availableUsers.filter((u) => u.role === role);
    const seen = new Set(formData.participants.map((p) => String(p._id || p.id || p)));
    const deduped = [...formData.participants];

    usersToAdd.forEach((u) => {
      const id = String(u._id || u.id || u);
      if (!seen.has(id)) {
        seen.add(id);
        deduped.push(u);
      }
    });
    setFormData((p) => ({ ...p, participants: deduped }));
  };

  const handleClearParticipants = () => {
    setFormData((p) => ({ ...p, participants: [] }));
  };

  const handleClose = () => {
    setOpenModal(false);
    setFormData({
      title: '',
      agenda: '',
      meetingDate: '',
      location: '',
      meetingLink: '',
      meetingType: 'IN_PERSON',
      participants: [],
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.agenda || !formData.meetingDate) {
      showToast('Please fill in all required meeting fields.', { severity: 'error' });
      return;
    }
    if (formData.meetingType === 'VIRTUAL' && !formData.meetingLink) {
      showToast('Meeting link is required for virtual meetings.', { severity: 'error' });
      return;
    }

    createMutation.mutate(
      {
        ...formData,
        location: formData.location || (formData.meetingType === 'VIRTUAL' ? 'Online Video Call' : 'Department Conference Room'),
        participants: formData.participants.map((p) => p._id || p.id || p),
      },
      {
        onSuccess: () => {
          handleClose();
          showToast('Department meeting scheduled successfully!');
          refetch();
        },
        onError: (err) => showToast(err.response?.data?.message || 'Failed to schedule meeting.', { severity: 'error' }),
      }
    );
  };

  const handleStatusChange = async (id, status) => {
    try {
      await updateStatusMutation.mutateAsync({ id, status });
      showToast(`Meeting marked as ${status.replace('_', ' ')}.`);
      if (selectedMeeting?._id === id) {
        setSelectedMeeting((prev) => (prev ? { ...prev, status } : null));
      }
      refetch();
    } catch {
      showToast('Failed to update meeting status.', { severity: 'error' });
    }
  };

  const handleOpenDetail = (row) => {
    setSelectedMeeting(row);
    setDetailModalOpen(true);
  };

  const handleAddActionItem = () => {
    if (!selectedMeeting || !actionItemData.description.trim()) return;
    addActionItemMutation.mutate(
      {
        id: selectedMeeting._id || selectedMeeting.id,
        description: actionItemData.description,
        assignedTo: actionItemData.assignedTo?._id || actionItemData.assignedTo?.id || null,
        dueDate: actionItemData.dueDate || null,
      },
      {
        onSuccess: () => {
          showToast('Action item added to meeting notes.');
          setActionItemData({ description: '', assignedTo: null, dueDate: '' });
          setActionItemModalOpen(false);
          refetch();
        },
        onError: (err) => showToast(err.response?.data?.message || 'Failed to add action item.', { severity: 'error' }),
      }
    );
  };

  const columns = [
    {
      id: 'title',
      label: 'Meeting Title & Agenda',
      render: (r) => (
        <Box onClick={() => handleOpenDetail(r)} sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
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
            {r.agenda}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'meetingType',
      label: 'Assembly Type',
      render: (r) => {
        const icons = {
          VIRTUAL: <VideoCallOutlined sx={{ fontSize: '0.85rem !important' }} />,
          IN_PERSON: <PlaceOutlined sx={{ fontSize: '0.85rem !important' }} />,
          HYBRID: <GroupsOutlined sx={{ fontSize: '0.85rem !important' }} />,
        };
        return (
          <Chip
            size="small"
            icon={icons[r.meetingType] || <PlaceOutlined sx={{ fontSize: '0.85rem !important' }} />}
            label={r.meetingType?.replace('_', ' ')}
            variant="outlined"
            color={r.meetingType === 'VIRTUAL' ? 'info' : r.meetingType === 'HYBRID' ? 'secondary' : 'default'}
            sx={{ fontWeight: 800, fontSize: '0.68rem' }}
          />
        );
      },
    },
    {
      id: 'meetingDate',
      label: 'Date & Time',
      render: (r) => {
        const d = new Date(r.meetingDate);
        const isPast = d < new Date() && r.status === 'SCHEDULED';
        return (
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 700, color: isPast ? theme.palette.signal.error : theme.palette.ink[900] }}>
              {d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </Typography>
          </Box>
        );
      },
    },
    {
      id: 'location',
      label: 'Venue / Meeting Room',
      render: (r) =>
        r.meetingLink ? (
          <Box>
            <Link href={r.meetingLink} target="_blank" rel="noopener" underline="hover" color="primary" variant="body2" sx={{ fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
              <LinkOutlined sx={{ fontSize: 14 }} /> Join Call 🔗
            </Link>
            {r.location && <Typography variant="caption" display="block" color="text.secondary">{r.location}</Typography>}
          </Box>
        ) : (
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{r.location || 'Conference Hall'}</Typography>
        ),
    },
    {
      id: 'participants',
      label: 'Invited Members',
      render: (r) => {
        const count = r.participants?.length || 0;
        return (
          <Tooltip title={count > 0 ? r.participants.map((p) => p.name || p).join(', ') : 'No participants'}>
            <Chip label={`${count} invited`} size="small" variant="outlined" icon={<GroupsOutlined sx={{ fontSize: '0.8rem !important' }} />} sx={{ fontWeight: 700 }} />
          </Tooltip>
        );
      },
    },
    {
      id: 'status',
      label: 'Status',
      render: (r) => (
        <Chip label={r.status?.replace('_', ' ')} size="small" color={STATUS_COLORS[r.status] || 'default'} sx={{ fontWeight: 800, fontSize: '0.65rem' }} />
      ),
    },
    {
      id: 'actions',
      label: 'Actions',
      render: (r) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="View Meeting Details & MOM">
            <IconButton size="small" color="primary" onClick={() => handleOpenDetail(r)}>
              <VisibilityOutlined sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          {r.status === 'SCHEDULED' && (
            <>
              <Tooltip title="Mark Completed">
                <IconButton size="small" color="success" onClick={() => handleStatusChange(r._id || r.id, 'COMPLETED')} disabled={updateStatusMutation.isPending}>
                  <CheckCircleOutlined sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Cancel Meeting">
                <IconButton size="small" color="error" onClick={() => handleStatusChange(r._id || r.id, 'CANCELLED')} disabled={updateStatusMutation.isPending}>
                  <CancelOutlined sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            </>
          )}
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
                icon={<EventOutlined sx={{ fontSize: '0.9rem !important', color: `${theme.palette.primary.main} !important` }} />}
                label="DEPARTMENT BOARD & ACADEMIC MEETINGS DESK"
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
              Department Board & Faculty Meetings
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
              Schedule committee assemblies, send virtual meeting room links, assign action items, and record official Minutes of Meeting (MOM).
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
              onClick={() => setOpenModal(true)}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 700,
                background: theme.palette.primary.gradient || theme.palette.primary.main,
                color: '#ffffff',
              }}
            >
              Schedule New Meeting
            </Button>
          </Box>
        </Box>
      </Card>

      {/* ── 2. KPI Summary Grid ────────────────────────────────────────────── */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em' }}>
              TOTAL ASSEMBLIES
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.ink[900], mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
              {isLoading ? <CircularProgress size={24} /> : stats.total}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Convened department meetings
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.warning.main }}>
              SCHEDULED MEETINGS
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.warning.main, mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
              {isLoading ? <CircularProgress size={24} /> : stats.scheduled}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Upcoming assemblies
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.signal.success }}>
              COMPLETED ASSEMBLIES
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.signal.success, mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
              {isLoading ? <CircularProgress size={24} /> : stats.completed}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Minutes recorded & filed
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.signal.error }}>
              CANCELLED / OVERDUE
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.signal.error, mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
              {isLoading ? <CircularProgress size={24} /> : stats.cancelled}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Calling adjustments
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* ── 3. Filters & Schedule Table ────────────────────────────────────── */}
      <Card sx={{ p: 3, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
        <Grid container spacing={2} sx={{ mb: 3 }} alignItems="center">
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search meeting title, agenda, or organizer..."
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
              label="Meeting Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              SelectProps={{ displayEmpty: true }}
              InputLabelProps={{ shrink: true }}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="SCHEDULED">Scheduled Only</MenuItem>
              <MenuItem value="COMPLETED">Completed</MenuItem>
              <MenuItem value="CANCELLED">Cancelled</MenuItem>
              <MenuItem value="POSTPONED">Postponed</MenuItem>
            </TextField>
          </Grid>
        </Grid>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={32} />
          </Box>
        ) : filteredMeetings.length === 0 ? (
          <EmptyState
            type="reports"
            title="No Department Meetings Found"
            description="No assemblies match the active search or status filter criteria."
            actionText="Schedule New Meeting"
            onAction={() => setOpenModal(true)}
          />
        ) : (
          <DataTable columns={columns} data={filteredMeetings} isLoading={isLoading} isError={isError} emptyMessage="No meetings found." />
        )}
      </Card>

      {/* ── 4. Schedule Meeting Dialog ────────────────────────────────────── */}
      <Dialog open={openModal} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Schedule Department Meeting</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Meeting Title" name="title" value={formData.title} onChange={handleChange} required fullWidth placeholder="e.g. Board of Studies (BOS) Curriculum Review" />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField select label="Assembly Type" name="meetingType" value={formData.meetingType} onChange={handleChange} required fullWidth>
                  {MEETING_TYPES.map((t) => (
                    <MenuItem key={t.value} value={t.value}>
                      {t.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  type="datetime-local"
                  label="Date & Time"
                  name="meetingDate"
                  value={formData.meetingDate}
                  onChange={handleChange}
                  required
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            {formData.meetingType === 'VIRTUAL' || formData.meetingType === 'HYBRID' ? (
              <TextField
                label="Virtual Meeting Link (Google Meet / Zoom)"
                name="meetingLink"
                value={formData.meetingLink}
                onChange={handleChange}
                required={formData.meetingType === 'VIRTUAL'}
                fullWidth
                placeholder="https://meet.google.com/xyz-abc-123"
              />
            ) : null}

            <TextField
              label="Venue / Room Location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              fullWidth
              placeholder="e.g. Department Conference Room (Room 302)"
            />

            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                  Invite Participants ({formData.participants.length})
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Button size="small" onClick={() => handleQuickSelect('FACULTY')} sx={{ fontSize: '0.68rem', py: 0 }}>
                    + All Faculty
                  </Button>
                  <Button size="small" onClick={() => handleQuickSelect('STUDENT')} sx={{ fontSize: '0.68rem', py: 0 }}>
                    + All Students
                  </Button>
                  <Button size="small" color="error" onClick={handleClearParticipants} sx={{ fontSize: '0.68rem', py: 0 }}>
                    Clear
                  </Button>
                </Box>
              </Box>

              <Autocomplete
                multiple
                options={availableUsers}
                loading={isLoadingUsers}
                getOptionLabel={(option) => `${option.name || 'User'} (${option.role || 'Member'})`}
                value={formData.participants}
                onChange={(_, newValue) => setFormData((prev) => ({ ...prev, participants: newValue }))}
                renderInput={(params) => <TextField {...params} placeholder="Search members to invite..." size="small" />}
              />
            </Box>

            <TextField
              label="Meeting Agenda & Description"
              name="agenda"
              value={formData.agenda}
              onChange={handleChange}
              required
              multiline
              rows={4}
              fullWidth
              placeholder="Detail main topics, BOS points, or committee discussion agenda..."
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleClose} variant="outlined" sx={{ borderRadius: '8px' }}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={createMutation.isPending} sx={{ borderRadius: '8px', fontWeight: 700 }}>
              {createMutation.isPending ? 'Scheduling...' : 'Schedule Assembly'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ── 5. Meeting Detail & Action Items Modal ──────────────────────────── */}
      <Dialog open={detailModalOpen} onClose={() => setDetailModalOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        {selectedMeeting && (
          <>
            <DialogTitle sx={{ fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" fontWeight={800}>{selectedMeeting.title}</Typography>
              <Chip label={selectedMeeting.status} color={STATUS_COLORS[selectedMeeting.status] || 'default'} size="small" sx={{ fontWeight: 800 }} />
            </DialogTitle>
            <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Date & Time</Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {new Date(selectedMeeting.meetingDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Assembly Type</Typography>
                  <Typography variant="body2" fontWeight={700}>{selectedMeeting.meetingType}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Location</Typography>
                  <Typography variant="body2" fontWeight={700}>{selectedMeeting.location || '—'}</Typography>
                </Box>
                {selectedMeeting.meetingLink && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Virtual Link</Typography>
                    <Link href={selectedMeeting.meetingLink} target="_blank" rel="noopener" display="block" variant="body2" fontWeight={700}>
                      Join Call 🔗
                    </Link>
                  </Box>
                )}
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5 }}>
                  Agenda
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                  {selectedMeeting.agenda}
                </Typography>
              </Box>

              {/* Action Items List */}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AssignmentOutlined sx={{ fontSize: 18 }} /> Action Items & Tasks ({(selectedMeeting.actionItems || []).length})
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<PostAddOutlined />}
                    onClick={() => setActionItemModalOpen(true)}
                    sx={{ borderRadius: '6px', fontWeight: 700 }}
                  >
                    Add Action Item
                  </Button>
                </Box>

                {(selectedMeeting.actionItems || []).length === 0 ? (
                  <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                    No action items recorded for this meeting yet.
                  </Typography>
                ) : (
                  <List size="small" disablePadding sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: '8px' }}>
                    {selectedMeeting.actionItems.map((item, idx) => (
                      <ListItem key={idx} divider={idx < selectedMeeting.actionItems.length - 1}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <CheckCircleOutlined fontSize="small" color={item.status === 'COMPLETED' ? 'success' : 'action'} />
                        </ListItemIcon>
                        <ListItemText
                          primary={item.description}
                          secondary={`Assigned to: ${item.assignedTo?.name || 'Unassigned'} • Due: ${item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'N/A'}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={() => setDetailModalOpen(false)} variant="contained" sx={{ borderRadius: '8px', fontWeight: 700 }}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ── 6. Add Action Item Modal ────────────────────────────────────────── */}
      <Dialog open={actionItemModalOpen} onClose={() => setActionItemModalOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Add Action Item Task</DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            required
            fullWidth
            multiline
            rows={2}
            label="Task Description"
            value={actionItemData.description}
            onChange={(e) => setActionItemData({ ...actionItemData, description: e.target.value })}
            placeholder="e.g. Submit updated syllabus draft for BOS review."
          />

          <Autocomplete
            options={availableUsers}
            loading={isLoadingUsers}
            getOptionLabel={(option) => `${option.name || 'User'} (${option.role})`}
            value={actionItemData.assignedTo}
            onChange={(_, val) => setActionItemData({ ...actionItemData, assignedTo: val })}
            renderInput={(params) => <TextField {...params} label="Assign To Member" size="small" />}
          />

          <TextField
            type="date"
            label="Due Date"
            value={actionItemData.dueDate}
            onChange={(e) => setActionItemData({ ...actionItemData, dueDate: e.target.value })}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setActionItemModalOpen(false)} variant="outlined" sx={{ borderRadius: '8px' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAddActionItem}
            disabled={addActionItemMutation.isPending}
            sx={{ borderRadius: '8px', fontWeight: 700 }}
          >
            {addActionItemMutation.isPending ? 'Saving...' : 'Add Action Item'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HodMeetingsHub;
