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
  const [error, setError] = useState('');
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
    setError('');
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
      setError(err.response?.data?.detail || 'Error de inicio de sesión. Verifique sus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
      <Paper elevation={1} sx={{ p: 4, width: '100%', maxWidth: 400, borderRadius: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid', borderColor: 'divider' }}>
        <Avatar sx={{ m: 1, bgcolor: 'primary.main', width: 56, height: 56 }}>
          <LockOutlinedIcon fontSize="large" />
        </Avatar>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 3, letterSpacing: '-0.5px' }}>
          Nexus ERP
        </Typography>
        
        {error && <Alert severity="error" sx={{ mb: 2, width: '100%', borderRadius: 2 }}>{error}</Alert>}
        
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
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
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
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading}
            sx={{ mt: 3, mb: 2, py: 1.5, borderRadius: 3, fontWeight: 700, textTransform: 'none', fontSize: '1.1rem' }}
          >
            {loading ? 'Iniciando sesión...' : 'Entrar'}
          </Button>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ fontWeight: 500 }}>
            ERP Multitenant Profesional
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
