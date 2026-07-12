import React, { useState } from 'react';
import { Box, Typography, Card, CardContent, Grid, Chip, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { CheckCircleOutlined, CancelOutlined, DownloadOutlined } from '@mui/icons-material';
import { useAdmissionQueueQuery, useActionAdmissionMutation } from '../../../queries/admissionQueries';
import EmptyState from '../../../components/common/EmptyState';
import api from '../../../services/api';

const AdmissionQueue = () => {
  const { data: queue = [], isLoading } = useAdmissionQueueQuery();
  const [selectedApp, setSelectedApp] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [notes, setNotes] = useState('');
  const actionMutation = useActionAdmissionMutation();
  const [successData, setSuccessData] = useState(null);

  if (isLoading) return <Box p={3}><Typography>Loading queue...</Typography></Box>;

  if (queue.length === 0) {
    return (
      <Box p={3}>
        <EmptyState title="Queue Empty" description="There are no pending admission applications to review." />
      </Box>
    );
  }

  const handleAction = (app, type) => {
    setSelectedApp(app);
    setActionType(type);
    setNotes('');
  };

  const submitAction = async () => {
    try {
      const result = await actionMutation.mutateAsync({ id: selectedApp._id, action: actionType, notes });
      if (actionType === 'APPROVE') {
        // Save the applicationId in the successData so we can fetch the letter
        setSuccessData({ ...result, applicationId: selectedApp._id });
      } else {
        setSelectedApp(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to process action');
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 3 }}>Admission Queue</Typography>
      
      <Grid container spacing={3}>
        {queue.map((app) => (
          <Grid item xs={12} md={6} lg={4} key={app._id}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', position: 'relative' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>{app.name}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{app.email} • {app.contactNumber}</Typography>
                
                <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
                  <Chip size="small" label={app.departmentId?.name} color="primary" variant="outlined" />
                  <Chip size="small" label={app.courseId?.name} color="secondary" variant="outlined" />
                  <Chip size="small" label={app.branchId?.name} color="default" variant="outlined" />
                </Box>
                
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button 
                    variant="contained" 
                    color="success" 
                    fullWidth 
                    startIcon={<CheckCircleOutlined />}
                    onClick={() => handleAction(app, 'APPROVE')}
                  >
                    Approve
                  </Button>
                  <Button 
                    variant="outlined" 
                    color="error" 
                    fullWidth 
                    startIcon={<CancelOutlined />}
                    onClick={() => handleAction(app, 'REJECT')}
                  >
                    Reject
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Action Dialog */}
      <Dialog open={!!selectedApp} onClose={() => { if (!successData) setSelectedApp(null); }} maxWidth="sm" fullWidth>
        <DialogTitle>{actionType === 'APPROVE' ? 'Approve Admission' : 'Reject Admission'}</DialogTitle>
        <DialogContent dividers>
          {successData ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="h5" color="success.main" sx={{ mb: 2, fontWeight: 700 }}>Account Minted Successfully!</Typography>
              <Typography variant="body1">The student has been added to the official roster.</Typography>
              <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 2, mt: 3, mb: 3 }}>
                <Typography variant="caption" color="text.secondary" display="block">Temporary Password Generated:</Typography>
                <Typography variant="h4" sx={{ letterSpacing: 4, fontFamily: 'monospace' }}>{successData.data?.rawPassword}</Typography>
              </Box>
              <Button 
                variant="contained" 
                startIcon={<DownloadOutlined />}
                onClick={async () => {
                  try {
                    const res = await api.post(`/admissions/${successData.applicationId}/letter`, 
                      { rawPassword: successData.data?.rawPassword }, 
                      { responseType: 'blob' }
                    );
                    const url = window.URL.createObjectURL(new Blob([res.data]));
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', 'Admission_Letter.pdf');
                    document.body.appendChild(link);
                    link.click();
                  } catch (err) {
                    alert('Failed to generate letter');
                  }
                }}
              >
                Download Admission Letter (PDF)
              </Button>
            </Box>
          ) : (
            <>
              <Typography variant="body1" sx={{ mb: 3 }}>
                Are you sure you want to {actionType === 'APPROVE' ? 'approve' : 'reject'} the application for <strong>{selectedApp?.name}</strong>?
              </Typography>
              <TextField 
                fullWidth 
                multiline 
                rows={3} 
                label="Internal Notes (Optional)" 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          {successData ? (
            <Button variant="contained" onClick={() => { setSuccessData(null); setSelectedApp(null); }}>Done</Button>
          ) : (
            <>
              <Button onClick={() => setSelectedApp(null)}>Cancel</Button>
              <Button variant="contained" color={actionType === 'APPROVE' ? 'success' : 'error'} onClick={submitAction} disabled={actionMutation.isPending}>
                Confirm {actionType}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdmissionQueue;
