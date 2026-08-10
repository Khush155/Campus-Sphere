import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  Button,
  Chip,
  CircularProgress,
  useTheme,
  TextField,
  MenuItem,
  Divider,
} from '@mui/material';
import {
  FactCheckOutlined,
  DownloadOutlined,
  RefreshOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  CancelOutlined,
  LocalHospitalOutlined,
  ClearOutlined,
  CalendarTodayOutlined,
} from '@mui/icons-material';
import DataTable from '../../../components/common/DataTable';
import EmptyState from '../../../components/common/EmptyState';
import MarkAttendanceModal from './MarkAttendanceModal';
import {
  useAttendanceQuery,
  useAttendanceSummaryQuery,
  useApproveMedicalLeaveMutation,
} from '../../../queries/hodQueries';
import { useSubjectsQuery, useCoursesQuery, useBranchesQuery } from '../../../queries/collegeQueries';
import { useUsersQuery } from '../../../queries/userQueries';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import GroupSelect from '../../../components/common/GroupSelect';

const AttendanceBar = ({ pct }) => {
  const theme = useTheme();
  const color = pct >= 75 ? theme.palette.success.main : theme.palette.error.main;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 150 }}>
      <Box sx={{ flex: 1, height: 8, borderRadius: 4, bgcolor: `${color}20`, overflow: 'hidden' }}>
        <Box sx={{ width: `${Math.min(pct, 100)}%`, height: '100%', bgcolor: color, borderRadius: 4 }} />
      </Box>
      <Typography variant="caption" sx={{ fontWeight: 800, color, fontFamily: 'monospace', minWidth: 42 }}>
        {pct}%
      </Typography>
    </Box>
  );
};

export const HodAttendanceHub = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const { showToast } = useToast();

  const cleanDeptId = useMemo(() => {
    if (!user) return undefined;
    const d = user.departmentId || user.department;
    return typeof d === 'object' ? d?._id || d?.id : d;
  }, [user]);

  // View Mode: 'summary' | 'records'
  const [viewMode, setViewMode] = useState('summary');

  // Comprehensive Filter States
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedSessionType, setSelectedSessionType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Bulk Mark Modal State
  const [bulkModalOpen, setBulkModalOpen] = useState(false);

  // Debounce search
  React.useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Global Metadata Queries
  const { data: allCourses = [] } = useCoursesQuery();
  const { data: branches = [] } = useBranchesQuery();

  // Fetch HOD department students to derive distinct courses
  const { data: baseStudentsResponse } = useUsersQuery({
    role: 'STUDENT',
    departmentId: cleanDeptId,
    limit: 1000,
  });

  const baseStudents = useMemo(() => {
    if (!baseStudentsResponse) return [];
    return baseStudentsResponse.data || (Array.isArray(baseStudentsResponse) ? baseStudentsResponse : []);
  }, [baseStudentsResponse]);

  // Derived HOD Courses
  const hodCourses = useMemo(() => {
    const map = new Map();
    baseStudents.forEach((s) => {
      const cObj = typeof s.courseId === 'object' ? s.courseId : null;
      const cId = cObj?._id || (typeof s.courseId === 'string' ? s.courseId : null);
      if (cId && !map.has(String(cId))) {
        const matchingGlobal = allCourses.find((c) => String(c._id || c.id) === String(cId));
        map.set(String(cId), {
          _id: String(cId),
          id: String(cId),
          name: cObj?.name || matchingGlobal?.name || s.course || 'Course Program',
          code: cObj?.code || matchingGlobal?.code || s.course || 'DEGREE',
          durationYears: matchingGlobal?.durationYears || cObj?.durationYears || 4,
        });
      }
    });

    if (map.size === 0 && allCourses.length > 0) {
      allCourses.forEach((c) => {
        const id = String(c._id || c.id);
        map.set(id, {
          _id: id,
          id,
          name: c.name,
          code: c.code,
          durationYears: c.durationYears || 4,
        });
      });
    }

    return Array.from(map.values());
  }, [baseStudents, allCourses]);

  // Available Branches for Filter
  const availableBranches = useMemo(() => {
    if (!selectedCourse) return branches;
    return branches.filter((b) => {
      const crsId = typeof b.courseId === 'object' ? b.courseId?._id || b.courseId?.id : b.courseId;
      return String(crsId) === String(selectedCourse);
    });
  }, [branches, selectedCourse]);

  // Semester Options
  const selectedCourseObj = useMemo(() => {
    if (!selectedCourse) return null;
    return hodCourses.find((c) => String(c._id || c.id) === String(selectedCourse));
  }, [hodCourses, selectedCourse]);

  const maxSemesters = useMemo(() => {
    if (!selectedCourseObj) return 8;
    return (selectedCourseObj.durationYears || 4) * 2;
  }, [selectedCourseObj]);

  const semesterOptions = useMemo(() => {
    return Array.from({ length: maxSemesters }, (_, i) => i + 1);
  }, [maxSemesters]);

  // Subjects Query filtered by department, branch, semester
  const { data: subjects = [] } = useSubjectsQuery(
    cleanDeptId
      ? {
          departmentId: cleanDeptId,
          branchId: selectedBranch || undefined,
          semester: selectedSemester ? Number(selectedSemester) : undefined,
        }
      : {}
  );

  // Auto-reset subject when branch or semester changes (subjects list changes)
  const prevBranchRef = React.useRef(selectedBranch);
  const prevSemRef = React.useRef(selectedSemester);
  React.useEffect(() => {
    const branchChanged = prevBranchRef.current !== selectedBranch;
    const semChanged = prevSemRef.current !== selectedSemester;
    prevBranchRef.current = selectedBranch;
    prevSemRef.current = selectedSemester;
    if (branchChanged || semChanged) {
      setSelectedSubjectId('');
    }
  }, [selectedBranch, selectedSemester]);

  // Auto-set first subject once subjects list loads
  React.useEffect(() => {
    if (subjects.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(String(subjects[0]._id || subjects[0].id));
    }
  }, [subjects, selectedSubjectId]);

  // Build cohort filter params for queries
  const cohortParams = useMemo(() => ({
    subjectId: selectedSubjectId || undefined,
    courseId: selectedCourse || undefined,
    branchId: selectedBranch || undefined,
    semester: selectedSemester || undefined,
    group: selectedGroup || undefined,
  }), [selectedSubjectId, selectedCourse, selectedBranch, selectedSemester, selectedGroup]);

  // Queries for Daily Records & Overall Summary
  const { data: records = [], isLoading: recordsLoading, refetch: refetchRecords } = useAttendanceQuery({
    ...cohortParams,
    sessionType: selectedSessionType || undefined,
    status: selectedStatus || undefined,
    date: selectedDate || undefined,
  });

  const { data: summaryData, isLoading: summaryLoading, refetch: refetchSummary } = useAttendanceSummaryQuery(cohortParams);

  const approveMedical = useApproveMedicalLeaveMutation();

  const handleRefresh = () => {
    refetchRecords();
    refetchSummary();
  };

  const handleClearFilters = () => {
    setSelectedCourse('');
    setSelectedBranch('');
    setSelectedSemester('');
    setSelectedGroup('');
    setSelectedSubjectId('');
    setSelectedSessionType('');
    setSelectedStatus('');
    setSelectedDate('');
    setSearch('');
    setDebouncedSearch('');
  };

  const isAnyFilterActive = useMemo(() => {
    return Boolean(
      selectedCourse ||
        selectedBranch ||
        selectedSemester ||
        selectedGroup ||
        selectedSubjectId ||
        selectedSessionType ||
        selectedStatus ||
        selectedDate ||
        search
    );
  }, [
    selectedCourse,
    selectedBranch,
    selectedSemester,
    selectedGroup,
    selectedSubjectId,
    selectedSessionType,
    selectedStatus,
    selectedDate,
    search,
  ]);

  // Filter daily records locally by search query (cohort already filtered server-side)
  const filteredRecords = useMemo(() => {
    if (!records) return [];
    let list = records;
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter((r) => {
        const studentName = r.studentId?.name?.toLowerCase() || '';
        const studentEmail = r.studentId?.email?.toLowerCase() || '';
        const subjectName = r.subjectId?.name?.toLowerCase() || '';
        return studentName.includes(q) || studentEmail.includes(q) || subjectName.includes(q);
      });
    }
    return list;
  }, [records, debouncedSearch]);

  // Filter summary list locally by search query (cohort already filtered server-side)
  const filteredSummary = useMemo(() => {
    let list = summaryData?.summary || [];
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter((s) => (s.name?.toLowerCase() || '').includes(q) || (s.email?.toLowerCase() || '').includes(q));
    }
    return list;
  }, [summaryData, debouncedSearch]);

  const summaryList = summaryData?.summary || [];
  const atRiskStudents = summaryList.filter((s) => s.isAtRisk);
  const adequateStudents = summaryList.filter((s) => !s.isAtRisk);
  const medicalCount = summaryList.reduce((acc, s) => acc + (s.medicalLeave || 0), 0);

  const handleApproveMedical = async (id, name) => {
    try {
      await approveMedical.mutateAsync(id);
      showToast(`Medical leave approved for ${name}.`);
      handleRefresh();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to approve medical leave.', { severity: 'error' });
    }
  };

  // Export CSV
  const handleDownloadCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';

    if (viewMode === 'records') {
      csvContent += 'Student Name,Student Email,Subject Code,Subject Name,Session Type,Date,Status,Medical Approved\n';
      filteredRecords.forEach((r) => {
        const studentName = `"${r.studentId?.name || 'N/A'}"`;
        const studentEmail = `"${r.studentId?.email || 'N/A'}"`;
        const subjectCode = `"${r.subjectId?.code || 'N/A'}"`;
        const subjectName = `"${r.subjectId?.name || 'N/A'}"`;
        const sessionType = `"${r.sessionType || 'LECTURE'}"`;
        const dateStr = `"${new Date(r.date).toLocaleDateString('en-IN')}"`;
        const status = `"${r.status || 'N/A'}"`;
        const medical = r.isMedicalApproved ? 'YES' : 'NO';

        csvContent += `${studentName},${studentEmail},${subjectCode},${subjectName},${sessionType},${dateStr},${status},${medical}\n`;
      });
    } else {
      csvContent += 'Student Name,Student Email,Present,Absent,Medical Leave,Total Classes,Attendance %,Status\n';
      filteredSummary.forEach((s) => {
        const studentName = `"${s.name || 'N/A'}"`;
        const studentEmail = `"${s.email || 'N/A'}"`;
        const present = s.present || 0;
        const absent = s.absent || 0;
        const medical = s.medicalLeave || 0;
        const total = s.total || 0;
        const pct = `${s.percentage || 0}%`;
        const status = s.isAtRisk ? 'AT RISK (<75%)' : 'REGULAR (>75%)';

        csvContent += `${studentName},${studentEmail},${present},${absent},${medical},${total},${pct},${status}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Attendance_Report_${viewMode}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const summaryColumns = [
    {
      id: 'student',
      label: 'STUDENT NAME & EMAIL',
      render: (r) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 800, color: theme.palette.ink?.[900], lineHeight: 1.2 }}>
            {r.name || 'Student Name'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {r.email || '—'}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'breakdown',
      label: 'ATTENDANCE SESSIONS',
      render: (r) => (
        <Typography variant="caption" sx={{ fontWeight: 700 }}>
          {r.present || 0} Present / {r.total || 0} Total ({r.absent || 0} Absent)
        </Typography>
      ),
    },
    {
      id: 'pct',
      label: 'AGGREGATE ATTENDANCE',
      render: (r) => <AttendanceBar pct={r.percentage || 0} />,
    },
    {
      id: 'status',
      label: 'ELIGIBILITY STATUS',
      render: (r) => (
        <Chip
          icon={r.isAtRisk ? <CancelOutlined sx={{ fontSize: '0.8rem !important' }} /> : <CheckCircleOutlined sx={{ fontSize: '0.8rem !important' }} />}
          label={r.isAtRisk ? 'AT RISK (<75%)' : 'REGULAR (>75%)'}
          size="small"
          color={r.isAtRisk ? 'error' : 'success'}
          sx={{ fontWeight: 800, fontSize: '0.65rem', height: 22 }}
        />
      ),
    },
  ];

  const recordColumns = [
    {
      id: 'student',
      label: 'STUDENT NAME & EMAIL',
      render: (r) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 800, color: theme.palette.ink?.[900], lineHeight: 1.2 }}>
            {r.studentId?.name || 'Student Name'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {r.studentId?.email || '—'}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'subject',
      label: 'SUBJECT & SESSION',
      render: (r) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {r.subjectId?.name || 'Subject'}
          </Typography>
          <Chip label={r.sessionType || 'LECTURE'} size="small" variant="outlined" sx={{ fontWeight: 800, fontSize: '0.62rem', height: 18, mt: 0.3 }} />
        </Box>
      ),
    },
    {
      id: 'date',
      label: 'ATTENDANCE DATE',
      render: (r) => (
        <Chip
          icon={<CalendarTodayOutlined sx={{ fontSize: '0.75rem !important' }} />}
          label={new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          size="small"
          sx={{ fontWeight: 700, fontSize: '0.68rem', height: 22 }}
        />
      ),
    },
    {
      id: 'status',
      label: 'DAILY ATTENDANCE STATUS',
      render: (r) => (
        <Chip
          label={r.status}
          size="small"
          color={r.status === 'PRESENT' ? 'success' : r.status === 'ABSENT' ? 'error' : r.status === 'MEDICAL_LEAVE' ? 'info' : 'warning'}
          sx={{ fontWeight: 800, fontSize: '0.65rem', height: 22 }}
        />
      ),
    },
    {
      id: 'actions',
      label: 'EXEMPTIONS',
      render: (r) =>
        r.status === 'ABSENT' && !r.isMedicalApproved ? (
          <Button
            size="small"
            variant="outlined"
            color="info"
            startIcon={<LocalHospitalOutlined fontSize="small" />}
            onClick={() => handleApproveMedical(r._id, r.studentId?.name)}
            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, fontSize: '0.68rem', py: 0.2 }}
          >
            Approve Medical
          </Button>
        ) : r.isMedicalApproved ? (
          <Chip label="Medical Approved" size="small" color="info" variant="outlined" sx={{ fontWeight: 800, fontSize: '0.65rem', height: 20 }} />
        ) : null,
    },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      {/* ── 1. Hero Identity Banner ────────────────────────────────────────── */}
      <Card
        sx={{
          p: { xs: 2.5, md: 3.5 },
          borderRadius: '16px',
          border: `1px solid ${theme.palette.divider}`,
          background: `linear-gradient(135deg, ${theme.palette.primary.main}12 0%, ${theme.palette.primary.main}04 100%)`,
          boxShadow: 'none',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <Chip
                icon={<FactCheckOutlined sx={{ fontSize: '0.85rem !important', color: `${theme.palette.primary.main} !important` }} />}
                label="DEPARTMENT ATTENDANCE ANALYTICS & DAILY LOGS DESK"
                size="small"
                sx={{
                  bgcolor: `${theme.palette.primary.main}18`,
                  color: theme.palette.primary.main,
                  fontWeight: 800,
                  fontSize: '0.68rem',
                  letterSpacing: '0.04em',
                }}
              />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.ink?.[900], letterSpacing: '-0.02em' }}>
              Attendance Analytics & Daily Logs
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5, maxWidth: 680 }}>
              Track aggregate attendance percentages, view separate daily attendance logs per date, detect low-attendance warnings (&lt;75%), and mark session logs.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<RefreshOutlined />}
              onClick={handleRefresh}
              sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, px: 2 }}
            >
              Refresh
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadOutlined />}
              onClick={handleDownloadCSV}
              sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, px: 2 }}
            >
              Export CSV
            </Button>
            <Button
              variant="contained"
              startIcon={<FactCheckOutlined />}
              onClick={() => setBulkModalOpen(true)}
              sx={{
                borderRadius: '10px',
                textTransform: 'none',
                fontWeight: 700,
                px: 2.5,
                boxShadow: `0 4px 14px ${theme.palette.primary.main}35`,
              }}
            >
              Mark Session Attendance
            </Button>
          </Box>
        </Box>
      </Card>

      {/* ── 2. KPI Summary Grid ────────────────────────────────────────────── */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.5, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, borderTop: `4px solid ${theme.palette.primary.main}`, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em' }}>
              SUBJECT STUDENTS
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.ink?.[900], mt: 0.5 }}>
              {summaryLoading ? <CircularProgress size={22} /> : summaryList.length}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.2 }}>
              Tracked in selected subject
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.5, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, borderTop: `4px solid ${theme.palette.success.main}`, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em' }}>
              ADEQUATE ATTENDANCE (&gt;75%)
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.success.main, mt: 0.5 }}>
              {summaryLoading ? <CircularProgress size={22} /> : adequateStudents.length}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.2 }}>
              Eligible for examinations
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.5, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, borderTop: `4px solid ${theme.palette.warning.main}`, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em' }}>
              AT-RISK WARNINGS (&lt;75%)
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.warning.main, mt: 0.5 }}>
              {summaryLoading ? <CircularProgress size={22} /> : atRiskStudents.length}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.2 }}>
              Low-attendance warnings
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.5, borderRadius: '14px', border: `1px solid ${theme.palette.divider}`, borderTop: `4px solid ${theme.palette.info.main}`, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.05em' }}>
              MEDICAL LEAVES EXCUSED
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.info.main, mt: 0.5 }}>
              {summaryLoading ? <CircularProgress size={22} /> : medicalCount}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.2 }}>
              Approved medical exemptions
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* ── 3. Filters & View Mode Control Card ───────────────────────────── */}
      <Card sx={{ p: { xs: 2, md: 2.5 }, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2.5 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              variant={viewMode === 'summary' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('summary')}
              sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700 }}
            >
              Overall Subject Summary
            </Button>
            <Button
              size="small"
              variant={viewMode === 'records' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('records')}
              sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700 }}
            >
              Daily Attendance Logs per Date
            </Button>
          </Box>

          {isAnyFilterActive && (
            <Button size="small" startIcon={<ClearOutlined />} onClick={handleClearFilters} sx={{ textTransform: 'none', fontSize: '0.75rem' }}>
              Clear All Filters
            </Button>
          )}
        </Box>

        {/* ── Section A: Academic Cohort & Subject Filters ── */}
        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', letterSpacing: '0.06em', mb: 1.2, display: 'block' }}>
          ACADEMIC COHORT & CURRICULUM FILTERS
        </Typography>
        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          {/* Course Filter */}
          <Grid item xs={12} sm={6} md={2.4}>
            <TextField
              select
              fullWidth
              size="small"
              label="Course Program"
              value={selectedCourse}
              onChange={(e) => {
                setSelectedCourse(e.target.value);
                setSelectedBranch('');
                setSelectedSemester('');
                setSelectedSubjectId('');
              }}
            >
              <MenuItem value="">All Courses</MenuItem>
              {hodCourses.map((c) => (
                <MenuItem key={c._id} value={c._id}>
                  {c.code} — {c.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Branch Filter */}
          <Grid item xs={12} sm={6} md={2.4}>
            <TextField
              select
              fullWidth
              size="small"
              label="Branch Specialization"
              value={selectedBranch}
              onChange={(e) => {
                setSelectedBranch(e.target.value);
                setSelectedSubjectId('');
              }}
            >
              <MenuItem value="">All Branches</MenuItem>
              {availableBranches.map((b) => (
                <MenuItem key={b._id || b.id} value={b._id || b.id}>
                  {b.name} ({b.code})
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Semester Filter */}
          <Grid item xs={12} sm={6} md={2.4}>
            <TextField
              select
              fullWidth
              size="small"
              label="Semester"
              value={selectedSemester}
              onChange={(e) => {
                setSelectedSemester(e.target.value);
                setSelectedSubjectId('');
              }}
            >
              <MenuItem value="">All Semesters</MenuItem>
              {semesterOptions.map((s) => (
                <MenuItem key={s} value={s}>
                  Semester {s}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Group Filter */}
          <Grid item xs={12} sm={6} md={2.4}>
            <GroupSelect
              value={selectedGroup}
              onChange={(val) => setSelectedGroup(val)}
              label="Branch Group"
              allowFullBatch={true}
              fullBatchLabel="All Groups (G1-G6)"
              size="small"
              sx={{ width: '100%' }}
            />
          </Grid>

          {/* Subject Filter */}
          <Grid item xs={12} sm={6} md={2.4}>
            <TextField
              select
              fullWidth
              size="small"
              label="Curriculum Subject"
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
            >
              <MenuItem value="">All Subjects</MenuItem>
              {subjects.map((sub) => (
                <MenuItem key={sub._id || sub.id} value={sub._id || sub.id}>
                  {sub.code ? `${sub.code} — ` : ''}{sub.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* ── Section B: Log Search & Date Filters ── */}
        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', letterSpacing: '0.06em', mb: 1.2, display: 'block' }}>
          DAILY DATE & LOG SEARCH FILTERS
        </Typography>
        <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search student or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchOutlined sx={{ color: 'text.secondary', mr: 1, fontSize: 18 }} />,
              }}
            />
          </Grid>

          {/* Date Picker Filter */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              type="date"
              fullWidth
              size="small"
              label="Specific Date Log"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* Session Type Filter */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Session Type"
              value={selectedSessionType}
              onChange={(e) => setSelectedSessionType(e.target.value)}
            >
              <MenuItem value="">All Session Types</MenuItem>
              <MenuItem value="LECTURE">Lecture</MenuItem>
              <MenuItem value="LAB">Practical / Lab</MenuItem>
              <MenuItem value="TUTORIAL">Tutorial</MenuItem>
            </TextField>
          </Grid>

          {/* Status Filter */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Attendance Status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="PRESENT">PRESENT</MenuItem>
              <MenuItem value="ABSENT">ABSENT</MenuItem>
              <MenuItem value="MEDICAL_LEAVE">MEDICAL LEAVE</MenuItem>
            </TextField>
          </Grid>
        </Grid>

        {/* Render Table based on View Mode */}
        {viewMode === 'summary' ? (
          summaryLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress size={32} />
            </Box>
          ) : filteredSummary.length === 0 ? (
            <EmptyState type="reports" title="No Attendance Summary Found" description="No student summary data matches the selected subject or group filter." />
          ) : (
            <DataTable columns={summaryColumns} data={filteredSummary} isLoading={summaryLoading} emptyMessage="No attendance summary available." />
          )
        ) : recordsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={32} />
          </Box>
        ) : filteredRecords.length === 0 ? (
          <EmptyState type="reports" title="No Daily Attendance Records Found" description="No daily logs found for the selected date, subject, or group." />
        ) : (
          <DataTable columns={recordColumns} data={filteredRecords} isLoading={recordsLoading} emptyMessage="No attendance logs found." />
        )}
      </Card>

      {/* Mark Session Attendance Modal */}
      {bulkModalOpen && (
        <MarkAttendanceModal
          open={bulkModalOpen}
          onClose={() => setBulkModalOpen(false)}
          deptId={cleanDeptId}
          onSuccess={() => handleRefresh()}
        />
      )}
    </Box>
  );
};

export default HodAttendanceHub;
