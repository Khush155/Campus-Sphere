import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import Home from '../pages/Home';
import LoginPage from '../pages/auth/LoginPage';
import { useAuth } from '../contexts/AuthContext';
import { Typography, Paper, CircularProgress, Box } from '@mui/material';
import RoleRoute from './RoleRoute';
import CollegeAdminDashboard from '../pages/admin/CollegeAdminDashboard';
import UnderConstruction from '../pages/common/UnderConstruction';
import InstitutionProfile from '../pages/admin/InstitutionProfile';
import DepartmentsHub from '../pages/admin/DepartmentsHub';
import AdminFacultyHub from '../pages/admin/FacultyHub'; // Aliased to prevent conflict
import RolesMatrix from '../pages/admin/RolesMatrix';
import AcademicsHub from '../pages/admin/AcademicsHub';
import AdmissionsHub from '../pages/admin/AdmissionsHub';
import FinanceHub from '../pages/admin/FinanceHub';
import ReportsHub from '../pages/admin/ReportsHub';
import AnnouncementsHub from '../pages/admin/AnnouncementsHub';
import ApprovalsHub from '../pages/admin/ApprovalsHub';
import SettingsHub from '../pages/admin/SettingsHub';
import SetupHub from '../pages/admin/CollegeSetup/SetupHub';
import UserRoster from '../pages/admin/UserManagement/UserRoster';
import SetupWizard from '../pages/admin/SetupWizard';
import StudentRoster from '../pages/admin/StudentManagement/StudentRoster';

import HODDashboard from '../pages/hod/HODDashboard';
import HODModuleShell from '../pages/hod/HODModuleShell';
import HODFacultyHub from '../pages/hod/FacultyHub'; // Aliased to prevent conflict
import HODStudentsHub from '../pages/hod/HODStudentsHub';
import HODSubjectsHub from '../pages/hod/HODSubjectsHub';
import HODTimetableHub from '../pages/hod/HODTimetableHub';
import AssignmentHub from '../pages/hod/FacultyAssignment/AssignmentHub';
import { useDepartmentsQuery } from '../queries/collegeQueries';

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
  const { data: departments, isLoading } = useDepartmentsQuery();
  const { user } = useAuth();

  if (isLoading) return <CircularProgress />;

  // Only run this check for SUPER_ADMIN or COLLEGE_ADMIN
  if (user?.role === 'SUPER_ADMIN' || user?.role === 'COLLEGE_ADMIN') {
    if (!departments || departments.length === 0) {
      return <Navigate to="/admin/setup-wizard" replace />;
    }
  }
  return children;
};

const PlaceholderView = ({ title }) => (
  <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
    <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 4, maxWidth: 500, width: '100%' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 800 }}>
        {title}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        This module is currently under development.
      </Typography>
    </Paper>
  </Box>
);

const HomeRedirect = () => {
  const { user } = useAuth();
  if (user?.role === 'SUPER_ADMIN' || user?.role === 'COLLEGE_ADMIN') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  if (user?.role === 'HOD') {
    return <Navigate to="/hod/dashboard" replace />;
  }
  return <Home />;
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Routes */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<HomeRedirect />} />
        
        {/* Admin Workspace Routes */}
        <Route
          path="admin/dashboard"
          element={
            <RoleRoute allowedRoles={['SUPER_ADMIN', 'COLLEGE_ADMIN']}>
              <AdminSetupGuard>
                <CollegeAdminDashboard />
              </AdminSetupGuard>
            </RoleRoute>
          }
        />
        
        {/* Admin Specific Hubs */}
        <Route path="admin/institution" element={<RoleRoute allowedRoles={['SUPER_ADMIN', 'COLLEGE_ADMIN']}><InstitutionProfile /></RoleRoute>} />
        <Route path="admin/roles" element={<RoleRoute allowedRoles={['SUPER_ADMIN', 'COLLEGE_ADMIN']}><RolesMatrix /></RoleRoute>} />
        <Route path="admin/courses" element={<RoleRoute allowedRoles={['SUPER_ADMIN', 'COLLEGE_ADMIN']}><AcademicsHub /></RoleRoute>} />
        <Route path="admin/subjects" element={<RoleRoute allowedRoles={['SUPER_ADMIN', 'COLLEGE_ADMIN']}><AcademicsHub /></RoleRoute>} />
        <Route path="admin/calendar" element={<RoleRoute allowedRoles={['SUPER_ADMIN', 'COLLEGE_ADMIN']}><AcademicsHub /></RoleRoute>} />
        <Route path="admin/admissions" element={<RoleRoute allowedRoles={['SUPER_ADMIN', 'COLLEGE_ADMIN']}><AdmissionsHub /></RoleRoute>} />
        <Route path="admin/reports" element={<RoleRoute allowedRoles={['SUPER_ADMIN', 'COLLEGE_ADMIN']}><ReportsHub /></RoleRoute>} />
        <Route path="admin/announcements" element={<RoleRoute allowedRoles={['SUPER_ADMIN', 'COLLEGE_ADMIN']}><AnnouncementsHub /></RoleRoute>} />
        <Route path="admin/approvals" element={<RoleRoute allowedRoles={['SUPER_ADMIN', 'COLLEGE_ADMIN']}><ApprovalsHub /></RoleRoute>} />
        <Route path="admin/settings" element={<RoleRoute allowedRoles={['SUPER_ADMIN', 'COLLEGE_ADMIN']}><SettingsHub /></RoleRoute>} />

        {/* Student Routes */}
        <Route
          path="student/dashboard"
          element={
            <RoleRoute allowedRoles={['SUPER_ADMIN', 'COLLEGE_ADMIN', 'STUDENT']}>
              <PlaceholderView title="Student Dashboard" />
            </RoleRoute>
          }
        />

        <Route
          path="admin/setup-wizard"
          element={
            <RoleRoute allowedRoles={['SUPER_ADMIN', 'COLLEGE_ADMIN']}>
              <SetupWizard />
            </RoleRoute>
          }
        />
        <Route
          path="admin/college-setup"
          element={
            <RoleRoute allowedRoles={['SUPER_ADMIN', 'COLLEGE_ADMIN']}>
              <Navigate to="/admin/college-setup/departments" replace />
            </RoleRoute>
          }
        />
        <Route
          path="admin/college-setup/:tab"
          element={
            <RoleRoute allowedRoles={['SUPER_ADMIN', 'COLLEGE_ADMIN']}>
              <AdminSetupGuard>
                <DepartmentsHub />
              </AdminSetupGuard>
            </RoleRoute>
          }
        />
        <Route
          path="admin/users"
          element={
            <RoleRoute allowedRoles={['SUPER_ADMIN', 'COLLEGE_ADMIN']}>
              <AdminSetupGuard>
                <AdminFacultyHub />
              </AdminSetupGuard>
            </RoleRoute>
          }
        />
        <Route
          path="admin/students"
          element={
            <RoleRoute allowedRoles={['SUPER_ADMIN', 'COLLEGE_ADMIN', 'HOD']}>
              <AdminSetupGuard>
                <StudentRoster />
              </AdminSetupGuard>
            </RoleRoute>
          }
        />
        <Route
          path="admin/fees"
          element={
            <RoleRoute allowedRoles={['SUPER_ADMIN', 'COLLEGE_ADMIN']}>
              <AdminSetupGuard>
                <FinanceHub />
              </AdminSetupGuard>
            </RoleRoute>
          }
        />
        
        {/* HOD Command Center Routes */}
        <Route path="hod/dashboard" element={<RoleRoute allowedRoles={['SUPER_ADMIN', 'COLLEGE_ADMIN', 'HOD']}><HODDashboard /></RoleRoute>} />
        <Route path="hod/faculty" element={<RoleRoute allowedRoles={['SUPER_ADMIN', 'COLLEGE_ADMIN', 'HOD']}><HODFacultyHub /></RoleRoute>} />
        <Route path="hod/students" element={<RoleRoute allowedRoles={['SUPER_ADMIN', 'COLLEGE_ADMIN', 'HOD']}><HODStudentsHub /></RoleRoute>} />
        <Route path="hod/subjects" element={<RoleRoute allowedRoles={['SUPER_ADMIN', 'COLLEGE_ADMIN', 'HOD']}><HODSubjectsHub /></RoleRoute>} />
        <Route path="hod/timetable" element={<RoleRoute allowedRoles={['SUPER_ADMIN', 'COLLEGE_ADMIN', 'HOD']}><HODTimetableHub /></RoleRoute>} />
        <Route path="hod/attendance" element={<RoleRoute allowedRoles={['SUPER_ADMIN', 'COLLEGE_ADMIN', 'HOD']}><HODModuleShell title="Attendance" description="Monitor department attendance and identify defaulters." /></RoleRoute>} />
        <Route path="hod/results" element={<RoleRoute allowedRoles={['SUPER_ADMIN', 'COLLEGE_ADMIN', 'HOD']}><HODModuleShell title="Results" description="Analyze subject-wise and semester-wise performance." /></RoleRoute>} />
        <Route path="hod/assignments" element={<RoleRoute allowedRoles={['SUPER_ADMIN', 'COLLEGE_ADMIN', 'HOD']}><AssignmentHub /></RoleRoute>} />
        <Route path="hod/analytics" element={<RoleRoute allowedRoles={['SUPER_ADMIN', 'COLLEGE_ADMIN', 'HOD']}><HODModuleShell title="Analytics" description="View departmental insights, pass percentages, and trends." /></RoleRoute>} />
        <Route path="hod/announcements" element={<RoleRoute allowedRoles={['SUPER_ADMIN', 'COLLEGE_ADMIN', 'HOD']}><HODModuleShell title="Announcements" description="Notify faculty and students within the department." /></RoleRoute>} />
        <Route path="hod/reports" element={<RoleRoute allowedRoles={['SUPER_ADMIN', 'COLLEGE_ADMIN', 'HOD']}><HODModuleShell title="Reports" description="Generate and export department performance reports." /></RoleRoute>} />
        <Route path="hod/settings" element={<RoleRoute allowedRoles={['SUPER_ADMIN', 'COLLEGE_ADMIN', 'HOD']}><HODModuleShell title="Settings" description="Manage department info and preferences." /></RoleRoute>} />

        <Route
          path="faculty/dashboard"
          element={
            <RoleRoute allowedRoles={['SUPER_ADMIN', 'COLLEGE_ADMIN', 'FACULTY']}>
              <PlaceholderView title="Faculty Dashboard" />
            </RoleRoute>
          }
        />
        <Route path="attendance" element={<PlaceholderView title="Attendance" />} />
        <Route path="fees" element={<Navigate to="/admin/fees" replace />} />
        <Route path="notices" element={<PlaceholderView title="Notice Board" />} />

        {/* Fallback */}
        <Route path="*" element={<UnderConstruction />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
