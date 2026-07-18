import React, { useState } from 'react';
import { Box, Typography, Tabs, Tab, Card, CardContent, Grid, Chip, CircularProgress, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { EventNote, AssignmentTurnedIn, CalendarToday, Timer, Grade } from '@mui/icons-material';
import { useStudentUpcomingExamsQuery, useStudentExamResultsQuery } from '../../queries/studentQueries';

const StudentExaminations = () => {
  const [tabValue, setTabValue] = useState(0);
  const { data: upcomingExams, isLoading: loadingExams, isError: errorExams } = useStudentUpcomingExamsQuery();
  const { data: examResults, isLoading: loadingResults, isError: errorResults } = useStudentExamResultsQuery();

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ flexGrow: 1, p: { xs: 1, md: 3 } }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>
        Examinations
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Track your upcoming exam schedule and view your past results.
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} textColor="primary" indicatorColor="primary">
          <Tab icon={<EventNote />} iconPosition="start" label="Upcoming Exams" sx={{ fontWeight: 600 }} />
          <Tab icon={<AssignmentTurnedIn />} iconPosition="start" label="Exam Results" sx={{ fontWeight: 600 }} />
        </Tabs>
      </Box>

      {/* Upcoming Exams Tab */}
      {tabValue === 0 && (
        <Box>
          {loadingExams ? (
            <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
          ) : errorExams ? (
            <Alert severity="error">Failed to load upcoming exams.</Alert>
          ) : upcomingExams?.length > 0 ? (
            <Grid container spacing={3}>
              {upcomingExams.map((exam) => (
                <Grid item xs={12} md={6} key={exam._id}>
                  <Card sx={{ borderRadius: 3, borderLeft: '6px solid', borderLeftColor: 'primary.main', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                        <Typography variant="h6" fontWeight={700}>
                          {exam.title}
                        </Typography>
                        <Chip label={exam.type} size="small" color="primary" variant="outlined" />
                      </Box>
                      
                      <Typography variant="subtitle1" color="text.secondary" fontWeight={600} mb={2}>
                        {exam.subjectId ? exam.subjectId.name : 'Unknown Subject'} ({exam.subjectId ? exam.subjectId.code : ''})
                      </Typography>

                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Box display="flex" alignItems="center" gap={1} color="text.secondary">
                            <CalendarToday fontSize="small" />
                            <Typography variant="body2">
                              {new Date(exam.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box display="flex" alignItems="center" gap={1} color="text.secondary">
                            <Timer fontSize="small" />
                            <Typography variant="body2">
                              {new Date(exam.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} ({exam.durationMinutes} mins)
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12}>
                          <Box display="flex" alignItems="center" gap={1} color="text.secondary">
                            <Grade fontSize="small" />
                            <Typography variant="body2">
                              Max Marks: <strong>{exam.maxMarks}</strong> | Passing: <strong>{exam.passingMarks}</strong>
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box sx={{ textAlign: 'center', p: 6, bgcolor: 'background.paper', borderRadius: 3, border: '1px dashed', borderColor: 'divider' }}>
              <EventNote sx={{ fontSize: 48, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
              <Typography variant="h6" color="text.secondary">No Upcoming Exams</Typography>
              <Typography variant="body2" color="text.disabled">
                You have no scheduled exams at the moment.
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* Exam Results Tab */}
      {tabValue === 1 && (
        <Box>
          {loadingResults ? (
            <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
          ) : errorResults ? (
            <Alert severity="error">Failed to load exam results.</Alert>
          ) : examResults?.length > 0 ? (
            <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <Table sx={{ minWidth: 650 }}>
                <TableHead sx={{ bgcolor: 'background.default' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Exam Title</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Subject</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">Max Marks</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">Marks Obtained</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {examResults.map((result) => {
                    const isPass = result.marksObtained >= (result.examId?.passingMarks || 40);
                    return (
                      <TableRow key={result._id} hover>
                        <TableCell>{result.examId?.title || 'Unknown Exam'}</TableCell>
                        <TableCell>{result.examId?.subjectId?.name || 'Unknown'}</TableCell>
                        <TableCell>
                          <Chip label={result.examId?.type || 'N/A'} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell align="center">{result.examId?.maxMarks || 100}</TableCell>
                        <TableCell align="center">
                          <Typography fontWeight={700} color={isPass ? 'success.main' : 'error.main'}>
                            {result.marksObtained}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={isPass ? 'PASS' : 'FAIL'} 
                            color={isPass ? 'success' : 'error'} 
                            size="small" 
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ textAlign: 'center', p: 6, bgcolor: 'background.paper', borderRadius: 3, border: '1px dashed', borderColor: 'divider' }}>
              <AssignmentTurnedIn sx={{ fontSize: 48, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
              <Typography variant="h6" color="text.secondary">No Results Found</Typography>
              <Typography variant="body2" color="text.disabled">
                Your exam results will appear here once they are published.
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default StudentExaminations;
