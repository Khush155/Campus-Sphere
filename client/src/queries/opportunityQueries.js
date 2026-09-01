import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export const useOpportunitiesQuery = () => {
  return useQuery({
    queryKey: ['external-opportunities'],
    queryFn: async () => {
      const response = await api.get('/opportunities');
      return response.data.data; // array of opportunities
    },
    staleTime: 5 * 60 * 1000, // cache for 5 mins
  });
};

export const useCreateOpportunityMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/opportunities', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['external-opportunities'] });
    },
  });
};

export const useDeleteOpportunityMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/opportunities/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['external-opportunities'] });
    },
  });
};
