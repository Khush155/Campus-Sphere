import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  Alert,
  Snackbar
} from '@mui/material';
import { useDepartmentsQuery, useBranchesQuery } from '../../../queries/collegeQueries';
import { useGenerateBulkFeesMutation } from '../../../queries/feeQueries';


export const FeeManagementPage = () => {
  const { data: departments } = useDepartmentsQuery();
  const { data: branches } = useBranchesQuery();
  const generateBulkFees = useGenerateBulkFeesMutation();

  const [departmentId, setDepartmentId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [semester, setSemester] = useState('');
  const [toast, setToast] = useState({ open: false, message: '', severity: 'info' });

  const handleGenerate = () => {
    generateBulkFees.mutate({
      departmentId: departmentId || undefined,
      branchId: branchId || undefined,
      semester: semester ? parseInt(semester, 10) : undefined,
    }, {
      onSuccess: (res) => {
        setToast({
          open: true,
          message: res.message || 'Fees successfully generated!',
          severity: 'success'
        });
        setDepartmentId('');
        setBranchId('');
        setSemester('');
      },
      onError: (err) => {
        setToast({
          open: true,
          message: err.response?.data?.message || 'Failed to generate fees.',
          severity: 'error'
        });
      }
    });
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="600">
          Fee Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Generate and assign semester fee dues in bulk for targeted student cohorts.
        </Typography>
      </Box>

      <Card sx={{ mt: 3, maxWidth: 600 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Generate Bulk Fees
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Select the criteria below to generate fees for a specific cohort. Standard fees (Tuition, Lab, Library, Hostel) will be assigned and the students' status will be set to PENDING.
          </Typography>

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Department (Optional)</InputLabel>
                <Select
                  value={departmentId}
                  label="Department (Optional)"
                  onChange={(e) => setDepartmentId(e.target.value)}
                >
                  <MenuItem value="">
                    <em>All Departments</em>
                  </MenuItem>
                  {departments?.map((dept) => (
                    <MenuItem key={dept._id || dept.id} value={dept._id || dept.id}>
                      {dept.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Branch (Optional)</InputLabel>
                <Select
                  value={branchId}
                  label="Branch (Optional)"
                  onChange={(e) => setBranchId(e.target.value)}
                  disabled={!branches}
                >
                  <MenuItem value="">
                    <em>All Branches</em>
                  </MenuItem>
                  {branches?.map((branch) => (
                    <MenuItem key={branch._id || branch.id} value={branch._id || branch.id}>
                      {branch.name} ({branch.code})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Semester (Optional)</InputLabel>
                <Select
                  value={semester}
                  label="Semester (Optional)"
                  onChange={(e) => setSemester(e.target.value)}
                >
                  <MenuItem value="">
                    <em>All Semesters</em>
                  </MenuItem>
                  {[...Array(8)].map((_, i) => (
                    <MenuItem key={i + 1} value={i + 1}>
                      Semester {i + 1}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sx={{ mt: 2 }}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                onClick={handleGenerate}
                disabled={generateBulkFees.isPending}
              >
                {generateBulkFees.isPending ? 'Generating...' : 'Generate Semester Fees'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Snackbar
        open={toast.open}
        autoHideDuration={6000}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={toast.severity} sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
