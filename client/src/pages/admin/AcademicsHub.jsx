import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import api from '../../services/api';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Book as BookIcon,
  CalendarMonth as CalendarIcon,
  Class as ClassIcon,
  Event as EventIcon,
  MenuBook as SubjectIcon,
} from '@mui/icons-material';

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const AcademicsHub = () => {
  const location = useLocation();
  const [tabValue, setTabValue] = useState(() => {
    if (location.pathname.includes('/subjects')) return 1;
    if (location.pathname.includes('/calendar')) return 2;
    return 0;
  });

  useEffect(() => {
    if (location.pathname.includes('/subjects')) setTabValue(1);
    else if (location.pathname.includes('/calendar')) setTabValue(2);
    else setTabValue(0);
  }, [location.pathname]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ['academics-courses'],
    queryFn: () => api.get('/academics/courses').then((res) => res.data.data),
  });

  const { data: subjectsData, isLoading: subjectsLoading } = useQuery({
    queryKey: ['academics-subjects'],
    queryFn: () => api.get('/academics/subjects').then((res) => res.data.data),
  });

  const courses = coursesData || [];
  const subjects = subjectsData || [];

  const calendarEvents = [
    { id: 1, date: '10 July 2026', title: 'Odd Semester Starts', type: 'Academic' },
    { id: 2, date: '20 July 2026', title: 'Exam Registration Opens', type: 'Administrative' },
    { id: 3, date: '30 July 2026', title: 'Mid-Term Holiday', type: 'Holiday' },
    { id: 4, date: '15 August 2026', title: 'Independence Day', type: 'Holiday' },
  ];

  if (coursesLoading || subjectsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, md: 3 } }}>
      <Box sx={{ mb: 4, display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
            <BookIcon fontSize="large" color="primary" />
            Academics Hub
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage courses, subjects, and the academic calendar.
          </Typography>
        </Box>
      </Box>

      <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <Box sx={{ px: 3, pt: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
            <Tab icon={<ClassIcon fontSize="small" sx={{ mr: 1 }} />} iconPosition="start" label="Courses" sx={{ fontWeight: 600, minHeight: 48 }} />
            <Tab icon={<SubjectIcon fontSize="small" sx={{ mr: 1 }} />} iconPosition="start" label="Subjects" sx={{ fontWeight: 600, minHeight: 48 }} />
            <Tab icon={<CalendarIcon fontSize="small" sx={{ mr: 1 }} />} iconPosition="start" label="Academic Calendar" sx={{ fontWeight: 600, minHeight: 48 }} />
          </Tabs>
        </Box>

        <Box sx={{ p: { xs: 2, md: 4 } }}>
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              {courses.map((course) => (
                <Grid item xs={12} md={6} key={course.id}>
                  <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }} elevation={0}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>{course.name}</Typography>
                        <Chip label={course.type} size="small" color="primary" variant="outlined" />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 2 }}>
                        Duration: {course.duration}
                      </Typography>
                      <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 2 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                          AVAILABLE BRANCHES
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {course.branches?.map(branch => (
                            <Chip key={branch} label={branch} size="small" sx={{ borderRadius: 1 }} />
                          ))}
                          {(!course.branches || course.branches.length === 0) && (
                            <Typography variant="caption" color="text.secondary">No branches defined</Typography>
                          )}
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
              {courses.length === 0 && (
                <Grid item xs={12}>
                  <Alert severity="info" sx={{ borderRadius: 2 }}>No courses have been configured yet.</Alert>
                </Grid>
              )}
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
              <Table>
                <TableHead sx={{ bgcolor: 'background.default' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Subject Code</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Credits</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Semester</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Type</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {subjects.map((row) => (
                    <TableRow key={row.code}>
                      <TableCell sx={{ fontWeight: 600 }}>{row.code}</TableCell>
                      <TableCell>{row.name}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>{row.credits}</TableCell>
                      <TableCell align="center">{row.semester}</TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={row.type} 
                          size="small" 
                          color={row.type === 'Core' ? 'secondary' : row.type === 'Practical' ? 'primary' : row.type === 'Sessional' ? 'warning' : 'default'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, maxWidth: 600 }} elevation={0}>
              <Box sx={{ p: 2, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Upcoming Schedule</Typography>
              </Box>
              <List disablePadding>
                {calendarEvents.map((event, index) => (
                  <React.Fragment key={event.id}>
                    <ListItem sx={{ py: 2 }}>
                      <ListItemIcon>
                        <EventIcon color={event.type === 'Holiday' ? 'error' : 'primary'} fontSize="large" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={event.title} 
                        secondary={event.date}
                        primaryTypographyProps={{ variant: 'body1', fontWeight: 600 }}
                        secondaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                      />
                      <Chip 
                        label={event.type} 
                        size="small" 
                        sx={{ 
                          bgcolor: event.type === 'Holiday' ? 'error.light' : 'primary.light', 
                          color: event.type === 'Holiday' ? 'error.main' : 'primary.main',
                          fontWeight: 600 
                        }} 
                      />
                    </ListItem>
                    {index < calendarEvents.length - 1 && <Box component="li"><Box sx={{ borderBottom: '1px solid', borderColor: 'divider', ml: 9 }} /></Box>}
                  </React.Fragment>
                ))}
              </List>
            </Card>
          </TabPanel>
        </Box>
      </Card>
    </Box>
  );
};

export default AcademicsHub;
