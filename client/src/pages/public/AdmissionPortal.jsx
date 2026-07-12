import React, { useState } from 'react';
import { Box, Typography, Paper, TextField, MenuItem, Button, Container, Step, Stepper, StepLabel, Alert } from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

const steps = ['Personal Information', 'Academic Preferences', 'Submission'];

const applySchema = z.object({
  name: z.string().min(2, 'Name is required').max(50),
  email: z.string().email('Invalid email address'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.string().min(1, 'Gender is required'),
  bloodGroup: z.string().min(1, 'Blood group is required'),
  contactNumber: z.string().regex(/^\d{10}$/, 'Must be exactly 10 digits'),
  guardianName: z.string().min(2, 'Guardian name required'),
  address: z.string().min(5, 'Address required'),
  highSchoolMarks: z.coerce.number().min(0, 'Min 0').max(100, 'Max 100'),
  intermediateMarks: z.coerce.number().min(0, 'Min 0').max(100, 'Max 100'),
  departmentId: z.string().min(1, 'Department is required'),
  courseId: z.string().min(1, 'Course is required'),
  branchId: z.string().min(1, 'Branch is required'),
  photo: z.any().refine((file) => file instanceof FileList && file.length > 0, "Photo is required")
});

const fetchDepartments = async () => (await api.get('/colleges/departments')).data.data;
const fetchCourses = async () => (await api.get('/colleges/courses')).data.data;
const fetchBranches = async (courseId) => {
  if (!courseId) return [];
  return (await api.get(`/colleges/courses/${courseId}/branches`)).data.data;
};

const AdmissionPortal = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [apiError, setApiError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const { control, handleSubmit, watch, trigger, formState: { errors } } = useForm({
    resolver: zodResolver(applySchema),
    mode: 'onTouched',
    defaultValues: {
      name: '', email: '', dateOfBirth: '', gender: '', bloodGroup: '', contactNumber: '', guardianName: '', address: '', highSchoolMarks: '', intermediateMarks: '', departmentId: '', courseId: '', branchId: ''
    }
  });

  const selectedCourseId = watch('courseId');

  const { data: depts = [] } = useQuery({ queryKey: ['departments'], queryFn: fetchDepartments });
  const { data: courses = [] } = useQuery({ queryKey: ['courses'], queryFn: fetchCourses });
  const { data: branches = [] } = useQuery({
    queryKey: ['branches', selectedCourseId],
    queryFn: () => fetchBranches(selectedCourseId),
    enabled: !!selectedCourseId,
  });

  const handleNext = async () => {
    let isValid = false;
    if (activeStep === 0) {
      isValid = await trigger(['name', 'email', 'dateOfBirth', 'gender', 'bloodGroup', 'contactNumber', 'guardianName', 'address']);
    } else if (activeStep === 1) {
      isValid = await trigger(['highSchoolMarks', 'intermediateMarks', 'departmentId', 'courseId', 'branchId', 'photo']);
    }
    if (isValid) setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => setActiveStep((prev) => prev - 1);

  const onSubmit = async (data) => {
    setApiError(null);
    try {
      const formData = new FormData();
      Object.keys(data).forEach(key => {
        if (key === 'photo') {
          formData.append('photo', data.photo[0]);
        } else {
          formData.append(key, data[key]);
        }
      });
      await api.post('/admissions/apply', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess(true);
      setActiveStep(3);
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to submit application');
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h3" sx={{ fontWeight: 900, mb: 1 }}>CampusSphere Admissions</Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome! Please fill out the application wizard to apply for admission.
        </Typography>
      </Box>

      <Paper sx={{ p: 4, borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.05)' }}>
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 6 }}>
          {steps.map((label) => (
            <Step key={label}><StepLabel>{label}</StepLabel></Step>
          ))}
        </Stepper>

        {apiError && <Alert severity="error" sx={{ mb: 4 }}>{apiError}</Alert>}

        {success ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h5" color="success.main" sx={{ fontWeight: 800, mb: 2 }}>Application Submitted Successfully!</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Your application has been added to the review queue. You will receive an email once an administrator approves your admission.
            </Typography>
            <Button variant="outlined" onClick={() => navigate('/login')}>Back to Login</Button>
          </Box>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            {activeStep === 0 && (
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                <Controller name="name" control={control} render={({ field }) => (
                  <TextField {...field} label="Full Name" error={!!errors.name} helperText={errors.name?.message} fullWidth />
                )} />
                <Controller name="email" control={control} render={({ field }) => (
                  <TextField {...field} label="Email Address" type="email" error={!!errors.email} helperText={errors.email?.message} fullWidth />
                )} />
                <Controller name="dateOfBirth" control={control} render={({ field }) => (
                  <TextField {...field} label="Date of Birth" type="date" InputLabelProps={{ shrink: true }} error={!!errors.dateOfBirth} helperText={errors.dateOfBirth?.message} fullWidth />
                )} />
                <Controller name="gender" control={control} render={({ field }) => (
                  <TextField {...field} select label="Gender" error={!!errors.gender} helperText={errors.gender?.message} fullWidth>
                    <MenuItem value="MALE">Male</MenuItem>
                    <MenuItem value="FEMALE">Female</MenuItem>
                    <MenuItem value="OTHER">Other</MenuItem>
                  </TextField>
                )} />
                <Controller name="bloodGroup" control={control} render={({ field }) => (
                  <TextField {...field} select label="Blood Group" error={!!errors.bloodGroup} helperText={errors.bloodGroup?.message} fullWidth>
                    <MenuItem value="A+">A+</MenuItem>
                    <MenuItem value="A-">A-</MenuItem>
                    <MenuItem value="B+">B+</MenuItem>
                    <MenuItem value="B-">B-</MenuItem>
                    <MenuItem value="AB+">AB+</MenuItem>
                    <MenuItem value="AB-">AB-</MenuItem>
                    <MenuItem value="O+">O+</MenuItem>
                    <MenuItem value="O-">O-</MenuItem>
                  </TextField>
                )} />
                <Controller name="contactNumber" control={control} render={({ field }) => (
                  <TextField {...field} label="Contact Number" error={!!errors.contactNumber} helperText={errors.contactNumber?.message} fullWidth />
                )} />
                <Controller name="guardianName" control={control} render={({ field }) => (
                  <TextField {...field} label="Guardian Name" error={!!errors.guardianName} helperText={errors.guardianName?.message} fullWidth />
                )} />
                <Controller name="address" control={control} render={({ field }) => (
                  <TextField {...field} label="Permanent Address" multiline rows={2} error={!!errors.address} helperText={errors.address?.message} fullWidth sx={{ gridColumn: '1 / -1' }} />
                )} />
              </Box>
            )}

            {activeStep === 1 && (
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                <Controller name="highSchoolMarks" control={control} render={({ field }) => (
                  <TextField {...field} label="10th Marks (%)" type="number" error={!!errors.highSchoolMarks} helperText={errors.highSchoolMarks?.message} fullWidth />
                )} />
                <Controller name="intermediateMarks" control={control} render={({ field }) => (
                  <TextField {...field} label="12th Marks (%)" type="number" error={!!errors.intermediateMarks} helperText={errors.intermediateMarks?.message} fullWidth />
                )} />
                <Controller name="departmentId" control={control} render={({ field }) => (
                  <TextField {...field} select label="Department" error={!!errors.departmentId} helperText={errors.departmentId?.message} fullWidth sx={{ gridColumn: '1 / -1' }}>
                    {depts.map(d => <MenuItem key={d._id} value={d._id}>{d.name}</MenuItem>)}
                  </TextField>
                )} />
                <Controller name="courseId" control={control} render={({ field }) => (
                  <TextField {...field} select label="Course (e.g. B.Tech)" error={!!errors.courseId} helperText={errors.courseId?.message} fullWidth>
                    {courses.map(c => <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>)}
                  </TextField>
                )} />
                <Controller name="branchId" control={control} render={({ field }) => (
                  <TextField {...field} select label="Branch Specialization" disabled={!selectedCourseId} error={!!errors.branchId} helperText={errors.branchId?.message} fullWidth>
                    {branches.map(b => <MenuItem key={b._id} value={b._id}>{b.name}</MenuItem>)}
                  </TextField>
                )} />
                <Box sx={{ gridColumn: '1 / -1', mt: 1 }}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>Passport Size Photo</Typography>
                  <input type="file" accept="image/*" {...control.register('photo')} style={{ width: '100%', padding: '10px', border: '1px dashed #ccc', borderRadius: '4px' }} />
                  {errors.photo && <Typography color="error" variant="caption">{errors.photo.message}</Typography>}
                </Box>
              </Box>
            )}

            {activeStep === 2 && (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Review & Submit</Typography>
                <Typography color="text.secondary">
                  Please ensure all information is correct. Submitting this application will place it in the administrator queue for final review.
                </Typography>
              </Box>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 6 }}>
              <Button disabled={activeStep === 0} onClick={handleBack} variant="outlined">Back</Button>
              {activeStep === steps.length - 1 ? (
                <Button variant="contained" type="submit" color="primary">Submit Application</Button>
              ) : (
                <Button variant="contained" onClick={handleNext}>Next</Button>
              )}
            </Box>
          </form>
        )}
      </Paper>
    </Container>
  );
};

export default AdmissionPortal;
