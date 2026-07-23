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

// Backend hooks
import {
  useFacultyDashboardQuery,
  useSubmitAttendanceMutation,
  useAttendanceQuery,
} from '../../../queries/facultyQueries';
import { useUsersQuery } from '../../../queries/userQueries';
import { useAuth } from '../../../contexts/AuthContext';

const formatDateToISO = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const AttendancePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // State Management
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('ALL');
  const [selectedDate, setSelectedDate] = useState(formatDateToISO(new Date()));
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastSeverity, setToastSeverity] = useState('success');

  // 1. Fetch dashboard stats for assigned subjects list
  const { data: dashboardData, isLoading: isDashboardLoading } = useFacultyDashboardQuery();
  const assignedSubjects = useMemo(() => dashboardData?.assignedSubjects || [], [dashboardData]);

  // Auto-select first subject if none selected
  useEffect(() => {
    if (assignedSubjects.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(assignedSubjects[0].id);
    }
  }, [assignedSubjects, selectedSubjectId]);

  // Selected subject object
  const currentSubject = useMemo(() => {
    return assignedSubjects.find(s => String(s.id) === String(selectedSubjectId)) || null;
  }, [assignedSubjects, selectedSubjectId]);

  // Section options for current subject
  const sectionsForSubject = useMemo(() => {
    return [
      { id: 'ALL', name: 'All Sections (Whole Batch)', strength: 'All' },
      { id: 'A', name: 'Group / Section A', strength: 'Sec A' },
      { id: 'B', name: 'Group / Section B', strength: 'Sec B' },
    ];
  }, []);

  // Form ready check
  const isFormReady = !!(selectedSubjectId && selectedDate);

  // Robust department ID extraction
  const cleanDeptId = typeof user?.departmentId === 'object'
    ? user?.departmentId?._id
    : (user?.departmentId || user?.department?._id || user?.department || currentSubject?.departmentId);

  // 2. Fetch students for the selected subject's department/group
  const userQueryParams = useMemo(() => {
    const params = { role: 'STUDENT', limit: 200 };
    if (cleanDeptId) params.departmentId = cleanDeptId;
    if (selectedSectionId && selectedSectionId !== 'ALL') {
      params.group = selectedSectionId;
    }
    return params;
  }, [cleanDeptId, selectedSectionId]);

  const { data: studentsResponse, isLoading: isStudentsLoading } = useUsersQuery(userQueryParams);
  const rawStudents = useMemo(() => {
    if (Array.isArray(studentsResponse)) return studentsResponse;
    return studentsResponse?.data || [];
  }, [studentsResponse]);

  // Map database student list to display structure
  const formattedStudents = useMemo(() => {
    return rawStudents.map((stud, idx) => ({
      id: stud._id || stud.id,
      name: stud.name,
      email: stud.email,
      rollNumber: stud.rollNumber || stud.enrollmentNo || stud.studentId || `STU2026${String(idx + 1).padStart(3, '0')}`,
    }));
  }, [rawStudents]);

  // 3. Fetch existing attendance records for the selected date & subject
  const { data: existingAttendance, refetch: refetchAttendance } = useAttendanceQuery(
    {
      subjectId: selectedSubjectId,
      date: selectedDate,
      group: selectedSectionId,
    },
    isFormReady
  );

  // Sync attendance state when students or existing attendance change
  useEffect(() => {
    if (formattedStudents.length > 0) {
      const records = {};
      formattedStudents.forEach((s) => {
        const match = Array.isArray(existingAttendance)
          ? existingAttendance.find((r) => {
              const rStudentId = typeof r.studentId === 'object' ? r.studentId?._id : r.studentId;
              return String(rStudentId) === String(s.id);
            })
          : null;
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
      ? Math.round(((summaryCounts.present + summaryCounts.medicalLeave + summaryCounts.dutyLeave) / totalStudents) * 100)
      : 0;

  const canSubmit = isFormReady && totalStudents > 0 && Object.keys(attendanceRecords).length > 0;

  const handleSubjectChange = (subjectId) => {
    setSelectedSubjectId(subjectId);
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
        setToastMsg('Attendance sheet saved and updated successfully!');
        setToastSeverity('success');
        setIsSubmitted(true);
        refetchAttendance();
      },
      onError: (err) => {
        setToastMsg(`Attendance submission failed: ${err.response?.data?.message || err.message}`);
        setToastSeverity('error');
        setIsSubmitted(true);
      },
    });
  };

  const handleExport = (type) => {
    const filename = `attendance_${currentSubject?.code || selectedSubjectId}_${selectedDate}.${type === 'csv' ? 'csv' : 'txt'}`;
    const element = document.createElement('a');
    let content = '';

    if (type === 'csv') {
      content = 'Roll Number,Student Name,Email,Attendance Status\n';
      formattedStudents.forEach((stud) => {
        content += `"${stud.rollNumber}","${stud.name}","${stud.email}","${attendanceRecords[stud.id] || 'PRESENT'}"\n`;
      });
      element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(content));
    } else {
      content = `--- ATTENDANCE SHEET ---\nSubject: ${currentSubject?.name} (${currentSubject?.code})\nDate: ${selectedDate}\nSection: ${selectedSectionId}\nTotal Students: ${totalStudents}\n\n`;
      formattedStudents.forEach((stud) => {
        content += `${stud.rollNumber} | ${stud.name} | ${attendanceRecords[stud.id] || 'PRESENT'}\n`;
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
    <Box sx={{ flexGrow: 1, p: { xs: 1, sm: 3 } }}>
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
            <Button variant="outlined" size="small" startIcon={<DownloadIcon />} onClick={() => handleExport('csv')} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
              Export CSV
            </Button>
            <Button variant="outlined" size="small" startIcon={<DownloadIcon />} onClick={() => handleExport('txt')} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
              Export Text
            </Button>
          </Box>
        )}
      </Box>

      {/* ── Cascade Selectors Row ── */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }} elevation={0} variant="outlined">
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
                      bgcolor: 'primary.main',
                      '&:hover': { bgcolor: 'primary.dark' },
                    }}
                  >
                    {submitAttendanceMutation.isPending ? 'Saving...' : 'Submit Sheet'}
                  </Button>
                </Box>
              </Box>
            </Grid>
          </Grid>
        ) : (
          <Paper variant="outlined" sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>No Students Found</Typography>
            <Typography variant="body2" color="text.secondary">
              No registered students found for the selected subject and section filter. Ensure students are enrolled in this department.
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
            Select a subject, section, and date above to load the student list sheet and mark daily attendance.
          </Typography>
        </Paper>
      )}

      {/* ── Toast Notifications ── */}
      <Snackbar open={isSubmitted} autoHideDuration={4000} onClose={() => setIsSubmitted(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={toastSeverity} onClose={() => setIsSubmitted(false)} variant="filled" sx={{ width: '100%', borderRadius: 2 }}>
          {toastMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AttendancePage;
