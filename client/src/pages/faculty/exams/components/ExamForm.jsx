// client/src/pages/faculty/exams/components/ExamForm.jsx
//
// Reusable presentational form for creating, editing, and duplicating exams.
// Manages local state validations and maps academic properties.

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
  MenuItem,
} from '@mui/material';
import { EXAM_TYPE_OPTIONS } from '../examConstants';

/**
 * Generates local compatible datetime string (YYYY-MM-DDTHH:mm) for tomorrow at 10 AM.
 */
const getDefaultExamDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(10, 0, 0, 0);
  
  const tzOffset = date.getTimezoneOffset() * 60000;
  const localISOTime = new Date(date - tzOffset).toISOString().slice(0, 16);
  return localISOTime;
};

export const ExamForm = ({
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
  const [type, setType] = useState('THEORY');
  const [examDate, setExamDate] = useState(getDefaultExamDate());
  const [durationMinutes, setDurationMinutes] = useState(180); // Default 3 hours
  const [roomNumber, setRoomNumber] = useState('');
  const [totalMarks, setTotalMarks] = useState(100);
  const [weightage, setWeightage] = useState(30); // Default 30%
  const [selectedSectionIds, setSelectedSectionIds] = useState([]);
  
  // Validation errors
  const [errors, setErrors] = useState({});

  // ══════════════════════════════════════════════════════════
  // INITIALIZATION / UPDATES
  // ══════════════════════════════════════════════════════════
  useEffect(() => {
    if (initialValues) {
      setTitle(initialValues.title || '');
      setDescription(initialValues.description || '');
      setType(initialValues.type || 'THEORY');
      setDurationMinutes(initialValues.durationMinutes ?? 180);
      setRoomNumber(initialValues.roomNumber || '');
      setTotalMarks(initialValues.totalMarks ?? 100);
      setWeightage(initialValues.weightage ?? 30);
      setSelectedSectionIds(initialValues.sectionIds || []);

      if (initialValues.examDate) {
        const date = new Date(initialValues.examDate);
        const tzOffset = date.getTimezoneOffset() * 60000;
        const localTime = new Date(date - tzOffset).toISOString().slice(0, 16);
        setExamDate(localTime);
      } else {
        setExamDate(getDefaultExamDate());
      }
    } else {
      // Clear form
      setTitle('');
      setDescription('');
      setType('THEORY');
      setExamDate(getDefaultExamDate());
      setDurationMinutes(180);
      setRoomNumber('');
      setTotalMarks(100);
      setWeightage(30);
      setSelectedSectionIds([]);
    }
    setErrors({});
  }, [initialValues]);

  // ══════════════════════════════════════════════════════════
  // HANDLERS
  // ══════════════════════════════════════════════════════════
  const handleSectionToggle = (sectionId) => {
    setSelectedSectionIds((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const validateForm = () => {
    const newErrors = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!roomNumber.trim()) {
      newErrors.roomNumber = 'Room/Venue number is required';
    }

    if (durationMinutes === '' || isNaN(durationMinutes) || Number(durationMinutes) <= 0) {
      newErrors.durationMinutes = 'Duration must be greater than 0';
    }

    if (totalMarks === '' || isNaN(totalMarks) || Number(totalMarks) <= 0) {
      newErrors.totalMarks = 'Total Marks must be greater than 0';
    }

    if (weightage === '' || isNaN(weightage) || Number(weightage) < 0 || Number(weightage) > 100) {
      newErrors.weightage = 'Weightage must be between 0% and 100%';
    }

    if (!examDate) {
      newErrors.examDate = 'Exam date & time is required';
    } else if (new Date(examDate) <= new Date() && !initialValues) {
      // For editing past exams, allow older dates. For creates, enforce future dates.
      newErrors.examDate = 'Exam date must be in the future';
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

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      type,
      examDate: new Date(examDate).toISOString(),
      durationMinutes: Number(durationMinutes),
      roomNumber: roomNumber.trim(),
      totalMarks: Number(totalMarks),
      weightage: Number(weightage),
      sectionIds: selectedSectionIds,
    });
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
      <Grid container spacing={2.5}>
        {/* Exam Title */}
        <Grid item xs={12} sm={8}>
          <TextField
            required
            fullWidth
            label="Exam Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={!!errors.title}
            helperText={errors.title}
            size="small"
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        {/* Exam Type Selection */}
        <Grid item xs={12} sm={4}>
          <TextField
            select
            fullWidth
            required
            label="Exam Type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            size="small"
            InputLabelProps={{ shrink: true }}
          >
            {EXAM_TYPE_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Date & Time */}
        <Grid item xs={12} sm={6}>
          <TextField
            required
            fullWidth
            type="datetime-local"
            label="Exam Date & Time"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
            error={!!errors.examDate}
            helperText={errors.examDate}
            size="small"
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        {/* Duration in Minutes */}
        <Grid item xs={12} sm={6}>
          <TextField
            required
            fullWidth
            type="number"
            label="Duration (Minutes)"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
            error={!!errors.durationMinutes}
            helperText={errors.durationMinutes}
            size="small"
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        {/* Room / Venue */}
        <Grid item xs={12} sm={4}>
          <TextField
            required
            fullWidth
            label="Room / Venue"
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value)}
            error={!!errors.roomNumber}
            helperText={errors.roomNumber}
            size="small"
            InputLabelProps={{ shrink: true }}
            placeholder="e.g. LH-301, Lab-2"
          />
        </Grid>

        {/* Max Marks */}
        <Grid item xs={12} sm={4}>
          <TextField
            required
            fullWidth
            type="number"
            label="Max Marks"
            value={totalMarks}
            onChange={(e) => setTotalMarks(e.target.value)}
            error={!!errors.totalMarks}
            helperText={errors.totalMarks}
            size="small"
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        {/* Weightage Percentage */}
        <Grid item xs={12} sm={4}>
          <TextField
            required
            fullWidth
            type="number"
            label="Weightage (%)"
            value={weightage}
            onChange={(e) => setWeightage(e.target.value)}
            error={!!errors.weightage}
            helperText={errors.weightage}
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

        {/* Description / Instructions */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Exam Instructions"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            size="small"
            InputLabelProps={{ shrink: true }}
            placeholder="Provide guidelines (e.g. calculator allowance, hall ticket validation, seating orders)..."
          />
        </Grid>
      </Grid>

      {/* Actions */}
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

export default ExamForm;
