import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Snackbar,
  Alert,
  IconButton,
  CircularProgress,
  Chip,
  Grid,
  TextField,
  MenuItem,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Save as SaveIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Child presenter components
import MarksFilters from './components/MarksFilters';
import MarksEntryTable from './components/MarksEntryTable';
import MarksSummaryCard from './components/MarksSummaryCard';

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

export const MarksPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // State Management
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('ALL');
  const [assessmentType, setAssessmentType] = useState('EXAM');
  const [selectedAssessmentId, setSelectedAssessmentId] = useState('');
  const [sortBy, setSortBy] = useState('rollAsc');

  // Active Gradebook State
  const [status, setStatus] = useState('DRAFT');
  const [records, setRecords] = useState([]);

  // Mode States
  const [isEditing] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

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
    return assignedSubjects.find(s => String(s.id) === String(selectedSubjectId)) || null;
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
      }));
    }

    return rawExams
      .filter((ex) => {
        if (assessmentType === 'EXAM') return ex.examType === 'MID_TERM' || ex.examType === 'END_TERM';
        if (assessmentType === 'QUIZ') return ex.examType === 'QUIZ';
        if (assessmentType === 'PRACTICAL') return ex.examType === 'LAB';
        return true;
      })
      .map((ex) => ({
        id: ex._id,
        name: ex.name,
        title: ex.name,
        maxMarks: ex.maxMarks,
        passingMarks: ex.passingMarks,
        assessmentType: ex.examType,
      }));
  }, [rawExams, rawAssignments, assessmentType]);

  // Auto-select first assessment item when list updates
  useEffect(() => {
    if (availableAssessments.length > 0) {
      const exists = availableAssessments.some(a => String(a.id) === String(selectedAssessmentId));
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

  const showToast = (message, severity = 'success') => {
    setToast({ open: true, message, severity });
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
    setIsSubmitting(true);

    const gradedRecords = records.filter((rec) => rec.marksObtained !== '');

    if (gradedRecords.length === 0) {
      setIsSubmitting(false);
      showToast('No grades entered to save.', 'info');
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
        setIsSubmitting(false);
        setStatus('PUBLISHED');
        showToast('Gradebook saved & published successfully!', 'success');
        refetchResults();
      })
      .catch((err) => {
        setIsSubmitting(false);
        showToast(`Save failed: ${err.response?.data?.message || err.message}`, 'error');
      });
  };

  const handleExport = (type) => {
    const filename = `marks_${activeAssessment?.name || 'grades'}_${selectedSectionId}.${type === 'csv' ? 'csv' : 'txt'}`;
    const element = document.createElement('a');
    let content = '';

    if (type === 'csv') {
      content = 'Roll Number,Student Name,Marks Obtained,Max Marks,Grade,Remarks\n';
      records.forEach((rec) => {
        content += `"${rec.rollNumber}","${rec.name}","${rec.marksObtained ?? 'ABSENT'}","${rec.maxMarks}","${rec.grade}","${rec.remarks || ''}"\n`;
      });
      element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(content));
    } else {
      content = `--- GRADEBOOK REPORT ---\nAssessment: ${activeAssessment?.name || 'N/A'}\nSubject: ${currentSubject?.name}\nSection: ${selectedSectionId}\n\n`;
      records.forEach((rec) => {
        content += `${rec.rollNumber} - ${rec.name}: ${rec.marksObtained ?? 'ABSENT'}/${rec.maxMarks} (${rec.grade})\n`;
      });
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
    }

    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

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
          <IconButton
            onClick={() => navigate('/faculty')}
            size="small"
            sx={{ bgcolor: 'action.hover', '&:hover': { bgcolor: 'action.selected' } }}
          >
            <BackIcon fontSize="small" />
          </IconButton>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>
              Marks Entry & Gradebooks
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Grade exams and assignments, calculate averages, and save marks to MongoDB
            </Typography>
          </Box>
        </Box>
        {selectedAssessmentId && records.length > 0 && (
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => handleExport('csv')}
            sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700 }}
          >
            Export CSV
          </Button>
        )}
      </Box>

      {/* ── Filter Selectors Row ── */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 3 }} elevation={0} variant="outlined">
        {isDashboardLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
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
          />
        )}
      </Paper>

      {/* ── Main Gradebook Workspace ── */}
      {selectedAssessmentId ? (
        isStudentsLoading || isResultsLoading || isExamsLoading || isAssignmentsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : records.length > 0 ? (
          <Grid container spacing={3}>
            {/* Left: Interactive Marks Entry Table */}
            <Grid item xs={12} lg={8}>
              <Paper variant="outlined" sx={{ p: 3, borderRadius: 3.5 }}>
                {/* Header status bar */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                      Gradebook Roster ({activeAssessment?.name})
                    </Typography>
                    <Chip label={status} color={status === 'PUBLISHED' ? 'success' : 'default'} size="small" sx={{ fontWeight: 700 }} />
                  </Box>

                  {/* Actions buttons & Sort By Selector */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <TextField
                      select
                      size="small"
                      label="Sort By"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      sx={{
                        width: 160,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          fontSize: '0.85rem',
                        },
                      }}
                      InputLabelProps={{ shrink: true }}
                    >
                      <MenuItem value="rollAsc">Roll Number ↑</MenuItem>
                      <MenuItem value="rollDesc">Roll Number ↓</MenuItem>
                      <MenuItem value="nameAsc">Name A-Z</MenuItem>
                      <MenuItem value="nameDesc">Name Z-A</MenuItem>
                      <MenuItem value="marksAsc">Marks ↑</MenuItem>
                      <MenuItem value="marksDesc">Marks ↓</MenuItem>
                    </TextField>

                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={handleSaveMarks}
                      disabled={isSubmitting}
                      sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, bgcolor: 'success.main', '&:hover': { bgcolor: 'success.dark' } }}
                    >
                      {isSubmitting ? 'Saving...' : 'Save Gradebook'}
                    </Button>
                  </Box>
                </Box>

                <MarksEntryTable
                  records={sortedRecords}
                  isEditing={isEditing}
                  onMarksChange={(studentId, marks) => handleRecordChange(studentId, 'marksObtained', marks)}
                  onRemarksChange={(studentId, remarks) => handleRecordChange(studentId, 'remarks', remarks)}
                  onAbsentToggle={(studentId, isAbsent) => {
                    handleRecordChange(studentId, 'marksObtained', isAbsent ? null : 0);
                  }}
                />
              </Paper>
            </Grid>

            {/* Right: Dynamic Summary Performance Card */}
            <Grid item xs={12} lg={4}>
              <MarksSummaryCard records={records} />
            </Grid>
          </Grid>
        ) : (
          <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
            <Typography variant="body1" color="text.secondary">
              No students found registered for section {selectedSectionId}.
            </Typography>
          </Paper>
        )
      ) : (
        /* Empty Workflow state */
        <Paper
          variant="outlined"
          sx={{
            p: 6,
            textAlign: 'center',
            borderRadius: 3.5,
            bgcolor: 'background.paper',
          }}
        >
          <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
            Select Assessment Item
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Choose a subject, section, assessment type (Assignment, Exam, Quiz, Practical), and an item to open the gradebook roster.
          </Typography>
        </Paper>
      )}

      {/* ── Toast Feedback notification ── */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={toast.severity} variant="filled" sx={{ width: '100%', borderRadius: 2 }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MarksPage;
