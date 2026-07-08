import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Button,
  Tabs,
  Tab,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  Language as WebIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Edit as EditIcon,
  School as SchoolIcon,
  Business as BusinessIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const InstitutionProfile = () => {
  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState(false);

  const handleEdit = () => {
    setSnackbar(true);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, md: 3 } }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, color: 'text.primary' }}>
            Institution Profile
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage college identity and structural configurations.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<EditIcon />} sx={{ borderRadius: 2 }} onClick={handleEdit}>
          Edit Profile
        </Button>
      </Box>

      {/* Layer 1: College Profile Card */}
      <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', mb: 4, overflow: 'visible' }}>
        <Box sx={{ height: 160, bgcolor: 'primary.main', borderRadius: '16px 16px 0 0', position: 'relative' }}>
          {/* Banner image or solid color */}
        </Box>
        <CardContent sx={{ pt: 0, px: 4, pb: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'center', sm: 'flex-end' }, mt: -6, mb: 3 }}>
            <Avatar
              sx={{
                width: 120,
                height: 120,
                border: '4px solid',
                borderColor: 'background.paper',
                boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                bgcolor: 'white',
                color: 'primary.main',
              }}
            >
              <SchoolIcon sx={{ fontSize: 60 }} />
            </Avatar>
            <Box sx={{ ml: { xs: 0, sm: 3 }, mt: { xs: 2, sm: 0 }, textAlign: { xs: 'center', sm: 'left' }, flexGrow: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
                CampusSphere Engineering College
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1, justifyContent: { xs: 'center', sm: 'flex-start' } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                  <LocationIcon fontSize="small" sx={{ mr: 0.5 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Punjab, India</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                  <BusinessIcon fontSize="small" sx={{ mr: 0.5 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Established: 2010</Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Layer 2: Information Tabs */}
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Overview" sx={{ fontWeight: 600 }} />
            <Tab label="Accreditation" sx={{ fontWeight: 600 }} />
            <Tab label="Contact" sx={{ fontWeight: 600 }} />
            <Tab label="Documents" sx={{ fontWeight: 600 }} />
          </Tabs>

          {/* Layer 3: Details */}
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={4}>
              <Grid item xs={12} md={8}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>About the Institution</Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  CampusSphere Engineering College is a premier technical institution dedicated to shaping the future of engineering and technology. Established in 2010, the college has rapidly grown to become a hub of innovation and academic excellence.
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Our mission is to provide world-class education and foster research that solves real-world problems.
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ bgcolor: 'background.default', borderRadius: 3, p: 2 }} elevation={0}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: 'text.secondary' }}>QUICK FACTS</Typography>
                  <List disablePadding>
                    <ListItem disablePadding sx={{ mb: 1 }}>
                      <ListItemText primary="Campus Size" secondary="150 Acres" primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }} secondaryTypographyProps={{ variant: 'body2', fontWeight: 600, color: 'text.primary' }} />
                    </ListItem>
                    <ListItem disablePadding sx={{ mb: 1 }}>
                      <ListItemText primary="University Code" secondary="CSEC-402" primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }} secondaryTypographyProps={{ variant: 'body2', fontWeight: 600, color: 'text.primary' }} />
                    </ListItem>
                    <ListItem disablePadding>
                      <ListItemText primary="Type" secondary="Private, Autonomous" primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }} secondaryTypographyProps={{ variant: 'body2', fontWeight: 600, color: 'text.primary' }} />
                    </ListItem>
                  </List>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }} elevation={0}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <CheckCircleIcon color="success" />
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>NAAC Grade</Typography>
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 800, color: 'primary.main', mb: 1 }}>A+</Typography>
                  <Typography variant="body2" color="text.secondary">Valid until 2029</Typography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }} elevation={0}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <CheckCircleIcon color="success" />
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>AICTE</Typography>
                  </Box>
                  <Chip label="Approved" color="success" sx={{ fontWeight: 600, mb: 1 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ display: 'block' }}>All technical programs approved</Typography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }} elevation={0}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <SchoolIcon color="primary" />
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>Affiliation</Typography>
                  </Box>
                  <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>XYZ Technological University</Typography>
                  <Typography variant="body2" color="text.secondary">Permanent Affiliation</Typography>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <List>
              <ListItem>
                <ListItemIcon><WebIcon color="primary" /></ListItemIcon>
                <ListItemText primary="Website" secondary="www.campussphere.edu" />
              </ListItem>
              <Divider component="li" />
              <ListItem>
                <ListItemIcon><EmailIcon color="primary" /></ListItemIcon>
                <ListItemText primary="Official Email" secondary="admin@campussphere.edu" />
              </ListItem>
              <Divider component="li" />
              <ListItem>
                <ListItemIcon><PhoneIcon color="primary" /></ListItemIcon>
                <ListItemText primary="Contact Number" secondary="+91 9876543210" />
              </ListItem>
            </List>
          </TabPanel>
          
          <TabPanel value={tabValue} index={3}>
            <Typography variant="body1" color="text.secondary">No official documents uploaded yet.</Typography>
          </TabPanel>
        </CardContent>
      </Card>
      
      <Snackbar open={snackbar} autoHideDuration={3000} onClose={() => setSnackbar(false)}>
        <Alert onClose={() => setSnackbar(false)} severity="info" sx={{ width: '100%' }}>
          Edit profile functionality will be available soon!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default InstitutionProfile;
