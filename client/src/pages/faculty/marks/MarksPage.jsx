// client/src/pages/faculty/marks/MarksPage.jsx
//
// Container component orchestrating the Faculty Marks module with backend MongoDB integration.

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

// Import backend hooks
import {
  useFacultyDashboardQuery,
  useExamsQuery,
  useSubmitExamResultMutation,
  useExamResultsQuery,
} from '../../../queries/facultyQueries';
import { useUsersQuery } from '../../../queries/userQueries';

export const MarksPage = () => {
  const navigate = useNavigate();

  // State Management
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [assessmentType, setAssessmentType] = useState('THEORY');
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

  // 2. Fetch exams list from MongoDB
  const { data: rawExams = [] } = useExamsQuery({
    subjectId: selectedSubjectId || undefined,
  });

  // Map backend exams to available assessments matching the selected type
  const availableAssessments = useMemo(() => {
    return rawExams
      .filter((ex) => {
        const typeMap = ex.examType === 'LAB' ? 'PRACTICAL' : (ex.examType === 'QUIZ' ? 'QUIZ' : 'EXAM');
        return typeMap === assessmentType;
      })
      .map((ex) => ({
        id: ex._id,
        name: ex.name,
        title: ex.name,
        maxMarks: ex.maxMarks,
        passingMarks: ex.passingMarks,
        assessmentType: ex.examType === 'LAB' ? 'PRACTICAL' : (ex.examType === 'QUIZ' ? 'QUIZ' : 'EXAM'),
      }));
  }, [rawExams, assessmentType]);

  const activeAssessment = useMemo(() => {
    return availableAssessments.find((asg) => asg.id === selectedAssessmentId);
  }, [selectedAssessmentId, availableAssessments]);

  // 3. Fetch students roster for the gradebook list
  const { data: studentsResponse, isLoading: isStudentsLoading } = useUsersQuery({
    role: 'STUDENT',
    group: selectedSectionId || undefined,
    limit: 100,
  });

  const studentsList = useMemo(() => studentsResponse?.data || [], [studentsResponse]);

  const submitResultMutation = useSubmitExamResultMutation();

  // Fetch existing exam results from MongoDB
  const { data: dbResults = [], isLoading: isResultsLoading } = useExamResultsQuery(selectedAssessmentId);

  // Load and populate records (syncing with MongoDB results if they exist)
  useEffect(() => {
    if (!selectedAssessmentId || studentsList.length === 0) {
      setRecords([]);
      setStatus('DRAFT');
      return;
    }

    const maxMarksValue = activeAssessment?.maxMarks || 100;
    const initialRecords = studentsList.map((stud, idx) => {
      // Find matching result in MongoDB
      const studId = stud._id || stud.id;
      const dbMatch = dbResults.find(
        (res) => (res.studentId?._id || res.studentId) === studId
      );

      const marksValue = dbMatch
        ? (dbMatch.absent ? null : dbMatch.marksObtained)
        : '';

      return {
        studentId: studId,
        rollNumber: stud.rollNumber || `CS20260${idx + 1}`,
        name: stud.name,
        email: stud.email,
        marksObtained: marksValue,
        maxMarks: maxMarksValue,
        grade: dbMatch ? dbMatch.grade : '',
        remarks: dbMatch ? dbMatch.remarks || '' : '',
      };
    });

    setRecords(initialRecords);
    
    // Determine status from dbResults (if some are published, status is APPROVED)
    const anyPublished = dbResults.some((res) => res.isPublished);
    setStatus(anyPublished ? 'APPROVED' : 'DRAFT');
  }, [selectedAssessmentId, activeAssessment, studentsList, dbResults]);

  // Automatic Letter Grade Calculation
  const calculateGrade = (score, max) => {
    if (score === null || score === undefined || isNaN(score)) return 'F';
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
    const sections = getSectionsForSubject(subjectId);
    if (sections.length > 0) {
      setSelectedSectionId(sections[0].id);
    } else {
      setSelectedSectionId('');
    }
    setAssessmentType('THEORY');
    setSelectedAssessmentId('');
  };

  const handleSectionChange = (sectionId) => {
    setSelectedSectionId(sectionId);
    setAssessmentType('THEORY');
    setSelectedAssessmentId('');
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

  // Sort student records instantly for table rendering
  const sortedRecords = useMemo(() => {
    const list = [...records];
    list.sort((a, b) => {
      if (sortBy === 'rollAsc') {
        return (a.rollNumber || '').localeCompare(b.rollNumber || '');
      }
      if (sortBy === 'rollDesc') {
        return (b.rollNumber || '').localeCompare(a.rollNumber || '');
      }
      if (sortBy === 'nameAsc') {
        return (a.name || '').localeCompare(b.name || '');
      }
      if (sortBy === 'nameDesc') {
        return (b.name || '').localeCompare(a.name || '');
      }
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
        setStatus('APPROVED');
        showToast('Marks saved successfully to MongoDB!', 'success');
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
        content += `${rec.rollNumber},${rec.name},${rec.marksObtained},${rec.maxMarks},${rec.grade},${rec.remarks || ''}\n`;
      });
      element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(content));
    } else {
      content = `--- Gradebook Report ---\nAssessment: ${activeAssessment?.name || 'N/A'}\nSection: ${selectedSectionId}\n\n`;
      records.forEach((rec) => {
        content += `${rec.rollNumber} - ${rec.name}: ${rec.marksObtained}/${rec.maxMarks} (${rec.grade})\n`;
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
    <Box sx={{ flexGrow: 1 }}>
      {/* ── Page Header ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
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
              Record assessment grades, calculate averages, approve gradebook states, and publish marks to student portals
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
      <Paper sx={{ p: 3, mb: 4 }} elevation={0} variant="outlined">
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
        isStudentsLoading || isResultsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : records.length > 0 ? (
          <Grid container spacing={3}>
            {/* Left: Interactive Marks Entry Table */}
            <Grid item xs={12} lg={8}>
              <Paper variant="outlined" sx={{ p: 3, borderRadius: 3.5 }}>
                {/* Header status bar */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                      Roster Grades Entry
                    </Typography>
                    <Chip label={status} color={status === 'APPROVED' ? 'success' : 'default'} size="small" sx={{ fontWeight: 700 }} />
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
                      sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}
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
              No students found registered under section {selectedSectionId}.
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
          <Typography variant="body1" color="text.secondary">
            Select a subject, section, type, and exam above to start entry.
          </Typography>
        </Paper>
      )}

      {/* ── Toast Feedback notification ── */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast({ ...toast, open: false })}
      >
        <Alert severity={toast.severity} variant="filled" sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MarksPage;
