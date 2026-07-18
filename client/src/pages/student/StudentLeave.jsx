import React, { useState } from 'react';
import { 
  Box, Typography, Paper, Grid, Card, CardContent, Chip, Button, 
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress
} from '@mui/material';
import { EventBusy, CheckCircle, Cancel, HourglassEmpty, Add } from '@mui/icons-material';
import { useLeaveQuery, useApplyLeaveMutation } from '../../queries/utilityQueries';

const StudentLeave = () => {
  const { data: leaves, isLoading } = useLeaveQuery();
  const applyMutation = useApplyLeaveMutation();
  
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    startDate: '', endDate: '', reason: '', proofUrl: ''
  });

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setFormData({ startDate: '', endDate: '', reason: '', proofUrl: '' });
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = () => {
    if (!formData.startDate || !formData.endDate || !formData.reason) return;
    applyMutation.mutate(formData, { onSuccess: handleClose });
  };

  if (isLoading) {
    return <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>;
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Approved': return <CheckCircle />;
      case 'Rejected': return <Cancel />;
      default: return <HourglassEmpty />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return 'success';
      case 'Rejected': return 'error';
      default: return 'warning';
    }
  };

  return (
    <Box sx={{ flexGrow: 1, p: { xs: 1, md: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>
            Leave Application
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Apply for leave and track your application status.
          </Typography>
        </Box>
        <Button variant="contained" onClick={handleOpen} startIcon={<Add />}>
          New Application
        </Button>
      </Box>

      <Grid container spacing={3}>
        {leaves?.length > 0 ? leaves.map(leave => (
          <Grid item xs={12} md={6} lg={4} key={leave._id}>
            <Card elevation={0} variant="outlined" sx={{ borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Chip 
                    label={leave.status} 
                    color={getStatusColor(leave.status)} 
                    size="small" 
                    icon={getStatusIcon(leave.status)}
                  />
                  <Typography variant="caption" color="text.secondary" fontWeight="600">
                    Applied: {new Date(leave.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
                
                <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 2, mb: 2, display: 'flex', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">From</Typography>
                    <Typography variant="subtitle2" fontWeight="700">{new Date(leave.startDate).toLocaleDateString()}</Typography>
                  </Box>
                  <Box textAlign="right">
                    <Typography variant="caption" color="text.secondary" display="block">To</Typography>
                    <Typography variant="subtitle2" fontWeight="700">{new Date(leave.endDate).toLocaleDateString()}</Typography>
                  </Box>
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  <strong>Reason:</strong> {leave.reason}
                </Typography>
                
                {leave.reviewNotes && (
                  <Box sx={{ mt: 2, p: 1.5, borderLeft: '3px solid', borderColor: getStatusColor(leave.status) + '.main', bgcolor: 'action.hover' }}>
                    <Typography variant="caption" color="text.secondary" display="block">HOD Note:</Typography>
                    <Typography variant="body2">{leave.reviewNotes}</Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        )) : (
           <Grid item xs={12}>
             <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }} elevation={0} variant="outlined">
               <EventBusy sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
               <Typography variant="h6" color="text.secondary">No leave applications</Typography>
               <Typography variant="body2" color="text.disabled">You have not applied for any leaves yet.</Typography>
             </Paper>
           </Grid>
        )}
      </Grid>

      {/* Apply Dialog */}
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700 }}>Apply for Leave</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField 
                fullWidth 
                type="date" 
                label="Start Date" 
                name="startDate" 
                value={formData.startDate} 
                onChange={handleChange} 
                InputLabelProps={{ shrink: true }} 
                required 
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                fullWidth 
                type="date" 
                label="End Date" 
                name="endDate" 
                value={formData.endDate} 
                onChange={handleChange} 
                InputLabelProps={{ shrink: true }} 
                required 
              />
            </Grid>
            <Grid item xs={12}>
              <TextField 
                fullWidth 
                multiline 
                rows={3} 
                label="Reason for Leave" 
                name="reason" 
                value={formData.reason} 
                onChange={handleChange} 
                required 
              />
            </Grid>
            <Grid item xs={12}>
              <TextField 
                fullWidth 
                label="Medical Certificate / Proof URL (Optional)" 
                name="proofUrl" 
                value={formData.proofUrl} 
                onChange={handleChange} 
                placeholder="https://..." 
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClose} color="inherit">Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={applyMutation.isPending || !formData.startDate || !formData.endDate || !formData.reason}
          >
            {applyMutation.isPending ? 'Submitting...' : 'Submit Application'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentLeave;
