import { useState } from 'react';
import { 
  Box, Typography, Grid, Paper, Dialog, DialogTitle, 
  DialogContent, DialogActions, Button, Fade, Grow, Chip
} from '@mui/material';
import { 
  Inventory, PointOfSale, People, Settings, Assessment, LocalShipping, 
  ShoppingCart, Business, CompareArrows, ViewModule, Receipt, Description,
  Warehouse, AccountBalance, AccountBalanceWallet, Security, AdminPanelSettings,
  Timeline, RequestQuote, Sync, Badge, TrendingUp, Bolt
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axiosConfig';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';

const ALL_MODULES = [
  { 
    id: 'sales_group', 
    title: 'Ventas y Facturación', 
    icon: PointOfSale, 
    color: '#2563eb', // Royal Blue
    gradient: 'linear-gradient(135deg, #2563eb, #3b82f6)',
    reqId: 'sales',
    subModules: [
      { id: 'pos', title: 'Punto de Venta (Caja Rápida)', path: '/sales', icon: PointOfSale },
      { id: 'manual_billing', title: 'Facturación Legal (SENIAT)', path: '/sales/manual-billing', icon: Receipt },
      { id: 'budgets', title: 'Presupuestos / Cotizaciones', path: '/sales/budgets', icon: RequestQuote },
      { id: 'delivery_notes', title: 'Notas de Entrega', path: '/sales/delivery-notes', icon: LocalShipping },
      { id: 'customers', title: 'Clientes y Contactos', path: '/sales/customers', icon: People },
      { id: 'debit_notes', title: 'Notas de Débito', path: '/sales/debit-notes', icon: Receipt },
      { id: 'credit_notes', title: 'Notas de Crédito (Anulaciones)', path: '/sales/credit-notes', icon: Receipt },
    ]
  },
  { 
    id: 'inventory_group', 
    title: 'Gestión de Inventario', 
    icon: Inventory, 
    color: '#10b981', // Emerald Green
    gradient: 'linear-gradient(135deg, #059669, #10b981)',
    reqId: 'inventory',
    subModules: [
      { id: 'catalog', title: 'Catálogo de Productos', path: '/catalog', icon: ViewModule },
      { id: 'warehouses', title: 'Almacenes y Depósitos', path: '/warehouses', icon: Warehouse },
      { id: 'movements', title: 'Kardex y Movimientos', path: '/inventory', icon: CompareArrows },
      { id: 'audits', title: 'Conteo Físico / Auditoría', path: '/inventory/audits', icon: Inventory },
      { id: 'adjustments', title: 'Ajustes de Inventario', path: '/inventory/adjustments', icon: Assessment },
      { id: 'charges', title: 'Cargos (Entradas por Ajuste)', path: '/inventory/charges', icon: CompareArrows },
      { id: 'discharges', title: 'Descargos (Mermas / Pérdidas)', path: '/inventory/discharges', icon: CompareArrows },
      { id: 'transfers', title: 'Transferencias entre Almacenes', path: '/transfers', icon: CompareArrows },
      { id: 'dispatch_notes', title: 'Notas de Despacho', path: '/inventory/dispatch-notes', icon: LocalShipping },
    ]
  },
  { 
    id: 'accounting_group', 
    title: 'Módulo Contable', 
    icon: AccountBalance, 
    color: '#f59e0b', // Amber
    gradient: 'linear-gradient(135deg, #d97706, #f59e0b)',
    reqId: 'accounting',
    subModules: [
      { id: 'accounts', title: 'Plan Único de Cuentas', path: '/accounting/accounts', icon: AccountBalance },
      { id: 'journal', title: 'Libro Diario y Asientos', path: '/accounting/journal', icon: Description },
      { id: 'reconciliation', title: 'Conciliación Bancaria', path: '/accounting/reconciliation', icon: Sync },
    ]
  },
  {
    id: 'treasury_group',
    title: 'Tesorería y Finanzas',
    icon: PointOfSale,
    color: '#8b5cf6', // Violet
    gradient: 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
    reqId: 'treasury',
    subModules: [
      { id: 'cxc', title: 'Cuentas por Cobrar (Clientes)', path: '/ar', icon: AccountBalanceWallet },
      { id: 'cxp', title: 'Cuentas por Pagar (Proveedores)', path: '/ap', icon: PointOfSale },
      { id: 'bank_accounts', title: 'Cuentas Bancarias (VES / USD)', path: '/treasury/bank-accounts', icon: AccountBalance },
      { id: 'cash', title: 'Caja Chica y Arqueo Diario', path: '/cash', icon: AccountBalanceWallet },
    ]
  },
  {
    id: 'payroll_group',
    title: 'Nómina y Gestión Humana (LOTTT)',
    icon: Badge,
    color: '#ec4899', // Pink / Rose
    gradient: 'linear-gradient(135deg, #db2777, #ec4899)',
    reqId: 'payroll',
    subModules: [
      { id: 'employees', title: 'Ficha de Trabajadores', path: '/payroll', icon: People },
      { id: 'payroll_periods', title: 'Cálculo de Nómina y Leyes (IVSS/FAOV)', path: '/payroll', icon: Badge },
    ]
  },
  { 
    id: 'admin_group', 
    title: 'Administración y Sistema', 
    icon: Settings, 
    color: '#64748b', // Slate
    gradient: 'linear-gradient(135deg, #475569, #64748b)',
    reqId: 'users',
    subModules: [
      { id: 'payroll', title: 'Nómina y RRHH (LOTTT)', path: '/payroll', icon: Badge },
      { id: 'delivery_notes', title: 'Notas de Entrega', path: '/sales/delivery-notes', icon: LocalShipping },
      { id: 'customers', title: 'Directorio de Clientes', path: '/sales/customers', icon: People },
      { id: 'purchases', title: 'Órdenes de Compra', path: '/purchases', icon: ShoppingCart },
      { id: 'suppliers', title: 'Directorio de Proveedores', path: '/suppliers', icon: Business },
      { id: 'treasury', title: 'Caja y Movimientos', path: '/cash', icon: AccountBalanceWallet },
      { id: 'users', title: 'Usuarios y Accesos', path: '/users', icon: People },
      { id: 'roles', title: 'Roles y Permisos', path: '/roles', icon: Security },
      { id: 'reports', title: 'Reportes y Estadísticas', path: '/reports', icon: Assessment },
      { id: 'settings', title: 'Configuración de la Empresa', path: '/settings', icon: Settings },
      { id: 'manual', title: 'Manual de Ayuda y SENIAT', path: '/manual', icon: Description },
    ]
  },
];


export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, tenant, hasModule } = useAppStore();
  const [openPosModal, setOpenPosModal] = useState(false);

  const { data: alerts = [] } = useQuery({
    queryKey: ['wms-alerts'],
    queryFn: async () => (await api.get('/inventory/alerts')).data,
    enabled: !!user
  });

  // Módulos visibles en el Dashboard según la licencia activa del tenant (o todos si es superusuario)
  const allowedModules = user?.is_superuser 
    ? [...ALL_MODULES, { id: 'admin', title: 'Súper Admin SaaS', path: '/admin', icon: AdminPanelSettings, color: '#1e3a8a', gradient: 'linear-gradient(135deg, #1e3a8a, #3b82f6)', reqId: 'admin' }]
    : ALL_MODULES.filter(m => {
        // Mapeo entre reqId del dashboard y las claves de licencia
        const licenseKey = m.reqId === 'users' ? 'admin' : (m.reqId === 'payroll' ? 'hr' : m.reqId);
        return hasModule(licenseKey as any);
      });

  const handleModuleClick = (module: any) => {
    if (module.id === 'pos') {
      setOpenPosModal(true);
    } else if (module.path) {
      navigate(module.path);
    }
  };

  const handleConfirmPos = () => {
    setOpenPosModal(false);
    navigate('/sales');
  };

  return (
    <Box sx={{ 
      width: '100%',
      maxWidth: 1400, 
      mx: 'auto', 
      mt: 2, 
      minHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      px: { xs: 2, sm: 4, md: 6 },
      py: 3,
      position: 'relative'
    }}>
      {/* Background Glow Blobs for depth */}
      <Box sx={{
        position: 'fixed',
        top: '-10%',
        right: '-10%',
        width: '50vw',
        height: '50vw',
        background: (theme) => theme.palette.mode === 'dark' 
          ? 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)'
          : 'radial-gradient(circle, rgba(37, 99, 235, 0.04) 0%, transparent 70%)',
        zIndex: -1,
        filter: 'blur(100px)',
        pointerEvents: 'none'
      }} />
      <Box sx={{
        position: 'fixed',
        bottom: '-10%',
        left: '-10%',
        width: '40vw',
        height: '40vw',
        background: (theme) => theme.palette.mode === 'dark'
          ? 'radial-gradient(circle, rgba(16, 185, 129, 0.07) 0%, transparent 70%)'
          : 'radial-gradient(circle, rgba(16, 185, 129, 0.03) 0%, transparent 70%)',
        zIndex: -1,
        filter: 'blur(80px)',
        pointerEvents: 'none'
      }} />

      {/* Hero Header */}
      <Fade in timeout={600}>
        <Box sx={{ textAlign: 'center', mb: { xs: 4, sm: 6 } }}>
          <Chip 
            icon={<Bolt sx={{ fontSize: 16 }} />}
            label="Panel de Control" 
            size="small"
            sx={{ 
              mb: 2.5,
              fontWeight: 800, 
              letterSpacing: '1px', 
              textTransform: 'uppercase',
              fontSize: '0.72rem',
              bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(37, 99, 235, 0.06)',
              color: 'primary.main',
              borderRadius: '12px',
              border: '1px solid',
              borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(37, 99, 235, 0.12)',
              px: 1.5,
            }}
          />
          <Typography sx={(theme) => ({ 
            fontSize: { xs: '1.8rem', sm: '2.5rem', md: '3rem' },
            fontWeight: 900, 
            mb: 1.5, 
            letterSpacing: '-1.5px',
            background: theme.palette.mode === 'dark' 
              ? 'linear-gradient(135deg, #ffffff 0%, #a5b4fc 50%, #818cf8 100%)' 
              : 'linear-gradient(135deg, #0f172a 0%, #1e40af 40%, #2563eb 70%, #3b82f6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: 1.15
          })}>
            Bienvenido a {tenant?.name || 'APEX ERP'}, {user?.username || 'Usuario'}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ 
            fontWeight: 500, 
            opacity: 0.75, 
            maxWidth: 550, 
            mx: 'auto',
            fontSize: { xs: '0.9rem', sm: '1rem' },
            lineHeight: 1.6
          }}>
            Potencia y automatiza la gestión operativa de tu negocio en tiempo real.
          </Typography>
        </Box>
      </Fade>

      {/* WMS Alerts Banner */}
      {alerts.length > 0 && (
        <Fade in timeout={800}>
          <Box sx={{ 
            mb: 5, 
            display: 'flex', 
            gap: 2, 
            overflowX: 'auto', 
            pb: 1.5,
            '&::-webkit-scrollbar': { height: '6px' },
            '&::-webkit-scrollbar-thumb': { borderRadius: '10px', bgcolor: 'rgba(0,0,0,0.08)' }
          }}>
            {alerts.map((alert: any, i: number) => (
              <Paper key={i} elevation={0} sx={{ 
                p: 2.5, 
                minWidth: 320, 
                borderRadius: '18px', 
                borderLeft: '5px solid', 
                borderColor: 'error.main',
                display: 'flex',
                alignItems: 'center',
                gap: 2.5,
                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.06)' : 'rgba(254, 242, 242, 0.9)',
                color: (theme) => theme.palette.mode === 'dark' ? '#fca5a5' : '#991b1b',
                backdropFilter: 'blur(12px)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 20px rgba(239, 68, 68, 0.1)',
                }
              }}>
                <Timeline color="error" sx={{ fontSize: 28 }} />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Stock Crítico: {alert.name}</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.85 }}>Quedan {alert.current_stock} unidades (Mínimo: {alert.min_stock})</Typography>
                </Box>
              </Paper>
            ))}
          </Box>
        </Fade>
      )}

      <Grid container spacing={{ xs: 2.5, sm: 3.5 }} sx={{ justifyContent: 'center' }}>
        {allowedModules.map((mod: any, index: number) => {
          const IconComponent = mod.icon;
          const isGrouped = !!mod.subModules;

          return (
            <Grow in timeout={400 + index * 100} key={mod.id}>
              <Grid size={{ xs: 12, sm: 6, md: (isGrouped ? 6 : 3) }}>
                <Paper
                  onClick={() => !isGrouped && handleModuleClick(mod)}
                  elevation={0}
                  sx={(theme) => ({
                    p: { xs: 3, sm: 4 },
                    borderRadius: '24px',
                    border: '1px solid',
                    borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: isGrouped ? 'default' : 'pointer',
                    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(17, 24, 39, 0.35)' : 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(20px)',
                    position: 'relative',
                    overflow: 'hidden',
                    // Top accent gradient
                    '&:before': {
                      content: '""',
                      position: 'absolute',
                      top: 0, left: 0, right: 0, height: '4px',
                      background: mod.gradient || mod.color,
                      borderRadius: '4px 4px 0 0',
                      opacity: 0.85,
                      transition: 'opacity 0.3s ease',
                    },
                    // Subtle glow behind
                    '&:after': isGrouped ? {} : {
                      content: '""',
                      position: 'absolute',
                      bottom: '-50%', left: '50%',
                      transform: 'translateX(-50%)',
                      width: '80%', height: '50%',
                      background: `radial-gradient(ellipse, ${mod.color}08, transparent)`,
                      pointerEvents: 'none',
                      transition: 'all 0.4s ease',
                    },
                    '&:hover': {
                      transform: isGrouped ? 'none' : 'translateY(-8px)',
                      boxShadow: isGrouped ? 'none' : theme.palette.mode === 'dark'
                        ? `0 30px 60px -15px rgba(0,0,0,0.5), 0 0 30px -10px ${mod.color}22`
                        : `0 30px 60px -15px rgba(0,0,0,0.06), 0 0 30px -10px ${mod.color}15`,
                      borderColor: isGrouped ? theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' : `${mod.color}55`,
                      '&:before': {
                        opacity: 1,
                      },
                      '&:after': isGrouped ? {} : {
                        opacity: 1,
                        width: '120%',
                        background: `radial-gradient(ellipse, ${mod.color}12, transparent)`,
                      }
                    }
                  })}
                >
                  {/* Header Section */}
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    flexDirection: isGrouped ? 'row' : 'column',
                    gap: isGrouped ? 2.5 : 2,
                    mb: isGrouped ? 3.5 : 0,
                    flexGrow: isGrouped ? 0 : 1,
                    justifyContent: isGrouped ? 'flex-start' : 'center'
                  }}>
                    <Box 
                      sx={{ 
                        background: `${mod.color}0a`,
                        p: isGrouped ? 1.8 : 2.5, 
                        borderRadius: '18px', 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: isGrouped ? 0 : 1,
                        border: '1px solid',
                        borderColor: `${mod.color}18`,
                        boxShadow: `0 6px 16px -6px ${mod.color}30`,
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <IconComponent sx={{ fontSize: isGrouped ? 32 : 48, color: mod.color }} />
                    </Box>
                    <Box>
                      <Typography variant={isGrouped ? "h6" : "subtitle1"} sx={{ 
                        fontWeight: 800, 
                        textAlign: isGrouped ? 'left' : 'center', 
                        letterSpacing: '-0.3px',
                        fontSize: isGrouped ? { xs: '1rem', sm: '1.15rem' } : '0.95rem',
                      }}>
                        {mod.title}
                      </Typography>
                      {isGrouped && (
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, opacity: 0.7 }}>
                          {mod.subModules.length} funciones disponibles
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  {/* Sub-Modules Grid for Groups */}
                  {isGrouped && (
                    <Grid container spacing={1.5} sx={{ mt: 'auto' }}>
                      {mod.subModules.map((sub: any) => {
                        const SubIcon = sub.icon;
                        return (
                          <Grid size={{ xs: 12, sm: 6 }} key={sub.id + sub.title}>
                            <Button
                              fullWidth
                              variant="outlined"
                              onClick={(e) => { e.stopPropagation(); handleModuleClick(sub); }}
                              startIcon={<SubIcon sx={{ color: mod.color, fontSize: 18 }} />}
                              sx={(theme) => ({ 
                                justifyContent: 'flex-start', 
                                borderRadius: '14px', 
                                borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)',
                                py: 1.8,
                                px: 2,
                                fontWeight: 700,
                                fontSize: '0.84rem',
                                color: 'text.primary',
                                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.005)',
                                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                                borderWidth: '1px',
                                textAlign: 'left',
                                lineHeight: 1.3,
                                '&:hover': { 
                                  borderColor: `${mod.color}80`, 
                                  bgcolor: `${mod.color}08`, 
                                  color: mod.color,
                                  borderWidth: '1px',
                                  transform: 'translateX(4px)',
                                  boxShadow: `0 4px 12px -4px ${mod.color}15`,
                                }
                              })}
                            >
                              {sub.title}
                            </Button>
                          </Grid>
                        );
                      })}
                    </Grid>
                  )}
                </Paper>
              </Grid>
            </Grow>
          );
        })}
      </Grid>

      {/* POS Welcome Modal */}
      <Dialog 
        open={openPosModal} 
        onClose={() => setOpenPosModal(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { 
          borderRadius: '28px', 
          p: 3, 
          boxShadow: '0 30px 60px -12px rgba(0,0,0,0.25)', 
          backdropFilter: 'blur(24px)',
          border: '1px solid',
          borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
        } } }}
      >
        <DialogTitle sx={{ textAlign: 'center', pt: 3 }}>
          <Box sx={{ 
            bgcolor: 'rgba(16, 185, 129, 0.08)', 
            display: 'inline-flex', 
            p: 2.5, 
            borderRadius: '50%', 
            mb: 2.5, 
            color: 'success.main', 
            border: '2px solid rgba(16, 185, 129, 0.15)',
            boxShadow: '0 8px 20px rgba(16, 185, 129, 0.15)',
          }}>
            <PointOfSale sx={{ fontSize: 48 }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: '-0.5px' }}>Apertura de Caja</Typography>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', px: 2 }}>
          <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2, fontSize: '1rem', lineHeight: 1.6 }}>
            El usuario <strong>{user?.username || user?.email}</strong> está por abrir el Punto de Venta.
          </Typography>
          <Typography variant="body2" sx={{ 
            color: 'text.secondary', 
            fontStyle: 'italic', 
            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', 
            p: 1.5, 
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
          }}>
            Asegúrate de contar el fondo de caja inicial antes de proceder.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', px: 2, pb: 3, pt: 2, gap: 2 }}>
          <Button 
            variant="text" 
            color="inherit" 
            onClick={() => setOpenPosModal(false)}
            sx={{ fontWeight: 700, borderRadius: '14px', py: 1.2, px: 3 }}
          >
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleConfirmPos}
            startIcon={<TrendingUp />}
            sx={{ 
              px: 4, 
              py: 1.5, 
              borderRadius: '14px',
              fontSize: '0.95rem',
              fontWeight: 800,
              boxShadow: '0 8px 20px rgba(37, 99, 235, 0.3)',
            }}
          >
            Iniciar Sesión POS
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
