import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Skeleton,
  useTheme,
} from '@mui/material';
import { useBranchesQuery } from '../../../queries/collegeQueries';
import { useFacultyAssignments } from '../../../queries/facultyAssignmentQueries';
import AssignFacultyDrawer from './AssignFacultyDrawer';
import { useAuth } from '../../../contexts/AuthContext';

export const AssignmentHub = ({ departmentId: propDepartmentId }) => {
  const theme = useTheme();
  const { user } = useAuth();
  
  const departmentId = propDepartmentId || user?.departmentId;
  
  // State
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('2025-26');
  const [selectedSemester, setSelectedSemester] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  
  // Queries
  const { data: branches, isLoading: branchesLoading } = useBranchesQuery();
  const { data: assignments, isLoading: assignmentsLoading } = useFacultyAssignments(selectedBranch, {
    academicYear: selectedAcademicYear,
    semester: selectedSemester,
  });

  const deptBranches = branches?.filter(b => b.departmentId === departmentId) || [];

  const handleAssignClick = (subject, existingAssignment) => {
    setSelectedSubject({ subject, existingAssignment });
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setSelectedSubject(null);
  };

  return (
    <Box>
      {/* Filter Bar */}
      <Card sx={{ p: 3, mb: 4, borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Branch</InputLabel>
              <Select
                value={selectedBranch}
                label="Branch"
                onChange={(e) => setSelectedBranch(e.target.value)}
                disabled={branchesLoading}
              >
                {deptBranches.map((branch) => (
                  <MenuItem key={branch.id} value={branch.id}>
                    {branch.name} ({branch.code})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Academic Year</InputLabel>
              <Select
                value={selectedAcademicYear}
                label="Academic Year"
                onChange={(e) => setSelectedAcademicYear(e.target.value)}
              >
                <MenuItem value="2025-26">2025-26</MenuItem>
                <MenuItem value="2026-27">2026-27</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Semester</InputLabel>
              <Select
                value={selectedSemester}
                label="Semester"
                onChange={(e) => setSelectedSemester(e.target.value)}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                  <MenuItem key={sem} value={sem}>Semester {sem}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Card>

      {/* Assignments Table */}
      <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: theme.custom?.surface?.raised || 'rgba(0,0,0,0.02)' }}>
                <TableCell sx={{ fontWeight: 600 }}>Subject</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Credits</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Assigned Faculty</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!selectedBranch ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    Please select a branch to view subjects.
                  </TableCell>
                </TableRow>
              ) : assignmentsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton width="60%" /></TableCell>
                    <TableCell><Skeleton width="40%" /></TableCell>
                    <TableCell><Skeleton width="20%" /></TableCell>
                    <TableCell><Skeleton width="80%" /></TableCell>
                    <TableCell align="right"><Skeleton width="100px" sx={{ ml: 'auto' }} /></TableCell>
                  </TableRow>
                ))
              ) : assignments?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No active assignments for this selection. Note: Subject creation integration is mocked here if empty.
                  </TableCell>
                </TableRow>
              ) : (
                assignments?.map((assignment) => (
                  <TableRow key={assignment._id}>
                    <TableCell>
                      <Typography sx={{ fontWeight: 600 }}>{assignment.subjectId?.name}</Typography>
                      <Typography variant="body2" color="text.secondary">{assignment.subjectId?.code}</Typography>
                    </TableCell>
                    <TableCell>{assignment.subjectId?.type}</TableCell>
                    <TableCell>{assignment.subjectId?.credits}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={assignment.facultyId?.name}
                          size="small"
                          sx={{ 
                            fontWeight: 600,
                            bgcolor: theme.palette.signal?.success ? `${theme.palette.signal.success}15` : 'rgba(16, 185, 129, 0.15)',
                            color: theme.palette.signal?.success || '#10b981',
                          }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleAssignClick(assignment.subjectId, assignment)}
                        sx={{ textTransform: 'none', borderRadius: 2 }}
                      >
                        Reassign
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Drawer */}
      <AssignFacultyDrawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        subjectData={selectedSubject}
        branchId={selectedBranch}
        departmentId={departmentId}
      />
    </Box>
  );
};

export default AssignmentHub;
