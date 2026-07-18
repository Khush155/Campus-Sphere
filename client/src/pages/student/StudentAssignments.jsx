import React, { useState } from 'react';
import { 
  Box, Typography, Paper, Grid, Card, CardContent, Chip, Button, 
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress
} from '@mui/material';
import { Assignment as AssignmentIcon, AccessTime, CheckCircle, Warning } from '@mui/icons-material';
import { useAssignmentsQuery, useSubmitAssignmentMutation } from '../../queries/engagementQueries';

const StudentAssignments = () => {
  const { data: assignments, isLoading } = useAssignmentsQuery();
  const submitMutation = useSubmitAssignmentMutation();
  
  const [openSubmit, setOpenSubmit] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [feedback, setFeedback] = useState('');

  const handleOpen = (task) => {
    setSelectedTask(task);
    setFeedback(task.submission?.feedback || '');
    setOpenSubmit(true);
  };

  const handleClose = () => {
    setOpenSubmit(false);
    setSelectedTask(null);
    setFeedback('');
  };

  const handleSubmit = () => {
    if (!selectedTask || !feedback.trim()) return;
    submitMutation.mutate(
      { id: selectedTask._id, data: { feedback } },
      { onSuccess: handleClose }
    );
  };

  if (isLoading) {
    return <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>;
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Submitted': return 'success';
      case 'Graded': return 'primary';
      case 'Late': return 'error';
      default: return 'warning';
    }
  };

  return (
    <Box sx={{ flexGrow: 1, p: { xs: 1, md: 3 } }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>
        My Assignments
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        View and submit your course assignments.
      </Typography>

      <Grid container spacing={3}>
        {assignments?.length > 0 ? assignments.map(task => (
          <Grid item xs={12} md={6} lg={4} key={task._id}>
            <Card elevation={0} variant="outlined" sx={{ borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Chip 
                    label={task.status} 
                    color={getStatusColor(task.status)} 
                    size="small" 
                    icon={task.status === 'Submitted' ? <CheckCircle /> : (task.status === 'Late' ? <Warning /> : <AccessTime />)} 
                  />
                  <Typography variant="caption" color="text.secondary" fontWeight="600">
                    Max: {task.maxMarks} Marks
                  </Typography>
                </Box>
                
                <Typography variant="h6" fontWeight="700" gutterBottom>{task.title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {task.description}
                </Typography>
                
                <Box sx={{ bgcolor: 'action.hover', p: 1.5, borderRadius: 2, mb: 2 }}>
                  <Typography variant="caption" display="block" color="text.secondary">Subject</Typography>
                  <Typography variant="body2" fontWeight="600">{task.subject}</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" color="error.main" fontWeight="600">
                    Due: {new Date(task.deadline).toLocaleDateString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    By: {task.faculty}
                  </Typography>
                </Box>
              </CardContent>
              <Box sx={{ p: 2, pt: 0 }}>
                <Button 
                  fullWidth 
                  variant={task.status === 'Pending' ? 'contained' : 'outlined'} 
                  color={task.status === 'Pending' ? 'primary' : 'inherit'}
                  onClick={() => handleOpen(task)}
                >
                  {task.status === 'Pending' ? 'Submit Now' : 'View Submission'}
                </Button>
              </Box>
            </Card>
          </Grid>
        )) : (
           <Grid item xs={12}>
             <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }} elevation={0} variant="outlined">
               <AssignmentIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
               <Typography variant="h6" color="text.secondary">No active assignments</Typography>
               <Typography variant="body2" color="text.disabled">You're all caught up!</Typography>
             </Paper>
           </Grid>
        )}
      </Grid>

      {/* Submit Dialog */}
      <Dialog open={openSubmit} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700 }}>
          {selectedTask?.status === 'Pending' ? 'Submit Assignment' : 'Assignment Submission'}
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="subtitle1" fontWeight="600" gutterBottom>
            {selectedTask?.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {selectedTask?.description}
          </Typography>
          
          <TextField
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            label="Your Submission (Text or Link)"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            disabled={selectedTask?.status === 'Graded'}
            placeholder="Type your answer or paste a link to your Google Doc/Repo..."
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClose} color="inherit">Cancel</Button>
          {selectedTask?.status !== 'Graded' && (
            <Button 
              onClick={handleSubmit} 
              variant="contained" 
              disabled={submitMutation.isPending || !feedback.trim()}
            >
              {submitMutation.isPending ? 'Submitting...' : (selectedTask?.status === 'Pending' ? 'Submit' : 'Update Submission')}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentAssignments;
