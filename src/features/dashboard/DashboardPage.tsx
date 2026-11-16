import { useState } from 'react';
import { 
  Box, Typography, Grid, Paper, Dialog, DialogTitle, 
  DialogContent, DialogActions, Button, Fade, Grow, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, ToggleButtonGroup, ToggleButton
} from '@mui/material';
import { 
  Inventory2Rounded as Inventory,
  PointOfSaleRounded as PointOfSale,
  PeopleAltRounded as People,
  SettingsSuggestRounded as Settings,
  InsightsRounded as Assessment,
  LocalShippingRounded as LocalShipping, 
  ShoppingCartCheckoutRounded as ShoppingCart,
  DomainRounded as Business,
  SwapHorizRounded as CompareArrows,
  GridViewRounded as ViewModule,
  ReceiptLongRounded as Receipt,
  MenuBookRounded as Description,
  WarehouseRounded as Warehouse,
  AccountBalanceRounded as AccountBalance,
  AccountBalanceWalletRounded as AccountBalanceWallet,
  ShieldRounded as Security,
  AdminPanelSettingsRounded as AdminPanelSettings,
  NotificationsActiveRounded as Timeline,
  RequestQuoteRounded as RequestQuote,
  CurrencyExchangeRounded as Sync,
  BadgeRounded as Badge,
  TrendingUpRounded as TrendingUp,
  BoltRounded as Bolt,
  FactCheckRounded as FactCheck,
  TuneRounded as Tune,
  AddBoxRounded as AddBox,
  IndeterminateCheckBoxRounded as IndeterminateBox,
  AssignmentReturnRounded as CreditNoteIcon,
  PostAddRounded as DebitNoteIcon,
  CalculateRounded as PayrollCalcIcon,
  HelpCenterRounded as HelpIcon,
  PaidRounded as PaidIcon,
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
      { id: 'debit_notes', title: 'Notas de Débito', path: '/sales/debit-notes', icon: DebitNoteIcon },
      { id: 'credit_notes', title: 'Notas de Crédito (Anulaciones)', path: '/sales/credit-notes', icon: CreditNoteIcon },
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
      { id: 'warehouses', title: 'Almacenes y Stock Mínimo', path: '/warehouses', icon: Warehouse },
      { id: 'movements', title: 'Kardex y Movimientos', path: '/inventory', icon: CompareArrows },
      { id: 'audits', title: 'Conteo Físico / Auditoría', path: '/inventory/audits', icon: FactCheck },
      { id: 'adjustments', title: 'Ajustes de Inventario', path: '/inventory/adjustments', icon: Tune },
      { id: 'charges', title: 'Cargos (Entradas por Ajuste)', path: '/inventory/charges', icon: AddBox },
      { id: 'discharges', title: 'Descargos (Mermas / Pérdidas)', path: '/inventory/discharges', icon: IndeterminateBox },
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
    icon: AccountBalanceWallet,
    color: '#8b5cf6', // Violet
    gradient: 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
    reqId: 'treasury',
    subModules: [
      { id: 'cxc', title: 'Cuentas por Cobrar (Clientes)', path: '/ar', icon: PaidIcon },
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
      { id: 'payroll_periods', title: 'Cálculo de Nómina y Leyes (IVSS/FAOV)', path: '/payroll', icon: PayrollCalcIcon },
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
      { id: 'manual', title: 'Manual de Ayuda y SENIAT', path: '/manual', icon: HelpIcon },
    ]
  },
];


export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, tenant, hasModule } = useAppStore();
  const [openPosModal, setOpenPosModal] = useState(false);
  const [livePeriod, setLivePeriod] = useState<'today' | 'week' | 'month' | 'all'>('month');

  const { data: alerts = [] } = useQuery({
    queryKey: ['wms-alerts'],
    queryFn: async () => (await api.get('/inventory/alerts')).data,
    enabled: !!user,
    refetchInterval: 15000,
  });

  const { data: summary } = useQuery({
    queryKey: ['dashboard-live-summary', livePeriod],
    queryFn: async () => (await api.get(`/dashboard/summary?period=${livePeriod}`)).data,
    enabled: !!user,
    refetchInterval: 10000,
  });

  const { data: liveMovements = [] } = useQuery({
    queryKey: ['dashboard-live-movements'],
    queryFn: async () => (await api.get('/movements/?limit=8')).data,
    enabled: !!user,
    refetchInterval: 10000,
  });

  const allowedModules = user?.is_superuser 
    ? [...ALL_MODULES, { id: 'admin', title: 'Súper Admin SaaS', path: '/admin', icon: AdminPanelSettings, color: '#1e3a8a', gradient: 'linear-gradient(135deg, #1e3a8a, #3b82f6)', reqId: 'admin' }]
    : ALL_MODULES.filter(m => {
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
      mt: { xs: 1, sm: 2 }, 
      minHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      px: { xs: 0.5, sm: 2, md: 4 },
      py: { xs: 2, sm: 3 },
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
        <Box sx={{ textAlign: 'center', mb: { xs: 3, sm: 5 } }}>
          <Chip 
            icon={<Bolt sx={{ fontSize: 16 }} />}
            label="Panel de Control Inteligente" 
            size="small"
            sx={{ 
              mb: 2,
              fontWeight: 800, 
              letterSpacing: '1px', 
              textTransform: 'uppercase',
              fontSize: '0.7rem',
              bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.12)' : 'rgba(37, 99, 235, 0.06)',
              color: 'primary.main',
              borderRadius: '12px',
              border: '1px solid',
              borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.22)' : 'rgba(37, 99, 235, 0.14)',
              px: 1.5,
            }}
          />
          <Typography sx={(theme) => ({ 
            fontSize: { xs: '1.65rem', sm: '2.35rem', md: '2.85rem' },
            fontWeight: 900, 
            mb: 1, 
            letterSpacing: '-1.2px',
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
            opacity: 0.78, 
            maxWidth: 580, 
            mx: 'auto',
            fontSize: { xs: '0.88rem', sm: '1rem' },
            lineHeight: 1.6
          }}>
            Potencia y automatiza la gestión fiscal, operativa y financiera de tu empresa en tiempo real.
          </Typography>
        </Box>
      </Fade>

      {/* WMS Alerts Banner */}
      {alerts.length > 0 && (
        <Fade in timeout={800}>
          <Box sx={{ 
            mb: 4, 
            display: 'flex', 
            gap: 2, 
            overflowX: 'auto', 
            pb: 1.5,
            '&::-webkit-scrollbar': { height: '6px' },
            '&::-webkit-scrollbar-thumb': { borderRadius: '10px', bgcolor: 'rgba(0,0,0,0.08)' }
          }}>
            {alerts.map((alert: any, i: number) => (
              <Paper key={i} elevation={0} sx={{ 
                p: 2.2, 
                minWidth: { xs: 295, sm: 360 }, 
                borderRadius: '18px', 
                borderLeft: '5px solid', 
                borderColor: 'error.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(254, 242, 242, 0.95)',
                color: (theme) => theme.palette.mode === 'dark' ? '#fca5a5' : '#991b1b',
                backdropFilter: 'blur(12px)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 20px rgba(239, 68, 68, 0.1)',
                }
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.8 }}>
                  <Timeline color="error" sx={{ fontSize: 28, flexShrink: 0 }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                      🚨 {alert.name} ({alert.warehouse_name || 'Almacén'})
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', fontWeight: 800 }}>
                      ⚠️ ¡El producto está próximo a agotarse, debes reponer!
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.9 }}>
                      Quedan <strong>{alert.current_stock}</strong> unid. (Stock Mínimo: <strong>{alert.min_stock}</strong>)
                    </Typography>
                  </Box>
                </Box>
                <Button
                  size="small"
                  variant="contained"
                  color="error"
                  onClick={() => navigate('/purchases')}
                  sx={{ borderRadius: '10px', fontWeight: 800, textTransform: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}
                >
                  Reponer
                </Button>
              </Paper>
            ))}
          </Box>
        </Fade>
      )}

      {/* ── MONITOR EJECUTIVO EN VIVO (VENTAS Y MOVIMIENTOS EN TIEMPO REAL) ── */}
      <Fade in timeout={700}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 3.5 },
            mb: 4,
            borderRadius: '24px',
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(17, 24, 39, 0.55)' : 'rgba(255, 255, 255, 0.9)'),
            backdropFilter: 'blur(16px)',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 11,
                  height: 11,
                  borderRadius: '50%',
                  bgcolor: '#10b981',
                  boxShadow: '0 0 12px #10b981',
                  flexShrink: 0,
                }}
              />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.15 }}>
                  Monitor Ejecutivo en Vivo — {tenant?.name || 'Mi Empresa'}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Actualización automática en tiempo real de ventas, cobranzas, inventario y auditoría por usuario/IP
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, flexWrap: 'wrap', width: { xs: '100%', md: 'auto' }, justifyContent: { xs: 'space-between', md: 'flex-end' } }}>
              <ToggleButtonGroup
                size="small"
                exclusive
                value={livePeriod}
                onChange={(_, val) => val && setLivePeriod(val)}
              >
                <ToggleButton value="today" sx={{ fontWeight: 700, fontSize: '0.73rem', px: { xs: 1.1, sm: 1.5 } }}>Hoy</ToggleButton>
                <ToggleButton value="week" sx={{ fontWeight: 700, fontSize: '0.73rem', px: { xs: 1.1, sm: 1.5 } }}>7 Días</ToggleButton>
                <ToggleButton value="month" sx={{ fontWeight: 700, fontSize: '0.73rem', px: { xs: 1.1, sm: 1.5 } }}>Mes</ToggleButton>
                <ToggleButton value="all" sx={{ fontWeight: 700, fontSize: '0.73rem', px: { xs: 1.1, sm: 1.5 } }}>Histórico</ToggleButton>
              </ToggleButtonGroup>

              <Button
                size="small"
                variant="outlined"
                onClick={() => navigate('/reports')}
                startIcon={<Assessment fontSize="small" />}
                sx={{ borderRadius: '10px', fontWeight: 800, textTransform: 'none' }}
              >
                Ver Todos los Reportes y Movimientos
              </Button>
            </Box>
          </Box>

          {/* KPIs en Vivo */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper elevation={0} sx={{ p: 2.2, borderRadius: '18px', bgcolor: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.22)', display: 'flex', alignItems: 'center', gap: 1.8 }}>
                <Box sx={{ p: 1.3, borderRadius: '14px', bgcolor: 'rgba(16, 185, 129, 0.16)', color: '#059669', display: 'flex' }}>
                  <PointOfSale />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#059669', textTransform: 'uppercase', display: 'block' }}>
                    Ventas ({summary?.total_orders || 0} Facturas)
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: '#047857', mt: 0.2 }}>
                    ${Number(summary?.total_sales || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper elevation={0} sx={{ p: 2.2, borderRadius: '18px', bgcolor: 'rgba(37, 99, 235, 0.08)', border: '1px solid rgba(37, 99, 235, 0.22)', display: 'flex', alignItems: 'center', gap: 1.8 }}>
                <Box sx={{ p: 1.3, borderRadius: '14px', bgcolor: 'rgba(37, 99, 235, 0.16)', color: '#2563eb', display: 'flex' }}>
                  <PaidIcon />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', display: 'block' }}>
                    Cuentas por Cobrar (CxC)
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: '#1d4ed8', mt: 0.2 }}>
                    ${Number(summary?.ar_open || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper elevation={0} sx={{ p: 2.2, borderRadius: '18px', bgcolor: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.22)', display: 'flex', alignItems: 'center', gap: 1.8 }}>
                <Box sx={{ p: 1.3, borderRadius: '14px', bgcolor: 'rgba(245, 158, 11, 0.16)', color: '#d97706', display: 'flex' }}>
                  <AccountBalanceWallet />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#d97706', textTransform: 'uppercase', display: 'block' }}>
                    Cuentas por Pagar (CxP)
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: '#b45309', mt: 0.2 }}>
                    ${Number(summary?.ap_open || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper elevation={0} sx={{ p: 2.2, borderRadius: '18px', bgcolor: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.22)', display: 'flex', alignItems: 'center', gap: 1.8 }}>
                <Box sx={{ p: 1.3, borderRadius: '14px', bgcolor: 'rgba(139, 92, 246, 0.16)', color: '#7c3aed', display: 'flex' }}>
                  <Inventory />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', display: 'block' }}>
                    Catálogo Activo / Compras
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: '#6d28d9', mt: 0.2 }}>
                    {summary?.active_products || 0} Ítems | ${Number(summary?.total_purchases || 0).toFixed(2)}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* Feed de Movimientos en Vivo */}
          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingUp fontSize="small" color="primary" /> Últimos Movimientos y Operaciones en Tiempo Real
          </Typography>
          <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '14px', maxHeight: 250 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem' }}>Fecha / Hora</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem' }}>Módulo</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem' }}>Operación</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem' }}>Descripción del Movimiento</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem' }} align="right">Monto / Cant.</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem' }}>Usuario</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem' }}>IP Origen</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {liveMovements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                      <Typography variant="caption" color="text.secondary">
                        Aún no hay movimientos recientes. Las ventas, compras y ajustes aparecerán aquí en vivo.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  liveMovements.map((m: any) => (
                    <TableRow key={m.id} hover>
                      <TableCell sx={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                        {new Date(m.created_at).toLocaleString('es-VE')}
                      </TableCell>
                      <TableCell>
                        <Chip label={m.module} size="small" variant="outlined" sx={{ fontWeight: 800, fontSize: '0.68rem', height: 20 }} />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={m.operation}
                          size="small"
                          color={m.operation === 'SALE' || m.operation === 'CHARGE' ? 'success' : m.operation === 'DISCHARGE' ? 'error' : 'primary'}
                          sx={{ fontWeight: 800, fontSize: '0.68rem', height: 20 }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.78rem', fontWeight: 600, minWidth: 200 }}>{m.description}</TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.78rem', fontWeight: 800, whiteSpace: 'nowrap' }}>
                        {m.amount ? `$${Number(m.amount).toFixed(2)}` : m.quantity ? `${m.quantity} ${m.unit || 'und'}` : '—'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap' }}>{m.user_name || 'Admin'}</TableCell>
                      <TableCell sx={{ fontSize: '0.72rem', fontFamily: 'monospace', color: 'text.secondary', whiteSpace: 'nowrap' }}>
                        {m.ip_address || 'Local'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Fade>

      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ justifyContent: 'center' }}>
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
                    p: { xs: 2.5, sm: 3.5 },
                    borderRadius: '24px',
                    border: '1px solid',
                    borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: isGrouped ? 'default' : 'pointer',
                    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(17, 24, 39, 0.35)' : 'rgba(255, 255, 255, 0.78)',
                    backdropFilter: 'blur(20px)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:before': {
                      content: '""',
                      position: 'absolute',
                      top: 0, left: 0, right: 0, height: '4px',
                      background: mod.gradient || mod.color,
                      borderRadius: '4px 4px 0 0',
                      opacity: 0.85,
                      transition: 'opacity 0.3s ease',
                    },
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
                    gap: isGrouped ? 2 : 2,
                    mb: isGrouped ? 3 : 0,
                    flexGrow: isGrouped ? 0 : 1,
                    justifyContent: isGrouped ? 'flex-start' : 'center'
                  }}>
                    <Box 
                      sx={{ 
                        background: `${mod.color}0d`,
                        p: isGrouped ? 1.6 : 2.5, 
                        borderRadius: '18px', 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: isGrouped ? 0 : 1,
                        border: '1px solid',
                        borderColor: `${mod.color}22`,
                        boxShadow: `0 6px 16px -6px ${mod.color}30`,
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <IconComponent sx={{ fontSize: isGrouped ? 30 : 46, color: mod.color }} />
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
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, opacity: 0.75 }}>
                          {mod.subModules.length} funciones integradas
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  {/* Sub-Modules Grid for Groups */}
                  {isGrouped && (
                    <Grid container spacing={1.2} sx={{ mt: 'auto' }}>
                      {mod.subModules.map((sub: any) => {
                        const SubIcon = sub.icon;
                        return (
                          <Grid size={{ xs: 12, sm: 6 }} key={sub.id + sub.title}>
                            <Button
                              fullWidth
                              variant="outlined"
                              onClick={(e) => { e.stopPropagation(); handleModuleClick(sub); }}
                              startIcon={<SubIcon sx={{ color: mod.color, fontSize: 19 }} />}
                              sx={(theme) => ({ 
                                justifyContent: 'flex-start', 
                                borderRadius: '14px', 
                                borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)',
                                py: 1.5,
                                px: 1.8,
                                fontWeight: 700,
                                fontSize: '0.82rem',
                                color: 'text.primary',
                                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.008)',
                                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                                borderWidth: '1px',
                                textAlign: 'left',
                                lineHeight: 1.3,
                                '&:hover': { 
                                  borderColor: `${mod.color}80`, 
                                  bgcolor: `${mod.color}0a`, 
                                  color: mod.color,
                                  borderWidth: '1px',
                                  transform: 'translateX(4px)',
                                  boxShadow: `0 4px 12px -4px ${mod.color}18`,
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
          p: { xs: 2, sm: 3 }, 
          boxShadow: '0 30px 60px -12px rgba(0,0,0,0.25)', 
          backdropFilter: 'blur(24px)',
          border: '1px solid',
          borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
        } } }}
      >
        <DialogTitle sx={{ textAlign: 'center', pt: 2 }}>
          <Box sx={{ 
            bgcolor: 'rgba(16, 185, 129, 0.08)', 
            display: 'inline-flex', 
            p: 2.5, 
            borderRadius: '50%', 
            mb: 2, 
            color: 'success.main', 
            border: '2px solid rgba(16, 185, 129, 0.15)',
            boxShadow: '0 8px 20px rgba(16, 185, 129, 0.15)',
          }}>
            <PointOfSale sx={{ fontSize: 46 }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: '-0.5px' }}>Apertura de Caja</Typography>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', px: 2 }}>
          <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2, fontSize: '0.96rem', lineHeight: 1.6 }}>
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
        <DialogActions sx={{ justifyContent: 'center', px: 2, pb: 2, pt: 1.5, gap: 1.5 }}>
          <Button 
            variant="text" 
            color="inherit" 
            onClick={() => setOpenPosModal(false)}
            sx={{ fontWeight: 700, borderRadius: '14px', py: 1.1, px: 2.5 }}
          >
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            color="success" 
            onClick={handleConfirmPos}
            sx={{ 
              fontWeight: 800, 
              borderRadius: '14px', 
              py: 1.1, 
              px: 3.5, 
              boxShadow: '0 8px 20px rgba(16, 185, 129, 0.35)',
              background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              '&:hover': {
                boxShadow: '0 12px 28px rgba(16, 185, 129, 0.5)',
                background: 'linear-gradient(135deg, #047857 0%, #059669 100%)',
              }
            }}
          >
            Abrir Punto de Venta
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
