import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert
} from '@mui/material';
import { useCreateBulkSubjectsMutation } from '../../../queries/collegeQueries';

const BulkSubjectModal = ({ open, onClose }) => {
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  
  const bulkMutation = useCreateBulkSubjectsMutation();

  const handleClose = () => {
    setJsonText('');
    setError(null);
    setSuccessMsg(null);
    onClose();
  };

  const handleSubmit = () => {
    setError(null);
    setSuccessMsg(null);

    if (!jsonText.trim()) {
      setError('Please paste JSON array of subjects.');
      return;
    }

    let parsedData = [];
    try {
      parsedData = JSON.parse(jsonText);
    } catch (e) {
      setError('Invalid JSON format. Please ensure it is a valid array of objects.');
      return;
    }

    if (!Array.isArray(parsedData)) {
      setError('JSON must be an array of objects [ { ... } ].');
      return;
    }

    if (parsedData.length === 0) {
      setError('Array is empty.');
      return;
    }

    bulkMutation.mutate({ subjects: parsedData }, {
      onSuccess: (res) => {
        // the response returns { data: { results: ... } } because api wrapper extracts axios response,
        // wait, let's just use res.data if the mutation returns response.data
        const results = res.data?.results || res.results; 
        if (results && results.failed > 0) {
          setError(`Imported ${results.successful} subjects. Failed ${results.failed}. Errors: ${results.errors.join(' | ')}`);
        } else {
          setSuccessMsg(`Successfully imported ${results?.successful || parsedData.length} subjects!`);
          setTimeout(handleClose, 2000);
        }
      },
      onError: (err) => {
        setError(err.response?.data?.message || err.message || 'An error occurred during bulk import.');
      }
    });
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Bulk Import Subjects</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" paragraph>
            Paste a JSON array containing the subjects you want to import. Make sure you provide the exact Branch ID for each subject.
          </Typography>
          <Typography variant="caption" sx={{ fontFamily: 'monospace', display: 'block', bgcolor: 'rgba(0,0,0,0.05)', p: 1, borderRadius: 1 }}>
            {`[
  {
    "name": "Data Structures",
    "code": "CS201",
    "credits": 4,
    "type": "THEORY",
    "semester": 3,
    "branchId": "65ab...cdef"
  }
]`}
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {successMsg && <Alert severity="success" sx={{ mb: 2 }}>{successMsg}</Alert>}

        <TextField
          multiline
          rows={12}
          fullWidth
          variant="outlined"
          placeholder="Paste JSON here..."
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          sx={{ '& .MuiInputBase-input': { fontFamily: 'monospace', fontSize: '0.85rem' } }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button 
          variant="contained" 
          onClick={handleSubmit}
          disabled={bulkMutation.isLoading}
        >
          {bulkMutation.isLoading ? 'Importing...' : 'Import JSON'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BulkSubjectModal;
