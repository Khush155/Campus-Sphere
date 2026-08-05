import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Box,
  Typography,
  Card,
  TextField,
  Button,
  Grid,
  Skeleton,
  Alert,
  useTheme,
  CircularProgress,
  Chip,
  Divider,
} from '@mui/material';
import {
  CloudUploadOutlined,
  SaveOutlined,
  AccountBalanceOutlined,
  VerifiedUserOutlined,
  SchoolOutlined,
} from '@mui/icons-material';
import { useToast } from '../../../contexts/ToastContext';

import {
  useCollegeProfileQuery,
  useUpdateCollegeProfileMutation,
  useUploadLogoMutation,
} from '../../../queries/collegeProfileQueries';

const profileFormSchema = z.object({
  name: z
    .string()
    .min(1, 'College name is required')
    .max(150, 'College name cannot exceed 150 characters')
    .trim(),
  affiliation: z
    .string()
    .max(200, 'Affiliation info cannot exceed 200 characters')
    .trim()
    .optional()
    .or(z.literal('')),
  address: z
    .string()
    .max(300, 'Address cannot exceed 300 characters')
    .trim()
    .optional()
    .or(z.literal('')),
  contactEmail: z
    .string()
    .email('Invalid contact email format')
    .trim()
    .optional()
    .or(z.literal(''))
    .or(z.null()),
  contactPhone: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .or(z.null()),
});

export const CollegeProfile = () => {
  const theme = useTheme();
  const { showToast } = useToast();

  // Logo file state
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Queries & Mutations
  const { data: profile, isLoading, error, refetch } = useCollegeProfileQuery();
  const updateProfileMutation = useUpdateCollegeProfileMutation();
  const uploadLogoMutation = useUploadLogoMutation();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: '',
      affiliation: '',
      address: '',
      contactEmail: '',
      contactPhone: '',
    },
  });

  const watchName = watch('name');
  const watchAffiliation = watch('affiliation');
  const watchAddress = watch('address');

  // Load values when query resolves
  useEffect(() => {
    if (profile) {
      reset({
        name: profile.name || '',
        affiliation: profile.affiliation || '',
        address: profile.address || '',
        contactEmail: profile.contactEmail || '',
        contactPhone: profile.contactPhone || '',
      });
    }
  }, [profile, reset]);

  // Clean preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      showToast('File size exceeds 10MB limit.', { severity: 'error' });
      return;
    }

    // Validate type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showToast('Only JPEG, PNG, and WEBP images are supported.', { severity: 'error' });
      return;
    }

    setSelectedFile(file);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUploadLogo = async () => {
    if (!selectedFile) return;
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('logo', selectedFile);
      await uploadLogoMutation.mutateAsync(formData);
      showToast('College logo uploaded successfully.');
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to upload logo.', { severity: 'error' });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleFormSubmit = async (data) => {
    try {
      await updateProfileMutation.mutateAsync(data);
      showToast('College profile details updated successfully.');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update college details.', { severity: 'error' });
    }
  };

  const getFullLogoUrl = (relativeUrl) => {
    if (!relativeUrl) return null;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
    const rootUrl = baseUrl.replace('/api/v1', '');
    return `${rootUrl}${relativeUrl}`;
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Skeleton variant="text" width="30%" height={40} />
        <Grid container spacing={4}>
          <Grid item xs={12} md={7}>
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: '12px' }} />
          </Grid>
          <Grid item xs={12} md={5}>
            <Skeleton variant="rectangular" height={300} sx={{ borderRadius: '12px' }} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => refetch()}>Retry</Button>}>
          Failed to load college profile configuration.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5, pb: 6 }}>
      {/* ── 1. Hero Identity Banner Card ───────────────────────────────────── */}
      <Card
        sx={{
          p: 3.5,
          borderRadius: '16px',
          border: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
          background: `linear-gradient(135deg, ${theme.palette.primary.main}0F 0%, ${theme.palette.brass?.[500] || '#b8863e'}08 100%)`,
          boxShadow: theme.custom?.elevation?.raised || 'none',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, flexWrap: 'wrap' }}>
            <Chip
              icon={<AccountBalanceOutlined sx={{ fontSize: '0.9rem !important', color: `${theme.palette.primary.main} !important` }} />}
              label="INSTITUTIONAL BRANDING & PROFILE"
              size="small"
              sx={{
                bgcolor: `${theme.palette.primary.main}15`,
                color: theme.palette.primary.main,
                fontFamily: theme.typography.mono.fontFamily,
                fontWeight: 700,
                fontSize: '0.68rem',
                letterSpacing: '0.06em',
                borderRadius: '6px',
              }}
            />
            <Chip
              icon={<VerifiedUserOutlined sx={{ fontSize: '0.8rem !important' }} />}
              label="Official Profile Active"
              size="small"
              color="success"
              sx={{ fontSize: '0.72rem', fontWeight: 700 }}
            />
          </Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontFamily: theme.typography.h1.fontFamily,
              fontWeight: 600,
              color: theme.palette.ink[900],
              lineHeight: 1.15,
              mb: 0.5,
            }}
          >
            College Profile Settings
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontFamily: theme.typography.body2.fontFamily,
              color: theme.palette.text.secondary,
              maxWidth: 640,
            }}
          >
            Manage institution details, branding logos, physical address, and affiliation metadata displayed across documents.
          </Typography>
        </Box>
      </Card>

      {/* ── 2. Main Equal Height Grid ──────────────────────────────────────── */}
      <Grid container spacing={3.5} alignItems="stretch">
        {/* Form Details Column */}
        <Grid item xs={12} md={7} sx={{ display: 'flex' }}>
          <Card
            component="form"
            onSubmit={handleSubmit(handleFormSubmit)}
            sx={{
              width: '100%',
              height: '100%',
              p: 4,
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: 'none',
              borderRadius: '16px',
              bgcolor: theme.custom?.surface?.raised || theme.palette.background.paper,
              display: 'flex',
              flexDirection: 'column',
              justify: 'space-between',
              gap: 3,
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Institution Details
              </Typography>

              <Grid container spacing={2.5}>
                <Grid item xs={12}>
                  <Typography component="label" htmlFor="college-name-input" sx={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, mb: 1, color: theme.palette.ink[900] }}>
                    College Name *
                  </Typography>
                  <TextField
                    id="college-name-input"
                    fullWidth
                    size="small"
                    {...register('name')}
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography component="label" htmlFor="affiliation-input" sx={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, mb: 1, color: theme.palette.ink[900] }}>
                    Affiliation Info
                  </Typography>
                  <TextField
                    id="affiliation-input"
                    fullWidth
                    size="small"
                    placeholder="e.g. Affiliated to State Technological University"
                    {...register('affiliation')}
                    error={!!errors.affiliation}
                    helperText={errors.affiliation?.message}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography component="label" htmlFor="address-input" sx={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, mb: 1, color: theme.palette.ink[900] }}>
                    Campus Address
                  </Typography>
                  <TextField
                    id="address-input"
                    fullWidth
                    size="small"
                    multiline
                    rows={3}
                    placeholder="Enter full physical address"
                    {...register('address')}
                    error={!!errors.address}
                    helperText={errors.address?.message}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography component="label" htmlFor="contact-email-input" sx={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, mb: 1, color: theme.palette.ink[900] }}>
                    Contact Email
                  </Typography>
                  <TextField
                    id="contact-email-input"
                    fullWidth
                    size="small"
                    placeholder="e.g. contact@college.edu"
                    {...register('contactEmail')}
                    error={!!errors.contactEmail}
                    helperText={errors.contactEmail?.message}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography component="label" htmlFor="contact-phone-input" sx={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, mb: 1, color: theme.palette.ink[900] }}>
                    Contact Phone
                  </Typography>
                  <TextField
                    id="contact-phone-input"
                    fullWidth
                    size="small"
                    placeholder="e.g. +91 98765 43210"
                    {...register('contactPhone')}
                    error={!!errors.contactPhone}
                    helperText={errors.contactPhone?.message}
                  />
                </Grid>
              </Grid>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
              <Button
                type="submit"
                variant="contained"
                disabled={!isDirty || updateProfileMutation.isPending}
                startIcon={updateProfileMutation.isPending ? <CircularProgress size={20} color="inherit" /> : <SaveOutlined />}
                sx={{
                  background: theme.palette.primary.gradient || theme.palette.primary.main,
                  color: '#ffffff',
                  fontWeight: 700,
                  textTransform: 'none',
                  borderRadius: '8px',
                  px: 4,
                  height: '42px',
                  boxShadow: `0 4px 14px ${theme.palette.primary.main}35`,
                  '&.Mui-disabled': { bgcolor: 'rgba(28, 46, 69, 0.12)' },
                }}
              >
                Save Details
              </Button>
            </Box>
          </Card>
        </Grid>

        {/* Logo Configuration & Live Crest Preview Column */}
        <Grid item xs={12} md={5} sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
          {/* Logo Upload Card */}
          <Card
            sx={{
              p: 4,
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: 'none',
              borderRadius: '16px',
              bgcolor: theme.custom?.surface?.raised || theme.palette.background.paper,
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Branding & Institutional Seal
            </Typography>

            {/* Current Logo / Preview */}
            <Box
              sx={{
                width: '100%',
                height: 160,
                border: `1px dashed ${theme.palette.divider}`,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: theme.custom?.surface?.sunken || 'rgba(0,0,0,0.02)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {previewUrl ? (
                <Box
                  component="img"
                  src={previewUrl}
                  alt="New logo preview"
                  sx={{ width: 'auto', maxHeight: '100%', objectFit: 'contain', p: 1.5 }}
                />
              ) : profile?.logoUrl ? (
                <Box
                  component="img"
                  src={getFullLogoUrl(profile.logoUrl)}
                  alt={`${profile?.name} logo`}
                  sx={{ width: 'auto', maxHeight: '100%', objectFit: 'contain', p: 1.5 }}
                />
              ) : (
                <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
                  <SchoolOutlined sx={{ fontSize: 36, color: 'text.disabled', mb: 0.5 }} />
                  <Typography variant="body2" sx={{ fontSize: '0.82rem' }}>
                    No logo uploaded yet
                  </Typography>
                </Box>
              )}
            </Box>

            {/* File Inputs & Upload */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUploadOutlined />}
                sx={{ textTransform: 'none', fontWeight: 600, py: 1, borderRadius: '8px' }}
              >
                Select Logo Image
                <input
                  type="file"
                  hidden
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                />
              </Button>

              {selectedFile && (
                <Button
                  variant="contained"
                  onClick={handleUploadLogo}
                  disabled={uploadingLogo}
                  startIcon={uploadingLogo ? <CircularProgress size={20} color="inherit" /> : null}
                  sx={{
                    background: theme.palette.primary.gradient || theme.palette.primary.main,
                    color: '#ffffff',
                    fontWeight: 700,
                    textTransform: 'none',
                    borderRadius: '8px',
                    height: '40px',
                  }}
                >
                  Upload & Apply Logo
                </Button>
              )}

              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center' }}>
                Accepted types: JPEG, PNG, WEBP. Max size: 10MB.
              </Typography>
            </Box>
          </Card>

          {/* Live Document Header Crest Preview Card */}
          <Card
            sx={{
              p: 3,
              border: `1px dashed ${theme.palette.primary.main}60`,
              borderRadius: '16px',
              bgcolor: theme.custom?.surface?.raised || theme.palette.background.paper,
              boxShadow: 'none',
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.primary.main, fontFamily: theme.typography.mono.fontFamily, letterSpacing: '0.05em', mb: 1.5, display: 'block' }}>
              LIVE DOCUMENT HEADER CREST PREVIEW
            </Typography>

            <Box
              sx={{
                p: 2.5,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: '12px',
                bgcolor: theme.palette.background.paper,
                textAlign: 'center',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, mb: 1 }}>
                {previewUrl ? (
                  <Box component="img" src={previewUrl} alt="Logo" sx={{ height: 36, objectFit: 'contain' }} />
                ) : profile?.logoUrl ? (
                  <Box component="img" src={getFullLogoUrl(profile.logoUrl)} alt="Logo" sx={{ height: 36, objectFit: 'contain' }} />
                ) : (
                  <SchoolOutlined sx={{ fontSize: 32, color: theme.palette.primary.main }} />
                )}
              </Box>

              <Typography variant="h6" sx={{ fontFamily: theme.typography.h1.fontFamily, fontWeight: 700, fontSize: '1rem', color: theme.palette.ink[900] }}>
                {watchName || profile?.name || 'CAMPUS SPHERE ACADEMY'}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.72rem', fontFamily: theme.typography.mono.fontFamily }}>
                {watchAffiliation || profile?.affiliation || 'Affiliated to State University'}
              </Typography>
              {watchAddress && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem', mt: 0.5 }}>
                  {watchAddress}
                </Typography>
              )}

              <Divider sx={{ my: 1.5 }} />

              <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic', fontSize: '0.7rem' }}>
                This header renders on official Student Certificates & PDF Reports.
              </Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* ── 3. Security & Permission Access Control Matrix Card ──────────── */}
      <Card
        sx={{
          p: 4,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: '16px',
          boxShadow: 'none',
          bgcolor: theme.custom?.surface?.raised || theme.palette.background.paper,
          mt: 1,
        }}
      >
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.ink[900] }}>
            Security & Role Access Control Matrix
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Enforced institutional authorization rules and API access boundaries across system roles.
          </Typography>
        </Box>

        <Box sx={{ overflowX: 'auto' }}>
          <Box
            component="table"
            sx={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.82rem',
              '& th, & td': {
                p: 1.5,
                borderBottom: `1px solid ${theme.palette.divider}`,
                textAlign: 'center',
              },
              '& th:first-of-type, & td:first-of-type': {
                textAlign: 'left',
              },
            }}
          >
            <Box component="thead" sx={{ bgcolor: theme.custom?.surface?.sunken || 'rgba(0,0,0,0.02)' }}>
              <Box component="tr">
                <Box component="th" sx={{ fontWeight: 700 }}>SYSTEM CAPABILITY / RESOURCE</Box>
                <Box component="th" sx={{ fontWeight: 700, color: theme.palette.brass?.[500] || '#b8863e' }}>SUPER ADMIN</Box>
                <Box component="th" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>COLLEGE ADMIN</Box>
                <Box component="th" sx={{ fontWeight: 700, color: '#8b5cf6' }}>HOD</Box>
                <Box component="th" sx={{ fontWeight: 700, color: '#10b981' }}>FACULTY</Box>
                <Box component="th" sx={{ fontWeight: 700, color: '#6b7280' }}>STUDENT</Box>
              </Box>
            </Box>
            <Box component="tbody">
              {[
                { name: 'College Architecture Setup', superAdmin: true, collegeAdmin: true, hod: false, faculty: false, student: false },
                { name: 'User Account Management & Roles', superAdmin: true, collegeAdmin: true, hod: false, faculty: false, student: false },
                { name: 'Publish Broadcast Notices', superAdmin: true, collegeAdmin: true, hod: true, faculty: false, student: false },
                { name: 'Bulk Student Promotion Engine', superAdmin: true, collegeAdmin: false, hod: false, faculty: false, student: false },
                { name: 'Generate Official PDF Certificates', superAdmin: true, collegeAdmin: true, hod: false, faculty: false, student: false },
                { name: 'Attendance & Gradebook Management', superAdmin: false, collegeAdmin: false, hod: true, faculty: true, student: false },
                { name: 'System Audit Logs Inspection', superAdmin: true, collegeAdmin: false, hod: false, faculty: false, student: false },
              ].map((row, idx) => (
                <Box component="tr" key={idx} sx={{ '&:hover': { bgcolor: theme.custom?.surface?.sunken || 'rgba(0,0,0,0.01)' } }}>
                  <Box component="td" sx={{ fontWeight: 600 }}>{row.name}</Box>
                  <Box component="td">{row.superAdmin ? <Chip label="FULL ALLOW" size="small" color="success" sx={{ fontSize: '0.65rem', fontWeight: 800 }} /> : <Chip label="DENIED" size="small" variant="outlined" sx={{ fontSize: '0.65rem' }} />}</Box>
                  <Box component="td">{row.collegeAdmin ? <Chip label="ALLOWED" size="small" color="primary" sx={{ fontSize: '0.65rem', fontWeight: 800 }} /> : <Chip label="DENIED" size="small" variant="outlined" sx={{ fontSize: '0.65rem' }} />}</Box>
                  <Box component="td">{row.hod ? <Chip label="DEPT SCOPED" size="small" sx={{ fontSize: '0.65rem', fontWeight: 700, bgcolor: '#8b5cf618', color: '#8b5cf6' }} /> : <Chip label="DENIED" size="small" variant="outlined" sx={{ fontSize: '0.65rem' }} />}</Box>
                  <Box component="td">{row.faculty ? <Chip label="CLASS SCOPED" size="small" sx={{ fontSize: '0.65rem', fontWeight: 700, bgcolor: '#10b98118', color: '#10b981' }} /> : <Chip label="DENIED" size="small" variant="outlined" sx={{ fontSize: '0.65rem' }} />}</Box>
                  <Box component="td">{row.student ? <Chip label="READ ONLY" size="small" sx={{ fontSize: '0.65rem', fontWeight: 700 }} /> : <Chip label="DENIED" size="small" variant="outlined" sx={{ fontSize: '0.65rem' }} />}</Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Card>
    </Box>
  );
};

export default CollegeProfile;
