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
  Snackbar,
} from '@mui/material';
import { CloudUploadOutlined, SaveOutlined } from '@mui/icons-material';

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
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

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

    // Validate size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage('File size exceeds 2MB limit.');
      return;
    }

    // Validate type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage('Only JPEG, PNG, and WEBP images are supported.');
      return;
    }

    setSelectedFile(file);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(URL.createObjectURL(file));
    setErrorMessage('');
  };

  const handleUploadLogo = async () => {
    if (!selectedFile) return;
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('logo', selectedFile);
      await uploadLogoMutation.mutateAsync(formData);
      setSuccessMessage('College logo uploaded successfully.');
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to upload logo.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleFormSubmit = async (data) => {
    try {
      await updateProfileMutation.mutateAsync(data);
      setSuccessMessage('College profile details updated successfully.');
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to update college details.');
    }
  };

  const getFullLogoUrl = (relativeUrl) => {
    if (!relativeUrl) return null;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
    // Remove /api/v1 from baseUrl to get root server URL
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
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, p: 4 }}>
      {/* Header */}
      <Box>
        <Typography
          variant="h4"
          sx={{
            fontFamily: theme.typography.h1.fontFamily,
            fontWeight: 700,
            color: theme.palette.ink[900],
            mb: 0.5,
          }}
        >
          College Profile Settings
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage institution details, branding logos, contact information, and affiliations.
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Form Details */}
        <Grid item xs={12} md={7}>
          <Card
            component="form"
            onSubmit={handleSubmit(handleFormSubmit)}
            sx={{
              p: 4,
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: 'none',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              Institution Details
            </Typography>

            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <Typography component="label" sx={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, mb: 1 }}>
                  College Name *
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  {...register('name')}
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography component="label" sx={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, mb: 1 }}>
                  Affiliation Info
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="e.g. Affiliated to XYZ State University"
                  {...register('affiliation')}
                  error={!!errors.affiliation}
                  helperText={errors.affiliation?.message}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography component="label" sx={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, mb: 1 }}>
                  Campus Address
                </Typography>
                <TextField
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
                <Typography component="label" sx={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, mb: 1 }}>
                  Contact Email
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="e.g. contact@college.edu"
                  {...register('contactEmail')}
                  error={!!errors.contactEmail}
                  helperText={errors.contactEmail?.message}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography component="label" sx={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, mb: 1 }}>
                  Contact Phone
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="e.g. +91 98765 43210"
                  {...register('contactPhone')}
                  error={!!errors.contactPhone}
                  helperText={errors.contactPhone?.message}
                />
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button
                type="submit"
                variant="contained"
                disabled={!isDirty || updateProfileMutation.isPending}
                startIcon={updateProfileMutation.isPending ? <CircularProgress size={20} color="inherit" /> : <SaveOutlined />}
                sx={{
                  bgcolor: theme.palette.primary.main,
                  color: theme.palette.ink[900],
                  fontWeight: 700,
                  textTransform: 'none',
                  borderRadius: '8px',
                  px: 4,
                  '&:hover': { bgcolor: theme.palette.primary.light },
                  '&.Mui-disabled': { bgcolor: 'rgba(28, 46, 69, 0.12)' },
                }}
              >
                Save Details
              </Button>
            </Box>
          </Card>
        </Grid>

        {/* Logo Configuration */}
        <Grid item xs={12} md={5}>
          <Card
            sx={{
              p: 4,
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: 'none',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Branding & Logo
            </Typography>

            {/* Current Logo / Preview */}
            <Box
              sx={{
                width: '100%',
                height: 180,
                border: `1px dashed ${theme.palette.divider}`,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(28, 46, 69, 0.02)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {previewUrl ? (
                <Box
                  component="img"
                  src={previewUrl}
                  alt="New logo preview"
                  sx={{ width: 'auto', maxHeight: '100%', objectFit: 'contain', p: 1 }}
                />
              ) : profile.logoUrl ? (
                <Box
                  component="img"
                  src={getFullLogoUrl(profile.logoUrl)}
                  alt={`${profile.name} logo`}
                  sx={{ width: 'auto', maxHeight: '100%', objectFit: 'contain', p: 1 }}
                />
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No logo uploaded yet
                </Typography>
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
                    bgcolor: theme.palette.primary.main,
                    color: theme.palette.ink[900],
                    fontWeight: 700,
                    textTransform: 'none',
                    borderRadius: '8px',
                    '&:hover': { bgcolor: theme.palette.primary.light },
                  }}
                >
                  Upload & Apply Logo
                </Button>
              )}

              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                Accepted types: JPEG, PNG, WEBP. Max size: 2MB.
              </Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Success/Error Toasts */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="success" onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!errorMessage}
        autoHideDuration={5000}
        onClose={() => setErrorMessage('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="error" onClose={() => setErrorMessage('')}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};
