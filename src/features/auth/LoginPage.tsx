import React, { useState, useEffect } from 'react';
import { 
  Box, Paper, Typography, TextField, Button, Alert, 
  InputAdornment, IconButton, Chip, Stack 
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
  WhatsApp as WhatsAppIcon
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

  const navigate = useNavigate();
  const { setTenantId, setUser } = useAppStore();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/dashboard');
    }
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
        <Alert severity="error" sx={{ mb: 2.5, width: '100%', borderRadius: 3, fontWeight: 600 }}>
          {loginError}
        </Alert>
      );
    }

    if (loginError.type === 'account_locked_admin') {
      return (
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
      );
    }

    if (loginError.type === 'account_locked') {
      return (
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
      );
    }

    if (loginError.type === 'wrong_password') {
      return (
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
        '&:before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(240, 249, 255, 0.45) 50%, rgba(224, 242, 254, 0.3) 100%)',
          backdropFilter: 'blur(3px)',
          zIndex: 1,
          pointerEvents: 'none'
        }
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 460,
          borderRadius: '32px',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'rgba(255, 255, 255, 0.92)', // Ultra-clean frosted glass card
          backdropFilter: 'blur(28px)',
          position: 'relative',
          overflow: 'hidden',
          zIndex: 2,
          boxShadow: '0 30px 80px -15px rgba(15, 23, 42, 0.18), 0 0 0 1px rgba(255, 255, 255, 0.95), 0 12px 30px -10px rgba(37, 99, 235, 0.12)',
          border: '1px solid rgba(255, 255, 255, 0.8)',
          p: { xs: 3.5, sm: 5 },
          transition: 'all 0.3s ease'
        }}
      >
        {/* Brand Header */}
        <Box sx={{ textAlign: 'center', mb: 3.5 }}>
          {/* Logo Badge */}
          <Box 
            sx={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: 58, 
              height: 58, 
              borderRadius: '20px', 
              background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
              color: 'white',
              boxShadow: '0 10px 25px rgba(37, 99, 235, 0.35)',
              mb: 2,
              fontWeight: 900,
              fontSize: '1.75rem',
              letterSpacing: '-0.5px'
            }}
          >
            A
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 900, 
                letterSpacing: '-1px', 
                color: '#0f172a',
                fontFamily: '"Outfit", "Inter", sans-serif'
              }}
            >
              APEX
            </Typography>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 900, 
                letterSpacing: '-1px', 
                color: '#2563eb',
                fontFamily: '"Outfit", "Inter", sans-serif'
              }}
            >
              ERP
            </Typography>
          </Box>

          <Typography 
            variant="body2" 
            sx={{ 
              color: '#64748b', 
              fontWeight: 600, 
              mt: 0.5,
              fontSize: '0.92rem'
            }}
          >
            Ecosistema de Automatización Empresarial & Fiscal
          </Typography>

          <Chip 
            label="Desarrollado por InfaGraSolution" 
            size="small" 
            sx={{ 
              mt: 1.5, 
              fontWeight: 700, 
              fontSize: '0.72rem',
              bgcolor: 'rgba(37, 99, 235, 0.08)',
              color: '#1d4ed8',
              borderRadius: '12px'
            }} 
          />
        </Box>

        {/* Main Login Form */}
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
                  bgcolor: 'rgba(248, 250, 252, 0.85)',
                  transition: 'all 0.2s ease',
                  '& fieldset': {
                    borderColor: 'rgba(203, 213, 225, 0.8)',
                    borderWidth: '1.5px'
                  },
                  '&:hover fieldset': {
                    borderColor: '#2563eb'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#2563eb',
                    borderWidth: '2px',
                    boxShadow: '0 0 0 4px rgba(37, 99, 235, 0.12)'
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
                        sx={{ color: '#64748b' }}
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
                  bgcolor: 'rgba(248, 250, 252, 0.85)',
                  transition: 'all 0.2s ease',
                  '& fieldset': {
                    borderColor: 'rgba(203, 213, 225, 0.8)',
                    borderWidth: '1.5px'
                  },
                  '&:hover fieldset': {
                    borderColor: '#2563eb'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#2563eb',
                    borderWidth: '2px',
                    boxShadow: '0 0 0 4px rgba(37, 99, 235, 0.12)'
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
            endIcon={<ArrowForwardIcon />}
            sx={{
              py: 1.6,
              borderRadius: '16px',
              fontWeight: 800,
              fontSize: '1rem',
              letterSpacing: '0.2px',
              textTransform: 'none',
              background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
              color: '#ffffff',
              boxShadow: '0 10px 30px rgba(37, 99, 235, 0.38)',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
                transform: 'translateY(-2px)',
                boxShadow: '0 16px 36px rgba(37, 99, 235, 0.48)'
              },
              '&:active': {
                transform: 'translateY(0)'
              }
            }}
          >
            {loading ? 'Validando Acceso...' : 'Iniciar Sesión'}
          </Button>
        </Box>

        {/* Feature Badges */}
        <Stack direction="row" spacing={1} sx={{ mt: 3.5, pt: 2.5, borderTop: '1px solid rgba(226, 232, 240, 0.8)', justifyContent: 'center', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#475569' }}>
            <CloudDoneIcon sx={{ fontSize: 16, color: '#2563eb' }} />
            <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.72rem' }}>Cloud 99.9%</Typography>
          </Box>
          <Typography variant="caption" sx={{ color: '#cbd5e1' }}>•</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#475569' }}>
            <ReceiptIcon sx={{ fontSize: 16, color: '#059669' }} />
            <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.72rem' }}>SENIAT / BCV</Typography>
          </Box>
          <Typography variant="caption" sx={{ color: '#cbd5e1' }}>•</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#475569' }}>
            <SecurityIcon sx={{ fontSize: 16, color: '#7c3aed' }} />
            <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.72rem' }}>Multi-Tenant</Typography>
          </Box>
        </Stack>

        {/* Bottom Support Info */}
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Typography sx={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: 500 }}>
            Soporte: <strong>Luis Infante (0412-0161906)</strong>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
