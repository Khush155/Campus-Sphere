/* eslint-disable */
import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  TextField,
  Button,
  useTheme,
  MenuItem,
  CircularProgress
} from '@mui/material';
import { CloseOutlined } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUsersQuery } from '../../../queries/userQueries';
import { useSubjectsQuery } from '../../../queries/collegeQueries';
import { useAuth } from '../../../contexts/AuthContext';

const assignSchema = z.object({
  subjectId: z.string().min(1, 'Subject is required'),
  facultyId: z.string().min(1, 'Faculty is required'),
  group: z.string().max(20, 'Group too long').optional(),
});

const AssignFacultyDrawer = ({ open, onClose, onSubmit, isSubmitting }) => {
  const theme = useTheme();
  const { user } = useAuth();

  const { control, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(assignSchema),
    defaultValues: {
      subjectId: '',
      facultyId: '',
      group: '',
    }
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const submitHandler = async (data) => {
    await onSubmit(data);
    handleClose();
  };

  // Fetch subjects in the department (could filter to unassigned if backend supported it, but we'll fetch all)
  const { data: subjects, isLoading: loadingSubjects } = useSubjectsQuery({ departmentId: user?.departmentId, limit: 100 });
  
  // Fetch faculty in the department
  const { data: facultyRes, isLoading: loadingFaculty } = useUsersQuery({ role: 'FACULTY', departmentId: user?.departmentId, limit: 100 });
  const facultyMembers = facultyRes?.data || [];

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={handleClose}
      PaperProps={{
        sx: { width: { xs: '100%', sm: 400 }, p: 0, bgcolor: 'background.default' },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3, borderBottom: `1px solid ${theme.palette.divider}`, bgcolor: 'background.paper' }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>Assign Faculty</Typography>
        <IconButton onClick={handleClose} size="small"><CloseOutlined /></IconButton>
      </Box>

      <Box component="form" onSubmit={handleSubmit(submitHandler)} sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3, height: '100%', overflowY: 'auto' }}>
        
        {loadingSubjects || loadingFaculty ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress size={32} />
          </Box>
        ) : (
          <>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>
                Subject
              </Typography>
              <Controller
                name="subjectId"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    size="small"
                    error={!!errors.subjectId}
                    helperText={errors.subjectId?.message}
                    sx={{ bgcolor: 'background.paper' }}
                  >
                    {subjects?.map(s => (
                      <MenuItem key={s._id} value={s._id}>
                        {s.code} - {s.name}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Box>

            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>
                Faculty Member
              </Typography>
              <Controller
                name="facultyId"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    size="small"
                    error={!!errors.facultyId}
                    helperText={errors.facultyId?.message}
                    sx={{ bgcolor: 'background.paper' }}
                  >
                    {facultyMembers.map(f => (
                      <MenuItem key={f._id} value={f._id}>
                        {f.name} ({f.email})
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Box>

            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>
                Target Group (Optional)
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Leave empty to assign to the Full Batch. Enter a group name (e.g., "G1") to assign this teacher only to that group.
              </Typography>
              <Controller
                name="group"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    size="small"
                    placeholder="e.g. G1"
                    error={!!errors.group}
                    helperText={errors.group?.message}
                    sx={{ bgcolor: 'background.paper' }}
                  />
                )}
              />
            </Box>
          </>
        )}

        <Box sx={{ mt: 'auto', display: 'flex', gap: 2, pt: 3 }}>
          <Button fullWidth variant="outlined" onClick={handleClose} sx={{ fontWeight: 600 }}>
            Cancel
          </Button>
          <Button fullWidth variant="contained" type="submit" disabled={isSubmitting || loadingSubjects || loadingFaculty} sx={{ fontWeight: 700 }}>
            {isSubmitting ? 'Saving...' : 'Save Assignment'}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};

export default AssignFacultyDrawer;
