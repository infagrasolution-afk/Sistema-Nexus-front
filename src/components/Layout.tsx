import { useState, useEffect } from 'react';
import {
  Box, AppBar, Toolbar, Typography, IconButton, Avatar, Button, Menu, MenuItem,
  Divider, ListItemIcon, ListItemText, Tooltip, Chip, Fade, Drawer, Badge,
  Collapse, Paper
} from '@mui/material';
import {
  SpaceDashboardRounded as DashboardIcon,
  SettingsSuggestRounded as SettingsIcon,
  AdminPanelSettingsRounded as AdminIcon,
  LogoutRounded as LogoutIcon,
  DarkModeRounded as DarkModeIcon,
  LightModeRounded as LightModeIcon,
  KeyboardArrowDownRounded as ArrowDownIcon,
  KeyboardArrowRightRounded as ArrowRightIcon,
  RecordVoiceOverRounded as VoiceAgentIcon,
  CloudDoneRounded as OnlineIcon,
  CloudOffRounded as OfflineIcon,
  SyncRounded as SyncIcon,
  NotificationsActiveRounded as AlarmIcon,
  MenuRounded as MenuIcon,
  ChevronLeftRounded as CollapseIcon,
  TranslateRounded as TranslateIcon,
} from '@mui/icons-material';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../api/axiosConfig';
import { useAppStore } from '../store/useAppStore';
import SystemWizard from './SystemWizard';
import { ApexLogo } from './ApexLogo';
import { ALL_ERP_MODULES, SUPERADMIN_MODULE, type NavModuleGroup } from '../config/navigationModules';
import { getTotalPendingOfflineCount, syncOfflineSales } from '../utils/offlineQueue';
import { applyGlobalLanguageDOM } from '../utils/autoTranslateDOM';

const SIDEBAR_WIDTH = 285;
const SIDEBAR_COLLAPSED_WIDTH = 72;

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
          fontSize: '0.9rem',
          lineHeight: 1,
          letterSpacing: '0.5px',
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
  const { user, setUser, setTenant, themeMode, setThemeMode, hasModule } = useAppStore();
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language?.startsWith('en') ? 'en' : 'es';
  const toggleLanguage = () => {
    const next = currentLang === 'es' ? 'en' : 'es';
    i18n.changeLanguage(next);
    localStorage.setItem('i18nextLng', next);
    applyGlobalLanguageDOM(next);
  };

  useEffect(() => {
    applyGlobalLanguageDOM(currentLang);
  }, [currentLang]);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [alarmAnchorEl, setAlarmAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [sidebarPinned, setSidebarPinned] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const desktopSidebarExpanded = sidebarPinned || sidebarHovered;
  const [logoError, setLogoError] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>('sales_group');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingOfflineCount, setPendingOfflineCount] = useState<number>(getTotalPendingOfflineCount());
  const [isSyncingOffline, setIsSyncingOffline] = useState<boolean>(false);

  const { data: wmsAlerts = [] } = useQuery({
    queryKey: ['wms-alerts'],
    queryFn: async () => (await api.get('/inventory/alerts')).data,
    enabled: !!user,
    refetchInterval: 15000,
  });

  const triggerGlobalOfflineSync = async () => {
    const count = getTotalPendingOfflineCount();
    if (count === 0 || !navigator.onLine) return;
    setIsSyncingOffline(true);
    try {
      const { synced } = await syncOfflineSales(api);
      setPendingOfflineCount(getTotalPendingOfflineCount());
      if (synced > 0) {
        queryClient.invalidateQueries();
      }
    } finally {
      setIsSyncingOffline(false);
    }
  };

  useEffect(() => {
    const refreshQueueCount = () => setPendingOfflineCount(getTotalPendingOfflineCount());
    const handleOnline = () => {
      setIsOnline(true);
      triggerGlobalOfflineSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('apex-offline-queue-updated', refreshQueueCount);

    const interval = setInterval(() => {
      setIsOnline(navigator.onLine);
      refreshQueueCount();
      if (navigator.onLine && getTotalPendingOfflineCount() > 0) {
        triggerGlobalOfflineSync();
      }
    }, 15000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('apex-offline-queue-updated', refreshQueueCount);
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    setAnchorEl(null);
    setMobileDrawerOpen(false);

    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      api.post('/auth/logout', { refresh_token: refreshToken }).catch((e) => console.error('Logout error', e));
    }

    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('active_tenant_id');
    localStorage.removeItem('active_tenant_name');
    sessionStorage.removeItem('session_active');
    sessionStorage.removeItem('apex_wizard_prompted');
    setUser(null);
    setTenant(null);
    queryClient.clear();

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
    refetchInterval: 12000,
    refetchOnWindowFocus: true,
    retry: false,
  });

  const activeTenantId = localStorage.getItem('active_tenant_id') || 'main';

  const { data: tenantData } = useQuery({
    queryKey: ['my-tenant', user?.id, user?.tenant_id, activeTenantId],
    queryFn: async () => {
      const response = await api.get('/tenants/me');
      const data = response.data;
      useAppStore.getState().setTenant(data);
      setLogoError(false);
      return data;
    },
    enabled: !!user,
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
    if (
      tenantData?.id === 1 ||
      tenantData?.name?.toLowerCase().includes('master') ||
      tenantData?.name?.toLowerCase().includes('demo') ||
      user?.is_superuser
    ) {
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
    enabled: !!user && !user.is_superuser,
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

  const isDashboard = location.pathname === '/dashboard';
  const isPOS = location.pathname === '/sales';

  const isPrivilegedAdmin = Boolean(user?.is_superuser || (user as any)?.is_tenant_admin);
  const rolePermCodes = new Set<string>(
    (((user as any)?.role?.permissions) || []).map((p: any) => String(p.code || ''))
  );

  const canAccessSubModule = (subId: string): boolean => {
    if (isPrivilegedAdmin) return true;
    const hasAny = (...codes: string[]) => codes.some((c) => rolePermCodes.has(c));

    switch (subId) {
      // Ventas
      case 'pos':
      case 'manual_billing':
      case 'budgets':
      case 'delivery_notes':
        return hasAny('sales:read', 'sales:write');
      case 'customers':
        return hasAny('sales:customers', 'sales:read', 'sales:write');
      case 'debit_notes':
      case 'credit_notes':
        return hasAny('sales:void');

      // Inventario
      case 'catalog':
      case 'warehouses':
      case 'movements':
      case 'audits':
        return hasAny('inventory:read', 'inventory:write');
      case 'adjustments':
        return hasAny('inventory:adjust');
      case 'charges':
        return hasAny('inventory:charge');
      case 'discharges':
        return hasAny('inventory:discharge');
      case 'transfers':
        return hasAny('inventory:transfer');
      case 'dispatch_notes':
        return hasAny('inventory:dispatch');

      // Contabilidad
      case 'accounts':
      case 'journal':
      case 'reconciliation':
        return hasAny('accounting:read', 'accounting:write');

      // Tesorería y Caja
      case 'cxc':
      case 'cxp':
      case 'bank_accounts':
        return hasAny('treasury:read', 'treasury:write');
      case 'cash':
        return hasAny('cash:read', 'cash:write');

      // Nómina
      case 'employees':
      case 'payroll_periods':
        return hasAny('payroll:read', 'payroll:write');

      // Compras
      case 'purchases':
        return hasAny('purchases:read', 'purchases:write');
      case 'suppliers':
        return hasAny('purchases:suppliers', 'purchases:read', 'purchases:write');

      // Administración
      case 'reports':
        return hasAny('reports:read', 'fiscal:read');
      case 'users':
        return hasAny('users:read', 'users:write');
      case 'roles':
        return hasAny('settings:write', 'users:write');
      case 'settings':
        return hasAny('settings:read', 'settings:write');
      case 'manual':
        return true;

      default:
        return false;
    }
  };

  const allowedModules: NavModuleGroup[] = user?.is_superuser
    ? [...ALL_ERP_MODULES, SUPERADMIN_MODULE]
    : ALL_ERP_MODULES.reduce<NavModuleGroup[]>((acc, m) => {
        const licenseKey = m.reqId === 'users' ? 'admin' : m.reqId === 'payroll' ? 'hr' : m.reqId;
        if (!hasModule(licenseKey as any)) return acc;

        if (isPrivilegedAdmin) {
          acc.push(m);
          return acc;
        }

        if (m.subModules && m.subModules.length > 0) {
          const visibleSubs = m.subModules.filter((sub) => canAccessSubModule(sub.id));
          if (visibleSubs.length > 0) {
            acc.push({ ...m, subModules: visibleSubs });
          }
        }
        return acc;
      }, []);

  // Auto-expand the group matching the active route
  useEffect(() => {
    const matched = allowedModules.find((g) =>
      g.subModules?.some((sub) => location.pathname === sub.path)
    );
    if (matched) {
      setExpandedGroup(matched.id);
    }
  }, [location.pathname]);

  const handleNavigateFromSidebar = (path: string) => {
    setMobileDrawerOpen(false);
    navigate(path);
  };

  const renderSidebarContent = (expanded: boolean) => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        p: expanded ? 1.5 : 1,
        pt: expanded ? 1.5 : 1.5,
        overflowY: 'auto',
        overflowX: 'hidden',
        '&::-webkit-scrollbar': { width: '4px' },
      }}
    >
      {/* Monitor Ejecutivo Shortcut Card */}
      <Tooltip title={expanded ? '' : 'Monitor Ejecutivo en Vivo'} placement="right" arrow>
        <Paper
          elevation={0}
          onClick={() => handleNavigateFromSidebar('/dashboard')}
          sx={{
            p: expanded ? 1.4 : 1,
            mb: 1.8,
            borderRadius: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: expanded ? 'flex-start' : 'center',
            gap: 1.4,
            background: isDashboard
              ? `linear-gradient(135deg, ${tenantData?.primary_color || '#2563eb'} 0%, #1e40af 100%)`
              : 'transparent',
            color: isDashboard ? '#fff' : 'text.primary',
            border: '1px solid',
            borderColor: isDashboard ? 'transparent' : 'divider',
            boxShadow: isDashboard ? `0 8px 20px -6px ${tenantData?.primary_color || '#2563eb'}66` : 'none',
            transition: 'all 0.25s ease',
            '&:hover': {
              transform: 'translateX(2px)',
              borderColor: 'primary.main',
            },
          }}
        >
          <Box
            sx={{
              p: 0.8,
              borderRadius: '10px',
              bgcolor: isDashboard ? 'rgba(255,255,255,0.18)' : 'rgba(37, 99, 235, 0.1)',
              color: isDashboard ? '#fff' : 'primary.main',
              display: 'flex',
            }}
          >
            <DashboardIcon fontSize="small" />
          </Box>
            {expanded && (
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 800, lineHeight: 1.15 }}>
                {t('Executive Monitor')}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.68rem',
                  opacity: isDashboard ? 0.85 : 0.7,
                  fontWeight: 600,
                }}
              >
                {t('Live KPIs & Movements')}
              </Typography>
            </Box>
          )}
        </Paper>
      </Tooltip>

      {expanded && (
        <Typography
          variant="overline"
          sx={{ px: 1, mb: 0.8, fontWeight: 900, color: 'text.disabled', fontSize: '0.68rem', letterSpacing: '1px' }}
        >
          {t('System Modules')}
        </Typography>
      )}

      {/* Tarjeticas Ordenadas de Módulos */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.1 }}>
        {allowedModules.map((mod) => {
          const IconComp = mod.icon;
          const isGrouped = Boolean(mod.subModules && mod.subModules.length > 0);
          const isExpanded = expanded && expandedGroup === mod.id;
          const hasActiveSub = mod.subModules?.some((s) => location.pathname === s.path) || location.pathname === mod.path;

          return (
            <Tooltip key={mod.id} title={expanded ? '' : mod.title} placement="right" arrow>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: '1px solid',
                  borderColor: hasActiveSub ? `${mod.color}66` : 'divider',
                  position: 'relative',
                  transition: 'all 0.25s ease',
                  '&:before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: '4px',
                    background: mod.gradient,
                  },
                }}
              >
                <Box
                  onClick={() => {
                    if (isGrouped) {
                      setExpandedGroup(isExpanded ? null : mod.id);
                    } else if (mod.path) {
                      handleNavigateFromSidebar(mod.path);
                    }
                  }}
                  sx={{
                    p: expanded ? 1.25 : 1,
                    pl: expanded ? 1.8 : 1.2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: expanded ? 'space-between' : 'center',
                    cursor: 'pointer',
                    bgcolor: hasActiveSub ? `${mod.color}0a` : 'transparent',
                    '&:hover': { bgcolor: `${mod.color}0d` },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, minWidth: 0 }}>
                    <Box
                      sx={{
                        p: 0.75,
                        borderRadius: '10px',
                        bgcolor: `${mod.color}16`,
                        color: mod.color,
                        display: 'flex',
                        flexShrink: 0,
                      }}
                    >
                      <IconComp sx={{ fontSize: 19 }} />
                    </Box>
                    {expanded && (
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" noWrap sx={{ fontWeight: 800, fontSize: '0.82rem', lineHeight: 1.2 }}>
                          {mod.title}
                        </Typography>
                        {isGrouped && (
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.66rem', fontWeight: 600 }}>
                            {mod.subModules!.length} opciones
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Box>
                  {expanded && isGrouped && (
                    <Box sx={{ color: 'text.disabled', display: 'flex' }}>
                      {isExpanded ? <ArrowDownIcon fontSize="small" /> : <ArrowRightIcon fontSize="small" />}
                    </Box>
                  )}
                </Box>

                {isGrouped && expanded && (
                  <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                    <Box sx={{ px: 1.2, pb: 1.2, pt: 0.4, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {mod.subModules!.map((sub) => {
                        const SubIcon = sub.icon;
                        const active = location.pathname === sub.path;
                        return (
                          <Button
                            key={sub.id + sub.title}
                            fullWidth
                            size="small"
                            onClick={() => handleNavigateFromSidebar(sub.path)}
                            startIcon={<SubIcon sx={{ fontSize: 16, color: active ? '#fff' : mod.color }} />}
                            sx={{
                              justifyContent: 'flex-start',
                              textAlign: 'left',
                              borderRadius: '10px',
                              px: 1.2,
                              py: 0.7,
                              fontSize: '0.76rem',
                              fontWeight: active ? 800 : 600,
                              color: active ? '#fff' : 'text.primary',
                              bgcolor: active ? mod.color : 'transparent',
                              backgroundImage: active ? mod.gradient : 'none',
                              '&:hover': {
                                bgcolor: active ? mod.color : `${mod.color}14`,
                                transform: 'translateX(2px)',
                              },
                            }}
                          >
                            {sub.title}
                          </Button>
                        );
                      })}
                    </Box>
                  </Collapse>
                )}
              </Paper>
            </Tooltip>
          );
        })}
      </Box>

      {/* Mobile extras */}
      {expanded && (
        <Box sx={{ display: { xs: 'block', sm: 'none' }, mt: 2 }}>
          <Button
            fullWidth
            variant="outlined"
            color="primary"
            startIcon={<VoiceAgentIcon />}
            onClick={() => {
              setMobileDrawerOpen(false);
              window.dispatchEvent(new CustomEvent('open-apex-induction-agent'));
            }}
            sx={{ borderRadius: '12px', fontWeight: 800, mb: 1.2 }}
          >
            Inducción Virtual (Audio)
          </Button>
        </Box>
      )}

      {expanded && branches.length > 0 && (
        <Box sx={{ mt: 2, px: 0.5 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 0.5 }}>
            Sucursal Activa
          </Typography>
          <select
            value={activeTenantId}
            onChange={(e) => handleBranchChange(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: '10px',
              border: '1px solid rgba(100,116,139,0.25)',
              fontWeight: 700,
              fontSize: '0.8rem',
            }}
          >
            <option value="main">Sucursal Principal</option>
            {branches.map((b: any) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </Box>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default', width: '100%', overflowX: 'hidden' }}>
      {/* Top AppBar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: (theme) =>
            theme.palette.mode === 'dark' ? 'rgba(11, 15, 25, 0.92)' : 'rgba(255, 255, 255, 0.94)',
          color: 'text.primary',
          borderBottom: '1px solid',
          borderColor: 'divider',
          boxShadow: 'none',
          backdropFilter: 'blur(20px) saturate(180%)',
        }}
      >
        {warning && (
          <Fade in>
            <Box
              sx={{
                bgcolor: 'warning.main',
                color: 'warning.contrastText',
                textAlign: 'center',
                py: 0.6,
                px: 2,
                fontSize: { xs: '0.75rem', sm: '0.82rem' },
                fontWeight: 700,
              }}
            >
              ⚠️ {warning}
            </Box>
          </Fade>
        )}

        <Toolbar sx={{ gap: { xs: 0.75, sm: 1.5 }, minHeight: { xs: 58, sm: 66 }, px: { xs: 1.5, sm: 2.5 } }}>
          {/* Mobile Drawer Trigger */}
          <IconButton
            onClick={() => setMobileDrawerOpen(true)}
            size="small"
            sx={{
              display: { xs: 'inline-flex', md: 'none' },
              p: 0.9,
              borderRadius: '10px',
              border: '1px solid',
              borderColor: 'divider',
            }}
            aria-label="Abrir menú de módulos"
          >
            <MenuIcon fontSize="small" />
          </IconButton>

          {/* Desktop Sidebar Pin Toggle */}
          <Tooltip title={sidebarPinned ? 'Modo auto-ocultar al quitar el puntero' : 'Fijar barra lateral'} arrow>
            <IconButton
              onClick={() => setSidebarPinned((prev) => !prev)}
              size="small"
              sx={{
                display: { xs: 'none', md: 'inline-flex' },
                p: 0.9,
                borderRadius: '10px',
                border: '1px solid',
                borderColor: sidebarPinned ? 'primary.main' : 'divider',
                color: sidebarPinned ? 'primary.main' : 'inherit',
              }}
            >
              {sidebarPinned ? <CollapseIcon fontSize="small" /> : <MenuIcon fontSize="small" />}
            </IconButton>
          </Tooltip>

          {/* Brand: Client Logo (or APEX Logo fallback) & Company Name */}
          <Box
            onClick={() => navigate('/dashboard')}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: { xs: 1, sm: 1.5 },
              cursor: 'pointer',
              minWidth: 0,
              '&:hover': { opacity: 0.9 },
            }}
          >
            {tenantData?.logo_url && !logoError ? (
              <Box
                sx={{
                  height: { xs: 36, sm: 42 },
                  maxWidth: { xs: 110, sm: 150 },
                  minWidth: { xs: 36, sm: 42 },
                  borderRadius: '10px',
                  bgcolor: '#fff',
                  px: 1,
                  py: 0.4,
                  border: '1px solid',
                  borderColor: 'divider',
                  boxShadow: '0 2px 6px rgba(15, 23, 42, 0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  overflow: 'hidden',
                }}
              >
                <Box
                  component="img"
                  src={tenantData.logo_url}
                  alt={tenantData?.name || 'Logo'}
                  onError={() => setLogoError(true)}
                  sx={{
                    maxHeight: '100%',
                    maxWidth: '100%',
                    objectFit: 'contain',
                    display: 'block',
                  }}
                />
              </Box>
            ) : (
              <ApexLogo size={36} primaryColor={tenantData?.primary_color || '#2563eb'} />
            )}

            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="caption"
                noWrap
                sx={{
                  fontWeight: 900,
                  color: tenantData?.primary_color || 'primary.main',
                  textTransform: 'uppercase',
                  fontSize: { xs: '0.7rem', sm: '0.78rem' },
                  letterSpacing: '0.7px',
                  display: 'block',
                  lineHeight: 1.15,
                  maxWidth: { xs: 130, sm: 230, md: 280 },
                }}
              >
                {tenantData?.name || 'APEX ERP'}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.62rem',
                  color: 'text.disabled',
                  fontWeight: 700,
                  lineHeight: 1,
                  display: { xs: 'none', sm: 'block' },
                }}
              >
                {user?.is_superuser ? 'APEX ERP • Súper Admin' : 'APEX ERP Empresarial'}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          {/* Right side controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.6, sm: 1.2, md: 1.6 } }}>
            <Box sx={{ display: { xs: 'none', lg: 'block' } }}>
              <Clock />
            </Box>

            <Chip
              size="small"
              icon={
                isSyncingOffline ? (
                  <SyncIcon fontSize="small" />
                ) : isOnline ? (
                  <OnlineIcon fontSize="small" />
                ) : (
                  <OfflineIcon fontSize="small" />
                )
              }
              label={
                isSyncingOffline
                  ? `Sync (${pendingOfflineCount})`
                  : !isOnline
                    ? `Offline (${pendingOfflineCount})`
                    : pendingOfflineCount > 0
                      ? `Sync (${pendingOfflineCount})`
                      : t('Online')
              }
              color={!isOnline || pendingOfflineCount > 0 ? 'warning' : 'success'}
              onClick={pendingOfflineCount > 0 ? triggerGlobalOfflineSync : undefined}
              sx={{
                fontWeight: 800,
                fontSize: { xs: '0.66rem', sm: '0.72rem' },
                borderRadius: '8px',
                cursor: pendingOfflineCount > 0 ? 'pointer' : 'default',
                '& .MuiChip-label': { px: { xs: 0.8, sm: 1.2 } },
              }}
            />

            {wmsAlerts.length > 0 && (
              <>
                <Tooltip title="Alarma de Inventario: Productos próximos a agotarse que debes reponer" arrow>
                  <Box>
                    <Chip
                      size="small"
                      color="error"
                      icon={<AlarmIcon fontSize="small" />}
                      label={`🚨 ${wmsAlerts.length} por agotarse`}
                      onClick={(e) => setAlarmAnchorEl(e.currentTarget)}
                      sx={{
                        display: { xs: 'none', md: 'inline-flex' },
                        fontWeight: 900,
                        fontSize: '0.72rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                      }}
                    />
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => setAlarmAnchorEl(e.currentTarget)}
                      sx={{
                        display: { xs: 'inline-flex', md: 'none' },
                        p: 0.8,
                        border: '1px solid',
                        borderColor: 'error.main',
                        borderRadius: '10px',
                      }}
                    >
                      <Badge badgeContent={wmsAlerts.length} color="error">
                        <AlarmIcon fontSize="small" />
                      </Badge>
                    </IconButton>
                  </Box>
                </Tooltip>
                <Menu
                  anchorEl={alarmAnchorEl}
                  open={Boolean(alarmAnchorEl)}
                  onClose={() => setAlarmAnchorEl(null)}
                  slotProps={{
                    paper: {
                      sx: {
                        borderRadius: '18px',
                        mt: 1.5,
                        width: 390,
                        maxWidth: '94vw',
                        p: 1.5,
                        border: '2px solid',
                        borderColor: 'error.main',
                      },
                    },
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 900, color: 'error.main', px: 1, pb: 0.5 }}>
                    🚨 Alarma de Stock Mínimo ({wmsAlerts.length} productos)
                  </Typography>
                  <Divider sx={{ mb: 1 }} />
                  <Box sx={{ maxHeight: 260, overflowY: 'auto', px: 0.5 }}>
                    {wmsAlerts.map((al: any, idx: number) => (
                      <Box
                        key={idx}
                        sx={{
                          p: 1.2,
                          mb: 1,
                          borderRadius: 2,
                          bgcolor: 'action.hover',
                          borderLeft: '4px solid',
                          borderColor: al.status === 'AGOTADO' ? 'error.main' : 'warning.main',
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 800 }}>
                          {al.name} ({al.sku})
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'block', color: 'error.main', fontWeight: 700 }}>
                          ⚠️ Próximo a agotarse en {al.warehouse_name || 'Almacén'} — ¡Debes reponer!
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Disponible: <strong>{al.current_stock}</strong> | Mínimo: <strong>{al.min_stock}</strong>
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', gap: 1, px: 0.5 }}>
                    <Button
                      fullWidth
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        setAlarmAnchorEl(null);
                        navigate('/warehouses');
                      }}
                      sx={{ borderRadius: '8px', fontWeight: 700 }}
                    >
                      Ver Almacenes
                    </Button>
                    <Button
                      fullWidth
                      size="small"
                      variant="contained"
                      color="error"
                      onClick={() => {
                        setAlarmAnchorEl(null);
                        navigate('/purchases');
                      }}
                      sx={{ borderRadius: '8px', fontWeight: 800 }}
                    >
                      Reponer en Compras
                    </Button>
                  </Box>
                </Menu>
              </>
            )}

            <Tooltip title="Iniciar Agente Virtual de Inducción con Audio" arrow>
              <Button
                size="small"
                variant="outlined"
                color="primary"
                startIcon={<VoiceAgentIcon fontSize="small" />}
                onClick={() => window.dispatchEvent(new CustomEvent('open-apex-induction-agent'))}
                sx={{
                  display: { xs: 'none', sm: 'inline-flex' },
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '0.76rem',
                  px: 1.4,
                  py: 0.6,
                }}
              >
                {t('Induction (Audio)')}
              </Button>
            </Tooltip>

            <Tooltip title={currentLang === 'es' ? 'Cambiar idioma a Inglés (EN)' : 'Switch language to Spanish (ES)'} arrow>
              <Button
                size="small"
                variant="outlined"
                onClick={toggleLanguage}
                startIcon={<TranslateIcon sx={{ fontSize: 16 }} />}
                sx={{
                  minWidth: 'auto',
                  px: 1.1,
                  py: 0.55,
                  borderRadius: '10px',
                  borderColor: 'divider',
                  color: 'text.primary',
                  fontWeight: 800,
                  fontSize: '0.74rem',
                }}
              >
                {currentLang.toUpperCase()}
              </Button>
            </Tooltip>

            <Tooltip title={themeMode === 'dark' ? 'Modo Claro' : 'Modo Oscuro'} arrow>
              <IconButton
                onClick={() => setThemeMode(themeMode === 'light' ? 'dark' : 'light')}
                size="small"
                sx={{
                  p: 0.9,
                  borderRadius: '10px',
                  border: '1px solid',
                  borderColor: 'divider',
                  '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.main', color: 'white' },
                }}
              >
                {themeMode === 'dark' ? (
                  <LightModeIcon sx={{ fontSize: 18, color: '#fbbf24' }} />
                ) : (
                  <DarkModeIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                )}
              </IconButton>
            </Tooltip>

            {/* User Menu */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ textAlign: 'right', display: { xs: 'none', md: 'block' } }}>
                <Typography variant="body2" sx={{ fontWeight: 800, lineHeight: 1.1, fontSize: '0.84rem' }}>
                  {user?.username || 'Usuario'}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.68rem' }}>
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
                  p: 0.4,
                  borderRadius: '14px',
                  border: '1px solid',
                  borderColor: 'divider',
                  '&:hover': { borderColor: 'primary.main' },
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: tenantData?.primary_color || 'primary.main',
                    fontWeight: 800,
                    width: 32,
                    height: 32,
                    fontSize: '0.86rem',
                  }}
                >
                  {user?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
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
                      minWidth: 210,
                      border: '1px solid',
                      borderColor: 'divider',
                      p: 0.5,
                    },
                  },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <Box sx={{ px: 2, py: 1.5, mb: 0.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                    {user?.username || 'Usuario'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {user?.email}
                  </Typography>
                  {user?.is_superuser && (
                    <Chip
                      label="Súper Admin"
                      size="small"
                      color="primary"
                      sx={{ mt: 0.5, fontWeight: 700, fontSize: '0.65rem', height: 20, borderRadius: '8px', display: 'inline-flex' }}
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
                <MenuItem onClick={handleLogout} sx={{ color: 'error.main', borderRadius: '12px', mx: 0.5 }}>
                  <ListItemIcon><LogoutIcon fontSize="small" color="error" /></ListItemIcon>
                  <ListItemText primary="Cerrar Sesión" slotProps={{ primary: { style: { fontWeight: 700, fontSize: '0.88rem', color: 'inherit' } } }} />
                </MenuItem>
              </Menu>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Desktop Auto-Hide Hover Sidebar */}
      <Drawer
        variant="permanent"
        onMouseEnter={() => setSidebarHovered(true)}
        onMouseLeave={() => setSidebarHovered(false)}
        sx={{
          display: { xs: 'none', md: 'block' },
          width: sidebarPinned ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED_WIDTH,
          flexShrink: 0,
          transition: 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          '& .MuiDrawer-paper': {
            width: desktopSidebarExpanded ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED_WIDTH,
            boxSizing: 'border-box',
            mt: warning ? '98px' : '66px',
            height: warning ? 'calc(100% - 98px)' : 'calc(100% - 66px)',
            borderRight: '1px solid',
            borderColor: 'divider',
            overflowX: 'hidden',
            transition: 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease',
            boxShadow: !sidebarPinned && sidebarHovered ? '16px 0 40px rgba(15, 23, 42, 0.14)' : 'none',
            bgcolor: (theme) =>
              theme.palette.mode === 'dark' ? 'rgba(11, 15, 25, 0.96)' : 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(20px)',
            zIndex: (theme) => theme.zIndex.drawer,
          },
        }}
      >
        {renderSidebarContent(desktopSidebarExpanded)}
      </Drawer>

      {/* Mobile Temporary Sidebar Drawer */}
      <Drawer
        anchor="left"
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        sx={{ display: { xs: 'block', md: 'none' } }}
        slotProps={{
          paper: {
            sx: {
              width: 290,
              pt: 8,
              borderRadius: '0 24px 24px 0',
            },
          },
        }}
      >
        {renderSidebarContent(true)}
      </Drawer>

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minHeight: '100vh',
          mt: { xs: '58px', sm: '66px' },
          px: { xs: 1.5, sm: 3, md: 4 },
          pb: isPOS ? 0 : 8,
          width: {
            xs: '100%',
            md: `calc(100% - ${sidebarPinned ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED_WIDTH}px)`,
          },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          overflowX: 'hidden',
          transition: 'all 0.25s ease',
        }}
      >
        {localStorage.getItem('active_tenant_id') && user?.is_superuser && (
          <Fade in>
            <Box
              sx={{
                width: '100%',
                maxWidth: 1400,
                mt: 2,
                p: 1.5,
                bgcolor: '#fff3e0',
                border: '1px solid #ffe0b2',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 1,
              }}
            >
              <Typography sx={{ fontWeight: 700, color: '#e65100', fontSize: '0.86rem' }}>
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

        {!isPOS && (
          <Box sx={{ mt: 'auto', pt: 6, pb: 4, textAlign: 'center', width: '100%' }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.disabled', fontSize: '0.72rem' }}>
              APEX ERP v2.0 • Elaborado por{' '}
              <Box component="span" sx={{ fontWeight: 800, color: 'primary.main' }}>
                InfaGraSolution
              </Box>{' '}
              • infagrasolution@gmail.com
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
              width: { xs: 48, sm: 54 },
              height: { xs: 48, sm: 54 },
              zIndex: 9999,
              '&:hover': { bgcolor: '#128C7E', transform: 'scale(1.1) rotate(6deg)' },
            }}
          >
            <svg viewBox="0 0 24 24" style={{ width: '55%', height: '55%' }} fill="currentColor">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.5-5.734-1.453L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.963C16.592 1.981 14.119.957 11.487.957c-5.43 0-9.85 4.37-9.855 9.801-.001 1.71.472 3.376 1.367 4.832L2.012 21.6l6.635-1.746z" />
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
              bottom: { xs: 72, sm: 86 },
              right: { xs: 16, sm: 24 },
              background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
              color: 'white',
              boxShadow: '0 8px 30px rgba(220, 39, 67, 0.35)',
              width: { xs: 44, sm: 50 },
              height: { xs: 44, sm: 50 },
              zIndex: 9999,
              '&:hover': { transform: 'scale(1.1) rotate(-6deg)' },
            }}
          >
            <svg viewBox="0 0 24 24" style={{ width: '50%', height: '50%' }} fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
            </svg>
          </IconButton>
        </Tooltip>
      )}

      <SystemWizard />
    </Box>
  );
}
