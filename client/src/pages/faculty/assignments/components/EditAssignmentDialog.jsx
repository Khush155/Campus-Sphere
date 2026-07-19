// client/src/pages/faculty/assignments/components/EditAssignmentDialog.jsx
//
// Dialog modal wrapper for editing existing assignments.
// Reuses the exact same form component as Create Dialog, pre-filling its values.

import React from 'react';
import { Dialog, DialogTitle, DialogContent, Box, Typography } from '@mui/material';
import AssignmentForm from './AssignmentForm';

export const EditAssignmentDialog = ({
  open,
  onClose,
  assignment,
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
          Edit Assignment
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Update the title, details, target sections, or due dates
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1.5 }}>
          <AssignmentForm
            initialValues={assignment}
            availableSections={availableSections}
            onSubmit={onSubmit}
            onCancel={onClose}
            submitText="Save Changes"
            isSubmitting={isSubmitting}
          />
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default EditAssignmentDialog;
