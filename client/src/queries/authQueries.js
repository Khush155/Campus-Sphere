import { useMutation } from '@tanstack/react-query';
import { loginApi } from '../services/authService';

/**
 * Hook providing TanStack mutation mapping for user authentication.
 */
export const useLoginMutation = () => {
  return useMutation({
    mutationFn: ({ email, password }) => loginApi(email, password),
  });
};
