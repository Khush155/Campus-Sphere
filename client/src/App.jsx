import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { CustomThemeProvider } from './contexts/ThemeContext';
import QueryProvider from './queries/QueryProvider';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  return (
    <QueryProvider>
      <CustomThemeProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </CustomThemeProvider>
    </QueryProvider>
  );
}
