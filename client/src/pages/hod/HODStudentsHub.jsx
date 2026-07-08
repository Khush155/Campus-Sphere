import React, { useState } from 'react';
import { 
  Box, Typography, Card, CardContent, Button, useTheme, Avatar, Chip, Divider, 
  InputAdornment, TextField, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Drawer, Tabs, Tab
} from '@mui/material';
import { 
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Close as CloseIcon,
  MoreVert as MoreVertIcon,
  TrendingUp as TrendingUpIcon,
  ErrorOutline as ErrorIcon
} from '@mui/icons-material';

// Mock Data
const mockStudents = [
  { id: 1, enrollment: 'CS2026001', name: 'John Doe', semester: 3, cgpa: 8.4, attendance: 92, status: 'Regular' },
  { id: 2, enrollment: 'CS2026002', name: 'Jane Smith', semester: 3, cgpa: 9.1, attendance: 95, status: 'Regular' },
  { id: 3, enrollment: 'CS2026003', name: 'Rahul Kumar', semester: 3, cgpa: 6.8, attendance: 62, status: 'Defaulter' },
  { id: 4, enrollment: 'CS2026004', name: 'Aisha Khan', semester: 3, cgpa: 7.9, attendance: 85, status: 'Regular' },
  { id: 5, enrollment: 'CS2026005', name: 'Priya Sharma', semester: 3, cgpa: 5.2, attendance: 70, status: 'Warning' },
  { id: 6, enrollment: 'CS2026006', name: 'Aman Singh', semester: 3, cgpa: 8.8, attendance: 98, status: 'Regular' },
];

const HODStudentsHub = () => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  const filteredStudents = mockStudents.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.enrollment.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Regular': return 'success';
      case 'Warning': return 'warning';
      case 'Defaulter': return 'error';
      default: return 'default';
    }
  };

  const renderDrawer = () => (
    <Drawer
      anchor="right"
      open={Boolean(selectedStudent)}
      onClose={() => setSelectedStudent(null)}
      PaperProps={{
        sx: { width: { xs: '100%', sm: 450 }, p: 0, bgcolor: 'background.default' }
      }}
    >
      {selectedStudent && (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Drawer Header */}
          <Box sx={{ p: 3, bgcolor: theme.custom?.surface?.card || '#fff', borderBottom: `1px solid ${theme.custom?.border?.subtle || '#e0e0e0'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>Student Profile</Typography>
            <IconButton onClick={() => setSelectedStudent(null)}><CloseIcon /></IconButton>
          </Box>

          {/* Drawer Profile Info */}
          <Box sx={{ p: 4, textAlign: 'center', bgcolor: theme.custom?.surface?.card || '#fff' }}>
            <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: theme.palette.primary.main, fontSize: 32, fontWeight: 700 }}>
              {selectedStudent.name[0]}
            </Avatar>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>{selectedStudent.name}</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600, mb: 2 }}>{selectedStudent.enrollment} • Semester {selectedStudent.semester}</Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3 }}>
              <Chip label={`CGPA: ${selectedStudent.cgpa}`} sx={{ fontWeight: 700, borderRadius: 2 }} />
              <Chip label={`Att: ${selectedStudent.attendance}%`} color={selectedStudent.attendance < 75 ? 'error' : 'success'} sx={{ fontWeight: 700, borderRadius: 2 }} />
            </Box>
          </Box>

          {/* Drawer Tabs */}
          <Box sx={{ bgcolor: theme.custom?.surface?.card || '#fff', borderBottom: `1px solid ${theme.custom?.border?.subtle || '#e0e0e0'}` }}>
            <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth">
              <Tab label="Grades" sx={{ fontWeight: 600 }} />
              <Tab label="Attendance" sx={{ fontWeight: 600 }} />
              <Tab label="Action" sx={{ fontWeight: 600 }} />
            </Tabs>
          </Box>

          {/* Drawer Tab Content */}
          <Box sx={{ p: 3, flexGrow: 1, overflowY: 'auto' }}>
            {tabValue === 0 && (
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: 'text.secondary', textTransform: 'uppercase' }}>Recent Performance</Typography>
                <Card sx={{ bgcolor: 'background.paper', borderRadius: 3, boxShadow: 0, border: `1px solid ${theme.custom?.border?.subtle || '#e0e0e0'}`, p: 2, mb: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                    <span>Data Structures</span>
                    <span>A (92/100)</span>
                  </Typography>
                </Card>
                <Card sx={{ bgcolor: 'background.paper', borderRadius: 3, boxShadow: 0, border: `1px solid ${theme.custom?.border?.subtle || '#e0e0e0'}`, p: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                    <span>Operating Systems</span>
                    <span style={{ color: theme.palette.error.main }}>C (55/100)</span>
                  </Typography>
                </Card>
              </Box>
            )}
            {tabValue === 1 && (
              <Box sx={{ textAlign: 'center', p: 4 }}>
                <TrendingUpIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.secondary' }}>Detailed attendance heatmap goes here.</Typography>
              </Box>
            )}
            {tabValue === 2 && (
              <Box sx={{ textAlign: 'center', p: 4 }}>
                <ErrorIcon sx={{ fontSize: 60, color: 'error.light', mb: 2 }} />
                <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.secondary', mb: 3 }}>Initiate disciplinary or academic intervention.</Typography>
                <Button variant="contained" color="error" fullWidth sx={{ borderRadius: 2, fontWeight: 700 }}>Schedule Meeting</Button>
              </Box>
            )}
          </Box>
        </Box>
      )}
    </Drawer>
  );

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
          Department Students
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search student or ID..."
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
              sx: { borderRadius: 3, bgcolor: theme.custom?.surface?.card || '#fff', minWidth: 250 }
            }}
          />
          <Button variant="outlined" startIcon={<FilterListIcon />} sx={{ borderRadius: 3, fontWeight: 700, bgcolor: theme.custom?.surface?.card || '#fff' }}>
            Filter
          </Button>
        </Box>
      </Box>

      {/* Data Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 4, boxShadow: theme.custom?.elevation?.card || 1, border: `1px solid ${theme.custom?.border?.subtle || '#e0e0e0'}`, overflow: 'hidden' }}>
        <Table sx={{ minWidth: 650 }} aria-label="student table">
          <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, py: 2 }}>Student</TableCell>
              <TableCell sx={{ fontWeight: 700, py: 2 }}>Enrollment No.</TableCell>
              <TableCell sx={{ fontWeight: 700, py: 2 }} align="center">Semester</TableCell>
              <TableCell sx={{ fontWeight: 700, py: 2 }} align="center">CGPA</TableCell>
              <TableCell sx={{ fontWeight: 700, py: 2 }} align="center">Attendance</TableCell>
              <TableCell sx={{ fontWeight: 700, py: 2 }} align="center">Status</TableCell>
              <TableCell sx={{ fontWeight: 700, py: 2 }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredStudents.map((student) => (
              <TableRow
                key={student.id}
                hover
                onClick={() => setSelectedStudent(student)}
                sx={{ '&:last-child td, &:last-child th': { border: 0 }, cursor: 'pointer' }}
              >
                <TableCell component="th" scope="row">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.primary.main, fontSize: '0.9rem', fontWeight: 700 }}>
                      {student.name[0]}
                    </Avatar>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{student.name}</Typography>
                  </Box>
                </TableCell>
                <TableCell sx={{ fontWeight: 500, color: 'text.secondary' }}>{student.enrollment}</TableCell>
                <TableCell align="center">
                  <Chip label={`Sem ${student.semester}`} size="small" sx={{ borderRadius: 1, fontWeight: 600 }} />
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body2" sx={{ fontWeight: 700, color: student.cgpa < 6.0 ? 'error.main' : 'text.primary' }}>
                    {student.cgpa}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body2" sx={{ fontWeight: 700, color: student.attendance < 75 ? 'error.main' : 'success.main' }}>
                    {student.attendance}%
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Chip label={student.status} size="small" color={getStatusColor(student.status)} sx={{ borderRadius: 1.5, fontWeight: 700, height: 24, fontSize: '0.7rem' }} />
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); /* Menu logic */ }}>
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {filteredStudents.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <Typography variant="body1" color="text.secondary">No students found matching your search.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {renderDrawer()}
    </Box>
  );
};

export default HODStudentsHub;
