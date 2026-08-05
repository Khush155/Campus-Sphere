import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Button,
  CircularProgress,
  Card,
  Chip,
  useTheme,
  Avatar,
} from '@mui/material';
import {
  Save as SubmitIcon,
  RestartAlt as ResetIcon,
  Download as DownloadIcon,
  FactCheckOutlined,
  CheckCircleOutlined,
  CancelOutlined,
  PeopleOutlined,
  PercentOutlined,
} from '@mui/icons-material';

// Attendance components
import SubjectSelector from './components/SubjectSelector';
import SectionSelector from './components/SectionSelector';
import DateSelector from './components/DateSelector';
import StudentAttendanceTable from './components/StudentAttendanceTable';

// Backend hooks
import {
  useFacultyDashboardQuery,
  useSubmitAttendanceMutation,
  useAttendanceQuery,
} from '../../../queries/facultyQueries';
import { useUsersQuery } from '../../../queries/userQueries';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';

const formatDateToISO = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const AttendancePage = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const { showToast } = useToast();

  // State Management
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('ALL');
  const [selectedDate, setSelectedDate] = useState(formatDateToISO(new Date()));
  const [attendanceRecords, setAttendanceRecords] = useState({});

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
    return assignedSubjects.find((s) => String(s.id) === String(selectedSubjectId)) || null;
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

  const { data: studentsResponse } = useUsersQuery(userQueryParams);
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
        showToast('Attendance sheet submitted and updated successfully!');
        refetchAttendance();
      },
      onError: (err) => {
        showToast(`Attendance submission failed: ${err.response?.data?.message || err.message}`, { severity: 'error' });
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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={36} />
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
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      {/* ── 1. Hero Identity Banner ────────────────────────────────────────── */}
      <Card
        sx={{
          p: 3.5,
          borderRadius: '16px',
          border: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
          background: `linear-gradient(135deg, ${theme.palette.primary.main}0D 0%, ${theme.palette.brass?.[500] || '#b8863e'}0A 100%)`,
          boxShadow: 'none',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <Chip
                icon={<FactCheckOutlined sx={{ fontSize: '0.9rem !important', color: `${theme.palette.primary.main} !important` }} />}
                label="FACULTY LECTURE ATTENDANCE & SESSION MARKING DESK"
                size="small"
                sx={{
                  bgcolor: `${theme.palette.primary.main}15`,
                  color: theme.palette.primary.main,
                  fontWeight: 800,
                  fontFamily: theme.typography.mono.fontFamily,
                  letterSpacing: '0.05em',
                  fontSize: '0.7rem',
                }}
              />
            </Box>
            <Typography variant="h4" sx={{ fontFamily: theme.typography.h1.fontFamily, fontWeight: 800, color: theme.palette.ink[900] }}>
              Faculty Attendance & Daily Sessions
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
              Mark daily class attendance, track Present/Absent/Medical Leave statuses, export attendance rosters, and sync session logs with department records.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => handleExport('csv')}
              disabled={formattedStudents.length === 0}
              sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
            >
              Export CSV Roster
            </Button>
            <Button
              variant="contained"
              startIcon={<SubmitIcon />}
              onClick={handleSubmit}
              disabled={!canSubmit || submitAttendanceMutation.isPending}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 700,
                background: theme.palette.primary.gradient || theme.palette.primary.main,
                color: '#ffffff',
              }}
            >
              {submitAttendanceMutation.isPending ? 'Saving...' : 'Submit Attendance Sheet'}
            </Button>
          </Box>
        </Box>
      </Card>

      {/* ── 2. KPI Summary Grid ────────────────────────────────────────────── */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em' }}>
                  ENROLLED STUDENTS
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.ink[900], mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
                  {totalStudents}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: `${theme.palette.primary.main}15`, color: theme.palette.primary.main }}>
                <PeopleOutlined />
              </Avatar>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.signal.success }}>
                  PRESENT STUDENTS
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.signal.success, mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
                  {summaryCounts.present}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: `${theme.palette.signal.success}15`, color: theme.palette.signal.success }}>
                <CheckCircleOutlined />
              </Avatar>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.signal.error }}>
                  ABSENT STUDENTS
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.signal.error, mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
                  {summaryCounts.absent}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: `${theme.palette.signal.error}15`, color: theme.palette.signal.error }}>
                <CancelOutlined />
              </Avatar>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.primary.main }}>
                  ATTENDANCE RATE
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.primary.main, mt: 1, fontFamily: theme.typography.mono.fontFamily }}>
                  {attendancePercentage}%
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: `${theme.palette.primary.main}15`, color: theme.palette.primary.main }}>
                <PercentOutlined />
              </Avatar>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* ── 3. Controls Bar: Subject, Section & Date ────────────────────────── */}
      <Card sx={{ p: 3, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
        <Grid container spacing={2.5} alignItems="center">
          <Grid item xs={12} md={4}>
            <SubjectSelector subjects={filterSubjects} selectedSubjectId={selectedSubjectId} onSubjectChange={handleSubjectChange} />
          </Grid>
          <Grid item xs={12} md={4}>
            <SectionSelector sections={sectionsForSubject} selectedSectionId={selectedSectionId} onSectionChange={handleSectionChange} />
          </Grid>
          <Grid item xs={12} md={4}>
            <DateSelector selectedDate={selectedDate} onDateChange={handleDateChange} />
          </Grid>
        </Grid>
      </Card>

      {/* ── 4. Student Attendance Table ────────────────────────────────────── */}
      <Card sx={{ p: 3, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: theme.palette.ink[900] }}>
              Student Attendance Roster — {currentSubject?.name || 'Subject'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Date: <strong>{selectedDate}</strong> • Section: <strong>{selectedSectionId}</strong>
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button size="small" variant="outlined" startIcon={<ResetIcon />} onClick={handleReset} sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}>
              Reset All Present
            </Button>
          </Box>
        </Box>

        <StudentAttendanceTable
          students={formattedStudents}
          attendanceRecords={attendanceRecords}
          onStatusChange={handleStatusChange}
          onMarkAll={handleMarkAll}
          disabled={submitAttendanceMutation.isPending}
        />
      </Card>
    </Box>
  );
};

export default AttendancePage;
