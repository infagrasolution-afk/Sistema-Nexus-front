import { createTheme } from '@mui/material';
import { type ThemeOptions } from '@mui/material/styles';

export const getTheme = (primaryColor: string = '#2563eb') => {
  const themeOptions: ThemeOptions = {
    palette: {
      mode: 'light',
      primary: {
        main: primaryColor,
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#10b981', // Emerald Green
        light: '#34d399',
        dark: '#059669',
        contrastText: '#ffffff',
      },
      background: {
        default: '#f8fafc', 
        paper: '#ffffff',
      },
      text: {
        primary: '#0f172a', // Navy Dark
        secondary: '#64748b', 
      },
      divider: '#e2e8f0',
      success: {
        main: '#10b981',
      },
      warning: {
        main: '#f59e0b',
      },
      error: {
        main: '#ef4444',
      }
    },
    typography: {
      fontFamily: '"Outfit", "Inter", "Roboto", sans-serif',
      h1: { fontWeight: 900, letterSpacing: '-0.04em', color: '#0f172a' },
      h2: { fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a' },
      h3: { fontWeight: 800, color: '#0f172a' },
      h4: { fontWeight: 700, color: '#0f172a' },
      h5: { fontWeight: 700, color: '#1e293b' },
      h6: { fontWeight: 600, color: '#1e293b' },
      button: { textTransform: 'none', fontWeight: 700, letterSpacing: '0.01em' },
    },
    shape: {
      borderRadius: 16,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: '12px',
            padding: '10px 24px',
            boxShadow: 'none',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-1px)',
            },
          },
          contained: {
            '&:hover': {
              boxShadow: `0 10px 15px -3px ${primaryColor}44`,
            }
          }
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: '20px',
            padding: '16px',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.02)',
            '&:hover': {
              borderColor: primaryColor,
              boxShadow: `0 20px 25px -5px ${primaryColor}15`,
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid #e2e8f0',
            boxShadow: 'none',
            color: '#0f172a',
          }
        }
      }
    },
  };
  return createTheme(themeOptions);
};
