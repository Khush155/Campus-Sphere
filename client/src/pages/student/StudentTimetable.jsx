import React, { useState } from 'react';
import { Box, Typography, Tabs, Tab, Card, CardContent, Grid, Chip, CircularProgress, Alert } from '@mui/material';
import { AccessTime, MeetingRoom, Person, DateRange } from '@mui/icons-material';
import { useStudentTimetableQuery } from '../../queries/studentQueries';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const StudentTimetable = () => {
  const { data: slots, isLoading, isError } = useStudentTimetableQuery();
  const [selectedDay, setSelectedDay] = useState(() => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    return DAYS_OF_WEEK.includes(today) ? today : 'Monday';
  });

  const handleDayChange = (event, newValue) => {
    setSelectedDay(newValue);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box p={3}>
        <Alert severity="error">Failed to load timetable. Please try again later.</Alert>
      </Box>
    );
  }

  const todaySlots = slots?.filter(slot => slot.dayOfWeek === selectedDay) || [];

  return (
    <Box sx={{ flexGrow: 1, p: { xs: 1, md: 3 } }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>
        My Timetable
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Your weekly class schedule and lab sessions.
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={selectedDay} 
          onChange={handleDayChange} 
          variant="scrollable"
          scrollButtons="auto"
          textColor="primary"
          indicatorColor="primary"
        >
          {DAYS_OF_WEEK.map((day) => (
            <Tab key={day} label={day} value={day} sx={{ fontWeight: 600 }} />
          ))}
        </Tabs>
      </Box>

      <Grid container spacing={3}>
        {todaySlots.length > 0 ? (
          todaySlots.map((slot) => (
            <Grid item xs={12} md={6} lg={4} key={slot._id}>
              <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderLeft: '6px solid', borderLeftColor: slot.type === 'Lab' ? 'secondary.main' : 'primary.main' }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Typography variant="h6" fontWeight={700}>
                      {slot.subjectId ? slot.subjectId.name : 'Unknown Subject'}
                    </Typography>
                    <Chip 
                      label={slot.type} 
                      size="small" 
                      color={slot.type === 'Lab' ? 'secondary' : 'primary'} 
                      variant="outlined" 
                    />
                  </Box>
                  
                  <Box display="flex" alignItems="center" gap={1} mb={1.5} color="text.secondary">
                    <AccessTime fontSize="small" />
                    <Typography variant="body2" fontWeight={600}>
                      {slot.startTime} - {slot.endTime}
                    </Typography>
                  </Box>

                  <Box display="flex" alignItems="center" gap={1} mb={1.5} color="text.secondary">
                    <MeetingRoom fontSize="small" />
                    <Typography variant="body2">
                      Room: <strong>{slot.room}</strong>
                    </Typography>
                  </Box>

                  <Box display="flex" alignItems="center" gap={1} color="text.secondary">
                    <Person fontSize="small" />
                    <Typography variant="body2">
                      {slot.facultyId ? `${slot.facultyId.firstName} ${slot.facultyId.lastName}` : 'TBD'}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Box sx={{ textAlign: 'center', p: 5, bgcolor: 'background.paper', borderRadius: 3, border: '1px dashed', borderColor: 'divider' }}>
              <DateRange sx={{ fontSize: 48, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
              <Typography variant="h6" color="text.secondary">No Classes Scheduled</Typography>
              <Typography variant="body2" color="text.disabled">
                You have no classes scheduled for {selectedDay}.
              </Typography>
            </Box>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default StudentTimetable;
