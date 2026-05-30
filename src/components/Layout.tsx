import { useState, useEffect } from 'react';
import { Box, AppBar, Toolbar, Typography, IconButton, Avatar, Button, Menu, MenuItem, Divider, ListItemIcon, ListItemText, Tooltip } from '@mui/material';
import { 
  Dashboard as DashboardIcon, 
  Inventory as InventoryIcon, 
  PointOfSale as SalesIcon, 
  ViewModule as ViewModuleIcon,
  Business as BusinessIcon,
  ShoppingCart as ShoppingCartIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  AdminPanelSettings as AdminIcon,
  Warehouse as WarehouseIcon,
  CompareArrows as TransferIcon,
  Logout as LogoutIcon,
  AccountBalanceWallet as AccountIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../api/axiosConfig';
import { useAppStore } from '../store/useAppStore';

function Clock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary', fontFamily: 'monospace', fontSize: '1rem' }}>
      {time.toLocaleTimeString()}
    </Typography>
  );
}



export default function Layout() {
  const { user, setUser } = useAppStore();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleLogout = async () => {
    setAnchorEl(null);
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await api.post('/auth/logout', { refresh_token: refreshToken });
      }
    } catch (e) {
      console.error('Logout error', e);
    } finally {
      localStorage.clear(); // Clear everything
      setUser(null);
      navigate('/login');
    }
  };

  const { data: userData } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const response = await api.get('/auth/me');
      setUser(response.data);
      return response.data;
    },
  });

  const allMenuItems = [
    { id: 'dashboard', text: t('Dashboard'), icon: <DashboardIcon />, path: '/dashboard' },
    { id: 'inventory', text: t('Inventory'), icon: <InventoryIcon />, path: '/inventory' },
    { id: 'inventory', text: t('Warehouses'), icon: <WarehouseIcon />, path: '/warehouses' },
    { id: 'inventory', text: t('Transfers'), icon: <TransferIcon />, path: '/transfers' },
    { id: 'inventory', text: t('Catalog'), icon: <ViewModuleIcon />, path: '/catalog' },
    { id: 'purchases', text: t('Suppliers'), icon: <BusinessIcon />, path: '/suppliers' },
    { id: 'purchases', text: t('Purchases'), icon: <ShoppingCartIcon />, path: '/purchases' },
    { id: 'users', text: t('Users'), icon: <PeopleIcon />, path: '/users' },
    { id: 'settings', text: t('Settings'), icon: <SettingsIcon />, path: '/settings' },
    { id: 'accounting', text: t('Contabilidad'), icon: <AccountIcon />, path: '/accounting' },
    { id: 'sales', text: t('Point of Sale'), icon: <SalesIcon />, path: '/sales' },
  ];

  const userModulesStr = user?.modules || 'sales,inventory,purchases,accounting';
  
  // Menu items kept in code for reference or future use if needed, but not rendered in sidebar
  const menuItems = user?.is_superuser 
    ? allMenuItems
    : allMenuItems.filter(item => item.id === 'dashboard' || userModulesStr.includes(item.id));

  if (user?.is_superuser || userData?.is_superuser) {
    menuItems.push({ id: 'admin', text: t('Admin SaaS'), icon: <AdminIcon />, path: '/admin' });
  }

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

  // Inactivity monitor (dynamic from tenant settings, defaults to 15 minutes)
  useEffect(() => {
    let timeoutId: any;
    const timeoutMinutes = tenantData?.settings?.session_timeout || 15;
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

    resetTimer(); // Initialize timer

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keypress', resetTimer);
      window.removeEventListener('click', resetTimer);
      window.removeEventListener('scroll', resetTimer);
    };
  }, [tenantData?.settings?.session_timeout]);

  const getLicenseWarning = () => {
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
    enabled: !!user && !user.is_superuser // Superadmins manage tenants via Admin SaaS
  });

  const handleBranchChange = (branchId: string) => {
    if (branchId === 'main') {
      localStorage.removeItem('active_tenant_id');
    } else {
      localStorage.setItem('active_tenant_id', branchId);
    }
    window.location.reload(); // Reload to refresh all data with new tenant context
  };

  const activeTenantId = localStorage.getItem('active_tenant_id') || 'main';

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, bgcolor: 'background.paper', color: 'text.primary', borderBottom: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
        {warning && (
          <Box sx={{ bgcolor: 'warning.main', color: 'warning.contrastText', textAlign: 'center', py: 0.5, fontSize: '0.875rem', fontWeight: 600 }}>
            {warning}
          </Box>
        )}
        <Toolbar>
          <Box 
            onClick={() => navigate('/dashboard')}
            sx={{ 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
              mr: 4
            }}
          >
            {tenantData?.logo_url ? (
              <Box 
                component="img" 
                src={tenantData.logo_url} 
                sx={{ height: 45, width: 'auto', mb: 0.5 }} 
              />
            ) : (
              <Box sx={{ bgcolor: tenantData?.primary_color || 'primary.main', color: 'white', p: 0.5, borderRadius: 1.5, display: 'flex', mb: 0.5 }}>
                <HomeIcon fontSize="small" />
              </Box>
            )}
            <Typography variant="caption" sx={{ fontWeight: 900, color: tenantData?.primary_color || 'primary.main', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '1px' }}>
              {tenantData?.name || 'NEXUS ERP'}
            </Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <Clock />
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.disabled' }}>
                {new Date().toLocaleDateString()}
              </Typography>
            </Box>
            {location.pathname !== '/dashboard' && (
              <Button 
                variant="text" 
                startIcon={<DashboardIcon />} 
                onClick={() => navigate('/dashboard')}
                sx={{ fontWeight: 700, color: 'text.secondary', borderRadius: 2 }}
              >
                Volver al Tablero
              </Button>
            )}
            {/* Branch Switcher */}
            {branches.length > 0 && (
              <Box sx={{ mr: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <BusinessIcon fontSize="small" color="action" />
                <select 
                  value={activeTenantId} 
                  onChange={(e) => handleBranchChange(e.target.value)}
                  style={{ 
                    padding: '4px 8px', 
                    borderRadius: '6px', 
                    border: '1px solid #ddd',
                    fontSize: '0.875rem',
                    outline: 'none',
                    backgroundColor: '#f8f9fa'
                  }}
                >
                  <option value="main">Sucursal Principal</option>
                  {branches.map((b: any) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </Box>
            )}

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                <Typography variant="body2" sx={{ fontWeight: 800, lineHeight: 1 }}>{user?.username || 'Usuario'}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>{user?.email}</Typography>
              </Box>
              <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ p: 0, border: '2px solid', borderColor: 'divider' }}>
                <Avatar sx={{ bgcolor: tenantData?.primary_color || 'primary.main', fontWeight: 'bold', width: 38, height: 38 }}>
                  {user?.username?.[0].toUpperCase() || user?.email?.[0].toUpperCase() || 'U'}
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                slotProps={{ paper: { sx: { borderRadius: 3, mt: 1.5, minWidth: 180, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' } } }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem onClick={() => { setAnchorEl(null); navigate('/settings'); }}>
                  <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Configuración" />
                </MenuItem>
                {user?.is_superuser && (
                  <MenuItem onClick={() => { setAnchorEl(null); navigate('/admin'); }}>
                    <ListItemIcon><AdminIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Panel SaaS" />
                  </MenuItem>
                )}
                <Divider />
                <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                  <ListItemIcon><LogoutIcon fontSize="small" color="error" /></ListItemIcon>
                  <ListItemText primary="Cerrar Sesión" />
                </MenuItem>
              </Menu>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>
      {/* Sidebar removed per user request - Dashboard handles all navigation */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          minHeight: '100vh',
          mt: location.pathname === '/sales' ? 0 : 12, // POS doesn't need top margin from Layout
          pb: location.pathname === '/sales' ? 0 : 8,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          overflowX: 'hidden',
          transition: 'all 0.3s ease',
          bgcolor: location.pathname === '/sales' ? 'background.default' : 'transparent'
        }}
      >
        {/* Superadmin impersonation banner */}
        {localStorage.getItem('active_tenant_id') && user?.is_superuser && (
          <Box sx={{ mb: 2, p: 1.5, bgcolor: '#fff3e0', border: '1px solid #ffe0b2', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography sx={{ fontWeight: 700, color: '#e65100', fontSize: '0.9rem' }}>
              ⚠️ Viendo empresa: <strong>{localStorage.getItem('active_tenant_name')}</strong>
            </Typography>
            <Button 
              size="small" 
              variant="outlined"
              color="warning"
              onClick={() => { localStorage.removeItem('active_tenant_id'); localStorage.removeItem('active_tenant_name'); window.location.href = '/admin'; }}
              sx={{ borderRadius: 2, fontWeight: 600 }}
            >
              Salir
            </Button>
          </Box>
        )}
        <Outlet />
        
        {/* Footer Info */}
        {location.pathname !== '/sales' && (
          <Box sx={{ mt: 'auto', pt: 6, pb: 4, textAlign: 'center', width: '100%' }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.disabled', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              NEXUS ERP v2.0 • Elaborado por <strong>Infagrasolution</strong>
            </Typography>
          </Box>
        )}
      </Box>

      {/* Floating WhatsApp Support Button */}
      {user && (
        <Tooltip title="Soporte Técnico" arrow placement="left">
          <IconButton
            href={`https://wa.me/584120161906?text=Hola%20NEXUS%20ERP%2C%20necesito%20soporte%20t%C3%A9cnico%20para%20mi%20empresa.%20Mi%20usuario%20es%20${user.username || 'invitado'}.`}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              bgcolor: '#25D366',
              color: 'white',
              boxShadow: '0 8px 30px rgba(37, 211, 102, 0.4)',
              width: 60,
              height: 60,
              zIndex: 9999,
              transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              '&:hover': {
                bgcolor: '#128C7E',
                transform: 'scale(1.1) rotate(10deg)',
                boxShadow: '0 12px 40px rgba(37, 211, 102, 0.6)',
              },
              animation: 'pulseWhatsApp 2s infinite',
              '@keyframes pulseWhatsApp': {
                '0%': { boxShadow: '0 0 0 0 rgba(37, 211, 102, 0.7)' },
                '70%': { boxShadow: '0 0 0 15px rgba(37, 211, 102, 0)' },
                '100%': { boxShadow: '0 0 0 0 rgba(37, 211, 102, 0)' }
              }
            }}
          >
            <svg 
              viewBox="0 0 24 24" 
              width="32" 
              height="32" 
              fill="currentColor"
            >
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.5-5.734-1.453L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.963C16.592 1.981 14.119.957 11.487.957c-5.43 0-9.85 4.37-9.855 9.801-.001 1.71.472 3.376 1.367 4.832L2.012 21.6l6.635-1.746zM17.421 15c-.342-.17-.2.022-1.129-.513-.304-.16-.507-.24-.761-.62-.254-.38-.761-1.58-.888-1.823-.127-.242-.253-.483-.443-.683-.19-.2-.38-.242-.57-.242-.19 0-.38.042-.57.242s-.76 1.012-.76 1.378c0 .367-.127.76-.38 1.012-.253.253-.761.507-1.14.761-.989.47-1.745.06-2.584-.338-.838-.398-1.56-.913-2.18-1.547-.62-.634-1.077-1.29-1.393-1.956-.316-.665-.253-1.076.064-1.393.317-.316.633-.76.95-1.14.19-.228.254-.38.38-.633.127-.253.063-.507-.032-.76-.095-.253-.76-1.836-.887-2.14-.127-.304-.253-.38-.443-.38-.19-.001-.38-.001-.57-.001-.19 0-.507.063-.761.316-.254.254-1.014 1.013-1.014 2.47 0 1.457 1.014 2.872 1.14 3.062.127.19 1.996 3.036 4.832 4.262.675.292 1.202.467 1.613.597.678.215 1.295.185 1.782.113.543-.08 1.67-.683 1.905-1.342.235-.658.235-1.223.165-1.342-.07-.119-.253-.2-.57-.37z"/>
            </svg>
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
}
