import React, { useState } from 'react';
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
  const { showToast } = useToast();
  const [tabIndex, setTabIndex] = useState(0);
  const [isNewRequestModalOpen, setIsNewRequestModalOpen] = useState(false);

  const { data: sentRequestsRaw, isLoading: loadingSent, refetch: refetchSent } = useSentRequestsQuery();
  const { data: receivedRequestsRaw, isLoading: loadingReceived, refetch: refetchReceived } = useReceivedRequestsQuery();

  const sentRequests = Array.isArray(sentRequestsRaw) ? sentRequestsRaw : [];
  const receivedRequests = Array.isArray(receivedRequestsRaw) ? receivedRequestsRaw : [];

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
                icon={<SwapHorizOutlined sx={{ fontSize: '0.9rem !important', color: `${theme.palette.primary.main} !important` }} />}
                label="INTER-DEPARTMENTAL FACULTY SHARING & CROSS-TEACHING DESK"
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
              Cross-Department Teaching Requests
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
              Borrow guest professors from other departments, issue 6-digit approval PINs, and finalize inter-departmental teaching assignments.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5 }}>
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
                background: theme.palette.primary.gradient || theme.palette.primary.main,
                color: '#ffffff',
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
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em' }}>
              TOTAL SENT REQUESTS
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.ink[900], mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
              {loadingSent ? <CircularProgress size={24} /> : sentRequests.length}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Faculty borrowed from other depts
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.warning.main }}>
              PENDING APPROVALS
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.warning.main, mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
              {loadingSent ? <CircularProgress size={24} /> : pendingSent}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Awaiting target HOD response
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.info?.main || '#0288d1' }}>
              ACTION REQUIRED (ENTER PIN)
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.info?.main || '#0288d1', mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
              {loadingSent ? <CircularProgress size={24} /> : pinReadySent}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Approved — PIN entry required
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.signal.success }}>
              FINALIZED ASSIGNMENTS
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.signal.success, mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
              {loadingSent ? <CircularProgress size={24} /> : approvedSent}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Active inter-dept faculty
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* ── 3. Tabs Header & Tab Views ──────────────────────────────────────── */}
      <Card sx={{ p: 3, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabIndex} onChange={(_, newVal) => setTabIndex(newVal)}>
            <Tab label={`Sent Requests (${sentRequests.length})`} sx={{ fontWeight: 700, textTransform: 'none' }} />
            <Tab label={`Received Requests (${receivedRequests.length})`} sx={{ fontWeight: 700, textTransform: 'none' }} />
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
  const colors = {
    PENDING: 'warning',
    PIN_GENERATED: 'info',
    APPROVED: 'success',
    REJECTED: 'error',
    CANCELLED: 'default',
  };
  return <Chip size="small" label={status ? status.replace('_', ' ') : 'PENDING'} color={colors[status] || 'default'} sx={{ fontWeight: 800, fontSize: '0.68rem' }} />;
};

const SentRequestsTab = ({ requests, isLoading, onRefresh, showToast }) => {
  const theme = useTheme();
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [pin, setPin] = useState('');
  const finalizeMutation = useFinalizeRequestMutation();

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

  if (requests.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ py: 6, textAlign: 'center' }}>
        No sent inter-departmental requests found.
      </Typography>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {requests.map((req) => (
        <Paper
          key={req._id}
          sx={{
            p: 3,
            borderRadius: '12px',
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: 'none',
            '&:hover': { borderColor: theme.palette.primary.main },
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: `${theme.palette.primary.main}15`, color: theme.palette.primary.main, fontSize: '0.85rem', fontWeight: 700 }}>
                  {req.facultyId?.name?.charAt(0) || 'F'}
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 800, color: theme.palette.ink[900] }}>
                  Requesting Professor: {req.facultyId?.name || 'Faculty Member'}
                </Typography>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <SchoolOutlined sx={{ fontSize: 16 }} />
                <span>From Department: <strong>{req.targetDeptId?.name || 'Target Department'}</strong></span>
                <span>•</span>
                <span>Subject: <strong>{req.subjectId?.name} ({req.subjectId?.code})</strong></span>
              </Typography>

              <Typography variant="body2" sx={{ fontStyle: 'italic', bgcolor: theme.custom?.surface?.sunken || 'rgba(0,0,0,0.02)', p: 1.5, borderRadius: '8px', border: `1px solid ${theme.palette.divider}` }}>
                {`"${req.reason}"`}
              </Typography>
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
                  sx={{ borderRadius: '8px', fontWeight: 700, textTransform: 'none' }}
                >
                  Enter Secret PIN
                </Button>
              )}
            </Box>
          </Box>

          {req.responseNotes && (
            <Alert severity={req.status === 'REJECTED' ? 'error' : 'info'} sx={{ mt: 2, borderRadius: '8px' }}>
              <strong>HOD Response Notes:</strong> {req.responseNotes}
            </Alert>
          )}
        </Paper>
      ))}

      {/* ── PIN Entry Modal ───────────────────────────────────────────── */}
      <Dialog open={pinModalOpen} onClose={() => setPinModalOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Enter Approval PIN</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            The target HOD has approved your request. Enter the 6-digit Secret PIN provided by them to finalize this assignment.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            label="6-Digit Approval PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            inputProps={{ maxLength: 6, style: { letterSpacing: '6px', fontSize: '1.2rem', fontWeight: 800 } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPinModalOpen(false)} variant="outlined" sx={{ borderRadius: '8px' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
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
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [selectedReq, setSelectedReq] = useState(null);
  const [actionType, setActionType] = useState('');
  const [notes, setNotes] = useState('');
  const respondMutation = useRespondRequestMutation();
  const [generatedPin, setGeneratedPin] = useState(null);

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

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (requests.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ py: 6, textAlign: 'center' }}>
        No received inter-departmental requests found.
      </Typography>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {requests.map((req) => (
        <Paper
          key={req._id}
          sx={{
            p: 3,
            borderRadius: '12px',
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: 'none',
            '&:hover': { borderColor: theme.palette.primary.main },
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: theme.palette.ink[900], mb: 0.5 }}>
                {req.requesterDeptId?.name || 'Department'} Requests {req.facultyId?.name || 'Faculty Member'}
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                For Subject: <strong>{req.subjectId?.name} ({req.subjectId?.code})</strong>
              </Typography>

              <Typography variant="body2" sx={{ fontStyle: 'italic', bgcolor: theme.custom?.surface?.sunken || 'rgba(0,0,0,0.02)', p: 1.5, borderRadius: '8px', border: `1px solid ${theme.palette.divider}` }}>
                {`"${req.reason}"`}
              </Typography>
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
                    Reject
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircleOutlined />}
                    onClick={() => handleActionClick(req, 'APPROVE')}
                    sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700 }}
                  >
                    Approve
                  </Button>
                </Box>
              )}
            </Box>
          </Box>
        </Paper>
      ))}

      {/* ── Action Response Modal ───────────────────────────────────────── */}
      <Dialog open={actionModalOpen} onClose={() => !generatedPin && setActionModalOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {actionType === 'APPROVE' ? 'Approve Faculty Request' : 'Reject Faculty Request'}
        </DialogTitle>
        <DialogContent dividers>
          {generatedPin ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <VerifiedOutlined sx={{ fontSize: 44, color: theme.palette.signal.success, mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 800, color: theme.palette.signal.success, mb: 1 }}>
                Request Approved!
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Share this secure 6-digit PIN with the requesting HOD:
              </Typography>

              <Card sx={{ p: 2, bgcolor: `${theme.palette.primary.main}10`, border: `1px solid ${theme.palette.primary.main}`, mb: 2 }}>
                <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: 8, color: theme.palette.primary.main, fontFamily: theme.typography.mono.fontFamily }}>
                  {generatedPin}
                </Typography>
              </Card>

              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                They will enter this PIN in their Sent Requests tab to complete the transfer.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {actionType === 'APPROVE'
                  ? `Approve ${selectedReq?.facultyId?.name} teaching for ${selectedReq?.requesterDeptId?.name}? A secure PIN will be generated for the requesting HOD.`
                  : `Are you sure you want to reject this request from ${selectedReq?.requesterDeptId?.name}?`}
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
              <Button onClick={() => setActionModalOpen(false)} variant="outlined" sx={{ borderRadius: '8px' }}>
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
