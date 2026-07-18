import React from 'react';
import { Box, Typography, Paper, Grid, Avatar, Divider, Chip } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { Person, Email, Phone, Home, School, Event } from '@mui/icons-material';

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

        {/* Right Column - Detailed Info */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 4, borderRadius: 3, height: '100%' }} elevation={0} variant="outlined">
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
              <Grid item xs={12} sm={6}>
                <InfoItem icon={<School />} label="Admission Year" value="2023" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <InfoItem icon={<School />} label="Current SGPA" value="8.75" />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StudentProfile;
