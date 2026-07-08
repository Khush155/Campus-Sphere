import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Avatar,
  Divider,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  FactCheck as ApprovalIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  PersonAdd as UserIcon,
  Business as DeptIcon,
  EventNote as LeaveIcon,
} from '@mui/icons-material';

const ApprovalsHub = () => {
  const queryClient = useQueryClient();

  const { data: approvalsData, isLoading } = useQuery({
    queryKey: ['approvals'],
    queryFn: () => api.get('/approvals').then(res => res.data.data),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/approvals/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['approvals']);
    },
  });

  const pendingRequests = approvalsData || [];

  const handleAction = (id, status) => {
    updateStatusMutation.mutate({ id, status });
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: { xs: 2, md: 3 } }}>
      <Box sx={{ mb: 4, display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
            <ApprovalIcon fontSize="large" color="primary" />
            Pending Approvals
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Review and authorize administrative requests.
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {pendingRequests.map((request) => (
          <Grid item xs={12} key={request.id}>
            <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', transition: 'transform 0.2s', '&:hover': { transform: 'translateX(4px)' } }}>
              <CardContent sx={{ p: { xs: 2, sm: 3 }, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, gap: 3 }}>
                <Avatar sx={{ bgcolor: `${request.color}.light`, width: 56, height: 56 }}>
                  {request.type === 'Leave Request' ? <LeaveIcon color="warning" /> : request.type === 'Department Creation' ? <DeptIcon color="secondary" /> : <UserIcon color="primary" />}
                </Avatar>
                
                <Box sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {request.title}
                    </Typography>
                    <Chip label={request.type} size="small" variant="outlined" color={request.color} sx={{ fontWeight: 600, ml: 1 }} />
                  </Box>
                  <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 1 }}>
                    {request.description}
                  </Typography>
                  <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 600 }}>
                    Requested on {request.date} • ID: {request.id}
                  </Typography>
                </Box>

                <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />

                <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' }, justifyContent: 'flex-end', pt: { xs: 2, sm: 0 } }}>
                  <Button 
                    variant="outlined" 
                    color="error" 
                    startIcon={<RejectIcon />}
                    sx={{ borderRadius: 2, flexGrow: { xs: 1, sm: 0 } }}
                    onClick={() => handleAction(request.id, 'Rejected')}
                    disabled={updateStatusMutation.isPending}
                  >
                    Reject
                  </Button>
                  <Button 
                    variant="contained" 
                    color="success" 
                    startIcon={<ApproveIcon />}
                    sx={{ borderRadius: 2, flexGrow: { xs: 1, sm: 0 } }}
                    onClick={() => handleAction(request.id, 'Approved')}
                    disabled={updateStatusMutation.isPending}
                  >
                    Approve
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      {pendingRequests.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">All caught up!</Typography>
          <Typography variant="body2" color="text.disabled">No pending approvals at the moment.</Typography>
        </Box>
      )}
    </Box>
  );
};

export default ApprovalsHub;
