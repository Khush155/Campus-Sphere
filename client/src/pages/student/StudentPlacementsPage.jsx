import React, { useState, useMemo } from 'react';
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
  TextField,
  InputAdornment,
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
  WarningAmberOutlined,
  OpenInNew as OpenInNewIcon,
  EmojiEventsOutlined as HackathonIcon,
  PublicOutlined as GlobalIcon,
  Search as SearchIcon,
} from '@mui/icons-material';

import { useAuth } from '../../contexts/AuthContext';
import { useMyProfileQuery } from '../../queries/userProfileQueries';
import {
  usePlacementDrivesQuery,
  useStudentPlacementApplicationsQuery,
  useApplyPlacementDriveMutation,
} from '../../queries/studentQueries';
import { useOpportunitiesQuery } from '../../queries/opportunityQueries';

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
  const { data: rawOpportunities = [], isLoading: isOppsLoading } = useOpportunitiesQuery();
  const applyMutation = useApplyPlacementDriveMutation();

  const [oppSearchQuery, setOppSearchQuery] = useState('');
  const [oppTypeFilter, setOppTypeFilter] = useState('ALL');

  const drives = useMemo(() => (Array.isArray(drivesData) ? drivesData : []), [drivesData]);
  const applications = useMemo(() => (Array.isArray(appsData) ? appsData : []), [appsData]);
  const opportunities = useMemo(() => (Array.isArray(rawOpportunities) ? rawOpportunities : []), [rawOpportunities]);

  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((opp) => {
      const matchesType = oppTypeFilter === 'ALL' || opp.type === oppTypeFilter;
      const matchesSearch =
        !oppSearchQuery ||
        opp.title?.toLowerCase().includes(oppSearchQuery.toLowerCase()) ||
        opp.organization?.toLowerCase().includes(oppSearchQuery.toLowerCase()) ||
        opp.location?.toLowerCase().includes(oppSearchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [opportunities, oppTypeFilter, oppSearchQuery]);

  // Summary Metrics
  const totalDrives = drives.length;
  const totalApplied = applications.length;
  const totalSelected = applications.filter((a) => a.finalStatus === 'SELECTED' || a.status === 'SELECTED').length;
  const totalOpportunities = opportunities.length;

  const appliedDriveIds = new Set(
    applications.map((app) => (typeof app.driveId === 'object' ? app.driveId?._id : app.driveId))
  );

  const checkEligibility = (drive) => {
    // 1. Branch check
    if (drive.eligibleBranches && drive.eligibleBranches.length > 0) {
      const studentBranchId = currentUser?.branchId?._id || currentUser?.branchId?.id || currentUser?.branchId;
      const isBranchAllowed = drive.eligibleBranches.some(
        (b) => String(b._id || b.id || b) === String(studentBranchId)
      );
      if (!isBranchAllowed) {
        const allowedCodes = drive.eligibleBranches.map((b) => b.code || b.name).join(', ');
        return { eligible: false, reason: `Branch Restricted: Open for ${allowedCodes}` };
      }
    }

    // 2. Dynamic Course Duration & Academic Standing check
    if (drive.eligibleStanding && drive.eligibleStanding !== 'ALL_YEARS') {
      const durationYears = currentUser?.courseId?.durationYears || studentMeta?.durationYears || 4;
      const totalSemesters = durationYears * 2;
      const studentSem = currentUser?.semester || 1;

      const isFinalYear = studentSem >= totalSemesters - 1;
      const isPreFinalYear = studentSem >= totalSemesters - 3 && studentSem < totalSemesters - 1;

      if (drive.eligibleStanding === 'FINAL_YEAR' && !isFinalYear) {
        return {
          eligible: false,
          reason: `Reserved for Final Year (Sem ${totalSemesters - 1}–${totalSemesters}) • You are in Sem ${studentSem}`,
        };
      }
      if (drive.eligibleStanding === 'PRE_FINAL_YEAR' && !isPreFinalYear) {
        return {
          eligible: false,
          reason: `Reserved for Pre-Final Year (Sem ${totalSemesters - 3}–${totalSemesters - 2}) • You are in Sem ${studentSem}`,
        };
      }
    }

    // 3. Graduating Batch Year check (if specified)
    if (drive.graduatingBatchYear) {
      const durationYears = currentUser?.courseId?.durationYears || studentMeta?.durationYears || 4;
      const studentBatch = currentUser?.admissionYear ? currentUser.admissionYear + durationYears : null;
      if (studentBatch && studentBatch !== drive.graduatingBatchYear) {
        return {
          eligible: false,
          reason: `Reserved for Class of ${drive.graduatingBatchYear} • Your batch is ${studentBatch}`,
        };
      }
    }

    // 4. CGPA Cutoff
    const minCgpa = drive.eligibilityCriteria?.cgpa;
    if (minCgpa && (currentUser?.cgpa || 0) < minCgpa) {
      return { eligible: false, reason: `CGPA Cutoff: Requires ≥ ${minCgpa} (Your CGPA: ${currentUser?.cgpa ?? 'N/A'})` };
    }

    // 5. Backlogs Cutoff
    const maxBacklogs = drive.eligibilityCriteria?.backlogs;
    if (maxBacklogs !== undefined && (currentUser?.activeBacklogs || 0) > maxBacklogs) {
      return { eligible: false, reason: `Backlogs Cutoff: Max allowed is ${maxBacklogs} (You have ${currentUser?.activeBacklogs || 0})` };
    }

    return { eligible: true, reason: 'You meet all eligibility requirements' };
  };

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
          <Tab label={`Global Opportunities & Hackathons (${totalOpportunities})`} />
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
                const eligibility = checkEligibility(drive);

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
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 1 }}>
                            ELIGIBILITY & WORKFLOW
                          </Typography>

                          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 1 }}>
                            <Chip
                              label={
                                drive.eligibleStanding === 'ALL_YEARS'
                                  ? 'Open to All Years'
                                  : drive.eligibleStanding === 'PRE_FINAL_YEAR'
                                  ? `Pre-Final Year (${drive.graduatingBatchYear ? `Class of ${drive.graduatingBatchYear}` : 'Interns'})`
                                  : `Final Year (${drive.graduatingBatchYear ? `Class of ${drive.graduatingBatchYear}` : 'Graduating'})`
                              }
                              size="small"
                              color={drive.eligibleStanding === 'PRE_FINAL_YEAR' ? 'secondary' : 'primary'}
                              sx={{ fontWeight: 800, fontSize: '0.65rem', height: 22 }}
                            />
                            <Chip
                              label={
                                drive.eligibleBranches && drive.eligibleBranches.length > 0
                                  ? `Target: ${drive.eligibleBranches.map((b) => b.code || b.name).join(', ')}`
                                  : 'All Dept Branches'
                              }
                              size="small"
                              variant="outlined"
                              sx={{ fontWeight: 700, fontSize: '0.65rem', height: 22 }}
                            />
                          </Box>

                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                            Min CGPA: <strong>{minCgpa ? minCgpa : 'No Cutoff'}</strong> • Max Active Backlogs:{' '}
                            <strong>{maxBacklogs !== undefined ? maxBacklogs : 'Allowed'}</strong>
                          </Typography>
                          {drive.selectionProcess && (
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mt: 0.5 }}>
                              Process: {drive.selectionProcess}
                            </Typography>
                          )}

                          <Box sx={{ mt: 1.5, pt: 1.25, borderTop: `1px dashed ${theme.palette.divider}` }}>
                            {eligibility.eligible ? (
                              <Chip
                                icon={<SelectedIcon sx={{ fontSize: '0.85rem !important' }} />}
                                label="You Are Eligible to Apply"
                                color="success"
                                size="small"
                                sx={{ fontWeight: 800, fontSize: '0.68rem', height: 24 }}
                              />
                            ) : (
                              <Chip
                                icon={<WarningAmberOutlined sx={{ fontSize: '0.85rem !important' }} />}
                                label={eligibility.reason}
                                color="warning"
                                size="small"
                                sx={{ fontWeight: 700, fontSize: '0.65rem', whiteSpace: 'normal', height: 'auto', py: 0.4 }}
                              />
                            )}
                          </Box>
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
                          color={isApplied ? 'success' : eligibility.eligible ? 'primary' : 'inherit'}
                          disabled={isApplied || !eligibility.eligible || isDeadlinePassed || isCompleted || applyMutation.isPending}
                          onClick={() => handleApply(drive._id)}
                          sx={{ borderRadius: '12px', fontWeight: 800, textTransform: 'none', py: 1 }}
                        >
                          {isApplied
                            ? 'Application Submitted'
                            : isDeadlinePassed
                            ? 'Deadline Passed'
                            : !eligibility.eligible
                            ? 'Ineligible to Apply'
                            : 'Apply for Drive'}
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

      {/* TAB 2: GLOBAL OPPORTUNITIES & HACKATHONS */}
      {activeTab === 2 && (
        <Box>
          {/* Search & Category Filter Toolbar */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: '16px',
              border: `1px solid ${theme.palette.divider}`,
              mb: 3,
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: { xs: 'stretch', md: 'center' },
              justifyContent: 'space-between',
              gap: 2,
            }}
          >
            {/* Search Input */}
            <TextField
              size="small"
              placeholder="Search hackathons, internships, companies..."
              value={oppSearchQuery}
              onChange={(e) => setOppSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: { xs: '100%', md: 320 } }}
            />

            {/* Type Filter Chips */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
              {[
                { key: 'ALL', label: `All (${opportunities.length})` },
                { key: 'HACKATHON', label: `Hackathons (${opportunities.filter((o) => o.type === 'HACKATHON').length})` },
                { key: 'INTERNSHIP', label: `Internships (${opportunities.filter((o) => o.type === 'INTERNSHIP').length})` },
                { key: 'PLACEMENT', label: `Placements (${opportunities.filter((o) => o.type === 'PLACEMENT').length})` },
              ].map((filter) => (
                <Chip
                  key={filter.key}
                  label={filter.label}
                  clickable
                  onClick={() => setOppTypeFilter(filter.key)}
                  color={oppTypeFilter === filter.key ? 'primary' : 'default'}
                  variant={oppTypeFilter === filter.key ? 'filled' : 'outlined'}
                  sx={{ fontWeight: 700, borderRadius: '8px' }}
                />
              ))}
            </Box>
          </Paper>

          {/* Opportunities Listing */}
          {isOppsLoading ? (
            <Grid container spacing={3}>
              {[1, 2, 3].map((item) => (
                <Grid item xs={12} sm={6} md={4} key={item}>
                  <Skeleton variant="rounded" height={280} sx={{ borderRadius: '18px' }} />
                </Grid>
              ))}
            </Grid>
          ) : filteredOpportunities.length === 0 ? (
            <Paper elevation={0} sx={{ p: 6, borderRadius: '24px', textAlign: 'center', border: `1px solid ${theme.palette.divider}` }}>
              <GlobalIcon sx={{ fontSize: 56, color: 'text.secondary', opacity: 0.4, mb: 1.5 }} />
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5 }}>
                No Matching Opportunities
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                {opportunities.length === 0
                  ? 'There are currently no external opportunities or hackathons curated by the department.'
                  : 'Try adjusting your search criteria or category filter.'}
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {filteredOpportunities.map((opp) => {
                const isHackathon = opp.type === 'HACKATHON';
                const isInternship = opp.type === 'INTERNSHIP';
                const accentColor = isHackathon ? '#8b5cf6' : isInternship ? '#06b6d4' : '#3b82f6';
                const isDeadlinePassed = opp.deadline && new Date() > new Date(opp.deadline);

                return (
                  <Grid item xs={12} sm={6} md={4} key={opp.id || opp._id}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        borderRadius: '18px',
                        border: `1px solid ${opp.featured ? '#f59e0b' : theme.palette.divider}`,
                        borderTop: `4px solid ${accentColor}`,
                        bgcolor: isDark ? 'background.paper' : '#ffffff',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 12px 24px rgba(0,0,0,0.06)',
                        },
                      }}
                    >
                      <Box>
                        {/* Top Chips Row */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Chip
                              icon={isHackathon ? <HackathonIcon fontSize="small" /> : isInternship ? <WorkIcon fontSize="small" /> : <CompanyIcon fontSize="small" />}
                              label={opp.type || 'OPPORTUNITY'}
                              size="small"
                              sx={{
                                fontWeight: 800,
                                bgcolor: `${accentColor}18`,
                                color: accentColor,
                                fontSize: '0.7rem',
                              }}
                            />
                            {opp.featured && (
                              <Chip
                                label="FEATURED"
                                size="small"
                                sx={{
                                  fontWeight: 800,
                                  bgcolor: '#fef3c7',
                                  color: '#b45309',
                                  fontSize: '0.65rem',
                                }}
                              />
                            )}
                          </Box>

                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                            {opp.source || 'Curated'}
                          </Typography>
                        </Box>

                        {/* Title & Organization */}
                        <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5, lineHeight: 1.3 }}>
                          {opp.title}
                        </Typography>
                        <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 700, mb: 2 }}>
                          {opp.organization}
                        </Typography>

                        {/* Key Info Details */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8, mb: 2.5 }}>
                          {opp.location && (
                            <Typography variant="body2" color="text.secondary">
                              <strong>Location:</strong> {opp.location}
                            </Typography>
                          )}
                          {opp.deadline && (
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 700,
                                color: isDeadlinePassed ? 'error.main' : 'warning.dark',
                              }}
                            >
                              <strong>Deadline:</strong> {new Date(opp.deadline).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                              {isDeadlinePassed ? ' (Expired)' : ''}
                            </Typography>
                          )}
                        </Box>
                      </Box>

                      {/* Apply Button */}
                      <Button
                        variant="contained"
                        fullWidth
                        endIcon={<OpenInNewIcon />}
                        href={opp.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        disabled={!opp.url}
                        sx={{
                          borderRadius: '10px',
                          textTransform: 'none',
                          fontWeight: 800,
                          py: 1.1,
                          bgcolor: accentColor,
                          '&:hover': {
                            bgcolor: accentColor,
                            filter: 'brightness(0.9)',
                          },
                        }}
                      >
                        Visit &amp; Apply Online
                      </Button>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Box>
      )}
    </Container>
  );
};

export default StudentPlacementsPage;
