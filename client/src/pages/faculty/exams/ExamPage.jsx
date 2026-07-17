// client/src/pages/faculty/exams/ExamPage.jsx
//
// Container page orchestrating the Faculty Exams Module with backend integration.

import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Snackbar,
  Alert,
  Paper,
  CircularProgress,
  Grid,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Reusable presentational components
import ExamFilters from './components/ExamFilters';
import ExamList from './components/ExamList';
import CreateExamDialog from './components/CreateExamDialog';

// Import backend hooks
import {
  useFacultyDashboardQuery,
  useExamsQuery,
  useScheduleExamMutation,
} from '../../../queries/facultyQueries';
import SubjectSelector from '../attendance/components/SubjectSelector';
import SectionSelector from '../attendance/components/SectionSelector';

export const ExamPage = () => {
  const navigate = useNavigate();

  // State Management
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
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
  const { data: rawExams = [], isLoading: isExamsLoading } = useExamsQuery({
    subjectId: selectedSubjectId || undefined,
  });

  const scheduleExamMutation = useScheduleExamMutation();

  const exams = useMemo(() => {
    return rawExams.map((ex) => ({
      id: ex._id,
      title: ex.name,
      description: `Exam scheduled for subject code ${ex.subjectId?.code || 'CS301'}.`,
      subjectId: ex.subjectId?._id || ex.subjectId,
      subjectCode: ex.subjectId?.code || 'CS301',
      subjectName: ex.subjectId?.name || 'Assigned Subject',
      sectionIds: [selectedSectionId || 'CSE-A'],
      sectionNames: [selectedSectionId || 'CSE-A'],
      status: 'PUBLISHED',
      type: ex.examType === 'LAB' ? 'PRACTICAL' : ex.examType === 'QUIZ' ? 'ONLINE' : 'THEORY',
      examDate: ex.date || new Date().toISOString(),
      date: ex.date,
      durationMinutes: 180,
      roomNumber: 'LH-101',
      totalMarks: ex.maxMarks || 100,
      maxMarks: ex.maxMarks,
      passingMarks: ex.passingMarks || 40,
      weightage: ex.examType === 'END_TERM' ? 60 : ex.examType === 'MID_TERM' ? 30 : 10,
      isResultPublished: false,
    }));
  }, [rawExams, selectedSectionId]);

  // Filtered Exams List
  const filteredExams = useMemo(() => {
    if (!selectedSubjectId || !selectedSectionId) return [];

    return exams.filter((ex) => {
      const statusMatch = statusFilter === 'ALL' || ex.status === statusFilter;
      const query = searchQuery.toLowerCase().trim();
      const searchMatch =
        !query ||
        ex.title.toLowerCase().includes(query) ||
        ex.description.toLowerCase().includes(query);

      return statusMatch && searchMatch;
    });
  }, [exams, selectedSubjectId, selectedSectionId, statusFilter, searchQuery]);

  const isClassSelected = !!(selectedSubjectId && selectedSectionId);

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
  };

  const handleSectionChange = (sectionId) => {
    setSelectedSectionId(sectionId);
  };

  const handleCreateSubmit = (formData) => {
    // Map UI type to Mongoose schema enum: ['MID_TERM', 'END_TERM', 'LAB', 'QUIZ']
    const typeMapping = {
      THEORY: 'MID_TERM',
      PRACTICAL: 'LAB',
      ONLINE: 'QUIZ',
      VIVA: 'QUIZ',
    };

    const payload = {
      name: formData.title,
      subjectId: selectedSubjectId,
      examType: typeMapping[formData.type] || 'MID_TERM',
      date: formData.examDate,
      maxMarks: Number(formData.totalMarks) || 100,
      passingMarks: Math.round((Number(formData.totalMarks) || 100) * 0.4),
    };

    scheduleExamMutation.mutate(payload, {
      onSuccess: () => {
        setIsCreateOpen(false);
        showToast('Exam scheduled successfully in MongoDB!', 'success');
      },
      onError: (err) => {
        showToast(`Scheduling failed: ${err.response?.data?.message || err.message}`, 'error');
      },
    });
  };

  if (isDashboardLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
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
    <Box sx={{ flexGrow: 1 }}>
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
              Exams Scheduling
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Schedule tests, manage conduction statuses, publish student results, and sync gradebooks
            </Typography>
          </Box>
        </Box>
        {isClassSelected && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setIsCreateOpen(true)}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              bgcolor: '#4f46e5',
              '&:hover': { bgcolor: '#4338ca' },
              borderRadius: 2,
              px: 3.5,
            }}
          >
            Schedule Exam
          </Button>
        )}
      </Box>

      {/* ── Subject & Section Filter Row ── */}
      <Paper sx={{ p: 3, mb: 4 }} elevation={0} variant="outlined">
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <SubjectSelector
              subjects={filterSubjects}
              selectedSubjectId={selectedSubjectId}
              onSubjectChange={handleSubjectChange}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <SectionSelector
              sections={sectionsForSubject}
              selectedSectionId={selectedSectionId}
              onSectionChange={handleSectionChange}
              disabled={!selectedSubjectId}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* ── Main Dashboard Lifecycle View ── */}
      {isClassSelected ? (
        <Box>
          <ExamFilters
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
          />
          {isExamsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : (
            <ExamList
              exams={filteredExams}
              statusFilter={statusFilter}
              onEdit={() => alert('Editing exams is restricted to super admins.')}
              onDelete={() => alert('Deletion is restricted to super admins.')}
              onPublish={() => {}}
              onArchive={() => {}}
              onToggleResultsPublish={() => {}}
              onEnterMarks={(_examId) => navigate('/marks')}
              onCreateNew={() => setIsCreateOpen(true)}
            />
          )}
        </Box>
      ) : (
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
            Select a subject and target section above to manage scheduled exams.
          </Typography>
        </Paper>
      )}

      {/* ── Dialog Modals ── */}
      {isClassSelected && (
        <CreateExamDialog
          open={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onSubmit={handleCreateSubmit}
          availableSections={sectionsForSubject}
          isSubmitting={scheduleExamMutation.isPending}
        />
      )}

      {/* ── Alert Toast notifications ── */}
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

export default ExamPage;
