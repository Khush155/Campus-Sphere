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
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Save as SubmitIcon,
  Download as DownloadIcon,
  FactCheckOutlined,
  CheckCircleOutlined,
  CancelOutlined,
  PeopleOutlined,
  PercentOutlined,
  ArticleOutlined,
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
  const [exportAnchorEl, setExportAnchorEl] = useState(null);

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

  // 2. Fetch students for the selected subject's branch/semester and group
  const userQueryParams = useMemo(() => {
    const params = { role: 'STUDENT', limit: 200 };
    if (cleanDeptId) params.departmentId = cleanDeptId;
    if (currentSubject?.branchId) params.branchId = currentSubject.branchId;
    if (currentSubject?.semester) params.semester = currentSubject.semester;
    if (selectedSectionId && selectedSectionId !== 'ALL') {
      params.group = selectedSectionId;
    }
    return params;
  }, [cleanDeptId, currentSubject, selectedSectionId]);

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
    setExportAnchorEl(null);
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
        <CircularProgress size={40} />
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
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* ── 1. Hero Identity Banner ────────────────────────────────────────── */}
      <Card
        elevation={0}
        sx={{
          p: 3.5,
          borderRadius: '16px',
          border: `1px solid ${theme.palette.divider}`,
          background: `linear-gradient(135deg, ${theme.palette.primary.main}12 0%, ${theme.palette.primary.main}04 100%)`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2.5 }}>
          <Box sx={{ maxWidth: 680 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <Chip
                icon={<FactCheckOutlined sx={{ fontSize: '0.9rem !important', color: `${theme.palette.primary.main} !important` }} />}
                label="FACULTY ATTENDANCE DESK"
                size="small"
                sx={{
                  bgcolor: `${theme.palette.primary.main}15`,
                  color: theme.palette.primary.main,
                  fontWeight: 800,
                  fontSize: '0.7rem',
                  letterSpacing: '0.05em',
                }}
              />
              {currentSubject && (
                <Chip
                  label={`${currentSubject.name} (${currentSubject.code})`}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(16, 185, 129, 0.12)',
                    color: '#10b981',
                    fontWeight: 700,
                    fontSize: '0.7rem',
                  }}
                />
              )}
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
              Faculty Attendance & Daily Sessions
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.75 }}>
              Mark live class attendance, monitor present vs. absent ratios, export student rosters, and sync attendance sheets directly with department records.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={(e) => setExportAnchorEl(e.currentTarget)}
              disabled={formattedStudents.length === 0}
              sx={{
                borderRadius: '10px',
                textTransform: 'none',
                fontWeight: 700,
                px: 2.5,
                py: 1,
                borderColor: theme.palette.divider,
              }}
            >
              Export Roster
            </Button>
            <Menu
              anchorEl={exportAnchorEl}
              open={Boolean(exportAnchorEl)}
              onClose={() => setExportAnchorEl(null)}
              PaperProps={{ sx: { borderRadius: '12px', minWidth: 180, mt: 1 } }}
            >
              <MenuItem onClick={() => handleExport('csv')}>
                <ListItemIcon><ArticleOutlined fontSize="small" /></ListItemIcon>
                <ListItemText primary="Export as CSV" primaryTypographyProps={{ fontWeight: 600, fontSize: '0.85rem' }} />
              </MenuItem>
              <MenuItem onClick={() => handleExport('txt')}>
                <ListItemIcon><ArticleOutlined fontSize="small" /></ListItemIcon>
                <ListItemText primary="Export Plain Text" primaryTypographyProps={{ fontWeight: 600, fontSize: '0.85rem' }} />
              </MenuItem>
            </Menu>

            <Button
              variant="contained"
              startIcon={submitAttendanceMutation.isPending ? <CircularProgress size={18} color="inherit" /> : <SubmitIcon />}
              onClick={handleSubmit}
              disabled={!canSubmit || submitAttendanceMutation.isPending}
              sx={{
                borderRadius: '10px',
                textTransform: 'none',
                fontWeight: 700,
                px: 3,
                py: 1,
                boxShadow: submitAttendanceMutation.isPending ? 'none' : '0px 4px 12px rgba(79, 70, 229, 0.25)',
              }}
            >
              {submitAttendanceMutation.isPending ? 'Saving Sheet...' : 'Submit Attendance'}
            </Button>
          </Box>
        </Box>
      </Card>

      {/* ── 2. KPI Summary Grid (Exact Faculty Student Roster Card Style) ── */}
      <Grid container spacing={2.5}>
        {/* 1. Enrolled Students Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              p: 3,
              borderRadius: '14px',
              border: `1px solid ${theme.palette.divider}`,
              borderTop: `4px solid ${theme.palette.primary.main}`,
              boxShadow: 'none',
              bgcolor: theme.palette.background.paper,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em' }}>
                  ENROLLED STUDENTS
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    color: theme.palette.ink ? theme.palette.ink[900] : 'text.primary',
                    mt: 1,
                    fontFamily: theme.typography.mono?.fontFamily || 'monospace',
                  }}
                >
                  {totalStudents}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: `${theme.palette.primary.main}15`, color: theme.palette.primary.main }}>
                <PeopleOutlined />
              </Avatar>
            </Box>
          </Card>
        </Grid>

        {/* 2. Present Students Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              p: 3,
              borderRadius: '14px',
              border: `1px solid ${theme.palette.divider}`,
              borderTop: `4px solid ${theme.palette.signal?.success || '#10b981'}`,
              boxShadow: 'none',
              bgcolor: theme.palette.background.paper,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.signal?.success || '#10b981' }}
                >
                  PRESENT STUDENTS
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    color: theme.palette.signal?.success || '#10b981',
                    mt: 1,
                    fontFamily: theme.typography.mono?.fontFamily || 'monospace',
                  }}
                >
                  {summaryCounts.present}
                </Typography>
              </Box>
              <Avatar
                sx={{
                  bgcolor: `${theme.palette.signal?.success || '#10b981'}15`,
                  color: theme.palette.signal?.success || '#10b981',
                }}
              >
                <CheckCircleOutlined />
              </Avatar>
            </Box>
          </Card>
        </Grid>

        {/* 3. Absent Students Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              p: 3,
              borderRadius: '14px',
              border: `1px solid ${theme.palette.divider}`,
              borderTop: `4px solid ${theme.palette.signal?.error || '#ef4444'}`,
              boxShadow: 'none',
              bgcolor: theme.palette.background.paper,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.signal?.error || '#ef4444' }}
                >
                  ABSENT STUDENTS
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    color: theme.palette.signal?.error || '#ef4444',
                    mt: 1,
                    fontFamily: theme.typography.mono?.fontFamily || 'monospace',
                  }}
                >
                  {summaryCounts.absent}
                </Typography>
              </Box>
              <Avatar
                sx={{
                  bgcolor: `${theme.palette.signal?.error || '#ef4444'}15`,
                  color: theme.palette.signal?.error || '#ef4444',
                }}
              >
                <CancelOutlined />
              </Avatar>
            </Box>
          </Card>
        </Grid>

        {/* 4. Attendance Rate Card (Info Blue accent to match Student Roster Card 4) */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              p: 3,
              borderRadius: '14px',
              border: `1px solid ${theme.palette.divider}`,
              borderTop: `4px solid ${theme.palette.info?.main || '#3b82f6'}`,
              boxShadow: 'none',
              bgcolor: theme.palette.background.paper,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 700, letterSpacing: '0.05em', color: theme.palette.info?.main || '#3b82f6' }}
                >
                  CLASS ATTENDANCE RATE
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    color: theme.palette.info?.main || '#3b82f6',
                    mt: 1,
                    fontFamily: theme.typography.mono?.fontFamily || 'monospace',
                  }}
                >
                  {attendancePercentage}%
                </Typography>
              </Box>
              <Avatar
                sx={{
                  bgcolor: `${theme.palette.info?.main || '#3b82f6'}15`,
                  color: theme.palette.info?.main || '#3b82f6',
                }}
              >
                <PercentOutlined />
              </Avatar>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* ── 3. Controls Bar: Subject, Section & Date ────────────────────────── */}
      <Card
        elevation={0}
        sx={{
          p: 3,
          borderRadius: '16px',
          border: `1px solid ${theme.palette.divider}`,
          background: theme.palette.background.paper,
        }}
      >
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

      {/* ── 4. Student Attendance Roster Table ────────────────────────────── */}
      <StudentAttendanceTable
        students={formattedStudents}
        attendanceRecords={attendanceRecords}
        onStatusChange={handleStatusChange}
        onMarkAll={handleMarkAll}
        disabled={submitAttendanceMutation.isPending}
      />
    </Box>
  );
};

export default AttendancePage;

