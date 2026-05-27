import { useState } from 'react';
import { 
  Box, Typography, Grid, Paper, Dialog, DialogTitle, 
  DialogContent, DialogActions, Button
} from '@mui/material';
import { 
  PointOfSale, Inventory, AccountBalance, Settings, AdminPanelSettings,
  Warehouse, CompareArrows, ViewModule, People, ShoppingCart,
  Assessment, Timeline, LocalShipping, RequestQuote, Receipt, Description,
  AccountBalanceWallet
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
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
      { id: 'purchases', title: 'Compras y Proveedores', path: '/purchases', icon: ShoppingCart },
      { id: 'treasury', title: 'Tesorería y Caja', path: '/cash', icon: AccountBalanceWallet },
      { id: 'users', title: 'Usuarios y Permisos', path: '/users', icon: People },
      { id: 'reports', title: 'Reportes y Estadísticas', path: '/reports', icon: Assessment },
      { id: 'settings', title: 'Configuración General', path: '/settings', icon: Settings },
    ]
  },
];

export default function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAppStore();
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
      maxWidth: 1400, 
      mx: 'auto', 
      mt: 2, 
      minHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center'
    }}>
      <Box sx={{ textAlign: 'center', mb: 8 }}>
        <Typography variant="h2" sx={{ 
          fontWeight: 900, 
          mb: 1.5, 
          letterSpacing: '-2px',
          background: 'linear-gradient(135deg, #0f172a 0%, #2563eb 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          {t('Welcome back')}, {user?.username || 'Usuario'}
        </Typography>
        <Typography variant="h5" color="text.secondary" sx={{ fontWeight: 500, opacity: 0.8 }}>
          Potencia tu negocio con NEXUS ERP
        </Typography>
      </Box>

      {/* WMS Alerts Banner */}
      {alerts.length > 0 && (
        <Box sx={{ mb: 4, display: 'flex', gap: 2, overflowX: 'auto', pb: 1 }}>
          {alerts.map((alert: any, i: number) => (
            <Paper key={i} sx={{ 
              p: 2, 
              minWidth: 300, 
              borderRadius: 3, 
              borderLeft: '6px solid', 
              borderColor: 'error.main',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              bgcolor: 'error.50'
            }}>
              <Timeline color="error" />
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Stock Crítico: {alert.name}</Typography>
                <Typography variant="caption">Quedan {alert.current_stock} unidades (Min: {alert.min_stock})</Typography>
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      <Grid container spacing={3} sx={{ justifyContent: 'center' }}>
        {allowedModules.map((mod: any) => {
          const IconComponent = mod.icon;
          const isGrouped = !!mod.subModules;

          return (
            <Grid size={{ xs: 12, sm: 6, md: (isGrouped ? 6 : 3) }} key={mod.id}>
              <Paper
                onClick={() => !isGrouped && handleModuleClick(mod)}
                elevation={0}
                sx={{
                  p: 4,
                  borderRadius: '24px',
                  border: '1px solid',
                  borderColor: 'divider',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: isGrouped ? 'default' : 'pointer',
                  transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  backgroundColor: 'rgba(255, 255, 255, 0.7)',
                  backdropFilter: 'blur(10px)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:before': {
                    content: '""',
                    position: 'absolute',
                    top: 0, left: 0, right: 0, height: '4px',
                    backgroundColor: mod.color,
                    opacity: 0.8
                  },
                  '&:hover': {
                    transform: isGrouped ? 'none' : 'translateY(-10px)',
                    boxShadow: isGrouped ? 'none' : `0 30px 60px -12px rgba(0,0,0,0.1), 0 18px 36px -18px ${mod.color}44`,
                    borderColor: isGrouped ? 'divider' : mod.color,
                  }
                }}
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
                      bgcolor: `${mod.color}10`, 
                      p: isGrouped ? 2 : 3, 
                      borderRadius: '20px', 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: isGrouped ? 0 : 1,
                      border: '1px solid',
                      borderColor: `${mod.color}20`
                    }}
                  >
                    <IconComponent sx={{ fontSize: isGrouped ? 40 : 64, color: mod.color }} />
                  </Box>
                  <Typography variant={isGrouped ? "h4" : "h5"} sx={{ fontWeight: 800, textAlign: 'center' }}>
                    {mod.title}
                  </Typography>
                </Box>

                {/* Sub-Modules Grid for Groups */}
                {isGrouped && (
                  <Grid container spacing={1.5} sx={{ mt: 'auto' }}>
                    {mod.subModules.map((sub: any) => {
                      const SubIcon = sub.icon;
                      return (
                        <Grid size={{ xs: 12, sm: 6 }} key={sub.id}>
                          <Button
                            fullWidth
                            variant="outlined"
                            onClick={(e) => { e.stopPropagation(); handleModuleClick(sub); }}
                            startIcon={<SubIcon sx={{ color: mod.color }} />}
                            sx={{ 
                              justifyContent: 'flex-start', 
                              borderRadius: '14px', 
                              borderColor: 'rgba(0,0,0,0.05)',
                              py: 1.8,
                              px: 2.5,
                              fontWeight: 700,
                              fontSize: '0.9rem',
                              color: 'text.primary',
                              bgcolor: 'rgba(0,0,0,0.02)',
                              '&:hover': { 
                                borderColor: mod.color, 
                                bgcolor: `${mod.color}05`, 
                                color: mod.color,
                                transform: 'translateX(4px)',
                              }
                            }}
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
        slotProps={{ paper: { sx: { borderRadius: '24px', p: 2, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' } } }}
      >
        <DialogTitle sx={{ textAlign: 'center', pt: 4 }}>
          <Box sx={{ bgcolor: 'success.light', display: 'inline-flex', p: 2, borderRadius: '50%', mb: 2, color: 'success.main', opacity: 0.2 }}>
            <PointOfSale sx={{ fontSize: 64 }} />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>Apertura de Caja</Typography>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center' }}>
          <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2, fontSize: '1.1rem' }}>
            El usuario <strong>{user?.username || user?.email}</strong> está por abrir el Punto de Venta.
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
            Asegúrate de contar el fondo de caja inicial antes de proceder.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', px: 4, pb: 5, pt: 2, gap: 2 }}>
          <Button 
            variant="text" 
            color="inherit" 
            onClick={() => setOpenPosModal(false)}
            sx={{ fontWeight: 700 }}
          >
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleConfirmPos}
            sx={{ 
              px: 5, 
              py: 1.5, 
              fontSize: '1rem',
              boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.4)'
            }}
          >
            Iniciar Sesión
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
