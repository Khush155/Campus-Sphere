import React, { useState } from 'react';
import { 
  Box, Typography, Grid, Card, CardContent, Button, useTheme, Avatar, Chip, Divider, 
  InputAdornment, TextField, IconButton, Tabs, Tab
} from '@mui/material';
import { 
  Search as SearchIcon,
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Event as EventIcon,
  School as SchoolIcon,
  AssignmentTurnedIn as AssignmentIcon,
  MenuBook as SubjectIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';

// Mock Data
const mockFaculty = [
  { id: 1, name: 'Dr. Sharma', title: 'Professor', subjects: ['DBMS', 'OS'], credits: 16, status: 'Active', email: 'sharma@cs.edu', phone: '+1 234-567-8901', joined: 'Aug 2018' },
  { id: 2, name: 'Prof. Singh', title: 'Associate Professor', subjects: ['Data Structures', 'Algorithms'], credits: 14, status: 'Active', email: 'singh@cs.edu', phone: '+1 234-567-8902', joined: 'Jan 2020' },
  { id: 3, name: 'Prof. Verma', title: 'Assistant Professor', subjects: ['Computer Networks'], credits: 10, status: 'On Leave', email: 'verma@cs.edu', phone: '+1 234-567-8903', joined: 'Jul 2022' },
  { id: 4, name: 'Dr. Patel', title: 'Professor', subjects: ['Machine Learning', 'AI'], credits: 18, status: 'Active', email: 'patel@cs.edu', phone: '+1 234-567-8904', joined: 'Sep 2015' },
];

const FacultyHub = () => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  const filteredFaculty = mockFaculty.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const renderProfileView = () => (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={() => setSelectedFaculty(null)} sx={{ bgcolor: theme.custom?.surface?.card || '#fff', boxShadow: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>Faculty Profile</Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column: Quick Info */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 4, bgcolor: theme.custom?.surface?.card || '#fff', boxShadow: theme.custom?.elevation?.card || 1, mb: 3 }}>
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <Avatar sx={{ width: 100, height: 100, mx: 'auto', mb: 2, bgcolor: theme.palette.primary.main, fontSize: 36, fontWeight: 700 }}>
                {selectedFaculty.name[0]}
              </Avatar>
              <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>{selectedFaculty.name}</Typography>
              <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600, mb: 2 }}>{selectedFaculty.title}</Typography>
              <Chip label={selectedFaculty.status} color={selectedFaculty.status === 'Active' ? 'success' : 'warning'} size="small" sx={{ fontWeight: 700, borderRadius: 2 }} />
              
              <Divider sx={{ my: 3 }} />
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'left' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <EmailIcon color="action" />
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{selectedFaculty.email}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <PhoneIcon color="action" />
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{selectedFaculty.phone}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <EventIcon color="action" />
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>Joined {selectedFaculty.joined}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Quick Actions</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Button variant="contained" startIcon={<AssignmentIcon />} sx={{ borderRadius: 2, py: 1.2, fontWeight: 700, justifyContent: 'flex-start' }}>
              Assign Subject
            </Button>
            <Button variant="outlined" startIcon={<SchoolIcon />} sx={{ borderRadius: 2, py: 1.2, fontWeight: 700, justifyContent: 'flex-start' }}>
              View Timetable
            </Button>
            <Button variant="outlined" color="error" sx={{ borderRadius: 2, py: 1.2, fontWeight: 700, justifyContent: 'flex-start' }}>
              Remove Subject
            </Button>
          </Box>
        </Grid>

        {/* Right Column: Detailed Tabs */}
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 4, bgcolor: theme.custom?.surface?.card || '#fff', boxShadow: theme.custom?.elevation?.card || 1, height: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, pt: 1 }}>
              <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
                <Tab label="Overview" sx={{ fontWeight: 600 }} />
                <Tab label="Subjects" sx={{ fontWeight: 600 }} />
                <Tab label="Timetable" sx={{ fontWeight: 600 }} />
                <Tab label="Attendance" sx={{ fontWeight: 600 }} />
                <Tab label="Performance" sx={{ fontWeight: 600 }} />
              </Tabs>
            </Box>
            <CardContent sx={{ p: 3 }}>
              {tabValue === 0 && (
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Current Workload</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={4}>
                      <Box sx={{ p: 2, borderRadius: 3, bgcolor: 'rgba(79, 70, 229, 0.08)' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>Total Credits</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main' }}>{selectedFaculty.credits}</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={4}>
                      <Box sx={{ p: 2, borderRadius: 3, bgcolor: 'rgba(16, 185, 129, 0.08)' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>Subjects Taught</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: 'success.main' }}>{selectedFaculty.subjects.length}</Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  <Typography variant="h6" sx={{ fontWeight: 700, mt: 4, mb: 2 }}>Assigned Subjects</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {selectedFaculty.subjects.map((sub, i) => (
                      <Chip key={i} icon={<SubjectIcon />} label={sub} sx={{ borderRadius: 2, fontWeight: 600, py: 2.5, px: 1 }} />
                    ))}
                  </Box>
                </Box>
              )}
              {tabValue !== 0 && (
                <Box sx={{ py: 6, textAlign: 'center' }}>
                  <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Detailed view for this tab is under construction.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  const renderListView = () => (
    <Box>
      {/* Layer 1: Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
          Department Faculty
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search faculty..."
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
              sx: { borderRadius: 3, bgcolor: theme.custom?.surface?.card || '#fff' }
            }}
          />
          <Button variant="contained" startIcon={<AddIcon />} sx={{ borderRadius: 3, fontWeight: 700, px: 3 }}>
            Assign Faculty
          </Button>
        </Box>
      </Box>

      {/* Layer 2: Faculty Cards Grid */}
      <Grid container spacing={3}>
        {filteredFaculty.map((faculty) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={faculty.id}>
            <Card 
              onClick={() => setSelectedFaculty(faculty)}
              sx={{ 
                borderRadius: 4, 
                bgcolor: theme.custom?.surface?.card || '#fff',
                boxShadow: theme.custom?.elevation?.card || 1,
                border: `1px solid ${theme.custom?.border?.subtle || '#e0e0e0'}`,
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.custom?.elevation?.glow || 3,
                  borderColor: theme.palette.primary.main
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Avatar sx={{ width: 56, height: 56, bgcolor: theme.palette.primary.main, fontWeight: 700, fontSize: 24 }}>
                    {faculty.name[0]}
                  </Avatar>
                  <IconButton size="small"><MoreVertIcon /></IconButton>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
                  {faculty.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 2 }}>
                  {faculty.title}
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    CREDITS
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800 }}>
                    {faculty.credits}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 3 }}>
                  {faculty.subjects.slice(0, 2).map((sub, i) => (
                    <Chip key={i} label={sub} size="small" sx={{ borderRadius: 1.5, fontSize: '0.7rem', fontWeight: 600 }} />
                  ))}
                  {faculty.subjects.length > 2 && (
                    <Chip label={`+${faculty.subjects.length - 2}`} size="small" sx={{ borderRadius: 1.5, fontSize: '0.7rem', fontWeight: 600 }} />
                  )}
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip 
                    label={faculty.status} 
                    color={faculty.status === 'Active' ? 'success' : 'warning'} 
                    size="small" 
                    sx={{ fontWeight: 700, borderRadius: 1.5, height: 24, fontSize: '0.7rem' }} 
                  />
                  <Typography variant="caption" color="primary" sx={{ fontWeight: 700 }}>
                    View Profile &rarr;
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 2, md: 3 } }}>
      {selectedFaculty ? renderProfileView() : renderListView()}
    </Box>
  );
};

export default FacultyHub;
