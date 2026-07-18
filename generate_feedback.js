const fs = require('fs');

let queriesContent = fs.readFileSync('client/src/queries/hodQueries.js', 'utf8');

queriesContent += 
export const useFeedbackQuery = () => {
  return useQuery({
    queryKey: ['feedback'],
    queryFn: async () => {
      const response = await api.get('/feedback');
      return response.data.data || [];
    }
  });
};

export const useCreateFeedbackMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/feedback', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['feedback']);
    }
  });
};
;
fs.writeFileSync('client/src/queries/hodQueries.js', queriesContent);

const componentContent = import React, { useState } from 'react';
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Rating } from '@mui/material';
import { AddOutlined } from '@mui/icons-material';
import DataTable from '../../../components/common/DataTable';
import { useFeedbackQuery, useCreateFeedbackMutation } from '../../../queries/hodQueries';
import { useUsersQuery } from '../../../queries/userQueries';

const HodFeedbackHub = () => {
  const [openModal, setOpenModal] = useState(false);
  const [formData, setFormData] = useState({ targetRole: 'FACULTY', rating: 5, comments: '' });

  const { data, isLoading, isError } = useFeedbackQuery();
  const createMutation = useCreateFeedbackMutation();
  const { data: users } = useUsersQuery({ role: formData.targetRole });

  const columns = [
    { id: 'targetRole', label: 'Role Evaluated' },
    { id: 'targetUser', label: 'Evaluated Person', render: (row) => row.targetUser ? \\ \\ : 'N/A' },
    { id: 'rating', label: 'Rating (1-5)' },
    { id: 'comments', label: 'Comments' },
  ];

  const handleOpen = () => setOpenModal(true);
  const handleClose = () => {
    setOpenModal(false);
    setFormData({ targetRole: 'FACULTY', rating: 5, comments: '' });
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData, {
      onSuccess: () => {
        handleClose();
      }
    });
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">Feedback Management</Typography>
        <Button variant="contained" startIcon={<AddOutlined />} onClick={handleOpen}>Submit Feedback</Button>
      </Box>

      <DataTable 
        columns={columns} 
        data={data} 
        isLoading={isLoading} 
        isError={isError} 
        emptyMessage="No feedback records found."
      />

      <Dialog open={openModal} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Submit New Feedback</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent dividers>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField select label="Target Role" name="targetRole" value={formData.targetRole} onChange={handleChange} required fullWidth>
                <MenuItem value="FACULTY">Faculty</MenuItem>
                <MenuItem value="STUDENT">Student</MenuItem>
              </TextField>
              <TextField select label="Select Person" name="targetUser" value={formData.targetUser || ''} onChange={handleChange} required fullWidth>
                {users?.data?.map(u => (
                  <MenuItem key={u._id} value={u._id}>{u.firstName} {u.lastName}</MenuItem>
                ))}
              </TextField>
              <Box>
                <Typography component="legend">Rating</Typography>
                <Rating name="rating" value={Number(formData.rating)} onChange={(event, newValue) => setFormData({...formData, rating: newValue})} />
              </Box>
              <TextField label="Comments" name="comments" value={formData.comments} onChange={handleChange} required fullWidth multiline rows={4} />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={createMutation.isLoading}>
              {createMutation.isLoading ? 'Submitting...' : 'Submit'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default HodFeedbackHub;
;

const dir = 'client/src/pages/hod/FeedbackHub';
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}
fs.writeFileSync(dir + '/HodFeedbackHub.jsx', componentContent);

// Add to AppRoutes.jsx
let appRoutes = fs.readFileSync('client/src/routes/AppRoutes.jsx', 'utf8');
if (!appRoutes.includes('HodFeedbackHub')) {
  appRoutes = appRoutes.replace(
    \"import HodOpportunitiesHub from '../pages/hod/OpportunitiesHub/HodOpportunitiesHub';\",
    \"import HodOpportunitiesHub from '../pages/hod/OpportunitiesHub/HodOpportunitiesHub';\\nimport HodFeedbackHub from '../pages/hod/FeedbackHub/HodFeedbackHub';\"
  );
  appRoutes = appRoutes.replace(
    \"<Route path=\\\"hod/opportunities\\\" element={<RoleRoute allowedRoles={['HOD']}><HodOpportunitiesHub /></RoleRoute>} />\",
    \"<Route path=\\\"hod/opportunities\\\" element={<RoleRoute allowedRoles={['HOD']}><HodOpportunitiesHub /></RoleRoute>} />\\n        <Route path=\\\"hod/feedback\\\" element={<RoleRoute allowedRoles={['HOD']}><HodFeedbackHub /></RoleRoute>} />\"
  );
  fs.writeFileSync('client/src/routes/AppRoutes.jsx', appRoutes);
}
