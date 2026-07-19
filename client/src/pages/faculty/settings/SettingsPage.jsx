// client/src/pages/faculty/settings/SettingsPage.jsx
//
// Page component rendering preferences and configuration switches.

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  IconButton,
  FormControlLabel,
  Switch,
  TextField,
  MenuItem,
  Button,
  Snackbar,
  Alert,
  Divider,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Save as SaveIcon,
  Palette as PaletteIcon,
  Notifications as NotifyIcon,
  Language as LangIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useThemeContext } from '../../../contexts/ThemeContext';

export const SettingsPage = () => {
  const navigate = useNavigate();
  const { mode, toggleTheme } = useThemeContext();

  // Settings state (Mock values)
  const [settings, setSettings] = useState({
    language: 'en',
    emailAlerts: true,
    smsAlerts: false,
    timetableReminders: true,
    submissionAlerts: true,
    fontSize: 'medium',
  });

  const [isToastOpen, setIsToastOpen] = useState(false);

  const handleSave = () => {
    setIsToastOpen(true);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* ── Page Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
        <IconButton
          onClick={() => navigate('/faculty')}
          size="small"
          sx={{ bgcolor: 'action.hover', '&:hover': { bgcolor: 'action.selected' } }}
        >
          <BackIcon fontSize="small" />
        </IconButton>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>
            Settings & Preferences
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure system configurations, alerts, and theme preferences
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={4} sx={{ maxWidth: 800 }}>
        {/* Theme Settings Card */}
        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 4, borderRadius: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <PaletteIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Visual Style Configuration
              </Typography>
            </Box>
            <Divider sx={{ mb: 2.5 }} />
            <FormControlLabel
              control={<Switch checked={mode === 'dark'} onChange={toggleTheme} color="primary" />}
              label={
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  Enable System Dark Mode Override
                </Typography>
              }
            />
          </Paper>
        </Grid>

        {/* Language Preferences Card */}
        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 4, borderRadius: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <LangIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Language & Localization
              </Typography>
            </Box>
            <Divider sx={{ mb: 2.5 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  label="System Display Language"
                  fullWidth
                  value={settings.language}
                  onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                >
                  <MenuItem value="en">English (US/UK)</MenuItem>
                  <MenuItem value="hi">Hindi (हिन्दी)</MenuItem>
                  <MenuItem value="es">Spanish (Español)</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Notifications Configuration Card */}
        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 4, borderRadius: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <NotifyIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Alerts & Channels
              </Typography>
            </Box>
            <Divider sx={{ mb: 2.5 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.emailAlerts}
                    onChange={(e) => setSettings({ ...settings, emailAlerts: e.target.checked })}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      Email Notification Digests
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Receive weekly grading updates and schedule summaries in your inbox
                    </Typography>
                  </Box>
                }
              />
              <Divider />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.smsAlerts}
                    onChange={(e) => setSettings({ ...settings, smsAlerts: e.target.checked })}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      SMS Text Messages Alerts
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Receive instant SMS texts for exam dates or timetable shifts
                    </Typography>
                  </Box>
                }
              />
              <Divider />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.submissionAlerts}
                    onChange={(e) => setSettings({ ...settings, submissionAlerts: e.target.checked })}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      Assignment Submissions Alerts
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Notify immediately when students upload their submissions
                    </Typography>
                  </Box>
                }
              />
            </Box>
          </Paper>
        </Grid>

        {/* Action Button */}
        <Grid item xs={12}>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              bgcolor: '#4f46e5',
              '&:hover': { bgcolor: '#4338ca' },
              borderRadius: 2.5,
              px: 4,
              py: 1.2,
            }}
          >
            Save Preferences
          </Button>
        </Grid>
      </Grid>

      {/* ── Snackbar Toast ── */}
      <Snackbar open={isToastOpen} autoHideDuration={3000} onClose={() => setIsToastOpen(false)}>
        <Alert severity="success" variant="filled">
          Preferences saved successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SettingsPage;
