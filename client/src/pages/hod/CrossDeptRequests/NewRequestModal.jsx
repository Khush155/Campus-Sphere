import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Box, Alert, CircularProgress } from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import api from '../../../services/api';
import { useCreateRequestMutation } from '../../../queries/requestQueries';
import { useAuth } from '../../../contexts/AuthContext';

const schema = z.object({
  targetDeptId: z.string().min(1, 'Target Department is required'),
  subjectId: z.string().min(1, 'Subject is required'),
  facultyId: z.string().min(1, 'Faculty is required'),
  reason: z.string().min(10, 'Please provide a valid reason (min 10 chars)').max(500, 'Reason too long'),
});

const fetchDepartments = async () => {
  const { data } = await api.get('/college/departments');
  const depts = data.data || [];
  return depts.map(d => ({
    _id: String(d._id || d.id),
    name: d.name,
    code: d.code
  }));
};

const fetchDepartmentFaculty = async (deptId) => {
  if (!deptId) return [];
  let facultyList = [];

  // Try /faculty endpoint first
  try {
    const { data } = await api.get('/faculty', { params: { departmentId: deptId } });
    if (Array.isArray(data.data) && data.data.length > 0) {
      facultyList = data.data.map(f => ({
        _id: String(f.userId?._id || f.userId || f._id),
        name: f.userId?.name || f.name || 'Faculty Member',
        email: f.userId?.email || f.email || ''
      }));
    }
  } catch (err) {
    // Silent catch fallback
  }

  // Fallback to /users endpoint if /faculty returned no items
  if (facultyList.length === 0) {
    try {
      const { data } = await api.get('/users', { params: { role: 'FACULTY', department: deptId } });
      const users = data.data?.data || data.data || [];
      if (Array.isArray(users)) {
        facultyList = users.map(u => ({
          _id: String(u._id || u.id),
          name: u.name || 'Faculty Member',
          email: u.email || ''
        }));
      }
    } catch (err) {
      // Silent catch fallback
    }
  }

  return facultyList;
};

const fetchTargetSubjects = async (deptId) => {
  if (!deptId) return [];
  const { data } = await api.get('/college/subjects', { params: { departmentId: deptId } });
  const subjects = data.data || [];
  return subjects.map(s => ({
    _id: String(s._id || s.id),
    name: s.name,
    code: s.code,
    semester: s.semester
  }));
};

const NewRequestModal = ({ open, onClose }) => {
  const [apiError, setApiError] = useState(null);
  const { user } = useAuth();
  const myDeptId = user?.departmentId?._id || user?.departmentId || user?.department?.id || user?.department;

  const createMutation = useCreateRequestMutation();

  const { control, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { targetDeptId: '', subjectId: '', facultyId: '', reason: '' }
  });

  const selectedDeptId = watch('targetDeptId');

  // Fetch all departments
  const { data: depts = [] } = useQuery({ 
    queryKey: ['departments'], 
    queryFn: fetchDepartments 
  });

  // Exclude current HOD's department from target departments dropdown
  const availableTargetDepts = depts.filter(d => String(d._id) !== String(myDeptId));

  // Fetch faculty belonging to target department
  const { data: targetFaculty = [], isLoading: isLoadingFaculty } = useQuery({
    queryKey: ['targetFaculty', selectedDeptId],
    queryFn: () => fetchDepartmentFaculty(selectedDeptId),
    enabled: !!selectedDeptId,
  });

  // Fetch subjects belonging to target department
  const { data: targetSubjects = [], isLoading: isLoadingSubjects } = useQuery({
    queryKey: ['targetSubjects', selectedDeptId],
    queryFn: () => fetchTargetSubjects(selectedDeptId),
    enabled: !!selectedDeptId,
  });

  const handleDeptChange = (e, onChange) => {
    const newDeptId = e.target.value;
    onChange(newDeptId);
    setValue('subjectId', ''); // Reset subject when target department changes
    setValue('facultyId', ''); // Reset faculty when target department changes
  };

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
            {/* Target Department Select */}
            <Controller
              name="targetDeptId"
              control={control}
              render={({ field: { value, onChange, ...fieldProps } }) => (
                <TextField
                  {...fieldProps}
                  value={value || ''}
                  onChange={(e) => handleDeptChange(e, onChange)}
                  select
                  label="Target Department"
                  fullWidth
                  error={!!errors.targetDeptId}
                  helperText={errors.targetDeptId?.message || "Select the department you want to borrow faculty from"}
                >
                  {availableTargetDepts.map((dept) => (
                    <MenuItem key={dept._id} value={dept._id}>{dept.name} ({dept.code})</MenuItem>
                  ))}
                </TextField>
              )}
            />

            {/* Target Subject Select */}
            <Controller
              name="subjectId"
              control={control}
              render={({ field: { value, onChange, ...fieldProps } }) => (
                <TextField
                  {...fieldProps}
                  value={value || ''}
                  onChange={onChange}
                  select
                  label="Cross-Department Subject"
                  fullWidth
                  disabled={!selectedDeptId || isLoadingSubjects}
                  error={!!errors.subjectId}
                  helperText={errors.subjectId?.message || (!selectedDeptId ? "Select a Target Department first" : "")}
                >
                  {isLoadingSubjects ? (
                    <MenuItem disabled value="">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={16} /> Loading subjects...
                      </Box>
                    </MenuItem>
                  ) : targetSubjects.length === 0 ? (
                    <MenuItem disabled value="">No subjects found in target department</MenuItem>
                  ) : (
                    targetSubjects.map((sub) => (
                      <MenuItem key={sub._id} value={sub._id}>{sub.name} ({sub.code}) - Sem {sub.semester}</MenuItem>
                    ))
                  )}
                </TextField>
              )}
            />

            {/* Target Faculty Select */}
            <Controller
              name="facultyId"
              control={control}
              render={({ field: { value, onChange, ...fieldProps } }) => (
                <TextField
                  {...fieldProps}
                  value={value || ''}
                  onChange={onChange}
                  select
                  label="Target Faculty Member"
                  fullWidth
                  disabled={!selectedDeptId || isLoadingFaculty}
                  error={!!errors.facultyId}
                  helperText={errors.facultyId?.message || (!selectedDeptId ? "Select a Target Department first" : "")}
                >
                  {isLoadingFaculty ? (
                    <MenuItem disabled value="">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={16} /> Loading faculty members...
                      </Box>
                    </MenuItem>
                  ) : targetFaculty.length === 0 ? (
                    <MenuItem disabled value="">No faculty members found in target department</MenuItem>
                  ) : (
                    targetFaculty.map((fac) => (
                      <MenuItem key={fac._id} value={fac._id}>{fac.name} ({fac.email})</MenuItem>
                    ))
                  )}
                </TextField>
              )}
            />

            {/* Reason Input */}
            <Controller
              name="reason"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  multiline
                  rows={3}
                  label="Reason for Request"
                  fullWidth
                  error={!!errors.reason}
                  helperText={errors.reason?.message}
                  placeholder="Explain why your department needs this faculty member to teach this subject..."
                />
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
