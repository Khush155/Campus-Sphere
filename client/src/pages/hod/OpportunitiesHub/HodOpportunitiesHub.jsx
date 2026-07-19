import React, { useState } from 'react';
import { 
  Box, Typography, Card, CardContent, Chip, Grid, Button, 
  CircularProgress, Alert, Tabs, Tab, useTheme, TextField, InputAdornment 
} from '@mui/material';
import { OpenInNew, Work, IntegrationInstructions, BusinessCenter, Search } from '@mui/icons-material';
import { useOpportunitiesQuery } from '../../../queries/opportunityQueries';

const HodOpportunitiesHub = () => {
  const theme = useTheme();
  const { data: opportunities, isLoading, isError } = useOpportunitiesQuery();
  const [tabIndex, setTabIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  const getFilteredOpportunities = () => {
    if (!opportunities) return [];
    
    let filtered = opportunities;

    // Apply Tab Type Filter
    if (tabIndex === 1) filtered = filtered.filter(o => o.type === 'HACKATHON');
    if (tabIndex === 2) filtered = filtered.filter(o => o.type === 'INTERNSHIP');
    if (tabIndex === 3) filtered = filtered.filter(o => o.type === 'PLACEMENT');

    // Apply Text Search Filter
    if (searchQuery.trim() !== '') {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(o => 
        o.title.toLowerCase().includes(lowerQuery) || 
        o.organization.toLowerCase().includes(lowerQuery) ||
        o.location.toLowerCase().includes(lowerQuery) ||
        o.source.toLowerCase().includes(lowerQuery)
      );
    }

    return filtered;
  };

  const filteredData = getFilteredOpportunities();

  const getTypeColor = (type) => {
    switch(type) {
      case 'HACKATHON': return 'secondary';
      case 'INTERNSHIP': return 'info';
      case 'PLACEMENT': return 'success';
      default: return 'default';
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'HACKATHON': return <IntegrationInstructions fontSize="small" />;
      case 'INTERNSHIP': return <Work fontSize="small" />;
      case 'PLACEMENT': return <BusinessCenter fontSize="small" />;
      default: return null;
    }
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">Global Opportunities</Typography>
          <Typography variant="body1" color="text.secondary">
            Aggregated external hackathons, internships, and job placements for your students.
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { md: 'center' }, mb: 4, gap: 2 }}>
        <Tabs 
          value={tabIndex} 
          onChange={handleTabChange} 
          sx={{ borderBottom: 1, borderColor: 'divider', flexGrow: 1 }}
        >
          <Tab label="All Opportunities" />
          <Tab label="Hackathons" />
          <Tab label="Internships" />
          <Tab label="Job Placements" />
        </Tabs>
        
        <TextField
          placeholder="Search by title, company, or location..."
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ minWidth: { xs: '100%', md: '300px' } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : isError ? (
        <Alert severity="error">Failed to fetch external opportunities. Please try again.</Alert>
      ) : (
        <Grid container spacing={3}>
          {filteredData.length === 0 ? (
            <Grid item xs={12}>
              <Box sx={{ p: 5, textAlign: 'center' }}>
                <Typography color="text.secondary">No opportunities found in this category right now.</Typography>
              </Box>
            </Grid>
          ) : (
            filteredData.map((opp) => (
              <Grid item xs={12} sm={6} md={4} key={opp.id}>
                <Card 
                  elevation={opp.featured ? 4 : 0} 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    border: `2px solid ${opp.featured ? theme.palette.warning.main : theme.palette.divider}`,
                    borderRadius: 3,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    position: 'relative',
                    overflow: 'visible',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[6]
                    }
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'flex-start' }}>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip 
                          icon={getTypeIcon(opp.type)} 
                          label={opp.type} 
                          color={getTypeColor(opp.type)} 
                          size="small" 
                          variant="outlined" 
                          sx={{ fontWeight: 'bold' }}
                        />
                        {opp.featured && (
                          <Chip 
                            label="PREMIUM EVENT" 
                            color="warning" 
                            size="small" 
                            sx={{ fontWeight: 'bold', animation: 'pulse 2s infinite' }}
                          />
                        )}
                      </Box>
                      <Typography variant="caption" color="text.secondary" fontWeight="bold">
                        {opp.source}
                      </Typography>
                    </Box>
                    <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ minHeight: 60 }}>
                      {opp.title}
                    </Typography>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      {opp.organization}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      <strong>Location:</strong> {opp.location}
                    </Typography>
                    <Typography variant="body2" color="error.main" sx={{ mt: 1 }}>
                      <strong>Deadline:</strong> {new Date(opp.deadline).toLocaleDateString()}
                    </Typography>
                  </CardContent>
                  <Box sx={{ p: 2, pt: 0 }}>
                    <Button 
                      variant="contained" 
                      fullWidth 
                      endIcon={<OpenInNew />}
                      href={opp.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View & Apply
                    </Button>
                  </Box>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      )}
    </Box>
  );
};

export default HodOpportunitiesHub;
