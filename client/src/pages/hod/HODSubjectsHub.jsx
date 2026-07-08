import React, { useState } from 'react';
import { 
  Box, Typography, Grid, Card, CardContent, Button, useTheme, Chip, Divider, 
  Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import { 
  MenuBook as SubjectIcon,
  Add as AddIcon
} from '@mui/icons-material';

// Mock Data
const mockSubjects = [
  { id: 1, name: 'Data Structures and Algorithms', code: 'CS301', credits: 4, type: 'CORE', semester: 3, faculty: 'Prof. Singh' },
  { id: 2, name: 'Operating Systems', code: 'CS401', credits: 4, type: 'CORE', semester: 4, faculty: 'Dr. Sharma' },
  { id: 3, name: 'Database Management Systems', code: 'CS302', credits: 4, type: 'CORE', semester: 3, faculty: 'Dr. Sharma' },
  { id: 4, name: 'Computer Networks', code: 'CS402', credits: 4, type: 'CORE', semester: 4, faculty: 'Prof. Verma' },
  { id: 5, name: 'Machine Learning', code: 'CS501', credits: 3, type: 'ELECTIVE', semester: 5, faculty: 'Dr. Patel' },
];

const mockFaculty = [
  'Unassigned', 'Dr. Sharma', 'Prof. Singh', 'Prof. Verma', 'Dr. Patel'
];

const HODSubjectsHub = () => {
  const theme = useTheme();
  
  // Group subjects by semester
  const semesters = [3, 4, 5]; // Mock active semesters

  const [assignments, setAssignments] = useState(
    mockSubjects.reduce((acc, sub) => ({ ...acc, [sub.id]: sub.faculty }), {})
  );

  const handleAssign = (subjectId, faculty) => {
    setAssignments(prev => ({ ...prev, [subjectId]: faculty }));
  };

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
          Subjects & Faculty Assignment
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} sx={{ borderRadius: 3, fontWeight: 700, px: 3 }}>
          Add Subject
        </Button>
      </Box>

      {/* Grouped by Semester */}
      <Grid container spacing={4}>
        {semesters.map(sem => (
          <Grid item xs={12} lg={4} key={sem}>
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip label={`Semester ${sem}`} color="primary" sx={{ fontWeight: 800, borderRadius: 2 }} />
              <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                {mockSubjects.filter(s => s.semester === sem).length} Subjects
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {mockSubjects.filter(s => s.semester === sem).map(subject => (
                <Card 
                  key={subject.id} 
                  sx={{ 
                    borderRadius: 3, 
                    boxShadow: theme.custom?.elevation?.card || 1,
                    border: `1px solid ${theme.custom?.border?.subtle || '#e0e0e0'}`,
                    borderLeft: `4px solid ${subject.type === 'CORE' ? theme.palette.primary.main : theme.palette.secondary.main}`
                  }}
                >
                  <CardContent sx={{ p: 2, pb: '16px !important' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                        {subject.name}
                      </Typography>
                      <Chip label={subject.code} size="small" sx={{ fontWeight: 700, borderRadius: 1 }} />
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <Chip label={`${subject.credits} Credits`} size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: '0.7rem' }} />
                      <Chip label={subject.type} size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: '0.7rem', color: 'text.secondary' }} />
                    </Box>

                    <Divider sx={{ mb: 2, opacity: 0.5 }} />

                    <FormControl fullWidth size="small">
                      <InputLabel sx={{ fontSize: '0.8rem' }}>Assigned Faculty</InputLabel>
                      <Select
                        value={assignments[subject.id]}
                        label="Assigned Faculty"
                        onChange={(e) => handleAssign(subject.id, e.target.value)}
                        sx={{ 
                          borderRadius: 2, 
                          fontWeight: 600,
                          bgcolor: assignments[subject.id] === 'Unassigned' ? 'error.50' : 'transparent',
                          '& .MuiSelect-select': { py: 1 }
                        }}
                      >
                        {mockFaculty.map(f => (
                          <MenuItem key={f} value={f} sx={{ fontWeight: 600 }}>
                            {f === 'Unassigned' ? <span style={{ color: 'red' }}>Unassigned</span> : f}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default HODSubjectsHub;
