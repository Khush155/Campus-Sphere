// client/src/pages/faculty/attendance/components/SectionSelector.jsx

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
  sections = [],
  selectedSectionId,
  onSectionChange,
  disabled = false,
  helperText,
  size,
}) => {
  const handleChange = (event) => {
    onSectionChange(event.target.value);
  };

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
        '& .MuiOutlinedInput-root': {
          borderRadius: '10px',
        },
        '& .MuiSelect-select': {
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        },
      }}
    >
      <MenuItem value="" disabled>
        <Typography variant="body2" color="text.secondary">
          — Select a section —
        </Typography>
      </MenuItem>

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
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {section.name}
            </Typography>

            <Chip
              label={`${section.strength} students`}
              size="small"
              sx={{
                fontWeight: 700,
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

