import React, { useState } from 'react';
import { Box, Typography, Card, CardContent, Grid, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, CircularProgress, Alert, AlertTitle, LinearProgress } from '@mui/material';
import { WarningAmberOutlined, FlightTakeoffOutlined } from '@mui/icons-material';
import { useStudentAttendanceSummaryQuery, usePredictHolidayImpactMutation } from '../../queries/attendanceQueries';

const StudentAttendancePortal = () => {
  const { data: summary, isLoading: loadingSummary } = useStudentAttendanceSummaryQuery();
  const predictMutation = usePredictHolidayImpactMutation();

  const [planner, setPlanner] = useState({ startDate: '', endDate: '' });
  const [prediction, setPrediction] = useState(null);

  const handlePredict = async (e) => {
    e.preventDefault();
    try {
      const result = await predictMutation.mutateAsync({
        startDate: new Date(planner.startDate).toISOString(),
        endDate: new Date(planner.endDate).toISOString()
      });
      setPrediction(result);
    } catch (err) {
      alert('Failed to calculate projection');
    }
  };

  if (loadingSummary) return <Box textAlign="center" py={5}><CircularProgress /></Box>;

  const isLow = summary?.overallPercentage < 75;

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" mb={3}>Attendance Portal</Typography>

      {isLow && (
        <Alert severity="error" icon={<WarningAmberOutlined fontSize="inherit" />} sx={{ mb: 4 }}>
          <AlertTitle>Low Attendance Warning</AlertTitle>
          Your overall attendance is <strong>{summary?.overallPercentage}%</strong>, which is below the required 75% threshold. Please attend classes regularly to avoid academic penalties.
        </Alert>
      )}

      <Grid container spacing={4} mb={4}>
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ height: '100%', bgcolor: 'primary.main', color: 'primary.contrastText', p: 2 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>Overall Attendance</Typography>
              <Typography variant="h2" fontWeight="bold" mt={1}>{summary?.overallPercentage || 0}%</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                {summary?.totalAttended || 0} / {summary?.totalClasses || 0} Classes Attended
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card elevation={0} sx={{ height: '100%', border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={2}>Subject-wise Breakdown</Typography>
              <Box sx={{ maxHeight: 200, overflow: 'auto', pr: 2 }}>
                {summary?.subjectBreakdown?.map((sub) => (
                  <Box key={sub.subject._id} mb={2}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" fontWeight="500">{sub.subject.name}</Typography>
                      <Typography variant="body2" color={sub.percentage < 75 ? 'error.main' : 'text.secondary'}>
                        {sub.percentage}% ({sub.attendedClasses}/{sub.totalClasses})
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={sub.percentage} 
                      color={sub.percentage < 75 ? 'error' : 'success'}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                ))}
                {(!summary?.subjectBreakdown || summary.subjectBreakdown.length === 0) && (
                  <Typography color="text.secondary">No attendance records found yet.</Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Typography variant="h5" fontWeight="bold" mb={2} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <FlightTakeoffOutlined /> Holiday Planner & Predictor
      </Typography>
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', mb: 4 }}>
        <CardContent>
          <Typography variant="body1" color="text.secondary" mb={3}>
            Planning a trip? Enter your dates to see how it will impact your overall attendance and check for conflicts with exams or public holidays.
          </Typography>
          
          <form onSubmit={handlePredict}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <TextField fullWidth type="date" label="Start Date" required InputLabelProps={{ shrink: true }} value={planner.startDate} onChange={e => setPlanner({ ...planner, startDate: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth type="date" label="End Date" required InputLabelProps={{ shrink: true }} value={planner.endDate} onChange={e => setPlanner({ ...planner, endDate: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Button type="submit" variant="contained" size="large" fullWidth disabled={predictMutation.isPending}>
                  Calculate Impact
                </Button>
              </Grid>
            </Grid>
          </form>

          {prediction && (
            <Box mt={4} p={3} bgcolor="grey.50" borderRadius={2} border="1px solid" borderColor="divider">
              <Typography variant="h6" fontWeight="bold" mb={2}>Projection Results</Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Box p={2} bgcolor="white" borderRadius={1} border="1px solid" borderColor="divider">
                    <Typography variant="body2" color="text.secondary">Current Attendance</Typography>
                    <Typography variant="h5" fontWeight="bold">{prediction.currentPercentage}%</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box p={2} bgcolor="white" borderRadius={1} border="1px solid" borderColor={prediction.willDropBelowThreshold ? 'error.main' : 'divider'}>
                    <Typography variant="body2" color="text.secondary">Projected Attendance</Typography>
                    <Typography variant="h5" fontWeight="bold" color={prediction.willDropBelowThreshold ? 'error.main' : 'inherit'}>
                      {prediction.projectedPercentage}%
                    </Typography>
                    {prediction.willDropBelowThreshold && (
                      <Typography variant="caption" color="error.main">Will drop below 75% threshold!</Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>

              <Box mt={3}>
                <Typography variant="subtitle2" fontWeight="bold" mb={1}>Impact Breakdown:</Typography>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  <li>You will miss <strong>{prediction.expectedMissedClasses}</strong> scheduled classes during this period.</li>
                  {prediction.holidays?.length > 0 && (
                    <li>Includes {prediction.holidays.length} public holiday(s) where classes are not scheduled.</li>
                  )}
                </ul>
              </Box>

              {prediction.conflicts?.length > 0 && (
                <Alert severity="warning" sx={{ mt: 3 }}>
                  <AlertTitle>Schedule Conflict Detected!</AlertTitle>
                  Your planned holiday overlaps with the following academic events:
                  <ul style={{ margin: 0, paddingLeft: 20, marginTop: 8 }}>
                    {prediction.conflicts.map(c => (
                      <li key={c._id}><strong>{c.title}</strong> ({c.type})</li>
                    ))}
                  </ul>
                </Alert>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default StudentAttendancePortal;
