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
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  CircularProgress,
  Divider,
  useTheme,
} from '@mui/material';
import {
  AssessmentOutlined,
  DownloadOutlined,
  FilterListOutlined,
} from '@mui/icons-material';
import { useDepartmentsQuery } from '../../../queries/collegeQueries';
import {
  useReportTypesQuery,
  useGenerateReportMutation,
} from '../../../queries/reportQueries';

export const Reports = () => {
  const theme = useTheme();
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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
    formState: { errors },
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

  // Find schema properties for progressive disclosures
  const selectedReportType = reportTypes?.find((r) => r.key === selectedTypeKey);
  const showDeptFilter = selectedReportType?.filtersSchema?.includes('departmentId');
  const showDateFilter =
    selectedReportType?.filtersSchema?.includes('dateFrom') ||
    selectedReportType?.filtersSchema?.includes('dateTo');

  const onExportSubmit = async (data) => {
    setErrorMsg('');
    setSuccessMsg('');

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
      const disposition = response.headers['content-disposition'];
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

      setSuccessMsg('Report compiled and downloaded successfully.');
    } catch (err) {
      setErrorMsg('Failed to generate report. Please try again.');
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
          Reports & Export Center
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Select, filter, and compile institution records in spreadsheet CSV or printable PDF layouts.
        </Typography>
      </Box>

      {/* Main Form Box */}
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              border: `1px solid ${theme.custom.border.subtle}`,
              borderRadius: '16px',
              boxShadow: 'none',
              bgcolor: theme.custom.surface.raised,
            }}
          >
            <CardContent sx={{ p: 4 }}>
              {errorMsg && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }}>
                  {errorMsg}
                </Alert>
              )}

              {successMsg && (
                <Alert severity="success" sx={{ mb: 3, borderRadius: '8px' }}>
                  {successMsg}
                </Alert>
              )}

              {loadingTypes ? (
                <Box sx={{ display: 'flex', py: 6, justifyContent: 'center' }}>
                  <CircularProgress size={30} sx={{ color: theme.palette.primary.main }} />
                </Box>
              ) : errorTypes ? (
                <Alert severity="error" sx={{ borderRadius: '8px' }}>
                  Could not load report types. Please check backend connection.
                </Alert>
              ) : (
                <Box
                  component="form"
                  onSubmit={handleSubmit(onExportSubmit)}
                  sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}
                >
                  {/* Report Type Select */}
                  <Box>
                    <Typography
                      component="label"
                      sx={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: theme.palette.ink[900], mb: 1 }}
                    >
                      Report Template
                    </Typography>
                    <Controller
                      name="type"
                      control={control}
                      rules={{ required: 'Report template is required' }}
                      render={({ field }) => (
                        <TextField
                          select
                          fullWidth
                          size="small"
                          error={!!errors.type}
                          helperText={errors.type?.message}
                          value={field.value}
                          onChange={field.onChange}
                        >
                          <MenuItem value="">Choose Template...</MenuItem>
                          {reportTypes?.map((r) => (
                            <MenuItem key={r.key} value={r.key}>
                              {r.label}
                            </MenuItem>
                          ))}
                        </TextField>
                      )}
                    />
                    {selectedReportType && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                        {selectedReportType.description}
                      </Typography>
                    )}
                  </Box>

                  {/* Progressive Disclosure Filter Block */}
                  {(showDeptFilter || showDateFilter) && (
                    <Box
                      sx={{
                        p: 2.5,
                        borderRadius: '12px',
                        border: `1px solid ${theme.palette.divider}`,
                        bgcolor: 'rgba(28, 46, 69, 0.01)',
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
                            sx={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: theme.palette.text.secondary, mb: 1 }}
                          >
                            Department
                          </Typography>
                          <Controller
                            name="departmentId"
                            control={control}
                            render={({ field }) => (
                              <TextField select {...field} size="small" fullWidth>
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
                              sx={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: theme.palette.text.secondary, mb: 1 }}
                            >
                              Start Date
                            </Typography>
                            <TextField
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
                              sx={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: theme.palette.text.secondary, mb: 1 }}
                            >
                              End Date
                            </Typography>
                            <TextField
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

                  <Divider />

                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={generateMutation.isPending}
                    startIcon={
                      generateMutation.isPending ? (
                        <CircularProgress size={18} color="inherit" />
                      ) : (
                        <DownloadOutlined />
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
                    {generateMutation.isPending ? 'Compiling Export...' : 'Generate & Download'}
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Side Tip Information */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              border: `1px solid ${theme.custom.border.subtle}`,
              borderRadius: '16px',
              boxShadow: 'none',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              bgcolor: 'rgba(28, 46, 69, 0.01)',
            }}
          >
            <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <AssessmentOutlined sx={{ fontSize: 40, color: theme.palette.primary.main }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.ink[900] }}>
                Dynamic Report Compilations
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                Our reports engine compiles direct snapshots from live database records. If you download a CSV format, it can be imported directly into applications like Microsoft Excel or Google Sheets. The PDF format features official university headers and is formatted for clean printing.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                Future modules (such as fees collection summaries and student attendance trends) will register here automatically as they are introduced in later stages.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Reports;
