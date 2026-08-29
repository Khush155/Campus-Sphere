import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Chip,
  Button,
  Avatar,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Skeleton,
  useTheme,
} from '@mui/material';
import {
  WorkOutlined as WorkIcon,
  BusinessOutlined as CompanyIcon,
  CheckCircleOutlineOutlined as SelectedIcon,
  HourglassEmptyOutlined as PendingIcon,
  EventOutlined as CalendarIcon,
  MonetizationOnOutlined as PackageIcon,
  AssignmentTurnedInOutlined as ApplyIcon,
  CancelOutlined as RejectedIcon,
  DescriptionOutlined as NocIcon,
} from '@mui/icons-material';

import { useAuth } from '../../contexts/AuthContext';
import { useMyProfileQuery } from '../../queries/userProfileQueries';
import {
  usePlacementDrivesQuery,
  useStudentPlacementApplicationsQuery,
  useApplyPlacementDriveMutation,
} from '../../queries/studentQueries';

const getAppStatusConfig = (status) => {
  switch (status) {
    case 'SELECTED':
      return { label: 'SELECTED / OFFERED', color: 'success', icon: <SelectedIcon fontSize="small" /> };
    case 'SHORTLISTED':
    case 'IN_PROCESS':
      return { label: status.replace('_', ' '), color: 'primary', icon: <PendingIcon fontSize="small" /> };
    case 'REJECTED':
    case 'WITHDRAWN':
      return { label: status, color: 'error', icon: <RejectedIcon fontSize="small" /> };
    case 'WAITLISTED':
      return { label: 'WAITLISTED', color: 'warning', icon: <PendingIcon fontSize="small" /> };
    case 'APPLIED':
    default:
      return { label: 'APPLIED', color: 'info', icon: <ApplyIcon fontSize="small" /> };
  }
};

export const StudentPlacementsPage = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { user } = useAuth();
  const { data: profile } = useMyProfileQuery();

  const currentUser = profile?.user || user;
  const studentMeta = profile?.profileMeta || {};

  const [activeTab, setActiveTab] = useState(0);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const { data: drivesData = [], isLoading: isDrivesLoading } = usePlacementDrivesQuery();
  const { data: appsData = [], isLoading: isAppsLoading } = useStudentPlacementApplicationsQuery();
  const applyMutation = useApplyPlacementDriveMutation();

  const drives = Array.isArray(drivesData) ? drivesData : [];
  const applications = Array.isArray(appsData) ? appsData : [];

  // Summary Metrics
  const totalDrives = drives.length;
  const totalApplied = applications.length;
  const totalSelected = applications.filter((a) => a.finalStatus === 'SELECTED' || a.status === 'SELECTED').length;

  const appliedDriveIds = new Set(
    applications.map((app) => (typeof app.driveId === 'object' ? app.driveId?._id : app.driveId))
  );

  const handleApply = (driveId) => {
    setFeedback({ type: '', message: '' });
    applyMutation.mutate(driveId, {
      onSuccess: () => {
        setFeedback({ type: 'success', message: 'Application submitted successfully for placement drive!' });
      },
      onError: (err) => {
        setFeedback({
          type: 'error',
          message: err.response?.data?.message || 'Failed to submit application. Check eligibility requirements.',
        });
      },
    });
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3.5 }}>
      {/* Header Bar */}
      <Box sx={{ mb: 3.5 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em', mb: 0.5 }}>
          Campus Placement & Internship Cell
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Explore upcoming company recruitment drives, eligibility rules, and track your ongoing interview applications for{' '}
          <strong>{studentMeta?.course || 'B.Tech'}</strong> (CGPA: {currentUser?.cgpa !== undefined && currentUser?.cgpa !== null ? currentUser.cgpa : 'N/A'}).
        </Typography>
      </Box>

      {/* Global Feedback Banner */}
      {feedback.message && (
        <Alert
          severity={feedback.type}
          onClose={() => setFeedback({ type: '', message: '' })}
          sx={{ mb: 3, borderRadius: '14px', fontWeight: 600 }}
        >
          {feedback.message}
        </Alert>
      )}

      {/* KPI Cards Row (4 Roster-Style Top-Bordered Cards) */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: '14px',
              border: `1px solid ${theme.palette.divider}`,
              borderTop: '4px solid #4f46e5',
              bgcolor: isDark ? 'background.paper' : '#ffffff',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                Recruitment Drives
              </Typography>
              <Avatar sx={{ bgcolor: 'rgba(79, 70, 229, 0.12)', color: '#4f46e5', width: 40, height: 40, borderRadius: '10px' }}>
                <CompanyIcon fontSize="small" />
              </Avatar>
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', fontFamily: theme.typography.mono?.fontFamily || 'monospace' }}>
                {totalDrives}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Active hiring campaigns
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: '14px',
              border: `1px solid ${theme.palette.divider}`,
              borderTop: '4px solid #06b6d4',
              bgcolor: isDark ? 'background.paper' : '#ffffff',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                Applications Sent
              </Typography>
              <Avatar sx={{ bgcolor: 'rgba(6, 182, 212, 0.12)', color: '#06b6d4', width: 40, height: 40, borderRadius: '10px' }}>
                <WorkIcon fontSize="small" />
              </Avatar>
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', fontFamily: theme.typography.mono?.fontFamily || 'monospace' }}>
                {totalApplied}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Submitted profiles
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: '14px',
              border: `1px solid ${theme.palette.divider}`,
              borderTop: '4px solid #10b981',
              bgcolor: isDark ? 'background.paper' : '#ffffff',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                Offers &amp; Selections
              </Typography>
              <Avatar sx={{ bgcolor: 'rgba(16, 185, 129, 0.12)', color: '#10b981', width: 40, height: 40, borderRadius: '10px' }}>
                <SelectedIcon fontSize="small" />
              </Avatar>
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'success.main', fontFamily: theme.typography.mono?.fontFamily || 'monospace' }}>
                {totalSelected}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Confirmed corporate offers
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: '14px',
              border: `1px solid ${theme.palette.divider}`,
              borderTop: '4px solid #f59e0b',
              bgcolor: isDark ? 'background.paper' : '#ffffff',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                Shortlisted / In Review
              </Typography>
              <Avatar sx={{ bgcolor: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', width: 40, height: 40, borderRadius: '10px' }}>
                <PendingIcon fontSize="small" />
              </Avatar>
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'warning.main', fontFamily: theme.typography.mono?.fontFamily || 'monospace' }}>
                {applications.filter((a) => a.status === 'SHORTLISTED' || a.status === 'WAITLISTED').length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Ongoing interview rounds
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabs Row */}
      <Paper elevation={0} sx={{ borderRadius: '20px', border: `1px solid ${theme.palette.divider}`, mb: 3, overflow: 'hidden' }}>
        <Tabs
          value={activeTab}
          onChange={(e, val) => setActiveTab(val)}
          indicatorColor="primary"
          textColor="primary"
          sx={{ px: 2, pt: 1, '& .MuiTab-root': { fontWeight: 800, textTransform: 'none', py: 2 } }}
        >
          <Tab label={`Upcoming & Open Drives (${totalDrives})`} />
          <Tab label={`My Submitted Applications (${totalApplied})`} />
        </Tabs>
      </Paper>

      {/* TAB 0: RECRUITMENT DRIVES */}
      {activeTab === 0 && (
        <Box>
          {isDrivesLoading ? (
            <Grid container spacing={3}>
              {[1, 2, 3].map((item) => (
                <Grid item xs={12} md={6} key={item}>
                  <Skeleton variant="rounded" height={280} sx={{ borderRadius: '24px' }} />
                </Grid>
              ))}
            </Grid>
          ) : drives.length === 0 ? (
            <Paper elevation={0} sx={{ p: 6, borderRadius: '24px', textAlign: 'center', border: `1px solid ${theme.palette.divider}` }}>
              <CompanyIcon sx={{ fontSize: 56, color: 'text.secondary', opacity: 0.4, mb: 1.5 }} />
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5 }}>
                No Active Recruitment Drives
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                There are currently no open placement or internship drives announced for your department.
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {drives.map((drive) => {
                const isApplied = appliedDriveIds.has(drive._id);
                const isDeadlinePassed = drive.applicationDeadline && new Date() > new Date(drive.applicationDeadline);
                const isCompleted = drive.status === 'COMPLETED' || drive.status === 'CANCELLED';

                const minCgpa = drive.eligibilityCriteria?.cgpa;
                const maxBacklogs = drive.eligibilityCriteria?.backlogs;

                return (
                  <Grid item xs={12} md={6} key={drive._id}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        borderRadius: '24px',
                        border: `1px solid ${theme.palette.divider}`,
                        bgcolor: isDark ? 'background.paper' : '#ffffff',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                          <Chip
                            label={drive.driveType || 'PLACEMENT'}
                            color="primary"
                            size="small"
                            sx={{ fontWeight: 800, fontSize: '0.7rem' }}
                          />
                          <Chip
                            label={drive.status || 'UPCOMING'}
                            color={drive.status === 'COMPLETED' ? 'default' : 'warning'}
                            size="small"
                            variant="outlined"
                            sx={{ fontWeight: 800, fontSize: '0.7rem' }}
                          />
                        </Box>

                        <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5 }}>
                          {drive.companyName}
                        </Typography>

                        <Typography variant="subtitle1" color="primary" sx={{ fontWeight: 800, mb: 1.5 }}>
                          {drive.role}
                        </Typography>

                        {drive.packageInfo && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                            <PackageIcon fontSize="small" color="action" />
                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                              Package: <strong>{drive.packageInfo}</strong>
                            </Typography>
                          </Box>
                        )}

                        {drive.jobDescription && (
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.85rem', mb: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {drive.jobDescription}
                          </Typography>
                        )}

                        {/* Eligibility Criteria Box */}
                        <Box
                          sx={{
                            p: 2,
                            borderRadius: '16px',
                            bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                            border: `1px solid ${theme.palette.divider}`,
                            mb: 2,
                          }}
                        >
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
                            ELIGIBILITY & WORKFLOW
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                            Min CGPA: <strong>{minCgpa ? minCgpa : 'No Cutoff'}</strong> • Max Active Backlogs:{' '}
                            <strong>{maxBacklogs !== undefined ? maxBacklogs : 'Allowed'}</strong>
                          </Typography>
                          {drive.selectionProcess && (
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mt: 0.5 }}>
                              Process: {drive.selectionProcess}
                            </Typography>
                          )}
                        </Box>
                      </Box>

                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <CalendarIcon fontSize="small" color="action" />
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                              Drive Date: {new Date(drive.driveDate).toLocaleDateString()}
                            </Typography>
                          </Box>

                          {drive.applicationDeadline && (
                            <Typography variant="caption" color={isDeadlinePassed ? 'error.main' : 'text.secondary'} sx={{ fontWeight: 700 }}>
                              Deadline: {new Date(drive.applicationDeadline).toLocaleDateString()}
                            </Typography>
                          )}
                        </Box>

                        <Button
                          fullWidth
                          variant={isApplied ? 'outlined' : 'contained'}
                          color={isApplied ? 'success' : 'primary'}
                          disabled={isApplied || isDeadlinePassed || isCompleted || applyMutation.isPending}
                          onClick={() => handleApply(drive._id)}
                          sx={{ borderRadius: '12px', fontWeight: 800, textTransform: 'none', py: 1 }}
                        >
                          {isApplied ? 'Application Submitted' : isDeadlinePassed ? 'Deadline Passed' : 'Apply for Drive'}
                        </Button>
                      </Box>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Box>
      )}

      {/* TAB 1: MY APPLICATIONS */}
      {activeTab === 1 && (
        <Box>
          {isAppsLoading ? (
            <Paper elevation={0} sx={{ p: 4, borderRadius: '24px', border: `1px solid ${theme.palette.divider}` }}>
              <Skeleton variant="rectangular" height={200} sx={{ borderRadius: '16px' }} />
            </Paper>
          ) : applications.length === 0 ? (
            <Paper elevation={0} sx={{ p: 6, borderRadius: '24px', textAlign: 'center', border: `1px solid ${theme.palette.divider}` }}>
              <WorkIcon sx={{ fontSize: 56, color: 'text.secondary', opacity: 0.4, mb: 1.5 }} />
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5 }}>
                No Placement Applications Submitted
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                You have not submitted applications to any placement drives yet.
              </Typography>
            </Paper>
          ) : (
            <Paper
              elevation={0}
              sx={{
                borderRadius: '24px',
                border: `1px solid ${theme.palette.divider}`,
                overflow: 'hidden',
                bgcolor: isDark ? 'background.paper' : '#ffffff',
              }}
            >
              <TableContainer>
                <Table>
                  <TableHead sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800 }}>COMPANY & ROLE</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>APPLIED DATE</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>CGPA AT APPLICATION</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>STATUS</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>INTERVIEW & OFFER DETAILS</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {applications.map((app) => {
                      const statusConfig = getAppStatusConfig(app.status);
                      const driveObj = typeof app.driveId === 'object' ? app.driveId : {};
                      const company = driveObj?.companyName || 'Recruiter';
                      const role = driveObj?.role || 'Campus Hire';

                      return (
                        <TableRow key={app._id} hover>
                          <TableCell>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                              {company}
                            </Typography>
                            <Typography variant="caption" color="primary" sx={{ fontWeight: 700 }}>
                              {role}
                            </Typography>
                          </TableCell>

                          <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>
                            {new Date(app.createdAt).toLocaleDateString()}
                          </TableCell>

                          <TableCell sx={{ fontWeight: 700 }}>
                            {app.cgpaAtApplication ? `${app.cgpaAtApplication} CGPA` : 'N/A'}
                          </TableCell>

                          <TableCell>
                            <Chip
                              icon={statusConfig.icon}
                              label={statusConfig.label}
                              color={statusConfig.color}
                              size="small"
                              sx={{ fontWeight: 800, fontSize: '0.72rem' }}
                            />
                          </TableCell>

                          <TableCell>
                            {app.finalStatus === 'SELECTED' ? (
                              <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'success.main' }}>
                                  Offer Package: {app.offerPackageLPA ? `${app.offerPackageLPA} LPA` : driveObj?.packageInfo || 'Selected'}
                                </Typography>
                                {app.isNocIssued && (
                                  <Chip
                                    icon={<NocIcon fontSize="small" />}
                                    label="NOC Issued"
                                    color="success"
                                    size="small"
                                    variant="outlined"
                                    sx={{ fontWeight: 800, mt: 0.5, fontSize: '0.68rem' }}
                                  />
                                )}
                              </Box>
                            ) : Array.isArray(app.interviewRounds) && app.interviewRounds.length > 0 ? (
                              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                Current Round: {app.currentRound || app.interviewRounds.length} ({app.interviewRounds[app.interviewRounds.length - 1]?.roundName || 'In Evaluation'})
                              </Typography>
                            ) : (
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                Profile shortlisted for Round 1
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </Box>
      )}
    </Container>
  );
};

export default StudentPlacementsPage;
