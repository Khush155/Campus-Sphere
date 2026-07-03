import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import Home from '../pages/Home';
import Login from '../pages/Login';
import { Typography, Paper } from '@mui/material';

// Standard Protected Route check
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    return <Navigate to="/login" replace />;
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

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />

      {/* Protected Layout Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Home />} />
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
