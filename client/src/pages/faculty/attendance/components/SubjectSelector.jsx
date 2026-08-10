// client/src/pages/faculty/attendance/components/SubjectSelector.jsx

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
  subjects = [],
  selectedSubjectId,
  onSubjectChange,
  disabled = false,
  helperText,
  size,
}) => {
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
          — Select a subject —
        </Typography>
      </MenuItem>

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
            <Typography
              variant="body2"
              sx={{
                fontWeight: 700,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
              }}
            >
              {subject.name}
            </Typography>

            <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
              {subject.code && (
                <Chip
                  label={subject.code}
                  size="small"
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    height: 22,
                    bgcolor: 'rgba(79, 70, 229, 0.08)',
                    color: 'primary.main',
                  }}
                />
              )}
              {subject.credits !== undefined &&
                subject.credits !== null &&
                subject.credits !== 'undefined' &&
                Boolean(subject.credits) && (
                  <Chip
                    label={`${subject.credits} Cr`}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.7rem',
                      height: 22,
                      bgcolor: 'rgba(6, 182, 212, 0.08)',
                      color: 'secondary.main',
                    }}
                  />
                )}
            </Box>
          </Box>
        </MenuItem>
      ))}
    </TextField>
  );
};

export default SubjectSelector;

