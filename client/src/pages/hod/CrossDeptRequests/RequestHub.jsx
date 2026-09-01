import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Card,
  Grid,
  Paper,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  useTheme,
  CircularProgress,
  Avatar,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Key as KeyIcon,
  SwapHorizOutlined,
  CheckCircleOutlined,
  CancelOutlined,
  RefreshOutlined,
  SchoolOutlined,
  VerifiedOutlined,
  SearchOutlined,
  ContentCopyOutlined,
  ArrowForwardOutlined,
} from '@mui/icons-material';
import {
  useSentRequestsQuery,
  useReceivedRequestsQuery,
  useRespondRequestMutation,
  useFinalizeRequestMutation,
} from '../../../queries/requestQueries';
import NewRequestModal from './NewRequestModal';
import { useToast } from '../../../contexts/ToastContext';

export const RequestHub = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { showToast } = useToast();
  const [tabIndex, setTabIndex] = useState(0);
  const [isNewRequestModalOpen, setIsNewRequestModalOpen] = useState(false);

  const { data: sentRequestsRaw, isLoading: loadingSent, refetch: refetchSent } = useSentRequestsQuery();
  const { data: receivedRequestsRaw, isLoading: loadingReceived, refetch: refetchReceived } = useReceivedRequestsQuery();

  const sentRequests = useMemo(() => (Array.isArray(sentRequestsRaw) ? sentRequestsRaw : []), [sentRequestsRaw]);
  const receivedRequests = useMemo(() => (Array.isArray(receivedRequestsRaw) ? receivedRequestsRaw : []), [receivedRequestsRaw]);

  const pendingSent = sentRequests.filter((r) => r.status === 'PENDING').length;
  const pinReadySent = sentRequests.filter((r) => r.status === 'PIN_GENERATED').length;
  const approvedSent = sentRequests.filter((r) => r.status === 'APPROVED').length;

  const handleRefresh = () => {
    refetchSent();
    refetchReceived();
  };

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
                icon={<SwapHorizOutlined sx={{ fontSize: '0.85rem !important', color: `${theme.palette.primary.main} !important` }} />}
                label="CROSS-DEPARTMENT FACULTY SHARING & TEACHING WORKLOAD DESK"
                size="small"
                sx={{
                  bgcolor: `${theme.palette.primary.main}18`,
                  color: theme.palette.primary.main,
                  fontWeight: 800,
                  fontSize: '0.68rem',
                  letterSpacing: '0.04em',
                }}
              />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.ink[900], letterSpacing: '-0.02em' }}>
              Cross-Department Requests
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5, maxWidth: 680 }}>
              Borrow guest professors from other departments, issue secure 6-digit approval PINs, and finalize inter-departmental teaching assignments.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<RefreshOutlined />}
              onClick={handleRefresh}
              sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setIsNewRequestModalOpen(true)}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 700,
                px: 2.5,
                background: theme.palette.primary.gradient || theme.palette.primary.main,
                color: '#ffffff',
                boxShadow: `0 4px 14px ${theme.palette.primary.main}35`,
              }}
            >
              New Inter-Dept Request
            </Button>
          </Box>
        </Box>
      </Card>

      {/* ── 2. KPI Summary Grid ────────────────────────────────────────────── */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              p: 2.5,
              borderRadius: '18px',
              border: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
              borderTop: `4px solid ${theme.palette.primary.main}`,
              bgcolor: theme.custom?.surface?.raised || theme.palette.background.paper,
              boxShadow: theme.custom?.elevation?.raised || 'none',
              transition: 'all 0.25s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: isDark ? '0 12px 28px rgba(0,0,0,0.3)' : '0 12px 28px rgba(0,0,0,0.06)',
                borderColor: theme.palette.primary.main,
              },
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em' }}>
              TOTAL SENT REQUESTS
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.ink[900], mt: 0.5, fontFamily: theme.typography.mono?.fontFamily || 'monospace' }}>
              {loadingSent ? <CircularProgress size={22} /> : sentRequests.length}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.2 }}>
              Faculty requested from other depts
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              p: 2.5,
              borderRadius: '18px',
              border: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
              borderTop: `4px solid ${theme.palette.warning.main}`,
              bgcolor: theme.custom?.surface?.raised || theme.palette.background.paper,
              boxShadow: theme.custom?.elevation?.raised || 'none',
              transition: 'all 0.25s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: isDark ? '0 12px 28px rgba(0,0,0,0.3)' : '0 12px 28px rgba(0,0,0,0.06)',
                borderColor: theme.palette.warning.main,
              },
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em' }}>
              PENDING TARGET APPROVAL
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.warning.main, mt: 0.5, fontFamily: theme.typography.mono?.fontFamily || 'monospace' }}>
              {loadingSent ? <CircularProgress size={22} /> : pendingSent}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.2 }}>
              Awaiting target HOD action
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              p: 2.5,
              borderRadius: '18px',
              border: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
              borderTop: `4px solid ${theme.palette.info.main}`,
              bgcolor: theme.custom?.surface?.raised || theme.palette.background.paper,
              boxShadow: theme.custom?.elevation?.raised || 'none',
              transition: 'all 0.25s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: isDark ? '0 12px 28px rgba(0,0,0,0.3)' : '0 12px 28px rgba(0,0,0,0.06)',
                borderColor: theme.palette.info.main,
              },
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em' }}>
              PIN READY FOR FINALIZATION
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.info.main, mt: 0.5, fontFamily: theme.typography.mono?.fontFamily || 'monospace' }}>
              {loadingSent ? <CircularProgress size={22} /> : pinReadySent}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.2 }}>
              PIN entry required to activate
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              p: 2.5,
              borderRadius: '18px',
              border: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
              borderTop: `4px solid ${theme.palette.success.main}`,
              bgcolor: theme.custom?.surface?.raised || theme.palette.background.paper,
              boxShadow: theme.custom?.elevation?.raised || 'none',
              transition: 'all 0.25s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: isDark ? '0 12px 28px rgba(0,0,0,0.3)' : '0 12px 28px rgba(0,0,0,0.06)',
                borderColor: theme.palette.success.main,
              },
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em' }}>
              FINALIZED ALLOCATIONS
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.success.main, mt: 0.5, fontFamily: theme.typography.mono?.fontFamily || 'monospace' }}>
              {loadingSent ? <CircularProgress size={22} /> : approvedSent}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.2 }}>
              Active cross-teaching assignments
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* ── 3. Tabs Header & Tab Views ──────────────────────────────────────── */}
      <Card sx={{ p: { xs: 2, md: 3 }, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabIndex} onChange={(_, newVal) => setTabIndex(newVal)}>
            <Tab label={`Sent Requests (${sentRequests.length})`} sx={{ fontWeight: 800, textTransform: 'none', fontSize: '0.95rem' }} />
            <Tab label={`Received Requests (${receivedRequests.length})`} sx={{ fontWeight: 800, textTransform: 'none', fontSize: '0.95rem' }} />
          </Tabs>
        </Box>

        {tabIndex === 0 && <SentRequestsTab requests={sentRequests} isLoading={loadingSent} onRefresh={refetchSent} showToast={showToast} />}
        {tabIndex === 1 && <ReceivedRequestsTab requests={receivedRequests} isLoading={loadingReceived} onRefresh={refetchReceived} showToast={showToast} />}
      </Card>

      {isNewRequestModalOpen && (
        <NewRequestModal open={isNewRequestModalOpen} onClose={() => setIsNewRequestModalOpen(false)} />
      )}
    </Box>
  );
};

const StatusChip = ({ status }) => {
  const configs = {
    PENDING: { label: 'PENDING APPROVAL', color: 'warning' },
    PIN_GENERATED: { label: 'APPROVED - PIN READY', color: 'info' },
    APPROVED: { label: 'FINALIZED & ACTIVE', color: 'success' },
    REJECTED: { label: 'DECLINED / REJECTED', color: 'error' },
    CANCELLED: { label: 'CANCELLED', color: 'default' },
  };
  const cfg = configs[status] || { label: status || 'PENDING', color: 'default' };
  return <Chip size="small" label={cfg.label} color={cfg.color} sx={{ fontWeight: 800, fontSize: '0.65rem', height: 22 }} />;
};

const SentRequestsTab = ({ requests, isLoading, onRefresh, showToast }) => {
  const theme = useTheme();
  const [search, setSearch] = useState('');
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [pin, setPin] = useState('');
  const finalizeMutation = useFinalizeRequestMutation();

  const filteredRequests = useMemo(() => {
    if (!search.trim()) return requests;
    const lower = search.toLowerCase();
    return requests.filter((r) => {
      const facName = r.facultyId?.name || '';
      const targetDept = r.targetDeptId?.name || '';
      const subjName = r.subjectId?.name || '';
      const subjCode = r.subjectId?.code || '';
      return (
        facName.toLowerCase().includes(lower) ||
        targetDept.toLowerCase().includes(lower) ||
        subjName.toLowerCase().includes(lower) ||
        subjCode.toLowerCase().includes(lower)
      );
    });
  }, [requests, search]);

  const handleFinalize = async () => {
    if (pin.length !== 6) return;
    try {
      await finalizeMutation.mutateAsync({ id: selectedRequestId, pin });
      showToast('Faculty assignment finalized successfully!');
      setPinModalOpen(false);
      setPin('');
      onRefresh();
    } catch (err) {
      showToast(err.response?.data?.message || 'Invalid PIN entered.', { severity: 'error' });
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <TextField
        size="small"
        placeholder="Filter sent requests by faculty, target department, or subject..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        InputProps={{
          startAdornment: <SearchOutlined fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
        }}
        sx={{ maxWidth: 450 }}
      />

      {filteredRequests.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: '14px', border: `1px solid ${theme.palette.divider}` }}>
          <SwapHorizOutlined sx={{ fontSize: 44, color: 'text.secondary', opacity: 0.4, mb: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
            No Sent Requests Found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {search ? 'No requests match your search criteria.' : 'You have not submitted any inter-departmental faculty teaching requests yet.'}
          </Typography>
        </Paper>
      ) : (
        filteredRequests.map((req) => {
          const borderColor =
            req.status === 'APPROVED'
              ? theme.palette.success.main
              : req.status === 'PIN_GENERATED'
              ? theme.palette.info.main
              : req.status === 'REJECTED'
              ? theme.palette.error.main
              : theme.palette.warning.main;

          return (
            <Paper
              key={req._id}
              sx={{
                p: 3,
                borderRadius: '14px',
                border: `1px solid ${theme.palette.divider}`,
                borderLeft: `5px solid ${borderColor}`,
                boxShadow: 'none',
                transition: 'all 0.2s ease',
                '&:hover': { borderColor, boxShadow: `0 4px 14px ${borderColor}20` },
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ flex: 1, minWidth: 280 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                    <Avatar
                      sx={{
                        width: 36,
                        height: 36,
                        bgcolor: `${theme.palette.primary.main}18`,
                        color: theme.palette.primary.main,
                        fontWeight: 700,
                      }}
                    >
                      {req.facultyId?.name?.charAt(0) || 'F'}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: theme.palette.ink[900], lineHeight: 1.2 }}>
                        {req.facultyId?.name || 'Requested Faculty Member'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {req.facultyId?.email || 'Faculty Email'}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Flow Badge */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
                    <Chip label="Your Department" size="small" variant="outlined" sx={{ fontWeight: 700, fontSize: '0.7rem' }} />
                    <ArrowForwardOutlined sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Chip label={`Target: ${req.targetDeptId?.name || 'Target Dept'}`} size="small" color="primary" sx={{ fontWeight: 800, fontSize: '0.7rem' }} />
                  </Box>

                  <Typography variant="body2" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <SchoolOutlined sx={{ fontSize: 18, color: theme.palette.primary.main }} />
                    <span>Subject: <strong>{req.subjectId?.name || 'Curriculum Subject'}</strong></span>
                    {req.subjectId?.code && <Chip label={req.subjectId.code} size="small" sx={{ fontWeight: 800, fontSize: '0.65rem', height: 20 }} />}
                  </Typography>

                  {req.reason && (
                    <Typography
                      variant="body2"
                      sx={{
                        fontStyle: 'italic',
                        bgcolor: `${theme.palette.primary.main}06`,
                        p: 1.5,
                        borderRadius: '8px',
                        border: `1px solid ${theme.palette.divider}`,
                        color: 'text.secondary',
                      }}
                    >
                      &quot;{req.reason}&quot;
                    </Typography>
                  )}
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1.5 }}>
                  <StatusChip status={req.status} />

                  {req.status === 'PIN_GENERATED' && (
                    <Button
                      size="small"
                      variant="contained"
                      color="info"
                      startIcon={<KeyIcon />}
                      onClick={() => {
                        setSelectedRequestId(req._id);
                        setPinModalOpen(true);
                      }}
                      sx={{ borderRadius: '8px', fontWeight: 800, textTransform: 'none', px: 2 }}
                    >
                      Enter Approval PIN
                    </Button>
                  )}
                </Box>
              </Box>

              {req.responseNotes && (
                <Alert severity={req.status === 'REJECTED' ? 'error' : 'info'} sx={{ mt: 2, borderRadius: '10px' }}>
                  <strong>HOD Response Note:</strong> {req.responseNotes}
                </Alert>
              )}
            </Paper>
          );
        })
      )}

      {/* ── PIN Entry Modal ───────────────────────────────────────────── */}
      <Dialog open={pinModalOpen} onClose={() => setPinModalOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
          <KeyIcon color="info" /> Enter Secret Approval PIN
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            The target Department Head has approved your request. Enter the 6-digit approval PIN provided by them to activate cross-teaching.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            label="6-Digit Approval PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            inputProps={{ maxLength: 6, style: { letterSpacing: '8px', fontSize: '1.4rem', fontWeight: 800, textAlign: 'center' } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPinModalOpen(false)} variant="outlined" sx={{ borderRadius: '8px', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="info"
            onClick={handleFinalize}
            disabled={pin.length !== 6 || finalizeMutation.isPending}
            sx={{ borderRadius: '8px', fontWeight: 700 }}
          >
            {finalizeMutation.isPending ? 'Finalizing...' : 'Finalize Assignment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const ReceivedRequestsTab = ({ requests, isLoading, onRefresh, showToast }) => {
  const theme = useTheme();
  const [search, setSearch] = useState('');
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [selectedReq, setSelectedReq] = useState(null);
  const [actionType, setActionType] = useState('');
  const [notes, setNotes] = useState('');
  const respondMutation = useRespondRequestMutation();
  const [generatedPin, setGeneratedPin] = useState(null);

  const filteredRequests = useMemo(() => {
    if (!search.trim()) return requests;
    const lower = search.toLowerCase();
    return requests.filter((r) => {
      const facName = r.facultyId?.name || '';
      const reqDept = r.requesterDeptId?.name || '';
      const subjName = r.subjectId?.name || '';
      return (
        facName.toLowerCase().includes(lower) ||
        reqDept.toLowerCase().includes(lower) ||
        subjName.toLowerCase().includes(lower)
      );
    });
  }, [requests, search]);

  const handleActionClick = (req, type) => {
    setSelectedReq(req);
    setActionType(type);
    setNotes('');
    setGeneratedPin(null);
    setActionModalOpen(true);
  };

  const handleSubmitAction = async () => {
    try {
      const result = await respondMutation.mutateAsync({
        id: selectedReq._id,
        action: actionType,
        responseNotes: notes,
      });
      if (result.data?.pin) {
        setGeneratedPin(result.data.pin);
        showToast('Request approved! Secret 6-Digit PIN generated.');
      } else {
        showToast('Request action recorded.');
        setActionModalOpen(false);
      }
      onRefresh();
    } catch (err) {
      showToast(err.response?.data?.message || 'Action failed', { severity: 'error' });
    }
  };

  const copyPinToClipboard = (pinStr) => {
    navigator.clipboard.writeText(pinStr);
    showToast('Approval PIN copied to clipboard!');
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <TextField
        size="small"
        placeholder="Filter received requests by requesting department or faculty..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        InputProps={{
          startAdornment: <SearchOutlined fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
        }}
        sx={{ maxWidth: 450 }}
      />

      {filteredRequests.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: '14px', border: `1px solid ${theme.palette.divider}` }}>
          <SwapHorizOutlined sx={{ fontSize: 44, color: 'text.secondary', opacity: 0.4, mb: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
            No Received Requests Found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {search ? 'No requests match your search.' : 'No other department has requested your faculty members yet.'}
          </Typography>
        </Paper>
      ) : (
        filteredRequests.map((req) => {
          const borderColor =
            req.status === 'APPROVED'
              ? theme.palette.success.main
              : req.status === 'PIN_GENERATED'
              ? theme.palette.info.main
              : req.status === 'REJECTED'
              ? theme.palette.error.main
              : theme.palette.warning.main;

          return (
            <Paper
              key={req._id}
              sx={{
                p: 3,
                borderRadius: '14px',
                border: `1px solid ${theme.palette.divider}`,
                borderLeft: `5px solid ${borderColor}`,
                boxShadow: 'none',
                transition: 'all 0.2s ease',
                '&:hover': { borderColor, boxShadow: `0 4px 14px ${borderColor}20` },
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ flex: 1, minWidth: 280 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                    <Avatar
                      sx={{
                        width: 36,
                        height: 36,
                        bgcolor: `${theme.palette.primary.main}18`,
                        color: theme.palette.primary.main,
                        fontWeight: 700,
                      }}
                    >
                      {req.facultyId?.name?.charAt(0) || 'F'}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: theme.palette.ink[900], lineHeight: 1.2 }}>
                        {req.requesterDeptId?.name || 'Department'} Requests {req.facultyId?.name || 'Your Faculty Member'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Faculty Email: {req.facultyId?.email || 'N/A'}
                      </Typography>
                    </Box>
                  </Box>

                  <Typography variant="body2" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <SchoolOutlined sx={{ fontSize: 18, color: theme.palette.primary.main }} />
                    <span>Target Teaching Subject: <strong>{req.subjectId?.name || 'Curriculum Subject'}</strong></span>
                    {req.subjectId?.code && <Chip label={req.subjectId.code} size="small" sx={{ fontWeight: 800, fontSize: '0.65rem', height: 20 }} />}
                  </Typography>

                  {req.reason && (
                    <Typography
                      variant="body2"
                      sx={{
                        fontStyle: 'italic',
                        bgcolor: `${theme.palette.primary.main}06`,
                        p: 1.5,
                        borderRadius: '8px',
                        border: `1px solid ${theme.palette.divider}`,
                        color: 'text.secondary',
                      }}
                    >
                      &quot;{req.reason}&quot;
                    </Typography>
                  )}

                  {/* Display generated PIN if ready */}
                  {req.pin && (
                    <Paper sx={{ p: 1.5, mt: 1.5, bgcolor: `${theme.palette.info.main}10`, border: `1px solid ${theme.palette.info.main}40`, display: 'inline-flex', alignItems: 'center', gap: 1.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.info.main }}>
                        Generated PIN:
                      </Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, letterSpacing: 3, fontFamily: 'monospace' }}>
                        {req.pin}
                      </Typography>
                      <Tooltip title="Copy PIN">
                        <IconButton size="small" onClick={() => copyPinToClipboard(req.pin)}>
                          <ContentCopyOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Paper>
                  )}
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1.5 }}>
                  <StatusChip status={req.status} />

                  {req.status === 'PENDING' && (
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<CancelOutlined />}
                        onClick={() => handleActionClick(req, 'REJECT')}
                        sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
                      >
                        Decline
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        startIcon={<CheckCircleOutlined />}
                        onClick={() => handleActionClick(req, 'APPROVE')}
                        sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 800, px: 2 }}
                      >
                        Approve & Issue PIN
                      </Button>
                    </Box>
                  )}
                </Box>
              </Box>
            </Paper>
          );
        })
      )}

      {/* ── Action Response Modal ───────────────────────────────────────── */}
      <Dialog open={actionModalOpen} onClose={() => !generatedPin && setActionModalOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {actionType === 'APPROVE' ? 'Approve Cross-Teaching Request' : 'Decline Faculty Request'}
        </DialogTitle>
        <DialogContent dividers>
          {generatedPin ? (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <VerifiedOutlined sx={{ fontSize: 48, color: theme.palette.success.main, mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 800, color: theme.palette.success.main, mb: 0.5 }}>
                Request Approved!
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Share this secure 6-digit PIN with the requesting Department Head:
              </Typography>

              <Card sx={{ p: 2, bgcolor: `${theme.palette.primary.main}10`, border: `1px solid ${theme.palette.primary.main}`, mb: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: 6, color: theme.palette.primary.main, fontFamily: 'monospace' }}>
                  {generatedPin}
                </Typography>
                <Tooltip title="Copy PIN">
                  <IconButton onClick={() => copyPinToClipboard(generatedPin)}>
                    <ContentCopyOutlined />
                  </IconButton>
                </Tooltip>
              </Card>

              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                The requesting HOD will enter this PIN in their Sent Requests desk to complete the transfer.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {actionType === 'APPROVE'
                  ? `Approve ${selectedReq?.facultyId?.name} teaching for ${selectedReq?.requesterDeptId?.name}? A 6-digit PIN will be generated for the requesting HOD.`
                  : `Decline request from ${selectedReq?.requesterDeptId?.name}?`}
              </Typography>

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Optional Response Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          {generatedPin ? (
            <Button variant="contained" onClick={() => setActionModalOpen(false)} sx={{ borderRadius: '8px', fontWeight: 700 }}>
              Done
            </Button>
          ) : (
            <>
              <Button onClick={() => setActionModalOpen(false)} variant="outlined" sx={{ borderRadius: '8px', fontWeight: 600 }}>
                Cancel
              </Button>
              <Button
                variant="contained"
                color={actionType === 'APPROVE' ? 'success' : 'error'}
                onClick={handleSubmitAction}
                disabled={respondMutation.isPending}
                sx={{ borderRadius: '8px', fontWeight: 700 }}
              >
                {respondMutation.isPending ? 'Processing...' : `Confirm ${actionType}`}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RequestHub;
