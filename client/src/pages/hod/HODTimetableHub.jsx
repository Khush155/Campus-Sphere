import React, { useState } from 'react';
import { 
  Box, Typography, Card, CardContent, Button, useTheme, Chip, 
  Select, MenuItem, FormControl, InputLabel, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import { 
  FileDownload as ExportIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const SLOTS = ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'];

// Mock Schedule Data (Semester 3)
const mockTimetable = {
  'Monday': { '09:00 AM': { sub: 'CS301', type: 'Lecture', faculty: 'Prof. Singh', room: 'L101' }, '11:00 AM': { sub: 'CS302', type: 'Lab', faculty: 'Dr. Sharma', room: 'Lab 3' } },
  'Tuesday': { '10:00 AM': { sub: 'CS301', type: 'Lecture', faculty: 'Prof. Singh', room: 'L101' }, '02:00 PM': { sub: 'CS302', type: 'Lecture', faculty: 'Dr. Sharma', room: 'L102' } },
  'Wednesday': { '09:00 AM': { sub: 'CS302', type: 'Lecture', faculty: 'Dr. Sharma', room: 'L102' }, '01:00 PM': { sub: 'CS301', type: 'Lab', faculty: 'Prof. Singh', room: 'Lab 1' } },
  'Thursday': { '11:00 AM': { sub: 'CS301', type: 'Tutorial', faculty: 'Prof. Singh', room: 'T10' } },
  'Friday': { '10:00 AM': { sub: 'CS302', type: 'Tutorial', faculty: 'Dr. Sharma', room: 'T11' }, '02:00 PM': { sub: 'CS301', type: 'Lecture', faculty: 'Prof. Singh', room: 'L101' } },
};

const HODTimetableHub = () => {
  const theme = useTheme();
  const [filterView, setFilterView] = useState('Semester 3');

  const getSlotColor = (type) => {
    switch(type) {
      case 'Lecture': return 'rgba(79, 70, 229, 0.1)';
      case 'Lab': return 'rgba(16, 185, 129, 0.1)';
      case 'Tutorial': return 'rgba(245, 158, 11, 0.1)';
      default: return 'transparent';
    }
  };
  
  const getSlotBorder = (type) => {
    switch(type) {
      case 'Lecture': return theme.palette.primary.main;
      case 'Lab': return theme.palette.success.main;
      case 'Tutorial': return theme.palette.warning.main;
      default: return 'transparent';
    }
  };

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
          Department Timetable
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 200, bgcolor: theme.custom?.surface?.card || '#fff' }}>
            <InputLabel>View Schedule For</InputLabel>
            <Select
              value={filterView}
              label="View Schedule For"
              onChange={(e) => setFilterView(e.target.value)}
              sx={{ borderRadius: 3, fontWeight: 700 }}
            >
              <MenuItem value="Semester 1">Semester 1</MenuItem>
              <MenuItem value="Semester 3">Semester 3</MenuItem>
              <MenuItem value="Semester 5">Semester 5</MenuItem>
              <MenuItem value="Dr. Sharma">Faculty: Dr. Sharma</MenuItem>
              <MenuItem value="Prof. Singh">Faculty: Prof. Singh</MenuItem>
            </Select>
          </FormControl>
          <Button variant="outlined" startIcon={<ExportIcon />} sx={{ borderRadius: 3, fontWeight: 700, bgcolor: theme.custom?.surface?.card || '#fff' }}>
            Export PDF
          </Button>
        </Box>
      </Box>

      {/* Legend */}
      <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 16, height: 16, borderRadius: 1, bgcolor: getSlotColor('Lecture'), border: `1px solid ${getSlotBorder('Lecture')}` }} />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>Lecture</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 16, height: 16, borderRadius: 1, bgcolor: getSlotColor('Lab'), border: `1px solid ${getSlotBorder('Lab')}` }} />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>Lab</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 16, height: 16, borderRadius: 1, bgcolor: getSlotColor('Tutorial'), border: `1px solid ${getSlotBorder('Tutorial')}` }} />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>Tutorial</Typography>
        </Box>
      </Box>

      {/* Timetable Grid */}
      <TableContainer component={Paper} sx={{ borderRadius: 4, boxShadow: theme.custom?.elevation?.card || 1, border: `1px solid ${theme.custom?.border?.subtle || '#e0e0e0'}`, overflowX: 'auto' }}>
        <Table sx={{ minWidth: 1000 }} aria-label="timetable">
          <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 800, py: 2, borderRight: `1px solid ${theme.custom?.border?.subtle || '#e0e0e0'}`, width: 100 }}>Time</TableCell>
              {DAYS.map(day => (
                <TableCell key={day} align="center" sx={{ fontWeight: 800, py: 2, borderRight: `1px solid ${theme.custom?.border?.subtle || '#e0e0e0'}`, width: '18%' }}>
                  {day}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {SLOTS.map((slot) => (
              <TableRow key={slot} sx={{ '&:last-child td, &:last-child th': { borderBottom: 0 } }}>
                <TableCell component="th" scope="row" sx={{ fontWeight: 700, color: 'text.secondary', borderRight: `1px solid ${theme.custom?.border?.subtle || '#e0e0e0'}`, whiteSpace: 'nowrap' }}>
                  {slot}
                </TableCell>
                {DAYS.map((day) => {
                  const classInfo = mockTimetable[day]?.[slot];
                  return (
                    <TableCell key={`${day}-${slot}`} align="center" sx={{ p: 1, borderRight: `1px solid ${theme.custom?.border?.subtle || '#e0e0e0'}` }}>
                      {classInfo ? (
                        <Card 
                          sx={{ 
                            bgcolor: getSlotColor(classInfo.type), 
                            border: `1px solid ${getSlotBorder(classInfo.type)}`,
                            borderRadius: 2,
                            boxShadow: 0,
                            p: 1.5,
                            textAlign: 'center',
                            cursor: 'pointer',
                            '&:hover': { boxShadow: theme.custom?.elevation?.glow || 2 }
                          }}
                        >
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, lineHeight: 1.2, mb: 0.5 }}>{classInfo.sub}</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>{classInfo.type} • {classInfo.room}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mt: 0.5 }}>{classInfo.faculty}</Typography>
                        </Card>
                      ) : (
                        <Box sx={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {slot === '12:00 PM' ? <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 600 }}>LUNCH BREAK</Typography> : ''}
                        </Box>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default HODTimetableHub;
