import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

/**
 * Hook to retrieve currently active session profile.
 */
export const useActiveSessionQuery = () => {
  return useQuery({
    queryKey: ['active-session'],
    queryFn: async () => {
      const response = await api.get('/academic-sessions/active');
      return response.data.data;
    },
  });
};

/**
 * Hook to retrieve all academic sessions (paginated).
 */
export const useAcademicSessionsQuery = (filters) => {
  return useQuery({
    queryKey: ['academic-sessions', filters],
    queryFn: async () => {
      const response = await api.get('/academic-sessions', { params: filters });
      return response.data;
    },
    placeholderData: (previousData) => previousData,
  });
};

/**
 * Hook to create a new academic session.
 */
export const useCreateAcademicSessionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/academic-sessions', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['active-session'] });
    },
  });
};

/**
 * Hook to explicitly activate a specific academic session.
 */
export const useActivateAcademicSessionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const response = await api.put(`/academic-sessions/${id}/activate`);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['active-session'] });
    },
  });
};
