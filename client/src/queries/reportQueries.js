import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../services/api';

/**
 * Hook to retrieve all registered report types from the registry.
 */
export const useReportTypesQuery = () => {
  return useQuery({
    queryKey: ['report-types'],
    queryFn: async () => {
      const response = await api.get('/reports/types');
      return response.data.data;
    },
  });
};

/**
 * Mutation to generate a report file stream (blob) based on type and filters.
 */
export const useGenerateReportMutation = () => {
  return useMutation({
    mutationFn: async ({ type, format, filters }) => {
      const response = await api.post(
        '/reports/generate',
        { type, format, filters },
        { responseType: 'blob' }
      );
      return response;
    },
  });
};

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
