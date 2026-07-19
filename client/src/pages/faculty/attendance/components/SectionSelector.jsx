// client/src/pages/faculty/attendance/components/SectionSelector.jsx
//
// Dropdown for selecting which section to mark attendance for.
// This is Step 2 of the attendance flow:
//   Subject → Section → Date → Students → Mark → Submit
//
// The selected section determines WHICH students are loaded into
// the StudentAttendanceTable. A faculty may teach the same subject
// to multiple sections (e.g., CSE-A and CSE-B).
//
// This is a CONTROLLED component:
//   - Parent owns selectedSectionId and passes it down.
//   - When the user picks a section, onSectionChange fires.
//   - Changing the subject in SubjectSelector resets the section.
//
// Props:
//   sections          — array of section objects:
//                        [{ id, name, strength }]
//                        name: display name (e.g. "CSE-A")
//                        strength: number of students in section
//   selectedSectionId — currently selected section's ID (string or '')
//   onSectionChange   — callback: (sectionId: string) => void
//   disabled          — optional boolean, disables during submission
//
// Future: sections will come from the faculty's subject-section
//         mapping via GET /api/v1/faculty/:id?populate=sections

import React from 'react';
import {
  TextField,
  MenuItem,
  Box,
  Chip,
  Typography,
  InputAdornment,
} from '@mui/material';
import { Groups as SectionIcon } from '@mui/icons-material';

export const SectionSelector = ({
  sections,
  selectedSectionId,
  onSectionChange,
  disabled = false,
  helperText,
  size,
}) => {
  const handleChange = (event) => {
    onSectionChange(event.target.value);
  };

  // Derive helper text based on available sections
  const getHelperText = () => {
    if (sections.length === 0) {
      return 'Select a subject first';
    }
    if (sections.length === 1) {
      return 'Only one section available — auto-selected';
    }
    return 'Choose the section to mark attendance for';
  };

  return (
    <TextField
      select
      fullWidth
      label="Select Section"
      value={selectedSectionId}
      onChange={handleChange}
      disabled={disabled || sections.length === 0}
      size={size}
      helperText={helperText !== undefined ? helperText : getHelperText()}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SectionIcon
              fontSize="small"
              sx={{ color: selectedSectionId ? 'primary.main' : 'text.secondary' }}
            />
          </InputAdornment>
        ),
      }}
      sx={{
        '& .MuiSelect-select': {
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        },
      }}
    >
      {/* Placeholder option */}
      <MenuItem value="" disabled>
        <Typography variant="body2" color="text.secondary">
          — Select a section —
        </Typography>
      </MenuItem>

      {/* Section options */}
      {sections.map((section) => (
        <MenuItem key={section.id} value={section.id}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              gap: 1.5,
            }}
          >
            {/* Section name */}
            <Typography
              variant="body2"
              sx={{ fontWeight: 600 }}
            >
              {section.name}
            </Typography>

            {/* Student count badge */}
            <Chip
              label={`${section.strength} students`}
              size="small"
              sx={{
                fontWeight: 600,
                fontSize: '0.7rem',
                height: 22,
                bgcolor: 'rgba(16, 185, 129, 0.08)',
                color: '#10b981',
              }}
            />
          </Box>
        </MenuItem>
      ))}
    </TextField>
  );
};

export default SectionSelector;
