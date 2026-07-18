import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

/**
 * Hook to retrieve paginated and filtered audit logs.
 */
export const useAuditLogsQuery = (params) => {
  return useQuery({
    queryKey: ['audit-logs', params],
    queryFn: async () => {
      const response = await api.get('/audit-logs', { params });
      return response.data.data;
    },
  });
};

/**
 * Hook to retrieve unique logged action enums from the backend.
 */
export const useAuditActionsQuery = () => {
  return useQuery({
    queryKey: ['audit-actions'],
    queryFn: async () => {
      const response = await api.get('/audit-logs/actions');
      return response.data.data;
    },
  });
};
