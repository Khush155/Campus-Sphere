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

  return (
    <Container maxWidth="xl" sx={{ py: 3.5 }}>
      {/* Header */}
      <Box sx={{ mb: 3.5 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em', mb: 0.5 }}>
          My Academic Subjects & Curriculum
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Enrolled subject syllabus for Course <strong>{studentMeta?.course || 'B.Tech'}</strong> • Branch{' '}
          <strong>{studentMeta?.branch || 'CSE'}</strong> (Semester {semesterVal || 3} · Batch &apos;{String(admissionYear).slice(-2)}).
        </Typography>
      </Box>

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
            No active curriculum subjects are registered for Semester {semesterVal || 3} in your branch.
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
              'Department Faculty';

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
