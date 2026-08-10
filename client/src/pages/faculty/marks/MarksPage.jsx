import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Chip,
  Grid,
  Card,
  useTheme,
  Avatar,
  Paper,
} from '@mui/material';
import {
  Save as SaveIcon,
  Download as DownloadIcon,
  FactCheckOutlined,
  CheckCircleOutlined,
  CancelOutlined,
  PeopleOutlined,
  PercentOutlined,
  LockOutlined,
  LockOpenOutlined,
} from '@mui/icons-material';

// Child presenter components
import MarksFilters from './components/MarksFilters';
import MarksEntryTable from './components/MarksEntryTable';

// Backend hooks
import {
  useFacultyDashboardQuery,
  useExamsQuery,
  useFacultyAssignmentsQuery,
  useSubmitExamResultMutation,
  useExamResultsQuery,
} from '../../../queries/facultyQueries';
import { useUsersQuery } from '../../../queries/userQueries';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';

export const MarksPage = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const { showToast } = useToast();

  // State Management
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('ALL');
  const [assessmentType, setAssessmentType] = useState('EXAM');
  const [selectedAssessmentId, setSelectedAssessmentId] = useState('');
  const [sortBy, setSortBy] = useState('rollAsc');

  // Active Gradebook State
  const [, setStatus] = useState('DRAFT');
  const [records, setRecords] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Fetch dashboard stats for assigned subjects list
  const { data: dashboardData, isLoading: isDashboardLoading } = useFacultyDashboardQuery();
  const assignedSubjects = useMemo(() => dashboardData?.assignedSubjects || [], [dashboardData]);

  // Auto-select first subject
  useEffect(() => {
    if (assignedSubjects.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(assignedSubjects[0].id);
    }
  }, [assignedSubjects, selectedSubjectId]);

  const currentSubject = useMemo(() => {
    return assignedSubjects.find((s) => String(s.id) === String(selectedSubjectId)) || null;
  }, [assignedSubjects, selectedSubjectId]);

  // Section options
  const sectionsForSubject = useMemo(() => [
    { id: 'ALL', name: 'All Sections (Whole Batch)', strength: 'All' },
    { id: 'A', name: 'Group / Section A', strength: 'Sec A' },
    { id: 'B', name: 'Group / Section B', strength: 'Sec B' },
  ], []);

  // 2. Fetch Exams and Homework Assignments from backend
  const { data: rawExams = [], isLoading: isExamsLoading } = useExamsQuery({
    subjectId: selectedSubjectId || undefined,
  });

  const { data: rawAssignments = [], isLoading: isAssignmentsLoading } = useFacultyAssignmentsQuery({
    subjectId: selectedSubjectId || undefined,
  });

  // Combine and map available assessments according to selected assessmentType
  const availableAssessments = useMemo(() => {
    if (assessmentType === 'ASSIGNMENT') {
      return rawAssignments.map((asg) => ({
        id: asg._id,
        name: asg.title,
        title: asg.title,
        maxMarks: asg.maxMarks || 100,
        passingMarks: Math.round((asg.maxMarks || 100) * 0.4),
        assessmentType: 'ASSIGNMENT',
        marksEntryEnabled: true, // Homework assignments are always editable by faculty
      }));
    }

    return rawExams
      .filter((ex) => {
        if (assessmentType === 'EXAM') return ex.examType === 'MID_TERM' || ex.examType === 'END_TERM' || ex.type === 'INTERNAL' || ex.type === 'EXTERNAL';
        if (assessmentType === 'QUIZ') return ex.examType === 'QUIZ';
        if (assessmentType === 'PRACTICAL') return ex.examType === 'LAB' || ex.type === 'PRACTICAL' || ex.type === 'VIVA';
        return true;
      })
      .map((ex) => ({
        id: ex._id,
        name: ex.name || ex.title,
        title: ex.name || ex.title,
        maxMarks: ex.maxMarks || ex.totalMarks || 100,
        passingMarks: ex.passingMarks || 40,
        assessmentType: ex.examType || ex.type,
        marksEntryEnabled: Boolean(ex.marksEntryEnabled), // Controlled by HOD
      }));
  }, [rawExams, rawAssignments, assessmentType]);

  // Auto-select first assessment item when list updates
  useEffect(() => {
    if (availableAssessments.length > 0) {
      const exists = availableAssessments.some((a) => String(a.id) === String(selectedAssessmentId));
      if (!exists) {
        setSelectedAssessmentId(availableAssessments[0].id);
      }
    } else {
      setSelectedAssessmentId('');
    }
  }, [availableAssessments, selectedAssessmentId]);

  const activeAssessment = useMemo(() => {
    return availableAssessments.find((asg) => String(asg.id) === String(selectedAssessmentId)) || null;
  }, [selectedAssessmentId, availableAssessments]);

  // Check HOD Permission Lock
  const isMarksEntryAllowed = activeAssessment ? Boolean(activeAssessment.marksEntryEnabled) : false;

  // 3. Fetch student roster
  const cleanDeptId = typeof user?.departmentId === 'object'
    ? user?.departmentId?._id
    : (user?.departmentId || user?.department?._id || user?.department || currentSubject?.departmentId);

  const { data: studentsResponse, isLoading: isStudentsLoading } = useUsersQuery({
    role: 'STUDENT',
    departmentId: cleanDeptId,
    group: selectedSectionId !== 'ALL' ? selectedSectionId : undefined,
    limit: 200,
  });

  const rawStudents = useMemo(() => {
    if (Array.isArray(studentsResponse)) return studentsResponse;
    return studentsResponse?.data || [];
  }, [studentsResponse]);

  const submitResultMutation = useSubmitExamResultMutation();

  // Fetch existing exam/assignment results from MongoDB
  const { data: dbResults = [], isLoading: isResultsLoading, refetch: refetchResults } = useExamResultsQuery(selectedAssessmentId);

  // Load and populate records (syncing with MongoDB results)
  useEffect(() => {
    if (!selectedAssessmentId || rawStudents.length === 0) {
      setRecords([]);
      setStatus('DRAFT');
      return;
    }

    const maxMarksValue = activeAssessment?.maxMarks || 100;
    const initialRecords = rawStudents.map((stud, idx) => {
      const studId = stud._id || stud.id;
      const dbMatch = Array.isArray(dbResults)
        ? dbResults.find((res) => {
            const rStudId = typeof res.studentId === 'object' ? res.studentId?._id : res.studentId;
            return String(rStudId) === String(studId);
          })
        : null;

      const marksValue = dbMatch
        ? (dbMatch.absent ? null : dbMatch.marksObtained)
        : '';

      return {
        studentId: studId,
        rollNumber: stud.rollNumber || stud.enrollmentNo || stud.studentId || `STU2026${String(idx + 1).padStart(3, '0')}`,
        name: stud.name,
        email: stud.email,
        marksObtained: marksValue,
        maxMarks: maxMarksValue,
        grade: dbMatch ? dbMatch.grade : '',
        remarks: dbMatch ? dbMatch.remarks || '' : '',
      };
    });

    setRecords(initialRecords);
    
    const anyPublished = Array.isArray(dbResults) && dbResults.some((res) => res.isPublished);
    setStatus(anyPublished ? 'PUBLISHED' : 'DRAFT');
  }, [selectedAssessmentId, activeAssessment, rawStudents, dbResults]);

  // Automatic Letter Grade Calculation
  const calculateGrade = (score, max) => {
    if (score === null || score === undefined || isNaN(score) || score === '') return 'F';
    const ratio = score / max;
    if (ratio >= 0.9) return 'O';
    if (ratio >= 0.8) return 'A+';
    if (ratio >= 0.7) return 'A';
    if (ratio >= 0.6) return 'B+';
    if (ratio >= 0.5) return 'B';
    if (ratio >= 0.4) return 'C';
    return 'F';
  };

  const handleSubjectChange = (subjectId) => {
    setSelectedSubjectId(subjectId);
    setSelectedSectionId('ALL');
    setSelectedAssessmentId('');
  };

  const handleSectionChange = (sectionId) => {
    setSelectedSectionId(sectionId);
  };

  const handleTypeChange = (type) => {
    setAssessmentType(type);
    setSelectedAssessmentId('');
  };

  const handleAssessmentChange = (id) => {
    setSelectedAssessmentId(id);
  };

  const handleRecordChange = (studentId, field, value) => {
    if (!isMarksEntryAllowed) return; // Prevent mutation if locked
    setRecords((prev) =>
      prev.map((rec) => {
        if (rec.studentId !== studentId) return rec;

        const updated = { ...rec, [field]: value };
        if (field === 'marksObtained') {
          if (value === '' || value === null) {
            updated.marksObtained = value;
            updated.grade = 'F';
          } else {
            let score = parseFloat(value);
            if (isNaN(score)) score = 0;
            if (score > rec.maxMarks) score = rec.maxMarks;
            updated.marksObtained = score;
            updated.grade = calculateGrade(score, rec.maxMarks);
          }
        }
        return updated;
      })
    );
  };

  // Sort student records for table
  const sortedRecords = useMemo(() => {
    const list = [...records];
    list.sort((a, b) => {
      if (sortBy === 'rollAsc') return (a.rollNumber || '').localeCompare(b.rollNumber || '');
      if (sortBy === 'rollDesc') return (b.rollNumber || '').localeCompare(a.rollNumber || '');
      if (sortBy === 'nameAsc') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'nameDesc') return (b.name || '').localeCompare(a.name || '');
      if (sortBy === 'marksAsc') {
        const scoreA = a.marksObtained === null ? -1 : Number(a.marksObtained);
        const scoreB = b.marksObtained === null ? -1 : Number(b.marksObtained);
        return scoreA - scoreB;
      }
      if (sortBy === 'marksDesc') {
        const scoreA = a.marksObtained === null ? -1 : Number(a.marksObtained);
        const scoreB = b.marksObtained === null ? -1 : Number(b.marksObtained);
        return scoreB - scoreA;
      }
      return 0;
    });
    return list;
  }, [records, sortBy]);

  const handleSaveMarks = () => {
    if (!selectedAssessmentId) return;
    if (!isMarksEntryAllowed) {
      showToast('Marks entry is currently locked by HOD. You cannot submit marks.', { severity: 'error' });
      return;
    }
    setIsSubmitting(true);

    const gradedRecords = records.filter((rec) => rec.marksObtained !== '');

    if (gradedRecords.length === 0) {
      setIsSubmitting(false);
      showToast('No grades entered to save.');
      return;
    }

    const promises = gradedRecords.map((rec) => {
      const isAbsent = rec.marksObtained === null;
      return submitResultMutation.mutateAsync({
        examId: selectedAssessmentId,
        studentId: rec.studentId,
        marksObtained: isAbsent ? 0 : Number(rec.marksObtained),
        absent: isAbsent,
        remarks: rec.remarks || '',
        isPublished: true,
      });
    });

    Promise.all(promises)
      .then(() => {
        setStatus('PUBLISHED');
        showToast('Marks submitted and saved to database successfully!');
        refetchResults();
      })
      .catch((err) => {
        showToast(`Failed to save marks: ${err.response?.data?.message || err.message}`, { severity: 'error' });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const handleExportCSV = () => {
    if (records.length === 0) return;
    const filename = `gradebook_${currentSubject?.code || selectedSubjectId}_${activeAssessment?.name || 'assessment'}.csv`;
    let content = 'Roll Number,Student Name,Email,Marks Obtained,Max Marks,Grade,Remarks\n';

    sortedRecords.forEach((r) => {
      const scoreStr = r.marksObtained === null ? 'ABSENT' : r.marksObtained;
      content += `"${r.rollNumber}","${r.name}","${r.email}","${scoreStr}","${r.maxMarks}","${r.grade}","${r.remarks}"\n`;
    });

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(content));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const totalStudents = sortedRecords.length;
  const gradedStudents = sortedRecords.filter((r) => r.marksObtained !== '' && r.marksObtained !== null);
  const passCount = gradedStudents.filter((r) => (Number(r.marksObtained) / (r.maxMarks || 100)) >= 0.4).length;
  const failCount = gradedStudents.length - passCount;
  const avgScore = gradedStudents.length > 0
    ? (gradedStudents.reduce((acc, r) => acc + Number(r.marksObtained), 0) / gradedStudents.length).toFixed(1)
    : 0;

  if (isDashboardLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={36} />
      </Box>
    );
  }

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
                label="FACULTY EXAM MARKS & EVALUATION DESK"
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
              Student Marks & Gradebook Control Desk
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
              View student exam scores, inspect grade distributions, and submit student marks when unlocked by the Head of Department (HOD).
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExportCSV}
              disabled={records.length === 0}
              sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
            >
              Export CSV Gradebook
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSaveMarks}
              disabled={!isMarksEntryAllowed || isSubmitting || submitResultMutation.isPending}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 700,
                background: theme.palette.primary.gradient || theme.palette.primary.main,
                color: '#ffffff',
              }}
            >
              {isSubmitting || submitResultMutation.isPending ? 'Submitting...' : 'Save & Publish Marks'}
            </Button>
          </Box>
        </Box>
      </Card>

      {/* ── 2. HOD Permission Lock / Unlock Alert Banner ─────────────────── */}
      {activeAssessment && (
        <Card
          sx={{
            p: 2.5,
            borderRadius: '14px',
            border: `1px solid ${isMarksEntryAllowed ? theme.palette.signal.success : theme.palette.warning.main}`,
            bgcolor: isMarksEntryAllowed ? `${theme.palette.signal.success}0A` : `${theme.palette.warning.main}0A`,
            boxShadow: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Avatar sx={{ bgcolor: isMarksEntryAllowed ? `${theme.palette.signal.success}20` : `${theme.palette.warning.main}20`, color: isMarksEntryAllowed ? theme.palette.signal.success : theme.palette.warning.main }}>
            {isMarksEntryAllowed ? <LockOpenOutlined /> : <LockOutlined />}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isMarksEntryAllowed ? theme.palette.signal.success : theme.palette.warning.main }}>
              {isMarksEntryAllowed ? '🔓 MARKS ENTRY UNLOCKED BY HOD' : '🔒 MARKS ENTRY LOCKED BY HOD (READ-ONLY MODE)'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.2 }}>
              {isMarksEntryAllowed
                ? 'You are authorized by the Head of Department to enter, edit, and submit exam marks for this assessment.'
                : 'Examinations are scheduled and controlled by the HOD. Marks entry for this assessment is currently locked. You can view existing student marks in read-only mode. Contact HOD to unlock marks entry.'}
            </Typography>
          </Box>
        </Card>
      )}

      {/* ── 3. KPI Summary Grid (Faculty Roster Card Style) ───────────────── */}
      <Grid container spacing={2.5}>
        {/* 1. Evaluated Students Card */}
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
                  EVALUATED STUDENTS
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

        {/* 2. Passed Students Card */}
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
                  PASSED STUDENTS (≥40%)
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
                  {passCount}
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

        {/* 3. Failed / Remedial Card */}
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
                  FAILED / REMEDIAL (&lt;40%)
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
                  {failCount}
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

        {/* 4. Class Average Score Card (Info Blue Accent) */}
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
                  CLASS AVERAGE SCORE
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
                  {avgScore}
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

      {/* ── 4. Filters Bar ──────────────────────────────────────────────── */}
      <Card sx={{ p: 3, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
        <MarksFilters
          subjects={filterSubjects}
          selectedSubjectId={selectedSubjectId}
          onSubjectChange={handleSubjectChange}
          sections={sectionsForSubject}
          selectedSectionId={selectedSectionId}
          onSectionChange={handleSectionChange}
          assessmentType={assessmentType}
          onTypeChange={handleTypeChange}
          assessments={availableAssessments}
          selectedAssessmentId={selectedAssessmentId}
          onAssessmentChange={handleAssessmentChange}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />
      </Card>

      {/* ── 5. Marks Entry Table Roster ────────────────────────────────────── */}
      <Card sx={{ p: 3, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
        {isStudentsLoading || isResultsLoading || isExamsLoading || isAssignmentsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={32} />
          </Box>
        ) : sortedRecords.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 6, textAlign: 'center', borderRadius: '12px' }}>
            <Typography variant="body1" color="text.secondary">
              Select a subject and active exam to view student marks.
            </Typography>
          </Paper>
        ) : (
          <MarksEntryTable
            records={sortedRecords}
            onRecordChange={handleRecordChange}
            disabled={!isMarksEntryAllowed || isSubmitting}
          />
        )}
      </Card>
    </Box>
  );
};

export default MarksPage;
