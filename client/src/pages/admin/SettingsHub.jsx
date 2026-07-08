import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Tabs,
  Tab,
  TextField,
  Divider,
  Switch,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Person as ProfileIcon,
  Security as SecurityIcon,
  Notifications as NotifyIcon,
  History as AuditIcon,
  Save as SaveIcon,
  VpnKey as PasswordIcon,
  Smartphone as DeviceIcon,
} from '@mui/icons-material';

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const SettingsHub = () => {
  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState(false);

  const handleSave = () => {
    setSnackbar(true);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const auditLogs = [
    { id: 1, action: 'User login (IP: 192.168.1.5)', time: '10 July 2026, 09:30 AM' },
    { id: 2, action: 'Updated Fee Structure for CSE', time: '09 July 2026, 02:15 PM' },
    { id: 3, action: 'Approved Faculty Registration: Dr. Sharma', time: '08 July 2026, 11:45 AM' },
  ];

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: { xs: 2, md: 3 } }}>
      <Box sx={{ mb: 4, display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
            <SettingsIcon fontSize="large" color="primary" />
            System Settings
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your account preferences and security.
          </Typography>
        </Box>
      </Box>

      <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <Box sx={{ px: 3, pt: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
            <Tab icon={<ProfileIcon fontSize="small" sx={{ mr: 1 }} />} iconPosition="start" label="Profile" sx={{ fontWeight: 600, minHeight: 48 }} />
            <Tab icon={<SecurityIcon fontSize="small" sx={{ mr: 1 }} />} iconPosition="start" label="Security" sx={{ fontWeight: 600, minHeight: 48 }} />
            <Tab icon={<NotifyIcon fontSize="small" sx={{ mr: 1 }} />} iconPosition="start" label="Notifications" sx={{ fontWeight: 600, minHeight: 48 }} />
            <Tab icon={<AuditIcon fontSize="small" sx={{ mr: 1 }} />} iconPosition="start" label="Audit Logs" sx={{ fontWeight: 600, minHeight: 48 }} />
          </Tabs>
        </Box>

        <Box sx={{ p: { xs: 2, md: 4 } }}>
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={4}>
              <Grid item xs={12} md={8}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Personal Information</Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="First Name" defaultValue="College" variant="outlined" />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Last Name" defaultValue="Admin" variant="outlined" />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Email Address" defaultValue="college_admin@campussphere.edu" variant="outlined" disabled />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Phone Number" defaultValue="+91 9876543210" variant="outlined" />
                  </Grid>
                </Grid>
                <Button variant="contained" size="large" sx={{ mt: 4, borderRadius: 2 }} onClick={handleSave}>
                  Save Changes
                </Button>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Security Settings</Typography>
            <Box sx={{ mb: 4, p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <PasswordIcon color="primary" />
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>Change Password</Typography>
                  <Typography variant="body2" color="text.secondary">Update your account password regularly to keep your account secure.</Typography>
                </Box>
              </Box>
              <Button variant="outlined" sx={{ borderRadius: 2 }}>Update Password</Button>
            </Box>

            <Box sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <DeviceIcon color="primary" />
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>Two-Factor Authentication (2FA)</Typography>
                  <Typography variant="body2" color="text.secondary">Add an extra layer of security to your account.</Typography>
                </Box>
              </Box>
              <Button variant="outlined" sx={{ borderRadius: 2 }} onClick={handleSave}>Enable 2FA</Button>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Notification Preferences</Typography>
            <List disablePadding sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
              <ListItem sx={{ py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                <ListItemText primary="Email Alerts" secondary="Receive daily summaries and critical alerts via email." primaryTypographyProps={{ fontWeight: 600 }} />
                <Switch defaultChecked color="primary" />
              </ListItem>
              <ListItem sx={{ py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                <ListItemText primary="Approval Requests" secondary="Get notified when a new request requires your approval." primaryTypographyProps={{ fontWeight: 600 }} />
                <Switch defaultChecked color="primary" />
              </ListItem>
              <ListItem sx={{ py: 2 }}>
                <ListItemText primary="System Updates" secondary="Announcements regarding ERP maintenance and updates." primaryTypographyProps={{ fontWeight: 600 }} />
                <Switch color="primary" />
              </ListItem>
            </List>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Recent Activity Logs</Typography>
            <List disablePadding sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
              {auditLogs.map((log, index) => (
                <React.Fragment key={log.id}>
                  <ListItem sx={{ py: 2 }}>
                    <ListItemIcon>
                      <AuditIcon color="action" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={log.action} 
                      secondary={log.time} 
                      primaryTypographyProps={{ fontWeight: 600 }}
                    />
                  </ListItem>
                  {index < auditLogs.length - 1 && <Divider component="li" />}
                </React.Fragment>
              ))}
            </List>
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Button variant="outlined" sx={{ borderRadius: 2 }}>View All Logs</Button>
            </Box>
          </TabPanel>
        </Box>
      </Card>
      
      <Snackbar open={snackbar} autoHideDuration={3000} onClose={() => setSnackbar(false)}>
        <Alert onClose={() => setSnackbar(false)} severity="success" sx={{ width: '100%' }}>
          Settings updated successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SettingsHub;
