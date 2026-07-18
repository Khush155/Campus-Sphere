import React, { useState } from 'react';
import { 
  Box, Typography, Paper, Grid, Avatar, Divider, Chip, Tabs, Tab,
  List, ListItem, ListItemText, ListItemIcon, Button, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, MenuItem, CircularProgress
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Person, Email, Phone, Home, School, Event, 
  WorkspacePremium, Group, Add, EmojiEvents
} from '@mui/icons-material';
import { usePortfolioQuery, useAddAchievementMutation } from '../../queries/engagementQueries';
import { useUpdateProfileMutation } from '../../queries/utilityQueries';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const InfoItem = ({ icon, label, value }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
    <Box sx={{ color: 'primary.main', mr: 2, display: 'flex' }}>{icon}</Box>
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{label}</Typography>
      <Typography variant="body1" sx={{ fontWeight: 500 }}>{value || 'Not provided'}</Typography>
    </Box>
  </Box>
);

const StudentProfile = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [openAchieve, setOpenAchieve] = useState(false);
  const [formData, setFormData] = useState({
    title: '', category: 'Hackathon', description: '', dateEarned: '', proofUrl: ''
  });

  const { data: portfolio, isLoading } = usePortfolioQuery();
  const addAchievementMutation = useAddAchievementMutation();
  const updateProfileMutation = useUpdateProfileMutation();

  const [socialLinks, setSocialLinks] = useState({
    github: user?.socialLinks?.github || '',
    linkedin: user?.socialLinks?.linkedin || '',
    leetcode: user?.socialLinks?.leetcode || '',
    portfolio: user?.socialLinks?.portfolio || ''
  });

  const handleSocialChange = (e) => setSocialLinks({ ...socialLinks, [e.target.name]: e.target.value });
  
  const handleSaveSocials = () => {
    updateProfileMutation.mutate({ socialLinks });
  };

  const handleOpen = () => setOpenAchieve(true);
  const handleClose = () => {
    setOpenAchieve(false);
    setFormData({ title: '', category: 'Hackathon', description: '', dateEarned: '', proofUrl: '' });
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = () => {
    if (!formData.title || !formData.dateEarned) return;
    addAchievementMutation.mutate(formData, { onSuccess: handleClose });
  };

  return (
    <Box sx={{ flexGrow: 1, p: { xs: 1, md: 3 } }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 4, color: 'text.primary' }}>
        My Profile
      </Typography>

      <Grid container spacing={3}>
        {/* Left Column - Avatar & Basic Info */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 4, borderRadius: 3, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }} elevation={0} variant="outlined">
            <Avatar 
              sx={{ width: 120, height: 120, mb: 3, bgcolor: 'primary.main', fontSize: '3rem', fontWeight: 700 }}
            >
              {user?.name?.charAt(0) || 'S'}
            </Avatar>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>{user?.name}</Typography>
            <Chip label={user?.role || 'STUDENT'} size="small" color="primary" sx={{ mb: 2, fontWeight: 600 }} />
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Roll Number: <strong>{user?.customId}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Semester: <strong>{user?.semester || 'N/A'}</strong>
            </Typography>
          </Paper>
        </Grid>

        {/* Right Column - Detailed Info & Portfolio Tabs */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ borderRadius: 3, height: '100%', overflow: 'hidden' }} elevation={0} variant="outlined">
            <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper', px: 2, pt: 2 }}>
              <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
                <Tab label="Personal Info" sx={{ fontWeight: 600 }} />
                <Tab label="Achievements & Resume" sx={{ fontWeight: 600 }} />
                <Tab label="Integrations & Links" sx={{ fontWeight: 600 }} />
              </Tabs>
            </Box>

            {/* Personal Info Tab */}
            <TabPanel value={tabValue} index={0}>
              <Box sx={{ p: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Personal Information</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <InfoItem icon={<Email />} label="Email Address" value={user?.email} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoItem icon={<Phone />} label="Phone Number" value="+91 XXXXX XXXXX" />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoItem icon={<Person />} label="Gender" value="Male" />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoItem icon={<Event />} label="Date of Birth" value="01 Jan 2002" />
                  </Grid>
                  <Grid item xs={12}>
                    <InfoItem icon={<Home />} label="Address" value="123 CampusSphere Lane, Tech City, 10001" />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Academic Information</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <InfoItem icon={<School />} label="Course" value="B.Tech Computer Science" />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoItem icon={<School />} label="Department" value={user?.department?.name || 'Computer Science'} />
                  </Grid>
                </Grid>
              </Box>
            </TabPanel>

            {/* Achievements & Resume Tab */}
            <TabPanel value={tabValue} index={1}>
              <Box sx={{ p: 4, pt: 0 }}>
                {isLoading ? (
                  <CircularProgress />
                ) : (
                  <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>My Achievements</Typography>
                      <Button variant="outlined" size="small" startIcon={<Add />} onClick={handleOpen}>Log Achievement</Button>
                    </Box>
                    
                    {portfolio?.achievements?.length > 0 ? (
                      <List disablePadding>
                        {portfolio.achievements.map(ach => (
                          <ListItem key={ach._id} disableGutters sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                            <ListItemIcon>
                              <EmojiEvents color="primary" />
                            </ListItemIcon>
                            <ListItemText 
                              primary={ach.title} 
                              secondary={`${ach.category} • ${new Date(ach.dateEarned).toLocaleDateString()}`}
                              primaryTypographyProps={{ fontWeight: 600 }}
                            />
                            {ach.isVerified && <Chip label="Verified" color="success" size="small" />}
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="text.secondary" paragraph>No achievements logged yet.</Typography>
                    )}

                    <Divider sx={{ my: 4 }} />

                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Clubs & Societies</Typography>
                    {portfolio?.clubs?.length > 0 ? (
                      <List disablePadding>
                        {portfolio.clubs.map(club => (
                          <ListItem key={club.id} disableGutters sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                            <ListItemIcon>
                              <Group color="secondary" />
                            </ListItemIcon>
                            <ListItemText 
                              primary={club.name} 
                              secondary={`Role: ${club.role} • Joined: ${new Date(club.joinedAt).getFullYear()}`}
                              primaryTypographyProps={{ fontWeight: 600 }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="text.secondary">You are not part of any clubs yet.</Typography>
                    )}
                    
                    <Box sx={{ mt: 4, p: 2, bgcolor: 'action.hover', borderRadius: 2, textAlign: 'center' }}>
                      <WorkspacePremium sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                      <Typography variant="subtitle2" fontWeight="600">Resume Builder</Typography>
                      <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                        All your logged projects, achievements, and club roles will automatically flow into your Placement Resume.
                      </Typography>
                      <Button variant="contained" size="small" disabled>Generate Resume (Coming Soon)</Button>
                    </Box>
                  </>
                )}
              </Box>
            </TabPanel>

            {/* Integrations & Links Tab */}
            <TabPanel value={tabValue} index={2}>
              <Box sx={{ p: 4, pt: 0 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Social & Developer Profiles</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                  Connect your external profiles to automatically build your digital portfolio.
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField 
                      fullWidth 
                      label="GitHub Profile URL" 
                      name="github"
                      value={socialLinks.github}
                      onChange={handleSocialChange}
                      placeholder="https://github.com/yourusername"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField 
                      fullWidth 
                      label="LinkedIn Profile URL" 
                      name="linkedin"
                      value={socialLinks.linkedin}
                      onChange={handleSocialChange}
                      placeholder="https://linkedin.com/in/yourusername"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField 
                      fullWidth 
                      label="LeetCode Profile URL" 
                      name="leetcode"
                      value={socialLinks.leetcode}
                      onChange={handleSocialChange}
                      placeholder="https://leetcode.com/yourusername"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField 
                      fullWidth 
                      label="Personal Portfolio/Website URL" 
                      name="portfolio"
                      value={socialLinks.portfolio}
                      onChange={handleSocialChange}
                      placeholder="https://yourwebsite.com"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button 
                      variant="contained" 
                      onClick={handleSaveSocials} 
                      disabled={updateProfileMutation.isPending}
                    >
                      {updateProfileMutation.isPending ? 'Saving...' : 'Save Integrations'}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </TabPanel>

          </Paper>
        </Grid>
      </Grid>

      {/* Log Achievement Dialog */}
      <Dialog open={openAchieve} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700 }}>Log New Achievement</DialogTitle>
        <DialogContent dividers>
          <TextField fullWidth label="Achievement Title" name="title" value={formData.title} onChange={handleChange} sx={{ mb: 3 }} required />
          <TextField select fullWidth label="Category" name="category" value={formData.category} onChange={handleChange} sx={{ mb: 3 }}>
            {['Hackathon', 'Certification', 'Publication', 'Sports', 'Cultural', 'Other'].map(option => (
              <MenuItem key={option} value={option}>{option}</MenuItem>
            ))}
          </TextField>
          <TextField fullWidth type="date" label="Date Earned" name="dateEarned" value={formData.dateEarned} onChange={handleChange} sx={{ mb: 3 }} InputLabelProps={{ shrink: true }} required />
          <TextField fullWidth multiline rows={3} label="Description (Optional)" name="description" value={formData.description} onChange={handleChange} sx={{ mb: 3 }} />
          <TextField fullWidth label="Proof/Certificate Link (Optional)" name="proofUrl" value={formData.proofUrl} onChange={handleChange} placeholder="https://..." />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClose} color="inherit">Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={addAchievementMutation.isPending || !formData.title || !formData.dateEarned}>
            {addAchievementMutation.isPending ? 'Saving...' : 'Save Achievement'}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default StudentProfile;
