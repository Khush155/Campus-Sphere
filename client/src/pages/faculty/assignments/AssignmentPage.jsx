/* eslint-disable */
import React, { useState, useMemo, useEffect } from 'react';
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
import EditAssignmentDialog from './components/EditAssignmentDialog';

// Backend hooks
import {
  useFacultyDashboardQuery,
  useFacultyAssignmentsQuery,
  useCreateFacultyAssignmentMutation,
  useUpdateFacultyAssignmentMutation,
  useUpdateFacultyAssignmentStatusMutation,
  useDeleteFacultyAssignmentMutation,
} from '../../../queries/facultyQueries';

export const AssignmentPage = () => {
  const navigate = useNavigate();

  // State Management
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
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

  // Dynamic sections per subject
  const sectionsForSubject = useMemo(() => [
    { id: 'ALL', name: 'All Sections (Whole Class)', strength: 'All' },
    { id: 'A', name: 'Group / Section A', strength: 'Sec A' },
    { id: 'B', name: 'Group / Section B', strength: 'Sec B' },
  ], []);

  // 2. Fetch homework assignments from MongoDB
  const { data: rawAssignments = [], isLoading: isAssignmentsLoading } = useFacultyAssignmentsQuery({
    subjectId: selectedSubjectId || undefined,
    group: selectedSectionId !== 'ALL' ? selectedSectionId : undefined,
  });

  const createAssignmentMutation = useCreateFacultyAssignmentMutation();
  const updateAssignmentMutation = useUpdateFacultyAssignmentMutation();
  const updateStatusMutation = useUpdateFacultyAssignmentStatusMutation();
  const deleteAssignmentMutation = useDeleteFacultyAssignmentMutation();

  // Map backend assignments to UI format
  const assignments = useMemo(() => {
    return rawAssignments.map((asg) => {
      const isPastDue = asg.dueDate && new Date(asg.dueDate) < new Date();
      const derivedStatus = asg.status || (isPastDue ? 'CLOSED' : 'PUBLISHED');

      return {
        id: asg._id,
        _raw: asg,
        title: asg.title,
        description: asg.description,
        subjectId: asg.subjectId?._id || asg.subjectId,
        subjectCode: asg.subjectId?.code || currentSubject?.code || 'CS301',
        subjectName: asg.subjectId?.name || currentSubject?.name || 'Subject',
        sectionIds: [asg.group || 'ALL'],
        sectionNames: [asg.group === 'ALL' ? 'All Sections' : `Section ${asg.group || 'All'}`],
        dueDate: asg.dueDate,
        maxMarks: asg.maxMarks,
        status: derivedStatus,
        createdAt: asg.createdAt,
      };
    });
  }, [rawAssignments, currentSubject]);

  // Filtered Assignments List
  const filteredAssignments = useMemo(() => {
    return assignments.filter((asg) => {
      const statusMatch = statusFilter === 'ALL' || asg.status === statusFilter;
      const query = searchQuery.toLowerCase().trim();
      const searchMatch =
        !query ||
        asg.title.toLowerCase().includes(query) ||
        asg.description.toLowerCase().includes(query);

      return statusMatch && searchMatch;
    });
  }, [assignments, statusFilter, searchQuery]);

  const isClassSelected = !!selectedSubjectId;

  const showToast = (message, severity = 'success') => {
    setToast({ open: true, message, severity });
  };

  const handleSubjectChange = (subjectId) => {
    setSelectedSubjectId(subjectId);
    setSelectedSectionId('ALL');
  };

  const handleSectionChange = (sectionId) => {
    setSelectedSectionId(sectionId);
  };

  // Create Submit (Draft or Publish)
  const handleCreateSubmit = (formData) => {
    const targetGroups = formData.sectionIds && formData.sectionIds.length > 0 ? formData.sectionIds : ['ALL'];
    const targetGroup = targetGroups[0] || 'ALL';

    const payload = {
      title: formData.title,
      description: formData.description,
      subjectId: selectedSubjectId,
      semester: currentSubject?.semester || 1,
      group: targetGroup,
      dueDate: formData.dueDate,
      maxMarks: parseInt(formData.maxMarks, 10),
      status: formData.status || 'PUBLISHED',
    };

    createAssignmentMutation.mutate(payload, {
      onSuccess: (data) => {
        setIsCreateOpen(false);
        showToast(
          payload.status === 'DRAFT'
            ? 'Assignment saved as Draft!'
            : 'Assignment published successfully!'
        );
      },
      onError: (err) => {
        showToast(`Creation failed: ${err.response?.data?.message || err.message}`, 'error');
      },
    });
  };

  // Edit Handlers
  const handleEditOpen = (assignment) => {
    setEditingAssignment(assignment);
    setIsEditOpen(true);
  };

  const handleEditSubmit = (formData) => {
    if (!editingAssignment) return;

    const targetGroups = formData.sectionIds && formData.sectionIds.length > 0 ? formData.sectionIds : ['ALL'];
    const targetGroup = targetGroups[0] || 'ALL';

    const payload = {
      title: formData.title,
      description: formData.description,
      dueDate: formData.dueDate,
      maxMarks: parseInt(formData.maxMarks, 10),
      group: targetGroup,
      status: formData.status || editingAssignment.status,
    };

    updateAssignmentMutation.mutate(
      { id: editingAssignment.id, data: payload },
      {
        onSuccess: () => {
          setIsEditOpen(false);
          setEditingAssignment(null);
          showToast('Assignment updated successfully!');
        },
        onError: (err) => {
          showToast(`Update failed: ${err.response?.data?.message || err.message}`, 'error');
        },
      }
    );
  };

  // Status Actions (Publish, Close, Archive)
  const handleStatusChange = (id, newStatus) => {
    updateStatusMutation.mutate(
      { id, status: newStatus },
      {
        onSuccess: () => {
          showToast(`Assignment status changed to ${newStatus}!`);
        },
        onError: (err) => {
          showToast(`Status update failed: ${err.response?.data?.message || err.message}`, 'error');
        },
      }
    );
  };

  // Delete Assignment
  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      deleteAssignmentMutation.mutate(id, {
        onSuccess: () => {
          showToast('Assignment deleted successfully!', 'warning');
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
    <Box sx={{ flexGrow: 1, p: { xs: 1, sm: 3 } }}>
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
              Create drafts, publish assignments, set due dates, and track student submissions
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
              borderRadius: 2,
              bgcolor: 'primary.main',
              '&:hover': { bgcolor: 'primary.dark' },
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
            onEdit={handleEditOpen}
            onDelete={handleDelete}
            onPublish={(id) => handleStatusChange(id, 'PUBLISHED')}
            onCloseAssignment={(id) => handleStatusChange(id, 'CLOSED')}
            onArchive={(id) => handleStatusChange(id, 'ARCHIVED')}
            onView={(_id) => showToast(`Submissions for this assignment are actively being tracked.`)}
            onCreateNew={() => setIsCreateOpen(true)}
          />
        )
      ) : (
        /* Empty State selection prompt */
        <Paper
          variant="outlined"
          sx={{
            p: 6,
            textAlign: 'center',
            borderRadius: 3,
            bgcolor: 'background.paper',
          }}
        >
          <Typography variant="body1" color="text.secondary">
            Select a subject to view and manage assignments.
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

      {/* ── Edit Dialog Modal ── */}
      {isEditOpen && editingAssignment && (
        <EditAssignmentDialog
          open={isEditOpen}
          onClose={() => {
            setIsEditOpen(false);
            setEditingAssignment(null);
          }}
          assignment={editingAssignment}
          availableSections={sectionsForSubject}
          onSubmit={handleEditSubmit}
          isSubmitting={updateAssignmentMutation.isPending}
        />
      )}

      {/* ── Feedback Toast ── */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          severity={toast.severity}
          variant="filled"
          sx={{ fontWeight: 600, borderRadius: 2 }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AssignmentPage;
