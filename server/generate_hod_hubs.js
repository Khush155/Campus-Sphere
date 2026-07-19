const fs = require('fs');
const path = require('path');

const endpoints = [
  { name: 'Attendance', route: 'attendance', columns: [{id: 'date', label: 'Date'}, {id: 'status', label: 'Status'}] },
  { name: 'Examinations', route: 'examinations', columns: [{id: 'title', label: 'Title'}, {id: 'date', label: 'Date'}, {id: 'status', label: 'Status'}] },
  { name: 'Projects', route: 'projects', columns: [{id: 'title', label: 'Title'}, {id: 'status', label: 'Status'}] },
  { name: 'Placements', route: 'placements', columns: [{id: 'company', label: 'Company'}, {id: 'role', label: 'Role'}, {id: 'status', label: 'Status'}] },
  { name: 'Leave', route: 'leaves', columns: [{id: 'reason', label: 'Reason'}, {id: 'status', label: 'Status'}] },
  { name: 'Notices', route: 'notices', columns: [{id: 'title', label: 'Title'}, {id: 'date', label: 'Date'}] },
  { name: 'Complaints', route: 'complaints', columns: [{id: 'subject', label: 'Subject'}, {id: 'status', label: 'Status'}] },
  { name: 'Documents', route: 'documents', columns: [{id: 'title', label: 'Title'}, {id: 'type', label: 'Type'}] },
  { name: 'Meetings', route: 'meetings', columns: [{id: 'title', label: 'Title'}, {id: 'date', label: 'Date'}] },
];

let queriesContent = "import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';\nimport api from '../services/api';\n\n";

endpoints.forEach(ep => {
  queriesContent += `export const use${ep.name}Query = () => {
  return useQuery({
    queryKey: ['${ep.route}'],
    queryFn: async () => {
      const response = await api.get('/${ep.route}');
      return response.data.data || [];
    }
  });
};\n\n`;

  queriesContent += `export const useCreate${ep.name}Mutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/${ep.route}', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['${ep.route}']);
    }
  });
};\n\n`;
});

fs.writeFileSync('client/src/queries/hodQueries.js', queriesContent);

endpoints.forEach(ep => {
  const componentContent = `import React, { useState } from 'react';
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { AddOutlined } from '@mui/icons-material';
import DataTable from '../../../components/common/DataTable';
import { use${ep.name}Query, useCreate${ep.name}Mutation } from '../../../queries/hodQueries';

const Hod${ep.name}Hub = () => {
  const [openModal, setOpenModal] = useState(false);
  const [formData, setFormData] = useState({});

  const { data, isLoading, isError } = use${ep.name}Query();
  const createMutation = useCreate${ep.name}Mutation();

  const columns = ${JSON.stringify(ep.columns)};

  const handleOpen = () => setOpenModal(true);
  const handleClose = () => {
    setOpenModal(false);
    setFormData({});
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
        <Typography variant="h4" fontWeight="bold">${ep.name} Management</Typography>
        <Button variant="contained" startIcon={<AddOutlined />} onClick={handleOpen}>Add New</Button>
      </Box>

      <DataTable 
        columns={columns} 
        data={data} 
        isLoading={isLoading} 
        isError={isError} 
        emptyMessage="No records found."
      />

      {/* Add Modal */}
      <Dialog open={openModal} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Add New ${ep.name}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent dividers>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              ${ep.columns.map(c => `<TextField label="${c.label}" name="${c.id}" onChange={handleChange} required fullWidth />`).join('\n              ')}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={createMutation.isLoading}>
              {createMutation.isLoading ? 'Adding...' : 'Save'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Hod${ep.name}Hub;
`;

  const dir = `client/src/pages/hod/${ep.name}Hub`;
  if (!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(`${dir}/Hod${ep.name}Hub.jsx`, componentContent);
});

console.log('Successfully generated hooks and 9 HOD Hubs!');
