import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

/**
 * Hook to retrieve the singleton College Profile configuration.
 */
export const useCollegeProfileQuery = () => {
  return useQuery({
    queryKey: ['college-profile'],
    queryFn: async () => {
      const response = await api.get('/college-profile');
      return response.data.data;
    },
  });
};

/**
 * Hook to update the College Profile text fields.
 */
export const useUpdateCollegeProfileMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.put('/college-profile', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['college-profile'] });
    },
  });
};

/**
 * Hook to upload/replace the College Profile branding logo image.
 */
export const useUploadLogoMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData) => {
      const response = await api.post('/college-profile/logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['college-profile'] });
    },
  });
};
