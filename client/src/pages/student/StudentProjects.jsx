import React, { useState } from 'react';
import { 
  Box, Typography, Paper, Grid, Card, CardContent, Button, 
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, 
  CircularProgress, Chip, MenuItem
} from '@mui/material';
import { Folder, GitHub, Language } from '@mui/icons-material';
import { usePortfolioQuery, useAddProjectMutation } from '../../queries/engagementQueries';

const StudentProjects = () => {
  const { data, isLoading } = usePortfolioQuery();
  const addProjectMutation = useAddProjectMutation();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '', description: '', type: 'Mini Project', githubLink: '', demoLink: ''
  });

  if (isLoading) {
    return <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>;
  }

  const projects = data?.projects || [];

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setFormData({ title: '', description: '', type: 'Mini Project', githubLink: '', demoLink: '' });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.description) return;
    addProjectMutation.mutate(formData, {
      onSuccess: handleClose
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'success';
      case 'In Progress': return 'primary';
      case 'Approved': return 'info';
      case 'Rejected': return 'error';
      default: return 'warning';
    }
  };

  return (
    <Box sx={{ flexGrow: 1, p: { xs: 1, md: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>
            My Projects
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your academic projects and track milestones.
          </Typography>
        </Box>
        <Button variant="contained" onClick={handleOpen} startIcon={<Folder />}>
          Propose New Project
        </Button>
      </Box>

      <Grid container spacing={3}>
        {projects.length > 0 ? projects.map(proj => (
          <Grid item xs={12} md={6} key={proj._id}>
            <Card elevation={0} variant="outlined" sx={{ borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Chip label={proj.type} size="small" color="secondary" variant="outlined" />
                  <Chip label={proj.status} size="small" color={getStatusColor(proj.status)} />
                </Box>
                
                <Typography variant="h6" fontWeight="700" gutterBottom>{proj.title}</Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {proj.description}
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                  {proj.githubLink && (
                    <Button size="small" startIcon={<GitHub />} href={proj.githubLink} target="_blank" color="inherit" variant="outlined">
                      Repository
                    </Button>
                  )}
                  {proj.demoLink && (
                    <Button size="small" startIcon={<Language />} href={proj.demoLink} target="_blank" color="primary" variant="outlined">
                      Live Demo
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )) : (
          <Grid item xs={12}>
            <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }} elevation={0} variant="outlined">
              <Folder sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
              <Typography variant="h6" color="text.secondary">No projects found</Typography>
              <Typography variant="body2" color="text.disabled">Click 'Propose New Project' to get started.</Typography>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Propose Project Dialog */}
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700 }}>Propose New Project</DialogTitle>
        <DialogContent dividers>
          <TextField select fullWidth label="Project Type" name="type" value={formData.type} onChange={handleChange} sx={{ mb: 3 }}>
            {['Mini Project', 'Major Project', 'Research', 'Other'].map(option => (
              <MenuItem key={option} value={option}>{option}</MenuItem>
            ))}
          </TextField>
          <TextField fullWidth label="Project Title" name="title" value={formData.title} onChange={handleChange} sx={{ mb: 3 }} required />
          <TextField fullWidth multiline rows={4} label="Description" name="description" value={formData.description} onChange={handleChange} sx={{ mb: 3 }} required />
          <TextField fullWidth label="GitHub Repository Link" name="githubLink" value={formData.githubLink} onChange={handleChange} sx={{ mb: 3 }} placeholder="https://github.com/..." />
          <TextField fullWidth label="Live Demo Link" name="demoLink" value={formData.demoLink} onChange={handleChange} placeholder="https://..." />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClose} color="inherit">Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={addProjectMutation.isPending || !formData.title || !formData.description}>
            {addProjectMutation.isPending ? 'Submitting...' : 'Submit Proposal'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentProjects;
