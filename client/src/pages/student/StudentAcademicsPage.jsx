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
  const admissionYear = currentUser?.admissionYear || 2024;

  const { data: liveSubjects } = useSubjectsQuery({
    branchId: branchId || undefined,
    semester: currentUser?.semester || undefined,
  });

  const subjects = (liveSubjects && liveSubjects.length > 0)
    ? liveSubjects
    : [
        { sequenceNo: 6, semester: 3, name: 'Deep Learning & Neural Networks', credits: 4, type: 'THEORY', faculty: 'Dr. Rajesh Sharma' },
        { sequenceNo: 1, semester: 3, name: 'Data Structures & Algorithms', credits: 4, type: 'THEORY', faculty: 'Prof. Anita Verma' },
        { sequenceNo: 2, semester: 3, name: 'Database Management Systems', credits: 3, type: 'THEORY', faculty: 'Prof. Suresh Kumar' },
        { sequenceNo: 4, semester: 3, name: 'Software Engineering & Design', credits: 3, type: 'THEORY', faculty: 'Dr. Priya Mehta' },
        { sequenceNo: 5, semester: 3, name: 'AI & Machine Learning Lab', credits: 2, type: 'PRACTICAL LAB', faculty: 'Prof. Vikram Singh' },
      ];

  return (
    <Container maxWidth="xl" sx={{ py: 3.5 }}>
      {/* Header */}
      <Box sx={{ mb: 3.5 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em', mb: 0.5 }}>
          My Academic Subjects & Curriculum
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Enrolled subject syllabus for Course <strong>{studentMeta?.course || 'B.Tech'}</strong> • Branch{' '}
          <strong>{studentMeta?.branch || 'CSE'}</strong> (Semester {currentUser?.semester || 3} · Batch &apos;{String(admissionYear).slice(-2)}).
        </Typography>
      </Box>

      {/* Grid List of Enrolled Subjects */}
      <Grid container spacing={3}>
        {subjects.map((sub, idx) => {
          const displayCode = computeSubjectCode(sub, sub.branchId || branchObj || 'CAI', admissionYear);
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
                    label={sub.type}
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
                  Course Credits: <strong>{sub.credits} Credits</strong>
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
                    {sub.faculty}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        );
      })}
    </Grid>
    </Container>
  );
};

export default StudentAcademicsPage;
