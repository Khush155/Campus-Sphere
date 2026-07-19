// client/src/pages/faculty/exams/components/ExamFilters.jsx
//
// Presentational component wrapping search inputs and lifecycle status tabs.

import React from 'react';
import {
  Paper,
  Box,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

export const ExamFilters = ({
  statusFilter,
  onStatusFilterChange,
  searchQuery,
  onSearchQueryChange,
}) => {
  return (
    <Box sx={{ mb: 3 }}>
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
          <Tab label="Ongoing" value="ONGOING" />
          <Tab label="Completed" value="COMPLETED" />
          <Tab label="Archived" value="ARCHIVED" />
        </Tabs>

        {/* Search Query Input */}
        <TextField
          placeholder="Search exams..."
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
    </Box>
  );
};

export default ExamFilters;
