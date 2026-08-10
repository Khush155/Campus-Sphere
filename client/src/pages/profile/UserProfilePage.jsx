import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Chip,
  CircularProgress,
  useTheme,
  Avatar,
  Divider,
  IconButton,
  InputAdornment,
  MenuItem,
  Tooltip,
  LinearProgress,
  Skeleton,
  Collapse,
  Alert,
} from '@mui/material';
import {
  PersonOutlined,
  EmailOutlined,
  PhoneOutlined,
  LockOutlined,
  BadgeOutlined,
  BusinessOutlined,
  SaveOutlined,
  Visibility,
  VisibilityOff,
  PhotoCameraOutlined,
  SchoolOutlined,
  ContactPhoneOutlined,
  LocationOnOutlined,
  AccessTimeOutlined,
  NotificationsActiveOutlined,
  SecurityOutlined,
  KeyOutlined,
  ExpandMoreOutlined,
  ExpandLessOutlined,
  LockPersonOutlined,
  WarningAmberOutlined,
  InfoOutlined,
} from '@mui/icons-material';

import { useMyProfileQuery, useUpdateMyProfileMutation } from '../../queries/userProfileQueries';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getFullAvatarUrl = (relativeUrl) => {
  if (!relativeUrl) return undefined;
  if (
    relativeUrl.startsWith('http://') ||
    relativeUrl.startsWith('https://') ||
    relativeUrl.startsWith('data:')
  ) {
    return relativeUrl;
  }
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
  const rootUrl = baseUrl.replace(/\/api\/v1\/?$/, '');
  const cleanRelative = relativeUrl.startsWith('/') ? relativeUrl : `/${relativeUrl}`;
  return `${rootUrl}${cleanRelative}`;
};

const ROLE_LABELS = {
  SUPER_ADMIN: 'Super Admin',
  COLLEGE_ADMIN: 'College Admin',
  HOD: 'Head of Department',
  FACULTY: 'Faculty',
  STUDENT: 'Student',
};

const ROLE_COLORS = {
  SUPER_ADMIN: 'error',
  COLLEGE_ADMIN: 'warning',
  HOD: 'secondary',
  FACULTY: 'primary',
  STUDENT: 'success',
};

// ─── ReadOnlyField ────────────────────────────────────────────────────────────

const ReadOnlyField = ({ label, value, icon: Icon }) => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        p: 1.75,
        borderRadius: '10px',
        bgcolor: theme.custom?.surface?.sunken ||
          (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#F8FAFC'),
        border: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
        opacity: 0.85,
      }}
    >
      {Icon && <Icon sx={{ fontSize: 18, color: 'text.disabled', flexShrink: 0 }} />}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="caption"
          sx={{
            fontFamily: '"IBM Plex Sans", sans-serif',
            color: 'text.disabled',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            fontSize: '0.68rem',
            display: 'block',
          }}
        >
          {label}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            fontFamily: '"IBM Plex Sans", sans-serif',
            color: 'text.secondary',
            fontWeight: 500,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {value || '—'}
        </Typography>
      </Box>
      <Tooltip title="Contact admin to change">
        <LockPersonOutlined sx={{ fontSize: 14, color: 'text.disabled', flexShrink: 0 }} />
      </Tooltip>
    </Box>
  );
};

// ─── SectionCard ──────────────────────────────────────────────────────────────

const SectionCard = ({ title, subtitle, icon: Icon, iconColor = 'primary', children, sx = {} }) => {
  const theme = useTheme();
  return (
    <Card
      elevation={0}
      sx={{
        mb: 3,
        borderRadius: '16px',
        border: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
        bgcolor: theme.custom?.surface?.raised || theme.palette.background.paper,
        ...sx,
      }}
    >
      <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 3 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '10px',
              bgcolor: `${theme.palette[iconColor]?.main}18`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon sx={{ fontSize: 20, color: `${iconColor}.main` }} />
          </Box>
          <Box>
            <Typography
              variant="h6"
              sx={{ fontFamily: '"IBM Plex Sans", sans-serif', fontWeight: 700, color: 'text.primary', lineHeight: 1.2 }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography
                variant="caption"
                sx={{ fontFamily: '"IBM Plex Sans", sans-serif', color: 'text.secondary', display: 'block', mt: 0.25 }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
        {children}
      </CardContent>
    </Card>
  );
};

// ─── ProfileSkeleton ──────────────────────────────────────────────────────────

const ProfileSkeleton = () => (
  <Box>
    <Card elevation={0} sx={{ mb: 3, borderRadius: '20px', overflow: 'hidden' }}>
      <Skeleton variant="rectangular" height={160} />
      <Box sx={{ p: 3, display: 'flex', alignItems: 'flex-end', gap: 2.5, mt: -7 }}>
        <Skeleton variant="circular" width={120} height={120} />
        <Box sx={{ flex: 1, pb: 1 }}>
          <Skeleton variant="text" width="40%" height={36} />
          <Skeleton variant="text" width="25%" height={24} sx={{ mt: 0.5 }} />
          <Skeleton variant="text" width="60%" height={20} sx={{ mt: 1 }} />
        </Box>
      </Box>
    </Card>
    {[0, 1, 2].map((i) => (
      <Card key={i} elevation={0} sx={{ mb: 3, borderRadius: '16px' }}>
        <CardContent sx={{ p: 3.5 }}>
          <Box sx={{ display: 'flex', gap: 1.5, mb: 3 }}>
            <Skeleton variant="rounded" width={40} height={40} />
            <Box>
              <Skeleton variant="text" width={160} height={24} />
              <Skeleton variant="text" width={240} height={18} sx={{ mt: 0.5 }} />
            </Box>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            {[0, 1, 2, 3].map((j) => <Skeleton key={j} variant="rounded" height={56} />)}
          </Box>
        </CardContent>
      </Card>
    ))}
  </Box>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const UserProfilePage = () => {
  const theme = useTheme();
  const { showToast } = useToast();
  const { user: authUser } = useAuth();
  const fileInputRef = useRef(null);
  const isDark = theme.palette.mode === 'dark';

  const personalRef = useRef(null);
  const institutionalRef = useRef(null);
  const emergencyRef = useRef(null);

  // ── State ──────────────────────────────────────────────────────────────────
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
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  // ── Data ───────────────────────────────────────────────────────────────────
  const { data: profileData, isLoading, refetch } = useMyProfileQuery();
  const updateMutation = useUpdateMyProfileMutation();

  // profileData is { user, profileMeta } — correctly nested after the query fix
  const user = profileData?.user || authUser;
  const profileMeta = profileData?.profileMeta;

  useEffect(() => {
    if (user) {
      setProfileForm({
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
      });
      setAvatarPreview(null);
    }
  }, [user]);

  // ── Derived values ─────────────────────────────────────────────────────────
  // Priority: local preview (instant) > DB-stored URL
  const displayAvatarUrl = useMemo(() => {
    if (avatarPreview) return avatarPreview;
    return getFullAvatarUrl(user?.profilePicUrl);
  }, [avatarPreview, user?.profilePicUrl]);

  const { score: profileCompletion, mostIncomplete } = useMemo(() => {
    let s = 0;
    const missing = [];
    if (profileForm.name) s += 20; else missing.push('name');
    if (profileForm.phoneNumber) s += 10; else missing.push('phone');
    if (user?.profilePicUrl || avatarPreview) s += 20; else missing.push('photo');
    if (profileForm.bio) s += 10; else missing.push('bio');
    if (profileForm.qualification) s += 15; else missing.push('qualification');
    if (profileForm.officeRoom || profileForm.officeHours) s += 10; else missing.push('institutional');
    if (profileForm.emergencyContactName && profileForm.emergencyContactPhone) s += 15;
    else missing.push('emergency');
    return { score: Math.min(s, 100), mostIncomplete: missing[0] || null };
  }, [profileForm, user?.profilePicUrl, avatarPreview]);

  const jumpToIncomplete = () => {
    const refMap = {
      name: personalRef, phone: personalRef, photo: personalRef, bio: personalRef,
      qualification: institutionalRef, institutional: institutionalRef,
      emergency: emergencyRef,
    };
    const target = refMap[mostIncomplete];
    if (target?.current) target.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleFieldChange = (field) => (e) => {
    setProfileForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (fieldErrors[field]) setFieldErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handlePasswordFieldChange = (field) => (e) => {
    setPasswordForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (fieldErrors[field]) setFieldErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast('Image must be under 5MB.', { severity: 'error' }); return; }
    if (!file.type.startsWith('image/')) { showToast('Please select a valid image file.', { severity: 'error' }); return; }
    const reader = new FileReader();
    reader.onload = (evt) => {
      const b64 = evt.target?.result;
      if (b64) {
        setAvatarPreview(b64);
        setProfileForm((prev) => ({ ...prev, profilePicUrl: b64 }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!profileForm.name.trim()) {
      setFieldErrors({ name: 'Name is required.' });
      return;
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
      },
      {
        onSuccess: () => {
          showToast('Profile saved!', { severity: 'success' });
          setAvatarPreview(null);
          refetch();
        },
        onError: (err) =>
          showToast(err.response?.data?.message || 'Failed to save profile.', { severity: 'error' }),
      }
    );
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    const errors = {};
    if (!passwordForm.currentPassword) errors.currentPassword = 'Current password is required.';
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 6)
      errors.newPassword = 'New password must be at least 6 characters.';
    if (passwordForm.newPassword !== passwordForm.confirmPassword)
      errors.confirmPassword = 'Passwords do not match.';
    if (Object.keys(errors).length) { setFieldErrors(errors); return; }

    updateMutation.mutate(
      { currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword },
      {
        onSuccess: () => {
          showToast('Password changed!', { severity: 'success' });
          setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
          setShowPasswordSection(false);
          refetch();
        },
        onError: (err) => {
          const msg = err.response?.data?.message || '';
          if (msg.toLowerCase().includes('incorrect')) {
            setFieldErrors((prev) => ({ ...prev, currentPassword: 'Incorrect password.' }));
          } else {
            showToast(msg || 'Failed to change password.', { severity: 'error' });
          }
        },
      }
    );
  };

  const isSaving = updateMutation.isPending;
  const completionColor = profileCompletion >= 80 ? 'success' : profileCompletion >= 50 ? 'warning' : 'error';
  const department = user?.departmentId?.name || user?.department || null;
  const isStudent = user?.role === 'STUDENT';
  const isFacultyLike = user?.role === 'FACULTY' || user?.role === 'HOD';

  // ── Render ─────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', px: { xs: 2, sm: 3 }, py: 3 }}>
        <ProfileSkeleton />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', px: { xs: 2, sm: 3 }, py: 3 }}>

      {/* ── HERO BANNER ──────────────────────────────────────────────────── */}
      <Card
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: '20px',
          overflow: 'hidden',
          border: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
          bgcolor: theme.custom?.surface?.raised || theme.palette.background.paper,
        }}
      >
        {/* Cover gradient using theme primary */}
        <Box
          sx={{
            height: 160,
            background: isDark
              ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark || theme.palette.primary.main} 100%)`
              : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main || theme.palette.primary.light} 100%)`,
          }}
        />

        <Box sx={{ px: { xs: 2.5, sm: 4 }, pb: 3, pt: 0 }}>
          {/* Avatar + identity row */}
          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2.5, flexWrap: 'wrap' }}>
            <Box sx={{ position: 'relative', mt: -6.5, flexShrink: 0 }}>
              <Avatar
                src={displayAvatarUrl}
                sx={{
                  width: 120,
                  height: 120,
                  border: `4px solid ${theme.custom?.surface?.raised || theme.palette.background.paper}`,
                  bgcolor: theme.palette.primary.main,
                  fontSize: '2.8rem',
                  fontWeight: 800,
                  boxShadow: isDark
                    ? '0 8px 24px rgba(0,0,0,0.5)'
                    : '0 8px 24px rgba(0,0,0,0.15)',
                  transition: 'box-shadow 0.2s ease',
                  '&:hover': {
                    boxShadow: `0 0 0 4px ${theme.palette.primary.main}55`,
                  },
                }}
              >
                {user?.name?.charAt(0)?.toUpperCase() || '?'}
              </Avatar>

              <Tooltip title="Change profile photo">
                <IconButton
                  id="btn-change-avatar"
                  onClick={() => fileInputRef.current?.click()}
                  size="small"
                  sx={{
                    position: 'absolute',
                    bottom: 2,
                    right: 2,
                    bgcolor: theme.palette.primary.main,
                    color: '#fff',
                    width: 32,
                    height: 32,
                    border: `2px solid ${theme.custom?.surface?.raised || theme.palette.background.paper}`,
                    '&:hover': { bgcolor: theme.palette.primary.dark, transform: 'scale(1.1)' },
                    transition: 'all 0.2s ease',
                  }}
                >
                  <PhotoCameraOutlined sx={{ fontSize: 15 }} />
                </IconButton>
              </Tooltip>
              <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleFileSelect} />
            </Box>

            <Box sx={{ pb: 0.5, flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mt: 1 }}>
                <Typography
                  variant="h4"
                  sx={{
                    fontFamily: '"Fraunces", "Source Serif 4", serif',
                    fontWeight: 700,
                    color: 'text.primary',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {user?.name || 'Your Name'}
                </Typography>
                {user?.role && (
                  <Chip
                    label={ROLE_LABELS[user.role] || user.role}
                    color={ROLE_COLORS[user.role] || 'default'}
                    size="small"
                    sx={{ fontWeight: 700, borderRadius: '6px', fontSize: '0.72rem' }}
                  />
                )}
              </Box>
              <Typography
                variant="body2"
                sx={{ fontFamily: '"IBM Plex Sans", sans-serif', color: 'text.secondary', mt: 0.5 }}
              >
                {user?.email}
                {department && ` · ${department}`}
                {isStudent && profileMeta?.rollNumber && (
                  <Box
                    component="span"
                    sx={{ fontFamily: '"IBM Plex Mono", monospace', ml: 1, fontSize: '0.8rem' }}
                  >
                    · {profileMeta.rollNumber}
                  </Box>
                )}
              </Typography>
            </Box>
          </Box>

          {/* Instant preview notice */}
          {avatarPreview && (
            <Alert severity="info" sx={{ mt: 2, borderRadius: '10px', py: 0.5 }}>
              New photo selected — click <strong>Save Profile</strong> below to apply permanently.
            </Alert>
          )}

          {/* Completeness bar */}
          <Box
            sx={{ mt: 2.5, cursor: mostIncomplete ? 'pointer' : 'default' }}
            onClick={mostIncomplete ? jumpToIncomplete : undefined}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
              <Typography
                variant="caption"
                sx={{
                  fontFamily: '"IBM Plex Sans", sans-serif',
                  fontWeight: 700,
                  color: 'text.secondary',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  fontSize: '0.68rem',
                }}
              >
                Profile Completeness
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontFamily: '"IBM Plex Mono", monospace',
                  fontWeight: 700,
                  color: `${completionColor}.main`,
                }}
              >
                {profileCompletion}%
                {mostIncomplete && ' · tap to jump'}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={profileCompletion}
              color={completionColor}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: theme.custom?.border?.subtle || theme.palette.divider,
                '& .MuiLinearProgress-bar': { borderRadius: 3 },
              }}
            />
          </Box>
        </Box>
      </Card>

      {/* ── SECTION 1: PERSONAL INFORMATION ──────────────────────────────── */}
      <Box ref={personalRef}>
        <SectionCard
          title="Personal Information"
          subtitle="Basic profile details visible to colleagues"
          icon={PersonOutlined}
          iconColor="primary"
        >
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
            <ReadOnlyField label="Email Address" value={user?.email} icon={EmailOutlined} />
            <ReadOnlyField label="Role" value={ROLE_LABELS[user?.role] || user?.role} icon={BadgeOutlined} />

            <TextField
              id="field-name"
              label="Full Name"
              value={profileForm.name}
              onChange={handleFieldChange('name')}
              error={!!fieldErrors.name}
              helperText={fieldErrors.name}
              fullWidth
              required
              size="small"
              sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}
            />
            <TextField
              id="field-phone"
              label="Phone Number"
              value={profileForm.phoneNumber}
              onChange={handleFieldChange('phoneNumber')}
              fullWidth
              size="small"
              placeholder="+91 XXXXX XXXXX"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneOutlined sx={{ fontSize: 16, color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              id="field-notification"
              label="Notification Preference"
              value={profileForm.notificationPreference}
              onChange={handleFieldChange('notificationPreference')}
              fullWidth
              size="small"
              select
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <NotificationsActiveOutlined sx={{ fontSize: 16, color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
            >
              <MenuItem value="EMAIL_AND_PORTAL">Email &amp; Portal</MenuItem>
              <MenuItem value="EMAIL_ONLY">Email Only</MenuItem>
              <MenuItem value="PORTAL_ONLY">Portal Only</MenuItem>
              <MenuItem value="NONE">None</MenuItem>
            </TextField>
            <TextField
              id="field-bio"
              label="Bio"
              value={profileForm.bio}
              onChange={handleFieldChange('bio')}
              fullWidth
              multiline
              minRows={3}
              size="small"
              placeholder="A short description about yourself…"
              sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}
            />
          </Box>
        </SectionCard>
      </Box>

      {/* ── SECTION 2: INSTITUTIONAL / ACADEMIC ──────────────────────────── */}
      {isFacultyLike && (
        <Box ref={institutionalRef}>
          <SectionCard
            title="Institutional Details"
            subtitle="Faculty-specific information shown to students"
            icon={SchoolOutlined}
            iconColor="secondary"
          >
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
              {department && (
                <ReadOnlyField label="Department" value={department} icon={BusinessOutlined} />
              )}
              <TextField
                id="field-office-room"
                label="Office Room"
                value={profileForm.officeRoom}
                onChange={handleFieldChange('officeRoom')}
                fullWidth size="small" placeholder="e.g. Room 204, Block A"
                InputProps={{ startAdornment: <InputAdornment position="start"><LocationOnOutlined sx={{ fontSize: 16, color: 'text.disabled' }} /></InputAdornment> }}
              />
              <TextField
                id="field-office-hours"
                label="Consultation Hours"
                value={profileForm.officeHours}
                onChange={handleFieldChange('officeHours')}
                fullWidth size="small" placeholder="e.g. Mon–Wed 2–4 PM"
                InputProps={{ startAdornment: <InputAdornment position="start"><AccessTimeOutlined sx={{ fontSize: 16, color: 'text.disabled' }} /></InputAdornment> }}
              />
              <TextField
                id="field-qualification"
                label="Qualification"
                value={profileForm.qualification}
                onChange={handleFieldChange('qualification')}
                fullWidth size="small" placeholder="e.g. Ph.D Computer Science"
              />
              <TextField
                id="field-specialization"
                label="Specialization"
                value={profileForm.specialization}
                onChange={handleFieldChange('specialization')}
                fullWidth size="small" placeholder="e.g. Machine Learning, Networks"
                sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}
              />
            </Box>
          </SectionCard>
        </Box>
      )}

      {isStudent && profileMeta && (
        <Box ref={institutionalRef}>
          <SectionCard
            title="Academic Enrollment"
            subtitle="Contact admin to update academic records"
            icon={SchoolOutlined}
            iconColor="secondary"
          >
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <ReadOnlyField label="Roll Number" value={profileMeta.rollNumber} icon={BadgeOutlined} />
              <ReadOnlyField label="Programme" value={profileMeta.course} icon={SchoolOutlined} />
              <ReadOnlyField label="Branch" value={profileMeta.branch} icon={BusinessOutlined} />
              <ReadOnlyField label="Semester" value={profileMeta.semester ? `Semester ${profileMeta.semester}` : null} icon={InfoOutlined} />
              <ReadOnlyField label="Group" value={profileMeta.group} icon={InfoOutlined} />
              <ReadOnlyField label="Shift" value={profileMeta.shift} icon={AccessTimeOutlined} />
            </Box>
          </SectionCard>
        </Box>
      )}

      {/* ── SECTION 3: EMERGENCY CONTACT ─────────────────────────────────── */}
      <Box ref={emergencyRef}>
        <SectionCard
          title="Emergency Contact"
          subtitle="Who to contact in case of an emergency"
          icon={ContactPhoneOutlined}
          iconColor="warning"
        >
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
            <TextField
              id="field-emergency-name"
              label="Contact Name"
              value={profileForm.emergencyContactName}
              onChange={handleFieldChange('emergencyContactName')}
              fullWidth size="small" placeholder="e.g. Parent or Guardian"
            />
            <TextField
              id="field-emergency-phone"
              label="Contact Phone"
              value={profileForm.emergencyContactPhone}
              onChange={handleFieldChange('emergencyContactPhone')}
              fullWidth size="small" placeholder="+91 XXXXX XXXXX"
              InputProps={{ startAdornment: <InputAdornment position="start"><PhoneOutlined sx={{ fontSize: 16, color: 'text.disabled' }} /></InputAdornment> }}
            />
          </Box>
        </SectionCard>
      </Box>

      {/* ── SAVE PROFILE ─────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 4 }}>
        <Button
          id="btn-save-profile"
          variant="contained"
          color="primary"
          size="large"
          startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : <SaveOutlined />}
          onClick={handleSaveProfile}
          disabled={isSaving}
          sx={{ px: 4, py: 1.25, fontWeight: 700, fontFamily: '"IBM Plex Sans", sans-serif', borderRadius: '10px' }}
        >
          {isSaving ? 'Saving…' : 'Save Profile'}
        </Button>
      </Box>

      {/* ── SECTION 4: CHANGE PASSWORD ────────────────────────────────────── */}
      <Card
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: '16px',
          border: `1px solid ${isDark ? 'rgba(239,68,68,0.25)' : 'rgba(239,68,68,0.2)'}`,
          bgcolor: isDark ? 'rgba(239,68,68,0.04)' : 'rgba(239,68,68,0.02)',
        }}
      >
        <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
          {/* Toggle header */}
          <Box
            id="btn-toggle-password"
            onClick={() => setShowPasswordSection((v) => !v)}
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none' }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 40, height: 40, borderRadius: '10px',
                  bgcolor: 'rgba(239,68,68,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <SecurityOutlined sx={{ fontSize: 20, color: 'error.main' }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontFamily: '"IBM Plex Sans", sans-serif', fontWeight: 700, color: 'text.primary', lineHeight: 1.2 }}>
                  Change Password
                </Typography>
                <Typography variant="caption" sx={{ fontFamily: '"IBM Plex Sans", sans-serif', color: 'text.secondary' }}>
                  Requires your current password to verify identity
                </Typography>
              </Box>
            </Box>
            <IconButton size="small" sx={{ color: 'text.secondary', pointerEvents: 'none' }}>
              {showPasswordSection ? <ExpandLessOutlined /> : <ExpandMoreOutlined />}
            </IconButton>
          </Box>

          <Collapse in={showPasswordSection}>
            <Divider sx={{ my: 2.5 }} />
            <Alert severity="warning" icon={<WarningAmberOutlined />} sx={{ mb: 2.5, borderRadius: '10px' }}>
              You will need to sign in again on other devices after changing your password.
            </Alert>

            <Box
              component="form"
              id="form-change-password"
              onSubmit={handleChangePassword}
              sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}
            >
              <TextField
                id="field-current-password"
                label="Current Password"
                type={showCurrentPw ? 'text' : 'password'}
                value={passwordForm.currentPassword}
                onChange={handlePasswordFieldChange('currentPassword')}
                error={!!fieldErrors.currentPassword}
                helperText={fieldErrors.currentPassword}
                fullWidth size="small" required
                sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><KeyOutlined sx={{ fontSize: 16, color: 'text.disabled' }} /></InputAdornment>,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowCurrentPw((v) => !v)} edge="end">
                        {showCurrentPw ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                id="field-new-password"
                label="New Password"
                type={showNewPw ? 'text' : 'password'}
                value={passwordForm.newPassword}
                onChange={handlePasswordFieldChange('newPassword')}
                error={!!fieldErrors.newPassword}
                helperText={fieldErrors.newPassword || 'Minimum 6 characters'}
                fullWidth size="small" required
                InputProps={{
                  startAdornment: <InputAdornment position="start"><LockOutlined sx={{ fontSize: 16, color: 'text.disabled' }} /></InputAdornment>,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowNewPw((v) => !v)} edge="end">
                        {showNewPw ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                id="field-confirm-password"
                label="Confirm New Password"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordFieldChange('confirmPassword')}
                error={!!fieldErrors.confirmPassword}
                helperText={fieldErrors.confirmPassword}
                fullWidth size="small" required
                InputProps={{ startAdornment: <InputAdornment position="start"><LockOutlined sx={{ fontSize: 16, color: 'text.disabled' }} /></InputAdornment> }}
              />

              <Box sx={{ gridColumn: { xs: '1', sm: '1 / -1' }, display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={() => {
                    setShowPasswordSection(false);
                    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    setFieldErrors({});
                  }}
                  sx={{ borderRadius: '10px' }}
                >
                  Cancel
                </Button>
                <Button
                  id="btn-update-password"
                  type="submit"
                  variant="contained"
                  color="error"
                  startIcon={isSaving ? <CircularProgress size={14} color="inherit" /> : <SecurityOutlined />}
                  disabled={isSaving}
                  sx={{ borderRadius: '10px', fontWeight: 700, fontFamily: '"IBM Plex Sans", sans-serif' }}
                >
                  {isSaving ? 'Updating…' : 'Update Password'}
                </Button>
              </Box>
            </Box>
          </Collapse>
        </CardContent>
      </Card>

    </Box>
  );
};

export default UserProfilePage;

