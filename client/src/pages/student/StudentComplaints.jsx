import React, { useState } from 'react';
import { 
  Box, Typography, Paper, Grid, Card, CardContent, Chip, Button, 
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, CircularProgress
} from '@mui/material';
import { SupportAgent, CheckCircle, HourglassEmpty, Engineering, Add, ConfirmationNumber } from '@mui/icons-material';
import { useComplaintsQuery, useRaiseComplaintMutation } from '../../queries/utilityQueries';

const StudentComplaints = () => {
  const { data: complaints, isLoading } = useComplaintsQuery();
  const raiseMutation = useRaiseComplaintMutation();
  
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '', category: 'Hostel', description: '', attachmentUrl: ''
  });

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setFormData({ title: '', category: 'Hostel', description: '', attachmentUrl: '' });
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = () => {
    if (!formData.title || !formData.description) return;
    raiseMutation.mutate(formData, { onSuccess: handleClose });
  };

  if (isLoading) {
    return <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>;
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Resolved': 
      case 'Closed': return 'success';
      case 'In Progress': return 'info';
      default: return 'warning';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Resolved': 
      case 'Closed': return <CheckCircle />;
      case 'In Progress': return <Engineering />;
      default: return <HourglassEmpty />;
    }
  };

  return (
    <Box sx={{ flexGrow: 1, p: { xs: 1, md: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>
            Helpdesk & Complaints
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Raise tickets for hostel, infrastructure, or academic issues.
          </Typography>
        </Box>
        <Button variant="contained" onClick={handleOpen} startIcon={<Add />}>
          Raise Ticket
        </Button>
      </Box>

      <Grid container spacing={3}>
        {complaints?.length > 0 ? complaints.map(ticket => (
          <Grid item xs={12} md={6} lg={4} key={ticket._id}>
            <Card elevation={0} variant="outlined" sx={{ borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ConfirmationNumber color="disabled" fontSize="small" />
                    <Typography variant="caption" color="text.secondary" fontWeight="600">
                      Ticket #{ticket._id.substring(ticket._id.length - 6).toUpperCase()}
                    </Typography>
                  </Box>
                  <Chip 
                    label={ticket.status} 
                    color={getStatusColor(ticket.status)} 
                    size="small" 
                    icon={getStatusIcon(ticket.status)}
                  />
                </Box>
                
                <Typography variant="h6" fontWeight="700" gutterBottom>{ticket.title}</Typography>
                <Chip label={ticket.category} size="small" variant="outlined" sx={{ mb: 2 }} />
                
                <Typography variant="body2" color="text.secondary" paragraph>
                  {ticket.description}
                </Typography>
                
                {ticket.resolutionNotes && (
                  <Box sx={{ mt: 2, p: 1.5, borderLeft: '3px solid', borderColor: getStatusColor(ticket.status) + '.main', bgcolor: 'action.hover' }}>
                    <Typography variant="caption" color="text.secondary" display="block">Resolution / Staff Note:</Typography>
                    <Typography variant="body2">{ticket.resolutionNotes}</Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        )) : (
           <Grid item xs={12}>
             <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }} elevation={0} variant="outlined">
               <SupportAgent sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
               <Typography variant="h6" color="text.secondary">No open tickets</Typography>
               <Typography variant="body2" color="text.disabled">Need help? Raise a new ticket.</Typography>
             </Paper>
           </Grid>
        )}
      </Grid>

      {/* Raise Ticket Dialog */}
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700 }}>Raise New Ticket</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField select fullWidth label="Category" name="category" value={formData.category} onChange={handleChange} required>
                {['Hostel', 'Academic', 'Infrastructure', 'Cafeteria', 'IT Support', 'Other'].map(option => (
                  <MenuItem key={option} value={option}>{option}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField 
                fullWidth 
                label="Issue Title" 
                name="title" 
                value={formData.title} 
                onChange={handleChange} 
                required 
              />
            </Grid>
            <Grid item xs={12}>
              <TextField 
                fullWidth 
                multiline 
                rows={4} 
                label="Description" 
                name="description" 
                value={formData.description} 
                onChange={handleChange} 
                required 
              />
            </Grid>
            <Grid item xs={12}>
              <TextField 
                fullWidth 
                label="Image/Proof URL (Optional)" 
                name="attachmentUrl" 
                value={formData.attachmentUrl} 
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
            disabled={raiseMutation.isPending || !formData.title || !formData.description}
          >
            {raiseMutation.isPending ? 'Submitting...' : 'Submit Ticket'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentComplaints;
