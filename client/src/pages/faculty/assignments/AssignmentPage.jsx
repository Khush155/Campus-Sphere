import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Grid,
  Card,
  Chip,
  useTheme,
  Avatar,
} from '@mui/material';
import {
  Add as AddIcon,
  AssignmentOutlined,
  CheckCircleOutlined,
  DraftsOutlined,
  TimerOffOutlined,
} from '@mui/icons-material';

// Reusable components
import AssignmentFilters from './components/AssignmentFilters';
import AssignmentList from './components/AssignmentList';
import CreateAssignmentDialog from './components/CreateAssignmentDialog';
import EditAssignmentDialog from './components/EditAssignmentDialog';
import ConfirmDeleteModal from '../../../components/common/ConfirmDeleteModal';

// Backend hooks
import {
  useFacultyDashboardQuery,
  useFacultyAssignmentsQuery,
  useCreateFacultyAssignmentMutation,
  useUpdateFacultyAssignmentMutation,
  useUpdateFacultyAssignmentStatusMutation,
  useDeleteFacultyAssignmentMutation,
} from '../../../queries/facultyQueries';
import { useToast } from '../../../contexts/ToastContext';

export const AssignmentPage = () => {
  const theme = useTheme();
  const { showToast } = useToast();

  // State Management
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

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

  // KPI Statistics
  const stats = useMemo(() => {
    const total = assignments.length;
    const published = assignments.filter((a) => a.status === 'PUBLISHED').length;
    const drafts = assignments.filter((a) => a.status === 'DRAFT').length;
    const closed = assignments.filter((a) => a.status === 'CLOSED' || a.status === 'ARCHIVED').length;
    return { total, published, drafts, closed };
  }, [assignments]);

  const isClassSelected = !!selectedSubjectId;

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
      onSuccess: () => {
        setIsCreateOpen(false);
        showToast(
          payload.status === 'DRAFT'
            ? 'Assignment saved as Draft!'
            : 'Assignment published successfully!'
        );
      },
      onError: (err) => {
        showToast(`Creation failed: ${err.response?.data?.message || err.message}`, { severity: 'error' });
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
          showToast(`Update failed: ${err.response?.data?.message || err.message}`, { severity: 'error' });
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
          showToast(`Assignment status updated to ${newStatus}!`);
        },
        onError: (err) => {
          showToast(`Status update failed: ${err.response?.data?.message || err.message}`, { severity: 'error' });
        },
      }
    );
  };

  // Delete Assignment
  const handleDeleteConfirm = () => {
    if (!deleteTargetId) return;
    deleteAssignmentMutation.mutate(deleteTargetId, {
      onSuccess: () => {
        showToast('Assignment deleted successfully!');
        setDeleteTargetId(null);
      },
      onError: (err) => {
        showToast(`Deletion failed: ${err.response?.data?.message || err.message}`, { severity: 'error' });
        setDeleteTargetId(null);
      },
    });
  };

  if (isDashboardLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={36} />
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
                icon={<AssignmentOutlined sx={{ fontSize: '0.9rem !important', color: `${theme.palette.primary.main} !important` }} />}
                label="FACULTY STUDENT ASSIGNMENT & COURSEWORK DESK"
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
              Student Assignment & Coursework Hub
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
              Create homework assignments, publish project briefs, configure submission deadlines &amp; maximum marks, and monitor student submission status.
            </Typography>
          </Box>

          {isClassSelected && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setIsCreateOpen(true)}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 700,
                background: theme.palette.primary.gradient || theme.palette.primary.main,
                color: '#ffffff',
              }}
            >
              Create New Assignment
            </Button>
          )}
        </Box>
      </Card>

      {/* ── 2. KPI Summary Grid (Faculty Roster Style) ────────────────────── */}
      <Grid container spacing={2.5}>
        {/* 1. Total Assignments Card */}
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
                  TOTAL ASSIGNMENTS
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
                  {stats.total}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: `${theme.palette.primary.main}15`, color: theme.palette.primary.main }}>
                <AssignmentOutlined />
              </Avatar>
            </Box>
          </Card>
        </Grid>

        {/* 2. Active Published Card */}
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
                  ACTIVE PUBLISHED
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
                  {stats.published}
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

        {/* 3. Drafts In Progress Card */}
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
                  DRAFTS IN PROGRESS
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
                  {stats.drafts}
                </Typography>
              </Box>
              <Avatar
                sx={{
                  bgcolor: `${theme.palette.info?.main || '#3b82f6'}15`,
                  color: theme.palette.info?.main || '#3b82f6',
                }}
              >
                <DraftsOutlined />
              </Avatar>
            </Box>
          </Card>
        </Grid>

        {/* 4. Closed / Expired Card */}
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
                  CLOSED / EXPIRED
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
                  {stats.closed}
                </Typography>
              </Box>
              <Avatar
                sx={{
                  bgcolor: `${theme.palette.signal?.error || '#ef4444'}15`,
                  color: theme.palette.signal?.error || '#ef4444',
                }}
              >
                <TimerOffOutlined />
              </Avatar>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* ── 3. Filters Control Bar ────────────────────────────────────────── */}
      <Card sx={{ p: 3, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
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
      </Card>

      {/* ── 4. Main Content List Grid ──────────────────────────────────────── */}
      {isClassSelected ? (
        isAssignmentsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={32} />
          </Box>
        ) : (
          <AssignmentList
            assignments={filteredAssignments}
            statusFilter={statusFilter}
            onEdit={handleEditOpen}
            onDelete={(id) => setDeleteTargetId(id)}
            onPublish={(id) => handleStatusChange(id, 'PUBLISHED')}
            onCloseAssignment={(id) => handleStatusChange(id, 'CLOSED')}
            onArchive={(id) => handleStatusChange(id, 'ARCHIVED')}
            onView={() => showToast(`Submissions for this assignment are actively being tracked.`)}
            onCreateNew={() => setIsCreateOpen(true)}
          />
        )
      ) : (
        <Paper
          variant="outlined"
          sx={{
            p: 6,
            textAlign: 'center',
            borderRadius: '16px',
            bgcolor: 'background.paper',
          }}
        >
          <Typography variant="body1" color="text.secondary">
            Select a subject to view and manage assignments.
          </Typography>
        </Paper>
      )}

      {/* ── 5. Create Dialog Modal ── */}
      {isClassSelected && (
        <CreateAssignmentDialog
          open={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          availableSections={sectionsForSubject}
          onSubmit={handleCreateSubmit}
          isSubmitting={createAssignmentMutation.isPending}
        />
      )}

      {/* ── 6. Edit Dialog Modal ── */}
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

      {/* ── 7. Confirm Delete Modal ── */}
      <ConfirmDeleteModal
        open={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Coursework Assignment?"
        description="Are you sure you want to delete this assignment? Students will no longer be able to submit solutions for this coursework."
        isLoading={deleteAssignmentMutation.isPending}
      />
    </Box>
  );
};

export default AssignmentPage;
