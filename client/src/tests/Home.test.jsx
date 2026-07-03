import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Home from '../pages/Home';
import '@testing-library/jest-dom';

describe('Home Component', () => {
  it('renders welcome back message', () => {
    render(<Home />);
    
    // Check that the main heading renders
    expect(screen.getByText(/Welcome back, Admin/i)).toBeInTheDocument();
    
    // Check that the stat cards are present
    expect(screen.getByText('Total Students')).toBeInTheDocument();
    expect(screen.getByText('Faculty Members')).toBeInTheDocument();
    expect(screen.getByText('Avg Attendance')).toBeInTheDocument();
    expect(screen.getByText('Fees Collected')).toBeInTheDocument();

    // Check notice board is present
    expect(screen.getByText('Notice Board')).toBeInTheDocument();
  });
});
