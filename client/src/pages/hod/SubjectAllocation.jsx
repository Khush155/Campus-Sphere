import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  TextField,
  useTheme,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem
} from '@mui/material';
import { SearchOutlined, AssignmentIndOutlined } from '@mui/icons-material';
import { useSubjectsQuery, useUpdateSubjectMutation } from '../../queries/collegeQueries';
import { useUsersQuery } from '../../queries/userQueries';
import { useAuth } from '../../contexts/AuthContext';
import EmptyState from '../../components/common/EmptyState';

const SubjectAllocation = () => {
  const theme = useTheme();
  const { user } = useAuth();
  
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  
  // Modal state
  const [allocationModalOpen, setAllocationModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Queries
  const { data: subjectData, isLoading: loadingSubjects } = useSubjectsQuery({ departmentId: user?.departmentId, limit: 100 });
  const { data: facultyData, isLoading: loadingFaculty } = useUsersQuery({ role: 'FACULTY', limit: 100 });
  
  // Mutation
  const updateSubject = useUpdateSubjectMutation();

  const filteredSubjects = React.useMemo(() => {
    if (!subjectData) return [];
    if (!debouncedSearch) return subjectData;
    const lowerSearch = debouncedSearch.toLowerCase();
    return subjectData.filter(sub => 
      sub.name.toLowerCase().includes(lowerSearch) || 
      sub.code.toLowerCase().includes(lowerSearch)
    );
  }, [subjectData, debouncedSearch]);

  const handleOpenAllocationModal = (subject) => {
    setSelectedSubject(subject);
    setSelectedFacultyId(subject.facultyId?._id || subject.facultyId?.id || '');
    setAllocationModalOpen(true);
  };

  const handleCloseModal = () => {
    setAllocationModalOpen(false);
    setSelectedSubject(null);
    setSelectedFacultyId('');
  };

  const handleSaveAllocation = async () => {
    if (selectedSubject) {
      try {
        await updateSubject.mutateAsync({
          id: selectedSubject._id || selectedSubject.id,
          data: { facultyId: selectedFacultyId || null }
        });
        handleCloseModal();
      } catch (err) {
        // error handled globally by query client/axios interceptor
        console.error("Allocation failed", err);
      }
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: theme.palette.ink?.[900] || 'text.primary' }}>
          Subject Allocation
        </Typography>
        <Typography variant="body2" color="text.secondary">
          View subjects offered by your department and allocate them to faculty members.
        </Typography>
      </Box>

      {/* Filter Bar */}
      <Box sx={{ p: 2, borderRadius: '12px', bgcolor: 'rgba(28, 46, 69, 0.02)', border: `1px solid ${theme.palette.divider}` }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by subject name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchOutlined fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              sx={{ bgcolor: 'background.paper' }}
            />
          </Grid>
        </Grid>
      </Box>

      {/* Data Table */}
      {loadingSubjects ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={32} />
        </Box>
      ) : !filteredSubjects || filteredSubjects.length === 0 ? (
        <EmptyState
          type="subjects"
          title="No Subjects Found"
          description={search ? "No subjects match your search criteria." : "No subjects have been configured for your department yet."}
          actionText={search ? "Clear Search" : ""}
          onAction={search ? () => setSearch('') : undefined}
        />
      ) : (
        <TableContainer component={Card} sx={{ border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', borderRadius: '12px' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', py: 2 }}>SUBJECT NAME</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', py: 2 }}>CODE</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', py: 2 }}>TYPE & CREDITS</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', py: 2 }}>SEMESTER</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', py: 2 }}>ASSIGNED FACULTY</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.8rem', py: 2 }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSubjects.map((sub) => {
                const assignedFacultyName = sub.facultyId?.name;
                return (
                  <TableRow key={sub._id || sub.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{sub.name}</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>{sub.code}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Chip
                          label={sub.type}
                          size="small"
                          sx={{
                            bgcolor: 'rgba(184, 134, 62, 0.1)',
                            color: theme.palette.primary.main,
                            fontWeight: 700,
                            fontSize: '0.65rem'
                          }}
                        />
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                          {sub.credits} Credits
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Sem {sub.semester}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {assignedFacultyName ? (
                        <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.ink?.[900] }}>
                          {assignedFacultyName}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                          Unassigned
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<AssignmentIndOutlined />}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 600,
                          borderColor: theme.palette.divider,
                          color: 'text.secondary',
                          '&:hover': {
                            borderColor: theme.palette.primary.main,
                            color: theme.palette.primary.main,
                            bgcolor: 'rgba(79, 70, 229, 0.04)'
                          }
                        }}
                        onClick={() => handleOpenAllocationModal(sub)}
                      >
                        {assignedFacultyName ? 'Reassign' : 'Assign Faculty'}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Allocation Modal */}
      <Dialog 
        open={allocationModalOpen} 
        onClose={handleCloseModal}
        PaperProps={{
          sx: { width: '100%', maxWidth: 450, borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Assign Faculty to {selectedSubject?.code}
        </DialogTitle>
        <DialogContent sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Select a faculty member from your department to teach <strong>{selectedSubject?.name}</strong>.
          </Typography>
          
          {loadingFaculty ? (
             <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress size={24} />
             </Box>
          ) : (
            <TextField
              select
              fullWidth
              label="Select Faculty"
              value={selectedFacultyId}
              onChange={(e) => setSelectedFacultyId(e.target.value)}
            >
              <MenuItem value="">
                <em>None (Unassigned)</em>
              </MenuItem>
              {facultyData?.data?.map(faculty => (
                <MenuItem key={faculty.id || faculty._id} value={faculty.id || faculty._id}>
                  {faculty.name} ({faculty.email})
                </MenuItem>
              ))}
            </TextField>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={handleCloseModal} color="inherit" sx={{ fontWeight: 600 }}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveAllocation} 
            variant="contained"
            disabled={updateSubject.isLoading}
            sx={{ fontWeight: 700 }}
          >
            {updateSubject.isLoading ? 'Saving...' : 'Save Allocation'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SubjectAllocation;
