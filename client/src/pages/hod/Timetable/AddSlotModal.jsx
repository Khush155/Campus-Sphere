import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  Typography,
  Alert,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSubjectsQuery } from '../../../queries/collegeQueries';
import { useAssignmentsQuery } from '../../../queries/assignmentQueries';
import { useCreateSlotMutation } from '../../../queries/timetableQueries';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

// Simplified schema for frontend form
const schema = z.object({
  subjectId: z.string().min(1, 'Subject is required'),
  facultyId: z.string().min(1, 'Faculty is required'),
  dayOfWeek: z.string().min(1, 'Day is required'),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Required (HH:MM)'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Required (HH:MM)'),
  room: z.string().optional(),
}).refine(data => {
  const [h1, m1] = data.startTime.split(':').map(Number);
  const [h2, m2] = data.endTime.split(':').map(Number);
  return (h1 * 60 + m1) < (h2 * 60 + m2);
}, {
  message: 'End time must be after start time',
  path: ['endTime']
});

const AddSlotModal = ({ open, onClose, filters }) => {
  const { control, handleSubmit, watch, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      subjectId: '',
      facultyId: '',
      dayOfWeek: '',
      startTime: '09:00',
      endTime: '10:00',
      room: '',
    }
  });

  const [apiError, setApiError] = useState(null);
  const createMutation = useCreateSlotMutation();

  // 1. Fetch Subjects for the selected Batch (Course + Branch + Semester)
  const { data: subjectsData } = useSubjectsQuery({ 
    courseId: filters.course, 
    branchId: filters.branch, 
    semester: filters.semester 
  });
  const subjects = subjectsData || [];

  const selectedSubjectId = watch('subjectId');

  // 2. Fetch Assignments for the selected Subject to know which Faculty are eligible
  const { data: assignmentsData } = useAssignmentsQuery(
    selectedSubjectId ? { status: 'ACTIVE' } : { status: 'INVALID_PREVENT_FETCH' }
  );
  
  // Filter assignments locally just to be safe
  const eligibleFaculty = useMemo(() => {
    if (!assignmentsData?.data || !selectedSubjectId) return [];
    return assignmentsData.data
      .filter(a => a.subjectId._id === selectedSubjectId || a.subjectId === selectedSubjectId)
      .map(a => a.facultyId);
  }, [assignmentsData, selectedSubjectId]);

  const onSubmit = async (data) => {
    setApiError(null);
    try {
      await createMutation.mutateAsync({
        ...data,
        courseId: filters.course,
        branchId: filters.branch,
        semester: Number(filters.semester),
        group: filters.group || null,
      });
      reset();
      onClose();
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to create slot');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 800 }}>Add Timetable Slot</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent dividers>
          {apiError && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{apiError}</Alert>}
          
          <Box sx={{ mb: 3, p: 2, bgcolor: 'primary.50', borderRadius: 2 }}>
            <Typography variant="body2" color="primary.main" fontWeight={600}>
              Batch Target:
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Semester {filters.semester} {filters.group ? `(Group ${filters.group})` : '(Full Batch)'}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Controller
              name="subjectId"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Subject"
                  fullWidth
                  error={!!errors.subjectId}
                  helperText={errors.subjectId?.message}
                >
                  <MenuItem value=""><em>Select Subject</em></MenuItem>
                  {subjects.map((sub) => (
                    <MenuItem key={sub._id} value={sub._id}>{sub.name} ({sub.code})</MenuItem>
                  ))}
                </TextField>
              )}
            />

            <Controller
              name="facultyId"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Faculty"
                  fullWidth
                  disabled={!selectedSubjectId}
                  error={!!errors.facultyId}
                  helperText={errors.facultyId?.message || (!selectedSubjectId ? 'Select a subject first' : '')}
                >
                  <MenuItem value=""><em>Select Assigned Faculty</em></MenuItem>
                  {eligibleFaculty.map((fac) => (
                    <MenuItem key={fac._id} value={fac._id}>{fac.name}</MenuItem>
                  ))}
                </TextField>
              )}
            />

            <Controller
              name="dayOfWeek"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Day"
                  fullWidth
                  error={!!errors.dayOfWeek}
                  helperText={errors.dayOfWeek?.message}
                >
                  {DAYS.map((day) => (
                    <MenuItem key={day} value={day}>{day}</MenuItem>
                  ))}
                </TextField>
              )}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Controller
                name="startTime"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Start Time (HH:MM)"
                    fullWidth
                    error={!!errors.startTime}
                    helperText={errors.startTime?.message}
                    placeholder="09:00"
                  />
                )}
              />
              <Controller
                name="endTime"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="End Time (HH:MM)"
                    fullWidth
                    error={!!errors.endTime}
                    helperText={errors.endTime?.message}
                    placeholder="10:00"
                  />
                )}
              />
            </Box>

            <Controller
              name="room"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Room (Optional)"
                  fullWidth
                  placeholder="e.g. Lab 1, Room 101"
                />
              )}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={onClose} color="inherit">Cancel</Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={createMutation.isPending}
            sx={{ borderRadius: 2 }}
          >
            {createMutation.isPending ? 'Saving...' : 'Add Slot'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AddSlotModal;
