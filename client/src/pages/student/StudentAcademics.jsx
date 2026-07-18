import React from 'react';
import { Box, Typography, Grid, Card, CardContent, Chip, CircularProgress, Alert, Button } from '@mui/material';
import { MenuBook, Subject, CreditScore, Download } from '@mui/icons-material';
import { useStudentAcademicsQuery } from '../../queries/studentQueries';

const StudentAcademics = () => {
  const { data: subjects, isLoading, isError } = useStudentAcademicsQuery();

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box p={3}>
        <Alert severity="error">Failed to load academic subjects. Please try again later.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: { xs: 1, md: 3 } }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>
        Academics
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Your current semester subjects, syllabus, and academic progression.
      </Typography>

      <Grid container spacing={3}>
        {subjects?.length > 0 ? (
          subjects.map((subject) => (
            <Grid item xs={12} md={6} lg={4} key={subject._id}>
              <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'primary.50', color: 'primary.main' }}>
                      <Subject />
                    </Box>
                    <Chip 
                      label={subject.type} 
                      size="small" 
                      color={subject.type === 'Theory' ? 'primary' : 'secondary'} 
                      variant="outlined" 
                    />
                  </Box>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    {subject.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    {subject.code}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <CreditScore fontSize="small" color="action" />
                    <Typography variant="body2" fontWeight={600}>
                      {subject.credits} Credits
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {subject.description || 'No description available for this subject.'}
                  </Typography>
                </CardContent>
                <Box sx={{ p: 2, pt: 0 }}>
                  <Button 
                    fullWidth 
                    variant="outlined" 
                    startIcon={<Download />}
                    sx={{ borderRadius: 2 }}
                    disabled={!subject.syllabusUrl}
                  >
                    {subject.syllabusUrl ? 'Download Syllabus' : 'Syllabus Unavailable'}
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Box sx={{ textAlign: 'center', p: 4, bgcolor: 'background.paper', borderRadius: 3, border: '1px dashed', borderColor: 'divider' }}>
              <MenuBook sx={{ fontSize: 48, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
              <Typography variant="h6" color="text.secondary">No Subjects Found</Typography>
              <Typography variant="body2" color="text.disabled">
                There are no subjects assigned for your current semester yet.
              </Typography>
            </Box>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default StudentAcademics;
