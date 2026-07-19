import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export const useOpportunitiesQuery = () => {
  return useQuery({
    queryKey: ['external-opportunities'],
    queryFn: async () => {
      const response = await api.get('/opportunities');
      return response.data.data; // array of opportunities
    },
    staleTime: 5 * 60 * 1000 // cache for 5 mins
  });
};
