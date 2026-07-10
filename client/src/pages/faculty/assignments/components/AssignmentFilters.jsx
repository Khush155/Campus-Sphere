// client/src/pages/faculty/assignments/components/AssignmentFilters.jsx
//
// Presentational component grouping all course selections, status tabs, and text queries.
// Reuses standard selectors from the Attendance module.

import React from 'react';
import {
  Paper,
  Grid,
  Box,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

// Reuse existing selectors from Attendance module to keep code DRY
import SubjectSelector from '../../attendance/components/SubjectSelector';
import SectionSelector from '../../attendance/components/SectionSelector';

export const AssignmentFilters = ({
  subjects,
  selectedSubjectId,
  onSubjectChange,
  sections,
  selectedSectionId,
  onSectionChange,
  statusFilter,
  onStatusFilterChange,
  searchQuery,
  onSearchQueryChange,
}) => {
  const theme = useTheme();

  return (
    <Box sx={{ mb: 3 }}>
      {/* ── Top Row: Dropdown Selectors ── */}
      <Paper sx={{ p: 3, mb: 2.5 }} elevation={0} variant="outlined">
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <SubjectSelector
              subjects={subjects}
              selectedSubjectId={selectedSubjectId}
              onSubjectChange={onSubjectChange}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <SectionSelector
              sections={sections}
              selectedSectionId={selectedSectionId}
              onSectionChange={onSectionChange}
              disabled={!selectedSubjectId}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* ── Bottom Row: Status Tabs & Search Input ── */}
      {selectedSubjectId && selectedSectionId && (
        <Paper
          elevation={0}
          variant="outlined"
          sx={{
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
            bgcolor: 'background.paper',
          }}
        >
          {/* Status Tabs */}
          <Tabs
            value={statusFilter}
            onChange={(e, val) => onStatusFilterChange(val)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: '3px 3px 0 0',
              },
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.85rem',
                minWidth: 80,
                py: 1.5,
              },
            }}
          >
            <Tab label="All" value="ALL" />
            <Tab label="Published" value="PUBLISHED" />
            <Tab label="Drafts" value="DRAFT" />
            <Tab label="Closed" value="CLOSED" />
            <Tab label="Archived" value="ARCHIVED" />
          </Tabs>

          {/* Search Query Input */}
          <TextField
            placeholder="Search assignments..."
            size="small"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              width: { xs: '100%', sm: 260 },
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                fontSize: '0.85rem',
              },
            }}
          />
        </Paper>
      )}
    </Box>
  );
};

export default AssignmentFilters;
