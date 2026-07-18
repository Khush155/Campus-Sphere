import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

// --- Library ---
export const useLibraryQuery = () => {
  return useQuery({
    queryKey: ['studentLibrary'],
    queryFn: async () => {
      const response = await api.get('/student/library');
      return response.data.data;
    },
  });
};

// --- Leave Requests ---
export const useLeaveQuery = () => {
  return useQuery({
    queryKey: ['studentLeaves'],
    queryFn: async () => {
      const response = await api.get('/student/leave');
      return response.data.data;
    },
  });
};

export const useApplyLeaveMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/student/leave', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentLeaves'] });
    },
  });
};

// --- Complaints ---
export const useComplaintsQuery = () => {
  return useQuery({
    queryKey: ['studentComplaints'],
    queryFn: async () => {
      const response = await api.get('/student/complaints');
      return response.data.data;
    },
  });
};

export const useRaiseComplaintMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/student/complaints', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentComplaints'] });
    },
  });
};

// --- Profile / Social Links ---
export const useUpdateProfileMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.put('/student/profile', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] }); // usually the auth context holds the user data
    },
  });
};
