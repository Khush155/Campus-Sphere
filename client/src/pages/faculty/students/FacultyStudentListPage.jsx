// client/src/pages/faculty/students/FacultyStudentListPage.jsx
//
// Read-only roster lookup page for Faculty users.
// Reuses student datasets and subject selectors from the Attendance module.

import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Divider,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  People as StudentIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Reused presentation components from Attendance module
import SubjectSelector from '../attendance/components/SubjectSelector';
import SectionSelector from '../attendance/components/SectionSelector';

// Reused mock data lists
import { mockAttendanceSubjects, mockStudentsList } from '../attendance/mockData';

// Subject → Section mapping (consistent with other modules)
const SUBJECT_SECTIONS = {
  sub1: [{ id: 'sec1a', name: 'CSE-A', strength: 20 }],
  sub2: [
    { id: 'sec2a', name: 'CSE-A', strength: 20 },
    { id: 'sec2b', name: 'CSE-B', strength: 18 },
  ],
  sub3: [{ id: 'sec3a', name: 'CSE-A', strength: 20 }],
};

export const FacultyStudentListPage = () => {
  const navigate = useNavigate();

  // ══════════════════════════════════════════════════════════
  // STATE MANAGEMENT
  // ══════════════════════════════════════════════════════════
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');

  // ══════════════════════════════════════════════════════════
  // DERIVED DATA
  // ══════════════════════════════════════════════════════════
  const sectionsForSubject = SUBJECT_SECTIONS[selectedSubjectId] || [];
  const activeSubject = mockAttendanceSubjects.find(s => s.id === selectedSubjectId);
  const activeSection = sectionsForSubject.find(s => s.id === selectedSectionId);

  // Derive Semester based on subject course level (e.g. CSE2xx -> Sem 4, CSE3xx -> Sem 6)
  const derivedSemester = useMemo(() => {
    if (!activeSubject) return 'Semester 4';
    const code = activeSubject.code;
    if (code.includes('2')) return 'Semester 4';
    if (code.includes('3')) return 'Semester 6';
    return 'Semester 4';
  }, [activeSubject]);

  const isFormReady = !!(selectedSubjectId && selectedSectionId);

  // ══════════════════════════════════════════════════════════
  // HANDLERS
  // ══════════════════════════════════════════════════════════
  const handleSubjectChange = (subjectId) => {
    setSelectedSubjectId(subjectId);
    
    // Auto-select section if only one exists
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

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* ── Page Header ── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          mb: 4,
        }}
      >
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
            Class Roster
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Lookup names, email ids, and semester details of enrolled students in your classes
          </Typography>
        </Box>
      </Box>

      {/* ── Selectors Row ── */}
      <Paper sx={{ p: 3, mb: 3 }} elevation={0} variant="outlined">
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <SubjectSelector
              subjects={mockAttendanceSubjects}
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

      {/* ── Roster Table Content ── */}
      {isFormReady ? (
        <TableContainer
          component={Paper}
          elevation={0}
          variant="outlined"
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          <Table sx={{ minWidth: 600 }}>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, width: '20%' }}>Roll Number</TableCell>
                <TableCell sx={{ fontWeight: 800, width: '30%' }}>Student Name</TableCell>
                <TableCell sx={{ fontWeight: 800, width: '30%' }}>Email Address</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800, width: '10%' }}>Semester</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800, width: '10%' }}>Section</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mockStudentsList.map((stud) => (
                <TableRow key={stud.id} hover>
                  {/* Roll Number */}
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
                    {stud.rollNumber}
                  </TableCell>
                  
                  {/* Student Name */}
                  <TableCell sx={{ fontWeight: 700 }}>
                    {stud.name}
                  </TableCell>

                  {/* Email */}
                  <TableCell>
                    {stud.email}
                  </TableCell>

                  {/* Semester */}
                  <TableCell align="center">
                    {derivedSemester}
                  </TableCell>

                  {/* Section */}
                  <TableCell align="center">
                    {activeSection?.name || 'N/A'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        /* Unselected Prompt */
        <Paper
          variant="outlined"
          sx={{
            p: 4,
            textAlign: 'center',
            borderRadius: 3,
            bgcolor: 'background.paper',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box
            sx={{
              width: 50,
              height: 50,
              borderRadius: '50%',
              bgcolor: 'action.hover',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
            }}
          >
            <StudentIcon sx={{ color: 'text.secondary' }} />
          </Box>
          <Typography variant="body1" color="text.secondary">
            {!selectedSubjectId
              ? 'Select a subject to retrieve classroom roster.'
              : 'Select a target section to load students.'}
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default FacultyStudentListPage;
