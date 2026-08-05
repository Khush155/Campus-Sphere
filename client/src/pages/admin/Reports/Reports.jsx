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
      {/* ── 1. Hero Export Banner Card ─────────────────────────────────────── */}
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
              icon={<AssessmentOutlined sx={{ fontSize: '0.9rem !important', color: `${theme.palette.primary.main} !important` }} />}
              label="DATA EXPORT & ANALYTICS CENTER"
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
              label={`${reportTypes?.length || 0} Standard Templates`}
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
              label="CSV & PDF Formats"
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
            Reports & Export Center
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontFamily: theme.typography.body2.fontFamily,
              color: theme.palette.text.secondary,
              maxWidth: 640,
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

                {/* Progressive Disclosure Filter Block */}
                {(showDeptFilter || showDateFilter) && (
                  <Box
                    sx={{
                      p: 2.5,
                      borderRadius: '12px',
                      border: `1px solid ${theme.palette.divider}`,
                      bgcolor: theme.custom?.surface?.sunken || 'rgba(0,0,0,0.02)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2.5,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FilterListOutlined sx={{ fontSize: 16, color: theme.palette.primary.main }} />
                      <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.78rem' }}>
                        Apply Scope Filters
                      </Typography>
                    </Box>

                    {/* Department filter */}
                    {showDeptFilter && (
                      <Box>
                        <Typography
                          component="label"
                          htmlFor="report-dept-input"
                          sx={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: theme.palette.text.secondary, mb: 1 }}
                        >
                          Department
                        </Typography>
                        <Controller
                          name="departmentId"
                          control={control}
                          render={({ field }) => (
                            <TextField id="report-dept-input" select {...field} size="small" fullWidth>
                              <MenuItem value="">Entire College</MenuItem>
                              {depts?.map((d) => (
                                <MenuItem key={d._id} value={d._id}>
                                  {d.name}
                                </MenuItem>
                              ))}
                            </TextField>
                          )}
                        />
                      </Box>
                    )}

                    {/* Date Range filter */}
                    {showDateFilter && (
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography
                            component="label"
                            htmlFor="date-from-input"
                            sx={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: theme.palette.text.secondary, mb: 1 }}
                          >
                            Start Date
                          </Typography>
                          <TextField
                            id="date-from-input"
                            type="date"
                            size="small"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            {...register('dateFrom')}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography
                            component="label"
                            htmlFor="date-to-input"
                            sx={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: theme.palette.text.secondary, mb: 1 }}
                          >
                            End Date
                          </Typography>
                          <TextField
                            id="date-to-input"
                            type="date"
                            size="small"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            {...register('dateTo')}
                          />
                        </Grid>
                      </Grid>
                    )}
                  </Box>
                )}

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

        {/* Dynamic Scope Summary Box */}
        <Grid item xs={12} md={5} sx={{ display: 'flex' }}>
          <Card
            sx={{
              width: '100%',
              height: '100%',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: '16px',
              boxShadow: 'none',
              bgcolor: theme.custom?.surface?.raised || theme.palette.background.paper,
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              justify: 'space-between',
              gap: 2.5,
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: theme.palette.ink[900] }}>
              Scope Compilation Summary
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Template
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                  {selectedReportType?.label || 'Not Selected'}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Format
                </Typography>
                <Chip
                  label={selectedFormat}
                  size="small"
                  sx={{ fontWeight: 700, fontFamily: theme.typography.mono.fontFamily }}
                />
              </Box>

              {showDeptFilter && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Target Department
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {selectedDeptName}
                  </Typography>
                </Box>
              )}

              {showDateFilter && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Date Range
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: theme.typography.mono.fontFamily, fontSize: '0.78rem' }}>
                    {selectedDateFrom || 'Start'} → {selectedDateTo || 'End'}
                  </Typography>
                </Box>
              )}
            </Box>

            <Divider />

            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              Reports compile directly from live database records into structured files. CSV exports are ready for Excel / Google Sheets import.
            </Typography>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Reports;
