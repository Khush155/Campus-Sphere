import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export const useFeeStructuresQuery = (filters = {}) => {
  return useQuery({
    queryKey: ['feeStructures', filters],
    queryFn: async () => {
      const params = new URLSearchParams(filters);
      const { data } = await api.get(`/fees/structures?${params.toString()}`);
      return data.data;
    },
  });
};

export const useCreateFeeStructureMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (structureData) => {
      const { data } = await api.post('/fees/structures', structureData);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feeStructures'] });
    },
  });
};

export const useUpdateFeeStructureMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, structureData }) => {
      const { data } = await api.put(`/fees/structures/${id}`, structureData);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feeStructures'] });
    },
  });
};

export const useStudentLedgerQuery = (studentId) => {
  return useQuery({
    queryKey: ['studentLedger', studentId],
    queryFn: async () => {
      if (!studentId) return null;
      const { data } = await api.get(`/fees/${studentId}/ledger`);
      return data.data;
    },
    enabled: !!studentId,
  });
};

export const useProcessPaymentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ studentId, paymentData }) => {
      const { data } = await api.post(`/fees/${studentId}/pay`, paymentData);
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['studentLedger', variables.studentId] });
    },
  });
};

export const useCreateAdjustmentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ studentId, adjustmentData }) => {
      const { data } = await api.post(`/fees/${studentId}/adjustment`, adjustmentData);
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['studentLedger', variables.studentId] });
    },
  });
};
