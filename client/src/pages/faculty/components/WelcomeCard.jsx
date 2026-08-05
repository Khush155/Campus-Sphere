import React from 'react';
import { Box, Typography, Card, Chip, Button, useTheme } from '@mui/material';
import { SchoolOutlined, FactCheckOutlined, DateRangeOutlined } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export const WelcomeCard = ({ facultyName, designation, departmentName }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Card
      sx={{
        p: 3.5,
        mb: 3.5,
        borderRadius: '16px',
        border: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
        background: `linear-gradient(135deg, ${theme.palette.primary.main}0D 0%, ${theme.palette.brass?.[500] || '#b8863e'}0A 100%)`,
        boxShadow: 'none',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, flexWrap: 'wrap' }}>
            <Chip
              icon={<SchoolOutlined sx={{ fontSize: '0.9rem !important', color: `${theme.palette.primary.main} !important` }} />}
              label="FACULTY PROFESSOR & TEACHING WORKSPACE"
              size="small"
              sx={{
                bgcolor: `${theme.palette.primary.main}15`,
                color: theme.palette.primary.main,
                fontWeight: 800,
                fontFamily: theme.typography.mono.fontFamily,
                letterSpacing: '0.05em',
                fontSize: '0.7rem',
              }}
            />
            {departmentName && (
              <Chip
                label={departmentName}
                size="small"
                variant="outlined"
                sx={{ fontWeight: 700, fontSize: '0.7rem' }}
              />
            )}
          </Box>

          <Typography variant="h4" sx={{ fontFamily: theme.typography.h1.fontFamily, fontWeight: 800, color: theme.palette.ink[900] }}>
            Welcome back, {facultyName || 'Professor'}!
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
            {designation || 'Faculty Member'} • Track today&apos;s lectures, student attendance rates, course materials, and grade submissions.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<DateRangeOutlined />}
            onClick={() => navigate('/timetable')}
            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
          >
            My Timetable
          </Button>
          <Button
            variant="contained"
            startIcon={<FactCheckOutlined />}
            onClick={() => navigate('/attendance')}
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 700,
              background: theme.palette.primary.gradient || theme.palette.primary.main,
              color: '#ffffff',
            }}
          >
            Mark Attendance
          </Button>
        </Box>
      </Box>
    </Card>
  );
};

export default WelcomeCard;