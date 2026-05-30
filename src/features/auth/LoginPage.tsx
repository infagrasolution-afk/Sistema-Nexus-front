import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, TextField, Button, Alert, InputAdornment } from '@mui/material';
import { MailOutlined, LockOutlined, ArrowForward } from '@mui/icons-material';

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
        background: 'radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)',
        p: 2
      }}
    >
      <Paper 
        elevation={24} 
        sx={{ 
          width: '100%', 
          maxWidth: 680, 
          minHeight: 500,
          borderRadius: '16px', 
          display: 'flex', 
          flexDirection: 'column', 
          backgroundImage: 'url("https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80")', 
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 30px 60px rgba(0, 0, 0, 0.4), 0 0 40px rgba(0,0,0,0.2)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          p: { xs: 4, sm: 6 },
          pb: { xs: 12, sm: 12 }, // extra space for absolute footer
          '&:before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.15) 0%, rgba(15, 23, 42, 0.4) 100%)',
            zIndex: 1,
            pointerEvents: 'none'
          }
        }}
      >
        {/* Top Header inside Card */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', zIndex: 2, mb: 6 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ color: '#ffffff', fontWeight: 300, fontSize: '1.4rem', letterSpacing: '1px', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
              NEXUS
            </Typography>
            <Typography sx={{ color: '#ffffff', fontWeight: 900, fontSize: '1.4rem', letterSpacing: '1px', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
              ERP
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 3 }}>
            <Typography sx={{ color: '#ffffff', fontWeight: 800, fontSize: '0.88rem', pb: 0.5, borderBottom: '2px solid #ffffff', cursor: 'pointer' }}>
              Login
            </Typography>
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.45)', fontWeight: 500, fontSize: '0.88rem', cursor: 'not-allowed' }}>
              Sign up
            </Typography>
          </Box>
        </Box>
        
        {/* Main Content Form */}
        <Box 
          component="form" 
          onSubmit={handleLogin} 
          sx={{ 
            width: '100%', 
            maxWidth: 320, 
            mx: 'auto', 
            my: 'auto', 
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          {renderError()}
          
          <TextField
            variant="standard"
            required
            fullWidth
            placeholder="nealgao@163.com"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start" sx={{ mr: 2 }}>
                    <MailOutlined sx={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '1.25rem' }} />
                  </InputAdornment>
                ),
                disableUnderline: true,
              }
            }}
            sx={{ 
              width: '100%',
              mb: 4,
              borderBottom: '1px solid rgba(255, 255, 255, 0.4)',
              pb: 1,
              transition: 'border-color 0.3s ease',
              '&:hover': {
                borderBottomColor: 'rgba(255, 255, 255, 0.8)',
              },
              '&.Mui-focused': {
                borderBottomColor: '#ffffff',
              },
              '& input': {
                color: '#ffffff',
                fontSize: '1rem',
                fontWeight: 500,
                py: 0.5,
                '&::placeholder': {
                  color: 'rgba(255, 255, 255, 0.55)',
                  opacity: 1
                }
              }
            }}
          />

          <TextField
            variant="standard"
            required
            fullWidth
            type="password"
            placeholder="*********"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start" sx={{ mr: 2 }}>
                    <LockOutlined sx={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '1.25rem' }} />
                  </InputAdornment>
                ),
                disableUnderline: true,
              }
            }}
            sx={{ 
              width: '100%',
              mb: 5,
              borderBottom: '1px solid rgba(255, 255, 255, 0.4)',
              pb: 1,
              transition: 'border-color 0.3s ease',
              '&:hover': {
                borderBottomColor: 'rgba(255, 255, 255, 0.8)',
              },
              '&.Mui-focused': {
                borderBottomColor: '#ffffff',
              },
              '& input': {
                color: '#ffffff',
                fontSize: '1rem',
                fontWeight: 500,
                py: 0.5,
                '&::placeholder': {
                  color: 'rgba(255, 255, 255, 0.55)',
                  opacity: 1
                }
              }
            }}
          />

          <Button
            type="submit"
            disabled={loading}
            endIcon={<ArrowForward sx={{ color: '#ffffff', fontSize: '1.1rem', ml: 1 }} />}
            sx={{ 
              width: '100%',
              height: '46px',
              borderRadius: '24px', 
              fontWeight: 600, 
              textTransform: 'none', 
              fontSize: '0.95rem',
              background: 'rgba(20, 35, 55, 0.75)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                background: 'rgba(20, 35, 55, 0.95)',
                transform: 'translateY(-1px)',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.35)',
                borderColor: 'rgba(255, 255, 255, 0.3)',
              }
            }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </Box>

        {/* Floating absolute dark footer overlay */}
        <Box 
          sx={{ 
            position: 'absolute', 
            bottom: 0, 
            left: 0, 
            right: 0, 
            bgcolor: 'rgba(10, 18, 30, 0.65)', 
            py: 2.2, 
            textAlign: 'center',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            zIndex: 2
          }}
        >
          <Typography sx={{ color: 'rgba(255, 255, 255, 0.45)', fontWeight: 500, fontSize: '0.74rem', letterSpacing: '0.5px' }}>
            SISTEMA NEXUS ERP • Licencia Activa
          </Typography>
          <Typography sx={{ color: 'rgba(255, 255, 255, 0.25)', fontWeight: 400, fontSize: '0.68rem', mt: 0.25 }}>
            Elaborado por Infagrasolution
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}

