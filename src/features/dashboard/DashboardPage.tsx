import { useState } from 'react';
import { 
  Box, Typography, Grid, Paper, Dialog, DialogTitle, 
  DialogContent, DialogActions, Button
} from '@mui/material';
import { 
  PointOfSale, Inventory, AccountBalance, Settings, AdminPanelSettings,
  Warehouse, CompareArrows, ViewModule, People, ShoppingCart,
  Assessment, Timeline, LocalShipping, RequestQuote, Receipt, Description,
  AccountBalanceWallet, Business
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
    reqId: 'sales',
    subModules: [
      { id: 'pos', title: 'Punto de Venta (POS)', path: '/sales', icon: PointOfSale },
      { id: 'manual_billing', title: 'Facturación Manual', path: '/sales/manual-billing', icon: Receipt },
      { id: 'budgets', title: 'Presupuestos', path: '/sales/budgets', icon: RequestQuote },
      { id: 'delivery_notes', title: 'Notas de Entrega', path: '/sales/delivery-notes', icon: LocalShipping },
    ]
  },
  { 
    id: 'inventory_group', 
    title: 'Gestión de Inventario', 
    icon: Inventory, 
    color: '#10b981', // Emerald Green
    reqId: 'inventory',
    subModules: [
      { id: 'catalog', title: 'Catálogo de Productos', path: '/catalog', icon: ViewModule },
      { id: 'warehouses', title: 'Almacenes y Ubicaciones', path: '/warehouses', icon: Warehouse },
      { id: 'movements', title: 'Movimientos de Stock', path: '/inventory', icon: CompareArrows },
      { id: 'adjustments', title: 'Ajustes de Inventario', path: '/inventory/adjustments', icon: Assessment },
      { id: 'charges', title: 'Cargos de Inventario', path: '/inventory/charges', icon: CompareArrows },
      { id: 'discharges', title: 'Descargos de Inventario', path: '/inventory/discharges', icon: CompareArrows },
      { id: 'transfers', title: 'Transferencias', path: '/transfers', icon: CompareArrows },
      { id: 'dispatch_notes', title: 'Notas de Despacho', path: '/inventory/dispatch-notes', icon: LocalShipping },
    ]
  },
  { 
    id: 'accounting_group', 
    title: 'Módulo Contable', 
    icon: AccountBalance, 
    color: '#f59e0b', // Amber
    reqId: 'accounting',
    subModules: [
      { id: 'accounts', title: 'Plan de Cuentas', path: '/accounting/accounts', icon: AccountBalance },
      { id: 'journal', title: 'Asientos de Diario', path: '/accounting/journal', icon: Description },
      { id: 'debit_notes', title: 'Notas de Débito', path: '/accounting/debit-notes', icon: Receipt },
    ]
  },
  { 
    id: 'admin_group', 
    title: 'Administrativo', 
    icon: Settings, 
    color: '#64748b', // Slate
    reqId: 'users', // Use users as base requirement
    subModules: [
      { id: 'delivery_notes', title: 'Notas de Entrega', path: '/sales/delivery-notes', icon: LocalShipping },
      { id: 'purchases', title: 'Órdenes de Compra', path: '/purchases', icon: ShoppingCart },
      { id: 'purchases', title: 'Proveedores', path: '/suppliers', icon: Business },
      { id: 'treasury', title: 'Tesorería y Caja', path: '/cash', icon: AccountBalanceWallet },
      { id: 'users', title: 'Usuarios y Permisos', path: '/users', icon: People },
      { id: 'reports', title: 'Reportes y Estadísticas', path: '/reports', icon: Assessment },
      { id: 'settings', title: 'Configuración General', path: '/settings', icon: Settings },
      { id: 'manual', title: 'Manual de Usuario', path: '/manual', icon: Description },
    ]
  },
];


export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, tenant } = useAppStore();
  const [openPosModal, setOpenPosModal] = useState(false);

  const userModulesStr = user?.modules || 'sales,inventory,purchases,accounting,users,settings,reports,treasury';
  
  const { data: alerts = [] } = useQuery({
    queryKey: ['wms-alerts'],
    queryFn: async () => (await api.get('/inventory/alerts')).data,
    enabled: !!user
  });

  const allowedModules = user?.is_superuser 
    ? [...ALL_MODULES, { id: 'admin', title: 'Súper Admin SaaS', path: '/admin', icon: AdminPanelSettings, color: '#1e3a8a', reqId: 'admin' }]
    : ALL_MODULES.filter(m => userModulesStr.includes(m.reqId));

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
      px: { xs: 3, sm: 4, md: 6 },
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
          ? 'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, rgba(99, 102, 241, 0) 70%)'
          : 'radial-gradient(circle, rgba(79, 70, 229, 0.06) 0%, rgba(79, 70, 229, 0) 70%)',
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
          ? 'radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0) 70%)'
          : 'radial-gradient(circle, rgba(16, 185, 129, 0.04) 0%, rgba(16, 185, 129, 0) 70%)',
        zIndex: -1,
        filter: 'blur(80px)',
        pointerEvents: 'none'
      }} />

      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography 
          variant="overline" 
          sx={{ 
            fontWeight: 800, 
            letterSpacing: '2px', 
            color: 'primary.main', 
            display: 'block',
            mb: 1.5,
            textTransform: 'uppercase'
          }}
        >
          Panel de Control
        </Typography>
        <Typography sx={(theme) => ({ 
          fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
          fontWeight: 900, 
          mb: 1.5, 
          letterSpacing: '-1px',
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(135deg, #ffffff 0%, #a5b4fc 50%, #818cf8 100%)' 
            : 'linear-gradient(135deg, #1e293b 0%, #4f46e5 50%, #3b82f6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1.2
        })}>
          Bienvenido a {tenant?.name || 'APEX ERP'}, {user?.username || 'Usuario'}
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500, opacity: 0.8, maxWidth: 600, mx: 'auto' }}>
          Potencia y automatiza la gestión operativa de tu negocio en tiempo real.
        </Typography>
      </Box>

      {/* WMS Alerts Banner */}
      {alerts.length > 0 && (
        <Box sx={{ 
          mb: 5, 
          display: 'flex', 
          gap: 2, 
          overflowX: 'auto', 
          pb: 1.5,
          '&::-webkit-scrollbar': { height: '6px' },
          '&::-webkit-scrollbar-thumb': { borderRadius: '10px', bgcolor: 'rgba(0,0,0,0.1)' }
        }}>
          {alerts.map((alert: any, i: number) => (
            <Paper key={i} sx={{ 
              p: 2.5, 
              minWidth: 320, 
              borderRadius: '16px', 
              borderLeft: '6px solid', 
              borderColor: 'error.main',
              display: 'flex',
              alignItems: 'center',
              gap: 2.5,
              bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.08)' : '#fef2f2',
              color: (theme) => theme.palette.mode === 'dark' ? '#fca5a5' : '#991b1b',
              backdropFilter: 'blur(8px)'
            }}>
              <Timeline color="error" sx={{ fontSize: 28 }} />
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Stock Crítico: {alert.name}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.85 }}>Quedan {alert.current_stock} unidades (Mínimo: {alert.min_stock})</Typography>
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      <Grid container spacing={4} sx={{ justifyContent: 'center' }}>
        {allowedModules.map((mod: any) => {
          const IconComponent = mod.icon;
          const isGrouped = !!mod.subModules;

          return (
            <Grid size={{ xs: 12, sm: 6, md: (isGrouped ? 6 : 3) }} key={mod.id}>
              <Paper
                onClick={() => !isGrouped && handleModuleClick(mod)}
                elevation={0}
                sx={(theme) => ({
                  p: 4,
                  borderRadius: '28px',
                  border: '1px solid',
                  borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: isGrouped ? 'default' : 'pointer',
                  transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(17, 24, 39, 0.4)' : 'rgba(255, 255, 255, 0.65)',
                  backdropFilter: 'blur(20px)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:before': {
                    content: '""',
                    position: 'absolute',
                    top: 0, left: 0, right: 0, height: '5px',
                    backgroundColor: mod.color,
                    borderRadius: '5px 5px 0 0',
                    opacity: 0.95
                  },
                  '&:hover': {
                    transform: isGrouped ? 'none' : 'translateY(-8px)',
                    boxShadow: isGrouped ? 'none' : theme.palette.mode === 'dark'
                      ? `0 30px 50px -15px rgba(0,0,0,0.5), 0 10px 30px -15px ${mod.color}33`
                      : `0 35px 60px -15px rgba(0,0,0,0.06), 0 12px 30px -15px ${mod.color}22`,
                    borderColor: isGrouped ? 'rgba(0,0,0,0.05)' : `${mod.color}88`,
                  }
                })}
              >
                {/* Header Section */}
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  flexDirection: isGrouped ? 'row' : 'column',
                  gap: isGrouped ? 3 : 2,
                  mb: isGrouped ? 4 : 0,
                  flexGrow: isGrouped ? 0 : 1,
                  justifyContent: isGrouped ? 'flex-start' : 'center'
                }}>
                  <Box 
                    sx={{ 
                      bgcolor: `${mod.color}12`, 
                      p: isGrouped ? 2 : 2.5, 
                      borderRadius: '20px', 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: isGrouped ? 0 : 1.5,
                      border: '1px solid',
                      borderColor: `${mod.color}25`,
                      boxShadow: `0 8px 20px -8px ${mod.color}44`
                    }}
                  >
                    <IconComponent sx={{ fontSize: isGrouped ? 36 : 56, color: mod.color }} />
                  </Box>
                  <Typography variant={isGrouped ? "h5" : "h6"} sx={{ fontWeight: 800, textAlign: 'center', letterSpacing: '-0.3px' }}>
                    {mod.title}
                  </Typography>
                </Box>

                {/* Sub-Modules Grid for Groups */}
                {isGrouped && (
                  <Grid container spacing={2} sx={{ mt: 'auto' }}>
                    {mod.subModules.map((sub: any) => {
                      const SubIcon = sub.icon;
                      return (
                        <Grid size={{ xs: 12, sm: 6 }} key={sub.id}>
                          <Button
                            fullWidth
                            variant="outlined"
                            onClick={(e) => { e.stopPropagation(); handleModuleClick(sub); }}
                            startIcon={<SubIcon sx={{ color: mod.color, fontSize: 20 }} />}
                            sx={(theme) => ({ 
                              justifyContent: 'flex-start', 
                              borderRadius: '16px', 
                              borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)',
                              py: 2,
                              px: 2.5,
                              fontWeight: 700,
                              fontSize: '0.875rem',
                              color: 'text.primary',
                              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)',
                              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                              borderWidth: '1px',
                              '&:hover': { 
                                borderColor: mod.color, 
                                bgcolor: `${mod.color}0c`, 
                                color: mod.color,
                                borderWidth: '1px',
                                transform: 'translateX(5px)',
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
          );
        })}
      </Grid>

      {/* POS Welcome Modal */}
      <Dialog 
        open={openPosModal} 
        onClose={() => setOpenPosModal(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: '28px', p: 3, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', backdropFilter: 'blur(20px)' } } }}
      >
        <DialogTitle sx={{ textAlign: 'center', pt: 3 }}>
          <Box sx={{ 
            bgcolor: 'success.light', 
            display: 'inline-flex', 
            p: 2.5, 
            borderRadius: '50%', 
            mb: 2.5, 
            color: 'success.main', 
            opacity: 0.15,
            border: '2px solid rgba(16, 185, 129, 0.2)'
          }}>
            <PointOfSale sx={{ fontSize: 56 }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: '-0.5px' }}>Apertura de Caja</Typography>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', px: 2 }}>
          <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2, fontSize: '1rem', lineHeight: 1.6 }}>
            El usuario <strong>{user?.username || user?.email}</strong> está por abrir el Punto de Venta.
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', p: 1.5, borderRadius: 2 }}>
            Asegúrate de contar el fondo de caja inicial antes de proceder.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', px: 2, pb: 3, pt: 2, gap: 2 }}>
          <Button 
            variant="text" 
            color="inherit" 
            onClick={() => setOpenPosModal(false)}
            sx={{ fontWeight: 700, borderRadius: '12px', py: 1.2 }}
          >
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleConfirmPos}
            sx={{ 
              px: 4, 
              py: 1.5, 
              borderRadius: '12px',
              fontSize: '0.95rem',
              fontWeight: 800
            }}
          >
            Iniciar Sesión
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
