import { createTheme } from '@mui/material/styles';

const getDesignTokens = (mode) => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          // Sleek premium light mode
          primary: {
            main: '#4f46e5', // Indigo
            light: '#818cf8',
            dark: '#3730a3',
            contrastText: '#ffffff',
          },
          secondary: {
            main: '#06b6d4', // Cyan
            light: '#22d3ee',
            dark: '#0891b2',
            contrastText: '#ffffff',
          },
          background: {
            default: '#f8fafc', // Slate 50
            paper: '#ffffff',
          },
          text: {
            primary: '#0f172a', // Slate 900
            secondary: '#475569', // Slate 600
          },
          divider: '#e2e8f0', // Slate 200
        }
      : {
          // Sleek premium dark mode
          primary: {
            main: '#6366f1', // Indigo
            light: '#a5b4fc',
            dark: '#4338ca',
            contrastText: '#ffffff',
          },
          secondary: {
            main: '#22d3ee', // Cyan
            light: '#67e8f9',
            dark: '#0891b2',
            contrastText: '#0f172a',
          },
          background: {
            default: '#0b0f19', // Deep dark blue-grey
            paper: '#111827', // Gray 900
          },
          text: {
            primary: '#f8fafc', // Slate 50
            secondary: '#94a3b8', // Slate 400
          },
          divider: '#1f2937', // Gray 800
        }),
  },
  typography: {
    fontFamily: '"Inter", "Outfit", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 800,
      letterSpacing: '-0.025em',
    },
    h2: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h3: {
      fontWeight: 700,
      letterSpacing: '-0.015em',
    },
    h4: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      letterSpacing: '0.01em',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          padding: '8px 16px',
          transition: 'all 0.2s ease-in-out',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.15)',
            transform: 'translateY(-1px)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
          color: '#ffffff',
          '&:hover': {
            background: 'linear-gradient(135deg, #3730a3 0%, #4338ca 100%)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: mode === 'light' 
            ? '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)'
            : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
          border: mode === 'light' ? '1px solid #f1f5f9' : '1px solid #1f2937',
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: mode === 'light'
              ? '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.05)'
              : '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
        },
      },
    },
  },
});

export const theme = (mode = 'light') => createTheme(getDesignTokens(mode));
export default theme;
