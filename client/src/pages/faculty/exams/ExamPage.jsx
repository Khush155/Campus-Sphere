// client/src/pages/faculty/exams/ExamPage.jsx
//
// Container page orchestrating the Faculty Exams Module.
// Owns all business state (subject/section selection, filters, dialog controls, datasets)
// and handles CRUD state mutations locally.

import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Snackbar,
  Alert,
  Paper,
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
import EditExamDialog from './components/EditExamDialog';

// Data sources
import { mockExams } from './mockData';
import { mockAttendanceSubjects } from '../attendance/mockData';

// Subject → Section mapping (reused from Attendance module for consistency)
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

export const ExamPage = () => {
  const navigate = useNavigate();

  // ══════════════════════════════════════════════════════════
  // STATE MANAGEMENT
  // ══════════════════════════════════════════════════════════
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [exams, setExams] = useState(mockExams);

  // Dialog States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingExam, setEditingExam] = useState(null);

  // UX Feedback States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  // ══════════════════════════════════════════════════════════
  // DERIVED DATA
  // ══════════════════════════════════════════════════════════
  
  // Sections available for the selected subject
  const sectionsForSubject = SUBJECT_SECTIONS[selectedSubjectId] || [];

  // Currently selected subject details
  const activeSubject = mockAttendanceSubjects.find(s => s.id === selectedSubjectId);

  // Filtered Exams List
  const filteredExams = useMemo(() => {
    if (!selectedSubjectId || !selectedSectionId) return [];

    return exams.filter((ex) => {
      // 1. Subject match
      const subjectMatch = ex.subjectId === selectedSubjectId;
      
      // 2. Section match (an exam can be assigned to multiple sections)
      const sectionMatch = ex.sectionIds.includes(selectedSectionId);

      // 3. Status filter match
      const statusMatch = statusFilter === 'ALL' || ex.status === statusFilter;

      // 4. Search query match
      const query = searchQuery.toLowerCase().trim();
      const searchMatch =
        !query ||
        ex.title.toLowerCase().includes(query) ||
        ex.description.toLowerCase().includes(query) ||
        ex.roomNumber.toLowerCase().includes(query);

      return subjectMatch && sectionMatch && statusMatch && searchMatch;
    });
  }, [exams, selectedSubjectId, selectedSectionId, statusFilter, searchQuery]);

  // Show list/action bars only when Subject and Section are both selected
  const isClassSelected = !!(selectedSubjectId && selectedSectionId);

  // ══════════════════════════════════════════════════════════
  // HANDLERS
  // ══════════════════════════════════════════════════════════

  const showToast = (message, severity = 'success') => {
    setToast({ open: true, message, severity });
  };

  const handleSubjectChange = (subjectId) => {
    setSelectedSubjectId(subjectId);
    
    // Auto-select section if only one is available
    const sections = SUBJECT_SECTIONS[subjectId] || [];
    if (sections.length === 1) {
      setSelectedSectionId(sections[0].id);
    } else {
      setSelectedSectionId('');
    }
  };

  const handleSectionChange = (sectionId) => {
    setSelectedSectionId(sectionId);
  };

  // ── CRUD Actions ──

  // Create Submit
  const handleCreateSubmit = (formData) => {
    setIsSubmitting(true);
    
    setTimeout(() => {
      const newExam = {
        id: `ex${Date.now()}`,
        ...formData,
        subjectId: selectedSubjectId,
        subjectCode: activeSubject?.code || 'SUB',
        subjectName: activeSubject?.name || 'Subject',
        // Map sectionIds back to display names for tags
        sectionNames: formData.sectionIds.map(
          id => sectionsForSubject.find(s => s.id === id)?.name || id
        ),
        isResultPublished: false,
        status: 'PUBLISHED', // Defaults to published/scheduled state
        createdAt: new Date().toISOString(),
      };

      setExams(prev => [newExam, ...prev]);
      setIsSubmitting(false);
      setIsCreateOpen(false);
      showToast('Exam scheduled and published successfully!');
    }, 600); // Simulate network lag
  };

  // Edit Submit
  const handleEditSubmit = (formData) => {
    setIsSubmitting(true);

    setTimeout(() => {
      setExams(prev =>
        prev.map(ex =>
          ex.id === editingExam.id
            ? {
                ...ex,
                ...formData,
                // Update names mapping
                sectionNames: formData.sectionIds.map(
                  id => sectionsForSubject.find(s => s.id === id)?.name || id
                ),
              }
            : ex
        )
      );
      setIsSubmitting(false);
      setEditingExam(null);
      showToast('Exam schedule updated successfully!');
    }, 600);
  };

  // Publish Schedule (if previously Draft)
  const handlePublish = (id) => {
    setExams(prev =>
      prev.map(ex => (ex.id === id ? { ...ex, status: 'PUBLISHED' } : ex))
    );
    showToast('Exam schedule published to students!');
  };

  // Archive Exam
  const handleArchive = (id) => {
    setExams(prev =>
      prev.map(ex => (ex.id === id ? { ...ex, status: 'ARCHIVED' } : ex))
    );
    showToast('Exam archived successfully!');
  };

  // Toggle Results Publication
  const handleToggleResultsPublish = (id, currentStatus) => {
    setExams(prev =>
      prev.map(ex => (ex.id === id ? { ...ex, isResultPublished: !currentStatus } : ex))
    );
    showToast(
      currentStatus ? 'Exam results hidden from students.' : 'Exam results published successfully!'
    );
  };

  // Delete Exam
  const handleDelete = (id) => {
    setExams(prev => prev.filter(ex => ex.id !== id));
    showToast('Exam schedule deleted successfully!', 'warning');
  };

  // Grade Exam Trigger (Placeholder)
  const handleEnterMarks = (id) => {
    const target = exams.find(ex => ex.id === id);
    showToast(`Entering marks for: ${target?.title}`, 'info');
    // Future: redirect to Marks entry module page for this examId
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* ── Page Header ── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
          mb: 4,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
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
              Manage Exams
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Schedule theory or practical exams, manage room allocations, and publish results
            </Typography>
          </Box>
        </Box>

        {/* Create Exam Button */}
        {isClassSelected && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setIsCreateOpen(true)}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              px: 3.5,
              py: 1.2,
              bgcolor: '#4f46e5',
              '&:hover': { bgcolor: '#4338ca' },
            }}
          >
            Schedule Exam
          </Button>
        )}
      </Box>

      {/* ── Filters Grid ── */}
      <ExamFilters
        subjects={mockAttendanceSubjects}
        selectedSubjectId={selectedSubjectId}
        onSubjectChange={handleSubjectChange}
        sections={sectionsForSubject}
        selectedSectionId={selectedSectionId}
        onSectionChange={handleSectionChange}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
      />

      {/* ── Main Content List Grid ── */}
      {isClassSelected ? (
        <ExamList
          exams={filteredExams}
          statusFilter={statusFilter}
          onEdit={setEditingExam}
          onDelete={handleDelete}
          onPublish={handlePublish}
          onArchive={handleArchive}
          onToggleResultsPublish={handleToggleResultsPublish}
          onEnterMarks={handleEnterMarks}
          onCreateNew={() => setIsCreateOpen(true)}
        />
      ) : (
        /* Empty State selection prompt */
        <Paper
          variant="outlined"
          sx={{
            p: 4,
            textAlign: 'center',
            borderRadius: 3,
            bgcolor: 'background.paper',
          }}
        >
          <Typography variant="body1" color="text.secondary">
            {!selectedSubjectId
              ? 'Please select a subject to begin.'
              : 'Please select a section to load exams.'}
          </Typography>
        </Paper>
      )}

      {/* ── Create Dialog Modal ── */}
      <CreateExamDialog
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        availableSections={sectionsForSubject}
        onSubmit={handleCreateSubmit}
        isSubmitting={isSubmitting}
      />

      {/* ── Edit Dialog Modal ── */}
      <EditExamDialog
        open={!!editingExam}
        onClose={() => setEditingExam(null)}
        exam={editingExam}
        availableSections={sectionsForSubject}
        onSubmit={handleEditSubmit}
        isSubmitting={isSubmitting}
      />

      {/* ── Feedback Toast ── */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setToast(prev => ({ ...prev, open: false }))}
          severity={toast.severity}
          variant="filled"
          sx={{ fontWeight: 600 }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ExamPage;
