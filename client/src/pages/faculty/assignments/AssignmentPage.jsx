// client/src/pages/faculty/assignments/AssignmentPage.jsx
//
// Container page orchestrating the Faculty Assignments Module.
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

// Reusable components
import AssignmentFilters from './components/AssignmentFilters';
import AssignmentList from './components/AssignmentList';
import CreateAssignmentDialog from './components/CreateAssignmentDialog';
import EditAssignmentDialog from './components/EditAssignmentDialog';

// Data sources
import { mockAssignments } from './mockData';
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

export const AssignmentPage = () => {
  const navigate = useNavigate();

  // ══════════════════════════════════════════════════════════
  // STATE MANAGEMENT
  // ══════════════════════════════════════════════════════════
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [assignments, setAssignments] = useState(mockAssignments);

  // Dialog States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);

  // UX Feedback States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  // ══════════════════════════════════════════════════════════
  // DERIVED DATA
  // ══════════════════════════════════════════════════════════
  
  // Sections available for the selected subject
  const sectionsForSubject = SUBJECT_SECTIONS[selectedSubjectId] || [];

  // Currently selected subject details (used for mapping metadata when creating)
  const activeSubject = mockAttendanceSubjects.find(s => s.id === selectedSubjectId);

  // Filtered Assignments List
  const filteredAssignments = useMemo(() => {
    if (!selectedSubjectId || !selectedSectionId) return [];

    return assignments.filter((asg) => {
      // 1. Subject match
      const subjectMatch = asg.subjectId === selectedSubjectId;
      
      // 2. Section match (an assignment can be assigned to multiple sections)
      const sectionMatch = asg.sectionIds.includes(selectedSectionId);

      // 3. Status filter match
      const statusMatch = statusFilter === 'ALL' || asg.status === statusFilter;

      // 4. Search query match
      const query = searchQuery.toLowerCase().trim();
      const searchMatch =
        !query ||
        asg.title.toLowerCase().includes(query) ||
        asg.description.toLowerCase().includes(query);

      return subjectMatch && sectionMatch && statusMatch && searchMatch;
    });
  }, [assignments, selectedSubjectId, selectedSectionId, statusFilter, searchQuery]);

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
      const newAssignment = {
        id: `asg${Date.now()}`,
        ...formData,
        subjectId: selectedSubjectId,
        subjectCode: activeSubject?.code || 'SUB',
        subjectName: activeSubject?.name || 'Subject',
        // Map sectionIds back to display names for presentational tags
        sectionNames: formData.sectionIds.map(
          id => sectionsForSubject.find(s => s.id === id)?.name || id
        ),
        status: 'PUBLISHED', // Defaults to active published state
        createdAt: new Date().toISOString(),
      };

      setAssignments(prev => [newAssignment, ...prev]);
      setIsSubmitting(false);
      setIsCreateOpen(false);
      showToast('Assignment created and published successfully!');
    }, 600); // Simulate network lag
  };

  // Edit Submit
  const handleEditSubmit = (formData) => {
    setIsSubmitting(true);

    setTimeout(() => {
      setAssignments(prev =>
        prev.map(asg =>
          asg.id === editingAssignment.id
            ? {
                ...asg,
                ...formData,
                // Update names mapping
                sectionNames: formData.sectionIds.map(
                  id => sectionsForSubject.find(s => s.id === id)?.name || id
                ),
              }
            : asg
        )
      );
      setIsSubmitting(false);
      setEditingAssignment(null);
      showToast('Assignment updated successfully!');
    }, 600);
  };

  // Publish Draft
  const handlePublish = (id) => {
    setAssignments(prev =>
      prev.map(asg => (asg.id === id ? { ...asg, status: 'PUBLISHED' } : asg))
    );
    showToast('Assignment published successfully!');
  };

  // Archive Assignment
  const handleArchive = (id) => {
    setAssignments(prev =>
      prev.map(asg => (asg.id === id ? { ...asg, status: 'ARCHIVED' } : asg))
    );
    showToast('Assignment archived successfully!');
  };

  // Delete Assignment
  const handleDelete = (id) => {
    setAssignments(prev => prev.filter(asg => asg.id !== id));
    showToast('Assignment deleted successfully!', 'warning');
  };

  // Grade Submissions Trigger (Placeholder for now)
  const handleGradeSubmissions = (id) => {
    const target = assignments.find(asg => asg.id === id);
    showToast(`Grading submissions for: ${target?.title}`, 'info');
    // Future: open grading view or review table
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
              Manage Assignments
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create assignments, track due dates, and grade student submissions
            </Typography>
          </Box>
        </Box>

        {/* Create Assignment Button (Visible only when section is selected) */}
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
            Create Assignment
          </Button>
        )}
      </Box>

      {/* ── Filters Grid (Subjects, Sections, Tabs, Search) ── */}
      <AssignmentFilters
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
        <AssignmentList
          assignments={filteredAssignments}
          statusFilter={statusFilter}
          onEdit={setEditingAssignment}
          onDelete={handleDelete}
          onPublish={handlePublish}
          onArchive={handleArchive}
          onView={handleGradeSubmissions}
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
              : 'Please select a section to load assignments.'}
          </Typography>
        </Paper>
      )}

      {/* ── Create Dialog Modal ── */}
      <CreateAssignmentDialog
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        availableSections={sectionsForSubject}
        onSubmit={handleCreateSubmit}
        isSubmitting={isSubmitting}
      />

      {/* ── Edit Dialog Modal ── */}
      <EditAssignmentDialog
        open={!!editingAssignment}
        onClose={() => setEditingAssignment(null)}
        assignment={editingAssignment}
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

export default AssignmentPage;
