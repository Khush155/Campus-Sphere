import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Alert,
  CircularProgress,
  Avatar,
} from '@mui/material';
import { Visibility, VisibilityOff, LockOutlined as LockIcon } from '@mui/icons-material';

// Zod validation schema
const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handlePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const onSubmit = async (_data) => {
    setLoading(true);
    setApiError(null);

    try {
      // For Phase 1 Setup, mock successful login API request
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // Store dummy token
      localStorage.setItem('accessToken', 'dummy-token-for-phase-1');
      navigate('/');
    } catch (err) {
      setApiError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.1) 0%, rgba(6, 182, 212, 0.05) 90.2%)',
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 420, width: '100%', borderRadius: 4, overflow: 'hidden' }}>
        <Box
          sx={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
            py: 4,
            px: 3,
            color: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Avatar
            sx={{
              width: 50,
              height: 50,
              bgcolor: 'rgba(255,255,255,0.2)',
              mb: 1.5,
            }}
          >
            <LockIcon />
          </Avatar>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Welcome to CampusSphere
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
            Sign in to access your portal
          </Typography>
        </Box>

        <CardContent sx={{ p: 4 }}>
          {apiError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {apiError}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <TextField
              fullWidth
              margin="normal"
              id="email"
              label="Email Address"
              type="email"
              autoComplete="email"
              autoFocus
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
              aria-label="email"
            />

            <TextField
              fullWidth
              margin="normal"
              id="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message}
              aria-label="password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handlePasswordVisibility} edge="end" aria-label="toggle password visibility">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{ mt: 4, mb: 1, py: 1.5, fontSize: '1rem' }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;
