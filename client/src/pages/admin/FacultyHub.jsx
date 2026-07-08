import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  InputAdornment,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  School as SchoolIcon,
  Email as EmailIcon,
} from '@mui/icons-material';

const FacultyHub = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: facultyData, isLoading } = useQuery({
    queryKey: ['faculty-list'],
    queryFn: () => api.get('/users/faculty').then((res) => res.data.data),
  });

  const facultyList = facultyData || [];

  const filteredFaculty = facultyList.filter(f => 
    f.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    f.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, md: 3 } }}>
      <Box sx={{ mb: 4, display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, color: 'text.primary' }}>
            Faculty Directory
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage faculty records and monitor academic workloads.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            size="small"
            placeholder="Search Faculty"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              sx: { borderRadius: 2, bgcolor: 'background.paper' }
            }}
          />
          <Button variant="contained" startIcon={<AddIcon />} sx={{ borderRadius: 2, whiteSpace: 'nowrap' }}>
            Add Faculty
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {filteredFaculty.map((faculty) => (
          <Grid item xs={12} sm={6} md={4} key={faculty.id}>
            <Card 
              sx={{ 
                borderRadius: 4, 
                boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <CardContent sx={{ p: 3, flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'secondary.light', color: 'secondary.main', width: 56, height: 56 }}>
                    <SchoolIcon fontSize="large" />
                  </Avatar>
                  <Chip 
                    label={faculty.status} 
                    size="small"
                    color={faculty.status === 'Active' ? 'success' : 'warning'}
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
                
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                  {faculty.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 2 }}>
                  {faculty.department} Department
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: 'text.secondary' }}>
                  <EmailIcon fontSize="small" />
                  <Typography variant="body2">{faculty.email}</Typography>
                </Box>

                <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 2, mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                    ASSIGNED SUBJECTS
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {faculty.subjects.map(sub => (
                      <Chip key={sub} label={sub} size="small" sx={{ borderRadius: 1 }} />
                    ))}
                  </Box>
                </Box>
              </CardContent>
              <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.default', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Workload
                </Typography>
                <Typography variant="body2" color="text.primary" sx={{ fontWeight: 700 }}>
                  {faculty.workload} credits
                </Typography>
              </Box>
            </Card>
          </Grid>
        ))}
        {filteredFaculty.length === 0 && (
          <Grid item xs={12}>
            <Alert severity="info" sx={{ borderRadius: 2 }}>No faculty found matching the current filters.</Alert>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default FacultyHub;
