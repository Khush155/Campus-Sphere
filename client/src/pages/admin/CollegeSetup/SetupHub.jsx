import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Button,
  useTheme,
  Card,
  Chip,
} from '@mui/material';
import {
  AddOutlined,
  BusinessOutlined,
  SchoolOutlined,
  AccountTreeOutlined,
  MenuBookOutlined,
  SettingsOutlined,
} from '@mui/icons-material';
import DeptTab from './DeptTab';
import CourseTab from './CourseTab';
import BranchTab from './BranchTab';
import SubjectTab from './SubjectTab';
import {
  useDepartmentsQuery,
  useCoursesQuery,
  useBranchesQuery,
  useSubjectsQuery,
} from '../../../queries/collegeQueries';

export const SetupHub = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { tab } = useParams();

  const [onAddClick, setOnAddClick] = useState(null);

  // Queries for live counts
  const { data: depts } = useDepartmentsQuery();
  const { data: courses } = useCoursesQuery();
  const { data: branches } = useBranchesQuery();
  const { data: subjects } = useSubjectsQuery();

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
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      {/* ── 1. Hero Header Banner Card ─────────────────────────────────────── */}
      <Card
        sx={{
          p: 3.5,
          borderRadius: '16px',
          border: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
          background: `linear-gradient(135deg, ${theme.palette.primary.main}0F 0%, ${theme.palette.brass?.[500] || '#b8863e'}08 100%)`,
          boxShadow: theme.custom?.elevation?.raised || 'none',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, flexWrap: 'wrap' }}>
            <Chip
              icon={<SettingsOutlined sx={{ fontSize: '0.9rem !important', color: `${theme.palette.primary.main} !important` }} />}
              label="INSTITUTIONAL ARCHITECTURE SETUP"
              size="small"
              sx={{
                bgcolor: `${theme.palette.primary.main}15`,
                color: theme.palette.primary.main,
                fontFamily: theme.typography.mono.fontFamily,
                fontWeight: 700,
                fontSize: '0.68rem',
                letterSpacing: '0.06em',
                borderRadius: '6px',
              }}
            />
            {/* Live Count Badges */}
            <Chip
              label={`${depts?.length || 0} Departments`}
              size="small"
              sx={{
                bgcolor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                fontFamily: theme.typography.mono.fontFamily,
                fontSize: '0.72rem',
                fontWeight: 600,
              }}
            />
            <Chip
              label={`${courses?.length || 0} Degree Courses`}
              size="small"
              sx={{
                bgcolor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                fontFamily: theme.typography.mono.fontFamily,
                fontSize: '0.72rem',
                fontWeight: 600,
              }}
            />
            <Chip
              label={`${branches?.length || 0} Branches`}
              size="small"
              sx={{
                bgcolor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                fontFamily: theme.typography.mono.fontFamily,
                fontSize: '0.72rem',
                fontWeight: 600,
              }}
            />
            <Chip
              label={`${subjects?.length || 0} Curriculum Subjects`}
              size="small"
              sx={{
                bgcolor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                fontFamily: theme.typography.mono.fontFamily,
                fontSize: '0.72rem',
                fontWeight: 600,
              }}
            />
          </Box>

          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontFamily: theme.typography.h1.fontFamily,
              fontWeight: 600,
              color: theme.palette.ink[900],
              lineHeight: 1.15,
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
              maxWidth: 640,
            }}
          >
            Configure institutional departments, degree courses, academic branches, and curriculum subject allocations.
          </Typography>
        </Box>

        {onAddClick && (
          <Button
            variant="contained"
            startIcon={<AddOutlined />}
            onClick={() => onAddClick()}
            sx={{
              background: theme.palette.primary.gradient || theme.palette.primary.main,
              color: '#ffffff',
              fontWeight: 700,
              px: 3,
              py: 1.25,
              borderRadius: '8px',
              textTransform: 'none',
              boxShadow: `0 4px 16px ${theme.palette.primary.main}40`,
              '&:hover': {
                filter: 'brightness(1.1)',
              },
            }}
          >
            {getButtonLabel()}
          </Button>
        )}
      </Card>

      {/* ── 2. Tabs Selector ──────────────────────────────────────────────── */}
      <Card
        sx={{
          px: 2,
          py: 0.5,
          borderRadius: '12px',
          border: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
          bgcolor: theme.custom?.surface?.raised || theme.palette.background.paper,
        }}
      >
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          aria-label="college configuration tabs"
          sx={{
            minHeight: 48,
            '& .MuiTab-root': {
              fontFamily: theme.typography.body1.fontFamily,
              fontWeight: 600,
              fontSize: '0.88rem',
              textTransform: 'none',
              minHeight: 48,
              py: 1,
              px: 2.5,
              color: theme.palette.text.secondary,
              transition: 'all 0.2s ease',
              '&:hover': {
                color: theme.palette.primary.main,
              },
              '&.Mui-selected': {
                color: theme.palette.primary.main,
                fontWeight: 700,
              },
            },
            '& .MuiTabs-indicator': {
              bgcolor: theme.palette.primary.main,
              height: 3,
              borderRadius: '3px 3px 0 0',
            },
          }}
        >
          <Tab
            icon={<BusinessOutlined sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label="Departments"
            value="departments"
            id="departments-tab"
          />
          <Tab
            icon={<SchoolOutlined sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label="Courses"
            value="courses"
            id="courses-tab"
          />
          <Tab
            icon={<AccountTreeOutlined sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label="Branches"
            value="branches"
            id="branches-tab"
          />
          <Tab
            icon={<MenuBookOutlined sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label="Subjects"
            value="subjects"
            id="subjects-tab"
          />
        </Tabs>
      </Card>

      {/* ── 3. Tab Screen Content ─────────────────────────────────────────── */}
      <Box sx={{ mt: 0.5 }}>{renderTabContent()}</Box>
    </Box>
  );
};

export default SetupHub;
