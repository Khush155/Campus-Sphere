// client/src/pages/faculty/attendance/AttendancePage.jsx
//
// Main orchestrator page for the Faculty Attendance Module.
// This component OWNS all state and coordinates the attendance workflow:
//   Subject → Section → Date → Students → Mark → Summary → Submit
//
// Architecture:
//   AppLayout (sidebar + AppBar)
//     └── <Outlet />
//           └── AttendancePage (this file)
//                 ├── SubjectSelector    → selects subject
//                 ├── SectionSelector    → selects section
//                 ├── DateSelector       → selects date
//                 ├── StudentAttendanceTable → marks attendance
//                 └── AttendanceSummaryCard  → live statistics
//
// State lives HERE because all 5 children need to share data.
// No child owns state — they receive props and report events.
//
// Data: Mock data for now. Future: React Query hooks.

import React, { useState, useMemo } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Divider,
  Snackbar,
  Alert,
  IconButton,
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

// Mock data
import {
  mockAttendanceSubjects,
  mockStudentsList,
} from './mockData';
import { mockTimetable } from '../timetable/mockData';

// ─────────────────────────────────────────────────────────────
// Subject → Section mapping (mock)
// ─────────────────────────────────────────────────────────────
// In production, this comes from the Faculty's subject-section
// assignment: GET /api/v1/faculty/:id?populate=subjects,sections
//
// Shape: { [subjectId]: [{ id, name, strength }] }
const SUBJECT_SECTIONS = {
  sub1: [
    { id: 'sec1a', name: 'CSE-A', strength: 20 },
  ],
  sub2: [
    { id: 'sec2a', name: 'CSE-A', strength: 20 },
    { id: 'sec2b', name: 'CSE-B', strength: 18 },
  ],
  sub3: [
    { id: 'sec3a', name: 'CSE-A', strength: 20 },
  ],
};

/**
 * Formats a Date to 'YYYY-MM-DD' using LOCAL timezone.
 * Avoids UTC shift (midnight IST → previous day UTC).
 */
const formatDateToISO = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const AttendancePage = () => {
  const navigate = useNavigate();

  // ══════════════════════════════════════════════════════════
  // STATE — the single source of truth for the entire page
  // ══════════════════════════════════════════════════════════

  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [selectedDate, setSelectedDate] = useState(formatDateToISO(new Date()));
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  // ══════════════════════════════════════════════════════════
  // DERIVED DATA — computed from state, never stored in state
  // ══════════════════════════════════════════════════════════

  // Sections available for the selected subject
  const sectionsForSubject = SUBJECT_SECTIONS[selectedSubjectId] || [];

  // Is the form complete enough to show the student table?
  const isFormReady = !!(selectedSubjectId && selectedSectionId && selectedDate);

  // Students to display (loaded when form is ready)
  // Future: filtered by section via API
  const students = isFormReady ? mockStudentsList : [];

  // ── Summary Counts (memoized) ──
  // useMemo prevents recalculating on every render.
  // Recomputes ONLY when attendanceRecords changes.
  const summaryCounts = useMemo(() => {
    const values = Object.values(attendanceRecords);
    const present = values.filter((s) => s === 'PRESENT').length;
    const absent = values.filter((s) => s === 'ABSENT').length;
    const medicalLeave = values.filter((s) => s === 'MEDICAL_LEAVE').length;
    const dutyLeave = values.filter((s) => s === 'DUTY_LEAVE').length;
    return { present, absent, medicalLeave, dutyLeave };
  }, [attendanceRecords]);

  const totalStudents = students.length;
  const attendancePercentage =
    totalStudents > 0
      ? ((summaryCounts.present + summaryCounts.medicalLeave + summaryCounts.dutyLeave) / totalStudents) * 100
      : 0;

  // ── Timetable Guard Class Validation ──
  const isClassScheduledToday = useMemo(() => {
    if (!selectedSubjectId || !selectedSectionId || !selectedDate) return false;

    // Convert local YYYY-MM-DD string to Weekday
    const parts = selectedDate.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const dateObj = new Date(year, month, day);

    const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const weekday = dayNames[dateObj.getDay()];

    // Query mock timetable
    return mockTimetable.some((slot) => {
      return (
        slot.dayOfWeek === weekday &&
        slot.subjectId === selectedSubjectId &&
        slot.sectionId === selectedSectionId
      );
    });
  }, [selectedSubjectId, selectedSectionId, selectedDate]);

  // Can the form be submitted?
  const canSubmit = isFormReady && isClassScheduledToday && totalStudents > 0 && Object.keys(attendanceRecords).length > 0;

  // ══════════════════════════════════════════════════════════
  // HANDLERS — cascade state changes through the workflow
  // ══════════════════════════════════════════════════════════

  /**
   * Initializes attendance records with all students set to PRESENT.
   * Called when section changes or when resetting the form.
   */
  const initializeRecords = (studentList) => {
    const records = {};
    studentList.forEach((s) => {
      records[s.id] = 'PRESENT';
    });
    setAttendanceRecords(records);
  };

  /**
   * Subject changed → cascade:
   *   - If only 1 section → auto-select it + initialize records
   *   - If multiple sections → reset section + clear records
   */
  const handleSubjectChange = (subjectId) => {
    setSelectedSubjectId(subjectId);

    const sections = SUBJECT_SECTIONS[subjectId] || [];

    if (sections.length === 1) {
      // Auto-select the only section — saves a click
      setSelectedSectionId(sections[0].id);
      initializeRecords(mockStudentsList);
    } else {
      // Multiple sections — faculty must choose
      setSelectedSectionId('');
      setAttendanceRecords({});
    }
  };

  /**
   * Section changed → load students + initialize all as PRESENT.
   */
  const handleSectionChange = (sectionId) => {
    setSelectedSectionId(sectionId);
    initializeRecords(mockStudentsList);
  };

  /**
   * Date changed → keep current records (faculty might just be
   * switching dates to compare). In production, this would trigger
   * a query to fetch existing records for the new date.
   */
  const handleDateChange = (date) => {
    setSelectedDate(date);
    // Future: fetch existing attendance for this date
    // const existing = await api.get(`/attendance?subjectId=${selectedSubjectId}&date=${date}`);
    // if (existing) pre-fill records, else keep current
  };

  /**
   * Individual student status toggle.
   * Uses functional setState to avoid stale closures.
   */
  const handleStatusChange = (studentId, status) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  /**
   * Bulk mark all students with the same status.
   * Single state update → single re-render (not N updates).
   */
  const handleMarkAll = (status) => {
    const newRecords = {};
    students.forEach((s) => {
      newRecords[s.id] = status;
    });
    setAttendanceRecords(newRecords);
  };

  /**
   * Reset attendance to default (all PRESENT).
   */
  const handleReset = () => {
    initializeRecords(students);
  };

  /**
   * Submit attendance.
   * Transforms the records map into the API's expected array format.
   * Currently logs to console — future: POST /api/v1/attendance
   */
  const handleSubmit = () => {
    // Transform map → array (matches attendanceValidation.js schema)
    const payload = {
      subjectId: selectedSubjectId,
      date: selectedDate,
      records: Object.entries(attendanceRecords).map(([studentId, status]) => ({
        studentId,
        status,
      })),
    };

    // ── Mock submission ──
    // In production, this becomes: mutation.mutate(payload)
    console.log('═══════════════════════════════════════════');
    console.log('ATTENDANCE PAYLOAD (ready for POST /api/v1/attendance)');
    console.log('═══════════════════════════════════════════');
    console.log(JSON.stringify(payload, null, 2));
    console.log(`Total records: ${payload.records.length}`);
    console.log('═══════════════════════════════════════════');

    setIsSubmitted(true);
  };

  const handleExport = (type) => {
    const filename = `attendance_${selectedSubjectId || 'subject'}_${selectedDate}.${type === 'csv' ? 'csv' : 'txt'}`;
    const element = document.createElement('a');
    let content = '';

    if (type === 'csv') {
      content = 'Roll Number,Student Name,Attendance Status\n';
      mockStudentsList.forEach((stud) => {
        content += `${stud.rollNumber},${stud.name},${attendanceRecords[stud.id] || 'PRESENT'}\n`;
      });
      element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(content));
    } else {
      content = `--- Attendance Report ---\nSubject ID: ${selectedSubjectId}\nDate: ${selectedDate}\n\n`;
      mockStudentsList.forEach((stud) => {
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

  // ══════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* ── Page Header ── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          mb: 4,
        }}
      >
        <IconButton
          onClick={() => navigate('/faculty')}
          size="small"
          sx={{
            bgcolor: 'action.hover',
            '&:hover': { bgcolor: 'action.selected' },
          }}
        >
          <BackIcon fontSize="small" />
        </IconButton>
        <Box>
          <Typography
            variant="h4"
            sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}
          >
            Mark Attendance
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Select subject, section, and date to begin marking attendance
          </Typography>
        </Box>
      </Box>

      {/* ── Selectors Row ── */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          {/* Subject */}
          <Grid item xs={12} md={4}>
            <SubjectSelector
              subjects={mockAttendanceSubjects}
              selectedSubjectId={selectedSubjectId}
              onSubjectChange={handleSubjectChange}
            />
          </Grid>

          {/* Section */}
          <Grid item xs={12} md={4}>
            <SectionSelector
              sections={sectionsForSubject}
              selectedSectionId={selectedSectionId}
              onSectionChange={handleSectionChange}
              disabled={!selectedSubjectId}
            />
          </Grid>

          {/* Date */}
          <Grid item xs={12} md={4}>
            <DateSelector
              selectedDate={selectedDate}
              onDateChange={handleDateChange}
              disabled={!selectedSectionId}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* ── Main Content (visible when form is ready) ── */}
      {isFormReady ? (
        !isClassScheduledToday ? (
          /* ── Timetable Guard Empty State ── */
          <Paper
            elevation={0}
            variant="outlined"
            sx={{
              p: 6,
              textAlign: 'center',
              borderRadius: 3,
              bgcolor: 'background.paper',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              border: (theme) => `1px solid ${theme.palette.divider}`,
            }}
          >
            <Box
              sx={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                bgcolor: 'rgba(239, 68, 68, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2.5,
              }}
            >
              <CalendarIcon sx={{ fontSize: 30, color: 'error.main' }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>
              No Class Scheduled Today
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 2, maxWidth: 420, lineHeight: 1.6 }}
            >
              According to the weekly timetable, you do not have a scheduled class for this subject and section on this day. Please verify your selected subject, section, or date.
            </Typography>
          </Paper>
        ) : (
          students.length > 0 && (
            <>
              <Grid container spacing={3} sx={{ mb: 3 }}>
                {/* Student Attendance Table */}
                <Grid item xs={12} lg={8}>
                  <StudentAttendanceTable
                    students={students}
                    attendanceRecords={attendanceRecords}
                    onStatusChange={handleStatusChange}
                    onMarkAll={handleMarkAll}
                  />
                </Grid>

                {/* Attendance Summary */}
                <Grid item xs={12} lg={4}>
                  <AttendanceSummaryCard
                    totalStudents={totalStudents}
                    present={summaryCounts.present}
                    absent={summaryCounts.absent}
                    medicalLeave={summaryCounts.medicalLeave}
                    dutyLeave={summaryCounts.dutyLeave}
                    attendancePercentage={attendancePercentage}
                  />
                </Grid>
              </Grid>

              {/* ── Action Bar ── */}
              <Paper
                sx={{
                  p: 2.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 2,
                }}
              >
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <Button
                    variant="outlined"
                    color="inherit"
                    startIcon={<ResetIcon />}
                    onClick={handleReset}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                    }}
                  >
                    Reset
                  </Button>

                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleExport('csv')}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                    }}
                  >
                    Export CSV
                  </Button>

                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleExport('pdf')}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                    }}
                  >
                    Export PDF
                  </Button>
                </Box>

                <Button
                  variant="contained"
                  startIcon={<SubmitIcon />}
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 700,
                    px: 4,
                    py: 1.2,
                    bgcolor: '#4f46e5',
                    '&:hover': { bgcolor: '#4338ca' },
                  }}
                >
                  Submit Attendance
                </Button>
              </Paper>
            </>
          )
        )
      ) : (
        /* ── Empty State ── */
        selectedSubjectId && (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              {!selectedSectionId
                ? 'Please select a section to load students.'
                : 'Loading students...'}
            </Typography>
          </Paper>
        )
      )}

      {/* ── Success Snackbar ── */}
      <Snackbar
        open={isSubmitted}
        autoHideDuration={4000}
        onClose={() => setIsSubmitted(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setIsSubmitted(false)}
          severity="success"
          variant="filled"
          sx={{ fontWeight: 600 }}
        >
          Attendance submitted successfully! Check console for payload.
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AttendancePage;
