import React, { useState, useEffect } from 'react';
import { 
  Box, Paper, Typography, TextField, Button, Alert, 
  InputAdornment, IconButton, Chip, Stack, Fade, Grow 
} from '@mui/material';
import { 
  PersonOutlined as PersonIcon, 
  LockOutlined as LockIcon,
  VisibilityOutlined as VisibilityIcon,
  VisibilityOffOutlined as VisibilityOffIcon,
  ArrowForward as ArrowForwardIcon,
  CloudDone as CloudDoneIcon,
  Security as SecurityIcon,
  ReceiptLong as ReceiptIcon,
  WhatsApp as WhatsAppIcon,
  AutoAwesome as SparkleIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import api from '../../api/axiosConfig';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const navigate = useNavigate();
  const { setTenantId, setUser } = useAppStore();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/dashboard');
    }
    // Trigger mount animation
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { username, password });
      const { access_token, refresh_token, tenant_id } = response.data;

      localStorage.setItem('token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      setTenantId(tenant_id);
      sessionStorage.removeItem('apex_wizard_prompted');

      // Get user data immediately
      const userRes = await api.get('/auth/me');
      setUser(userRes.data);

      navigate('/dashboard');
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setLoginError(detail || 'Error de inicio de sesión. Verifique sus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  const renderError = () => {
    if (!loginError) return null;

    if (typeof loginError === 'string') {
      return (
        <Fade in>
          <Alert severity="error" sx={{ mb: 2.5, width: '100%', borderRadius: 3, fontWeight: 600 }}>
            {loginError}
          </Alert>
        </Fade>
      );
    }

    if (loginError.type === 'account_locked_admin') {
      return (
        <Fade in>
          <Box sx={{ 
            width: '100%', 
            mb: 2.5, 
            p: 2.5, 
            bgcolor: 'rgba(254, 242, 242, 0.95)', 
            border: '1px solid #fca5a5', 
            borderRadius: 3, 
            textAlign: 'center',
            backdropFilter: 'blur(8px)'
          }}>
            <Typography variant="subtitle2" color="error" sx={{ fontWeight: 800, mb: 1 }}>
              🚨 Acceso Suspendido por Seguridad
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '0.85rem' }}>
              {loginError.message}
            </Typography>
            <Button
              variant="contained"
              color="error"
              href={loginError.whatsapp_link || 'https://wa.me/584120161906'}
              target="_blank"
              size="small"
              startIcon={<WhatsAppIcon />}
              sx={{ borderRadius: 3, fontWeight: 700, textTransform: 'none', px: 3 }}
            >
              Desbloquear por WhatsApp (Luis Infante)
            </Button>
          </Box>
        </Fade>
      );
    }

    if (loginError.type === 'account_locked') {
      return (
        <Fade in>
          <Box sx={{ 
            width: '100%', 
            mb: 2.5, 
            p: 2, 
            bgcolor: 'rgba(255, 251, 235, 0.95)', 
            border: '1px solid #fcd34d', 
            borderRadius: 3 
          }}>
            <Typography variant="subtitle2" sx={{ color: '#b45309', fontWeight: 800, mb: 0.5 }}>
              🔒 Cuenta Bloqueada
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
              {loginError.message}
            </Typography>
          </Box>
        </Fade>
      );
    }

    if (loginError.type === 'wrong_password') {
      return (
        <Fade in>
          <Box sx={{ width: '100%', mb: 2.5 }}>
            <Alert severity="error" sx={{ borderRadius: 3, mb: 1, fontWeight: 600 }}>
              {loginError.message}
            </Alert>
            {loginError.warning && (
              <Alert severity="warning" sx={{ borderRadius: 3, fontWeight: 600 }}>
                {loginError.warning}
              </Alert>
            )}
          </Box>
        </Fade>
      );
    }

    return (
      <Alert severity="error" sx={{ mb: 2.5, width: '100%', borderRadius: 3, fontWeight: 600 }}>
        Error al iniciar sesión. Verifique sus credenciales.
      </Alert>
    );
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage: 'url("/apex_login_bg.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        position: 'relative',
        p: { xs: 2, sm: 4 },
        overflow: 'hidden',
        // Ultra-light overlay to let bright background shine through
        '&:before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(240, 249, 255, 0.25) 50%, rgba(219, 234, 254, 0.15) 100%)',
          backdropFilter: 'blur(1.5px)',
          zIndex: 1,
          pointerEvents: 'none'
        },
        // Decorative floating orbs
        '&:after': {
          content: '""',
          position: 'absolute',
          top: '15%',
          right: '10%',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(37, 99, 235, 0.08) 0%, transparent 70%)',
          borderRadius: '50%',
          zIndex: 1,
          pointerEvents: 'none',
          animation: 'floatOrb 8s ease-in-out infinite',
        },
        '@keyframes floatOrb': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(-30px, 20px) scale(1.1)' },
        },
        '@keyframes fadeSlideUp': {
          '0%': { opacity: 0, transform: 'translateY(40px) scale(0.95)' },
          '100%': { opacity: 1, transform: 'translateY(0) scale(1)' },
        },
        '@keyframes shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        '@keyframes pulseGlow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(37, 99, 235, 0.15)' },
          '50%': { boxShadow: '0 0 40px rgba(37, 99, 235, 0.3)' },
        }
      }}
    >
      {/* Secondary decorative orb */}
      <Box sx={{
        position: 'absolute',
        bottom: '20%',
        left: '5%',
        width: '200px',
        height: '200px',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.06) 0%, transparent 70%)',
        borderRadius: '50%',
        zIndex: 1,
        pointerEvents: 'none',
        animation: 'floatOrb 10s ease-in-out infinite reverse',
      }} />

      <Grow in={mounted} timeout={800}>
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            maxWidth: 480,
            borderRadius: '36px',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'rgba(255, 255, 255, 0.88)',
            backdropFilter: 'blur(32px) saturate(180%)',
            position: 'relative',
            overflow: 'hidden',
            zIndex: 2,
            boxShadow: '0 32px 80px -12px rgba(15, 23, 42, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.9), 0 16px 40px -10px rgba(37, 99, 235, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.75)',
            p: { xs: 4, sm: 5.5 },
            transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            animation: mounted ? 'fadeSlideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
            '&:hover': {
              boxShadow: '0 40px 90px -12px rgba(15, 23, 42, 0.18), 0 0 0 1px rgba(255, 255, 255, 0.95), 0 20px 50px -10px rgba(37, 99, 235, 0.15)',
            },
            // Top gradient accent line
            '&:before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '10%',
              right: '10%',
              height: '4px',
              background: 'linear-gradient(90deg, transparent, #2563eb, #3b82f6, #60a5fa, transparent)',
              borderRadius: '0 0 4px 4px',
              opacity: 0.8,
            }
          }}
        >
          {/* Brand Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            {/* Animated Logo Badge */}
            <Fade in={mounted} timeout={1200}>
              <Box 
                sx={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  width: 64, 
                  height: 64, 
                  borderRadius: '22px', 
                  background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #3b82f6 100%)',
                  color: 'white',
                  boxShadow: '0 12px 30px rgba(37, 99, 235, 0.35)',
                  mb: 2.5,
                  fontWeight: 900,
                  fontSize: '2rem',
                  letterSpacing: '-0.5px',
                  position: 'relative',
                  transition: 'all 0.3s ease',
                  animation: 'pulseGlow 3s ease-in-out infinite',
                  '&:hover': {
                    transform: 'scale(1.08) rotate(-3deg)',
                    boxShadow: '0 16px 40px rgba(37, 99, 235, 0.45)',
                  }
                }}
              >
                A
                <SparkleIcon sx={{ 
                  position: 'absolute', 
                  top: -6, 
                  right: -6, 
                  fontSize: 18, 
                  color: '#fbbf24',
                  filter: 'drop-shadow(0 2px 4px rgba(251, 191, 36, 0.5))'
                }} />
              </Box>
            </Fade>

            <Fade in={mounted} timeout={1400}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 900, 
                    letterSpacing: '-1px', 
                    color: '#0f172a',
                    fontFamily: '"Outfit", "Inter", sans-serif',
                    fontSize: { xs: '1.8rem', sm: '2.2rem' }
                  }}
                >
                  APEX
                </Typography>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 900, 
                    letterSpacing: '-1px', 
                    background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontFamily: '"Outfit", "Inter", sans-serif',
                    fontSize: { xs: '1.8rem', sm: '2.2rem' }
                  }}
                >
                  ERP
                </Typography>
              </Box>
            </Fade>

            <Fade in={mounted} timeout={1600}>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#64748b', 
                  fontWeight: 600, 
                  mt: 0.5,
                  fontSize: '0.92rem',
                  letterSpacing: '0.3px'
                }}
              >
                Ecosistema de Automatización Empresarial & Fiscal
              </Typography>
            </Fade>

            <Fade in={mounted} timeout={1800}>
              <Chip 
                label="Desarrollado por InfaGraSolution" 
                size="small" 
                sx={{ 
                  mt: 1.5, 
                  fontWeight: 700, 
                  fontSize: '0.72rem',
                  bgcolor: 'rgba(37, 99, 235, 0.06)',
                  color: '#1d4ed8',
                  borderRadius: '12px',
                  border: '1px solid rgba(37, 99, 235, 0.1)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: 'rgba(37, 99, 235, 0.12)',
                    transform: 'scale(1.03)',
                  }
                }} 
              />
            </Fade>
          </Box>

          {/* Main Login Form */}
          <Fade in={mounted} timeout={2000}>
            <Box component="form" onSubmit={handleLogin} sx={{ width: '100%' }}>
              {renderError()}

              <Box sx={{ mb: 2.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#334155', mb: 0.8, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.72rem' }}>
                  Usuario o Correo Electrónico
                </Typography>
                <TextField
                  required
                  fullWidth
                  size="medium"
                  placeholder="Ingrese su usuario..."
                  autoComplete="username"
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon sx={{ color: '#2563eb', fontSize: '1.25rem' }} />
                        </InputAdornment>
                      )
                    }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '16px',
                      bgcolor: 'rgba(248, 250, 252, 0.8)',
                      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                      '& fieldset': {
                        borderColor: 'rgba(203, 213, 225, 0.7)',
                        borderWidth: '1.5px',
                        transition: 'all 0.3s ease',
                      },
                      '&:hover': {
                        bgcolor: 'rgba(248, 250, 252, 1)',
                        '& fieldset': { borderColor: '#93c5fd' }
                      },
                      '&.Mui-focused': {
                        bgcolor: '#ffffff',
                        '& fieldset': {
                          borderColor: '#2563eb',
                          borderWidth: '2px',
                          boxShadow: '0 0 0 4px rgba(37, 99, 235, 0.08)'
                        }
                      }
                    },
                    '& input': {
                      fontWeight: 600,
                      color: '#0f172a'
                    }
                  }}
                />
              </Box>

              <Box sx={{ mb: 3.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#334155', mb: 0.8, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.72rem' }}>
                  Contraseña
                </Typography>
                <TextField
                  required
                  fullWidth
                  size="medium"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon sx={{ color: '#2563eb', fontSize: '1.25rem' }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            size="small"
                            sx={{ 
                              color: '#64748b',
                              transition: 'all 0.2s ease',
                              '&:hover': { color: '#2563eb' }
                            }}
                          >
                            {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '16px',
                      bgcolor: 'rgba(248, 250, 252, 0.8)',
                      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                      '& fieldset': {
                        borderColor: 'rgba(203, 213, 225, 0.7)',
                        borderWidth: '1.5px',
                        transition: 'all 0.3s ease',
                      },
                      '&:hover': {
                        bgcolor: 'rgba(248, 250, 252, 1)',
                        '& fieldset': { borderColor: '#93c5fd' }
                      },
                      '&.Mui-focused': {
                        bgcolor: '#ffffff',
                        '& fieldset': {
                          borderColor: '#2563eb',
                          borderWidth: '2px',
                          boxShadow: '0 0 0 4px rgba(37, 99, 235, 0.08)'
                        }
                      }
                    },
                    '& input': {
                      fontWeight: 600,
                      color: '#0f172a'
                    }
                  }}
                />
              </Box>

              <Button
                type="submit"
                fullWidth
                disabled={loading}
                size="large"
                endIcon={!loading && <ArrowForwardIcon />}
                sx={{
                  py: 1.7,
                  borderRadius: '16px',
                  fontWeight: 800,
                  fontSize: '1.02rem',
                  letterSpacing: '0.3px',
                  textTransform: 'none',
                  background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 60%, #3b82f6 100%)',
                  color: '#ffffff',
                  boxShadow: '0 10px 30px rgba(37, 99, 235, 0.35)',
                  transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '200%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
                    transition: 'all 0.6s ease',
                  },
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 60%, #60a5fa 100%)',
                    transform: 'translateY(-3px)',
                    boxShadow: '0 20px 40px rgba(37, 99, 235, 0.45)',
                    '&:before': {
                      left: '100%',
                    }
                  },
                  '&:active': {
                    transform: 'translateY(-1px)',
                    boxShadow: '0 8px 20px rgba(37, 99, 235, 0.3)',
                  },
                  '&.Mui-disabled': {
                    background: 'linear-gradient(135deg, #94a3b8, #cbd5e1)',
                    color: 'rgba(255,255,255,0.8)',
                  }
                }}
              >
                {loading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{
                      width: 20, height: 20, 
                      border: '2.5px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#fff',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                      '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } }
                    }} />
                    Validando Acceso...
                  </Box>
                ) : 'Iniciar Sesión'}
              </Button>
            </Box>
          </Fade>

          {/* Feature Badges */}
          <Fade in={mounted} timeout={2400}>
            <Stack direction="row" spacing={1.5} sx={{ 
              mt: 4, 
              pt: 3, 
              borderTop: '1px solid rgba(226, 232, 240, 0.6)', 
              justifyContent: 'center', 
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 1,
            }}>
              {[
                { icon: CloudDoneIcon, label: 'Cloud 99.9%', color: '#2563eb' },
                { icon: ReceiptIcon, label: 'SENIAT / BCV', color: '#059669' },
                { icon: SecurityIcon, label: 'Multi-Tenant', color: '#7c3aed' }
              ].map((badge, i) => (
                <Box key={i} sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 0.5, 
                  color: '#475569',
                  px: 1.5,
                  py: 0.5,
                  borderRadius: '10px',
                  bgcolor: 'rgba(248, 250, 252, 0.6)',
                  border: '1px solid rgba(226, 232, 240, 0.5)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: 'rgba(248, 250, 252, 1)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                  }
                }}>
                  <badge.icon sx={{ fontSize: 15, color: badge.color }} />
                  <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.72rem' }}>{badge.label}</Typography>
                </Box>
              ))}
            </Stack>
          </Fade>

          {/* Bottom Support Info */}
          <Fade in={mounted} timeout={2600}>
            <Box sx={{ textAlign: 'center', mt: 2.5 }}>
              <Typography sx={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: 500, letterSpacing: '0.2px' }}>
                Soporte: <strong>Luis Infante (0412-0161906)</strong>
              </Typography>
            </Box>
          </Fade>
        </Paper>
      </Grow>
    </Box>
  );
}
