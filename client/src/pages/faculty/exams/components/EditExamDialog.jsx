// client/src/pages/faculty/exams/components/EditExamDialog.jsx
//
// Dialog modal wrapper for editing an existing exam scheduling.
// Pre-populates reusable ExamForm with values.

import React from 'react';
import { Dialog, DialogTitle, DialogContent, Box, Typography } from '@mui/material';
import ExamForm from './ExamForm';

export const EditExamDialog = ({
  open,
  onClose,
  exam,
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
          Edit Exam Schedule
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Modify the exam type, dates, rooms, duration, and target student sections
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1.5 }}>
          <ExamForm
            initialValues={exam}
            availableSections={availableSections}
            onSubmit={onSubmit}
            onCancel={onClose}
            submitText="Save Schedule"
            isSubmitting={isSubmitting}
          />
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default EditExamDialog;
