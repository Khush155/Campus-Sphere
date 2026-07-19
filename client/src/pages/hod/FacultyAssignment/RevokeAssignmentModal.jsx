import React from 'react';
import ConfirmDeleteModal from '../../../components/common/ConfirmDeleteModal';

const RevokeAssignmentModal = ({ open, onClose, onConfirm, assignment }) => {
  return (
    <ConfirmDeleteModal
      open={open}
      onClose={onClose}
      onConfirm={() => onConfirm(assignment._id)}
      title="Revoke Faculty Assignment"
      description={`Are you sure you want to revoke the assignment of ${assignment?.facultyId?.name} from ${assignment?.subjectId?.name}? This action will mark the assignment as REVOKED and cannot be undone.`}
      actionText="Revoke Assignment"
      typedConfirmation={true}
      confirmationWord="REVOKE"
    />
  );
};

export default RevokeAssignmentModal;
