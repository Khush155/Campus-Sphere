import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

/**
 * Fetch a student's fee receipts
 */
export const useStudentReceiptsQuery = () => {
  return useQuery({
    queryKey: ['student-receipts'],
    queryFn: async () => {
      const response = await api.get('/fees/receipts');
      return response.data?.data || [];
    },
  });
};

/**
 * Fetch a specific receipt by ID
 */
export const useReceiptByIdQuery = (receiptId) => {
  return useQuery({
    queryKey: ['receipt', receiptId],
    queryFn: async () => {
      if (!receiptId) return null;
      const response = await api.get(`/fees/receipts/${receiptId}`);
      return response.data?.data || null;
    },
    enabled: Boolean(receiptId),
  });
};

/**
 * Mutation for student to pay fees
 */
export const usePayStudentFeeMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const response = await api.post('/fees/pay');
      return response.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['student-receipts']);
      queryClient.invalidateQueries(['user-profile']); // Refresh profile to show CLEARED status
    },
  });
};

/**
 * Mutation for Admins to generate fees in bulk
 */
export const useGenerateBulkFeesMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (criteria) => {
      const response = await api.post('/fees/generate', criteria);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      queryClient.invalidateQueries(['department-fees']);
    },
  });
};
