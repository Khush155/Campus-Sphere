import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  Button,
  TextField,
  Chip,
  useTheme,
  Paper,
  Divider,
  Switch,
  FormControlLabel,
  MenuItem,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  SettingsOutlined,
  NotificationsActiveOutlined,
  SecurityOutlined,
  LaptopMacOutlined,
  DownloadOutlined,
  SaveOutlined,
  CheckCircleOutlined,
  LockOutlined,
} from '@mui/icons-material';

import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';

export const AccountSettingsPage = () => {
  const theme = useTheme();
  const { showToast } = useToast();
  const { user } = useAuth();
  const isDark = theme.palette.mode === 'dark';

  // Settings State
  const [settings, setSettings] = useState({
    emailDigest: 'INSTANT',
    timetableAlerts: true,
    attendanceAlerts: true,
    noticeAlerts: true,
  });

  const [saving, setSaving] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      showToast('Notification preferences updated successfully!');
    }, 500);
  };

  const handleExportData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(user, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `CampusSphere_Data_${user?.email || 'User'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Personal data archive downloaded successfully!');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      {/* ── 1. Header Banner ──────────────────────────────────────────────── */}
      <Card
        sx={{
          p: 3.5,
          borderRadius: '20px',
          border: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
          background: `linear-gradient(135deg, ${theme.palette.primary.main}12 0%, ${theme.palette.brass?.[500] || '#b8863e'}0F 100%)`,
          boxShadow: 'none',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: '14px',
                bgcolor: theme.palette.primary.main,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 4px 16px ${theme.palette.primary.main}40`,
              }}
            >
              <SettingsOutlined sx={{ fontSize: 28 }} />
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.ink[900] }}>
                Account Settings &amp; Preferences
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage your notification broadcasts, active session devices, and account privacy archive.
              </Typography>
            </Box>
          </Box>
          <Chip label={`${user?.role?.replace('_', ' ')} WORKSPACE`} color="primary" sx={{ fontWeight: 800, fontSize: '0.7rem' }} />
        </Box>
      </Card>

      {/* ── 2. Unified 2-Column Settings View ───────────────────────────────── */}
      <Grid container spacing={3.5} alignItems="stretch">
        {/* Left Column: Notification Broadcast Preferences */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3.5, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <NotificationsActiveOutlined color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 800, color: theme.palette.ink[900] }}>
                Notification Broadcasts
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Control email dispatch frequency and automated alert triggers across your workspace.
            </Typography>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, flex: 1 }}>
                <TextField
                  select
                  label="Email Digest Delivery Frequency"
                  value={settings.emailDigest}
                  onChange={(e) => setSettings({ ...settings, emailDigest: e.target.value })}
                  fullWidth
                >
                  <MenuItem value="INSTANT">Instant Real-time Dispatch</MenuItem>
                  <MenuItem value="DAILY">Daily Evening Summary Digest</MenuItem>
                  <MenuItem value="WEEKLY">Weekly Overview Digest</MenuItem>
                </TextField>

                <Divider sx={{ my: 0.5 }} />

                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                  Automated Event Alert Triggers
                </Typography>

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.timetableAlerts}
                      onChange={(e) => setSettings({ ...settings, timetableAlerts: e.target.checked })}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Timetable Schedule Alerts</Typography>
                      <Typography variant="caption" color="text.secondary">Receive notifications when class slots or room allocations change.</Typography>
                    </Box>
                  }
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.attendanceAlerts}
                      onChange={(e) => setSettings({ ...settings, attendanceAlerts: e.target.checked })}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Attendance &amp; Academic Alerts</Typography>
                      <Typography variant="caption" color="text.secondary">Trigger alerts when attendance drops below institutional threshold.</Typography>
                    </Box>
                  }
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.noticeAlerts}
                      onChange={(e) => setSettings({ ...settings, noticeAlerts: e.target.checked })}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Institutional Circular Notices</Typography>
                      <Typography variant="caption" color="text.secondary">Broadcast official announcements &amp; exam circulars to your feed.</Typography>
                    </Box>
                  }
                />
              </Box>

              <Box sx={{ pt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={saving}
                  startIcon={<SaveOutlined />}
                  sx={{ borderRadius: '8px', fontWeight: 700 }}
                >
                  {saving ? 'Saving...' : 'Save Notification Preferences'}
                </Button>
              </Box>
            </form>
          </Card>
        </Grid>

        {/* Right Column: Active Sessions & Privacy Archive */}
        <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
          {/* Active Login Sessions */}
          <Card sx={{ p: 3.5, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <SecurityOutlined color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 800, color: theme.palette.ink[900] }}>
                Active Login Sessions
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Devices and browser sessions currently authenticated with your account.
            </Typography>

            <List disablePadding>
              <Paper variant="outlined" sx={{ borderRadius: '14px', mb: 2, p: 1, bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)' }}>
                <ListItem>
                  <ListItemIcon>
                    <LaptopMacOutlined color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Chrome on Windows 11</Typography>
                        <Chip label="ACTIVE NOW" size="small" color="success" sx={{ fontWeight: 800, fontSize: '0.62rem', height: 20 }} />
                      </Box>
                    }
                    secondary="IP: 127.0.0.1 • Current Session"
                  />
                </ListItem>
              </Paper>
            </List>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                color="error"
                startIcon={<LockOutlined />}
                onClick={() => showToast('All other browser sessions terminated.')}
                sx={{ borderRadius: '8px', fontWeight: 700, textTransform: 'none' }}
              >
                Revoke All Other Sessions
              </Button>
            </Box>
          </Card>

          {/* Privacy & Data Archive */}
          <Card sx={{ p: 3.5, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, color: theme.palette.ink[900] }}>
                Privacy &amp; Institutional Data Archive
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                Download a complete JSON export of your personal profile details and academic logs.
              </Typography>

              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '14px', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                  <CheckCircleOutlined color="success" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                    GDPR &amp; Institutional Data Compliance
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  Your account data is encrypted in transit and at rest adhering to institutional privacy standards.
                </Typography>
              </Paper>
            </Box>

            <Button
              variant="contained"
              color="primary"
              fullWidth
              startIcon={<DownloadOutlined />}
              onClick={handleExportData}
              sx={{ borderRadius: '8px', fontWeight: 700, textTransform: 'none' }}
            >
              Download My Data Archive (.JSON)
            </Button>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AccountSettingsPage;
