// client/src/pages/faculty/exams/components/CreateExamDialog.jsx
//
// Dialog modal wrapper for scheduling a new exam.
// Houses the reusable ExamForm.

import React from 'react';
import { Dialog, DialogTitle, DialogContent, Box, Typography } from '@mui/material';
import ExamForm from './ExamForm';

export const CreateExamDialog = ({
  open,
  onClose,
  availableSections = [],
  onSubmit,
  isSubmitting = false,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 3,
          p: 1.5,
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>
          Schedule Exam
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Configure room halls, dates, weights, and select student sections
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1.5 }}>
          <ExamForm
            availableSections={availableSections}
            onSubmit={onSubmit}
            onCancel={onClose}
            submitText="Schedule & Publish"
            isSubmitting={isSubmitting}
          />
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default CreateExamDialog;
