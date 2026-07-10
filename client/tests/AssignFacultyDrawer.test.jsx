import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { expect, describe, it, vi } from 'vitest';
import AssignFacultyDrawer from '../src/pages/hod/FacultyAssignment/AssignFacultyDrawer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the context and queries
vi.mock('../src/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { departmentId: 'dept123', role: 'HOD' },
  }),
}));

vi.mock('../src/queries/collegeQueries', () => ({
  useSubjectsQuery: () => ({
    data: [
      { _id: 'sub1', code: 'CS101', name: 'Intro to CS' }
    ],
    isLoading: false,
  }),
}));

vi.mock('../src/queries/userQueries', () => ({
  useUsersQuery: () => ({
    data: {
      data: [
        { _id: 'fac1', name: 'John Doe', email: 'john@test.com' }
      ]
    },
    isLoading: false,
  }),
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const renderWithProviders = (ui) => {
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
};

describe('AssignFacultyDrawer', () => {
  it('should validate form fields using Controller and not bare register', async () => {
    const handleSubmit = vi.fn();
    
    renderWithProviders(
      <AssignFacultyDrawer 
        open={true} 
        onClose={() => {}} 
        onSubmit={handleSubmit}
        isSubmitting={false}
      />
    );

    // Initial state: drawer should be visible and "Save Assignment" button present
    expect(screen.getByText('Assign Faculty')).toBeInTheDocument();
    
    const submitBtn = screen.getByRole('button', { name: /Save Assignment/i });
    
    // Click submit without selecting anything
    fireEvent.click(submitBtn);

    // Wait for validation errors to appear (zod min(1))
    await waitFor(() => {
      expect(screen.getByText('Subject is required')).toBeInTheDocument();
      expect(screen.getByText('Faculty is required')).toBeInTheDocument();
    });

    expect(handleSubmit).not.toHaveBeenCalled();
  });
});
