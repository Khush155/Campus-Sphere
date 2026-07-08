import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Divider,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Assessment as ReportIcon,
  PictureAsPdf as PdfIcon,
  TableView as ExcelIcon,
  School as AcademicIcon,
  AttachMoney as FinanceIcon,
  People as FacultyIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';

const ReportsHub = () => {
  const [snackbar, setSnackbar] = useState(false);

  const handleGenerate = () => {
    setSnackbar(true);
  };

  const reportCategories = [
    {
      title: 'Academic Reports',
      icon: <AcademicIcon color="primary" sx={{ fontSize: 32 }} />,
      reports: [
        { name: 'Semester Attendance Analysis', date: 'July 10, 2026' },
        { name: 'Mid-Term Result Distribution', date: 'July 05, 2026' },
      ]
    },
    {
      title: 'Financial Reports',
      icon: <FinanceIcon color="success" sx={{ fontSize: 32 }} />,
      reports: [
        { name: 'Monthly Fee Collection', date: 'July 01, 2026' },
        { name: 'Defaulters List (Odd Semester)', date: 'June 28, 2026' },
      ]
    },
    {
      title: 'Faculty Reports',
      icon: <FacultyIcon color="secondary" sx={{ fontSize: 32 }} />,
      reports: [
        { name: 'Workload & Subject Allocation', date: 'June 15, 2026' },
        { name: 'Faculty Leave Summary', date: 'June 10, 2026' },
      ]
    }
  ];

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, md: 3 } }}>
      <Box sx={{ mb: 4, display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReportIcon fontSize="large" color="primary" />
            Reports & Analytics
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Generate and download institutional performance metrics.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<DownloadIcon />} sx={{ borderRadius: 2 }} onClick={handleGenerate}>
          Generate Custom Report
        </Button>
      </Box>

      <Grid container spacing={3}>
        {reportCategories.map((category) => (
          <Grid item xs={12} md={4} key={category.title}>
            <Card sx={{ height: '100%', borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <Box sx={{ p: 1.5, bgcolor: 'background.default', borderRadius: 3 }}>
                    {category.icon}
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>{category.title}</Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {category.reports.map((report) => (
                    <Box key={report.name} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>{report.name}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                        Generated: {report.date}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button size="small" variant="outlined" startIcon={<PdfIcon />} onClick={handleGenerate} sx={{ borderRadius: 2, flexGrow: 1, color: 'error.main', borderColor: 'error.main', '&:hover': { bgcolor: 'error.light', borderColor: 'error.main' } }}>
                          PDF
                        </Button>
                        <Button size="small" variant="outlined" startIcon={<ExcelIcon />} onClick={handleGenerate} sx={{ borderRadius: 2, flexGrow: 1, color: 'success.main', borderColor: 'success.main', '&:hover': { bgcolor: 'success.light', borderColor: 'success.main' } }}>
                          Excel
                        </Button>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      <Snackbar open={snackbar} autoHideDuration={3000} onClose={() => setSnackbar(false)}>
        <Alert onClose={() => setSnackbar(false)} severity="success" sx={{ width: '100%' }}>
          Report generation started. Check your downloads shortly.
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ReportsHub;
