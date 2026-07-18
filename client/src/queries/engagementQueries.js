import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

// --- Assignments ---
export const useAssignmentsQuery = () => {
  return useQuery({
    queryKey: ['studentAssignments'],
    queryFn: async () => {
      const response = await api.get('/student/tasks/assignments');
      return response.data.data;
    },
  });
};

export const useSubmitAssignmentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.post(`/student/tasks/assignments/${id}/submit`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentAssignments'] });
    },
  });
};

// --- Portfolio (Projects, Achievements, Clubs) ---
export const usePortfolioQuery = () => {
  return useQuery({
    queryKey: ['studentPortfolio'],
    queryFn: async () => {
      const response = await api.get('/student/portfolio');
      return response.data.data;
    },
  });
};

export const useAddProjectMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/student/portfolio/projects', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentPortfolio'] });
    },
  });
};

export const useAddAchievementMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/student/portfolio/achievements', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentPortfolio'] });
    },
  });
};

// --- Placements ---
export const usePlacementsQuery = () => {
  return useQuery({
    queryKey: ['studentPlacements'],
    queryFn: async () => {
      const response = await api.get('/student/placements');
      return response.data.data;
    },
  });
};

export const useApplyForDriveMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const response = await api.post(`/student/placements/apply/${id}`);
      return response.data; // we might want the message
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentPlacements'] });
    },
  });
};
