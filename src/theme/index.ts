import { createTheme, type ThemeOptions } from '@mui/material/styles';

const themeOptions: ThemeOptions = {
  palette: {
    mode: 'light',
    primary: {
      main: '#60a5fa', // Soft blue
      light: '#93c5fd',
      dark: '#3b82f6',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#94a3b8', // Soft slate
      light: '#cbd5e1',
      dark: '#64748b',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8fafc', // Very subtle off-white blue
      paper: '#ffffff',
    },
    text: {
      primary: '#334155', // Slate-700
      secondary: '#64748b', // Slate-500
    },
    divider: '#e2e8f0', // Slate-200
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700, letterSpacing: '-0.02em', color: '#1e293b' },
    h2: { fontWeight: 700, letterSpacing: '-0.01em', color: '#1e293b' },
    h3: { fontWeight: 600, color: '#1e293b' },
    h4: { fontWeight: 600, color: '#1e293b' },
    h5: { fontWeight: 600, color: '#334155' },
    h6: { fontWeight: 600, color: '#334155' },
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: '0.02em' },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          padding: '8px 18px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 4px -1px rgb(0 0 0 / 0.05)',
            backgroundColor: '#3b82f6',
            color: '#ffffff'
          },
          transition: 'all 0.2s ease-in-out',
        },
        containedPrimary: {
          backgroundColor: '#60a5fa',
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#3b82f6',
          }
        },
        outlined: {
          borderColor: '#e2e8f0',
          color: '#475569',
          '&:hover': {
            backgroundColor: '#f1f5f9',
            borderColor: '#cbd5e1',
            color: '#334155',
            boxShadow: 'none'
          }
        }
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)', // Minimal shadow
          border: '1px solid #e2e8f0',
        },
        elevation1: {
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)',
        },
        elevation2: {
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
        }
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)',
          border: '1px solid #e2e8f0',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
            borderColor: '#cbd5e1'
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid #e2e8f0',
          boxShadow: 'none',
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          boxShadow: 'none',
        }
      }
    }
  },
};

export const theme = createTheme(themeOptions);
