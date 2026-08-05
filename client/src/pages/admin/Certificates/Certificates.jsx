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
  Divider,
} from '@mui/material';
import {
  CardMembershipOutlined,
  PictureAsPdfOutlined,
  SearchOutlined,
  VerifiedUserOutlined,
  SchoolOutlined,
  DownloadOutlined,
} from '@mui/icons-material';
import { useUsersQuery } from '../../../queries/userQueries';
import { useAuditLogsQuery } from '../../../queries/auditLogQueries';
import api from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';

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
  const { showToast } = useToast();

  const [studentSearch, setStudentSearch] = useState('');
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

  const selectedStudent = watch('student');
  const selectedType = watch('type');
  const selectedPurpose = watch('purpose');

  const downloadPdf = async (studentId, type, purpose, studentName) => {
    const payload = {
      studentId,
      type,
      purpose: type === 'BONAFIDE' ? purpose : undefined,
    };

    const response = await api.post('/certificates/generate', payload, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${type.toLowerCase()}_certificate_${(studentName || 'student').replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const onGenerateSubmit = async (data) => {
    if (!data.student) {
      showToast('Please select a student first.', { severity: 'error' });
      return;
    }

    setGenerating(true);
    try {
      await downloadPdf(
        data.student.id || data.student._id,
        data.type,
        data.purpose,
        data.student.name
      );

      showToast(`${data.type} Certificate for ${data.student.name} downloaded successfully.`);
      reset({ student: null, type: 'BONAFIDE', purpose: '' });
      setStudentSearch('');
      refetchHistory();
    } catch (err) {
      showToast('Failed to generate certificate. Please check server connection.', { severity: 'error' });
    } finally {
      setGenerating(false);
    }
  };

  // Compute realistic preview body text matching backend generator
  const getPreviewBody = () => {
    const name = selectedStudent ? selectedStudent.name : '[Student Full Name]';
    const email = selectedStudent?.email ? ` (${selectedStudent.email})` : '';

    if (selectedType === 'BONAFIDE') {
      const purposeText = selectedPurpose ? ` "${selectedPurpose}"` : ' General Academic Purposes';
      return `This is to certify that Mr./Ms. ${name}${email} is a bonafide student of Campus Sphere Academy. To the best of our knowledge, their conduct has been exemplary during their tenure here. This certificate is officially issued at their request for the purpose of:${purposeText}.`;
    } else if (selectedType === 'TRANSFER') {
      return `This is to certify that Mr./Ms. ${name}${email} was a student of Campus Sphere Academy. They have cleared all institutional dues, library returns, and laboratory balances. There is no objection from this institution to their seeking admission at any other accredited university or institution. We wish them success in their future academic pursuits.`;
    } else {
      return `This is to certify that Mr./Ms. ${name}${email} is/was a student of Campus Sphere Academy. During their tenure at CampusSphere, they have shown great diligence, high moral character, and cooperative behavior. Their character and conduct have been found to be Good.`;
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5, pb: 6 }}>
      {/* ── 1. Hero Issuance Banner Card ──────────────────────────────────── */}
      <Card
        sx={{
          p: 3.5,
          borderRadius: '16px',
          border: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
          background: `linear-gradient(135deg, ${theme.palette.primary.main}0F 0%, ${theme.palette.brass?.[500] || '#b8863e'}08 100%)`,
          boxShadow: theme.custom?.elevation?.raised || 'none',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, flexWrap: 'wrap' }}>
            <Chip
              icon={<CardMembershipOutlined sx={{ fontSize: '0.9rem !important', color: `${theme.palette.primary.main} !important` }} />}
              label="ACADEMIC CERTIFICATE HUB"
              size="small"
              sx={{
                bgcolor: `${theme.palette.primary.main}15`,
                color: theme.palette.primary.main,
                fontFamily: theme.typography.mono.fontFamily,
                fontWeight: 700,
                fontSize: '0.68rem',
                letterSpacing: '0.06em',
                borderRadius: '6px',
              }}
            />
            <Chip
              label="Bonafide Certificate"
              size="small"
              sx={{
                bgcolor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                fontFamily: theme.typography.mono.fontFamily,
                fontSize: '0.72rem',
                fontWeight: 600,
              }}
            />
            <Chip
              label="Transfer Certificate"
              size="small"
              sx={{
                bgcolor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                fontFamily: theme.typography.mono.fontFamily,
                fontSize: '0.72rem',
                fontWeight: 600,
              }}
            />
            <Chip
              label="Character Certificate"
              size="small"
              sx={{
                bgcolor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                fontFamily: theme.typography.mono.fontFamily,
                fontSize: '0.72rem',
                fontWeight: 600,
              }}
            />
          </Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontFamily: theme.typography.h1.fontFamily,
              fontWeight: 600,
              color: theme.palette.ink[900],
              lineHeight: 1.15,
              mb: 0.5,
            }}
          >
            Certificate Generation Hub
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontFamily: theme.typography.body2.fontFamily,
              color: theme.palette.text.secondary,
              maxWidth: 640,
            }}
          >
            Configure, generate, and track official academic certificates (Bonafide, Transfer, Character) for enrolled students.
          </Typography>
        </Box>
      </Card>

      {/* ── 2. Main Grid: Form Left, Preview & History Right ──────────────── */}
      <Grid container spacing={3.5}>
        {/* Form Column */}
        <Grid item xs={12} md={5}>
          <Card
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: '16px',
              boxShadow: 'none',
              bgcolor: theme.custom?.surface?.raised || theme.palette.background.paper,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 3 }}>
                Generate Certificate
              </Typography>

              <Box
                component="form"
                onSubmit={handleSubmit(onGenerateSubmit)}
                sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
              >
                {/* Search Student Autocomplete */}
                <Box>
                  <Typography
                    component="label"
                    htmlFor="student-search-input"
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
                            id="student-search-input"
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
                    htmlFor="cert-type-input"
                    sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}
                  >
                    Certificate Type
                  </Typography>
                  <Controller
                    name="type"
                    control={control}
                    render={({ field }) => (
                      <TextField id="cert-type-input" select {...field} size="small" fullWidth>
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
                      htmlFor="purpose-input"
                      sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}
                    >
                      Stated Purpose
                    </Typography>
                    <TextField
                      id="purpose-input"
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
                    background: theme.palette.primary.gradient || theme.palette.primary.main,
                    color: '#ffffff',
                    fontWeight: 700,
                    textTransform: 'none',
                    height: '42px',
                    borderRadius: '8px',
                    boxShadow: `0 4px 14px ${theme.palette.primary.main}35`,
                  }}
                >
                  {generating ? 'Generating PDF...' : 'Generate & Download PDF'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Live Watermarked Document Preview & History Column */}
        <Grid item xs={12} md={7} sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
          {/* Realistic Physical Certificate Watermark Preview Card */}
          <Card
            sx={{
              p: 3.5,
              border: `2px double ${theme.palette.brass?.[500] || '#b8863e'}`,
              borderRadius: '16px',
              bgcolor: theme.palette.background.paper,
              position: 'relative',
              boxShadow: theme.custom?.elevation?.raised || 'none',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.brass?.[500] || '#b8863e', fontFamily: theme.typography.mono.fontFamily, letterSpacing: '0.08em' }}>
                DOCUMENT PREVIEW
              </Typography>
              <Chip
                icon={<VerifiedUserOutlined sx={{ fontSize: '0.8rem !important' }} />}
                label="OFFICIAL WATERMARK"
                size="small"
                sx={{
                  bgcolor: `${theme.palette.brass?.[500] || '#b8863e'}18`,
                  color: theme.palette.brass?.[500] || '#b8863e',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  fontFamily: theme.typography.mono.fontFamily,
                }}
              />
            </Box>

            <Card
              sx={{
                p: 4,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: '12px',
                bgcolor: 'rgba(255, 255, 255, 0.98)',
                textAlign: 'center',
                position: 'relative',
              }}
            >
              <SchoolOutlined sx={{ fontSize: 40, color: theme.palette.primary.main, mb: 1 }} />
              <Typography variant="h5" sx={{ fontFamily: theme.typography.h1.fontFamily, fontWeight: 800, color: theme.palette.ink[900], letterSpacing: '0.04em', mb: 0.5 }}>
                CAMPUS SPHERE ACADEMY
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2, fontFamily: theme.typography.mono.fontFamily, letterSpacing: '0.12em' }}>
                OFFICIAL INSTITUTIONAL {selectedType} CERTIFICATE
              </Typography>

              <Divider sx={{ my: 2, borderColor: theme.palette.brass?.[500] || '#b8863e' }} />

              <Typography variant="body1" sx={{ color: theme.palette.text.primary, lineHeight: 1.85, my: 3, px: 2, textAlign: 'justify' }}>
                {getPreviewBody()}
              </Typography>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mt: 4, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                <Box sx={{ textAlign: 'left' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.72rem' }}>
                    Date of Issue
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700, fontFamily: theme.typography.mono.fontFamily }}>
                    {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </Typography>
                </Box>

                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.ink[900], display: 'block', fontSize: '0.8rem' }}>
                    Authorized Signatory
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem', fontFamily: theme.typography.mono.fontFamily }}>
                    CampusSphere Office Administration
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Card>

          {/* History Log Stream */}
          <Card
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: '16px',
              boxShadow: 'none',
              bgcolor: theme.custom?.surface?.raised || theme.palette.background.paper,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                Recent Certificate Generations History
              </Typography>

              {loadingHistory ? (
                <Box sx={{ display: 'flex', py: 4, justifyContent: 'center' }}>
                  <CircularProgress size={28} sx={{ color: theme.palette.primary.main }} />
                </Box>
              ) : !auditData?.logs || auditData.logs.length === 0 ? (
                <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
                  <CardMembershipOutlined sx={{ fontSize: 36, color: 'text.disabled', mb: 1 }} />
                  <Typography variant="body2">No certificates generated yet.</Typography>
                </Box>
              ) : (
                <TableContainer component={Paper} sx={{ border: 'none', boxShadow: 'none', bgcolor: 'transparent' }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: theme.custom?.surface?.sunken || 'rgba(28, 46, 69, 0.02)' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>STUDENT</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>TYPE</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>PURPOSE</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>ISSUED</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>ACTION</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {auditData.logs.map((log, idx) => (
                        <TableRow key={log._id || idx}>
                          <TableCell sx={{ fontWeight: 600 }}>
                            {log.after?.studentName || 'Unknown Student'}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={log.after?.type || 'UNKNOWN'}
                              size="small"
                              sx={{
                                fontWeight: 700,
                                fontSize: '0.65rem',
                                color: theme.palette.primary.main,
                                bgcolor: `${theme.palette.primary.main}15`,
                                height: 20,
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ color: 'text.secondary', fontSize: '0.78rem' }}>
                            {log.after?.purpose || '—'}
                          </TableCell>
                          <TableCell sx={{ color: 'text.secondary', fontSize: '0.78rem' }}>
                            {getRelativeTime(log.timestamp)}
                          </TableCell>
                          <TableCell align="right">
                            {log.targetId && (
                              <Button
                                size="small"
                                startIcon={<DownloadOutlined />}
                                onClick={() => downloadPdf(log.targetId, log.after?.type || 'BONAFIDE', log.after?.purpose, log.after?.studentName)}
                                sx={{ textTransform: 'none', fontSize: '0.75rem', py: 0 }}
                              >
                                PDF
                              </Button>
                            )}
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
