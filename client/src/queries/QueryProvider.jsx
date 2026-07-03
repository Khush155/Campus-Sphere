import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Avoid redundant API calls on focus change
      retry: (failureCount, error) => {
        // Do not retry for client validation errors or authorization issues
        if (error.response?.status === 400 || error.response?.status === 401 || error.response?.status === 403 || error.response?.status === 404) {
          return false;
        }
        return failureCount < 2; // Retry at most 2 times for general network/db issues
      },
      staleTime: 1000 * 60 * 5, // Cache entries are valid for 5 minutes
    },
  },
});

export const QueryProvider = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

export default QueryProvider;
