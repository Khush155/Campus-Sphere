// client/src/pages/faculty/attendance/AttendancePage.jsx
//
// Main orchestrator page for the Faculty Attendance Module with backend integration.

import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Snackbar,
  Alert,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Save as SubmitIcon,
  RestartAlt as ResetIcon,
  CalendarToday as CalendarIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Attendance components
import SubjectSelector from './components/SubjectSelector';
import SectionSelector from './components/SectionSelector';
import DateSelector from './components/DateSelector';
import StudentAttendanceTable from './components/StudentAttendanceTable';
import AttendanceSummaryCard from './components/AttendanceSummaryCard';

// Import backend hooks
import {
  useFacultyDashboardQuery,
  useSubmitAttendanceMutation,
  useAttendanceQuery,
} from '../../../queries/facultyQueries';
import { useUsersQuery } from '../../../queries/userQueries';

const formatDateToISO = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const AttendancePage = () => {
  const navigate = useNavigate();

  // State Management
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [selectedDate, setSelectedDate] = useState(formatDateToISO(new Date()));
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // 1. Fetch dashboard stats for assigned subjects list
  const { data: dashboardData, isLoading: isDashboardLoading } = useFacultyDashboardQuery();
  const assignedSubjects = dashboardData?.assignedSubjects || [];

  // Helper to determine sections based on subject code
  const getSectionsForSubject = (subjectId) => {
    const subject = assignedSubjects.find((s) => s.id === subjectId);
    if (!subject) return [];
    const code = subject.code || '';
    if (code.startsWith('CS')) {
      return [
        { id: 'CSE-A', name: 'CSE-A', strength: 20 },
        { id: 'CSE-B', name: 'CSE-B', strength: 18 },
      ];
    }
    if (code.startsWith('EC')) {
      return [{ id: 'ECE-A', name: 'ECE-A', strength: 20 }];
    }
    return [{ id: 'CSE-A', name: 'CSE-A', strength: 20 }];
  };

  const sectionsForSubject = getSectionsForSubject(selectedSubjectId);

  // Is the form complete enough to show the student table?
  const isFormReady = !!(selectedSubjectId && selectedSectionId && selectedDate);

  // 2. Fetch students from the active section
  const { data: studentsResponse, isLoading: isStudentsLoading } = useUsersQuery({
    role: 'STUDENT',
    group: selectedSectionId || undefined,
    limit: 100,
  });

  const studentsList = useMemo(() => studentsResponse?.data || [], [studentsResponse]);

  // Map database student list to display-ready structure
  const formattedStudents = useMemo(() => {
    return studentsList.map((stud, idx) => ({
      id: stud.id || stud._id,
      name: stud.name,
      email: stud.email,
      rollNumber: stud.rollNumber || `CS20260${idx + 1}`,
    }));
  }, [studentsList]);

  // 3. Fetch existing attendance records
  const { data: existingAttendance } = useAttendanceQuery(
    {
      subjectId: selectedSubjectId,
      date: selectedDate,
      group: selectedSectionId,
    },
    isFormReady
  );

  // Sync attendance list when students or existing attendance load
  useEffect(() => {
    if (formattedStudents.length > 0) {
      const records = {};
      formattedStudents.forEach((s) => {
        const match = existingAttendance?.find((r) => (r.studentId?._id || r.studentId) === s.id);
        records[s.id] = match ? match.status : 'PRESENT';
      });
      setAttendanceRecords(records);
    } else {
      setAttendanceRecords({});
    }
  }, [formattedStudents, existingAttendance]);

  const submitAttendanceMutation = useSubmitAttendanceMutation();

  // Summary Counts (memoized)
  const summaryCounts = useMemo(() => {
    const values = Object.values(attendanceRecords);
    const present = values.filter((s) => s === 'PRESENT').length;
    const absent = values.filter((s) => s === 'ABSENT').length;
    const medicalLeave = values.filter((s) => s === 'MEDICAL_LEAVE').length;
    const dutyLeave = values.filter((s) => s === 'DUTY_LEAVE').length;
    return { present, absent, medicalLeave, dutyLeave };
  }, [attendanceRecords]);

  const totalStudents = formattedStudents.length;
  const attendancePercentage =
    totalStudents > 0
      ? ((summaryCounts.present + summaryCounts.medicalLeave + summaryCounts.dutyLeave) / totalStudents) * 100
      : 0;

  // Timetable Guard: Relaxed for development testing
  const isClassScheduledToday = true;

  const canSubmit = isFormReady && isClassScheduledToday && totalStudents > 0 && Object.keys(attendanceRecords).length > 0;

  const handleSubjectChange = (subjectId) => {
    setSelectedSubjectId(subjectId);
    const sections = getSectionsForSubject(subjectId);
    if (sections.length > 0) {
      setSelectedSectionId(sections[0].id);
    } else {
      setSelectedSectionId('');
    }
  };

  const handleSectionChange = (sectionId) => {
    setSelectedSectionId(sectionId);
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const handleStatusChange = (studentId, status) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleMarkAll = (status) => {
    const newRecords = {};
    formattedStudents.forEach((s) => {
      newRecords[s.id] = status;
    });
    setAttendanceRecords(newRecords);
  };

  const handleReset = () => {
    const records = {};
    formattedStudents.forEach((s) => {
      records[s.id] = 'PRESENT';
    });
    setAttendanceRecords(records);
  };

  const handleSubmit = () => {
    if (!canSubmit) return;

    const payload = {
      subjectId: selectedSubjectId,
      date: selectedDate,
      group: selectedSectionId,
      records: Object.entries(attendanceRecords).map(([studentId, status]) => ({
        studentId,
        status,
      })),
    };

    submitAttendanceMutation.mutate(payload, {
      onSuccess: () => {
        setIsSubmitted(true);
        setToastMsg('Attendance sheet submitted successfully to MongoDB!');
      },
      onError: (err) => {
        alert(`Attendance submission failed: ${err.response?.data?.message || err.message}`);
      },
    });
  };

  const handleExport = (type) => {
    const filename = `attendance_${selectedSubjectId || 'subject'}_${selectedDate}.${type === 'csv' ? 'csv' : 'txt'}`;
    const element = document.createElement('a');
    let content = '';

    if (type === 'csv') {
      content = 'Roll Number,Student Name,Attendance Status\n';
      formattedStudents.forEach((stud) => {
        content += `${stud.rollNumber},${stud.name},${attendanceRecords[stud.id] || 'PRESENT'}\n`;
      });
      element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(content));
    } else {
      content = `--- Attendance Report ---\nSubject ID: ${selectedSubjectId}\nDate: ${selectedDate}\n\n`;
      formattedStudents.forEach((stud) => {
        content += `${stud.rollNumber} - ${stud.name}: ${attendanceRecords[stud.id] || 'PRESENT'}\n`;
      });
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
    }

    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (isDashboardLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Format subjects list for selector
  const filterSubjects = assignedSubjects.map((sub) => ({
    id: sub.id,
    name: sub.name,
    code: sub.code,
    credits: sub.credits,
  }));

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* ── Page Header ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <IconButton onClick={() => navigate('/faculty')} size="small" sx={{ bgcolor: 'action.hover', '&:hover': { bgcolor: 'action.selected' } }}>
            <BackIcon fontSize="small" />
          </IconButton>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>
              Daily Attendance
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Mark student attendance status, view statistics overview, and save records to MongoDB
            </Typography>
          </Box>
        </Box>
        {isFormReady && formattedStudents.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button variant="outlined" size="small" startIcon={<DownloadIcon />} onClick={() => handleExport('csv')} sx={{ textTransform: 'none', fontWeight: 700 }}>
              Export CSV
            </Button>
            <Button variant="outlined" size="small" startIcon={<DownloadIcon />} onClick={() => handleExport('pdf')} sx={{ textTransform: 'none', fontWeight: 700 }}>
              Export PDF
            </Button>
          </Box>
        )}
      </Box>

      {/* ── Cascade Selectors Row ── */}
      <Paper sx={{ p: 3, mb: 3 }} elevation={0} variant="outlined">
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <SubjectSelector subjects={filterSubjects} selectedSubjectId={selectedSubjectId} onSubjectChange={handleSubjectChange} />
          </Grid>
          <Grid item xs={12} md={4}>
            <SectionSelector sections={sectionsForSubject} selectedSectionId={selectedSectionId} onSectionChange={handleSectionChange} disabled={!selectedSubjectId} />
          </Grid>
          <Grid item xs={12} md={4}>
            <DateSelector selectedDate={selectedDate} onDateChange={handleDateChange} disabled={!selectedSectionId} />
          </Grid>
        </Grid>
      </Paper>

      {/* ── Form Workflow Area ── */}
      {isFormReady ? (
        isStudentsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : formattedStudents.length > 0 ? (
          <Grid container spacing={3}>
            {/* Left Column: Student table */}
            <Grid item xs={12} lg={8}>
              <Paper variant="outlined" sx={{ p: 3, borderRadius: 3.5 }}>
                <StudentAttendanceTable
                  students={formattedStudents}
                  attendanceRecords={attendanceRecords}
                  onStatusChange={handleStatusChange}
                  onMarkAll={handleMarkAll}
                />
              </Paper>
            </Grid>

            {/* Right Column: Dynamic Statistics Card */}
            <Grid item xs={12} lg={4}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <AttendanceSummaryCard
                  present={summaryCounts.present}
                  absent={summaryCounts.absent}
                  medicalLeave={summaryCounts.medicalLeave}
                  dutyLeave={summaryCounts.dutyLeave}
                  percentage={attendancePercentage}
                />

                {/* Reset & Submit Buttons */}
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<ResetIcon />}
                    onClick={handleReset}
                    fullWidth
                    sx={{ textTransform: 'none', fontWeight: 700, py: 1.5, borderRadius: 2 }}
                  >
                    Reset Form
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<SubmitIcon />}
                    onClick={handleSubmit}
                    disabled={!canSubmit || submitAttendanceMutation.isPending}
                    fullWidth
                    sx={{
                      textTransform: 'none',
                      fontWeight: 700,
                      py: 1.5,
                      borderRadius: 2,
                      bgcolor: '#4f46e5',
                      '&:hover': { bgcolor: '#4338ca' },
                    }}
                  >
                    {submitAttendanceMutation.isPending ? 'Submitting...' : 'Submit Sheet'}
                  </Button>
                </Box>
              </Box>
            </Grid>
          </Grid>
        ) : (
          <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
            <Typography variant="body1" color="text.secondary">
              No students registered in section {selectedSectionId}.
            </Typography>
          </Paper>
        )
      ) : (
        /* Empty workflow state */
        <Paper
          variant="outlined"
          sx={{
            p: 8,
            textAlign: 'center',
            borderRadius: 3.5,
            bgcolor: 'background.paper',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CalendarIcon sx={{ fontSize: 50, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            Class Roster Waiting
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400 }}>
            Select a subject, target class section, and academic date from selectors to load the student list sheet
          </Typography>
        </Paper>
      )}

      {/* ── Snackbar Toast notifications ── */}
      <Snackbar open={isSubmitted} autoHideDuration={4000} onClose={() => setIsSubmitted(false)}>
        <Alert severity="success" variant="filled" sx={{ width: '100%' }}>
          {toastMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AttendancePage;
