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
import { useStudentSession } from '../../contexts/StudentSessionContext';
import { useMyProfileQuery } from '../../queries/userProfileQueries';
import { useStudentGpaQuery, useStudentExaminationsQuery } from '../../queries/studentQueries';
import { useSubjectsQuery } from '../../queries/collegeQueries';

export const StudentExaminationsPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isDark = theme.palette.mode === 'dark';
  const { user } = useAuth();
  const { data: profile } = useMyProfileQuery();
  const { selectedSemester, isArchivedView } = useStudentSession();

  const currentUser = profile?.user || user;
  const studentMeta = profile?.profileMeta || {};

  const studentId = currentUser?._id || currentUser?.id;
  const branchObj = currentUser?.branchId;
  const branchId = typeof branchObj === 'object' ? branchObj?._id : branchObj;

  const { data: gpaData, isLoading: isGpaLoading } = useStudentGpaQuery(studentId);
  const { isLoading: isExamsLoading } = useStudentExaminationsQuery();
  const { data: enrolledSubjectsData = [] } = useSubjectsQuery({
    branchId: branchId || undefined,
    semester: selectedSemester || undefined,
  });

  const enrolledSubjects = Array.isArray(enrolledSubjectsData) ? enrolledSubjectsData : [];
  const enrolledCount = enrolledSubjects.length || 5;

  const semesterProgression = gpaData?.semesterProgression || [];
  const currentSemRecord = semesterProgression.find((s) => Number(s.semester) === Number(selectedSemester));

  const gradeBreakdown = currentSemRecord
    ? (currentSemRecord.subjects || [])
    : isArchivedView
    ? []
    : (gpaData?.gradeBreakdown || []);

  const hasPublishedResults = Boolean(currentSemRecord ? (currentSemRecord.subjects?.length > 0) : gpaData && (gpaData.gradeBreakdown?.length > 0 || gpaData.gpa !== undefined));

  const gpaValue = currentSemRecord?.sgpa !== undefined && currentSemRecord?.sgpa !== null
    ? Number(currentSemRecord.sgpa).toFixed(2)
    : !isArchivedView && hasPublishedResults && gpaData?.gpa !== undefined && gpaData?.gpa !== null
    ? Number(gpaData.gpa).toFixed(2)
    : null;

  const resultStatusLabel = useMemo(() => {
    const targetGpa = currentSemRecord?.sgpa !== undefined
      ? currentSemRecord.sgpa
      : !isArchivedView && hasPublishedResults
      ? gpaData?.gpa
      : null;

    if (targetGpa === undefined || targetGpa === null) return 'EVALUATION PENDING';
    if (targetGpa >= 8.5) return 'PASSED WITH DISTINCTION';
    if (targetGpa >= 6.0) return 'PASSED';
    if (targetGpa > 0) return 'NEED IMPROVEMENT';
    return 'FAILED';
  }, [currentSemRecord, isArchivedView, hasPublishedResults, gpaData]);

  const resultStatusColor = useMemo(() => {
    const targetGpa = currentSemRecord?.sgpa !== undefined
      ? currentSemRecord.sgpa
      : !isArchivedView && hasPublishedResults
      ? gpaData?.gpa
      : null;

    if (targetGpa === undefined || targetGpa === null) return 'info';
    if (targetGpa >= 6.0) return 'success';
    if (targetGpa > 0) return 'warning';
    return 'error';
  }, [currentSemRecord, isArchivedView, hasPublishedResults, gpaData]);

  const isLoading = isGpaLoading || isExamsLoading;

  return (
    <Container maxWidth="xl" sx={{ py: 3.5 }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3.5, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
              Examinations & Internal Assessment Gradebook
            </Typography>
            {isArchivedView && (
              <Chip
                label={`SEMESTER ${selectedSemester} ARCHIVED RESULT`}
                color="warning"
                size="small"
                sx={{ fontWeight: 800 }}
              />
            )}
          </Box>
          <Typography variant="body1" color="text.secondary">
            Official semester evaluation records for Course <strong>{studentMeta?.course || 'B.Tech'}</strong> (Semester{' '}
            {selectedSemester}).
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

      {/* Summary KPI Row (4 Roster-Style Top-Bordered Cards) */}
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
                Semester GPA
              </Typography>
              <Avatar sx={{ bgcolor: 'rgba(79, 70, 229, 0.12)', color: '#4f46e5', width: 40, height: 40, borderRadius: '10px' }}>
                <GradeIcon fontSize="small" />
              </Avatar>
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', fontFamily: theme.typography.mono?.fontFamily || 'monospace' }}>
                {gpaValue !== null ? `${gpaValue} / 10.0` : 'Evaluation Pending'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Cumulative grading scale
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
                Academic Standing
              </Typography>
              <Avatar sx={{ bgcolor: 'rgba(16, 185, 129, 0.12)', color: '#10b981', width: 40, height: 40, borderRadius: '10px' }}>
                <PassIcon fontSize="small" />
              </Avatar>
            </Box>
            <Box>
              <Chip label={resultStatusLabel} color={resultStatusColor} sx={{ fontWeight: 800, borderRadius: '6px' }} />
              <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.75 }}>
                Official university status
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
                Evaluated Courses
              </Typography>
              <Avatar sx={{ bgcolor: 'rgba(6, 182, 212, 0.12)', color: '#06b6d4', width: 40, height: 40, borderRadius: '10px' }}>
                <ExamIcon fontSize="small" />
              </Avatar>
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', fontFamily: theme.typography.mono?.fontFamily || 'monospace' }}>
                {gradeBreakdown.length} <Typography component="span" variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>/ {enrolledCount}</Typography>
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Graded subjects in portal
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            onClick={() => navigate('/student/hall-ticket')}
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
              cursor: 'pointer',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-2px)' },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                Hall Ticket / Admit Card
              </Typography>
              <Avatar sx={{ bgcolor: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', width: 40, height: 40, borderRadius: '10px' }}>
                <HallTicketIcon fontSize="small" />
              </Avatar>
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#f59e0b' }}>
                Available to Download →
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Click to view verified hall ticket
              </Typography>
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
