import { useState, useEffect } from 'react';
import { Box, Drawer, AppBar, Toolbar, Typography, List, ListItem, ListItemButton, ListItemIcon, ListItemText, IconButton, Avatar, Button, Menu, MenuItem, Divider } from '@mui/material';
import { 
  Menu as MenuIcon, 
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
  Logout as LogoutIcon
} from '@mui/icons-material';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../api/axiosConfig';
import { useAppStore } from '../store/useAppStore';

const drawerWidth = 260;

export default function Layout() {
  const { sidebarOpen, toggleSidebar, user, setUser } = useAppStore();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await api.post('/auth/logout', { refresh_token: refreshToken });
      }
    } catch (e) {
      console.error('Logout error', e);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('active_tenant_id');
      window.location.href = '/login';
    }
  };

  // Inactivity monitor (15 minutes)
  useEffect(() => {
    let timeoutId: any;
    const INACTIVITY_LIMIT = 15 * 60 * 1000;

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
  }, []);


  const { data: userData } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const response = await api.get('/auth/me');
      setUser(response.data);
      return response.data;
    },
  });

  const menuItems = [
    { text: t('Dashboard'), icon: <DashboardIcon />, path: '/dashboard' },
    { text: t('Inventory'), icon: <InventoryIcon />, path: '/inventory' },
    { text: t('Warehouses'), icon: <WarehouseIcon />, path: '/warehouses' },
    { text: t('Transfers'), icon: <TransferIcon />, path: '/transfers' },
    { text: t('Catalog'), icon: <ViewModuleIcon />, path: '/catalog' },
    { text: t('Suppliers'), icon: <BusinessIcon />, path: '/suppliers' },
    { text: t('Purchases'), icon: <ShoppingCartIcon />, path: '/purchases' },
    { text: t('Users'), icon: <PeopleIcon />, path: '/users' },
    { text: t('Settings'), icon: <SettingsIcon />, path: '/settings' },
    { text: t('Point of Sale'), icon: <SalesIcon />, path: '/sales' },
  ];

  if (user?.is_superuser || userData?.is_superuser) {
    menuItems.push({ text: t('Admin SaaS'), icon: <AdminIcon />, path: '/admin' });
  }

  const { data: tenantData } = useQuery({
    queryKey: ['my-tenant'],
    queryFn: async () => {
      const response = await api.get('/tenants/me');
      return response.data;
    },
    enabled: !!user
  });

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
          <IconButton color="inherit" edge="start" onClick={toggleSidebar} sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 800, color: 'primary.main', letterSpacing: '-0.5px' }}>
            NEXUS ERP {tenantData?.parent_id ? `| ${tenantData.name}` : ''}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{user?.email?.split('@')[0] || 'Usuario'}</Typography>
              <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
                <Avatar sx={{ bgcolor: 'secondary.main', fontWeight: 'bold', width: 35, height: 35 }}>
                  {user?.email?.[0].toUpperCase() || 'U'}
                </Avatar>
              </IconButton>
              
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                slotProps={{ paper: { sx: { mt: 1, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' } } }}
              >
                <MenuItem onClick={() => navigate('/settings')} sx={{ gap: 1 }}>
                  <SettingsIcon fontSize="small" /> {t('Settings')}
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout} sx={{ gap: 1, color: 'error.main' }}>
                  <LogoutIcon fontSize="small" /> {t('Logout')}
                </MenuItem>
              </Menu>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="persistent"
        open={sidebarOpen}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box', borderRight: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', mt: 3 }}>
          <List>
            {menuItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <ListItem key={item.text} disablePadding sx={{ px: 2, mb: 1 }}>
                  <ListItemButton 
                    onClick={() => navigate(item.path)}
                    sx={{ 
                      borderRadius: '10px',
                      bgcolor: active ? 'primary.50' : 'transparent',
                      color: active ? 'primary.main' : 'text.secondary',
                      '&:hover': { bgcolor: active ? 'primary.100' : 'action.hover' }
                    }}
                  >
                    <ListItemIcon sx={{ color: active ? 'primary.main' : 'inherit', minWidth: 40 }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText primary={<Typography sx={{ fontWeight: active ? 600 : 500 }}>{item.text}</Typography>} />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 4, transition: 'margin 0.2s', ml: sidebarOpen ? 0 : `-${drawerWidth}px`, mt: 8 }}>
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
      </Box>
    </Box>
  );
}
