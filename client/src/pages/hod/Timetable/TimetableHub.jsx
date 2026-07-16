import React, { useState } from 'react';
import { Box, Typography, Paper, Alert, Button, CircularProgress, useTheme } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import RosterFilters from '../Roster/RosterFilters';
import TimetableGrid from './TimetableGrid';
import AddSlotModal from './AddSlotModal';
import { useTimetableQuery, useAutoGenerateTimetableMutation } from '../../../queries/timetableQueries';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

const TimetableHub = () => {
  const theme = useTheme();
  const [filters, setFilters] = useState({
    course: '',
    branch: '',
    semester: '',
    group: '',
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAutoGenerateConfirmOpen, setIsAutoGenerateConfirmOpen] = useState(false);
  const [generateError, setGenerateError] = useState(null);

  // We only fetch timetable if course, branch, and semester are selected
  const isBatchSelected = !!(filters.course && filters.branch && filters.semester);
  
  const { data: slots, isLoading, isError, error } = useTimetableQuery(filters);
  const autoGenerateMutation = useAutoGenerateTimetableMutation();

  const handleAutoGenerate = async () => {
    setGenerateError(null);
    try {
      await autoGenerateMutation.mutateAsync({
        courseId: filters.course,
        branchId: filters.branch,
        semester: Number(filters.semester),
        group: filters.group || null,
      });
      setIsAutoGenerateConfirmOpen(false);
    } catch (err) {
      setGenerateError(err.response?.data?.message || 'Failed to generate timetable');
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 1, sm: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: theme.palette.text.primary }}>
            Timetable Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Select a specific student batch to view and manage their weekly schedule.
          </Typography>
        </Box>
        
        {isBatchSelected && (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<AutoAwesomeIcon />}
              onClick={() => setIsAutoGenerateConfirmOpen(true)}
              sx={{ borderRadius: 2, textTransform: 'none', px: 3 }}
            >
              Smart Generate
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setIsAddModalOpen(true)}
              sx={{ borderRadius: 2, textTransform: 'none', px: 3 }}
            >
              Add Slot
            </Button>
          </Box>
        )}
      </Box>

      <Paper sx={{ p: 3, mb: 4, borderRadius: 3, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: 1 }}>
          Select Batch
        </Typography>
        <RosterFilters filters={filters} onFilterChange={setFilters} role="STUDENT" />
      </Paper>

      {!isBatchSelected ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: `1px dashed ${theme.palette.divider}`, boxShadow: 'none', bgcolor: 'transparent' }}>
          <Typography color="text.secondary">
            Please select a Course, Branch, and Semester to view the timetable.
          </Typography>
        </Paper>
      ) : isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : isError ? (
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {error?.response?.data?.message || 'Failed to load timetable'}
        </Alert>
      ) : (
        <TimetableGrid slots={slots || []} filters={filters} />
      )}

      {isAddModalOpen && (
        <AddSlotModal
          open={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          filters={filters}
          existingSlots={slots || []}
        />
      )}

      {/* Auto-Generate Confirmation Modal */}
      {isAutoGenerateConfirmOpen && (
        <Paper 
          sx={{ 
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', 
            zIndex: 1300, p: 4, width: 400, borderRadius: 3, border: `1px solid ${theme.palette.divider}`,
            boxShadow: theme.shadows[10] 
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Confirm Smart Generation</Typography>
          <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
            This will wipe the current timetable for this batch and auto-generate a new one using the conflict engine. Are you sure you want to proceed?
          </Typography>
          {generateError && <Alert severity="error" sx={{ mb: 3 }}>{generateError}</Alert>}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button color="inherit" onClick={() => setIsAutoGenerateConfirmOpen(false)}>Cancel</Button>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleAutoGenerate}
              disabled={autoGenerateMutation.isPending}
            >
              {autoGenerateMutation.isPending ? 'Generating...' : 'Generate Now'}
            </Button>
          </Box>
        </Paper>
      )}
      {/* Background Overlay for Confirmation */}
      {isAutoGenerateConfirmOpen && (
        <Box 
          sx={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, bgcolor: 'rgba(0,0,0,0.5)', zIndex: 1299 }} 
          onClick={() => setIsAutoGenerateConfirmOpen(false)} 
        />
      )}
    </Box>
  );
};

export default TimetableHub;
