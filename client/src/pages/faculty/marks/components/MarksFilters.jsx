// client/src/pages/faculty/marks/components/MarksFilters.jsx
//
// Presentational component wrapping course dropdowns, assessment type selections,
// and specific assessment item dropdowns. Reuses selectors from Attendance module.

import React from 'react';
import {
  Paper,
  Grid,
  Box,
  TextField,
  MenuItem,
} from '@mui/material';

// Reuse selectors from Attendance module
import SubjectSelector from '../../attendance/components/SubjectSelector';
import SectionSelector from '../../attendance/components/SectionSelector';
import { ASSESSMENT_TYPE_OPTIONS } from '../mockData';

export const MarksFilters = ({
  subjects = [],
  selectedSubjectId,
  onSubjectChange,
  sections = [],
  selectedSectionId,
  onSectionChange,
  assessmentType,
  onAssessmentTypeChange,
  assessments = [],
  selectedAssessmentId,
  onAssessmentChange,
}) => {
  return (
    <Box sx={{ mb: 3 }}>
      <Paper sx={{ p: 3 }} elevation={0} variant="outlined">
        <Grid container spacing={3}>
          {/* Subject Dropdown */}
          <Grid item xs={12} sm={6} md={3}>
            <SubjectSelector
              subjects={subjects}
              selectedSubjectId={selectedSubjectId}
              onSubjectChange={onSubjectChange}
            />
          </Grid>

          {/* Section Dropdown */}
          <Grid item xs={12} sm={6} md={3}>
            <SectionSelector
              sections={sections}
              selectedSectionId={selectedSectionId}
              onSectionChange={onSectionChange}
              disabled={!selectedSubjectId}
            />
          </Grid>

          {/* Assessment Type Toggle */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              label="Assessment Type"
              value={assessmentType}
              onChange={(e) => onAssessmentTypeChange(e.target.value)}
              disabled={!selectedSubjectId || !selectedSectionId}
              size="small"
              InputLabelProps={{ shrink: true }}
            >
              <MenuItem value="">
                <em>Select Type</em>
              </MenuItem>
              {ASSESSMENT_TYPE_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Assessment Selector */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              label="Select Assessment"
              value={selectedAssessmentId}
              onChange={(e) => onAssessmentChange(e.target.value)}
              disabled={!selectedSubjectId || !selectedSectionId || !assessmentType}
              size="small"
              InputLabelProps={{ shrink: true }}
              helperText={
                !assessmentType
                  ? 'Select type first'
                  : assessments.length === 0
                  ? 'No published items found'
                  : ''
              }
            >
              <MenuItem value="">
                <em>Select Item</em>
              </MenuItem>
              {assessments.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.title} (Max: {item.maxMarks}M)
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default MarksFilters;
