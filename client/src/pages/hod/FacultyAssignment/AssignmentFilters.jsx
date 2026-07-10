import React, { useMemo } from 'react';
import { Box, TextField, MenuItem, Grid, useTheme } from '@mui/material';
import { useBranchesQuery } from '../../../queries/collegeQueries';
import { useAuth } from '../../../contexts/AuthContext';

const AssignmentFilters = ({ filters, onFilterChange }) => {
  const theme = useTheme();
  const { user } = useAuth();
  
  // We can fetch branches for the HOD's department
  // Assume useCollegeMetadata or useBranchesQuery fetches branches for a dept.
  // We'll just mock this or use useSubjectsQuery to extract branches if useCollegeMetadata is complex.
  // Actually, we'll just fetch all branches and filter them client-side if needed, 
  // or pass courseId. For now, let's keep it simple.
  
  const { data: branchesData } = useBranchesQuery();
  const branches = branchesData || [];

  const handleBranchChange = (e) => {
    onFilterChange({ ...filters, branchId: e.target.value, semester: '' });
  };

  const handleSemesterChange = (e) => {
    onFilterChange({ ...filters, semester: e.target.value });
  };

  const selectedBranch = branches.find(b => b.id === filters.branchId || b._id === filters.branchId);
  const durationYears = selectedBranch?.courseId?.durationYears || 4; // Fallback to 4
  const maxSemesters = durationYears * 2;
  const semesterOptions = Array.from({ length: maxSemesters }, (_, i) => i + 1);

  return (
    <Box sx={{ p: 2, mb: 3, borderRadius: '12px', bgcolor: 'rgba(28, 46, 69, 0.02)', border: `1px solid ${theme.palette.divider}` }}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <TextField
            select
            fullWidth
            size="small"
            label="Filter by Branch"
            value={filters.branchId || ''}
            onChange={handleBranchChange}
            sx={{ bgcolor: 'background.paper' }}
          >
            <MenuItem value="">
              <em>All Branches</em>
            </MenuItem>
            {branches.map(b => (
              <MenuItem key={b.id || b._id} value={b.id || b._id}>
                {b.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <TextField
            select
            fullWidth
            size="small"
            label="Filter by Semester"
            value={filters.semester || ''}
            onChange={handleSemesterChange}
            disabled={!filters.branchId}
            sx={{ bgcolor: 'background.paper' }}
          >
            <MenuItem value="">
              <em>All Semesters</em>
            </MenuItem>
            {semesterOptions.map(sem => (
              <MenuItem key={sem} value={sem}>
                Semester {sem}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={4}>
          <TextField
            select
            fullWidth
            size="small"
            label="Assignment Status"
            value={filters.status || ''}
            onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
            sx={{ bgcolor: 'background.paper' }}
          >
            <MenuItem value="">
              <em>All Statuses</em>
            </MenuItem>
            <MenuItem value="ACTIVE">Active</MenuItem>
            <MenuItem value="REVOKED">Revoked</MenuItem>
          </TextField>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AssignmentFilters;
