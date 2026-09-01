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
  LockOutlined,
} from '@mui/icons-material';
import { useToast } from '../../../contexts/ToastContext';
import { usePermissions } from '../../../utils/permissions';

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
  institutionCode: z
    .string()
    .max(50, 'Institution code cannot exceed 50 characters')
    .trim()
    .optional()
    .or(z.literal('')),
  establishmentYear: z
    .union([z.number(), z.string().transform((val) => (val ? Number(val) : undefined))])
    .optional(),
  accreditation: z
    .string()
    .max(150, 'Accreditation info cannot exceed 150 characters')
    .trim()
    .optional()
    .or(z.literal('')),
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
  website: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .or(z.null()),
});

export const CollegeProfile = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { showToast } = useToast();
  const { isSuperAdmin } = usePermissions();

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
      institutionCode: '',
      establishmentYear: 1998,
      accreditation: '',
      affiliation: '',
      address: '',
      contactEmail: '',
      contactPhone: '',
      website: '',
    },
  });

  const watchName = watch('name');
  const watchAffiliation = watch('affiliation');
  const watchAccreditation = watch('accreditation');
  const watchAddress = watch('address');

  // Load values when query resolves
  useEffect(() => {
    if (profile) {
      reset({
        name: profile.name || '',
        institutionCode: profile.institutionCode || '',
        establishmentYear: profile.establishmentYear || 1998,
        accreditation: profile.accreditation || '',
        affiliation: profile.affiliation || '',
        address: profile.address || '',
        contactEmail: profile.contactEmail || '',
        contactPhone: profile.contactPhone || '',
        website: profile.website || '',
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

  const [logoError, setLogoError] = useState(false);

  const getFullLogoUrl = (relativeUrl) => {
    if (!relativeUrl) return null;
    if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://') || relativeUrl.startsWith('data:')) {
      return relativeUrl;
    }
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
    const rootUrl = baseUrl.replace(/\/api\/v1\/?$/, '');
    const cleanRelative = relativeUrl.startsWith('/') ? relativeUrl : `/${relativeUrl}`;
    return `${rootUrl}${cleanRelative}`;
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
      {/* ── 1. Hero Identity Banner Card (Glassmorphic Luxury Bar) ────────── */}
      <Card
        sx={{
          p: 3.5,
          borderRadius: '22px',
          border: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
          background: isDark
            ? 'linear-gradient(135deg, rgba(79, 70, 229, 0.12) 0%, rgba(184, 134, 62, 0.06) 100%)'
            : 'linear-gradient(135deg, rgba(79, 70, 229, 0.06) 0%, rgba(184, 134, 62, 0.04) 100%)',
          backdropFilter: 'blur(12px)',
          boxShadow: theme.custom?.elevation?.raised || '0 8px 24px rgba(0,0,0,0.03)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2.5,
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
                fontFamily: theme.typography.mono?.fontFamily || 'monospace',
                fontWeight: 800,
                fontSize: '0.68rem',
                letterSpacing: '0.06em',
                borderRadius: '8px',
              }}
            />
            {isSuperAdmin ? (
              <Chip
                icon={<VerifiedUserOutlined sx={{ fontSize: '0.8rem !important' }} />}
                label="Official Profile Active"
                size="small"
                color="success"
                sx={{ fontSize: '0.72rem', fontWeight: 700, borderRadius: '6px' }}
              />
            ) : (
              <Chip
                icon={<LockOutlined sx={{ fontSize: '0.8rem !important' }} />}
                label="View Only (Super Admin Managed)"
                size="small"
                color="info"
                sx={{ fontSize: '0.72rem', fontWeight: 700, borderRadius: '6px' }}
              />
            )}
          </Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 800,
              color: 'text.primary',
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
              mb: 0.5,
            }}
          >
            College Profile Settings
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              maxWidth: 680,
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
              borderRadius: '18px',
              bgcolor: theme.custom?.surface?.raised || theme.palette.background.paper,
              display: 'flex',
              flexDirection: 'column',
              justify: 'space-between',
              gap: 3,
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.ink[900], mb: 0.5 }}>
                  Institutional Identity & Metadata
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Official name, affiliation, establishment year, and accreditation grade.
                </Typography>
              </Box>

              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={8}>
                  <Typography component="label" htmlFor="college-name-input" sx={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, mb: 0.8, color: theme.palette.ink[900] }}>
                    College Name *
                  </Typography>
                  <TextField
                    id="college-name-input"
                    fullWidth
                    size="small"
                    disabled={!isSuperAdmin}
                    placeholder="e.g. CampusSphere Institute of Technology"
                    {...register('name')}
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Typography component="label" htmlFor="code-input" sx={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, mb: 0.8, color: theme.palette.ink[900] }}>
                    Institution Code
                  </Typography>
                  <TextField
                    id="code-input"
                    fullWidth
                    size="small"
                    disabled={!isSuperAdmin}
                    placeholder="e.g. CS-ERP-101"
                    {...register('institutionCode')}
                    error={!!errors.institutionCode}
                    helperText={errors.institutionCode?.message}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography component="label" htmlFor="affiliation-input" sx={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, mb: 0.8, color: theme.palette.ink[900] }}>
                    University Affiliation
                  </Typography>
                  <TextField
                    id="affiliation-input"
                    fullWidth
                    size="small"
                    disabled={!isSuperAdmin}
                    placeholder="e.g. Affiliated to State Technological University"
                    {...register('affiliation')}
                    error={!!errors.affiliation}
                    helperText={errors.affiliation?.message}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography component="label" htmlFor="accreditation-input" sx={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, mb: 0.8, color: theme.palette.ink[900] }}>
                    Accreditation & Ranking
                  </Typography>
                  <TextField
                    id="accreditation-input"
                    fullWidth
                    size="small"
                    disabled={!isSuperAdmin}
                    placeholder="e.g. NAAC Grade A+ | NBA Accredited"
                    {...register('accreditation')}
                    error={!!errors.accreditation}
                    helperText={errors.accreditation?.message}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography component="label" htmlFor="establishment-input" sx={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, mb: 0.8, color: theme.palette.ink[900] }}>
                    Establishment Year
                  </Typography>
                  <TextField
                    id="establishment-input"
                    type="number"
                    fullWidth
                    size="small"
                    disabled={!isSuperAdmin}
                    placeholder="e.g. 1998"
                    {...register('establishmentYear')}
                    error={!!errors.establishmentYear}
                    helperText={errors.establishmentYear?.message}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography component="label" htmlFor="website-input" sx={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, mb: 0.8, color: theme.palette.ink[900] }}>
                    Official Website URL
                  </Typography>
                  <TextField
                    id="website-input"
                    fullWidth
                    size="small"
                    disabled={!isSuperAdmin}
                    placeholder="e.g. https://campussphere.edu"
                    {...register('website')}
                    error={!!errors.website}
                    helperText={errors.website?.message}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography component="label" htmlFor="address-input" sx={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, mb: 0.8, color: theme.palette.ink[900] }}>
                    Campus Physical Address
                  </Typography>
                  <TextField
                    id="address-input"
                    fullWidth
                    size="small"
                    multiline
                    rows={2.5}
                    disabled={!isSuperAdmin}
                    placeholder="Enter full campus physical address..."
                    {...register('address')}
                    error={!!errors.address}
                    helperText={errors.address?.message}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography component="label" htmlFor="contact-email-input" sx={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, mb: 0.8, color: theme.palette.ink[900] }}>
                    Administrative Contact Email
                  </Typography>
                  <TextField
                    id="contact-email-input"
                    fullWidth
                    size="small"
                    disabled={!isSuperAdmin}
                    placeholder="e.g. contact@college.edu"
                    {...register('contactEmail')}
                    error={!!errors.contactEmail}
                    helperText={errors.contactEmail?.message}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography component="label" htmlFor="contact-phone-input" sx={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, mb: 0.8, color: theme.palette.ink[900] }}>
                    Administrative Contact Phone
                  </Typography>
                  <TextField
                    id="contact-phone-input"
                    fullWidth
                    size="small"
                    disabled={!isSuperAdmin}
                    placeholder="e.g. +91 98765 43210"
                    {...register('contactPhone')}
                    error={!!errors.contactPhone}
                    helperText={errors.contactPhone?.message}
                  />
                </Grid>
              </Grid>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
              {!isSuperAdmin ? (
                <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', fontWeight: 600 }}>
                  * Institutional identity details and accreditations can only be modified by the Super Administrator.
                </Typography>
              ) : (
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
              )}
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
              borderRadius: '18px',
              bgcolor: theme.custom?.surface?.raised || theme.palette.background.paper,
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Branding & Institutional Seal
            </Typography>

            {/* Current Logo / Circular Seal Preview */}
            <Box
              sx={{
                width: 140,
                height: 140,
                mx: 'auto',
                border: `2px dashed ${theme.palette.primary.main}50`,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: theme.custom?.surface?.sunken || 'rgba(0,0,0,0.02)',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
              }}
            >
              {previewUrl ? (
                <Box
                  component="img"
                  src={previewUrl}
                  alt="New logo preview"
                  sx={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', p: 0.5 }}
                />
              ) : profile?.logoUrl && !logoError ? (
                <Box
                  component="img"
                  src={getFullLogoUrl(profile.logoUrl)}
                  alt={`${profile?.name} logo`}
                  onError={() => setLogoError(true)}
                  sx={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', p: 0.5 }}
                />
              ) : (
                <Box sx={{ textAlign: 'center', color: 'text.secondary', p: 1 }}>
                  <SchoolOutlined sx={{ fontSize: 38, color: theme.palette.primary.main, mb: 0.5 }} />
                  <Typography variant="caption" sx={{ fontSize: '0.72rem', display: 'block', fontWeight: 600 }}>
                    No Logo Seal
                  </Typography>
                </Box>
              )}
            </Box>

            {/* File Inputs & Upload */}
            {!isSuperAdmin ? (
              <Box sx={{ textAlign: 'center', py: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600, fontStyle: 'italic' }}>
                  Institutional seal & branding images can only be uploaded by the Super Administrator.
                </Typography>
              </Box>
            ) : (
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
            )}
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
                  <Box component="img" src={previewUrl} alt="Logo" sx={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover' }} />
                ) : profile?.logoUrl && !logoError ? (
                  <Box component="img" src={getFullLogoUrl(profile.logoUrl)} alt="Logo" onError={() => setLogoError(true)} sx={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <SchoolOutlined sx={{ fontSize: 32, color: theme.palette.primary.main }} />
                )}
              </Box>

              <Typography variant="h6" sx={{ fontFamily: theme.typography.h1.fontFamily, fontWeight: 700, fontSize: '1rem', color: theme.palette.ink[900] }}>
                {watchName || profile?.name || 'CAMPUS SPHERE ACADEMY'}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.72rem', fontFamily: theme.typography.mono.fontFamily, fontWeight: 600 }}>
                {[watchAffiliation || profile?.affiliation, watchAccreditation || profile?.accreditation].filter(Boolean).join(' • ') || 'Affiliated to State University'}
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
