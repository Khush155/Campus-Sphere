import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export const useAdmissionQueueQuery = () => {
  return useQuery({
    queryKey: ['admissions', 'queue'],
    queryFn: async () => {
      const { data } = await api.get('/admissions/queue');
      return data.data;
    },
  });
};

export const useActionAdmissionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, action, notes }) => {
      const { data } = await api.post(`/admissions/${id}/action`, { action, notes });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admissions', 'queue'] });
    },
  });
};
