import { createTheme } from '@mui/material';
import { type ThemeOptions } from '@mui/material/styles';

export const getTheme = (primaryColor?: string | null, mode: 'light' | 'dark' = 'light') => {
  const safeColor = primaryColor || '#2563eb';
  const themeOptions: ThemeOptions = {
    palette: {
      mode: mode,
      primary: {
        main: safeColor,
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#10b981', // Emerald Green
        light: '#34d399',
        dark: '#059669',
        contrastText: '#ffffff',
      },
      background: {
        default: mode === 'dark' ? '#0f172a' : '#f1f5f9', // Soft light slate gray background instead of harsh white
        paper: mode === 'dark' ? '#1e293b' : '#f8fafc', // Soft off-white paper elements
      },
      text: {
        primary: mode === 'dark' ? '#f8fafc' : '#0f172a', // Navy Dark / Light
        secondary: mode === 'dark' ? '#94a3b8' : '#64748b', 
      },
      divider: mode === 'dark' ? '#334155' : '#e2e8f0',
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
      h1: { fontWeight: 900, letterSpacing: '-0.04em', color: mode === 'dark' ? '#f8fafc' : '#0f172a' },
      h2: { fontWeight: 800, letterSpacing: '-0.02em', color: mode === 'dark' ? '#f8fafc' : '#0f172a' },
      h3: { fontWeight: 800, color: mode === 'dark' ? '#f8fafc' : '#0f172a' },
      h4: { fontWeight: 700, color: mode === 'dark' ? '#f8fafc' : '#0f172a' },
      h5: { fontWeight: 700, color: mode === 'dark' ? '#e2e8f0' : '#1e293b' },
      h6: { fontWeight: 600, color: mode === 'dark' ? '#e2e8f0' : '#1e293b' },
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
              boxShadow: `0 10px 15px -3px ${safeColor}44`,
            }
          }
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
            border: mode === 'dark' ? '1px solid rgba(51, 65, 85, 0.8)' : '1px solid rgba(226, 232, 240, 0.8)',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: '20px',
            padding: '16px',
            border: mode === 'dark' ? '1px solid rgba(51, 65, 85, 0.8)' : '1px solid rgba(226, 232, 240, 0.8)',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.02)',
            '&:hover': {
              borderColor: safeColor,
              boxShadow: `0 20px 25px -5px ${safeColor}15`,
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'dark' ? 'rgba(15, 23, 42, 0.8)' : 'rgba(248, 250, 252, 0.8)',
            backdropFilter: 'blur(12px)',
            borderBottom: mode === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0',
            boxShadow: 'none',
            color: mode === 'dark' ? '#f8fafc' : '#0f172a',
          }
        }
      }
    },
  };
  return createTheme(themeOptions);
};
