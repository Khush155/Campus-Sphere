import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export const useSentRequestsQuery = () => {
  return useQuery({
    queryKey: ['requests', 'sent'],
    queryFn: async () => {
      const { data } = await api.get('/cross-dept-requests/sent');
      return data.data;
    },
  });
};

export const useReceivedRequestsQuery = () => {
  return useQuery({
    queryKey: ['requests', 'received'],
    queryFn: async () => {
      const { data } = await api.get('/cross-dept-requests/received');
      return data.data;
    },
  });
};

export const useCreateRequestMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (requestData) => {
      const { data } = await api.post('/cross-dept-requests', requestData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests', 'sent'] });
    },
  });
};

export const useRespondRequestMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, action, responseNotes }) => {
      const { data } = await api.post(`/cross-dept-requests/${id}/respond`, { action, responseNotes });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests', 'received'] });
    },
  });
};

export const useFinalizeRequestMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, pin }) => {
      const { data } = await api.post(`/cross-dept-requests/${id}/finalize`, { pin });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests', 'sent'] });
    },
  });
};
