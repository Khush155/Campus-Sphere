import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  Button,
  useTheme,
} from '@mui/material';
import {
  ArticleOutlined as ExamIcon,
  GradeOutlined as GradeIcon,
  EmojiEventsOutlined as PassIcon,
  ConfirmationNumberOutlined as HallTicketIcon,
} from '@mui/icons-material';

import { useAuth } from '../../contexts/AuthContext';
import { useMyProfileQuery } from '../../queries/userProfileQueries';
import { useStudentGpaQuery, useStudentExaminationsQuery } from '../../queries/studentQueries';
import { useSubjectsQuery } from '../../queries/collegeQueries';

export const StudentExaminationsPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isDark = theme.palette.mode === 'dark';
  const { user } = useAuth();
  const { data: profile } = useMyProfileQuery();

  const currentUser = profile?.user || user;
  const studentMeta = profile?.profileMeta || {};

  const studentId = currentUser?._id || currentUser?.id;
  const branchObj = currentUser?.branchId;
  const branchId = typeof branchObj === 'object' ? branchObj?._id : branchObj;
  const semesterVal = currentUser?.semester || studentMeta?.semester || 1;

  const { data: gpaData, isLoading: isGpaLoading } = useStudentGpaQuery(studentId);
  const { isLoading: isExamsLoading } = useStudentExaminationsQuery();
  const { data: enrolledSubjectsData = [] } = useSubjectsQuery({
    branchId: branchId || undefined,
    semester: semesterVal || undefined,
  });

  const enrolledSubjects = Array.isArray(enrolledSubjectsData) ? enrolledSubjectsData : [];
  const enrolledCount = enrolledSubjects.length || 5;

  const gradeBreakdown = gpaData?.gradeBreakdown || [];
  const gpaValue = gpaData?.gpa !== undefined && gpaData?.gpa !== null && Number(gpaData.gpa) > 0 ? Number(gpaData.gpa).toFixed(2) : null;

  const resultStatusLabel = useMemo(() => {
    if (gpaData?.gpa === undefined || gpaData?.gpa === null) return 'EVALUATION PENDING';
    if (gpaData.gpa >= 8.5) return 'PASSED WITH DISTINCTION';
    if (gpaData.gpa >= 6.0) return 'PASSED';
    if (gpaData.gpa > 0) return 'NEED IMPROVEMENT';
    return 'EVALUATION PENDING';
  }, [gpaData]);

  const resultStatusColor = useMemo(() => {
    if (gpaData?.gpa === undefined || gpaData?.gpa === null) return 'info';
    if (gpaData.gpa >= 6.0) return 'success';
    if (gpaData.gpa > 0) return 'warning';
    return 'info';
  }, [gpaData]);

  const isLoading = isGpaLoading || isExamsLoading;

  return (
    <Container maxWidth="xl" sx={{ py: 3.5 }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3.5, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em', mb: 0.5 }}>
            Examinations & Internal Assessment Gradebook
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Official semester evaluation records for Course <strong>{studentMeta?.course || 'B.Tech'}</strong> (Sem{' '}
            {studentMeta?.semester || 6}).
          </Typography>
        </Box>

        <Button
          variant="contained"
          color="primary"
          startIcon={<HallTicketIcon />}
          onClick={() => navigate('/student/hall-ticket')}
          sx={{
            borderRadius: '12px',
            px: 3,
            py: 1.25,
            fontWeight: 800,
            textTransform: 'none',
            boxShadow: '0 8px 20px rgba(79, 70, 229, 0.25)',
          }}
        >
          View Exam Hall Ticket / Admit Card
        </Button>
      </Box>

      {/* Summary KPI Row */}
      <Grid container spacing={3} sx={{ mb: 3.5 }}>
        <Grid item xs={12} sm={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: '20px',
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: isDark ? 'background.paper' : '#ffffff',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: `${theme.palette.primary.main}15`, color: theme.palette.primary.main, width: 48, height: 48 }}>
                <GradeIcon />
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                  CURRENT SEMESTER GPA
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
                  {gpaValue !== null && Number(gpaValue) > 0 ? `${gpaValue} / 10.0` : 'Evaluation Pending'}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: '20px',
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: isDark ? 'background.paper' : '#ffffff',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: `${theme.palette.success.main}15`, color: theme.palette.success.main, width: 48, height: 48 }}>
                <PassIcon />
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                  ACADEMIC RESULT STATUS
                </Typography>
                <Chip label={resultStatusLabel} color={resultStatusColor} sx={{ fontWeight: 800, mt: 0.5 }} />
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: '20px',
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: isDark ? 'background.paper' : '#ffffff',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: `${theme.palette.info.main}15`, color: theme.palette.info.main, width: 48, height: 48 }}>
                <ExamIcon />
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                  EVALUATED SUBJECTS
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
                  {gradeBreakdown.length} / {enrolledCount}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Gradebook Table */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: '24px',
          border: `1px solid ${theme.palette.divider}`,
          overflow: 'hidden',
          bgcolor: isDark ? 'background.paper' : '#ffffff',
        }}
      >
        <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary' }}>
            Mid-Term & Internal Evaluation Grade Sheet
          </Typography>
        </Box>

        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>SUBJECT CODE & NAME</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>CREDITS</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>GRADE POINT</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>GRADE</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>RESULT STATUS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, fontWeight: 600 }}>
                    Loading examination grade sheet...
                  </TableCell>
                </TableRow>
              ) : gradeBreakdown.length === 0 ? (
                enrolledSubjects.length > 0 ? (
                  enrolledSubjects.map((sub, idx) => (
                    <TableRow key={sub._id || idx} hover>
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                          {sub.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {sub.code || `SUB-${sub.sequenceNo || idx + 1}`}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{sub.credits || 4} Credits</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>—</TableCell>
                      <TableCell>
                        <Chip label="Pending" size="small" variant="outlined" sx={{ fontWeight: 800 }} />
                      </TableCell>
                      <TableCell>
                        <Chip label="Evaluation Pending" color="info" size="small" sx={{ fontWeight: 800 }} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary', fontWeight: 600 }}>
                      No published evaluation results recorded yet for this semester.
                    </TableCell>
                  </TableRow>
                )
              ) : (
                gradeBreakdown.map((row, idx) => (
                  <TableRow key={row.subjectCode || idx} hover>
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                        {row.subjectName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {row.subjectCode}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{row.credits} Credits</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{row.gradePoint} / 10</TableCell>
                    <TableCell>
                      <Chip label={row.grade || 'A'} color="primary" size="small" sx={{ fontWeight: 800 }} />
                    </TableCell>
                    <TableCell>
                      <Chip label="PASSED" color="success" size="small" sx={{ fontWeight: 800 }} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
};

export default StudentExaminationsPage;
