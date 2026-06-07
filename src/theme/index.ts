import { createTheme } from '@mui/material';
import { type ThemeOptions } from '@mui/material/styles';

export const getTheme = (primaryColor?: string | null, mode: 'light' | 'dark' = 'light') => {
  const safeColor = primaryColor || (mode === 'dark' ? '#6366f1' : '#4f46e5'); // Premium Indigo primary
  
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
        default: mode === 'dark' ? '#0b0f19' : '#f3f4f6', // Premium deep dark slate / light gray-blue
        paper: mode === 'dark' ? '#111827' : '#ffffff', // Card paper elements
      },
      text: {
        primary: mode === 'dark' ? '#f3f4f6' : '#111827',
        secondary: mode === 'dark' ? '#9ca3af' : '#4b5563', 
      },
      divider: mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
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
      h1: { fontWeight: 900, letterSpacing: '-0.04em', color: mode === 'dark' ? '#ffffff' : '#111827' },
      h2: { fontWeight: 800, letterSpacing: '-0.02em', color: mode === 'dark' ? '#ffffff' : '#111827' },
      h3: { fontWeight: 800, color: mode === 'dark' ? '#ffffff' : '#111827' },
      h4: { fontWeight: 700, color: mode === 'dark' ? '#ffffff' : '#111827' },
      h5: { fontWeight: 700, color: mode === 'dark' ? '#f3f4f6' : '#1f2937' },
      h6: { fontWeight: 600, color: mode === 'dark' ? '#f3f4f6' : '#1f2937' },
      button: { textTransform: 'none', fontWeight: 700, letterSpacing: '0.02em' },
    },
    shape: {
      borderRadius: 16,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarColor: mode === 'dark' ? '#374151 #111827' : '#d1d5db #f3f4f6',
            '&::-webkit-scrollbar': {
              width: '8px',
              height: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: mode === 'dark' ? '#0b0f19' : '#f3f4f6',
            },
            '&::-webkit-scrollbar-thumb': {
              background: mode === 'dark' ? '#374151' : '#cbd5e1',
              borderRadius: '10px',
              border: `2px solid ${mode === 'dark' ? '#0b0f19' : '#f3f4f6'}`,
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: mode === 'dark' ? '#4b5563' : '#94a3b8',
            },
            selection: {
              background: `${safeColor}33`,
              color: safeColor,
            }
          }
        }
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: '12px',
            padding: '10px 24px',
            boxShadow: 'none',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: mode === 'dark' ? `0 12px 20px -10px ${safeColor}aa` : `0 12px 20px -10px ${safeColor}66`,
            },
            '&:active': {
              transform: 'translateY(0)',
            }
          },
          contained: {
            background: `linear-gradient(135deg, ${safeColor} 0%, ${safeColor}dd 100%)`,
            border: '1px solid rgba(255, 255, 255, 0.1)',
          },
          outlined: {
            borderWidth: '1.5px',
            '&:hover': {
              borderWidth: '1.5px',
              background: mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
            }
          }
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            boxShadow: mode === 'dark' ? '0 4px 20px 0 rgba(0, 0, 0, 0.3)' : '0 4px 20px 0 rgba(0, 0, 0, 0.03)',
            border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)',
            backdropFilter: 'blur(16px)',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: '24px',
            padding: '20px',
            border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)',
            background: mode === 'dark' ? 'rgba(17, 24, 39, 0.7)' : 'rgba(255, 255, 255, 0.8)',
            boxShadow: mode === 'dark' ? '0 10px 30px -15px rgba(0, 0, 0, 0.5)' : '0 10px 30px -15px rgba(0, 0, 0, 0.05)',
            transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            '&:hover': {
              transform: 'translateY(-4px)',
              borderColor: `${safeColor}88`,
              boxShadow: mode === 'dark' ? `0 20px 40px -15px ${safeColor}33` : `0 20px 40px -15px ${safeColor}22`,
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              transition: 'all 0.2s ease-in-out',
              '& fieldset': {
                borderWidth: '1px',
                borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              },
              '&:hover fieldset': {
                borderColor: `${safeColor}88`,
              },
              '&.Mui-focused fieldset': {
                borderWidth: '1.5px',
                borderColor: safeColor,
                boxShadow: `0 0 0 3px ${safeColor}22`,
              },
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'dark' ? 'rgba(11, 15, 25, 0.8)' : 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(16px)',
            borderBottom: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)',
            boxShadow: 'none',
            color: mode === 'dark' ? '#f3f4f6' : '#111827',
          }
        }
      }
    },
  };
  return createTheme(themeOptions);
};
