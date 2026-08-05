import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { CustomThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import QueryProvider from './queries/QueryProvider';
import { AuthProvider } from './contexts/AuthContext';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  return (
    <QueryProvider>
      <CustomThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </AuthProvider>
        </ToastProvider>
      </CustomThemeProvider>
    </QueryProvider>
  );
}
