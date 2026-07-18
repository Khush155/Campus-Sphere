import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

/**
 * Hook to fetch paginated and filtered users list.
 */
export const useUsersQuery = (filters, options = {}) => {
  return useQuery({
    queryKey: ['users', filters],
    queryFn: async () => {
      const response = await api.get('/users', { params: filters });
      return response.data; // Shape: { success: true, data: Array, meta: Object }
    },
    keepPreviousData: true,
    ...options,
  });
};

/**
 * Hook to update user profile parameters (status, role, department, or student info).
 */
export const useUpdateUserMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/users/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
    },
  });
};

/**
 * Hook to soft delete (deactivate) a user account.
 */
export const useDeleteUserMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/users/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
    },
  });
};

/**
 * Hook to fetch the last 8 audit logs.
 */
export const useAuditLogsQuery = () => {
  return useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const response = await api.get('/users/audit-logs');
      return response.data.data; // Array of last 8 entries
    },
    refetchInterval: 15000, // Periodically refresh logs
  });
};

/**
 * Hook to register a new user.
 */
export const useRegisterMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userData) => {
      const response = await api.post('/auth/register', userData);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
    },
  });
};

/**
 * Hook to fetch proactive institutional insights.
 */
export const useInsightsQuery = () => {
  return useQuery({
    queryKey: ['insights'],
    queryFn: async () => {
      const response = await api.get('/users/insights');
      return response.data.data;
    },
    refetchInterval: 30000,
  });
};

/**
 * Hook to fetch details for a single user by ID.
 */
export const useUserQuery = (id) => {
  return useQuery({
    queryKey: ['user', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await api.get(`/users/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });
};
