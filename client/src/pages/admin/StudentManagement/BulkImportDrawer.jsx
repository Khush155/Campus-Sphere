import React, { useState, useRef, useCallback } from 'react';
import {
  Drawer,
  Box,
  Typography,
  Button,
  Divider,
  CircularProgress,
  Alert,
  useTheme,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from '@mui/material';
import {
  CloseOutlined,
  UploadFileOutlined,
  CheckCircleOutline,
  ErrorOutline,
  DownloadOutlined,
} from '@mui/icons-material';
import { useBulkImportMutation, useBulkImportJsonMutation } from '../../../queries/studentQueries';

const CSV_TEMPLATE =
  'name,email,password,role,departmentCode,courseCode,branchCode,semester\n' +
  'John Doe,john.doe@college.edu,password123,STUDENT,CSE,BTECH,CSAI,1\n' +
  'Jane Smith,jane.smith@college.edu,password123,FACULTY,ECE,,,';

const downloadTemplate = () => {
  const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'campussphere_import_template.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const BulkImportDrawer = ({ open, onClose }) => {
  const theme = useTheme();
  const fileInputRef = useRef(null);

  const [step, setStep] = useState(1); // 1: Upload, 2: Edit/DryRun, 3: Success
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  
  const [dryRunData, setDryRunData] = useState(null);
  const [editedRows, setEditedRows] = useState([]);
  
  const [importResult, setImportResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const { mutateAsync: bulkImport, isLoading: isParsing } = useBulkImportMutation();
  const { mutateAsync: bulkImportJson, isLoading: isImporting } = useBulkImportJsonMutation();

  const handleClose = useCallback(() => {
    if (!isParsing && !isImporting) {
      setStep(1);
      setSelectedFile(null);
      setDryRunData(null);
      setEditedRows([]);
      setImportResult(null);
      setErrorMessage('');
      onClose();
    }
  }, [isParsing, isImporting, onClose]);

  const handleFileSelect = useCallback((file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setErrorMessage('Only .csv files are accepted.');
      return;
    }
    setSelectedFile(file);
    setErrorMessage('');
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files[0]);
  }, [handleFileSelect]);

  const handleInputChange = useCallback((e) => {
    handleFileSelect(e.target.files[0]);
    e.target.value = '';
  }, [handleFileSelect]);

  const handleDryRun = useCallback(async () => {
    if (!selectedFile) return;
    setErrorMessage('');
    try {
      const result = await bulkImport({ file: selectedFile, dryRun: true });
      setDryRunData(result);
      // Initialize editable rows
      setEditedRows(result.report.map(r => ({ ...r.data })));
      setStep(2);
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || err?.message || 'Upload failed.');
    }
  }, [selectedFile, bulkImport]);

  const handleRevalidate = useCallback(async () => {
    setErrorMessage('');
    try {
      const result = await bulkImportJson(editedRows);
      setImportResult(result);
      setStep(3);
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || err?.message || 'Import failed.');
    }
  }, [editedRows, bulkImportJson]);

  const updateRow = (index, field, value) => {
    const updated = [...editedRows];
    updated[index][field] = value;
    setEditedRows(updated);
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={handleClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', md: step === 2 ? '80%' : 480 },
          maxWidth: step === 2 ? 1000 : undefined,
          bgcolor: theme.palette.background.default,
          boxShadow: theme.custom?.elevation?.overlay,
        },
      }}
    >
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.custom.border.subtle}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <UploadFileOutlined sx={{ color: theme.palette.primary.main }} />
          <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.ink[900] }}>
            {step === 1 ? 'Bulk Import Users' : step === 2 ? 'Pre-flight Editor' : 'Import Complete'}
          </Typography>
        </Box>
        <IconButton onClick={handleClose} disabled={isParsing || isImporting} size="small">
          <CloseOutlined fontSize="small" />
        </IconButton>
      </Box>

      <Box sx={{ p: 3, overflowY: 'auto', flex: 1 }}>
        {errorMessage && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: '10px' }}>
            {errorMessage}
          </Alert>
        )}

        {/* STEP 1: UPLOAD */}
        {step === 1 && (
          <Box>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 2.5 }}>
              Upload a <strong>.csv</strong> file. The system will parse it and show a preview where you can fix errors before finalizing.
            </Typography>

            <Button size="small" variant="outlined" startIcon={<DownloadOutlined />} onClick={downloadTemplate} sx={{ mb: 3, textTransform: 'none' }}>
              Download CSV Template
            </Button>

            <Box sx={{ mb: 3, p: 1.5, borderRadius: '8px', bgcolor: theme.custom.surface.raised, border: `1px solid ${theme.custom.border.subtle}` }}>
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: theme.palette.text.secondary, mb: 1 }}>
                Required Columns
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {['name', 'email', 'password', 'role', 'departmentCode', 'courseCode', 'branchCode', 'semester'].map(col => (
                  <Chip key={col} label={col} size="small" sx={{ fontSize: '0.72rem', bgcolor: theme.custom.interaction.hoverTint, color: theme.palette.primary.main }} />
                ))}
              </Box>
            </Box>

            <Box
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              sx={{
                border: `2px dashed ${dragOver ? theme.palette.primary.main : theme.custom.border.subtle}`,
                borderRadius: '12px', p: 4, textAlign: 'center', cursor: 'pointer',
                bgcolor: dragOver ? theme.custom.interaction.hoverTint : theme.custom.surface.raised,
              }}
            >
              <input ref={fileInputRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleInputChange} />
              <UploadFileOutlined sx={{ fontSize: 40, color: theme.palette.text.disabled, mb: 1.5 }} />
              {selectedFile ? (
                <>
                  <Typography sx={{ fontWeight: 700, color: theme.palette.primary.main, fontSize: '0.9rem' }}>{selectedFile.name}</Typography>
                  <Typography sx={{ fontSize: '0.78rem', color: theme.palette.text.secondary }}>{(selectedFile.size / 1024).toFixed(1)} KB</Typography>
                </>
              ) : (
                <Typography sx={{ fontWeight: 600, color: theme.palette.ink[900] }}>Drag & Drop a CSV file here</Typography>
              )}
            </Box>
          </Box>
        )}

        {/* STEP 2: DRY RUN EDITOR */}
        {step === 2 && dryRunData && (
          <Box>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Chip icon={<CheckCircleOutline />} label={`${dryRunData.validCount} Valid`} color="success" />
              <Chip icon={<ErrorOutline />} label={`${dryRunData.errorCount} Errors`} color="error" variant={dryRunData.errorCount > 0 ? "filled" : "outlined"} />
            </Box>
            
            <Typography variant="body2" sx={{ mb: 2 }}>
              Review your data below. Rows with errors are highlighted in red. You can edit cells directly to fix typos.
            </Typography>

            <TableContainer sx={{ border: `1px solid ${theme.custom.border.subtle}`, borderRadius: '8px', maxHeight: '500px' }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Row</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Course</TableCell>
                    <TableCell>Branch</TableCell>
                    <TableCell>Errors</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dryRunData.report.map((row, idx) => {
                    const rowData = editedRows[idx];
                    const isError = !row.isValid;
                    return (
                      <TableRow key={idx} sx={{ bgcolor: isError ? 'rgba(211, 47, 47, 0.05)' : 'inherit' }}>
                        <TableCell>{row.row}</TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            variant="standard"
                            value={rowData.email || ''}
                            onChange={(e) => updateRow(idx, 'email', e.target.value)}
                            InputProps={{ disableUnderline: true }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            variant="standard"
                            value={rowData.departmentCode || ''}
                            onChange={(e) => updateRow(idx, 'departmentCode', e.target.value)}
                            InputProps={{ disableUnderline: true }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            variant="standard"
                            value={rowData.courseCode || ''}
                            onChange={(e) => updateRow(idx, 'courseCode', e.target.value)}
                            InputProps={{ disableUnderline: true }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            variant="standard"
                            value={rowData.branchCode || ''}
                            onChange={(e) => updateRow(idx, 'branchCode', e.target.value)}
                            InputProps={{ disableUnderline: true }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: theme.palette.signal.error, fontSize: '0.75rem', maxWidth: 200 }}>
                          {row.errors.join('; ')}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* STEP 3: SUCCESS RESULT */}
        {step === 3 && importResult && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckCircleOutline sx={{ fontSize: 64, color: theme.palette.signal.success, mb: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Import Completed!</Typography>
            <Typography sx={{ color: theme.palette.text.secondary }}>
              Successfully imported <strong>{importResult.imported}</strong> users.
              {importResult.skipped > 0 && ` Skipped ${importResult.skipped} users due to database constraints.`}
            </Typography>
            
            {importResult.errors?.length > 0 && (
               <Alert severity="warning" sx={{ mt: 3, textAlign: 'left' }}>
                  {importResult.errors.map((e, i) => <div key={i}>{e.email}: {e.errors.join(', ')}</div>)}
               </Alert>
            )}
          </Box>
        )}
      </Box>

      {/* FOOTER */}
      <Box sx={{ p: 3, borderTop: `1px solid ${theme.custom.border.subtle}`, display: 'flex', gap: 2 }}>
        {step === 1 && (
          <>
            <Button fullWidth variant="outlined" onClick={handleClose} disabled={isParsing}>Cancel</Button>
            <Button fullWidth variant="contained" onClick={handleDryRun} disabled={!selectedFile || isParsing}>
              {isParsing ? <CircularProgress size={20} color="inherit" /> : 'Validate Data'}
            </Button>
          </>
        )}
        {step === 2 && (
          <>
            <Button fullWidth variant="outlined" onClick={() => setStep(1)} disabled={isImporting}>Back</Button>
            <Button fullWidth variant="contained" onClick={handleRevalidate} disabled={isImporting}>
              {isImporting ? <CircularProgress size={20} color="inherit" /> : 'Submit & Import'}
            </Button>
          </>
        )}
        {step === 3 && (
          <Button fullWidth variant="contained" onClick={handleClose}>Done</Button>
        )}
      </Box>
    </Drawer>
  );
};

export default BulkImportDrawer;
