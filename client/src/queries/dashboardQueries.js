import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

/**
 * Fetch HOD Dashboard Statistics
 */
export const useHodDashboardStatsQuery = () => {
  return useQuery({
    queryKey: ['dashboard', 'hod'],
    queryFn: async () => {
      const response = await api.get('/dashboard/hod');
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
};
