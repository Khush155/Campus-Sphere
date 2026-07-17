// client/src/pages/faculty/assignments/components/AssignmentForm.jsx
//
// Reusable presentational form for creating, editing, and duplicating assignments.
// Manages local input states, field validations, and handles formatting.

import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Grid,
  Checkbox,
  FormGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  FormHelperText,
} from '@mui/material';
/**
 * Generates an ISO string for a date 7 days from now,
 * formatted to fit the input type="datetime-local" (YYYY-MM-DDTHH:mm).
 */
const getDefaultDueDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  date.setHours(23, 59, 0, 0);
  
  // Format to YYYY-MM-DDTHH:mm using local timezone offsets
  const tzOffset = date.getTimezoneOffset() * 60000;
  const localISOTime = new Date(date - tzOffset).toISOString().slice(0, 16);
  return localISOTime;
};

export const AssignmentForm = ({
  initialValues,
  availableSections = [],
  onSubmit,
  onCancel,
  submitText = 'Submit',
  isSubmitting = false,
}) => {

  // ══════════════════════════════════════════════════════════
  // LOCAL STATE
  // ══════════════════════════════════════════════════════════
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [maxMarks, setMaxMarks] = useState(100);
  const [dueDate, setDueDate] = useState(getDefaultDueDate());
  const [selectedSectionIds, setSelectedSectionIds] = useState([]);
  
  // Validation errors
  const [errors, setErrors] = useState({});

  // ══════════════════════════════════════════════════════════
  // INITIALIZATION / UPDATES (Watch for edit inputs)
  // ══════════════════════════════════════════════════════════
  useEffect(() => {
    if (initialValues) {
      setTitle(initialValues.title || '');
      setDescription(initialValues.description || '');
      setMaxMarks(initialValues.maxMarks ?? 100);
      
      // Convert standard ISO date to input compatible datetime-local string
      if (initialValues.dueDate) {
        const date = new Date(initialValues.dueDate);
        const tzOffset = date.getTimezoneOffset() * 60000;
        const localTime = new Date(date - tzOffset).toISOString().slice(0, 16);
        setDueDate(localTime);
      } else {
        setDueDate(getDefaultDueDate());
      }

      setSelectedSectionIds(initialValues.sectionIds || []);
    } else {
      // Clear form for fresh creates
      setTitle('');
      setDescription('');
      setMaxMarks(100);
      setDueDate(getDefaultDueDate());
      setSelectedSectionIds([]);
    }
    setErrors({});
  }, [initialValues]);

  // ══════════════════════════════════════════════════════════
  // INPUT HANDLERS
  // ══════════════════════════════════════════════════════════
  const handleSectionToggle = (sectionId) => {
    setSelectedSectionIds((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  // Validate the inputs locally
  const validateForm = () => {
    const newErrors = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.length > 100) {
      newErrors.title = 'Title cannot exceed 100 characters';
    }

    if (maxMarks === '' || isNaN(maxMarks) || Number(maxMarks) <= 0) {
      newErrors.maxMarks = 'Max Marks must be a number greater than 0';
    }

    if (!dueDate) {
      newErrors.dueDate = 'Due Date is required';
    } else if (new Date(dueDate) <= new Date()) {
      newErrors.dueDate = 'Due Date must be in the future';
    }

    if (selectedSectionIds.length === 0) {
      newErrors.sections = 'Select at least one section';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Package payload (convert local datetime picker back to full ISO standard string)
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      maxMarks: Number(maxMarks),
      dueDate: new Date(dueDate).toISOString(),
      sectionIds: selectedSectionIds,
    });
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
      <Grid container spacing={2.5}>
        {/* Title */}
        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            label="Assignment Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={!!errors.title}
            helperText={errors.title}
            size="small"
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        {/* Max Marks */}
        <Grid item xs={12} sm={6}>
          <TextField
            required
            fullWidth
            type="number"
            label="Max Marks"
            value={maxMarks}
            onChange={(e) => setMaxMarks(e.target.value)}
            error={!!errors.maxMarks}
            helperText={errors.maxMarks}
            size="small"
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        {/* Due Date */}
        <Grid item xs={12} sm={6}>
          <TextField
            required
            fullWidth
            type="datetime-local"
            label="Due Date & Time"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            error={!!errors.dueDate}
            helperText={errors.dueDate}
            size="small"
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        {/* Target Sections */}
        <Grid item xs={12}>
          <FormControl required error={!!errors.sections} component="fieldset" variant="standard">
            <FormLabel component="legend" sx={{ fontSize: '0.85rem', fontWeight: 600, mb: 0.5 }}>
              Target Sections (Assigned to)
            </FormLabel>
            <FormGroup row>
              {availableSections.map((section) => (
                <FormControlLabel
                  key={section.id}
                  control={
                    <Checkbox
                      checked={selectedSectionIds.includes(section.id)}
                      onChange={() => handleSectionToggle(section.id)}
                      size="small"
                    />
                  }
                  label={section.name}
                  sx={{
                    '& .MuiFormControlLabel-label': {
                      fontSize: '0.85rem',
                      fontWeight: 500,
                    },
                  }}
                />
              ))}
            </FormGroup>
            {errors.sections && <FormHelperText>{errors.sections}</FormHelperText>}
          </FormControl>
        </Grid>

        {/* Description */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Instructions & Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            size="small"
            InputLabelProps={{ shrink: true }}
            placeholder="Provide submission guidelines, resource links, and instructions..."
          />
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
        <Button
          variant="outlined"
          color="inherit"
          onClick={onCancel}
          disabled={isSubmitting}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={isSubmitting}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            bgcolor: '#4f46e5',
            '&:hover': { bgcolor: '#4338ca' },
          }}
        >
          {isSubmitting ? 'Saving...' : submitText}
        </Button>
      </Box>
    </Box>
  );
};

export default AssignmentForm;
