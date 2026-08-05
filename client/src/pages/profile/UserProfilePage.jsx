import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  Button,
  TextField,
  Chip,
  CircularProgress,
  useTheme,
  Avatar,
  Paper,
  Tabs,
  Tab,
  Divider,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import {
  PersonOutlined,
  EmailOutlined,
  PhoneOutlined,
  LockOutlined,
  BadgeOutlined,
  BusinessOutlined,
  CheckCircleOutlined,
  SaveOutlined,
  Visibility,
  VisibilityOff,
  PhotoCameraOutlined,
  SchoolOutlined,
  ContactPhoneOutlined,
  LocationOnOutlined,
  AccessTimeOutlined,
  NotificationsActiveOutlined,
  CloudUploadOutlined,
  DeleteOutlineOutlined,
  SecurityOutlined,
} from '@mui/icons-material';

import { useMyProfileQuery, useUpdateMyProfileMutation } from '../../queries/userProfileQueries';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';

export const UserProfilePage = () => {
  const theme = useTheme();
  const { showToast } = useToast();
  const { user: authUser } = useAuth();
  const fileInputRef = useRef(null);
  const isDark = theme.palette.mode === 'dark';

  const [activeTab, setActiveTab] = useState(0);

  // Unified Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: '',
    phoneNumber: '',
    profilePicUrl: '',
    bio: '',
    officeRoom: '',
    officeHours: '',
    qualification: '',
    specialization: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    notificationPreference: 'EMAIL_AND_PORTAL',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  // Queries & Mutations
  const { data: profileData, isLoading, refetch } = useMyProfileQuery();
  const updateMutation = useUpdateMyProfileMutation();

  const user = profileData?.user || authUser;
  const profileMeta = profileData?.profileMeta;

  useEffect(() => {
    if (user) {
      setProfileForm((prev) => ({
        ...prev,
        name: user.name || '',
        phoneNumber: user.phoneNumber || '',
        profilePicUrl: user.profilePicUrl || '',
        bio: user.bio || '',
        officeRoom: user.officeRoom || '',
        officeHours: user.officeHours || '',
        qualification: user.qualification || '',
        specialization: user.specialization || '',
        emergencyContactName: user.emergencyContactName || '',
        emergencyContactPhone: user.emergencyContactPhone || '',
        notificationPreference: user.notificationPreference || 'EMAIL_AND_PORTAL',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
    }
  }, [user]);

  // Calculate Profile Completeness Score (0-100%)
  const profileCompletion = useMemo(() => {
    let score = 0;
    if (profileForm.name) score += 20;
    if (profileForm.phoneNumber) score += 15;
    if (profileForm.profilePicUrl) score += 20;
    if (profileForm.qualification) score += 15;
    if (profileForm.officeRoom || profileForm.officeHours) score += 15;
    if (profileForm.emergencyContactName && profileForm.emergencyContactPhone) score += 15;
    return Math.min(score, 100);
  }, [profileForm]);

  // Direct Image File Upload Handler
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image file size must be less than 5MB.', { severity: 'error' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64Data = uploadEvent.target?.result;
      if (base64Data) {
        setProfileForm((prev) => ({ ...prev, profilePicUrl: base64Data }));
        showToast('Photo selected! Enter current password and click "Save Profile Changes" below to apply.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    if (!profileForm.name.trim()) {
      showToast('Name cannot be empty.', { severity: 'error' });
      return;
    }
    if (!profileForm.currentPassword) {
      showToast('Please enter your current password to authorize changes.', { severity: 'error' });
      return;
    }

    if (profileForm.newPassword) {
      if (profileForm.newPassword.length < 6) {
        showToast('New password must be at least 6 characters.', { severity: 'error' });
        return;
      }
      if (profileForm.newPassword !== profileForm.confirmPassword) {
        showToast('New password and confirmation do not match.', { severity: 'error' });
        return;
      }
    }

    updateMutation.mutate(
      {
        name: profileForm.name.trim(),
        phoneNumber: profileForm.phoneNumber.trim(),
        profilePicUrl: profileForm.profilePicUrl,
        bio: profileForm.bio.trim(),
        officeRoom: profileForm.officeRoom.trim(),
        officeHours: profileForm.officeHours.trim(),
        qualification: profileForm.qualification.trim(),
        specialization: profileForm.specialization.trim(),
        emergencyContactName: profileForm.emergencyContactName.trim(),
        emergencyContactPhone: profileForm.emergencyContactPhone.trim(),
        notificationPreference: profileForm.notificationPreference,
        currentPassword: profileForm.currentPassword,
        newPassword: profileForm.newPassword,
      },
      {
        onSuccess: () => {
          showToast('Profile updated successfully!');
          setProfileForm((prev) => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
          refetch();
        },
        onError: (err) => showToast(err.response?.data?.message || 'Failed to update profile.', { severity: 'error' }),
      }
    );
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress size={36} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      {/* Hidden File Input for Computer Image Upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />

      {/* ── 1. Executive Hero Identity Banner ───────────────────────────────── */}
      <Card
        sx={{
          p: 3.5,
          borderRadius: '20px',
          border: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
          background: `linear-gradient(135deg, ${theme.palette.primary.main}12 0%, ${theme.palette.brass?.[500] || '#b8863e'}0F 100%)`,
          boxShadow: 'none',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
            <Box sx={{ position: 'relative' }}>
              <Avatar
                src={profileForm.profilePicUrl}
                sx={{
                  width: 96,
                  height: 96,
                  bgcolor: theme.palette.primary.main,
                  fontSize: '2.2rem',
                  fontWeight: 800,
                  boxShadow: `0 8px 24px ${theme.palette.primary.main}35`,
                  border: `4px solid ${theme.palette.background.paper}`,
                }}
              >
                {(user?.name || 'U').charAt(0).toUpperCase()}
              </Avatar>
              <Tooltip title="Upload photo from computer">
                <IconButton
                  size="small"
                  onClick={() => fileInputRef.current?.click()}
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    bgcolor: theme.palette.primary.main,
                    color: '#fff',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                    '&:hover': { bgcolor: theme.palette.primary.dark },
                  }}
                >
                  <PhotoCameraOutlined sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            </Box>

            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5, flexWrap: 'wrap' }}>
                <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.ink[900] }}>
                  {user?.name || 'User Account'}
                </Typography>
                <Chip
                  label={user?.role?.replace('_', ' ') || 'GUEST'}
                  size="small"
                  color="primary"
                  sx={{ fontWeight: 800, fontSize: '0.7rem' }}
                />
                <Chip
                  icon={<CheckCircleOutlined sx={{ fontSize: '0.85rem !important' }} />}
                  label="VERIFIED MEMBER"
                  size="small"
                  color="success"
                  variant="outlined"
                  sx={{ fontWeight: 800, fontSize: '0.68rem' }}
                />
              </Box>

              <Typography variant="body2" color="text.secondary">
                {user?.email} • {user?.departmentId?.name || 'Central University Administration'}
              </Typography>
              {user?.qualification && (
                <Typography variant="caption" sx={{ color: theme.palette.primary.main, fontWeight: 800, mt: 0.5, display: 'block' }}>
                  🎓 {user.qualification} {user.specialization ? `(${user.specialization})` : ''}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Profile Strength Progress Box */}
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              borderRadius: '14px',
              minWidth: 230,
              bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.7)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>
                PROFILE STRENGTH
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: theme.palette.primary.main }}>
                {profileCompletion}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={profileCompletion}
              sx={{ height: 6, borderRadius: 3, bgcolor: `${theme.palette.primary.main}20` }}
            />
          </Paper>
        </Box>
      </Card>

      {/* ── 2. Tab Bar ─────────────────────────────────────────────────────── */}
      <Paper sx={{ borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', px: 2 }}>
        <Tabs value={activeTab} onChange={(_e, v) => setActiveTab(v)} sx={{ minHeight: 48 }}>
          <Tab label="Account Profile" icon={<PersonOutlined />} iconPosition="start" sx={{ fontWeight: 700, textTransform: 'none' }} />
          <Tab label="Edit Profile & Password" icon={<PhotoCameraOutlined />} iconPosition="start" sx={{ fontWeight: 700, textTransform: 'none' }} />
          <Tab label="Emergency & Preferences" icon={<ContactPhoneOutlined />} iconPosition="start" sx={{ fontWeight: 700, textTransform: 'none' }} />
        </Tabs>
      </Paper>

      {/* ── 3. Symmetric Tab Contents ─────────────────────────────────────── */}

      {/* Tab 0: Account Overview — Symmetric 2-Column Grid */}
      {activeTab === 0 && (
        <Grid container spacing={3} alignItems="stretch">
          {/* Left Column (6 Units) */}
          <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* 01. Personal Identity */}
            <Card sx={{ p: 3, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: theme.palette.ink[900] }}>
                  Personal Identity
                </Typography>
                <Chip label="01" size="small" variant="outlined" sx={{ fontWeight: 800, fontSize: '0.68rem', fontFamily: theme.typography.mono.fontFamily }} />
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.2, flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar sx={{ bgcolor: `${theme.palette.primary.main}12`, color: theme.palette.primary.main, width: 36, height: 36 }}>
                    <PersonOutlined fontSize="small" />
                  </Avatar>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>Full Display Name</Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: theme.palette.ink[900] }}>{user?.name}</Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar sx={{ bgcolor: `${theme.palette.primary.main}12`, color: theme.palette.primary.main, width: 36, height: 36 }}>
                    <EmailOutlined fontSize="small" />
                  </Avatar>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>Email Address</Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: theme.palette.ink[900] }}>{user?.email}</Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar sx={{ bgcolor: `${theme.palette.primary.main}12`, color: theme.palette.primary.main, width: 36, height: 36 }}>
                    <PhoneOutlined fontSize="small" />
                  </Avatar>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>Contact Phone</Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: theme.palette.ink[900] }}>{user?.phoneNumber || 'Not specified'}</Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar sx={{ bgcolor: `${theme.palette.primary.main}12`, color: theme.palette.primary.main, width: 36, height: 36 }}>
                    <SchoolOutlined fontSize="small" />
                  </Avatar>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>Highest Qualification</Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: theme.palette.ink[900] }}>{user?.qualification || 'Not specified'}</Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar sx={{ bgcolor: `${theme.palette.primary.main}12`, color: theme.palette.primary.main, width: 36, height: 36 }}>
                    <BadgeOutlined fontSize="small" />
                  </Avatar>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>Specialization &amp; Research</Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: theme.palette.ink[900] }}>{user?.specialization || 'General Curriculum'}</Typography>
                  </Box>
                </Box>
              </Box>

              {user?.bio && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
                    PROFESSIONAL SUMMARY
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.ink[900], fontStyle: 'italic' }}>
                    &ldquo;{user.bio}&rdquo;
                  </Typography>
                </>
              )}
            </Card>

            {/* 03. Emergency Contacts */}
            <Card sx={{ p: 3, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: theme.palette.ink[900] }}>
                  Emergency Contact
                </Typography>
                <Chip label="03" size="small" variant="outlined" sx={{ fontWeight: 800, fontSize: '0.68rem', fontFamily: theme.typography.mono.fontFamily }} />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ bgcolor: `${theme.palette.secondary.main}15`, color: theme.palette.secondary.main, width: 36, height: 36 }}>
                  <ContactPhoneOutlined fontSize="small" />
                </Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>Emergency Contact Person</Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: theme.palette.ink[900] }}>
                    {user?.emergencyContactName ? `${user.emergencyContactName} (${user.emergencyContactPhone || 'N/A'})` : 'Not configured'}
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Grid>

          {/* Right Column (6 Units) */}
          <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* 02. Institutional Alignment */}
            <Card sx={{ p: 3, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: theme.palette.ink[900] }}>
                  Institutional Assignment
                </Typography>
                <Chip label="02" size="small" variant="outlined" sx={{ fontWeight: 800, fontSize: '0.68rem', fontFamily: theme.typography.mono.fontFamily }} />
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.2, flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar sx={{ bgcolor: `${theme.palette.primary.main}12`, color: theme.palette.primary.main, width: 36, height: 36 }}>
                    <BusinessOutlined fontSize="small" />
                  </Avatar>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>Department</Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: theme.palette.ink[900] }}>{user?.departmentId?.name || 'Central Campus'}</Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar sx={{ bgcolor: `${theme.palette.primary.main}12`, color: theme.palette.primary.main, width: 36, height: 36 }}>
                    <LocationOnOutlined fontSize="small" />
                  </Avatar>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>Office Room / Lab Location</Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: theme.palette.ink[900] }}>{user?.officeRoom || profileMeta?.officeHours || 'Block A - Faculty Desk'}</Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar sx={{ bgcolor: `${theme.palette.primary.main}12`, color: theme.palette.primary.main, width: 36, height: 36 }}>
                    <AccessTimeOutlined fontSize="small" />
                  </Avatar>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>Office Consultation Hours</Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: theme.palette.ink[900] }}>{user?.officeHours || 'Mon, Wed 2:00 PM - 4:00 PM'}</Typography>
                  </Box>
                </Box>

                {profileMeta?.employeeId && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ bgcolor: `${theme.palette.primary.main}12`, color: theme.palette.primary.main, width: 36, height: 36 }}>
                      <BadgeOutlined fontSize="small" />
                    </Avatar>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>Employee ID</Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, fontFamily: theme.typography.mono.fontFamily }}>{profileMeta.employeeId}</Typography>
                    </Box>
                  </Box>
                )}

                {profileMeta?.rollNumber && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ bgcolor: `${theme.palette.primary.main}12`, color: theme.palette.primary.main, width: 36, height: 36 }}>
                      <BadgeOutlined fontSize="small" />
                    </Avatar>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>Roll Number</Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, fontFamily: theme.typography.mono.fontFamily }}>{profileMeta.rollNumber}</Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            </Card>

            {/* 04. Preferences */}
            <Card sx={{ p: 3, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: theme.palette.ink[900] }}>
                  System Preferences
                </Typography>
                <Chip label="04" size="small" variant="outlined" sx={{ fontWeight: 800, fontSize: '0.68rem', fontFamily: theme.typography.mono.fontFamily }} />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ bgcolor: `${theme.palette.info.main}15`, color: theme.palette.info.main, width: 36, height: 36 }}>
                  <NotificationsActiveOutlined fontSize="small" />
                </Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>Notification Preference</Typography>
                  <Chip label={user?.notificationPreference || 'EMAIL & PORTAL'} size="small" color="primary" sx={{ fontWeight: 700, fontSize: '0.65rem', mt: 0.5 }} />
                </Box>
              </Box>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tab 1: Edit Profile & Password Studio */}
      {activeTab === 1 && (
        <Card sx={{ p: 3.5, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, color: theme.palette.ink[900] }}>
            Edit Profile Details &amp; Password Security
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Update your profile picture, personal info, or change password. Your current password is required to authorize changes.
          </Typography>

          <form onSubmit={handleProfileSubmit}>
            <Grid container spacing={3}>
              {/* Photo File Upload Section */}
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '14px', borderStyle: 'dashed' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
                    <Avatar
                      src={profileForm.profilePicUrl}
                      sx={{ width: 84, height: 84, border: `3px solid ${theme.palette.primary.main}`, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    >
                      {(user?.name || 'U').charAt(0).toUpperCase()}
                    </Avatar>

                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5 }}>
                        Upload Profile Photo
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                        Select a JPG, PNG, or WEBP image file from your computer (max 5MB).
                      </Typography>

                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Button
                          variant="contained"
                          startIcon={<CloudUploadOutlined />}
                          onClick={() => fileInputRef.current?.click()}
                          sx={{ borderRadius: '8px', fontWeight: 700, textTransform: 'none' }}
                        >
                          Choose Photo File
                        </Button>

                        {profileForm.profilePicUrl && (
                          <Button
                            variant="outlined"
                            color="error"
                            startIcon={<DeleteOutlineOutlined />}
                            onClick={() => setProfileForm({ ...profileForm, profilePicUrl: '' })}
                            sx={{ borderRadius: '8px', fontWeight: 700, textTransform: 'none' }}
                          >
                            Remove Photo
                          </Button>
                        )}
                      </Stack>
                    </Box>
                  </Box>
                </Paper>
              </Grid>

              {/* Personal Details */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Full Display Name"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  fullWidth
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Contact Phone Number"
                  placeholder="+91 98765 43210"
                  value={profileForm.phoneNumber}
                  onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Highest Qualification"
                  placeholder="e.g. Ph.D. in Computer Science / M.Tech"
                  value={profileForm.qualification}
                  onChange={(e) => setProfileForm({ ...profileForm, qualification: e.target.value })}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Specialization &amp; Research"
                  placeholder="e.g. Machine Learning, Cloud Systems"
                  value={profileForm.specialization}
                  onChange={(e) => setProfileForm({ ...profileForm, specialization: e.target.value })}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Office Room / Lab Location"
                  placeholder="e.g. Block B - Room 304"
                  value={profileForm.officeRoom}
                  onChange={(e) => setProfileForm({ ...profileForm, officeRoom: e.target.value })}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Office Consultation Hours"
                  placeholder="e.g. Mon, Wed 2:00 PM - 4:00 PM"
                  value={profileForm.officeHours}
                  onChange={(e) => setProfileForm({ ...profileForm, officeHours: e.target.value })}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  multiline
                  rows={3}
                  label="Professional Bio / Summary"
                  placeholder="Write a brief professional summary or academic background..."
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  fullWidth
                />
              </Grid>

              {/* Merged Password Change Section */}
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: theme.palette.ink[900], mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SecurityOutlined color="primary" fontSize="small" /> Change Password (Optional)
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                  Leave new password fields blank if you do not want to change your password.
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  type={showNewPw ? 'text' : 'password'}
                  label="New Password"
                  placeholder="Leave blank to keep existing password"
                  value={profileForm.newPassword}
                  onChange={(e) => setProfileForm({ ...profileForm, newPassword: e.target.value })}
                  fullWidth
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowNewPw(!showNewPw)} edge="end">
                          {showNewPw ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  type="password"
                  label="Confirm New Password"
                  placeholder="Re-enter new password"
                  value={profileForm.confirmPassword}
                  onChange={(e) => setProfileForm({ ...profileForm, confirmPassword: e.target.value })}
                  fullWidth
                />
              </Grid>

              {/* Mandatory Current Password Security Verification */}
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '14px', bgcolor: `${theme.palette.primary.main}08`, borderColor: `${theme.palette.primary.main}30` }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: theme.palette.primary.main, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LockOutlined fontSize="small" /> Security Verification Required
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                    Please enter your current password to authorize and save changes to your profile.
                  </Typography>

                  <TextField
                    type={showCurrentPw ? 'text' : 'password'}
                    label="Current Password"
                    placeholder="Enter current password to confirm"
                    value={profileForm.currentPassword}
                    onChange={(e) => setProfileForm({ ...profileForm, currentPassword: e.target.value })}
                    fullWidth
                    required
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowCurrentPw(!showCurrentPw)} edge="end">
                            {showCurrentPw ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Paper>
              </Grid>

              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={updateMutation.isPending}
                  startIcon={<SaveOutlined />}
                  sx={{ borderRadius: '8px', fontWeight: 700 }}
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Profile Changes'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </Card>
      )}

      {/* Tab 2: Emergency & Preferences */}
      {activeTab === 2 && (
        <Card sx={{ p: 3.5, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, color: theme.palette.ink[900] }}>
            Emergency Contact &amp; Notification Preferences
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Configure emergency contact details and university broadcast notification channels.
          </Typography>

          <form onSubmit={handleProfileSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Emergency Contact Name"
                  placeholder="e.g. Parent / Spouse Name"
                  value={profileForm.emergencyContactName}
                  onChange={(e) => setProfileForm({ ...profileForm, emergencyContactName: e.target.value })}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Emergency Contact Phone"
                  placeholder="+91 98765 43210"
                  value={profileForm.emergencyContactPhone}
                  onChange={(e) => setProfileForm({ ...profileForm, emergencyContactPhone: e.target.value })}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  select
                  label="Preferred Notification Channel"
                  value={profileForm.notificationPreference}
                  onChange={(e) => setProfileForm({ ...profileForm, notificationPreference: e.target.value })}
                  fullWidth
                >
                  <MenuItem value="EMAIL_AND_PORTAL">Email &amp; In-App Portal Broadcasts</MenuItem>
                  <MenuItem value="EMAIL_ONLY">Email Only</MenuItem>
                  <MenuItem value="PORTAL_ONLY">In-App Portal Only</MenuItem>
                </TextField>
              </Grid>

              {/* Mandatory Security Verification */}
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '14px', bgcolor: `${theme.palette.primary.main}08`, borderColor: `${theme.palette.primary.main}30` }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: theme.palette.primary.main, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LockOutlined fontSize="small" /> Security Verification Required
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                    Please enter your current password to authorize and save changes to your preferences.
                  </Typography>

                  <TextField
                    type={showCurrentPw ? 'text' : 'password'}
                    label="Current Password"
                    placeholder="Enter current password to confirm"
                    value={profileForm.currentPassword}
                    onChange={(e) => setProfileForm({ ...profileForm, currentPassword: e.target.value })}
                    fullWidth
                    required
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowCurrentPw(!showCurrentPw)} edge="end">
                            {showCurrentPw ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Paper>
              </Grid>

              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={updateMutation.isPending}
                  startIcon={<SaveOutlined />}
                  sx={{ borderRadius: '8px', fontWeight: 700 }}
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Preferences'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </Card>
      )}
    </Box>
  );
};

export default UserProfilePage;
