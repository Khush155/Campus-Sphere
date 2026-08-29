import React, { useMemo } from 'react';
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
  RadioGroup,
  FormControlLabel,
  Radio,
  CircularProgress,
  Divider,
  useTheme,
  Chip,
  Alert,
} from '@mui/material';
import {
  AssessmentOutlined,
  DownloadOutlined,
  FilterListOutlined,
  DescriptionOutlined,
  CheckCircleOutlined,
} from '@mui/icons-material';
import { useDepartmentsQuery } from '../../../queries/collegeQueries';
import {
  useReportTypesQuery,
  useGenerateReportMutation,
} from '../../../queries/reportQueries';
import { useToast } from '../../../contexts/ToastContext';

export const Reports = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { showToast } = useToast();

  // Queries
  const { data: reportTypes, isLoading: loadingTypes, isError: errorTypes } = useReportTypesQuery();
  const { data: depts } = useDepartmentsQuery();

  // Mutation for file generation
  const generateMutation = useGenerateReportMutation();

  const {
    handleSubmit,
    control,
    watch,
    register,
    setValue,
  } = useForm({
    defaultValues: {
      type: '',
      format: 'CSV',
      departmentId: '',
      dateFrom: '',
      dateTo: '',
    },
  });

  const selectedTypeKey = watch('type');
  const selectedFormat = watch('format');
  const selectedDeptId = watch('departmentId');
  const selectedDateFrom = watch('dateFrom');
  const selectedDateTo = watch('dateTo');

  // Find schema properties for progressive disclosures
  const selectedReportType = reportTypes?.find((r) => r.key === selectedTypeKey);
  const showDeptFilter = selectedReportType?.filtersSchema?.includes('departmentId');
  const showDateFilter =
    selectedReportType?.filtersSchema?.includes('dateFrom') ||
    selectedReportType?.filtersSchema?.includes('dateTo');

  // Set default report type when loaded
  React.useEffect(() => {
    if (reportTypes && reportTypes.length > 0 && !selectedTypeKey) {
      setValue('type', reportTypes[0].key);
    }
  }, [reportTypes, selectedTypeKey, setValue]);

  const onExportSubmit = async (data) => {
    if (!data.type) {
      showToast('Please select a report template.', { severity: 'error' });
      return;
    }

    try {
      const payload = {
        type: data.type,
        format: data.format,
        filters: {
          ...(showDeptFilter && data.departmentId && { departmentId: data.departmentId }),
          ...(showDateFilter && data.dateFrom && { dateFrom: data.dateFrom }),
          ...(showDateFilter && data.dateTo && { dateTo: data.dateTo }),
        },
      };

      const response = await generateMutation.mutateAsync(payload);

      // Extract filename from content-disposition header if available
      const disposition = response.headers?.['content-disposition'];
      let filename = `report_${data.type.toLowerCase()}_${Date.now()}.${data.format.toLowerCase()}`;
      if (disposition && disposition.indexOf('filename=') !== -1) {
        const matches = /filename="([^"]+)"/g.exec(disposition);
        if (matches && matches[1]) filename = matches[1];
      }

      // Convert response stream to binary blob trigger
      const fileType = data.format === 'CSV' ? 'text/csv' : 'application/pdf';
      const blob = new Blob([response.data], { type: fileType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showToast(`Report '${selectedReportType?.label || data.type}' downloaded successfully as ${data.format}.`);
    } catch (err) {
      showToast('Failed to generate report. Please try again.', { severity: 'error' });
    }
  };

  const selectedDeptName = useMemo(() => {
    if (!selectedDeptId || !depts) return 'Entire College';
    const match = depts.find((d) => d._id === selectedDeptId);
    return match ? match.name : 'Entire College';
  }, [selectedDeptId, depts]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5, pb: 6 }}>
      {/* ── 1. Hero Export Banner Card (Glassmorphic Luxury Bar) ─────────── */}
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, flexWrap: 'wrap' }}>
            <Chip
              icon={<AssessmentOutlined sx={{ fontSize: '0.9rem !important', color: `${theme.palette.primary.main} !important` }} />}
              label="DATA EXPORT & ANALYTICS CENTER"
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
            <Chip
              label={`${reportTypes?.length || 0} Standard Templates`}
              size="small"
              sx={{
                bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
                border: `1px solid ${theme.palette.divider}`,
                fontFamily: theme.typography.mono?.fontFamily || 'monospace',
                fontSize: '0.72rem',
                fontWeight: 700,
                borderRadius: '6px',
              }}
            />
            <Chip
              label="CSV & PDF Formats"
              size="small"
              sx={{
                bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
                border: `1px solid ${theme.palette.divider}`,
                fontFamily: theme.typography.mono?.fontFamily || 'monospace',
                fontSize: '0.72rem',
                fontWeight: 700,
                borderRadius: '6px',
              }}
            />
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
            Reports &amp; Export Center
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              maxWidth: 680,
            }}
          >
            Select, filter, and compile institutional data into structured spreadsheet CSVs or print-ready PDF reports.
          </Typography>
        </Box>
      </Card>

      {/* ── 2. Interactive Template Selector Cards ────────────────────────── */}
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: theme.palette.ink[900] }}>
          Select Report Template
        </Typography>
        {loadingTypes ? (
          <Box sx={{ display: 'flex', py: 4, justifyContent: 'center' }}>
            <CircularProgress size={28} sx={{ color: theme.palette.primary.main }} />
          </Box>
        ) : errorTypes ? (
          <Alert severity="error" sx={{ borderRadius: '8px' }}>
            Could not load report templates. Please check backend connection.
          </Alert>
        ) : (
          <Grid container spacing={2} alignItems="stretch">
            {reportTypes?.map((r) => {
              const isSelected = selectedTypeKey === r.key;
              return (
                <Grid item xs={12} sm={6} md={3} key={r.key} sx={{ display: 'flex' }}>
                  <Card
                    onClick={() => setValue('type', r.key)}
                    sx={{
                      p: 2.5,
                      width: '100%',
                      height: '100%',
                      minHeight: 155,
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      border: `1px solid ${isSelected ? theme.palette.primary.main : theme.palette.divider}`,
                      bgcolor: isSelected ? `${theme.palette.primary.main}0D` : theme.custom?.surface?.raised || theme.palette.background.paper,
                      transition: 'all 0.2s ease',
                      position: 'relative',
                      '&:hover': {
                        borderColor: theme.palette.primary.main,
                      },
                    }}
                  >
                    {isSelected && (
                      <CheckCircleOutlined
                        sx={{
                          position: 'absolute',
                          top: 12,
                          right: 12,
                          fontSize: 18,
                          color: theme.palette.primary.main,
                        }}
                      />
                    )}
                    <DescriptionOutlined sx={{ fontSize: 28, color: isSelected ? theme.palette.primary.main : theme.palette.text.secondary, mb: 1 }} />
                    <Typography variant="body1" sx={{ fontWeight: 700, color: theme.palette.ink[900], mb: 0.5, fontSize: '0.9rem' }}>
                      {r.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.76rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {r.description}
                    </Typography>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>

      {/* ── 3. Main Form & Configuration Box ──────────────────────────────── */}
      <Grid container spacing={3.5} alignItems="stretch">
        <Grid item xs={12} md={7} sx={{ display: 'flex' }}>
          <Card
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justify: 'space-between',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: '16px',
              boxShadow: 'none',
              bgcolor: theme.custom?.surface?.raised || theme.palette.background.paper,
            }}
          >
            <CardContent sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box
                component="form"
                onSubmit={handleSubmit(onExportSubmit)}
                sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}
              >
                {/* Format Selector */}
                <Box>
                  <Typography
                    component="label"
                    sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}
                  >
                    Export Format
                  </Typography>
                  <Controller
                    name="format"
                    control={control}
                    render={({ field }) => (
                      <RadioGroup row {...field}>
                        <FormControlLabel
                          value="CSV"
                          control={<Radio size="small" />}
                          label={
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              CSV (Spreadsheet)
                            </Typography>
                          }
                          sx={{ mr: 4 }}
                        />
                        <FormControlLabel
                          value="PDF"
                          control={<Radio size="small" />}
                          label={
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              PDF (Print Document)
                            </Typography>
                          }
                        />
                      </RadioGroup>
                    )}
                  />
                </Box>

                {/* Fixed Uniform Scope Filter Block */}
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: '12px',
                    border: `1px solid ${theme.palette.divider}`,
                    bgcolor: theme.custom?.surface?.sunken || 'rgba(0,0,0,0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2.5,
                    minHeight: 225,
                    justifyContent: 'space-between',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FilterListOutlined sx={{ fontSize: 16, color: theme.palette.primary.main }} />
                      <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.78rem' }}>
                        Apply Scope Filters
                      </Typography>
                    </Box>
                    <Chip
                      label={showDeptFilter || showDateFilter ? 'Custom Scope Active' : 'Global Institutional Scope'}
                      size="small"
                      sx={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        fontFamily: theme.typography.mono.fontFamily,
                        bgcolor: showDeptFilter || showDateFilter ? `${theme.palette.primary.main}15` : theme.palette.action.disabledBackground,
                        color: showDeptFilter || showDateFilter ? theme.palette.primary.main : theme.palette.text.secondary,
                      }}
                    />
                  </Box>

                  {/* Department Filter (Active if supported, elegant disabled state if template is global) */}
                  <Box>
                    <Typography
                      component="label"
                      htmlFor="report-dept-input"
                      sx={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: showDeptFilter ? theme.palette.ink[900] : theme.palette.text.disabled, mb: 0.8 }}
                    >
                      Department Scope
                    </Typography>
                    {showDeptFilter ? (
                      <Controller
                        name="departmentId"
                        control={control}
                        render={({ field }) => (
                          <TextField id="report-dept-input" select {...field} size="small" fullWidth helperText="Filter results by specific academic department.">
                            <MenuItem value="">Entire College (All Departments)</MenuItem>
                            {depts?.map((d) => (
                              <MenuItem key={d._id} value={d._id}>
                                {d.name}
                              </MenuItem>
                            ))}
                          </TextField>
                        )}
                      />
                    ) : (
                      <TextField
                        id="report-dept-input"
                        select
                        disabled
                        value=""
                        size="small"
                        fullWidth
                        helperText="Template compiles data across all departments automatically."
                      >
                        <MenuItem value="">Entire College (Global Scope)</MenuItem>
                      </TextField>
                    )}
                  </Box>

                  {/* Date Range Filter (Active if supported, elegant disabled state if template is all-time) */}
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography
                        component="label"
                        htmlFor="date-from-input"
                        sx={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: showDateFilter ? theme.palette.ink[900] : theme.palette.text.disabled, mb: 0.8 }}
                      >
                        Start Date
                      </Typography>
                      <TextField
                        id="date-from-input"
                        type="date"
                        size="small"
                        fullWidth
                        disabled={!showDateFilter}
                        InputLabelProps={{ shrink: true }}
                        {...register('dateFrom')}
                        helperText={showDateFilter ? 'Filter start date' : 'All historical dates included'}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography
                        component="label"
                        htmlFor="date-to-input"
                        sx={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: showDateFilter ? theme.palette.ink[900] : theme.palette.text.disabled, mb: 0.8 }}
                      >
                        End Date
                      </Typography>
                      <TextField
                        id="date-to-input"
                        type="date"
                        size="small"
                        fullWidth
                        disabled={!showDateFilter}
                        InputLabelProps={{ shrink: true }}
                        {...register('dateTo')}
                        helperText={showDateFilter ? 'Filter end date' : 'Up to current date'}
                      />
                    </Grid>
                  </Grid>
                </Box>

                <Divider />

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={generateMutation.isPending || !selectedTypeKey}
                  startIcon={
                    generateMutation.isPending ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <DownloadOutlined />
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
                  {generateMutation.isPending ? 'Compiling Export...' : 'Generate & Download Report'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Scope Compilation Summary Box */}
        <Grid item xs={12} md={5} sx={{ display: 'flex' }}>
          <Card
            sx={{
              width: '100%',
              height: '100%',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: '16px',
              boxShadow: 'none',
              bgcolor: theme.custom?.surface?.raised || theme.palette.background.paper,
              p: 3.5,
              display: 'flex',
              flexDirection: 'column',
              justify: 'space-between',
              gap: 2.5,
            }}
          >
            {/* 1. Header & Readiness Status */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: theme.palette.ink[900] }}>
                Scope Compilation Summary
              </Typography>
              <Chip
                label={selectedTypeKey ? 'READY FOR EXPORT' : 'SELECT TEMPLATE'}
                size="small"
                sx={{
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  fontFamily: theme.typography.mono.fontFamily,
                  bgcolor: selectedTypeKey ? '#10b98118' : theme.palette.action.disabledBackground,
                  color: selectedTypeKey ? '#10b981' : theme.palette.text.secondary,
                }}
              />
            </Box>

            {/* 2. Active Template Context Highlight */}
            {selectedReportType && (
              <Box
                sx={{
                  p: 2,
                  borderRadius: '12px',
                  border: `1px solid ${theme.palette.primary.main}20`,
                  bgcolor: `${theme.palette.primary.main}08`,
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 800, color: theme.palette.primary.main, fontFamily: theme.typography.mono.fontFamily, letterSpacing: '0.06em', display: 'block', mb: 0.5 }}>
                  SELECTED TEMPLATE SPECIFICATION
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.ink[900], mb: 0.5 }}>
                  {selectedReportType.label}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5, lineHeight: 1.4 }}>
                  {selectedReportType.description}
                </Typography>
                {selectedReportType.headers && selectedReportType.headers.length > 0 && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem', fontWeight: 600, display: 'block', mb: 0.5 }}>
                      Expected Dataset Fields:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6 }}>
                      {selectedReportType.headers.map((h) => (
                        <Chip
                          key={h}
                          label={h}
                          size="small"
                          sx={{
                            fontSize: '0.62rem',
                            height: 18,
                            bgcolor: theme.palette.background.paper,
                            border: `1px solid ${theme.palette.divider}`,
                            fontWeight: 600,
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            )}

            {/* 3. Parameter Key-Value Rows */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.8 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Export Format
                </Typography>
                <Chip
                  label={selectedFormat === 'CSV' ? 'CSV (Spreadsheet)' : 'PDF (Print Document)'}
                  size="small"
                  sx={{ fontWeight: 700, fontFamily: theme.typography.mono.fontFamily, bgcolor: `${theme.palette.primary.main}12`, color: theme.palette.primary.main }}
                />
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Target Department
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.ink[900] }}>
                  {showDeptFilter ? selectedDeptName : 'Entire College (Global)'}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Date Window
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: theme.typography.mono.fontFamily, fontSize: '0.78rem', color: theme.palette.ink[900] }}>
                  {showDateFilter
                    ? `${selectedDateFrom || 'Start'} → ${selectedDateTo || 'End'}`
                    : 'All Time (Full History)'}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Data Pipeline
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, fontFamily: theme.typography.mono.fontFamily, color: 'text.secondary' }}>
                  LIVE MONGO AGGREGATION
                </Typography>
              </Box>
            </Box>

            {/* 4. Compilation Readiness Checkpoints */}
            <Box
              sx={{
                p: 2,
                borderRadius: '10px',
                border: `1px dashed ${theme.palette.divider}`,
                bgcolor: theme.custom?.surface?.sunken || 'rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                gap: 0.8,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleOutlined sx={{ fontSize: 15, color: '#10b981' }} />
                <Typography variant="caption" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                  Realtime Database Stream: Active
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleOutlined sx={{ fontSize: 15, color: '#10b981' }} />
                <Typography variant="caption" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                  Format Transformation Engine: {selectedFormat} Encoder Ready
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleOutlined sx={{ fontSize: 15, color: '#10b981' }} />
                <Typography variant="caption" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                  Audit Trail & Security Tracking: Logged Automatically
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 0.5 }} />

            {/* 5. Institutional Compliance Footer */}
            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5, fontSize: '0.72rem' }}>
              Reports compile directly from live database records into structured files. CSV exports are ready for Excel / Google Sheets import. PDF reports render official letterhead branding.
            </Typography>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Reports;
