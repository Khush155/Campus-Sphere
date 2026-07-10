// client/src/pages/faculty/search/SearchPage.jsx
//
// Centralized Search page for Faculty to search students, subjects, exams, and assignments.

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  InputBase,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  IconButton,
  Chip,
  Divider,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Search as SearchIcon,
  People as StudentIcon,
  Book as SubjectIcon,
  Assignment as AssignmentIcon,
  Assessment as ExamIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Reused Mock Data lists
import { mockStudentsList, mockAttendanceSubjects } from '../attendance/mockData';

// Standalone mock lists matching other modules
const mockAssignments = [
  { id: 'as01', title: 'Data Structures: Tree Balancing Implementation', code: 'CSE201', dueDate: '2026-07-15' },
  { id: 'as02', title: 'DBMS: Relational Algebra Worksheet', code: 'CSE305', dueDate: '2026-07-18' },
  { id: 'as03', title: 'OS: Process Sync Programming Lab', code: 'CSE302', dueDate: '2026-07-22' },
];

const mockExams = [
  { id: 'ex01', title: 'DSA Midterm Assessment', code: 'CSE201', date: '2026-07-12', room: 'LH-301' },
  { id: 'ex02', title: 'DBMS Quiz 1', code: 'CSE305', date: '2026-07-16', room: 'Lab-4' },
  { id: 'ex03', title: 'OS End-Term Theory Exam', code: 'CSE302', date: '2026-07-24', room: 'Hall-A' },
];

export const SearchPage = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState(0); // 0 = Students, 1 = Assignments, 2 = Exams, 3 = Subjects

  // Filter Results dynamically
  const studentsResults = mockStudentsList.filter((s) => {
    const q = query.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.rollNumber.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
  });

  const assignmentsResults = mockAssignments.filter((a) => {
    const q = query.toLowerCase();
    return a.title.toLowerCase().includes(q) || a.code.toLowerCase().includes(q);
  });

  const examsResults = mockExams.filter((e) => {
    const q = query.toLowerCase();
    return e.title.toLowerCase().includes(q) || e.code.toLowerCase().includes(q);
  });

  const subjectsResults = mockAttendanceSubjects.filter((sub) => {
    const q = query.toLowerCase();
    return sub.name.toLowerCase().includes(q) || sub.code.toLowerCase().includes(q);
  });

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* ── Page Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
        <IconButton
          onClick={() => navigate('/faculty')}
          size="small"
          sx={{ bgcolor: 'action.hover', '&:hover': { bgcolor: 'action.selected' } }}
        >
          <BackIcon fontSize="small" />
        </IconButton>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>
            Search Directory
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Instantly lookup information across students, courses, assignments, and exam schedules
          </Typography>
        </Box>
      </Box>

      {/* ── Big Search Bar ── */}
      <Paper
        elevation={0}
        variant="outlined"
        sx={{
          p: '6px 12px',
          display: 'flex',
          alignItems: 'center',
          borderRadius: 4,
          mb: 4,
          border: (theme) => `2px solid ${theme.palette.divider}`,
          '&:focus-within': {
            borderColor: '#4f46e5',
          },
        }}
      >
        <SearchIcon sx={{ color: 'text.secondary', mr: 1.5 }} />
        <InputBase
          placeholder="Search by student name, roll number, subject code, exam title..."
          fullWidth
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          sx={{ fontSize: '1rem', fontWeight: 600 }}
        />
      </Paper>

      {/* ── Categories Filters Tabs ── */}
      <Paper variant="outlined" sx={{ borderRadius: 3.5, overflow: 'hidden' }}>
        <Tabs
          value={activeTab}
          onChange={(e, val) => setActiveTab(val)}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <StudentIcon fontSize="small" />
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  Students ({studentsResults.length})
                </Typography>
              </Box>
            }
            sx={{ textTransform: 'none', py: 2 }}
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AssignmentIcon fontSize="small" />
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  Assignments ({assignmentsResults.length})
                </Typography>
              </Box>
            }
            sx={{ textTransform: 'none', py: 2 }}
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ExamIcon fontSize="small" />
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  Exams ({examsResults.length})
                </Typography>
              </Box>
            }
            sx={{ textTransform: 'none', py: 2 }}
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SubjectIcon fontSize="small" />
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  Subjects ({subjectsResults.length})
                </Typography>
              </Box>
            }
            sx={{ textTransform: 'none', py: 2 }}
          />
        </Tabs>

        {/* ── Tab Panels Content ── */}
        <Box sx={{ p: 3 }}>
          {/* Panel 0: Students */}
          {activeTab === 0 && (
            <Grid container spacing={2.5}>
              {studentsResults.length > 0 ? (
                studentsResults.map((stud) => (
                  <Grid item xs={12} sm={6} key={stud.id}>
                    <Card variant="outlined" sx={{ borderRadius: 3 }}>
                      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, '&:last-child': { pb: 2 } }}>
                        <Avatar sx={{ bgcolor: 'rgba(79, 70, 229, 0.08)', color: '#4f46e5', fontWeight: 700 }}>
                          {stud.name[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                            {stud.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                            Roll Number: {stud.rollNumber}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Email: {stud.email}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))
              ) : (
                <Grid item xs={12} sx={{ py: 4, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.disabled">
                    No matching student found.
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}

          {/* Panel 1: Assignments */}
          {activeTab === 1 && (
            <Grid container spacing={2.5}>
              {assignmentsResults.length > 0 ? (
                assignmentsResults.map((assign) => (
                  <Grid item xs={12} key={assign.id}>
                    <Card variant="outlined" sx={{ borderRadius: 3 }}>
                      <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', '&:last-child': { pb: 2 } }}>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                            {assign.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                            Due Date: {assign.dueDate}
                          </Typography>
                        </Box>
                        <Chip label={assign.code} variant="outlined" sx={{ fontWeight: 700 }} />
                      </CardContent>
                    </Card>
                  </Grid>
                ))
              ) : (
                <Grid item xs={12} sx={{ py: 4, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.disabled">
                    No matching assignments found.
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}

          {/* Panel 2: Exams */}
          {activeTab === 2 && (
            <Grid container spacing={2.5}>
              {examsResults.length > 0 ? (
                examsResults.map((exam) => (
                  <Grid item xs={12} key={exam.id}>
                    <Card variant="outlined" sx={{ borderRadius: 3 }}>
                      <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', '&:last-child': { pb: 2 } }}>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                            {exam.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                            Exam Date: {exam.date}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Room: {exam.room}
                          </Typography>
                        </Box>
                        <Chip label={exam.code} color="secondary" variant="outlined" sx={{ fontWeight: 700 }} />
                      </CardContent>
                    </Card>
                  </Grid>
                ))
              ) : (
                <Grid item xs={12} sx={{ py: 4, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.disabled">
                    No matching exam schedules found.
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}

          {/* Panel 3: Subjects */}
          {activeTab === 3 && (
            <Grid container spacing={2.5}>
              {subjectsResults.length > 0 ? (
                subjectsResults.map((sub) => (
                  <Grid item xs={12} sm={6} key={sub.id}>
                    <Card variant="outlined" sx={{ borderRadius: 3 }}>
                      <CardContent sx={{ '&:last-child': { pb: 2 } }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                            {sub.name}
                          </Typography>
                          <Chip label={sub.code} color="primary" sx={{ fontWeight: 700 }} />
                        </Box>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="caption" color="text.secondary">
                          Course level code: {sub.code}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))
              ) : (
                <Grid item xs={12} sx={{ py: 4, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.disabled">
                    No matching subjects found.
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default SearchPage;
