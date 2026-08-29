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

const CERTIFICATE_TYPES = [
  { value: 'BONAFIDE', label: 'Bonafide Certificate' },
  { value: 'TRANSFER', label: 'Transfer Certificate (TC)' },
  { value: 'CHARACTER', label: 'Character & Conduct Certificate' },
  { value: 'NOC', label: 'No Objection Certificate (NOC)' },
  { value: 'PROVISIONAL', label: 'Provisional Degree Certificate' },
  { value: 'MERIT', label: 'Academic Excellence & Merit Certificate' },
];

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
  const isDark = theme.palette.mode === 'dark';
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
    setValue,
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

  const selectedTypeObj = CERTIFICATE_TYPES.find((t) => t.value === selectedType) || CERTIFICATE_TYPES[0];

  const downloadPdf = async (studentId, type, purpose, studentName) => {
    const payload = {
      studentId,
      type,
      purpose: purpose?.trim() || undefined,
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
    const rollText = selectedStudent?.rollNumber ? ` (Roll No: ${selectedStudent.rollNumber})` : selectedStudent?.email ? ` (${selectedStudent.email})` : '';
    const trimmedPurpose = selectedPurpose?.trim();

    if (selectedType === 'BONAFIDE') {
      const purposeClause = trimmedPurpose ? ` This certificate is officially issued at their request for the purpose of: "${trimmedPurpose}".` : ' This certificate is officially issued at their request for general academic purposes.';
      return `This is to certify that Mr./Ms. ${name}${rollText} is a bonafide student of Campus Sphere Academy. To the best of our knowledge, their conduct has been exemplary during their tenure here.${purposeClause}`;
    } else if (selectedType === 'TRANSFER') {
      const purposeClause = trimmedPurpose ? ` Stated Reason / Details: "${trimmedPurpose}".` : '';
      return `This is to certify that Mr./Ms. ${name}${rollText} was a student of Campus Sphere Academy. They have cleared all institutional dues, library returns, and laboratory balances. There is no objection from this institution to their seeking admission at any other accredited university or institution.${purposeClause} We wish them success in their future academic pursuits.`;
    } else if (selectedType === 'CHARACTER') {
      const purposeClause = trimmedPurpose ? ` Additional Remarks: "${trimmedPurpose}".` : '';
      return `This is to certify that Mr./Ms. ${name}${rollText} is/was a student of Campus Sphere Academy. During their tenure at CampusSphere, they have shown great diligence, high moral character, and cooperative behavior. Their character and conduct have been found to be Good.${purposeClause}`;
    } else if (selectedType === 'NOC') {
      const purposeText = trimmedPurpose ? `"${trimmedPurpose}"` : 'External Internship / Academic Training';
      return `This is to certify that Campus Sphere Academy has No Objection to Mr./Ms. ${name}${rollText}, a bonafide student, undertaking/applying for: ${purposeText}. The institution permits the student to participate provided it does not conflict with scheduled mandatory examinations.`;
    } else if (selectedType === 'PROVISIONAL') {
      const purposeClause = trimmedPurpose ? ` Additional Remarks: "${trimmedPurpose}".` : '';
      return `This is to certify that Mr./Ms. ${name}${rollText} has successfully completed all academic requirements for the award of the Degree. Having fulfilled all prescribed coursework, examinations, and project evaluations, this Provisional Certificate is issued pending the conferment of the Final Degree Diploma at the upcoming Convocation.${purposeClause}`;
    } else if (selectedType === 'MERIT') {
      const purposeClause = trimmedPurpose ? ` in recognition of: "${trimmedPurpose}"` : ' in recognition of outstanding academic performance, leadership, and exemplary dedication to scholarly pursuits';
      return `This Certificate of Academic Excellence & Merit is proudly awarded to Mr./Ms. ${name}${rollText}${purposeClause}.`;
    }
    return '';
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5, pb: 6 }}>
      {/* ── 1. Hero Issuance Banner Card (Glassmorphic Luxury Bar) ────────── */}
      <Card
        sx={{
          p: 3.5,
          borderRadius: '22px',
          border: `1px solid ${theme.custom?.border?.subtle || theme.palette.divider}`,
          background: isDark
            ? 'linear-gradient(135deg, rgba(79, 70, 229, 0.12) 0%, rgba(184, 134, 62, 0.06) 100%)'
            : 'linear-gradient(135deg, rgba(79, 70, 229, 0.06) 0%, rgba(184, 134, 62, 0.04) 100%)',
          backdropFilter: 'blur(12px)',
          boxShadow: theme.custom?.elevation?.raised || '0 8px 24px rgba(0,0,0,0.03)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2.5,
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
            <Chip
              icon={<CardMembershipOutlined sx={{ fontSize: '0.9rem !important', color: `${theme.palette.primary.main} !important` }} />}
              label="ACADEMIC CERTIFICATE HUB"
              size="small"
              sx={{
                bgcolor: `${theme.palette.primary.main}15`,
                color: theme.palette.primary.main,
                fontFamily: theme.typography.mono?.fontFamily || 'monospace',
                fontWeight: 800,
                fontSize: '0.68rem',
                letterSpacing: '0.06em',
                borderRadius: '8px',
              }}
            />
            {CERTIFICATE_TYPES.map((t) => (
              <Chip
                key={t.value}
                label={t.label}
                size="small"
                onClick={() => setValue('type', t.value)}
                sx={{
                  bgcolor: selectedType === t.value ? theme.palette.primary.main : isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
                  color: selectedType === t.value ? '#ffffff' : theme.palette.text.primary,
                  border: `1px solid ${selectedType === t.value ? theme.palette.primary.main : theme.palette.divider}`,
                  fontFamily: theme.typography.mono?.fontFamily || 'monospace',
                  fontSize: '0.72rem',
                  fontWeight: selectedType === t.value ? 700 : 500,
                  cursor: 'pointer',
                  borderRadius: '6px',
                  '&:hover': { opacity: 0.9 },
                }}
              />
            ))}
          </Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 800,
              color: 'text.primary',
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
              mb: 0.5,
            }}
          >
            Certificate Generation Hub
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              maxWidth: 680,
            }}
          >
            Configure, generate, and track official academic certificates (Bonafide, Transfer, Character, NOC, Provisional Degree, and Merit) for enrolled students.
          </Typography>
        </Box>
      </Card>

      {/* ── 2. Top Section: Recent History (Left) & Form (Right) ──────────── */}
      <Grid container spacing={3.5} alignItems="stretch">
        {/* Left Column: Recent Certificate Generations History (Scrollable & Match Form Length) */}
        <Grid item xs={12} md={6} sx={{ display: 'flex' }}>
          <Card
            sx={{
              width: '100%',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: '18px',
              boxShadow: 'none',
              bgcolor: theme.custom?.surface?.raised || theme.palette.background.paper,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%', pb: '24px !important' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: theme.palette.ink[900] }}>
                  Recent Certificate Generations History
                </Typography>
                {auditData?.logs && auditData.logs.length > 0 && (
                  <Chip
                    label={`${auditData.logs.length} Logged`}
                    size="small"
                    sx={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      fontFamily: theme.typography.mono.fontFamily,
                      bgcolor: `${theme.palette.primary.main}12`,
                      color: theme.palette.primary.main,
                    }}
                  />
                )}
              </Box>

              {loadingHistory ? (
                <Box sx={{ display: 'flex', py: 6, justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
                  <CircularProgress size={28} sx={{ color: theme.palette.primary.main }} />
                </Box>
              ) : !auditData?.logs || auditData.logs.length === 0 ? (
                <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                  <CardMembershipOutlined sx={{ fontSize: 38, color: 'text.disabled', mb: 1 }} />
                  <Typography variant="body2">No certificates generated yet.</Typography>
                  <Typography variant="caption" color="text.secondary">Issued certificates will appear here with re-download logs.</Typography>
                </Box>
              ) : (
                <Box sx={{ flexGrow: 1, maxHeight: 310, overflowY: 'auto', pr: 0.5 }}>
                  <TableContainer component={Paper} sx={{ border: 'none', boxShadow: 'none', bgcolor: 'transparent' }}>
                    <Table size="small" stickyHeader>
                      <TableHead sx={{ '& th': { bgcolor: theme.custom?.surface?.sunken || 'rgba(28, 46, 69, 0.04)', py: 1 } }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>STUDENT</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>TYPE</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>PURPOSE</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>ISSUED</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem' }}>ACTION</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {auditData.logs.map((log, idx) => (
                          <TableRow key={log._id || idx} hover>
                            <TableCell sx={{ fontWeight: 600, py: 1.2, fontSize: '0.8rem' }}>
                              {log.after?.studentName || 'Unknown Student'}
                            </TableCell>
                            <TableCell sx={{ py: 1.2 }}>
                              <Chip
                                label={log.after?.type || 'UNKNOWN'}
                                size="small"
                                sx={{
                                  fontWeight: 700,
                                  fontSize: '0.62rem',
                                  color: theme.palette.primary.main,
                                  bgcolor: `${theme.palette.primary.main}15`,
                                  height: 20,
                                  borderRadius: '4px',
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ color: 'text.secondary', fontSize: '0.75rem', py: 1.2, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {log.after?.purpose || '—'}
                            </TableCell>
                            <TableCell sx={{ color: 'text.secondary', fontSize: '0.75rem', py: 1.2, fontFamily: theme.typography.mono.fontFamily }}>
                              {getRelativeTime(log.timestamp)}
                            </TableCell>
                            <TableCell align="right" sx={{ py: 1.2 }}>
                              {log.targetId && (
                                <Button
                                  size="small"
                                  startIcon={<DownloadOutlined sx={{ fontSize: '0.85rem !important' }} />}
                                  onClick={() => downloadPdf(log.targetId, log.after?.type || 'BONAFIDE', log.after?.purpose, log.after?.studentName)}
                                  sx={{ textTransform: 'none', fontSize: '0.72rem', py: 0.2, px: 1, minWidth: 'auto', fontWeight: 700 }}
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
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column: Certificate Generator Form Card */}
        <Grid item xs={12} md={6} sx={{ display: 'flex' }}>
          <Card
            sx={{
              width: '100%',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: '18px',
              boxShadow: 'none',
              bgcolor: theme.custom?.surface?.raised || theme.palette.background.paper,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: theme.palette.ink[900], mb: 3 }}>
                Generate Certificate
              </Typography>

              <Box
                component="form"
                onSubmit={handleSubmit(onGenerateSubmit)}
                sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
              >
                {/* Search Student Autocomplete */}
                <Box>
                  <Typography
                    component="label"
                    htmlFor="student-search-input"
                    sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 0.8 }}
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
                    sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 0.8 }}
                  >
                    Certificate Type
                  </Typography>
                  <Controller
                    name="type"
                    control={control}
                    render={({ field }) => (
                      <TextField id="cert-type-input" select {...field} size="small" fullWidth>
                        {CERTIFICATE_TYPES.map((t) => (
                          <MenuItem key={t.value} value={t.value}>
                            {t.label}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                  />
                </Box>

                {/* Purpose Field (Always visible & optional for all certificate types) */}
                <Box>
                  <Typography
                    component="label"
                    htmlFor="purpose-input"
                    sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 0.8 }}
                  >
                    Stated Purpose / Additional Details (Optional)
                  </Typography>
                  <TextField
                    id="purpose-input"
                    fullWidth
                    size="small"
                    placeholder="e.g. Passport application, Internship, Higher Studies, Special Honor..."
                    {...register('purpose')}
                    error={!!errors.purpose}
                    helperText={errors.purpose?.message || 'Optional. Will be included in the official certificate text if provided.'}
                  />
                </Box>

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
                    mt: 1,
                  }}
                >
                  {generating ? 'Generating PDF...' : 'Generate & Download PDF'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* ── 3. Bottom Section: Full-Width Document Live Watermark Preview ────────────── */}
        <Grid item xs={12}>
          <Card
            sx={{
              p: 4,
              border: `2px double ${theme.palette.brass?.[500] || '#b8863e'}`,
              borderRadius: '16px',
              bgcolor: theme.palette.background.paper,
              position: 'relative',
              boxShadow: theme.custom?.elevation?.raised || 'none',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: theme.palette.brass?.[500] || '#b8863e', fontFamily: theme.typography.mono.fontFamily, letterSpacing: '0.08em' }}>
                FULL-WIDTH LIVE CERTIFICATE WATERMARK PREVIEW
              </Typography>
              <Chip
                icon={<VerifiedUserOutlined sx={{ fontSize: '0.8rem !important' }} />}
                label="OFFICIAL CERTIFICATE PARCHMENT"
                size="small"
                sx={{
                  bgcolor: `${theme.palette.brass?.[500] || '#b8863e'}18`,
                  color: theme.palette.brass?.[500] || '#b8863e',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  fontFamily: theme.typography.mono.fontFamily,
                }}
              />
            </Box>

            <Card
              sx={{
                p: 4.5,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: '14px',
                bgcolor: 'rgba(255, 255, 255, 0.99)',
                textAlign: 'center',
                position: 'relative',
                boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
              }}
            >
              <SchoolOutlined sx={{ fontSize: 44, color: theme.palette.primary.main, mb: 1 }} />
              <Typography variant="h4" sx={{ fontFamily: theme.typography.h1.fontFamily, fontWeight: 800, color: theme.palette.ink[900], letterSpacing: '0.04em', mb: 0.5 }}>
                CAMPUS SPHERE ACADEMY
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2, fontFamily: theme.typography.mono.fontFamily, letterSpacing: '0.12em', fontWeight: 700 }}>
                OFFICIAL INSTITUTIONAL {selectedTypeObj.label.toUpperCase()}
              </Typography>

              <Divider sx={{ my: 2.5, borderColor: theme.palette.brass?.[500] || '#b8863e', borderWidth: 1 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, px: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', fontFamily: theme.typography.mono.fontFamily }}>
                  Ref: CS/CERT/{new Date().getFullYear()}/{Math.floor(100000 + Math.random() * 900000)}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', fontFamily: theme.typography.mono.fontFamily }}>
                  Date of Issue: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </Typography>
              </Box>

              <Typography variant="body1" sx={{ color: theme.palette.text.primary, lineHeight: 2.1, my: 3, px: { xs: 1, md: 4 }, textAlign: 'justify', fontSize: '1.05rem' }}>
                {getPreviewBody()}
              </Typography>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mt: 6, pt: 3, borderTop: `1px solid ${theme.palette.divider}` }}>
                <Box sx={{ textAlign: 'left' }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: theme.palette.ink[900], display: 'block', fontSize: '0.82rem' }}>
                    Controller of Examinations
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem', fontFamily: theme.typography.mono.fontFamily }}>
                    Academic Evaluation Division
                  </Typography>
                </Box>

                <Box sx={{ textAlign: 'center', display: { xs: 'none', sm: 'block' } }}>
                  <Chip
                    label="COMPUTER GENERATED ERP STAMP"
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.62rem', fontFamily: theme.typography.mono.fontFamily, fontWeight: 700, color: 'text.disabled' }}
                  />
                </Box>

                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: theme.palette.ink[900], display: 'block', fontSize: '0.82rem' }}>
                    Registrar & Institutional Seal
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem', fontFamily: theme.typography.mono.fontFamily }}>
                    CampusSphere Office Administration
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Certificates;
