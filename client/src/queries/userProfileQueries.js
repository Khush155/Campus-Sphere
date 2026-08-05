import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

/**
 * Query hook to fetch current logged-in user profile & metadata.
 */
export const useMyProfileQuery = () => {
  return useQuery({
    queryKey: ['my-profile'],
    queryFn: async () => {
      const response = await api.get('/users/me');
      const data = response.data?.data;
      if (data && data.user) {
        return {
          ...data.user,
          profileMeta: data.profileMeta,
        };
      }
      return data;
    },
  });
};

/**
 * Mutation hook to update self profile & password.
 */
export const useUpdateMyProfileMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.put('/users/me', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
    },
  });
};
