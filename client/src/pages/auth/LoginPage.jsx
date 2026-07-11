import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../../contexts/AuthContext';
import { useLoginMutation } from '../../queries/authQueries';
import { detectRoleApi } from '../../services/authService';
import { useCollegeProfileQuery } from '../../queries/collegeProfileQueries';
import {
  Box,
  Typography,
  TextField,
  FormControlLabel,
  Checkbox,
  Button,
  IconButton,
  InputAdornment,
  CircularProgress,
  Link,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { Visibility, VisibilityOff, ArrowForward } from '@mui/icons-material';

// Zod validation schema matching backend logic
const loginFormSchema = z.object({
  identifier: z.string().min(1, 'College ID or Email is required'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

// React hook to respect system prefers-reduced-motion settings
const usePrefersReducedMotion = () => {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mediaQuery.matches);
    const listener = (e) => setReduced(e.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);
  return reduced;
};

export const LoginPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { login } = useAuth();
  const prefersReducedMotion = usePrefersReducedMotion();

  const { data: profile } = useCollegeProfileQuery();

  const getFullLogoUrl = (relativeUrl) => {
    if (!relativeUrl) return null;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
    const rootUrl = baseUrl.replace('/api/v1', '');
    return `${rootUrl}${relativeUrl}`;
  };

  const hasCustomProfile = profile && profile.name && profile.name !== 'My College';

  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [detectedRole, setDetectedRole] = useState(null);
  const [isDetectingRole, setIsDetectingRole] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  // Parallax cursor tracking state
  const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });
  const inkPanelRef = useRef(null);

  const { mutateAsync: loginMutate, isPending } = useLoginMutation();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      identifier: '',
      password: '',
      rememberMe: false,
    },
  });

  // Load saved identifier from cookie/localStorage if "Remember Me" was enabled previously
  useEffect(() => {
    const savedIdentifier = localStorage.getItem('remembered_identifier');
    if (savedIdentifier) {
      setValue('identifier', savedIdentifier);
      setValue('rememberMe', true);
      // Run initial role detection if a value is recovered
      triggerRoleDetection(savedIdentifier);
    }
  }, [setValue]);

  // Handle keypress or blur on the identifier field to auto-detect role
  const triggerRoleDetection = async (value) => {
    if (!value || value.trim().length < 3) {
      setDetectedRole(null);
      return;
    }
    setIsDetectingRole(true);
    try {
      const data = await detectRoleApi(value);
      setDetectedRole(data.role); // Sets HOD, STUDENT, FACULTY, SUPER_ADMIN, etc.
    } catch (error) {
      // Fail silently to prevent user enumeration
      setDetectedRole(null);
    } finally {
      setIsDetectingRole(false);
    }
  };

  const handleIdentifierBlur = (e) => {
    triggerRoleDetection(e.target.value);
  };

  const handlePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Parallax mouse movements
  const handleMouseMove = (e) => {
    if (prefersReducedMotion || !inkPanelRef.current) return;
    const { clientX, clientY } = e;
    const { width, height, left, top } = inkPanelRef.current.getBoundingClientRect();
    
    // Calculate distance from center of the panel
    const x = (clientX - left - width / 2) / 30; // Max 15px drift
    const y = (clientY - top - height / 2) / 30;
    setParallaxOffset({ x, y });
  };

  const handleMouseLeave = () => {
    setParallaxOffset({ x: 0, y: 0 });
  };

  const onSubmit = async (data) => {
    setApiError(null);
    setLoginSuccess(false);

    try {
      const result = await loginMutate({
        email: data.identifier,
        password: data.password,
      });

      // Persist identifier if remember me is checked
      if (data.rememberMe) {
        localStorage.setItem('remembered_identifier', data.identifier);
      } else {
        localStorage.removeItem('remembered_identifier');
      }

      setLoginSuccess(true);
      
      // Delay redirection slightly to show the microcheck state
      const delay = prefersReducedMotion ? 0 : 600;
      setTimeout(() => {
        login(result.accessToken, result.user);
        navigate('/', { replace: true });
      }, delay);

    } catch (err) {
      // Catch rate-limiting/brute-force errors
      if (err.response?.status === 429) {
        setApiError('Too many attempts. Try again in 15 minutes.');
      } else {
        // Obfuscate specific error to prevent account enumeration
        setApiError("That ID or password doesn't match our records");
      }
    }
  };

  // Dynamic role badge styling
  const getRoleBadgeColor = (role) => {
    if (!role) return 'transparent';
    switch (role) {
      case 'SUPER_ADMIN':
      case 'COLLEGE_ADMIN':
        return theme.palette.brass[500];
      case 'FACULTY':
        return '#3b82f6'; // Blue accent
      case 'STUDENT':
        return theme.palette.signal.success;
      default:
        return theme.palette.slateCustom[500];
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        minHeight: '100vh',
      }}
    >
      {/* 1. LEFT SIDE: INK PANEL (40% width) */}
      <Box
        ref={inkPanelRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        sx={{
          flex: { xs: '0 0 auto', sm: '0 0 40%' },
          width: { xs: '100%', sm: '40%' },
          bgcolor: theme.palette.ink[900],
          color: theme.palette.parchment[50],
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: { xs: 3, sm: 6 },
          position: 'relative',
          overflow: 'hidden',
          minHeight: { xs: '150px', sm: '100vh' },
          borderRight: { sm: `1px solid ${theme.palette.ink[700]}` },
        }}
      >
        {/* Faint Architectural Line-art Background */}
        <Box
          sx={{
            position: 'absolute',
            top: { xs: '-50%', sm: '10%' },
            left: { xs: '10%', sm: '-10%' },
            width: '120%',
            height: '80%',
            opacity: 0.08,
            color: theme.palette.brass[300],
            transform: `translate3d(${parallaxOffset.x}px, ${parallaxOffset.y}px, 0)`,
            transition: prefersReducedMotion ? 'none' : 'transform 0.15s ease-out',
            pointerEvents: 'none',
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Engineering columns / compass vector gate */}
          <svg viewBox="0 0 800 600" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="2.5">
            {/* Pediment (Triangle roof) */}
            <polygon points="100,200 700,200 400,50" />
            <line x1="120" y1="180" x2="680" y2="180" />
            
            {/* Columns (4 primary structural pillars) */}
            <rect x="180" y="200" width="60" height="300" />
            <rect x="300" y="200" width="60" height="300" />
            <rect x="440" y="200" width="60" height="300" />
            <rect x="560" y="200" width="60" height="300" />
            
            {/* Base foundation stairs */}
            <rect x="50" y="500" width="700" height="30" />
            <rect x="20" y="530" width="760" height="40" />

            {/* Inscribed engineering circle / drafting ring in background */}
            <circle cx="400" cy="280" r="150" strokeDasharray="10 10" />
            <circle cx="400" cy="280" r="100" />
            <line x1="400" y1="50" x2="400" y2="500" strokeDasharray="5 5" />
            <line x1="100" y1="280" x2="700" y2="280" strokeDasharray="5 5" />
          </svg>
        </Box>

        {/* Wordmark and Tagline */}
        <Box sx={{ zIndex: 2 }}>
          {hasCustomProfile && profile.logoUrl ? (
            <Box
              component="img"
              src={getFullLogoUrl(profile.logoUrl)}
              alt="College Logo"
              sx={{ width: 64, height: 64, objectFit: 'contain', mb: 2 }}
            />
          ) : null}
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontFamily: theme.typography.h1.fontFamily,
              fontWeight: 600,
              color: theme.palette.brass[500],
              mb: 1.5,
            }}
          >
            {hasCustomProfile ? profile.name : 'CampusSphere'}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontFamily: theme.typography.body2.fontFamily,
              color: 'rgba(237, 233, 221, 0.7)',
              fontSize: '0.85rem',
              maxWidth: '300px',
            }}
          >
            {hasCustomProfile && profile.affiliation
              ? profile.affiliation
              : 'The academic operations platform for engineering institutions.'}
          </Typography>
        </Box>

        {/* Live Academic Year Indicator */}
        <Box
          sx={{
            zIndex: 2,
            display: { xs: 'none', sm: 'block' },
            fontFamily: theme.typography.mono.fontFamily,
            fontSize: '0.72rem',
            letterSpacing: '0.1em',
            color: 'rgba(237, 233, 221, 0.5)',
            textTransform: 'uppercase',
          }}
        >
          Academic Year 2026–27 · Odd Sem
        </Box>
      </Box>

      {/* 2. RIGHT SIDE: FORM PANEL (60% width) */}
      <Box
        sx={{
          flex: { xs: '1 1 auto', sm: '0 0 60%' },
          width: { xs: '100%', sm: '60%' },
          bgcolor: theme.palette.parchment[50],
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: { xs: 4, sm: 8 },
          position: 'relative',
        }}
      >
        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          sx={{
            width: '100%',
            maxWidth: '420px',
            display: 'flex',
            flexDirection: 'column',
            gap: 3.5,
          }}
        >
          {/* Header */}
          <Box>
            <Typography
              variant="h3"
              component="h2"
              sx={{
                fontFamily: theme.typography.h2.fontFamily,
                fontWeight: 600,
                color: theme.palette.ink[900],
                mb: 1,
              }}
            >
              Sign in
            </Typography>
            <Box
              sx={{
                width: '60px',
                height: '3px',
                bgcolor: theme.palette.brass[500],
                mb: 0.5,
              }}
            />
          </Box>

          {/* Identifier Input */}
          <Box>
            <Typography
              component="label"
              htmlFor="identifier"
              sx={{
                display: 'block',
                fontFamily: theme.typography.body2.fontFamily,
                fontWeight: 600,
                fontSize: '0.85rem',
                color: theme.palette.ink[900],
                mb: 1,
              }}
            >
              College ID or Email
            </Typography>
            <TextField
              id="identifier"
              fullWidth
              autoComplete="username"
              placeholder="e.g. Rohit@campussphere.edu.in"
              disabled={isPending || loginSuccess}
              {...register('identifier')}
              onBlur={handleIdentifierBlur}
              error={!!errors.identifier}
              helperText={errors.identifier?.message}
              aria-describedby="identifier-error"
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: theme.palette.parchment[100],
                  fontFamily: theme.typography.body1.fontFamily,
                  '& .MuiOutlinedInput-input': {
                    color: theme.palette.ink[900],
                  },
                  '& input::placeholder': {
                    color: '#000000',
                    opacity: 0.8,
                  },
                  '& fieldset': {
                    borderColor: 'rgba(28, 46, 69, 0.15)',
                  },
                  '&:hover fieldset': {
                    borderColor: theme.palette.ink[700],
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: theme.palette.brass[500],
                    borderWidth: '2px',
                  },
                },
              }}
            />

            {/* Real-time Dynamic Role Confirmation Badge */}
            {(detectedRole || isDetectingRole) && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  mt: 1.5,
                  minHeight: '20px',
                }}
              >
                {isDetectingRole ? (
                  <CircularProgress size={12} sx={{ color: theme.palette.brass[500] }} />
                ) : (
                  <>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: getRoleBadgeColor(detectedRole),
                      }}
                    />
                    <Typography
                      sx={{
                        fontFamily: theme.typography.mono.fontFamily,
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        letterSpacing: '0.08em',
                        color: theme.palette.slateCustom[500],
                      }}
                    >
                      SIGNING IN AS {detectedRole.replace('_', ' ')}
                    </Typography>
                  </>
                )}
              </Box>
            )}
          </Box>

          {/* Password Input */}
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography
                component="label"
                htmlFor="password"
                sx={{
                  fontFamily: theme.typography.body2.fontFamily,
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  color: theme.palette.ink[900],
                }}
              >
                Password
              </Typography>
              <Link
                component="button"
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setForgotOpen(true);
                }}
                tabIndex={0}
                sx={{
                  fontFamily: theme.typography.body2.fontFamily,
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: theme.palette.brass[500],
                  textDecoration: 'none',
                  border: 'none',
                  background: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  '&:hover': {
                    color: theme.palette.brass[300],
                    textDecoration: 'underline',
                  },
                }}
              >
                Forgot?
              </Link>
            </Box>
            <TextField
              id="password"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              autoComplete="current-password"
              disabled={isPending || loginSuccess}
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message}
              aria-describedby="password-error"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      type="button"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={handlePasswordVisibility}
                      edge="end"
                      tabIndex={0}
                      sx={{ color: theme.palette.slateCustom[500] }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: theme.palette.parchment[100],
                  fontFamily: theme.typography.body1.fontFamily,
                  '& .MuiOutlinedInput-input': {
                    color: theme.palette.ink[900],
                  },
                  '& input::placeholder': {
                    color: '#000000',
                    opacity: 0.8,
                  },
                  '& fieldset': {
                    borderColor: 'rgba(28, 46, 69, 0.15)',
                  },
                  '&:hover fieldset': {
                    borderColor: theme.palette.ink[700],
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: theme.palette.brass[500],
                    borderWidth: '2px',
                  },
                },
              }}
            />
          </Box>

          {/* Remember Me Box */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Checkbox
                  {...register('rememberMe')}
                  disabled={isPending || loginSuccess}
                  sx={{
                    color: 'rgba(28, 46, 69, 0.3)',
                    '&.Mui-checked': {
                      color: theme.palette.brass[500],
                    },
                  }}
                />
              }
              label={
                <Typography
                  sx={{
                    fontFamily: theme.typography.body2.fontFamily,
                    fontSize: '0.85rem',
                    color: theme.palette.slateCustom[500],
                  }}
                >
                  Remember my ID
                </Typography>
              }
            />
          </Box>

          {/* Submission and Error Display Column */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {apiError && (
              <Typography
                id="api-error"
                role="alert"
                sx={{
                  fontFamily: theme.typography.body2.fontFamily,
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: theme.palette.signal.error,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                ● {apiError}
              </Typography>
            )}

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={isPending || loginSuccess}
              endIcon={!isPending && !loginSuccess ? <ArrowForward /> : null}
              sx={{
                py: 1.6,
                fontWeight: 700,
                fontSize: '0.95rem',
                fontFamily: theme.typography.button.fontFamily,
                borderRadius: '8px',
                boxShadow: 'none',
                background: `linear-gradient(135deg, ${theme.palette.brass[500]} 0%, #a27431 100%)`,
                color: theme.palette.ink[900],
                transition: 'all 0.25s ease-in-out',
                '&:hover': {
                  background: `linear-gradient(135deg, ${theme.palette.brass[300]} 0%, ${theme.palette.brass[500]} 100%)`,
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 14px rgba(184, 134, 62, 0.25)',
                },
                '&.Mui-disabled': {
                  background: loginSuccess
                    ? theme.palette.signal.success
                    : 'rgba(28, 46, 69, 0.12)',
                  color: loginSuccess ? '#ffffff' : 'rgba(28, 46, 69, 0.26)',
                },
              }}
            >
              {isPending ? (
                <>
                  <CircularProgress size={18} sx={{ mr: 1.5, color: theme.palette.ink[900] }} />
                  Signing in…
                </>
              ) : loginSuccess ? (
                '✓ Verification successful'
              ) : (
                'Sign in'
              )}
            </Button>
          </Box>

          {/* Technical Help Contact Footer Link */}
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography
              variant="caption"
              sx={{
                fontFamily: theme.typography.body2.fontFamily,
                color: theme.palette.slateCustom[500],
                fontSize: '0.78rem',
              }}
            >
              {"Can't sign in? "}
              <Link
                href="mailto:support@campussphere.edu"
                sx={{
                  color: theme.palette.brass[500],
                  fontWeight: 600,
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                Contact your department office
              </Link>
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Dynamic Password Reset Dialog */}
      <Dialog
        open={forgotOpen}
        onClose={() => setForgotOpen(false)}
        aria-labelledby="forgot-password-dialog-title"
        aria-describedby="forgot-password-dialog-description"
        PaperProps={{
          sx: {
            borderRadius: 3,
            bgcolor: theme.palette.parchment[50],
            p: 1.5,
          },
        }}
      >
        <DialogTitle
          id="forgot-password-dialog-title"
          sx={{
            fontFamily: theme.typography.h3.fontFamily,
            color: theme.palette.ink[900],
            fontWeight: 700,
          }}
        >
          Password Recovery
        </DialogTitle>
        <DialogContent>
          <DialogContentText
            id="forgot-password-dialog-description"
            sx={{
              fontFamily: theme.typography.body2.fontFamily,
              color: theme.palette.slateCustom[500],
              fontSize: '0.9rem',
              lineHeight: 1.6,
            }}
          >
            For security reasons, password recovery links cannot be issued publicly on the login screen. 
            Please reach out to your **Department Coordinator**, the **Campus Registrar Office**, or email 
            <Box component="span" sx={{ color: theme.palette.brass[500], fontWeight: 600, mx: 0.5 }}>
              support@campussphere.edu
            </Box>
            to request a secure reset link.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setForgotOpen(false)}
            variant="contained"
            sx={{
              bgcolor: theme.palette.brass[500],
              color: theme.palette.ink[900],
              fontWeight: 700,
              px: 3,
              '&:hover': {
                bgcolor: theme.palette.brass[300],
              },
            }}
          >
            Acknowledge
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LoginPage;
