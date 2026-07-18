import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

/**
 * Mutation to compute promotion dry-run outcomes without mutating DB.
 * Body: { departmentId?, courseId?, branchId? }
 */
export const usePromotionPreviewMutation = () => {
  return useMutation({
    mutationFn: async (scope) => {
      const response = await api.post('/promotions/preview', scope);
      return response.data.data;
    },
  });
};

/**
 * Mutation to execute bulk semester/year promotion transactionally.
 * Body: { departmentId?, courseId?, branchId? }
 */
export const useExecutePromotionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (scope) => {
      const response = await api.post('/promotions/execute', scope);
      return response.data.data;
    },
    onSuccess: () => {
      // Invalidate queries that are affected by student promotions
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};
