// client/src/pages/faculty/profile/ProfilePage.jsx
//
// Page component rendering the Faculty Profile.
// Displays credentials, office hours, and allows mock info editing.

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Avatar,
  Divider,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Room as RoomIcon,
  AccessTime as TimeIcon,
  School as DegreeIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export const ProfilePage = () => {
  const navigate = useNavigate();

  // Profile State (Mock DB representation)
  const [profile, setProfile] = useState({
    name: 'Dr. Ananya Sharma',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200', // Women avatar placeholder
    department: 'Computer Science and Engineering',
    designation: 'Assistant Professor',
    email: 'ananya.sharma@campus.edu',
    phone: '+91 98765 43210',
    officeHours: 'Mon, Wed, Fri (10:00 AM - 11:30 AM)',
    cabin: 'Room 304, Academic Block-A',
    bio: 'Assistant Professor in the CSE department with over 7 years of academic research and engineering experience. Specialized in algorithms, DBMS schemas, and process architectures.',
    education: [
      { degree: 'Ph.D. in Computer Science', institution: 'IIT Delhi', year: '2020' },
      { degree: 'M.Tech in Software Engineering', institution: 'DTU', year: '2016' },
      { degree: 'B.Tech in Computer Science', institution: 'NSUT', year: '2014' },
    ],
    subjects: [
      'CSE201 - Data Structures & Algorithms',
      'CSE305 - Database Management Systems',
      'CSE302 - Operating Systems',
    ],
  });

  // Edit State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isToastOpen, setIsToastOpen] = useState(false);
  const [editForm, setEditForm] = useState({ ...profile });

  const handleEditOpen = () => {
    setEditForm({ ...profile });
    setIsEditOpen(true);
  };

  const handleEditClose = () => {
    setIsEditOpen(false);
  };

  const handleSave = () => {
    setProfile({ ...editForm });
    setIsEditOpen(false);
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
            Faculty Profile
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your personal directory details, education history, teaching subjects, and office hours
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={4}>
        {/* Left Side: Avatar Card */}
        <Grid item xs={12} md={4}>
          <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 4, height: '100%' }}>
            <Avatar
              src={profile.avatar}
              alt={profile.name}
              sx={{ width: 140, height: 140, mx: 'auto', mb: 2.5, border: '4px solid #4f46e5' }}
            />
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
              {profile.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 2 }}>
              {profile.designation} • {profile.department}
            </Typography>
            <Chip label="Faculty Member" color="primary" sx={{ mb: 3, fontWeight: 700 }} />

            <Divider sx={{ mb: 3 }} />

            {/* Micro Details list */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.8, textAlign: 'left' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <EmailIcon color="action" fontSize="small" />
                <Typography variant="body2" sx={{ wordBreak: 'break-all', fontWeight: 500 }}>
                  {profile.email}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <PhoneIcon color="action" fontSize="small" />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {profile.phone}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <RoomIcon color="action" fontSize="small" />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {profile.cabin}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <TimeIcon color="action" fontSize="small" />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {profile.officeHours}
                </Typography>
              </Box>
            </Box>

            <Button
              variant="outlined"
              fullWidth
              startIcon={<EditIcon />}
              onClick={handleEditOpen}
              sx={{ mt: 4, textTransform: 'none', borderRadius: 2, fontWeight: 700 }}
            >
              Edit Profile
            </Button>
          </Paper>
        </Grid>

        {/* Right Side: Informative Tabs */}
        <Grid item xs={12} md={8}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {/* Bio Card */}
            <Paper variant="outlined" sx={{ p: 4, borderRadius: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5 }}>
                About Me
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                {profile.bio}
              </Typography>
            </Paper>

            {/* Linked Subjects Card */}
            <Paper variant="outlined" sx={{ p: 4, borderRadius: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                Teaching Assignments
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                {profile.subjects.map((sub, index) => (
                  <Chip
                    key={index}
                    label={sub}
                    color="secondary"
                    variant="outlined"
                    sx={{ p: 1, fontWeight: 600, borderRadius: 2 }}
                  />
                ))}
              </Box>
            </Paper>

            {/* Education History Card */}
            <Paper variant="outlined" sx={{ p: 4, borderRadius: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                Education Credentials
              </Typography>
              <List disablePadding>
                {profile.education.map((edu, index) => (
                  <React.Fragment key={index}>
                    <ListItem disableGutters sx={{ py: 1.5 }}>
                      <ListItemIcon>
                        <DegreeIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={edu.degree}
                        primaryTypographyProps={{ fontWeight: 700 }}
                        secondary={`${edu.institution} • Graduated in ${edu.year}`}
                        secondaryTypographyProps={{ fontWeight: 500 }}
                      />
                    </ListItem>
                    {index < profile.education.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          </Box>
        </Grid>
      </Grid>

      {/* ── Edit Modal Dialog ── */}
      <Dialog open={isEditOpen} onClose={handleEditClose} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>Edit Profile Information</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            {/* Full Name */}
            <Grid item xs={12}>
              <TextField
                label="Full Name"
                fullWidth
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </Grid>

            {/* Email Address */}
            <Grid item xs={12} md={6}>
              <TextField
                label="Email Address"
                fullWidth
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </Grid>

            {/* Contact Number */}
            <Grid item xs={12} md={6}>
              <TextField
                label="Contact Number"
                fullWidth
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
            </Grid>

            {/* Office Cabin */}
            <Grid item xs={12} md={6}>
              <TextField
                label="Office Location"
                fullWidth
                value={editForm.cabin}
                onChange={(e) => setEditForm({ ...editForm, cabin: e.target.value })}
              />
            </Grid>

            {/* Office Hours */}
            <Grid item xs={12} md={6}>
              <TextField
                label="Office Consultations Hours"
                fullWidth
                value={editForm.officeHours}
                onChange={(e) => setEditForm({ ...editForm, officeHours: e.target.value })}
              />
            </Grid>

            {/* Bio */}
            <Grid item xs={12}>
              <TextField
                label="Profile Biography"
                fullWidth
                multiline
                rows={4}
                value={editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleEditClose} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained" sx={{ bgcolor: '#4f46e5' }} startIcon={<CheckIcon />}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Snackbar Toast ── */}
      <Snackbar open={isToastOpen} autoHideDuration={3000} onClose={() => setIsToastOpen(false)}>
        <Alert severity="success" variant="filled">
          Profile updated successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProfilePage;
