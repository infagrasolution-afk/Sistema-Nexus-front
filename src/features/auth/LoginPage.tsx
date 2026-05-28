import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, TextField, Button, Avatar, Alert } from '@mui/material';
import { LockOutlined as LockOutlinedIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import api from '../../api/axiosConfig';
import { useTranslation } from 'react-i18next';

export default function LoginPage() {
  const { } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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
      return <Alert severity="error" sx={{ mb: 2, width: '100%', borderRadius: 2 }}>{loginError}</Alert>;
    }

    if (loginError.type === 'account_locked_admin') {
      return (
        <Box sx={{ width: '100%', mb: 2, p: 2, bgcolor: '#fff5f5', border: '1px solid #feb2b2', borderRadius: 4, textAlign: 'center' }}>
          <Typography variant="subtitle2" color="error" sx={{ fontWeight: 800, mb: 1 }}>
            🚨 Acceso Suspendido por Seguridad
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '0.85rem' }}>
            {loginError.message}
          </Typography>
          <Button
            variant="contained"
            color="error"
            href={loginError.whatsapp_link}
            target="_blank"
            size="small"
            sx={{ borderRadius: 3, fontWeight: 700, textTransform: 'none', px: 3 }}
          >
            Desbloquear por WhatsApp
          </Button>
        </Box>
      );
    }

    if (loginError.type === 'account_locked') {
      return (
        <Box sx={{ width: '100%', mb: 2, p: 2, bgcolor: '#fffaf0', border: '1px solid #fbd38d', borderRadius: 4 }}>
          <Typography variant="subtitle2" sx={{ color: '#dd6b20', fontWeight: 800, mb: 0.5 }}>
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
        <Box sx={{ width: '100%', mb: 2 }}>
          <Alert severity="error" sx={{ borderRadius: 2, mb: 1 }}>
            {loginError.message}
          </Alert>
          <Alert severity="warning" sx={{ borderRadius: 2 }}>
            {loginError.warning}
          </Alert>
        </Box>
      );
    }

    return <Alert severity="error" sx={{ mb: 2, width: '100%', borderRadius: 2 }}>Error al iniciar sesión.</Alert>;
  };


  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        backgroundImage: 'linear-gradient(135deg, rgba(15, 23, 42, 0.6) 0%, rgba(20, 30, 55, 0.85) 100%), url(/login_bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        p: 2
      }}
    >
      <Paper 
        elevation={0} 
        sx={{ 
          p: { xs: 4, sm: 6 }, 
          width: '100%', 
          maxWidth: 450, 
          borderRadius: '32px', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          backgroundColor: 'rgba(255, 255, 255, 0.82)', 
          backdropFilter: 'blur(25px) saturate(200%)', 
          border: '1px solid rgba(255, 255, 255, 0.45)', 
          boxShadow: '0 50px 100px -20px rgba(0,0,0,0.35), 0 30px 60px -30px rgba(0,0,0,0.4)',
          position: 'relative',
          overflow: 'hidden',
          '&:before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '6px',
            background: 'linear-gradient(90deg, #2563eb 0%, #10b981 100%)',
          }
        }}
      >
        <Avatar 
          sx={{ 
            m: 1, 
            bgcolor: 'primary.main', 
            width: 60, 
            height: 60,
            boxShadow: '0 10px 20px -5px rgba(37, 99, 235, 0.4)',
            border: '2px solid rgba(255,255,255,0.8)'
          }}
        >
          <LockOutlinedIcon fontSize="large" sx={{ color: 'white' }} />
        </Avatar>
        <Typography 
          variant="h3" 
          sx={{ 
            fontWeight: 900, 
            mt: 1.5, 
            mb: 0.5,
            letterSpacing: '-1.5px',
            background: 'linear-gradient(135deg, #0f172a 0%, #2563eb 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          NEXUS ERP
        </Typography>
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ fontWeight: 600, mb: 4, letterSpacing: '0.2px', opacity: 0.8 }}
        >
          Sistema de Gestión Inteligente • Venezuela
        </Typography>
        
        {renderError()}
        
        <Box component="form" onSubmit={handleLogin} sx={{ mt: 1, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            label="Usuario"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            sx={{ 
              '& .MuiOutlinedInput-root': { 
                borderRadius: '16px',
                backgroundColor: 'rgba(255,255,255,0.5)',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.8)',
                },
                '&.Mui-focused': {
                  backgroundColor: '#ffffff',
                }
              } 
            }}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            label="Contraseña"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ 
              '& .MuiOutlinedInput-root': { 
                borderRadius: '16px',
                backgroundColor: 'rgba(255,255,255,0.5)',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.8)',
                },
                '&.Mui-focused': {
                  backgroundColor: '#ffffff',
                }
              } 
            }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading}
            sx={{ 
              mt: 4, 
              mb: 3, 
              py: 1.8, 
              borderRadius: '18px', 
              fontWeight: 800, 
              textTransform: 'none', 
              fontSize: '1.05rem',
              letterSpacing: '0.5px',
              boxShadow: '0 12px 24px -6px rgba(37, 99, 235, 0.4)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 16px 32px -8px rgba(37, 99, 235, 0.5)',
              }
            }}
          >
            {loading ? 'Iniciando sesión...' : 'Ingresar al ERP'}
          </Button>
          <Typography 
            variant="caption" 
            color="text.disabled" 
            sx={{ 
              display: 'block', 
              textAlign: 'center', 
              fontWeight: 600, 
              letterSpacing: '0.5px', 
              textTransform: 'uppercase',
              mb: 1
            }}
          >
            Multi-Empresa • Licencia Activa
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              display: 'block', 
              textAlign: 'center', 
              fontWeight: 700, 
              fontSize: '0.75rem',
              color: 'primary.main',
              letterSpacing: '0.5px'
            }}
          >
            Elaborado por Infagrasolution
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}

