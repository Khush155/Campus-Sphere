import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

/**
 * Hook to fetch paginated and filtered notices list (admin view).
 */
export const useNoticesQuery = (filters) => {
  return useQuery({
    queryKey: ['notices', filters],
    queryFn: async () => {
      const response = await api.get('/notices', { params: filters });
      return response.data; // Shape: { success: true, data: Array, meta: Object }
    },
    placeholderData: (previousData) => previousData,
  });
};

/**
 * Hook to fetch notice details by ID.
 */
export const useNoticeQuery = (id) => {
  return useQuery({
    queryKey: ['notice', id],
    queryFn: async () => {
      const response = await api.get(`/notices/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });
};

/**
 * Hook to create a new notice.
 */
export const useCreateNoticeMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/notices', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notices'] });
    },
  });
};

/**
 * Hook to update notice parameters.
 */
export const useUpdateNoticeMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/notices/${id}`, data);
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notices'] });
      queryClient.invalidateQueries({ queryKey: ['notice', variables.id] });
    },
  });
};

/**
 * Hook to archive (soft delete) a notice.
 */
export const useArchiveNoticeMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/notices/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notices'] });
    },
  });
};

/**
 * Hook to fetch notice feed (user dashboard view).
 */
export const useFeedQuery = (filters) => {
  return useQuery({
    queryKey: ['notices-feed', filters],
    queryFn: async () => {
      const response = await api.get('/notices/feed', { params: filters });
      return response.data;
    },
  });
};
