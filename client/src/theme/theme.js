import { createTheme } from '@mui/material/styles';
import { motionTokens } from './motionTokens';
import { elevationTokens } from './elevationTokens';

// Definition of premium, luxury design tokens for each color preset
const COLOR_PRESETS = {
  indigo: {
    light: {
      primary: { main: '#4338ca', light: '#6366f1', dark: '#312e81' },
      secondary: { main: '#0284c7', light: '#38bdf8', dark: '#0369a1' },
      gradient: 'linear-gradient(135deg, #4338ca 0%, #0284c7 100%)',
    },
    dark: {
      primary: { main: '#6366f1', light: '#818cf8', dark: '#4338ca' },
      secondary: { main: '#38bdf8', light: '#7dd3fc', dark: '#0284c7' },
      gradient: 'linear-gradient(135deg, #6366f1 0%, #38bdf8 100%)',
    },
  },
  emerald: {
    light: {
      primary: { main: '#059669', light: '#10b981', dark: '#047857' },
      secondary: { main: '#0d9488', light: '#2dd4bf', dark: '#0f766e' },
      gradient: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
    },
    dark: {
      primary: { main: '#10b981', light: '#34d399', dark: '#059669' },
      secondary: { main: '#2dd4bf', light: '#5eead4', dark: '#0d9488' },
      gradient: 'linear-gradient(135deg, #10b981 0%, #2dd4bf 100%)',
    },
  },
  rose: {
    light: {
      primary: { main: '#e11d48', light: '#f43f5e', dark: '#be123c' },
      secondary: { main: '#9333ea', light: '#c084fc', dark: '#7e22ce' },
      gradient: 'linear-gradient(135deg, #e11d48 0%, #9333ea 100%)',
    },
    dark: {
      primary: { main: '#fb7185', light: '#fda4af', dark: '#e11d48' },
      secondary: { main: '#c084fc', light: '#e9d5ff', dark: '#9333ea' },
      gradient: 'linear-gradient(135deg, #fb7185 0%, #c084fc 100%)',
    },
  },
  amber: {
    light: {
      primary: { main: '#d97706', light: '#f59e0b', dark: '#b45309' },
      secondary: { main: '#4338ca', light: '#6366f1', dark: '#312e81' },
      gradient: 'linear-gradient(135deg, #d97706 0%, #4338ca 100%)',
    },
    dark: {
      primary: { main: '#fbbf24', light: '#fde047', dark: '#d97706' },
      secondary: { main: '#818cf8', light: '#a5b4fc', dark: '#4338ca' },
      gradient: 'linear-gradient(135deg, #fbbf24 0%, #818cf8 100%)',
    },
  },
  violet: {
    light: {
      primary: { main: '#7c3aed', light: '#8b5cf6', dark: '#6d28d9' },
      secondary: { main: '#0891b2', light: '#06b6d4', dark: '#0e7490' },
      gradient: 'linear-gradient(135deg, #7c3aed 0%, #0891b2 100%)',
    },
    dark: {
      primary: { main: '#a78bfa', light: '#c084fc', dark: '#7c3aed' },
      secondary: { main: '#22d3ee', light: '#67e8f9', dark: '#0891b2' },
      gradient: 'linear-gradient(135deg, #a78bfa 0%, #22d3ee 100%)',
    },
  },
};

const getDesignTokens = (mode, presetName = 'indigo') => {
  const activePreset = COLOR_PRESETS[presetName] ? COLOR_PRESETS[presetName] : COLOR_PRESETS.indigo;
  const colors = activePreset[mode];

  return {
    palette: {
      mode,
      primary: {
        ...colors.primary,
        gradient: colors.gradient,
        contrastText: '#ffffff',
      },
      secondary: {
        ...colors.secondary,
        contrastText: mode === 'light' ? '#ffffff' : '#0f172a',
      },
      brass: {
        500: '#B8863E',
        400: '#C99A4F',
        300: '#D9B876',
        100: '#F5EBD8',
      },
      slateCustom: {
        900: '#0F172A',
        700: '#334155',
        500: '#64748B',
        200: '#E2E8F0',
      },
      signal: {
        error: '#B3432B',
        success: '#3F6E52',
        warning: '#D97706',
        info: '#0284C7',
      },
      ...(mode === 'light'
        ? {
            // Ink & Parchment Institutional Brand Colors (Light)
            ink: {
              900: '#0E1A2B',
              800: '#152438',
              700: '#1C2E45',
            },
            parchment: {
              50: '#F8F6F0',
              100: '#EFECE1',
            },
            background: {
              default: '#F8FAFC',
              paper: '#FFFFFF',
            },
            text: {
              primary: '#0E1A2B',
              secondary: '#475569',
              disabled: '#94A3B8',
            },
            divider: '#E2E8F0',
          }
        : {
            // Sleek Luxury Deep Midnight Slate (Dark)
            ink: {
              900: '#F8FAFC',
              800: '#E2E8F0',
              700: '#CBD5E1',
            },
            parchment: {
              50: '#080C14',
              100: '#141D2C',
            },
            background: {
              default: '#080C14', // Deepest midnight slate
              paper: '#0F1726', // Premium card background
            },
            text: {
              primary: '#F8FAFC',
              secondary: '#94A3B8',
              disabled: '#64748B',
            },
            divider: 'rgba(255, 255, 255, 0.08)',
          }),
    },
    typography: {
      fontFamily: '"IBM Plex Sans", "Outfit", "Inter", sans-serif',
      h1: { fontFamily: '"Fraunces", "Source Serif 4", serif', fontWeight: 600, letterSpacing: '-0.025em', fontSize: '2.5rem' },
      h2: { fontFamily: '"Fraunces", "Source Serif 4", serif', fontWeight: 600, letterSpacing: '-0.02em', fontSize: '2rem' },
      h3: { fontFamily: '"Fraunces", "Source Serif 4", serif', fontWeight: 600, letterSpacing: '-0.015em', fontSize: '1.75rem' },
      h4: { fontFamily: '"Fraunces", "Source Serif 4", serif', fontWeight: 600, letterSpacing: '-0.01em', fontSize: '1.75rem', lineHeight: 1.2 },
      h5: { fontFamily: '"Fraunces", "Source Serif 4", serif', fontWeight: 600, fontSize: '1.25rem' },
      h6: { fontFamily: '"IBM Plex Sans", sans-serif', fontWeight: 600, fontSize: '1rem', letterSpacing: '0.01em' },
      body1: { fontFamily: '"IBM Plex Sans", sans-serif', fontSize: '0.875rem', lineHeight: 1.5 },
      body2: { fontFamily: '"IBM Plex Sans", sans-serif', fontSize: '0.75rem', lineHeight: 1.5 },
      button: {
        fontFamily: '"IBM Plex Sans", sans-serif',
        textTransform: 'none',
        fontWeight: 600,
        letterSpacing: '0.01em',
        fontSize: '0.875rem',
      },
      mono: {
        fontFamily: '"IBM Plex Mono", monospace',
        fontSize: '0.8125rem',
        letterSpacing: '0.02em',
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiDrawer: {
        styleOverrides: {
          paper: {
            transition: 'transform 250ms cubic-bezier(0.32, 0.72, 0, 1) !important',
            backgroundColor: mode === 'light' ? '#FFFFFF' : '#0F1726',
            borderColor: mode === 'light' ? '#E2E8F0' : 'rgba(255, 255, 255, 0.08)',
          },
        },
      },
      MuiButtonBase: {
        styleOverrides: {
          root: {
            '&.Mui-focusVisible': {
              outline: `2px solid ${colors.primary.main}`,
              outlineOffset: '2px',
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: '8px',
            padding: '8px 18px',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: 'none',
            '&:hover': {
              boxShadow: mode === 'light'
                ? `0 6px 16px ${colors.primary.main}30`
                : `0 6px 18px ${colors.primary.main}45`,
              transform: 'translateY(-1px)',
            },
          },
          containedPrimary: {
            background: colors.gradient,
            color: '#ffffff',
            fontWeight: 700,
            '&:hover': {
              background: colors.gradient,
              filter: 'brightness(1.1)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            backgroundColor: mode === 'light' ? '#FFFFFF' : '#141D2C',
            boxShadow: mode === 'light'
              ? '0 4px 20px rgba(14, 26, 43, 0.04)'
              : '0 4px 24px rgba(0, 0, 0, 0.35)',
            border: mode === 'light' ? '1px solid #E2E8F0' : '1px solid rgba(255, 255, 255, 0.08)',
            transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.25s ease',
            '&:hover': {
              borderColor: mode === 'light' ? '#CBD5E1' : 'rgba(255, 255, 255, 0.16)',
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: '6px',
            fontWeight: 600,
          },
        },
      },
    },
    custom: {
      surface: {
        base: mode === 'light' ? '#F8FAFC' : '#080C14',
        raised: mode === 'light' ? '#FFFFFF' : '#141D2C',
        overlay: mode === 'light' ? '#FFFFFF' : '#1A2436',
        sunken: mode === 'light' ? '#F1F5F9' : '#0F1726',
      },
      interaction: {
        hoverTint: `${colors.primary.main}0d`,
        pressTint: `${colors.primary.main}1a`,
        focusRing: `2px solid ${colors.primary.main}`,
      },
      border: {
        subtle: mode === 'light' ? '#E2E8F0' : 'rgba(255, 255, 255, 0.08)',
        strong: mode === 'light' ? '#CBD5E1' : 'rgba(255, 255, 255, 0.18)',
      },
      elevation: mode === 'light' ? elevationTokens.light : elevationTokens.dark,
      motion: motionTokens,
    },
  };
};

export const theme = (mode = 'light', preset = 'indigo') => createTheme(getDesignTokens(mode, preset));
export default theme;
