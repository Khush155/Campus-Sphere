import React, { useState } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  CircularProgress,
  Divider,
} from '@mui/material';
import { CloseOutlined } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import api from '../../../services/api';
import { useAssignFaculty, useRevokeAssignment } from '../../../queries/facultyAssignmentQueries';
import ConfirmDeleteModal from '../../../components/common/ConfirmDeleteModal';

const assignSchema = z.object({
  facultyId: z.string().min(1, 'Please select a faculty member'),
  academicYear: z.string().min(1, 'Academic year is required'),
  semester: z.number().min(1, 'Semester is required'),
});

export const AssignFacultyDrawer = ({ open, onClose, subjectData, branchId, departmentId }) => {
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const { mutateAsync: assignFaculty, isLoading: isAssigning } = useAssignFaculty();
  const { mutateAsync: revokeAssignment, isLoading: isRevoking } = useRevokeAssignment();

  // Fetch faculty for this department
  const { data: facultyList, isLoading: facultyLoading } = useQuery({
    queryKey: ['users', 'FACULTY', departmentId],
    queryFn: async () => {
      const res = await api.get(`/users?role=FACULTY&department=${departmentId}&limit=100`);
      return res.data.data.users || [];
    },
    enabled: !!departmentId,
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(assignSchema),
    defaultValues: {
      facultyId: '',
      academicYear: '2025-26',
      semester: 1,
    },
  });

  // Reset form when opened with new subject data
  React.useEffect(() => {
    if (open && subjectData) {
      reset({
        facultyId: subjectData.existingAssignment?.facultyId?._id || '',
        academicYear: subjectData.existingAssignment?.academicYear || '2025-26',
        semester: subjectData.existingAssignment?.semester || 1,
      });
    }
  }, [open, subjectData, reset]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data) => {
    try {
      await assignFaculty({
        facultyId: data.facultyId,
        subjectId: subjectData.subject._id,
        branchId,
        academicYear: data.academicYear,
        semester: data.semester,
      });
      handleClose();
    } catch (err) {
      // Error handled by query global error handler, or we can toast here
      console.error(err);
    }
  };

  const handleRevoke = async () => {
    if (!subjectData.existingAssignment?._id) return;
    try {
      await revokeAssignment(subjectData.existingAssignment._id);
      setConfirmRevoke(false);
      handleClose();
    } catch (err) {
      console.error(err);
    }
  };

  if (!subjectData) return null;

  return (
    <>
      <Drawer anchor="right" open={open} onClose={handleClose} PaperProps={{ sx: { width: { xs: '100%', sm: 480 } } }}>
        <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Assign Faculty
          </Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseOutlined />
          </IconButton>
        </Box>

        <Box sx={{ p: 3, overflowY: 'auto', flex: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Subject
          </Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 3 }}>
            {subjectData.subject?.name} ({subjectData.subject?.code})
          </Typography>

          <form id="assign-faculty-form" onSubmit={handleSubmit(onSubmit)}>
            <Controller
              name="facultyId"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.facultyId} sx={{ mb: 3 }}>
                  <InputLabel>Select Faculty</InputLabel>
                  <Select {...field} label="Select Faculty" disabled={facultyLoading}>
                    {facultyLoading && <MenuItem disabled>Loading...</MenuItem>}
                    {facultyList?.map((fac) => (
                      <MenuItem key={fac._id} value={fac._id}>
                        {fac.name} ({fac.email})
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>{errors.facultyId?.message}</FormHelperText>
                </FormControl>
              )}
            />

            <Controller
              name="academicYear"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.academicYear} sx={{ mb: 3 }}>
                  <InputLabel>Academic Year</InputLabel>
                  <Select {...field} label="Academic Year">
                    <MenuItem value="2025-26">2025-26</MenuItem>
                    <MenuItem value="2026-27">2026-27</MenuItem>
                  </Select>
                  <FormHelperText>{errors.academicYear?.message}</FormHelperText>
                </FormControl>
              )}
            />

            <Controller
              name="semester"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.semester} sx={{ mb: 3 }}>
                  <InputLabel>Semester</InputLabel>
                  <Select {...field} label="Semester">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                      <MenuItem key={s} value={s}>Semester {s}</MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>{errors.semester?.message}</FormHelperText>
                </FormControl>
              )}
            />
          </form>

          {subjectData.existingAssignment && (
            <Box sx={{ mt: 4 }}>
              <Divider sx={{ mb: 3 }} />
              <Typography variant="subtitle2" color="error" sx={{ mb: 1 }}>
                Danger Zone
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Revoking this assignment will remove this faculty member from this subject for this semester.
              </Typography>
              <Button
                variant="outlined"
                color="error"
                fullWidth
                onClick={() => setConfirmRevoke(true)}
              >
                Revoke Assignment
              </Button>
            </Box>
          )}
        </Box>

        <Box sx={{ p: 3, borderTop: 1, borderColor: 'divider', display: 'flex', gap: 2 }}>
          <Button variant="outlined" fullWidth onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="contained"
            fullWidth
            type="submit"
            form="assign-faculty-form"
            disabled={isAssigning}
          >
            {isAssigning ? <CircularProgress size={24} color="inherit" /> : 'Assign'}
          </Button>
        </Box>
      </Drawer>

      <ConfirmDeleteModal
        open={confirmRevoke}
        onClose={() => setConfirmRevoke(false)}
        onConfirm={handleRevoke}
        title="Revoke Faculty Assignment"
        message={`Are you sure you want to revoke the assignment for ${subjectData?.subject?.name}? This action will be recorded in the audit log.`}
        isDeleting={isRevoking}
        confirmText="Revoke"
        typedConfirmation="REVOKE"
      />
    </>
  );
};

export default AssignFacultyDrawer;
