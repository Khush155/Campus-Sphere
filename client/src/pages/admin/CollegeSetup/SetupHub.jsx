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
  Paper,
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
  const isDark = theme.palette.mode === 'dark';

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
        return 'Add Item';
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
      {/* ── 1. Hero Header Banner Card (Glassmorphic Luxury Command Bar) ─── */}
      <Card
        sx={{
          p: 3.5,
          borderRadius: '22px',
          border: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
          background: isDark
            ? 'linear-gradient(135deg, rgba(79, 70, 229, 0.12) 0%, rgba(184, 134, 62, 0.06) 100%)'
            : 'linear-gradient(135deg, rgba(79, 70, 229, 0.06) 0%, rgba(184, 134, 62, 0.04) 100%)',
          backdropFilter: 'blur(12px)',
          boxShadow: theme.custom?.elevation?.raised || '0 8px 24px rgba(0,0,0,0.03)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2.5,
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
                fontFamily: theme.typography.mono?.fontFamily || 'monospace',
                fontWeight: 800,
                fontSize: '0.68rem',
                letterSpacing: '0.06em',
                borderRadius: '8px',
              }}
            />

            {/* Live Counts Badges */}
            <Chip
              label={`${depts?.length || 0} Departments`}
              size="small"
              sx={{
                bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
                border: `1px solid ${theme.palette.divider}`,
                fontFamily: theme.typography.mono?.fontFamily || 'monospace',
                fontSize: '0.72rem',
                fontWeight: 700,
                borderRadius: '6px',
              }}
            />
            <Chip
              label={`${courses?.length || 0} Degree Courses`}
              size="small"
              sx={{
                bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
                border: `1px solid ${theme.palette.divider}`,
                fontFamily: theme.typography.mono?.fontFamily || 'monospace',
                fontSize: '0.72rem',
                fontWeight: 700,
                borderRadius: '6px',
              }}
            />
            <Chip
              label={`${branches?.length || 0} Branches`}
              size="small"
              sx={{
                bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
                border: `1px solid ${theme.palette.divider}`,
                fontFamily: theme.typography.mono?.fontFamily || 'monospace',
                fontSize: '0.72rem',
                fontWeight: 700,
                borderRadius: '6px',
              }}
            />
            <Chip
              label={`${subjects?.length || 0} Curriculum Subjects`}
              size="small"
              sx={{
                bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
                border: `1px solid ${theme.palette.divider}`,
                fontFamily: theme.typography.mono?.fontFamily || 'monospace',
                fontSize: '0.72rem',
                fontWeight: 700,
                borderRadius: '6px',
              }}
            />
          </Box>

          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 800,
              color: 'text.primary',
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
              mb: 0.5,
            }}
          >
            College Academic Configuration
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              maxWidth: 680,
            }}
          >
            Configure institutional academic departments, degree courses, discipline branches, and curriculum subject allocations.
          </Typography>
        </Box>

        {onAddClick && (
          <Button
            variant="contained"
            startIcon={<AddOutlined />}
            onClick={() => onAddClick()}
            sx={{
              fontWeight: 800,
              px: 3,
              py: 1.25,
              borderRadius: '12px',
              textTransform: 'none',
              boxShadow: `0 4px 18px ${theme.palette.primary.main}40`,
            }}
          >
            {getButtonLabel()}
          </Button>
        )}
      </Card>

      {/* ── 2. Modern Navigation Tabs Bar ─────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          px: 2,
          py: 0.75,
          borderRadius: '16px',
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
              fontWeight: 700,
              fontSize: '0.88rem',
              textTransform: 'none',
              minHeight: 48,
              py: 1,
              px: 2.75,
              color: theme.palette.text.secondary,
              transition: 'all 0.2s ease',
              borderRadius: '10px',
              '&:hover': {
                color: theme.palette.primary.main,
                bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(79, 70, 229, 0.04)',
              },
              '&.Mui-selected': {
                color: theme.palette.primary.main,
                fontWeight: 800,
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
            label={`Departments (${depts?.length || 0})`}
            value="departments"
            id="departments-tab"
          />
          <Tab
            icon={<SchoolOutlined sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label={`Courses (${courses?.length || 0})`}
            value="courses"
            id="courses-tab"
          />
          <Tab
            icon={<AccountTreeOutlined sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label={`Branches (${branches?.length || 0})`}
            value="branches"
            id="branches-tab"
          />
          <Tab
            icon={<MenuBookOutlined sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label={`Subjects (${subjects?.length || 0})`}
            value="subjects"
            id="subjects-tab"
          />
        </Tabs>
      </Paper>

      {/* ── 3. Tab Screen Content ─────────────────────────────────────────── */}
      <Box sx={{ mt: 0.5 }}>{renderTabContent()}</Box>
    </Box>
  );
};

export default SetupHub;
