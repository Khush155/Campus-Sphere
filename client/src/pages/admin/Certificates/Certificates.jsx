import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  MenuItem,
  Button,
  Alert,
  CircularProgress,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  useTheme,
} from '@mui/material';
import {
  CardMembershipOutlined,
  PictureAsPdfOutlined,
  SearchOutlined,
} from '@mui/icons-material';
import { useUsersQuery } from '../../../queries/userQueries';
import { useAuditLogsQuery } from '../../../queries/auditLogQueries';
import api from '../../../services/api';

const getRelativeTime = (timestamp) => {
  if (!timestamp) return '—';
  const ms = new Date() - new Date(timestamp);
  const secs = Math.floor(ms / 1000);
  const mins = Math.floor(secs / 60);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (secs < 60) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

export const Certificates = () => {
  const theme = useTheme();
  const [studentSearch, setStudentSearch] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [generating, setGenerating] = useState(false);

  // Fetch student suggestions dynamically as search query changes
  const { data: studentsData, isLoading: loadingStudents } = useUsersQuery({
    role: 'STUDENT',
    search: studentSearch || undefined,
    limit: 15,
  });

  // Query recent generations list from audit logs
  const {
    data: auditData,
    isLoading: loadingHistory,
    refetch: refetchHistory,
  } = useAuditLogsQuery({
    action: 'CERTIFICATE_GENERATED',
    limit: 10,
  });

  const {
    handleSubmit,
    control,
    watch,
    register,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      student: null,
      type: 'BONAFIDE',
      purpose: '',
    },
  });

  const selectedType = watch('type');

  const onGenerateSubmit = async (data) => {
    setErrorMsg('');
    setSuccessMsg('');
    if (!data.student) {
      setErrorMsg('Please select a student first.');
      return;
    }

    setGenerating(true);
    try {
      const payload = {
        studentId: data.student.id || data.student._id,
        type: data.type,
        purpose: data.type === 'BONAFIDE' ? data.purpose : undefined,
      };

      const response = await api.post('/certificates/generate', payload, {
        responseType: 'blob',
      });

      // Stream PDF response directly to student browser download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${data.type.toLowerCase()}_certificate_${payload.studentId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSuccessMsg(`${data.type} certificate downloaded successfully.`);
      reset({ student: null, type: 'BONAFIDE', purpose: '' });
      setStudentSearch('');
      refetchHistory();
    } catch (err) {
      setErrorMsg('Failed to generate certificate. Please check data configuration.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, pb: 6 }}>
      {/* Header */}
      <Box sx={{ borderBottom: `1px solid ${theme.custom.border.subtle}`, pb: 2.5 }}>
        <Typography
          variant="h4"
          sx={{
            fontFamily: theme.typography.h1.fontFamily,
            fontWeight: 700,
            color: theme.palette.ink[900],
            mb: 0.5,
          }}
        >
          Certificate Generation Hub
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Configure, generate, and track academic certificates (Bonafide, Transfer, Character) for enrolled students.
        </Typography>
      </Box>

      {/* Main Grid: Form Left, History Right */}
      <Grid container spacing={4}>
        {/* Form Column */}
        <Grid item xs={12} md={5}>
          <Card
            sx={{
              border: `1px solid ${theme.custom.border.subtle}`,
              borderRadius: '16px',
              boxShadow: 'none',
              bgcolor: theme.custom.surface.raised,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 3 }}>
                Generate Certificate
              </Typography>

              {errorMsg && (
                <Alert severity="error" sx={{ mb: 2.5, borderRadius: '8px' }}>
                  {errorMsg}
                </Alert>
              )}

              {successMsg && (
                <Alert severity="success" sx={{ mb: 2.5, borderRadius: '8px' }}>
                  {successMsg}
                </Alert>
              )}

              <Box
                component="form"
                onSubmit={handleSubmit(onGenerateSubmit)}
                sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
              >
                {/* Search Student Autocomplete */}
                <Box>
                  <Typography
                    component="label"
                    sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}
                  >
                    Search Student
                  </Typography>
                  <Controller
                    name="student"
                    control={control}
                    rules={{ required: 'Student selection is required' }}
                    render={({ field: { value, onChange } }) => (
                      <Autocomplete
                        options={studentsData?.data || []}
                        getOptionLabel={(option) => `${option.name} (${option.email})`}
                        loading={loadingStudents}
                        inputValue={studentSearch}
                        onInputChange={(_, val) => setStudentSearch(val)}
                        value={value}
                        onChange={(_, val) => onChange(val)}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            size="small"
                            placeholder="Type name or email to search..."
                            error={!!errors.student}
                            helperText={errors.student?.message}
                            InputProps={{
                              ...params.InputProps,
                              startAdornment: (
                                <>
                                  <SearchOutlined sx={{ color: 'text.secondary', fontSize: 18, mr: 1 }} />
                                  {params.InputProps.startAdornment}
                                </>
                              ),
                              endAdornment: (
                                <>
                                  {loadingStudents ? <CircularProgress color="inherit" size={16} /> : null}
                                  {params.InputProps.endAdornment}
                                </>
                              ),
                            }}
                          />
                        )}
                      />
                    )}
                  />
                </Box>

                {/* Certificate Type */}
                <Box>
                  <Typography
                    component="label"
                    sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}
                  >
                    Certificate Type
                  </Typography>
                  <Controller
                    name="type"
                    control={control}
                    render={({ field }) => (
                      <TextField select {...field} size="small" fullWidth>
                        <MenuItem value="BONAFIDE">Bonafide Certificate</MenuItem>
                        <MenuItem value="TRANSFER">Transfer Certificate</MenuItem>
                        <MenuItem value="CHARACTER">Character Certificate</MenuItem>
                      </TextField>
                    )}
                  />
                </Box>

                {/* Purpose Field (Only visible for BONAFIDE) */}
                {selectedType === 'BONAFIDE' && (
                  <Box>
                    <Typography
                      component="label"
                      sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}
                    >
                      Stated Purpose
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="e.g. Opening a bank account, passport application..."
                      {...register('purpose', {
                        required: selectedType === 'BONAFIDE' ? 'Purpose is required for Bonafide certificate' : false,
                      })}
                      error={!!errors.purpose}
                      helperText={errors.purpose?.message}
                    />
                  </Box>
                )}

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={generating}
                  startIcon={
                    generating ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <PictureAsPdfOutlined />
                    )
                  }
                  sx={{
                    bgcolor: theme.palette.primary.main,
                    color: theme.palette.ink[900],
                    fontWeight: 700,
                    textTransform: 'none',
                    height: '40px',
                    '&:hover': { bgcolor: theme.palette.primary.light },
                  }}
                >
                  {generating ? 'Generating PDF...' : 'Generate & Download PDF'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* History Column */}
        <Grid item xs={12} md={7}>
          <Card
            sx={{
              border: `1px solid ${theme.custom.border.subtle}`,
              borderRadius: '16px',
              boxShadow: 'none',
              bgcolor: theme.custom.surface.raised,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 3 }}>
                Recent Generations History
              </Typography>

              {loadingHistory ? (
                <Box sx={{ display: 'flex', py: 6, justifyContent: 'center' }}>
                  <CircularProgress size={30} sx={{ color: theme.palette.primary.main }} />
                </Box>
              ) : !auditData?.logs || auditData.logs.length === 0 ? (
                <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
                  <CardMembershipOutlined sx={{ fontSize: 40, color: 'text.disabled', mb: 1.5 }} />
                  <Typography variant="body2">No certificates generated yet.</Typography>
                </Box>
              ) : (
                <TableContainer component={Paper} sx={{ border: 'none', boxShadow: 'none', bgcolor: 'transparent' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, pl: 0 }}>STUDENT</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>TYPE</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>PURPOSE</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="right">ISSUED</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {auditData.logs.map((log, idx) => (
                        <TableRow key={log._id || idx}>
                          <TableCell sx={{ fontWeight: 600, pl: 0 }}>
                            {log.after?.studentName || 'Unknown Student'}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={log.after?.type || 'UNKNOWN'}
                              size="small"
                              variant="outlined"
                              sx={{
                                fontWeight: 700,
                                fontSize: '0.65rem',
                                color: theme.palette.primary.main,
                                borderColor: theme.palette.primary.light,
                                height: 18,
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ color: 'text.secondary', fontSize: '0.78rem' }}>
                            {log.after?.purpose || '—'}
                          </TableCell>
                          <TableCell align="right" sx={{ color: 'text.secondary', fontSize: '0.78rem' }}>
                            {getRelativeTime(log.timestamp)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Certificates;
