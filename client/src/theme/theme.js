import { createTheme } from '@mui/material/styles';
import { motionTokens } from './motionTokens';
import { elevationTokens } from './elevationTokens';

// Definition of premium design tokens for each color preset
const COLOR_PRESETS = {
  indigo: {
    light: {
      primary: { main: '#4f46e5', light: '#818cf8', dark: '#3730a3' },
      secondary: { main: '#06b6d4', light: '#22d3ee', dark: '#0891b2' },
    },
    dark: {
      primary: { main: '#6366f1', light: '#a5b4fc', dark: '#4338ca' },
      secondary: { main: '#22d3ee', light: '#67e8f9', dark: '#0891b2' },
    },
  },
  emerald: {
    light: {
      primary: { main: '#059669', light: '#34d399', dark: '#047857' },
      secondary: { main: '#0d9488', light: '#2dd4bf', dark: '#0f766e' },
    },
    dark: {
      primary: { main: '#10b981', light: '#6ee7b7', dark: '#065f46' },
      secondary: { main: '#14b8a6', light: '#5eead4', dark: '#115e59' },
    },
  },
  rose: {
    light: {
      primary: { main: '#db2777', light: '#f472b6', dark: '#9d174d' },
      secondary: { main: '#ea580c', light: '#fb923c', dark: '#9a3412' },
    },
    dark: {
      primary: { main: '#f43f5e', light: '#fda4af', dark: '#9f1239' },
      secondary: { main: '#fb923c', light: '#fdbb2d', dark: '#c2410c' },
    },
  },
  amber: {
    light: {
      primary: { main: '#d97706', light: '#fbbf24', dark: '#92400e' },
      secondary: { main: '#4f46e5', light: '#818cf8', dark: '#3730a3' },
    },
    dark: {
      primary: { main: '#f59e0b', light: '#fde047', dark: '#78350f' },
      secondary: { main: '#818cf8', light: '#a5b4fc', dark: '#4338ca' },
    },
  },
  violet: {
    light: {
      primary: { main: '#7c3aed', light: '#a78bfa', dark: '#5b21b6' },
      secondary: { main: '#db2777', light: '#f472b6', dark: '#9d174d' },
    },
    dark: {
      primary: { main: '#8b5cf6', light: '#c084fc', dark: '#6d28d9' },
      secondary: { main: '#f472b6', light: '#f9a8d4', dark: '#be185d' },
    },
  },
};

const getDesignTokens = (mode, presetName = 'indigo') => {
  // Fallback to indigo if invalid preset name is supplied
  const activePreset = COLOR_PRESETS[presetName] ? COLOR_PRESETS[presetName] : COLOR_PRESETS.indigo;
  const colors = activePreset[mode];

  return {
    palette: {
      mode,
      primary: {
        ...colors.primary,
        contrastText: '#ffffff',
      },
      secondary: {
        ...colors.secondary,
        contrastText: mode === 'light' ? '#ffffff' : '#0f172a',
      },
      brass: {
        500: '#B8863E',
        300: '#D9B876',
      },
      slateCustom: {
        500: '#5B6B7C',
      },
      signal: {
        error: '#B3432B',
        success: '#3F6E52',
      },
      ...(mode === 'light'
        ? {
            // Ink & Parchment Institutional Brand Colors
            ink: {
              900: '#0E1A2B',
              700: '#1C2E45',
            },
            parchment: {
              50: '#F7F5EF',
              100: '#EDE9DD',
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
            // Ink & Parchment Inverted for Dark Mode readability
            ink: {
              900: '#f8fafc', // Light slate
              700: '#cbd5e1', // Muted light slate
            },
            parchment: {
              50: '#0b0f19', // Deep dark slate background
              100: '#1e293b', // Dark container slate
            },
            background: {
              default: '#0b0f19', // Deep dark slate
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
      fontFamily: '"IBM Plex Sans", "Outfit", "Inter", sans-serif',
      h1: { fontFamily: '"Fraunces", "Source Serif 4", serif', fontWeight: 600, letterSpacing: '-0.025em', fontSize: '2.5rem' },
      h2: { fontFamily: '"Fraunces", "Source Serif 4", serif', fontWeight: 600, letterSpacing: '-0.02em', fontSize: '2rem' },
      h3: { fontFamily: '"Fraunces", "Source Serif 4", serif', fontWeight: 600, letterSpacing: '-0.015em', fontSize: '1.75rem' },
      h4: { fontFamily: '"Fraunces", "Source Serif 4", serif', fontWeight: 600, letterSpacing: '-0.01em', fontSize: '1.75rem', lineHeight: 1.2 }, // 28px
      h5: { fontFamily: '"Fraunces", "Source Serif 4", serif', fontWeight: 600, fontSize: '1.25rem' }, // 20px
      h6: { fontFamily: '"IBM Plex Sans", sans-serif', fontWeight: 600, fontSize: '1rem', letterSpacing: '0.01em' }, // 16px section heading
      body1: { fontFamily: '"IBM Plex Sans", sans-serif', fontSize: '0.875rem', lineHeight: 1.5 }, // 14px
      body2: { fontFamily: '"IBM Plex Sans", sans-serif', fontSize: '0.75rem', lineHeight: 1.5 }, // 12px
      button: {
        fontFamily: '"IBM Plex Sans", sans-serif',
        textTransform: 'none',
        fontWeight: 600,
        letterSpacing: '0.01em',
        fontSize: '0.875rem',
      },
      mono: {
        fontFamily: '"IBM Plex Mono", monospace',
        fontSize: '0.8125rem', // ~13px
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
            padding: '8px 16px',
            transition: 'all 0.2s ease-in-out',
            boxShadow: 'none',
            '&:hover': {
              boxShadow: mode === 'light' 
                ? `0 4px 12px ${colors.primary.main}26`
                : `0 4px 14px ${colors.primary.main}40`,
              transform: 'translateY(-1px)',
            },
            '&.Mui-focusVisible': {
              outline: `2px solid ${colors.primary.main}`,
              outlineOffset: '2px',
            },
          },
          containedPrimary: {
            background: `linear-gradient(135deg, ${colors.primary.main} 0%, ${colors.primary.light} 100%)`,
            color: '#ffffff',
            '&:hover': {
              background: `linear-gradient(135deg, ${colors.primary.dark} 0%, ${colors.primary.main} 100%)`,
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: mode === 'light' ? elevationTokens.light.raised : elevationTokens.dark.raised,
            border: mode === 'light' ? '1px solid #f1f5f9' : '1px solid #1f2937',
            transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: mode === 'light' ? elevationTokens.light.overlay : elevationTokens.dark.overlay,
            },
          },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          root: {
            borderRadius: '8px',
            '&.Mui-focusVisible': {
              outline: `2px solid ${colors.primary.main}`,
              outlineOffset: '2px',
            },
          },
        },
      },
    },
    // Theme extensions for elevated surfaces, hover states and focus visible rings
    custom: {
      surface: {
        base: mode === 'light' ? '#f8fafc' : '#0b0f19',
        raised: mode === 'light' ? '#ffffff' : '#111827',
        overlay: mode === 'light' ? '#ffffff' : '#1e293b',
        sunken: mode === 'light' ? '#f1f5f9' : '#0f172a',
      },
      interaction: {
        hoverTint: `${colors.primary.main}0f`,
        pressTint: `${colors.primary.main}1f`,
        focusRing: `2px solid ${colors.primary.main}`,
      },
      border: {
        subtle: mode === 'light' ? '#e2e8f0' : '#1f2937',
      },
      elevation: mode === 'light' ? elevationTokens.light : elevationTokens.dark,
      motion: motionTokens,
    },
  };
};

export const theme = (mode = 'light', preset = 'indigo') => createTheme(getDesignTokens(mode, preset));
export default theme;
