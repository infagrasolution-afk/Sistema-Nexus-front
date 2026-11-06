import { useState, useEffect } from 'react';
import { 
  Box, AppBar, Toolbar, Typography, IconButton, Avatar, Button, Menu, MenuItem, 
  Divider, ListItemIcon, ListItemText, Tooltip, Chip, Fade
} from '@mui/material';
import { 
  Dashboard as DashboardIcon,
  Business as BusinessIcon,
  Settings as SettingsIcon,
  AdminPanelSettings as AdminIcon,
  Logout as LogoutIcon,
  Home as HomeIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  KeyboardArrowDown as ArrowDownIcon,
} from '@mui/icons-material';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../api/axiosConfig';
import { useAppStore } from '../store/useAppStore';
import SystemWizard from './SystemWizard';

function Clock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Box sx={{ textAlign: 'right' }}>
      <Typography 
        sx={{ 
          fontWeight: 800, 
          color: 'text.primary', 
          fontFamily: '"Outfit", monospace', 
          fontSize: '0.95rem',
          lineHeight: 1,
          letterSpacing: '0.5px'
        }}
      >
        {time.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </Typography>
      <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.disabled', fontSize: '0.68rem' }}>
        {time.toLocaleDateString('es-VE', { weekday: 'short', day: '2-digit', month: 'short' })}
      </Typography>
    </Box>
  );
}

export default function Layout() {
  const { user, setUser, themeMode, setThemeMode } = useAppStore();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleLogout = () => {
    setAnchorEl(null);
    
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      api.post('/auth/logout', { refresh_token: refreshToken }).catch(e => console.error('Logout error', e));
    }
    
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('active_tenant_id');
    localStorage.removeItem('active_tenant_name');
    sessionStorage.removeItem('session_active');
    sessionStorage.removeItem('apex_wizard_prompted');
    setUser(null);
    
    window.location.href = '/login';
  };

  useEffect(() => {
    sessionStorage.setItem('session_active', 'true');
  }, []);

  useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const response = await api.get('/auth/me');
      setUser(response.data);
      return response.data;
    },
  });

  const { data: tenantData } = useQuery({
    queryKey: ['my-tenant'],
    queryFn: async () => {
      const response = await api.get('/tenants/me');
      const data = response.data;
      useAppStore.getState().setTenant(data);
      return data;
    },
    enabled: !!user
  });

  // Inactivity monitor
  useEffect(() => {
    let timeoutId: any;
    const timeoutMinutes = tenantData?.settings?.session_timeout || 30;
    const INACTIVITY_LIMIT = timeoutMinutes * 60 * 1000;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        handleLogout();
      }, INACTIVITY_LIMIT);
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keypress', resetTimer);
    window.addEventListener('click', resetTimer);
    window.addEventListener('scroll', resetTimer);

    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keypress', resetTimer);
      window.removeEventListener('click', resetTimer);
      window.removeEventListener('scroll', resetTimer);
    };
  }, [tenantData?.settings?.session_timeout]);

  const getLicenseWarning = () => {
    if (tenantData?.id === 1 || tenantData?.name?.toLowerCase().includes('master') || tenantData?.name?.toLowerCase().includes('demo') || user?.is_superuser) {
      return null;
    }
    if (!tenantData?.subscription_end) return null;
    const end = new Date(tenantData.subscription_end);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 30 && diffDays > 0) {
      return `${t('Your license expires in')} ${diffDays} ${t('days. Please renew to avoid service interruption.')}`;
    }
    if (diffDays <= 0) {
      return t('Your license has expired. Please contact support to renew.');
    }
    return null;
  };

  const warning = getLicenseWarning();

  const { data: branches = [] } = useQuery({
    queryKey: ['my-branches'],
    queryFn: async () => {
      const response = await api.get('/tenants/branches');
      return response.data;
    },
    enabled: !!user && !user.is_superuser
  });

  const handleBranchChange = (branchId: string) => {
    sessionStorage.setItem('switching_branch', 'true');
    if (branchId === 'main') {
      localStorage.removeItem('active_tenant_id');
    } else {
      localStorage.setItem('active_tenant_id', branchId);
    }
    window.location.reload();
  };

  const activeTenantId = localStorage.getItem('active_tenant_id') || 'main';
  const isDashboard = location.pathname === '/dashboard';
  const isPOS = location.pathname === '/sales';

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Top AppBar - Premium Glassmorphism */}
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: (theme) => theme.palette.mode === 'dark' 
            ? 'rgba(11, 15, 25, 0.9)' 
            : 'rgba(255, 255, 255, 0.9)',
          color: 'text.primary',
          borderBottom: '1px solid',
          borderColor: 'divider',
          boxShadow: 'none',
          backdropFilter: 'blur(20px) saturate(180%)',
          transition: 'all 0.3s ease',
        }}
      >
        {/* License Warning Banner */}
        {warning && (
          <Fade in>
            <Box sx={{ 
              bgcolor: 'warning.main', 
              color: 'warning.contrastText', 
              textAlign: 'center', 
              py: 0.6, 
              px: 2,
              fontSize: '0.82rem', 
              fontWeight: 700,
              letterSpacing: '0.2px',
            }}>
              ⚠️ {warning}
            </Box>
          </Fade>
        )}

        <Toolbar sx={{ gap: 1, minHeight: { xs: 60, sm: 68 }, px: { xs: 2, sm: 3 } }}>
          {/* Logo / Brand */}
          <Box 
            onClick={() => navigate('/dashboard')}
            sx={{ 
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 1.5,
              cursor: 'pointer',
              mr: { xs: 1, sm: 3 },
              transition: 'all 0.3s ease',
              '&:hover': { opacity: 0.85, transform: 'scale(0.98)' },
              textDecoration: 'none',
            }}
          >
            {tenantData?.logo_url ? (
              <Box 
                component="img" 
                src={tenantData.logo_url} 
                sx={{ height: { xs: 32, sm: 40 }, width: 'auto', borderRadius: 2 }} 
              />
            ) : (
              <Box sx={{ 
                background: `linear-gradient(135deg, ${tenantData?.primary_color || '#1e40af'} 0%, ${tenantData?.primary_color || '#2563eb'} 100%)`,
                color: 'white', 
                p: 0.7, 
                borderRadius: '10px', 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 4px 12px ${tenantData?.primary_color || '#2563eb'}44`,
                transition: 'all 0.3s ease',
              }}>
                <HomeIcon sx={{ fontSize: 20 }} />
              </Box>
            )}
            <Box>
              <Typography variant="caption" sx={{ 
                fontWeight: 900, 
                color: tenantData?.primary_color || 'primary.main', 
                textTransform: 'uppercase', 
                fontSize: { xs: '0.7rem', sm: '0.75rem' }, 
                letterSpacing: '1px',
                display: 'block',
                lineHeight: 1.2,
              }}>
                {tenantData?.name || 'APEX ERP'}
              </Typography>
              {user?.is_superuser && (
                <Typography variant="caption" sx={{ 
                  fontSize: '0.62rem', 
                  color: 'text.disabled', 
                  fontWeight: 600,
                  lineHeight: 1,
                }}>
                  Súper Admin
                </Typography>
              )}
            </Box>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          {/* Right side controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1.5, md: 3 } }}>
            {/* Clock - hidden on mobile */}
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
              <Clock />
            </Box>

            {/* Back to Dashboard button */}
            {!isDashboard && (
              <>
                <Button 
                  variant="text" 
                  startIcon={<DashboardIcon />} 
                  onClick={() => navigate('/dashboard')}
                  size="small"
                  sx={{ 
                    display: { xs: 'none', sm: 'inline-flex' }, 
                    fontWeight: 700, 
                    color: 'text.secondary', 
                    borderRadius: '12px',
                    px: 2,
                    py: 1,
                    fontSize: '0.82rem',
                    bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': {
                      bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                      color: 'primary.main',
                      borderColor: 'primary.main',
                    }
                  }}
                >
                  Tablero
                </Button>
                <IconButton
                  onClick={() => navigate('/dashboard')}
                  sx={{ display: { xs: 'inline-flex', sm: 'none' }, color: 'text.secondary', p: 1 }}
                  title="Volver al Tablero"
                >
                  <DashboardIcon fontSize="small" />
                </IconButton>
              </>
            )}

            {/* Branch Switcher */}
            {branches.length > 0 && (
              <Box sx={{ mr: 0.5, display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
                <BusinessIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                <select 
                  value={activeTenantId} 
                  onChange={(e) => handleBranchChange(e.target.value)}
                  style={{ 
                    padding: '5px 10px', 
                    borderRadius: '10px', 
                    border: '1px solid rgba(0,0,0,0.1)',
                    fontSize: '0.82rem',
                    outline: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  <option value="main">Sucursal Principal</option>
                  {branches.map((b: any) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </Box>
            )}

            {/* Theme Toggle */}
            <Tooltip title={themeMode === 'dark' ? 'Modo Claro' : 'Modo Oscuro'} arrow>
              <IconButton 
                onClick={() => setThemeMode(themeMode === 'light' ? 'dark' : 'light')} 
                size="small"
                sx={{ 
                  p: 1,
                  borderRadius: '10px',
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'primary.main',
                    color: 'white',
                  }
                }}
              >
                {themeMode === 'dark' 
                  ? <LightModeIcon sx={{ fontSize: 18, color: '#fbbf24' }} /> 
                  : <DarkModeIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                }
              </IconButton>
            </Tooltip>

            {/* User Menu */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                <Typography variant="body2" sx={{ fontWeight: 800, lineHeight: 1.1, fontSize: '0.85rem' }}>
                  {user?.username || 'Usuario'}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.7rem' }}>
                  {user?.email}
                </Typography>
              </Box>
              <Box
                onClick={(e) => setAnchorEl(e.currentTarget)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  cursor: 'pointer',
                  p: 0.5,
                  borderRadius: '14px',
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.06)' : 'rgba(37, 99, 235, 0.04)',
                  }
                }}
              >
                <Avatar sx={{ 
                  bgcolor: tenantData?.primary_color || 'primary.main', 
                  fontWeight: 800, 
                  width: 34, 
                  height: 34,
                  fontSize: '0.9rem',
                  boxShadow: `0 4px 12px ${tenantData?.primary_color || '#2563eb'}44`,
                }}>
                  {user?.username?.[0].toUpperCase() || user?.email?.[0].toUpperCase() || 'U'}
                </Avatar>
                <ArrowDownIcon sx={{ fontSize: 16, color: 'text.disabled', display: { xs: 'none', sm: 'block' } }} />
              </Box>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                slotProps={{ 
                  paper: { 
                    sx: { 
                      borderRadius: '18px', 
                      mt: 1.5, 
                      minWidth: 200, 
                      boxShadow: '0 20px 60px -10px rgba(0,0,0,0.12)',
                      border: '1px solid',
                      borderColor: 'divider',
                      backdropFilter: 'blur(20px)',
                      overflow: 'hidden',
                      p: 0.5,
                    } 
                  } 
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                {/* User info header */}
                <Box sx={{ px: 2, py: 1.5, mb: 0.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.2 }}>
                    {user?.username || 'Usuario'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                    {user?.email}
                  </Typography>
                  {user?.is_superuser && (
                    <Chip 
                      label="Súper Admin" 
                      size="small" 
                      color="primary"
                      sx={{ mt: 0.5, fontWeight: 700, fontSize: '0.65rem', height: 20, borderRadius: '8px' }}
                    />
                  )}
                </Box>
                <Divider sx={{ mb: 0.5 }} />
                
                <MenuItem onClick={() => { setAnchorEl(null); navigate('/settings'); }} sx={{ borderRadius: '12px', mx: 0.5 }}>
                  <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Configuración" slotProps={{ primary: { style: { fontWeight: 700, fontSize: '0.88rem' } } }} />
                </MenuItem>
                {user?.is_superuser && (
                  <MenuItem onClick={() => { setAnchorEl(null); navigate('/admin'); }} sx={{ borderRadius: '12px', mx: 0.5 }}>
                    <ListItemIcon><AdminIcon fontSize="small" color="primary" /></ListItemIcon>
                    <ListItemText primary="Panel SaaS" slotProps={{ primary: { style: { fontWeight: 700, fontSize: '0.88rem' } } }} />
                  </MenuItem>
                )}
                <Divider sx={{ my: 0.5 }} />
                <MenuItem 
                  onClick={handleLogout} 
                  sx={{ 
                    color: 'error.main', 
                    borderRadius: '12px', 
                    mx: 0.5,
                    '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.06)' }
                  }}
                >
                  <ListItemIcon><LogoutIcon fontSize="small" color="error" /></ListItemIcon>
                  <ListItemText primary="Cerrar Sesión" slotProps={{ primary: { style: { fontWeight: 700, fontSize: '0.88rem', color: 'inherit' } } }} />
                </MenuItem>
              </Menu>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content Area */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          minHeight: '100vh',
          mt: { xs: '60px', sm: '68px' }, 
          px: { xs: 2, sm: 4, md: 6 },
          pb: isPOS ? 0 : 8,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          overflowX: 'hidden',
          transition: 'all 0.3s ease',
          bgcolor: isPOS ? 'background.default' : 'transparent'
        }}
      >
        {/* Superadmin impersonation banner */}
        {localStorage.getItem('active_tenant_id') && user?.is_superuser && (
          <Fade in>
            <Box sx={{ 
              width: '100%',
              maxWidth: 1400,
              mt: 2,
              mb: 0,
              p: 1.5, 
              bgcolor: '#fff3e0', 
              border: '1px solid #ffe0b2', 
              borderRadius: '16px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              backdropFilter: 'blur(8px)',
            }}>
              <Typography sx={{ fontWeight: 700, color: '#e65100', fontSize: '0.88rem' }}>
                ⚠️ Viendo empresa: <strong>{localStorage.getItem('active_tenant_name')}</strong>
              </Typography>
              <Button 
                size="small" 
                variant="outlined"
                color="warning"
                onClick={() => { 
                  localStorage.removeItem('active_tenant_id'); 
                  localStorage.removeItem('active_tenant_name'); 
                  window.location.href = '/admin'; 
                }}
                sx={{ borderRadius: '10px', fontWeight: 700, fontSize: '0.78rem' }}
              >
                Salir
              </Button>
            </Box>
          </Fade>
        )}

        <Outlet />
        
        {/* Footer */}
        {!isPOS && (
          <Box sx={{ mt: 'auto', pt: 6, pb: 4, textAlign: 'center', width: '100%' }}>
            <Typography variant="caption" sx={{ 
              fontWeight: 600, 
              color: 'text.disabled', 
              letterSpacing: '0.3px',
              fontSize: '0.72rem',
            }}>
              APEX ERP v2.0 • Elaborado por{' '}
              <Box component="span" sx={{ fontWeight: 800, color: 'primary.main' }}>InfaGraSolution</Box>
              {' '}• infagrasolution@gmail.com
            </Typography>
          </Box>
        )}
      </Box>

      {/* Floating WhatsApp Support Button */}
      {user && (
        <Tooltip title="Soporte Técnico WhatsApp" arrow placement="left">
          <IconButton
            href={`https://wa.me/584120161906?text=Hola%20APEX%20ERP%2C%20necesito%20soporte%20t%C3%A9cnico.%20Mi%20usuario%20es%20${user.username || 'invitado'}.`}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              position: 'fixed',
              bottom: { xs: 16, sm: 24 },
              right: { xs: 16, sm: 24 },
              bgcolor: '#25D366',
              color: 'white',
              boxShadow: '0 8px 30px rgba(37, 211, 102, 0.4)',
              width: { xs: 50, sm: 56 },
              height: { xs: 50, sm: 56 },
              zIndex: 9999,
              transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              '&:hover': {
                bgcolor: '#128C7E',
                transform: 'scale(1.12) rotate(8deg)',
                boxShadow: '0 14px 40px rgba(37, 211, 102, 0.55)',
              },
              animation: 'pulseWA 2.5s infinite',
              '@keyframes pulseWA': {
                '0%': { boxShadow: '0 0 0 0 rgba(37, 211, 102, 0.6)' },
                '70%': { boxShadow: '0 0 0 14px rgba(37, 211, 102, 0)' },
                '100%': { boxShadow: '0 0 0 0 rgba(37, 211, 102, 0)' }
              }
            }}
          >
            <svg viewBox="0 0 24 24" style={{ width: '55%', height: '55%' }} fill="currentColor">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.5-5.734-1.453L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.963C16.592 1.981 14.119.957 11.487.957c-5.43 0-9.85 4.37-9.855 9.801-.001 1.71.472 3.376 1.367 4.832L2.012 21.6l6.635-1.746z"/>
            </svg>
          </IconButton>
        </Tooltip>
      )}

      {/* Floating Instagram Button */}
      {user && (
        <Tooltip title="Síguenos en Instagram" arrow placement="left">
          <IconButton
            href="https://www.instagram.com/infagrasolution?igsh=ZTRkMmJ1bDJ6bDl0"
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              position: 'fixed',
              bottom: { xs: 76, sm: 90 },
              right: { xs: 16, sm: 24 },
              background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
              color: 'white',
              boxShadow: '0 8px 30px rgba(220, 39, 67, 0.35)',
              width: { xs: 46, sm: 52 },
              height: { xs: 46, sm: 52 },
              zIndex: 9999,
              transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              '&:hover': {
                transform: 'scale(1.12) rotate(-8deg)',
                boxShadow: '0 14px 40px rgba(220, 39, 67, 0.5)',
              },
              animation: 'pulseIG 3s infinite 1s',
              '@keyframes pulseIG': {
                '0%': { boxShadow: '0 0 0 0 rgba(220, 39, 67, 0.5)' },
                '70%': { boxShadow: '0 0 0 14px rgba(220, 39, 67, 0)' },
                '100%': { boxShadow: '0 0 0 0 rgba(220, 39, 67, 0)' }
              }
            }}
          >
            <svg viewBox="0 0 24 24" style={{ width: '50%', height: '50%' }} fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
            </svg>
          </IconButton>
        </Tooltip>
      )}

      <SystemWizard />
    </Box>
  );
}
