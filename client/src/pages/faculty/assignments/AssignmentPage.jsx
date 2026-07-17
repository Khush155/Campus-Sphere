// client/src/pages/faculty/assignments/AssignmentPage.jsx
//
// Container page orchestrating the Faculty Assignments Module with backend integration.

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

// Import backend hooks
import {
  useFacultyDashboardQuery,
  useFacultyAssignmentsQuery,
  useCreateFacultyAssignmentMutation,
  useDeleteFacultyAssignmentMutation,
} from '../../../queries/facultyQueries';

export const AssignmentPage = () => {
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

  // 2. Fetch homework assignments from MongoDB
  const { data: rawAssignments = [], isLoading: isAssignmentsLoading } = useFacultyAssignmentsQuery({
    subjectId: selectedSubjectId || undefined,
    group: selectedSectionId || undefined,
  });

  const createAssignmentMutation = useCreateFacultyAssignmentMutation();
  const deleteAssignmentMutation = useDeleteFacultyAssignmentMutation();

  // Map backend assignments to UI format expectations
  const assignments = useMemo(() => {
    return rawAssignments.map((asg) => ({
      id: asg._id,
      title: asg.title,
      description: asg.description,
      subjectId: asg.subjectId?._id || asg.subjectId,
      subjectCode: asg.subjectId?.code || 'CS301',
      subjectName: asg.subjectId?.name || 'DSA',
      sectionIds: [asg.group],
      sectionNames: [asg.group],
      dueDate: asg.dueDate,
      maxMarks: asg.maxMarks,
      status: 'PUBLISHED',
      createdAt: asg.createdAt,
    }));
  }, [rawAssignments]);

  // Filtered Assignments List
  const filteredAssignments = useMemo(() => {
    if (!selectedSubjectId || !selectedSectionId) return [];

    return assignments.filter((asg) => {
      const statusMatch = statusFilter === 'ALL' || asg.status === statusFilter;
      const query = searchQuery.toLowerCase().trim();
      const searchMatch =
        !query ||
        asg.title.toLowerCase().includes(query) ||
        asg.description.toLowerCase().includes(query);

      return statusMatch && searchMatch;
    });
  }, [assignments, selectedSubjectId, selectedSectionId, statusFilter, searchQuery]);

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

  // Create Submit
  const handleCreateSubmit = (formData) => {
    const payload = {
      title: formData.title,
      description: formData.description,
      subjectId: selectedSubjectId,
      semester: 3, // Default for seeded students
      group: selectedSectionId,
      dueDate: formData.dueDate,
      maxMarks: parseInt(formData.maxMarks, 10),
    };

    createAssignmentMutation.mutate(payload, {
      onSuccess: () => {
        setIsCreateOpen(false);
        showToast('Assignment created successfully in MongoDB!');
      },
      onError: (err) => {
        showToast(`Creation failed: ${err.response?.data?.message || err.message}`, 'error');
      },
    });
  };

  // Delete Assignment
  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      deleteAssignmentMutation.mutate(id, {
        onSuccess: () => {
          showToast('Assignment deleted successfully from MongoDB!', 'warning');
        },
        onError: (err) => {
          showToast(`Deletion failed: ${err.response?.data?.message || err.message}`, 'error');
        },
      });
    }
  };

  if (isDashboardLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Format subjects list for selector
  const filterSubjects = assignedSubjects.map((sub) => ({
    id: sub.id,
    name: sub.name,
    code: sub.code,
  }));

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* ── Page Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 4 }}>
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
              Manage Assignments
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create assignments, track due dates, and grade student submissions
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

      {/* ── Filters Grid ── */}
      <AssignmentFilters
        subjects={filterSubjects}
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
        isAssignmentsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <AssignmentList
            assignments={filteredAssignments}
            statusFilter={statusFilter}
            onEdit={() => alert('Editing assignments is restricted to super admins.')}
            onDelete={handleDelete}
            onPublish={() => {}}
            onArchive={() => {}}
            onView={(_id) => showToast(`Submissions for this homework are currently being graded.`)}
            onCreateNew={() => setIsCreateOpen(true)}
          />
        )
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
      {isClassSelected && (
        <CreateAssignmentDialog
          open={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          availableSections={sectionsForSubject}
          onSubmit={handleCreateSubmit}
          isSubmitting={createAssignmentMutation.isPending}
        />
      )}

      {/* ── Feedback Toast ── */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
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
