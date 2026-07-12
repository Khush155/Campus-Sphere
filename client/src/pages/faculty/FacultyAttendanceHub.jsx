import React, { useState } from 'react';
import { Box, Typography, Card, Grid, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, MenuItem, TextField, CircularProgress, RadioGroup, FormControlLabel, Radio } from '@mui/material';
import { SaveOutlined, GroupsOutlined } from '@mui/icons-material';
import { useAssignedSubjectsQuery, useEnrolledStudentsQuery, useMarkAttendanceMutation } from '../../queries/attendanceQueries';
import EmptyState from '../../components/common/EmptyState';

const FacultyAttendanceHub = () => {
  const { data: subjects, isLoading: loadingSubjects } = useAssignedSubjectsQuery();
  const markMutation = useMarkAttendanceMutation();

  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const { data: students, isLoading: loadingStudents } = useEnrolledStudentsQuery(selectedSubject);

  const [attendanceRecords, setAttendanceRecords] = useState({});

  // Initialize records when students load
  React.useEffect(() => {
    if (students && students.length > 0) {
      const initial = {};
      students.forEach(s => {
        initial[s._id] = 'PRESENT'; // Default to present
      });
      setAttendanceRecords(initial);
    } else {
      setAttendanceRecords({});
    }
  }, [students]);

  const handleStatusChange = (studentId, status) => {
    setAttendanceRecords(prev => ({ ...prev, [studentId]: status }));
  };

  const handleMarkAll = (status) => {
    const updated = {};
    students.forEach(s => {
      updated[s._id] = status;
    });
    setAttendanceRecords(updated);
  };

  const handleSubmit = async () => {
    if (!selectedSubject || !selectedDate) return alert('Select subject and date');
    
    const records = Object.keys(attendanceRecords).map(studentId => ({
      studentId,
      status: attendanceRecords[studentId]
    }));

    try {
      await markMutation.mutateAsync({
        subjectId: selectedSubject,
        date: new Date(selectedDate).toISOString(),
        records
      });
      alert('Attendance marked successfully!');
    } catch (err) {
      alert('Failed to mark attendance');
    }
  };

  if (loadingSubjects) return <Box textAlign="center" py={5}><CircularProgress /></Box>;

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" mb={3}>Faculty Attendance Hub</Typography>

      <Card elevation={0} sx={{ p: 3, mb: 4, border: '1px solid', borderColor: 'divider' }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              select
              fullWidth
              label="Select Subject"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              <MenuItem value=""><em>-- Select Subject --</em></MenuItem>
              {subjects?.map(sub => (
                <MenuItem key={sub._id} value={sub._id}>{sub.name} ({sub.code})</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              type="date"
              label="Attendance Date"
              InputLabelProps={{ shrink: true }}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </Grid>
        </Grid>
      </Card>

      {selectedSubject && (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" fontWeight="bold">Enrolled Students</Typography>
            <Box>
              <Button size="small" onClick={() => handleMarkAll('PRESENT')} sx={{ mr: 1 }}>Mark All Present</Button>
              <Button size="small" color="error" onClick={() => handleMarkAll('ABSENT')}>Mark All Absent</Button>
            </Box>
          </Box>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Roll Number</TableCell>
                  <TableCell>Student Name</TableCell>
                  <TableCell>Attendance Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingStudents ? (
                  <TableRow><TableCell colSpan={3} align="center"><CircularProgress size={24}/></TableCell></TableRow>
                ) : students?.length > 0 ? (
                  students.map(student => (
                    <TableRow key={student._id}>
                      <TableCell>{student.rollNumber || 'N/A'}</TableCell>
                      <TableCell fontWeight="500">{student.name}</TableCell>
                      <TableCell>
                        <RadioGroup
                          row
                          value={attendanceRecords[student._id] || 'PRESENT'}
                          onChange={(e) => handleStatusChange(student._id, e.target.value)}
                        >
                          <FormControlLabel value="PRESENT" control={<Radio color="success" size="small" />} label="Present" />
                          <FormControlLabel value="ABSENT" control={<Radio color="error" size="small" />} label="Absent" />
                          <FormControlLabel value="LATE" control={<Radio color="warning" size="small" />} label="Late" />
                          <FormControlLabel value="EXCUSED" control={<Radio color="info" size="small" />} label="Excused" />
                        </RadioGroup>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                      <EmptyState message="No students enrolled in this subject's branch/semester." icon={<GroupsOutlined sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />} />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {students?.length > 0 && (
            <Box sx={{ p: 3, display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid', borderColor: 'divider' }}>
              <Button 
                variant="contained" 
                size="large" 
                startIcon={<SaveOutlined />} 
                onClick={handleSubmit}
                disabled={markMutation.isPending}
              >
                Save Attendance Record
              </Button>
            </Box>
          )}
        </Card>
      )}
    </Box>
  );
};

export default FacultyAttendanceHub;
