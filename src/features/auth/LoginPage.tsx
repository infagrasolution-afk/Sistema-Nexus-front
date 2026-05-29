import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, TextField, Button, Alert } from '@mui/material';

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
        background: 'radial-gradient(circle at center, #0f1e36 0%, #030712 100%)',
        position: 'relative',
        overflow: 'hidden',
        p: 2
      }}
    >
      {/* Cybernetic glowing background effects to match the reference image */}
      <Box sx={{
        position: 'absolute',
        width: '600px',
        height: '600px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(14, 165, 233, 0.15) 0%, rgba(0,0,0,0) 70%)',
        top: '15%',
        left: '10%',
        filter: 'blur(80px)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />
      <Box sx={{
        position: 'absolute',
        width: '700px',
        height: '700px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(37, 99, 235, 0.15) 0%, rgba(0,0,0,0) 70%)',
        bottom: '10%',
        right: '5%',
        filter: 'blur(100px)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      {/* Cyber grid line rays */}
      <Box sx={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: 'radial-gradient(rgba(56, 189, 248, 0.08) 1.5px, transparent 1.5px)',
        backgroundSize: '32px 32px',
        opacity: 0.7,
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      <Paper 
        elevation={0} 
        sx={{ 
          p: { xs: 4, sm: 6 }, 
          width: '100%', 
          maxWidth: 450, 
          borderRadius: '28px', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          backgroundColor: 'rgba(15, 23, 42, 0.65)', 
          backdropFilter: 'blur(35px) saturate(210%)', 
          border: '1px solid rgba(56, 189, 248, 0.25)', 
          boxShadow: '0 0 60px rgba(14, 165, 233, 0.25), 0 30px 60px -15px rgba(0,0,0,0.8)',
          position: 'relative',
          overflow: 'hidden',
          zIndex: 1,
          '&:before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #38bdf8 0%, #2563eb 100%)',
          }
        }}
      >
        {/* Infagrasolution Logo on top of the card */}
        <Box 
          component="img" 
          src="/logo_infagrasolution.png" 
          sx={{ 
            width: 80, 
            height: 80, 
            mb: 2.5, 
            borderRadius: '18px',
            filter: 'drop-shadow(0 0 15px rgba(56, 189, 248, 0.6))',
            border: '2px solid rgba(255, 255, 255, 0.15)',
            p: 0.5,
            bgcolor: 'rgba(255, 255, 255, 0.95)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
          }} 
        />
        
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 800, 
            mt: 0.5, 
            mb: 0.5,
            letterSpacing: '-0.5px',
            color: '#ffffff',
            textAlign: 'center'
          }}
        >
          Member Login
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            fontWeight: 600, 
            mb: 4, 
            letterSpacing: '0.5px', 
            color: 'rgba(56, 189, 248, 0.85)',
            textAlign: 'center'
          }}
        >
          NEXUS ERP • SISTEMA DE GESTIÓN
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
            slotProps={{
              inputLabel: {
                shrink: true
              }
            }}
            placeholder="Introduce tu usuario"
            sx={{ 
              '& .MuiOutlinedInput-root': { 
                borderRadius: '16px',
                color: '#ffffff',
                backgroundColor: 'rgba(3, 7, 18, 0.55)',
                '& fieldset': {
                  borderColor: 'rgba(56, 189, 248, 0.3)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(56, 189, 248, 0.7)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#38bdf8',
                  boxShadow: '0 0 12px rgba(56, 189, 248, 0.3)'
                }
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.8)',
                fontWeight: 700,
                '&.Mui-focused': {
                  color: '#38bdf8',
                }
              },
              '& .MuiInputBase-input::placeholder': {
                color: 'rgba(255, 255, 255, 0.35)',
                opacity: 1
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
            slotProps={{
              inputLabel: {
                shrink: true
              }
            }}
            placeholder="••••••••"
            sx={{ 
              '& .MuiOutlinedInput-root': { 
                borderRadius: '16px',
                color: '#ffffff',
                backgroundColor: 'rgba(3, 7, 18, 0.55)',
                '& fieldset': {
                  borderColor: 'rgba(56, 189, 248, 0.3)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(56, 189, 248, 0.7)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#38bdf8',
                  boxShadow: '0 0 12px rgba(56, 189, 248, 0.3)'
                }
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.8)',
                fontWeight: 700,
                '&.Mui-focused': {
                  color: '#38bdf8',
                }
              },
              '& .MuiInputBase-input::placeholder': {
                color: 'rgba(255, 255, 255, 0.35)',
                opacity: 1
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
              background: 'linear-gradient(135deg, #38bdf8 0%, #2563eb 100%)',
              color: '#ffffff',
              boxShadow: '0 0 25px rgba(56, 189, 248, 0.35), 0 8px 24px rgba(37, 99, 235, 0.4)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 0 35px rgba(56, 189, 248, 0.55), 0 12px 32px rgba(37, 99, 235, 0.5)',
              }
            }}
          >
            {loading ? 'Iniciando sesión...' : 'Log In'}
          </Button>
          
          <Typography 
            variant="caption" 
            sx={{ 
              display: 'block', 
              textAlign: 'center', 
              fontWeight: 600, 
              letterSpacing: '1px', 
              textTransform: 'uppercase',
              color: 'rgba(255, 255, 255, 0.4)',
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
              fontWeight: 800, 
              fontSize: '0.78rem',
              color: '#38bdf8',
              letterSpacing: '0.5px',
              textShadow: '0 0 8px rgba(56, 189, 248, 0.5)'
            }}
          >
            Elaborado por Infagrasolution
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}

