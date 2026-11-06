import { createTheme } from '@mui/material';
import { type ThemeOptions } from '@mui/material/styles';

export const getTheme = (primaryColor?: string | null, mode: 'light' | 'dark' = 'light') => {
  const safeColor = primaryColor || (mode === 'dark' ? '#6366f1' : '#2563eb'); // Premium Vibrant Sapphire Blue
  
  const themeOptions: ThemeOptions = {
    palette: {
      mode: mode,
      primary: {
        main: safeColor,
        light: mode === 'dark' ? '#818cf8' : '#60a5fa',
        dark: mode === 'dark' ? '#4f46e5' : '#1e40af',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#10b981', // Emerald Green
        light: '#34d399',
        dark: '#059669',
        contrastText: '#ffffff',
      },
      background: {
        default: mode === 'dark' ? '#0b0f19' : '#f8fafc',
        paper: mode === 'dark' ? '#111827' : '#ffffff',
      },
      text: {
        primary: mode === 'dark' ? '#f3f4f6' : '#0f172a',
        secondary: mode === 'dark' ? '#9ca3af' : '#475569', 
      },
      divider: mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
      success: {
        main: '#10b981',
        light: '#34d399',
        dark: '#059669',
      },
      warning: {
        main: '#f59e0b',
        light: '#fbbf24',
        dark: '#d97706',
      },
      error: {
        main: '#ef4444',
        light: '#f87171',
        dark: '#dc2626',
      },
      info: {
        main: '#06b6d4',
        light: '#22d3ee',
        dark: '#0891b2',
      }
    },
    typography: {
      fontFamily: '"Outfit", "Inter", "Roboto", system-ui, sans-serif',
      h1: { fontWeight: 900, letterSpacing: '-0.04em', color: mode === 'dark' ? '#ffffff' : '#0f172a' },
      h2: { fontWeight: 800, letterSpacing: '-0.02em', color: mode === 'dark' ? '#ffffff' : '#0f172a' },
      h3: { fontWeight: 800, color: mode === 'dark' ? '#ffffff' : '#111827' },
      h4: { fontWeight: 700, color: mode === 'dark' ? '#ffffff' : '#111827' },
      h5: { fontWeight: 700, color: mode === 'dark' ? '#f3f4f6' : '#1f2937' },
      h6: { fontWeight: 600, color: mode === 'dark' ? '#f3f4f6' : '#1f2937' },
      subtitle1: { fontWeight: 600, letterSpacing: '-0.01em' },
      subtitle2: { fontWeight: 700, letterSpacing: '-0.005em' },
      body1: { lineHeight: 1.6 },
      body2: { lineHeight: 1.55 },
      button: { textTransform: 'none', fontWeight: 700, letterSpacing: '0.01em' },
      caption: { letterSpacing: '0.01em' },
    },
    shape: {
      borderRadius: 16,
    },
    transitions: {
      easing: {
        easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
        easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
        easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
        sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
      },
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
            '::selection': {
              background: `${safeColor}22`,
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
            fontWeight: 700,
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: mode === 'dark' ? `0 12px 24px -10px ${safeColor}88` : `0 12px 24px -10px ${safeColor}55`,
            },
            '&:active': {
              transform: 'translateY(0)',
            }
          },
          contained: {
            background: `linear-gradient(135deg, ${safeColor} 0%, ${safeColor}dd 100%)`,
            border: '1px solid rgba(255, 255, 255, 0.08)',
            '&:hover': {
              background: `linear-gradient(135deg, ${safeColor}ee 0%, ${safeColor} 100%)`,
            }
          },
          outlined: {
            borderWidth: '1.5px',
            '&:hover': {
              borderWidth: '1.5px',
              background: mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.015)',
            }
          },
          text: {
            '&:hover': {
              background: mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
            }
          }
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            boxShadow: mode === 'dark' ? '0 4px 20px 0 rgba(0, 0, 0, 0.25)' : '0 1px 12px 0 rgba(0, 0, 0, 0.03)',
            border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.04)' : '1px solid rgba(0, 0, 0, 0.04)',
            backdropFilter: 'blur(16px)',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: '20px',
            padding: '20px',
            border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.04)' : '1px solid rgba(0, 0, 0, 0.04)',
            background: mode === 'dark' ? 'rgba(17, 24, 39, 0.6)' : 'rgba(255, 255, 255, 0.75)',
            boxShadow: mode === 'dark' ? '0 8px 25px -15px rgba(0, 0, 0, 0.4)' : '0 4px 20px -10px rgba(0, 0, 0, 0.04)',
            transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            '&:hover': {
              transform: 'translateY(-4px)',
              borderColor: `${safeColor}55`,
              boxShadow: mode === 'dark' ? `0 16px 40px -15px ${safeColor}22` : `0 16px 40px -15px ${safeColor}15`,
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              transition: 'all 0.25s ease-in-out',
              '& fieldset': {
                borderWidth: '1px',
                borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
                transition: 'all 0.25s ease',
              },
              '&:hover fieldset': {
                borderColor: `${safeColor}66`,
              },
              '&.Mui-focused fieldset': {
                borderWidth: '1.5px',
                borderColor: safeColor,
                boxShadow: `0 0 0 3px ${safeColor}15`,
              },
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'dark' ? 'rgba(11, 15, 25, 0.85)' : 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(20px) saturate(180%)',
            borderBottom: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.04)' : '1px solid rgba(0, 0, 0, 0.04)',
            boxShadow: 'none',
            color: mode === 'dark' ? '#f3f4f6' : '#111827',
          }
        }
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 600,
            borderRadius: '10px',
            transition: 'all 0.2s ease',
          }
        }
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: '24px',
            border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.04)',
            backdropFilter: 'blur(24px)',
          }
        }
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: '14px',
            fontWeight: 600,
          }
        }
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            borderRadius: '10px',
            fontWeight: 600,
            fontSize: '0.78rem',
            backdropFilter: 'blur(8px)',
          }
        }
      },
      MuiTab: {
        styleOverrides: {
          root: {
            fontWeight: 700,
            textTransform: 'none',
            borderRadius: '12px',
            transition: 'all 0.2s ease',
          }
        }
      },
    },
  };
  return createTheme(themeOptions);
};
