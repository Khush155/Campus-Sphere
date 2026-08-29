import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Avatar,
  Chip,
  Button,
  Divider,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  useTheme,
} from '@mui/material';
import {
  BadgeOutlined as IdCardIcon,
  EmailOutlined as EmailIcon,
  PhoneOutlined as PhoneIcon,
  WbSunnyOutlined as MorningIcon,
  NightsStayOutlined as EveningIcon,
  SchoolOutlined as AcademicIcon,
  VerifiedUserOutlined as VerifiedIcon,
  DownloadOutlined as DownloadIcon,
  HomeOutlined as HomeIcon,
  ContactPhoneOutlined as EmergencyIcon,
  CheckCircleOutlineOutlined as CheckIcon,
  FactCheckOutlined as AttendanceIcon,
  EditOutlined as EditIcon,
} from '@mui/icons-material';

import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useMyProfileQuery } from '../../queries/userProfileQueries';
import CollegiateIdCard from '../../components/common/CollegiateIdCard';
import { useUpdateStudentProfileMutation } from '../../queries/studentQueries';

export const StudentProfilePage = () => {
  const theme = useTheme();
  const { showToast } = useToast();
  const isDark = theme.palette.mode === 'dark';
  const { user } = useAuth();
  const { data: profile } = useMyProfileQuery();
  const updateProfileMutation = useUpdateStudentProfileMutation();

  const currentUser = profile?.user || profile || user;
  const studentMeta = profile?.profileMeta || currentUser?.profileMeta || {};

  const [activeTab, setActiveTab] = useState(0);
  const [openEditModal, setOpenEditModal] = useState(false);

  const phoneVal = currentUser?.phone || currentUser?.phoneNumber || '';
  const emergencyVal = currentUser?.emergencyContact || currentUser?.emergencyContactPhone || '';
  const addressVal = currentUser?.address || '';
  const photoVal = currentUser?.profilePicUrl || '';

  const [formPhone, setFormPhone] = useState(phoneVal);
  const [formEmergency, setFormEmergency] = useState(emergencyVal);
  const [formAddress, setFormAddress] = useState(addressVal);
  const [formPhoto, setFormPhoto] = useState(photoVal);

  const handleOpenEdit = () => {
    setFormPhone(currentUser?.phone || currentUser?.phoneNumber || '');
    setFormEmergency(currentUser?.emergencyContact || currentUser?.emergencyContactPhone || '');
    setFormAddress(currentUser?.address || '');
    setFormPhoto(currentUser?.profilePicUrl || '');
    setOpenEditModal(true);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    const payload = {
      phone: formPhone.trim(),
      emergencyContact: formEmergency.trim(),
      address: formAddress.trim(),
      profilePicUrl: formPhoto.trim(),
    };

    updateProfileMutation.mutate(payload, {
      onSuccess: () => {
        showToast('Profile contact details updated successfully!');
        setOpenEditModal(false);
      },
      onError: (err) => {
        showToast(err.response?.data?.message || err.message || 'Profile update failed', { severity: 'error' });
      },
    });
  };

  const phone = currentUser?.phone || currentUser?.phoneNumber || 'N/A';
  const emergencyContact = currentUser?.emergencyContact || currentUser?.emergencyContactPhone || 'N/A';
  const address = currentUser?.address || 'N/A';

  const shift = studentMeta?.shift || currentUser?.shift || 'MORNING';

  const handlePrintIdCard = () => {
    window.print();
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3.5 }}>
      {/* ── 1. Hero Cover Header ────────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: '24px',
          overflow: 'hidden',
          mb: 3.5,
          border: `1px solid ${theme.palette.divider}`,
          bgcolor: isDark ? 'background.paper' : '#ffffff',
        }}
      >
        <Box
          sx={{
            height: 140,
            background: isDark
              ? 'linear-gradient(135deg, #312e81 0%, #1e1b4b 100%)'
              : 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
            position: 'relative',
          }}
        />

        <Box sx={{ p: { xs: 3, md: 4 }, pt: 0, position: 'relative' }}>
          <Grid container spacing={3} alignItems="flex-end">
            <Grid item xs={12} sm={8} sx={{ display: 'flex', alignItems: 'flex-end', gap: 3 }}>
              <Avatar
                src={currentUser?.profilePicUrl}
                sx={{
                  width: 108,
                  height: 108,
                  mt: -6,
                  border: `4px solid ${isDark ? '#1e1e2d' : '#ffffff'}`,
                  bgcolor: theme.palette.primary.main,
                  fontSize: '2.5rem',
                  fontWeight: 800,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                }}
              >
                {currentUser?.name?.charAt(0) || 'S'}
              </Avatar>

              <Box sx={{ mb: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mb: 0.5 }}>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
                    {currentUser?.name || 'Student Name'}
                  </Typography>
                  <Chip
                    icon={<VerifiedIcon sx={{ fontSize: '1rem !important' }} />}
                    label="VERIFIED STUDENT"
                    color="success"
                    size="small"
                    sx={{ fontWeight: 800 }}
                  />
                  <Chip
                    icon={shift === 'EVENING' ? <EveningIcon /> : <MorningIcon />}
                    label={shift === 'EVENING' ? 'Evening Shift' : 'Morning Shift'}
                    size="small"
                    variant="outlined"
                    sx={{ fontWeight: 800 }}
                  />
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Roll No: <strong>{studentMeta?.rollNumber || currentUser?.rollNumber || 'N/A'}</strong> • Department:{' '}
                  <strong>{studentMeta?.branch || 'Computer Science'}</strong>
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={4} sx={{ textAlign: { xs: 'left', sm: 'right' }, mb: 0.5 }}>
              <Box sx={{ display: 'flex', gap: 1.5, justifyContent: { xs: 'flex-start', sm: 'flex-end' }, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={handleOpenEdit}
                  sx={{ borderRadius: '12px', fontWeight: 800, textTransform: 'none', px: 2.5 }}
                >
                  Edit Profile Details
                </Button>

                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={handlePrintIdCard}
                  sx={{ borderRadius: '12px', fontWeight: 800, textTransform: 'none', px: 2.5, boxShadow: '0 8px 20px rgba(79, 70, 229, 0.25)' }}
                >
                  Print ID Card
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>

        <Divider />

        {/* Tab Header Navigation */}
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          sx={{ px: 3, '& .MuiTab-root': { fontWeight: 800, textTransform: 'none', py: 2, fontSize: '0.92rem' } }}
        >
          <Tab label="Academic & Personal Profile" />
          <Tab label="Digital ID Card Credential" />
        </Tabs>
      </Paper>

      {/* ── 2. Tab Content Areas ────────────────────────────────────── */}

      {/* TAB 0: Merged Academic & Personal Profile */}
      {activeTab === 0 && (
        <Grid container spacing={3.5} alignItems="stretch">
          {/* Main Left Details Card */}
          <Grid item xs={12} md={8} sx={{ display: 'flex', flexDirection: 'column' }}>
            <Paper
              elevation={0}
              sx={{
                p: 4,
                borderRadius: '24px',
                border: `1px solid ${theme.palette.divider}`,
                bgcolor: isDark ? 'background.paper' : '#ffffff',
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <Box>
                {/* 1. Academic Record Section */}
                <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', mb: 2.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AcademicIcon color="primary" /> Official Academic Enrollment Details
                </Typography>

                <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 2.25, borderRadius: '16px', bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', border: `1px solid ${theme.palette.divider}` }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, letterSpacing: '0.05em' }}>
                        STUDENT ROLL NUMBER
                      </Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', mt: 0.25 }}>
                        {studentMeta?.rollNumber || currentUser?.rollNumber || 'N/A'}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 2.25, borderRadius: '16px', bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', border: `1px solid ${theme.palette.divider}` }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, letterSpacing: '0.05em' }}>
                        DEGREE PROGRAMME
                      </Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', mt: 0.25 }}>
                        {studentMeta?.course || 'B.Tech'} (Bachelor of Technology)
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 2.25, borderRadius: '16px', bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', border: `1px solid ${theme.palette.divider}` }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, letterSpacing: '0.05em' }}>
                        BRANCH / SPECIALIZATION
                      </Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', mt: 0.25 }}>
                        {studentMeta?.branch || 'Computer Science & Engineering'}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 2.25, borderRadius: '16px', bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', border: `1px solid ${theme.palette.divider}` }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, letterSpacing: '0.05em' }}>
                        SEMESTER & BATCH
                      </Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', mt: 0.25 }}>
                        Semester {studentMeta?.semester || 6} • Batch 2023-2027
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 2.25, borderRadius: '16px', bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', border: `1px solid ${theme.palette.divider}` }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, letterSpacing: '0.05em' }}>
                        ASSIGNED CLASS GROUP
                      </Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', mt: 0.25 }}>
                        Group {studentMeta?.group || 'G1'}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 2.25, borderRadius: '16px', bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', border: `1px solid ${theme.palette.divider}` }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, letterSpacing: '0.05em' }}>
                        TIMETABLE SHIFT
                      </Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', mt: 0.25 }}>
                        {shift === 'EVENING' ? '🌙 Evening Shift (4:10 PM - 9:30 PM)' : '☀️ Morning Shift (9:00 AM - 4:00 PM)'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Divider sx={{ mb: 3.5 }} />

                {/* 2. Personal & Contact Information Section */}
                <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', mb: 2.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmailIcon color="primary" /> Personal & Contact Information
                </Typography>

                <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ bgcolor: `${theme.palette.primary.main}15`, color: theme.palette.primary.main, width: 44, height: 44 }}>
                        <EmailIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                          OFFICIAL EMAIL
                        </Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                          {currentUser?.email || 'student@college.edu'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ bgcolor: `${theme.palette.success.main}15`, color: theme.palette.success.main, width: 44, height: 44 }}>
                        <PhoneIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                          MOBILE NUMBER
                        </Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                          {phone}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, pt: 1 }}>
                      <Avatar sx={{ bgcolor: `${theme.palette.info.main}15`, color: theme.palette.info.main, width: 44, height: 44 }}>
                        <HomeIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                          PERMANENT RESIDENTIAL ADDRESS
                        </Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', mt: 0.25 }}>
                          {address}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>

                <Divider sx={{ mb: 3.5 }} />

                {/* 3. Guardian & Emergency Section */}
                <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', mb: 2.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmergencyIcon color="error" /> Guardian & Emergency Contacts
                </Typography>

                <Grid container spacing={2.5}>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                      GUARDIAN / PARENT
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary' }}>
                      {studentMeta?.guardianName || currentUser?.guardianName || 'N/A'}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                      RELATIONSHIP
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary' }}>
                      Father
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                      EMERGENCY HOTLINE
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'error.main' }}>
                      {emergencyContact}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </Grid>

          {/* Right Side Block: Equal Height Enrollment Summary */}
          <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column' }}>
            <Paper
              elevation={0}
              sx={{
                p: 4,
                borderRadius: '24px',
                border: `1px solid ${theme.palette.divider}`,
                bgcolor: isDark ? 'background.paper' : '#ffffff',
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckIcon color="success" /> Enrollment Standing & Verification
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                      Enrollment Status
                    </Typography>
                    <Chip label="ACTIVE ENROLLED" color="success" size="small" sx={{ fontWeight: 800 }} />
                  </Box>

                  <Divider />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                      Academic Session
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                      2025 - 2026 (Odd Sem)
                    </Typography>
                  </Box>

                  <Divider />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                      Exam Eligibility
                    </Typography>
                    <Chip label="ELIGIBLE" color="primary" size="small" sx={{ fontWeight: 800 }} />
                  </Box>

                  <Divider />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                      Fee Clearance Status
                    </Typography>
                    <Chip label="NO DUES CLEARED" color="success" size="small" sx={{ fontWeight: 800 }} />
                  </Box>

                  <Divider />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                      Attendance Standing
                    </Typography>
                    <Chip icon={<AttendanceIcon />} label="85% - SAFE" color="primary" variant="outlined" size="small" sx={{ fontWeight: 800 }} />
                  </Box>

                  <Divider />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                      Timetable Shift
                    </Typography>
                    <Chip
                      icon={shift === 'EVENING' ? <EveningIcon /> : <MorningIcon />}
                      label={shift === 'EVENING' ? 'Evening Shift' : 'Morning Shift'}
                      size="small"
                      sx={{ fontWeight: 800 }}
                    />
                  </Box>
                </Box>
              </Box>

              {/* Action Banner inside right card bottom */}
              <Box sx={{ mt: 4, pt: 3, borderTop: `1px solid ${theme.palette.divider}`, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 1.5 }}>
                  Verified by Office of the Registrar & Academic Affairs
                </Typography>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => setActiveTab(1)}
                  startIcon={<IdCardIcon />}
                  sx={{ borderRadius: '12px', fontWeight: 800, textTransform: 'none' }}
                >
                  View Digital Credential Pass
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* TAB 1: Digital ID Card Credential */}
      {activeTab === 1 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
          <CollegiateIdCard
            id="student-digital-credential-card"
            name={currentUser?.name}
            rollNumber={studentMeta?.rollNumber || currentUser?.rollNumber}
            role="STUDENT"
            department={currentUser?.department || studentMeta?.department || 'Computer Science & Engineering'}
            course={studentMeta?.course || 'B.Tech'}
            branch={studentMeta?.branch || 'CSE'}
            semester={studentMeta?.semester || 1}
            email={currentUser?.email}
            photoUrl={currentUser?.profilePicUrl}
            validThrough="2024 — 2028"
          />
        </Box>
      )}

      {/* Edit Profile Modal */}
      <Dialog open={openEditModal} onClose={() => setOpenEditModal(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>
          Edit Profile Contact Information
        </DialogTitle>
        <form onSubmit={handleSaveProfile}>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 3 }}>
              Update your personal contact details. Academic fields (roll number, semester, department, CGPA) remain admin-managed.
            </Typography>

            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Contact Phone Number"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Emergency Contact Number"
                  value={formEmergency}
                  onChange={(e) => setFormEmergency(e.target.value)}
                  placeholder="+91 98765 00000"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Residential Address"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="Street, City, State, Pincode"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Profile Picture URL / Avatar Image Link"
                  value={formPhoto}
                  onChange={(e) => setFormPhoto(e.target.value)}
                  placeholder="https://..."
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setOpenEditModal(false)} sx={{ fontWeight: 700 }}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" color="primary" disabled={updateProfileMutation.isPending} sx={{ borderRadius: '12px', fontWeight: 800, px: 3 }}>
              {updateProfileMutation.isPending ? 'Saving...' : 'Save Profile Changes'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default StudentProfilePage;
