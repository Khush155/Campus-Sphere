import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

/**
 * Query hook to fetch cheap unread notification count for badge (polls every 30s).
 */
export const useUnreadCountQuery = () => {
  return useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: async () => {
      const response = await api.get('/notifications/unread-count');
      return response.data.data.unreadCount;
    },
    refetchInterval: 30000, // Poll every 30 seconds to keep badge current
    staleTime: 15000,
  });
};

/**
 * Query hook to fetch paginated notification list.
 */
export const useNotificationsQuery = ({ page = 1, limit = 15, unreadOnly = false, enabled = true } = {}) => {
  return useQuery({
    queryKey: ['notifications', { page, limit, unreadOnly }],
    queryFn: async () => {
      const response = await api.get('/notifications', {
        params: { page, limit, unreadOnly },
      });
      return {
        notifications: response.data.data,
        meta: response.data.meta,
      };
    },
    enabled,
    staleTime: 15000,
  });
};

/**
 * Mutation hook to mark a single notification as read.
 */
export const useMarkAsReadMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await api.patch(`/notifications/${id}/read`);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });
};

/**
 * Mutation hook to mark all notifications as read.
 */
export const useMarkAllAsReadMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.patch('/notifications/read-all');
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });
};
