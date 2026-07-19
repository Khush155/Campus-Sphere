// client/src/pages/faculty/students/FacultyStudentListPage.jsx
//
// Read-only roster lookup page for Faculty users with backend integration.

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
  Button,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  People as StudentIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Import selectors
import SubjectSelector from '../attendance/components/SubjectSelector';
import SectionSelector from '../attendance/components/SectionSelector';

// Import backend hooks
import { useFacultyDashboardQuery } from '../../../queries/facultyQueries';
import { useUsersQuery } from '../../../queries/userQueries';

export const FacultyStudentListPage = () => {
  const navigate = useNavigate();

  // State Management
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');

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
  const activeSubject = assignedSubjects.find((s) => s.id === selectedSubjectId);
  const activeSection = sectionsForSubject.find((s) => s.id === selectedSectionId);

  // Derive Semester based on subject course level (e.g. CSE2xx -> Sem 4, CSE3xx -> Sem 6)
  const derivedSemester = useMemo(() => {
    if (!activeSubject) return 'Semester 4';
    const code = activeSubject.code || '';
    if (code.includes('2')) return 'Semester 4';
    if (code.includes('3')) return 'Semester 6';
    return 'Semester 4';
  }, [activeSubject]);

  const isFormReady = !!(selectedSubjectId && selectedSectionId);

  // 2. Fetch students from the active group/section
  const { data: studentsResponse, isLoading: isStudentsLoading } = useUsersQuery({
    role: 'STUDENT',
    group: selectedSectionId || undefined,
    limit: 100,
  });

  const studentsList = studentsResponse?.data || [];

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

  const handleExport = (type) => {
    const filename = `student_roster_${activeSubject?.code || 'subject'}_${selectedSectionId || 'section'}.${type === 'csv' ? 'csv' : 'txt'}`;
    const element = document.createElement('a');
    let content = '';

    if (type === 'csv') {
      content = 'Roll Number,Student Name,Email Address,Semester,Section\n';
      studentsList.forEach((stud, idx) => {
        const roll = stud.rollNumber || `CS20260${idx + 1}`;
        content += `${roll},${stud.name},${stud.email},${derivedSemester},${activeSection?.name || 'N/A'}\n`;
      });
      element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(content));
    } else {
      content = `--- Class Roster Report ---\nSubject: ${activeSubject?.name || 'N/A'} (${activeSubject?.code || 'N/A'})\nSection: ${activeSection?.name || 'N/A'}\n\n`;
      studentsList.forEach((stud, idx) => {
        const roll = stud.rollNumber || `CS20260${idx + 1}`;
        content += `${roll} - ${stud.name} (${stud.email})\n`;
      });
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
    }

    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
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
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
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
              Class Roster
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Lookup names, email ids, and semester details of enrolled students in your classes
            </Typography>
          </Box>
        </Box>

        {isFormReady && studentsList.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<DownloadIcon />}
              onClick={() => handleExport('csv')}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Export CSV
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<DownloadIcon />}
              onClick={() => handleExport('pdf')}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Export PDF
            </Button>
          </Box>
        )}
      </Box>

      {/* ── Selectors Row ── */}
      <Paper sx={{ p: 3, mb: 3 }} elevation={0} variant="outlined">
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <SubjectSelector
              subjects={filterSubjects}
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
        isStudentsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : studentsList.length > 0 ? (
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
                {studentsList.map((stud, index) => {
                  const roll = stud.rollNumber || `CS20260${index + 1}`;
                  return (
                    <TableRow key={stud._id} hover>
                      <TableCell sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
                        {roll}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{stud.name}</TableCell>
                      <TableCell>{stud.email}</TableCell>
                      <TableCell align="center">{derivedSemester}</TableCell>
                      <TableCell align="center">{activeSection?.name || 'N/A'}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
            <Typography variant="body1" color="text.secondary">
              No students found registered under section {activeSection?.name}.
            </Typography>
          </Paper>
        )
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
