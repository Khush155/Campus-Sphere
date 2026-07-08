import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

/**
 * Hook to fetch fee structures with optional filters.
 */
export const useFeeStructuresQuery = (filters = {}) => {
  return useQuery({
    queryKey: ['fee-structures', filters],
    queryFn: async () => {
      const response = await api.get('/fees/structures', { params: filters });
      return response.data.data; // Array of fee structures
    },
    keepPreviousData: true,
  });
};

/**
 * Hook to create a new fee structure.
 */
export const useCreateFeeStructureMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/fees/structures', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['fee-structures']);
    },
  });
};

/**
 * Hook to fetch all fee payments for a specific student.
 */
export const useStudentFeesQuery = (studentId) => {
  return useQuery({
    queryKey: ['student-fees', studentId],
    queryFn: async () => {
      if (!studentId) return null;
      const response = await api.get(`/fees/student/${studentId}`);
      return response.data.data; // { student, totalPaid, payments[] }
    },
    enabled: !!studentId,
  });
};

/**
 * Hook to record a new fee payment.
 */
export const useRecordPaymentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (paymentData) => {
      const response = await api.post('/fees/payments', paymentData);
      return response.data.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries(['student-fees', variables.studentId]);
    },
  });
};

/**
 * Utility function to trigger a PDF receipt download for a payment.
 * Returns a promise that resolves after the browser download is triggered.
 */
export const downloadPaymentReceipt = async (paymentId, transactionRef) => {
  const response = await api.get(`/fees/payments/${paymentId}/receipt`, {
    responseType: 'blob',
  });

  const blob = new Blob([response.data], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `receipt-${transactionRef || paymentId}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
