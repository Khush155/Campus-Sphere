import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Divider,
  List,
  ListItem,
  Chip,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Campaign as CampaignIcon,
  Send as SendIcon,
} from '@mui/icons-material';

const AnnouncementsHub = () => {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [audience, setAudience] = useState(['Students', 'Faculty']);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const { data: announcementsData, isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => api.get('/announcements').then(res => res.data.data),
  });

  const publishMutation = useMutation({
    mutationFn: (newAnnouncement) => api.post('/announcements', newAnnouncement),
    onSuccess: () => {
      queryClient.invalidateQueries(['announcements']);
      setTitle('');
      setContent('');
      setSnackbar({ open: true, message: 'Announcement published successfully!', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to publish announcement.', severity: 'error' });
    }
  });

  const previousAnnouncements = announcementsData || [];

  const handleAudienceChange = (target) => {
    setAudience(prev => 
      prev.includes(target) ? prev.filter(a => a !== target) : [...prev, target]
    );
  };

  const handlePublish = () => {
    if (!title || !content) {
      setSnackbar({ open: true, message: 'Title and content are required.', severity: 'warning' });
      return;
    }
    publishMutation.mutate({ title, content, audience });
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, md: 3 } }}>
      <Box sx={{ mb: 4, display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
            <CampaignIcon fontSize="large" color="primary" />
            Announcements
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Broadcast institutional notices and alerts.
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={4}>
        {/* Layer 1: Create Announcement Form */}
        <Grid item xs={12} md={7}>
          <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', height: '100%' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Create Announcement</Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField 
                  fullWidth 
                  label="Title" 
                  placeholder="e.g. Semester Exam Schedule" 
                  variant="outlined" 
                  InputProps={{ sx: { borderRadius: 2 } }}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                
                <TextField 
                  fullWidth 
                  label="Message Content" 
                  multiline 
                  rows={6} 
                  placeholder="Write your announcement here..." 
                  variant="outlined" 
                  InputProps={{ sx: { borderRadius: 2 } }}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />

                <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Target Audience</Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <FormControlLabel control={<Checkbox checked={audience.includes('Students')} onChange={() => handleAudienceChange('Students')} />} label="Students" />
                    <FormControlLabel control={<Checkbox checked={audience.includes('Faculty')} onChange={() => handleAudienceChange('Faculty')} />} label="Faculty" />
                    <FormControlLabel control={<Checkbox checked={audience.includes('HODs')} onChange={() => handleAudienceChange('HODs')} />} label="HODs" />
                  </Box>
                </Box>

                <Button 
                  variant="contained" 
                  size="large" 
                  startIcon={<SendIcon />} 
                  sx={{ borderRadius: 2, py: 1.5, mt: 1 }}
                  onClick={handlePublish}
                  disabled={publishMutation.isPending}
                >
                  {publishMutation.isPending ? 'Publishing...' : 'Publish Announcement'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Layer 2: Previous Announcements */}
        <Grid item xs={12} md={5}>
          <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', height: '100%' }}>
            <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Previous Announcements</Typography>
            </Box>
            <List disablePadding>
              {isLoading && <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>}
              {previousAnnouncements.map((ann, index) => (
                <React.Fragment key={ann.id}>
                  <ListItem sx={{ py: 2, px: 3, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 700 }}>{ann.title}</Typography>
                      <Chip label={ann.status} size="small" color="success" sx={{ fontWeight: 600 }} />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                      Published on {ann.date}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {ann.audience.map(aud => (
                        <Chip key={aud} label={aud} size="small" variant="outlined" sx={{ borderRadius: 1 }} />
                      ))}
                    </Box>
                  </ListItem>
                  {index < previousAnnouncements.length - 1 && <Divider component="li" />}
                </React.Fragment>
              ))}
            </List>
          </Card>
        </Grid>
      </Grid>
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AnnouncementsHub;
