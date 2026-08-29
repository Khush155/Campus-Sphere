import React from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Chip,
  Avatar,
  useTheme,
} from '@mui/material';
import {
  PersonOutlined as PersonIcon,
  MenuBookOutlined as BookIcon,
  ClassOutlined as TheoryIcon,
  ScienceOutlined as LabIcon,
  StarOutline as StarIcon,
} from '@mui/icons-material';

import { useAuth } from '../../contexts/AuthContext';
import { useMyProfileQuery } from '../../queries/userProfileQueries';
import { useSubjectsQuery } from '../../queries/collegeQueries';
import { computeSubjectCode } from '../../utils/subjectCode';

export const StudentAcademicsPage = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { user } = useAuth();
  const { data: profile } = useMyProfileQuery();

  const currentUser = profile?.user || user;
  const studentMeta = profile?.profileMeta || {};

  const branchObj = currentUser?.branchId;
  const branchId = typeof branchObj === 'object' ? branchObj?._id : branchObj;
  const semesterVal = currentUser?.semester || studentMeta?.semester;
  const admissionYear = currentUser?.admissionYear || 2024;

  const { data: liveSubjects, isLoading } = useSubjectsQuery({
    branchId: branchId || undefined,
    semester: semesterVal || undefined,
  });

  const subjects = Array.isArray(liveSubjects) ? liveSubjects : [];
  const theoryCount = subjects.filter((s) => s.type !== 'PRACTICAL LAB').length;
  const labCount = subjects.filter((s) => s.type === 'PRACTICAL LAB').length;
  const totalCredits = subjects.reduce((sum, s) => sum + (s.credits || 3), 0);

  return (
    <Container maxWidth="xl" sx={{ py: 3.5 }}>
      {/* Header */}
      <Box sx={{ mb: 3.5 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em', mb: 0.5 }}>
          My Academic Subjects & Curriculum
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Enrolled subject syllabus for Course <strong>{studentMeta?.course || 'B.Tech'}</strong> • Branch{' '}
          <strong>{studentMeta?.branch || 'CSE'}</strong> (Semester {semesterVal || 'N/A'} · Batch &apos;{String(admissionYear).slice(-2)}).
        </Typography>
      </Box>

      {/* Roster-Style 4-Color Top-Bordered KPI Grid */}
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
                Enrolled Subjects
              </Typography>
              <Avatar sx={{ bgcolor: 'rgba(79, 70, 229, 0.12)', color: '#4f46e5', width: 40, height: 40, borderRadius: '10px' }}>
                <BookIcon fontSize="small" />
              </Avatar>
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', fontFamily: theme.typography.mono?.fontFamily || 'monospace' }}>
                {subjects.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Registered courses
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
                Theory Lectures
              </Typography>
              <Avatar sx={{ bgcolor: 'rgba(6, 182, 212, 0.12)', color: '#06b6d4', width: 40, height: 40, borderRadius: '10px' }}>
                <TheoryIcon fontSize="small" />
              </Avatar>
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', fontFamily: theme.typography.mono?.fontFamily || 'monospace' }}>
                {theoryCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Core academic papers
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
                Practical Labs
              </Typography>
              <Avatar sx={{ bgcolor: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', width: 40, height: 40, borderRadius: '10px' }}>
                <LabIcon fontSize="small" />
              </Avatar>
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', fontFamily: theme.typography.mono?.fontFamily || 'monospace' }}>
                {labCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Laboratory sessions
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
                Total Credits
              </Typography>
              <Avatar sx={{ bgcolor: 'rgba(16, 185, 129, 0.12)', color: '#10b981', width: 40, height: 40, borderRadius: '10px' }}>
                <StarIcon fontSize="small" />
              </Avatar>
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'success.main', fontFamily: theme.typography.mono?.fontFamily || 'monospace' }}>
                {totalCredits}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Earnable term credits
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Grid List of Enrolled Subjects */}
      {isLoading ? (
        <Paper elevation={0} sx={{ p: 4, borderRadius: '24px', textAlign: 'center', border: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.secondary' }}>
            Loading enrolled academic subjects...
          </Typography>
        </Paper>
      ) : subjects.length === 0 ? (
        <Paper elevation={0} sx={{ p: 4, borderRadius: '24px', textAlign: 'center', border: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5 }}>
            No Enrolled Subjects Found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
            No active curriculum subjects are registered for Semester {semesterVal || 'N/A'} in your branch.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {subjects.map((sub, idx) => {
            const displayCode = computeSubjectCode(sub, sub.branchId || branchObj || 'CAI', admissionYear);
            const facultyName =
              sub.facultyId?.name ||
              sub.facultyId?.user?.name ||
              (typeof sub.facultyId === 'string' ? sub.facultyId : null) ||
              sub.faculty ||
              'Unassigned';

            return (
              <Grid item xs={12} sm={6} md={4} key={sub._id || sub.sequenceNo || idx}>
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
                      <Chip label={displayCode} color="primary" size="small" sx={{ fontWeight: 800 }} />
                      <Chip
                        label={sub.type || 'THEORY'}
                        size="small"
                        variant="outlined"
                        color={sub.type === 'PRACTICAL LAB' ? 'secondary' : 'default'}
                        sx={{ fontWeight: 800, fontSize: '0.7rem' }}
                      />
                    </Box>

                    <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', mb: 1 }}>
                      {sub.name}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 2 }}>
                      Course Credits: <strong>{sub.credits || 3} Credits</strong>
                    </Typography>
                  </Box>

                  <Box sx={{ pt: 2, borderTop: `1px solid ${theme.palette.divider}`, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ width: 34, height: 34, bgcolor: `${theme.palette.primary.main}15`, color: theme.palette.primary.main }}>
                      <PersonIcon fontSize="small" />
                    </Avatar>

                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>
                        FACULTY INSTRUCTOR
                      </Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', fontSize: '0.82rem' }}>
                        {facultyName}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Container>
  );
};

export default StudentAcademicsPage;
