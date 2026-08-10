import React from 'react';
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
  useTheme,
} from '@mui/material';
import {
  ArticleOutlined as ExamIcon,
  GradeOutlined as GradeIcon,
  EmojiEventsOutlined as PassIcon,
} from '@mui/icons-material';

import { useMyProfileQuery } from '../../queries/userProfileQueries';

export const StudentExaminationsPage = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { data: profile } = useMyProfileQuery();

  const studentMeta = profile?.profileMeta || {};

  // Sample examination marks data
  const examRecords = [
    { code: 'CS601', name: 'Advanced Operating Systems', internal: 24, midTerm: 42, maxMarks: 50, grade: 'A+', status: 'PASSED' },
    { code: 'CS602', name: 'Database Management Systems', internal: 22, midTerm: 40, maxMarks: 50, grade: 'A', status: 'PASSED' },
    { code: 'CS603', name: 'Computer Networks & Security', internal: 21, midTerm: 38, maxMarks: 50, grade: 'B+', status: 'PASSED' },
    { code: 'CS604', name: 'Software Engineering & Design', internal: 25, midTerm: 45, maxMarks: 50, grade: 'O', status: 'PASSED' },
    { code: 'CS605', name: 'Web Technology Lab', internal: 25, midTerm: 48, maxMarks: 50, grade: 'O', status: 'PASSED' },
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 3.5 }}>
      {/* Page Header */}
      <Box sx={{ mb: 3.5 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em', mb: 0.5 }}>
          Examinations & Internal Assessment Gradebook
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Official semester evaluation records for Course <strong>{studentMeta?.course || 'B.Tech'}</strong> (Sem{' '}
          {studentMeta?.semester || 6}).
        </Typography>
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
                  8.85 / 10.0
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
                <Chip label="PASSED WITH DISTINCTION" color="success" sx={{ fontWeight: 800, mt: 0.5 }} />
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
                  5 / 5
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
                <TableCell sx={{ fontWeight: 800 }}>INTERNAL MARKS (25)</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>MID-TERM MARKS (50)</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>GRADE</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>RESULT STATUS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {examRecords.map((row) => (
                <TableRow key={row.code} hover>
                  <TableCell>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                      {row.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {row.code}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{row.internal} / 25</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{row.midTerm} / 50</TableCell>
                  <TableCell>
                    <Chip label={row.grade} color="primary" size="small" sx={{ fontWeight: 800 }} />
                  </TableCell>
                  <TableCell>
                    <Chip label={row.status} color="success" size="small" sx={{ fontWeight: 800 }} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
};

export default StudentExaminationsPage;
