import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Box, Typography, Button } from '@mui/material';

/**
 * Route guard component to restrict client views to authorized roles.
 * Must be wrapped inside ProtectedRoute.
 * 
 * @param {Array<string>} allowedRoles - Roles allowed to access this route.
 */
export const RoleRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isAuthorized = allowedRoles.includes(user.role);

  if (!isAuthorized) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          p: 3,
          textAlign: 'center',
        }}
      >
        <Typography variant="h3" sx={{ fontWeight: 800, color: 'error.main', mb: 2 }}>
          403
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
          Access Denied
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 480 }}>
          You do not have the required permissions to view this section of the ERP portal.
        </Typography>
        <Button href="/" variant="contained">
          Back to Dashboard
        </Button>
      </Box>
    );
  }

  return children;
};

export default RoleRoute;
