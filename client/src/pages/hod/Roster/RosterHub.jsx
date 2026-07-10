import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Tabs, 
  Tab, 
  Paper, 
  InputAdornment, 
  TextField,
  useTheme
} from '@mui/material';
import { Search as SearchIcon, School as SchoolIcon, People as PeopleIcon, FilterList as FilterListIcon } from '@mui/icons-material';
import RosterTable from './RosterTable';
import RosterFilters from './RosterFilters';

const RosterHub = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // Batch Filters
  const [filters, setFilters] = useState({
    course: '',
    branch: '',
    semester: '',
    group: ''
  });

  // Handle Tab Switch
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setSearchQuery('');
    setDebouncedSearch('');
    // Reset filters when switching roles
    setFilters({ course: '', branch: '', semester: '', group: '' });
  };

  // Debounce search
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const activeRole = activeTab === 0 ? 'FACULTY' : 'STUDENT';

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 1, sm: 3 } }}>
      <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'flex-end' }, gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: theme.palette.text.primary }}>
            Department Roster
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View all faculty and students belonging to your department.
          </Typography>
        </Box>
        
        <TextField
          placeholder="Search by name or email..."
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ width: { xs: '100%', md: 300 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            sx: { borderRadius: 2 }
          }}
        />
      </Box>

      {/* Batch Filters */}
      <Box sx={{ mb: 3 }}>
        <RosterFilters 
          filters={filters} 
          onFilterChange={setFilters} 
          role={activeRole} 
        />
      </Box>

      <Paper sx={{ borderRadius: 3, overflow: 'hidden', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, bgcolor: theme.palette.mode === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)' }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab 
              icon={<SchoolIcon sx={{ mr: 1, mb: '0 !important' }} fontSize="small" />} 
              label="Faculty" 
              iconPosition="start" 
              sx={{ minHeight: 60, fontWeight: 600 }}
            />
            <Tab 
              icon={<PeopleIcon sx={{ mr: 1, mb: '0 !important' }} fontSize="small" />} 
              label="Students" 
              iconPosition="start" 
              sx={{ minHeight: 60, fontWeight: 600 }}
            />
          </Tabs>
        </Box>
        
        <Box sx={{ p: 0 }}>
          <RosterTable 
            role={activeRole} 
            searchQuery={debouncedSearch} 
            batchFilters={filters} 
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default RosterHub;
