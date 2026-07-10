// client/src/pages/faculty/assignments/components/CreateAssignmentDialog.jsx
//
// Dialog modal wrapper for creating new assignments.
// Houses the reusable AssignmentForm.

import React from 'react';
import { Dialog, DialogTitle, DialogContent, Box, Typography } from '@mui/material';
import AssignmentForm from './AssignmentForm';

export const CreateAssignmentDialog = ({
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
          Create Assignment
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Publish a new assignment task to selected student sections
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1.5 }}>
          <AssignmentForm
            availableSections={availableSections}
            onSubmit={onSubmit}
            onCancel={onClose}
            submitText="Create & Publish"
            isSubmitting={isSubmitting}
          />
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAssignmentDialog;
