import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Tabs, Tab, Button, useTheme } from '@mui/material';
import { AddOutlined } from '@mui/icons-material';
import DeptTab from './DeptTab';
import CourseTab from './CourseTab';
import BranchTab from './BranchTab';
import SubjectTab from './SubjectTab';

export const SetupHub = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { tab } = useParams();

  const [onAddClick, setOnAddClick] = useState(null);

  // Binds the active tab, defaulting to departments
  const currentTab = tab || 'departments';

  const handleTabChange = (event, newValue) => {
    navigate(`/admin/college-setup/${newValue}`);
  };

  const getButtonLabel = () => {
    switch (currentTab) {
      case 'departments':
        return 'Add Department';
      case 'courses':
        return 'Add Course';
      case 'branches':
        return 'Add Branch';
      case 'subjects':
        return 'Add Subject';
      default:
        return 'Add';
    }
  };

  const renderTabContent = () => {
    switch (currentTab) {
      case 'departments':
        return <DeptTab setOnAddClick={setOnAddClick} />;
      case 'courses':
        return <CourseTab setOnAddClick={setOnAddClick} />;
      case 'branches':
        return <BranchTab setOnAddClick={setOnAddClick} />;
      case 'subjects':
        return <SubjectTab setOnAddClick={setOnAddClick} />;
      default:
        return <DeptTab setOnAddClick={setOnAddClick} />;
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Header Row */}
      <Box>
        <Typography
          variant="h4"
          component="h2"
          sx={{
            fontFamily: theme.typography.h1.fontFamily,
            fontWeight: 600,
            color: theme.palette.ink[900],
            mb: 0.5,
          }}
        >
          College Configuration
        </Typography>
        <Typography
          variant="body2"
          sx={{
            fontFamily: theme.typography.body2.fontFamily,
            color: theme.palette.text.secondary,
          }}
        >
          Manage institutional structures, degree courses, academic branches, and curriculum subjects.
        </Typography>
      </Box>

      {/* Tabs Selector & Dynamic Add Action Button */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: 1,
          borderColor: 'divider',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          aria-label="college configuration tabs"
          sx={{
            '& .MuiTab-root': {
              fontFamily: theme.typography.body2.fontFamily,
              fontWeight: 600,
              fontSize: '0.88rem',
              textTransform: 'none',
              color: theme.palette.text.secondary,
              '&.Mui-selected': {
                color: theme.palette.primary.main,
              },
            },
            '& .MuiTabs-indicator': {
              bgcolor: theme.palette.primary.main,
            },
          }}
        >
          <Tab label="Departments" value="departments" id="departments-tab" />
          <Tab label="Courses" value="courses" id="courses-tab" />
          <Tab label="Branches" value="branches" id="branches-tab" />
          <Tab label="Subjects" value="subjects" id="subjects-tab" />
        </Tabs>

        {onAddClick && (
          <Button
            variant="contained"
            startIcon={<AddOutlined />}
            onClick={() => onAddClick()}
            sx={{
              bgcolor: theme.palette.primary.main,
              color: theme.palette.ink[900],
              fontWeight: 700,
              textTransform: 'none',
              px: 2.5,
              mb: 0.5,
              '&:hover': { bgcolor: theme.palette.primary.light },
            }}
          >
            {getButtonLabel()}
          </Button>
        )}
      </Box>

      {/* Tab Screen Content */}
      <Box sx={{ mt: 1 }}>{renderTabContent()}</Box>
    </Box>
  );
};

export default SetupHub;
