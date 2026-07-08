import React, { useState } from 'react';
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
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  CircularProgress,
  IconButton,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Business as BusinessIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other} style={{ flexGrow: 1, overflowY: 'auto' }}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const DepartmentsHub = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState(null);
  const [detailTab, setDetailTab] = useState(0);

  // Fetch departments data (we will re-use college-admin stats for now or departments query)
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['collegeAdminStats'],
    queryFn: async () => {
      const response = await api.get('/dashboard/college-admin');
      return response.data.data;
    },
  });

  const departments = dashboardData?.departmentStats || [];

  const filteredDepartments = departments.filter(dept => 
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    dept.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDetail = (dept) => {
    setSelectedDept(dept);
    setDetailTab(0);
  };

  const handleCloseDetail = () => {
    setSelectedDept(null);
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, md: 3 } }}>
      <Box sx={{ mb: 4, display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, color: 'text.primary' }}>
            Departments
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage institutional departments and view analytics.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            size="small"
            placeholder="Search Department"
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
            Add Department
          </Button>
        </Box>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredDepartments.map((dept) => (
            <Grid item xs={12} sm={6} md={4} key={dept.id}>
              <Card 
                sx={{ 
                  borderRadius: 4, 
                  boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'translateY(-4px)' }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', mr: 2, width: 50, height: 50 }}>
                      <BusinessIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                        {dept.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                        {dept.code}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, bgcolor: 'background.default', p: 1.5, borderRadius: 2 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>{dept.studentsCount}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>STUDENTS</Typography>
                    </Box>
                    <Divider orientation="vertical" flexItem />
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>{dept.facultyCount}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>FACULTY</Typography>
                    </Box>
                  </Box>

                  <Button 
                    fullWidth 
                    variant="outlined" 
                    sx={{ borderRadius: 2 }}
                    onClick={() => handleOpenDetail(dept)}
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
          {filteredDepartments.length === 0 && (
             <Grid item xs={12}>
               <Typography variant="body1" color="text.secondary" align="center" sx={{ mt: 4 }}>
                 No departments found matching your search.
               </Typography>
             </Grid>
          )}
        </Grid>
      )}

      {/* Department Detail Dialog (simulating a drawer/page overlay) */}
      <Dialog 
        open={Boolean(selectedDept)} 
        onClose={handleCloseDetail}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 4, height: '80vh', display: 'flex', flexDirection: 'column' }
        }}
      >
        {selectedDept && (
          <>
            <DialogTitle sx={{ pb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>{selectedDept.name} Department</Typography>
                  <Typography variant="body2" color="text.secondary">Code: {selectedDept.code}</Typography>
                </Box>
              </Box>
            </DialogTitle>
            
            <Box sx={{ px: 3, borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={detailTab} onChange={(e, v) => setDetailTab(v)} variant="scrollable" scrollButtons="auto">
                <Tab label="Overview" sx={{ fontWeight: 600 }} />
                <Tab label="Faculty" sx={{ fontWeight: 600 }} />
                <Tab label="Students" sx={{ fontWeight: 600 }} />
                <Tab label="Subjects" sx={{ fontWeight: 600 }} />
                <Tab label="Reports" sx={{ fontWeight: 600 }} />
              </Tabs>
            </Box>

            <DialogContent sx={{ flexGrow: 1, p: 3, bgcolor: 'background.default' }}>
              <TabPanel value={detailTab} index={0}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={4}>
                    <Card sx={{ p: 2, textAlign: 'center', borderRadius: 3 }} elevation={0}>
                      <PeopleIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="h4" sx={{ fontWeight: 800 }}>{selectedDept.studentsCount}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>Total Students</Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Card sx={{ p: 2, textAlign: 'center', borderRadius: 3 }} elevation={0}>
                      <SchoolIcon color="secondary" sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="h4" sx={{ fontWeight: 800 }}>{selectedDept.facultyCount}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>Total Faculty</Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Card sx={{ p: 2, textAlign: 'center', borderRadius: 3 }} elevation={0}>
                      <BusinessIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="h4" sx={{ fontWeight: 800 }}>24</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>Total Subjects</Typography>
                    </Card>
                  </Grid>
                </Grid>
              </TabPanel>

              <TabPanel value={detailTab} index={1}>
                <Typography variant="body1" color="text.secondary">Faculty roster details will be displayed here.</Typography>
              </TabPanel>
              
              <TabPanel value={detailTab} index={2}>
                <Typography variant="body1" color="text.secondary">Student roster details will be displayed here.</Typography>
              </TabPanel>

              <TabPanel value={detailTab} index={3}>
                <Typography variant="body1" color="text.secondary">Subjects list will be displayed here.</Typography>
              </TabPanel>

              <TabPanel value={detailTab} index={4}>
                <Typography variant="body1" color="text.secondary">Departmental reports will be displayed here.</Typography>
              </TabPanel>
            </DialogContent>
            
            <DialogActions sx={{ p: 2, bgcolor: 'background.paper', borderTop: '1px solid', borderColor: 'divider' }}>
              <Button onClick={handleCloseDetail} variant="outlined" sx={{ borderRadius: 2 }}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default DepartmentsHub;
