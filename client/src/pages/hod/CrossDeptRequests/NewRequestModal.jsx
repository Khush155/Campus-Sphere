import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Box, Alert } from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import api from '../../../services/api';
import { useCreateRequestMutation } from '../../../queries/requestQueries';

const schema = z.object({
  targetDeptId: z.string().min(1, 'Target Department is required'),
  facultyId: z.string().min(1, 'Faculty is required'),
  subjectId: z.string().min(1, 'Subject is required'),
  reason: z.string().min(10, 'Please provide a valid reason (min 10 chars)').max(500, 'Reason too long'),
});

const fetchDepartments = async () => {
  const { data } = await api.get('/colleges/departments');
  return data.data;
};

const fetchDepartmentFaculty = async (deptId) => {
  if (!deptId) return [];
  const { data } = await api.get(`/users/faculty`, { params: { departmentId: deptId } });
  return data.data;
};

const fetchMySubjects = async () => {
  const { data } = await api.get('/colleges/subjects');
  return data.data;
};

const NewRequestModal = ({ open, onClose }) => {
  const [apiError, setApiError] = useState(null);
  const createMutation = useCreateRequestMutation();

  const { control, handleSubmit, watch, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { targetDeptId: '', facultyId: '', subjectId: '', reason: '' }
  });

  const selectedDeptId = watch('targetDeptId');

  const { data: depts = [] } = useQuery({ queryKey: ['departments'], queryFn: fetchDepartments });
  const { data: mySubjects = [] } = useQuery({ queryKey: ['mySubjects'], queryFn: fetchMySubjects });
  const { data: targetFaculty = [] } = useQuery({
    queryKey: ['faculty', selectedDeptId],
    queryFn: () => fetchDepartmentFaculty(selectedDeptId),
    enabled: !!selectedDeptId,
  });

  const onSubmit = async (data) => {
    setApiError(null);
    try {
      await createMutation.mutateAsync({
        facultyId: data.facultyId,
        subjectId: data.subjectId,
        reason: data.reason,
      });
      reset();
      onClose();
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to send request');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 800 }}>Request Cross-Department Faculty</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent dividers>
          {apiError && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{apiError}</Alert>}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Controller
              name="subjectId"
              control={control}
              render={({ field }) => (
                <TextField {...field} select label="Your Subject (Requiring Faculty)" fullWidth error={!!errors.subjectId} helperText={errors.subjectId?.message}>
                  {mySubjects.map((sub) => (
                    <MenuItem key={sub._id} value={sub._id}>{sub.name} ({sub.code})</MenuItem>
                  ))}
                </TextField>
              )}
            />
            <Controller
              name="targetDeptId"
              control={control}
              render={({ field }) => (
                <TextField {...field} select label="Target Department" fullWidth error={!!errors.targetDeptId} helperText={errors.targetDeptId?.message}>
                  {depts.map((dept) => (
                    <MenuItem key={dept._id} value={dept._id}>{dept.name}</MenuItem>
                  ))}
                </TextField>
              )}
            />
            <Controller
              name="facultyId"
              control={control}
              render={({ field }) => (
                <TextField {...field} select label="Target Faculty" fullWidth disabled={!selectedDeptId} error={!!errors.facultyId} helperText={errors.facultyId?.message}>
                  {targetFaculty.map((fac) => (
                    <MenuItem key={fac._id} value={fac._id}>{fac.name} ({fac.email})</MenuItem>
                  ))}
                </TextField>
              )}
            />
            <Controller
              name="reason"
              control={control}
              render={({ field }) => (
                <TextField {...field} multiline rows={3} label="Reason for Request" fullWidth error={!!errors.reason} helperText={errors.reason?.message} placeholder="Explain why you need this specific faculty member..." />
              )}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={onClose} color="inherit">Cancel</Button>
          <Button type="submit" variant="contained" disabled={createMutation.isPending} sx={{ borderRadius: 2 }}>
            {createMutation.isPending ? 'Sending...' : 'Send Request'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default NewRequestModal;
