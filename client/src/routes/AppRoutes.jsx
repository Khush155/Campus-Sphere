import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import Home from '../pages/Home';
import LoginPage from '../pages/auth/LoginPage';
import { useAuth } from '../contexts/AuthContext';
import { Typography, Paper, CircularProgress, Box } from '@mui/material';
import RoleRoute from './RoleRoute';
import AdminDashboard from '../pages/admin/AdminDashboard';
import SetupHub from '../pages/admin/CollegeSetup/SetupHub';
import UserRoster from '../pages/admin/UserManagement/UserRoster';
import SetupWizard from '../pages/admin/SetupWizard';
import { useDepartmentsQuery } from '../queries/collegeQueries';
import NoticeBoard from '../pages/admin/NoticeBoard/NoticeBoard';

// Guard for authenticated sections
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        <CircularProgress size={50} />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Guard to enforce setup wizard on empty database
const AdminSetupGuard = ({ children }) => {
  const { data: depts, isLoading } = useDepartmentsQuery();
  const skipped = localStorage.getItem('skip_setup_wizard') === 'true';

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        <CircularProgress size={50} />
      </Box>
    );
  }

  // If there are zero departments and the user has not skipped, redirect to Setup Wizard
  if ((!depts || depts.length === 0) && !skipped) {
    return <Navigate to="/admin/setup-wizard" replace />;
  }

  return children;
};

// Guard for guest-only sections (like login page)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        <CircularProgress size={50} />
      </Box>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Placeholder component for views under construction
const PlaceholderView = ({ title }) => (
  <Paper sx={{ p: 4, textAlign: 'center' }}>
    <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
      {title} Module
    </Typography>
    <Typography variant="body1" color="text.secondary">
      This section is under construction. It will be implemented in subsequent phases.
    </Typography>
  </Paper>
);

const HomeRedirect = () => {
  const { user } = useAuth();
  if (user?.role === 'SUPER_ADMIN') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return <Home />;
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />

      {/* Protected Layout Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<HomeRedirect />} />
        
        {/* Super Admin Workspace Routes */}
        <Route
          path="admin/dashboard"
          element={
            <RoleRoute allowedRoles={['SUPER_ADMIN']}>
              <AdminSetupGuard>
                <AdminDashboard />
              </AdminSetupGuard>
            </RoleRoute>
          }
        />
        <Route
          path="admin/setup-wizard"
          element={
            <RoleRoute allowedRoles={['SUPER_ADMIN']}>
              <SetupWizard />
            </RoleRoute>
          }
        />
        <Route
          path="admin/college-setup"
          element={
            <RoleRoute allowedRoles={['SUPER_ADMIN']}>
              <Navigate to="/admin/college-setup/departments" replace />
            </RoleRoute>
          }
        />
        <Route
          path="admin/college-setup/:tab"
          element={
            <RoleRoute allowedRoles={['SUPER_ADMIN']}>
              <SetupHub />
            </RoleRoute>
          }
        />
        <Route
          path="admin/users"
          element={
            <RoleRoute allowedRoles={['SUPER_ADMIN']}>
              <AdminSetupGuard>
                <UserRoster />
              </AdminSetupGuard>
            </RoleRoute>
          }
        />

        <Route
          path="admin/notices"
          element={
            <RoleRoute allowedRoles={['SUPER_ADMIN', 'COLLEGE_ADMIN']}>
              <AdminSetupGuard>
                <NoticeBoard />
              </AdminSetupGuard>
            </RoleRoute>
          }
        />

        <Route path="students" element={<PlaceholderView title="Students" />} />
        <Route path="faculty" element={<PlaceholderView title="Faculty" />} />
        <Route path="attendance" element={<PlaceholderView title="Attendance" />} />
        <Route path="fees" element={<PlaceholderView title="Fees" />} />
        <Route path="notices" element={<PlaceholderView title="Notice Board" />} />
      </Route>

      {/* Wildcard Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
