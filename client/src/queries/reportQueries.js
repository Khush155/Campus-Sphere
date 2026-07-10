import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

/**
 * Hook to fetch HOD Overview & Reports metrics
 * Returns { workloadDistribution, vacantSubjects }
 */
export const useHodReportsQuery = () => {
  return useQuery({
    queryKey: ['hod-reports'],
    queryFn: async () => {
      const response = await api.get('/reports/hod');
      return response.data.data;
    },
    refetchInterval: 60000, // Refresh every minute
  });
};
