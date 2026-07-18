import React, { useState } from 'react';
import { Box, Typography, Tabs, Tab, Paper, Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, useTheme } from '@mui/material';
import { Add as AddIcon, Key as KeyIcon } from '@mui/icons-material';
import { useSentRequestsQuery, useReceivedRequestsQuery, useRespondRequestMutation, useFinalizeRequestMutation } from '../../../queries/requestQueries';
import NewRequestModal from './NewRequestModal';
import { useAuth } from '../../../contexts/AuthContext';

const RequestHub = () => {
  const theme = useTheme();
  const [tabIndex, setTabIndex] = useState(0);
  const [isNewRequestModalOpen, setIsNewRequestModalOpen] = useState(false);
  const { user } = useAuth();

  const { data: sentRequests = [] } = useSentRequestsQuery();
  const { data: receivedRequests = [] } = useReceivedRequestsQuery();

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 1, sm: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: theme.palette.text.primary }}>
            Cross-Department Faculty Requests
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Securely borrow faculty members from other departments to teach your subjects.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsNewRequestModalOpen(true)}
          sx={{ borderRadius: 2, textTransform: 'none', px: 3 }}
        >
          New Request
        </Button>
      </Box>

      <Paper sx={{ mb: 4, borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabIndex} onChange={(_, newVal) => setTabIndex(newVal)}>
          <Tab label={`Sent Requests (${sentRequests.length})`} />
          <Tab label={`Received Requests (${receivedRequests.length})`} />
        </Tabs>
      </Paper>

      {tabIndex === 0 && <SentRequestsTab requests={sentRequests} />}
      {tabIndex === 1 && <ReceivedRequestsTab requests={receivedRequests} />}

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
  return <Chip size="small" label={status.replace('_', ' ')} color={colors[status]} sx={{ fontWeight: 600 }} />;
};

const SentRequestsTab = ({ requests }) => {
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [pin, setPin] = useState('');
  const finalizeMutation = useFinalizeRequestMutation();

  const handleFinalize = async () => {
    if (pin.length !== 6) return;
    try {
      await finalizeMutation.mutateAsync({ id: selectedRequestId, pin });
      setPinModalOpen(false);
      setPin('');
    } catch (err) {
      alert(err.response?.data?.message || 'Invalid PIN');
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {requests.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>No sent requests.</Typography>
      ) : (
        requests.map(req => (
          <Paper key={req._id} sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Requesting: {req.facultyId?.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  From: {req.targetDeptId?.name} • For Subject: {req.subjectId?.name} ({req.subjectId?.code})
                </Typography>
                <Typography variant="body2" sx={{ fontStyle: 'italic', bgcolor: 'grey.50', p: 1, borderRadius: 1 }}>
                  "{req.reason}"
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                <StatusChip status={req.status} />
                {req.status === 'PIN_GENERATED' && (
                  <Button 
                    size="small" 
                    variant="outlined" 
                    color="primary"
                    startIcon={<KeyIcon />}
                    onClick={() => { setSelectedRequestId(req._id); setPinModalOpen(true); }}
                  >
                    Enter PIN
                  </Button>
                )}
              </Box>
            </Box>
            {req.responseNotes && (
              <Alert severity={req.status === 'REJECTED' ? 'error' : 'info'} sx={{ mt: 2, borderRadius: 2 }}>
                <strong>Response from HOD:</strong> {req.responseNotes}
              </Alert>
            )}
          </Paper>
        ))
      )}

      {/* PIN Entry Modal */}
      <Dialog open={pinModalOpen} onClose={() => setPinModalOpen(false)}>
        <DialogTitle>Enter Approval PIN</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            The target HOD has approved your request. Please ask them for the 6-digit Secret PIN to finalize this assignment.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            label="6-Digit PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            inputProps={{ maxLength: 6 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPinModalOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleFinalize} 
            disabled={pin.length !== 6 || finalizeMutation.isPending}
          >
            Finalize Assignment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const ReceivedRequestsTab = ({ requests }) => {
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [selectedReq, setSelectedReq] = useState(null);
  const [actionType, setActionType] = useState(''); // 'APPROVE' or 'REJECT'
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
        responseNotes: notes 
      });
      if (result.data?.pin) {
        setGeneratedPin(result.data.pin);
      } else {
        setActionModalOpen(false);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {requests.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>No received requests.</Typography>
      ) : (
        requests.map(req => (
          <Paper key={req._id} sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {req.requesterDeptId?.name} requests {req.facultyId?.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  For Subject: {req.subjectId?.name} ({req.subjectId?.code})
                </Typography>
                <Typography variant="body2" sx={{ fontStyle: 'italic', bgcolor: 'grey.50', p: 1, borderRadius: 1 }}>
                  "{req.reason}"
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                <StatusChip status={req.status} />
                {req.status === 'PENDING' && (
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Button size="small" variant="outlined" color="error" onClick={() => handleActionClick(req, 'REJECT')}>Reject</Button>
                    <Button size="small" variant="contained" color="success" onClick={() => handleActionClick(req, 'APPROVE')}>Approve</Button>
                  </Box>
                )}
              </Box>
            </Box>
          </Paper>
        ))
      )}

      {/* Action Modal */}
      <Dialog open={actionModalOpen} onClose={() => !generatedPin && setActionModalOpen(false)}>
        <DialogTitle>{actionType === 'APPROVE' ? 'Approve Request' : 'Reject Request'}</DialogTitle>
        <DialogContent dividers>
          {generatedPin ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="h6" color="success.main" sx={{ mb: 2 }}>Request Approved!</Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>Share this secure PIN with the requesting HOD:</Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: 8 }}>{generatedPin}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                They must enter this PIN in their Sent Requests tab to finalize the assignment.
              </Typography>
            </Box>
          ) : (
            <>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {actionType === 'APPROVE' 
                  ? `Are you sure you want to approve ${selectedReq?.facultyId?.name} teaching for another department? A secure PIN will be generated.` 
                  : `Are you sure you want to reject this request?`}
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Optional Notes/Reason"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          {generatedPin ? (
            <Button variant="contained" onClick={() => setActionModalOpen(false)}>Close</Button>
          ) : (
            <>
              <Button onClick={() => setActionModalOpen(false)}>Cancel</Button>
              <Button 
                variant="contained" 
                color={actionType === 'APPROVE' ? 'success' : 'error'}
                onClick={handleSubmitAction}
                disabled={respondMutation.isPending}
              >
                Confirm {actionType}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RequestHub;
