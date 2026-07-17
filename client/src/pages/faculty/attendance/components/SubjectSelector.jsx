// client/src/pages/faculty/attendance/components/SubjectSelector.jsx
//
// Dropdown for selecting which subject to mark attendance for.
// This is Step 1 of the attendance flow — everything else depends on
// which subject is selected.
//
// This is a CONTROLLED component:
//   - It does NOT manage its own state.
//   - The parent owns selectedSubjectId and passes it down.
//   - When the user picks a subject, onSubjectChange fires,
//     and the PARENT updates state, which re-renders this component.
//
// Props:
//   subjects          — array of subject objects:
//                        [{ id, name, code, credits }]
//   selectedSubjectId — currently selected subject's ID (string or '')
//   onSubjectChange   — callback: (subjectId: string) => void
//   disabled          — optional boolean, disables during submission
//
// Future: subjects will come from GET /api/v1/faculty/:id → .subjects[]

import React from 'react';
import {
  TextField,
  MenuItem,
  Box,
  Chip,
  Typography,
  InputAdornment,
} from '@mui/material';
import { MenuBook as SubjectIcon } from '@mui/icons-material';

export const SubjectSelector = ({
  subjects,
  selectedSubjectId,
  onSubjectChange,
  disabled = false,
  helperText,
  size,
}) => {
  // Handle the MUI Select change event.
  // MUI's TextField with select passes a standard React change event
  // where event.target.value is the selected MenuItem's value.
  const handleChange = (event) => {
    onSubjectChange(event.target.value);
  };

  return (
    <TextField
      select
      fullWidth
      label="Select Subject"
      value={selectedSubjectId}
      onChange={handleChange}
      disabled={disabled || subjects.length === 0}
      size={size}
      helperText={
        helperText !== undefined
          ? helperText
          : subjects.length === 0
          ? 'No subjects assigned. Contact your HOD.'
          : 'Choose the subject to mark attendance for'
      }
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SubjectIcon
              fontSize="small"
              sx={{ color: selectedSubjectId ? 'primary.main' : 'text.secondary' }}
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
      {/* Placeholder option when nothing is selected */}
      <MenuItem value="" disabled>
        <Typography variant="body2" color="text.secondary">
          — Select a subject —
        </Typography>
      </MenuItem>

      {/* Subject options */}
      {subjects.map((subject) => (
        <MenuItem key={subject.id} value={subject.id}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              gap: 1.5,
            }}
          >
            {/* Subject name */}
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
              }}
            >
              {subject.name}
            </Typography>

            {/* Subject code + credits badges */}
            <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
              <Chip
                label={subject.code}
                size="small"
                sx={{
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  height: 22,
                  bgcolor: 'rgba(79, 70, 229, 0.08)',
                  color: 'primary.main',
                }}
              />
              <Chip
                label={`${subject.credits} Cr`}
                size="small"
                sx={{
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  height: 22,
                  bgcolor: 'rgba(6, 182, 212, 0.08)',
                  color: 'secondary.main',
                }}
              />
            </Box>
          </Box>
        </MenuItem>
      ))}
    </TextField>
  );
};

export default SubjectSelector;
