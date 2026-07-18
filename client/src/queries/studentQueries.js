import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Let AuthContext handle 401s globally if needed, 
    // but React Query will also receive the error to show error states.
    return Promise.reject(error);
  }
);

export const useStudentDashboardQuery = () => {
  return useQuery({
    queryKey: ['studentDashboardSummary'],
    queryFn: async () => {
      const response = await api.get('/student/dashboard/summary');
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
