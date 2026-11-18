import { useState } from 'react';
import {
  Box, Typography, Grid, Paper, Button, Fade, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, ToggleButtonGroup, ToggleButton
} from '@mui/material';
import {
  Inventory2Rounded as Inventory,
  PointOfSaleRounded as PointOfSale,
  InsightsRounded as Assessment,
  AccountBalanceWalletRounded as AccountBalanceWallet,
  NotificationsActiveRounded as Timeline,
  TrendingUpRounded as TrendingUp,
  BoltRounded as Bolt,
  PaidRounded as PaidIcon,
  ReceiptLongRounded as Receipt,
  WarehouseRounded as Warehouse,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axiosConfig';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { ApexLogo } from '../../components/ApexLogo';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, tenant } = useAppStore();
  const [livePeriod, setLivePeriod] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const [logoError, setLogoError] = useState(false);

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
    queryFn: async () => (await api.get('/movements/?limit=10')).data,
    enabled: !!user,
    refetchInterval: 10000,
  });

  const isDemo = (tenant?.name || '').toLowerCase().includes('demo');
  const isMaster = tenant?.id === 1;
  const brandColor = tenant?.primary_color || '#2563eb';

  const personalizedSubtitle = isDemo
    ? `Entorno interactivo de demostración de ${tenant?.name} — Prueba facturación SENIAT, 3 precios, alarmas de stock y modo offline.`
    : isMaster
      ? `Centro de comando maestro de ${tenant?.name || 'APEX MASTER CORP'} — Supervisión global SaaS y operación en tiempo real.`
      : `Bienvenido al espacio ejecutivo de ${tenant?.name || 'tu empresa'} — Control fiscal SENIAT, inventario y finanzas en tiempo real.`;

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 1360,
        mx: 'auto',
        mt: { xs: 1, sm: 2 },
        px: { xs: 0.5, sm: 1.5 },
        py: { xs: 1.5, sm: 2.5 },
        position: 'relative',
      }}
    >
      {/* Personalized Client Welcome Header */}
      <Fade in timeout={500}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 3 },
            mb: 3,
            borderRadius: '22px',
            border: '1px solid',
            borderColor: 'divider',
            background: (theme) =>
              theme.palette.mode === 'dark'
                ? `linear-gradient(135deg, rgba(17, 24, 39, 0.9) 0%, ${brandColor}22 100%)`
                : `linear-gradient(135deg, #ffffff 0%, ${brandColor}0d 100%)`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'center' },
            flexDirection: { xs: 'column', md: 'row' },
            gap: 2.5,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.8, sm: 2.5 } }}>
            {tenant?.logo_url && !logoError ? (
              <Box
                component="img"
                src={tenant.logo_url}
                alt={tenant?.name || 'Logo Empresa'}
                onError={() => setLogoError(true)}
                sx={{
                  height: { xs: 52, sm: 64 },
                  maxWidth: { xs: 90, sm: 130 },
                  objectFit: 'contain',
                  borderRadius: '14px',
                  bgcolor: '#fff',
                  p: 0.8,
                  border: '1px solid',
                  borderColor: 'divider',
                  boxShadow: `0 6px 18px ${brandColor}22`,
                  flexShrink: 0,
                }}
              />
            ) : (
              <ApexLogo size={58} primaryColor={brandColor} />
            )}

            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
                <Chip
                  icon={<Bolt sx={{ fontSize: 14 }} />}
                  label={isDemo ? 'Empresa Demo Activa' : isMaster ? 'Panel Maestro SaaS' : 'Empresa Verificada'}
                  size="small"
                  sx={{
                    fontWeight: 800,
                    fontSize: '0.68rem',
                    height: 22,
                    bgcolor: `${brandColor}16`,
                    color: brandColor,
                    borderRadius: '8px',
                  }}
                />
                {tenant?.tax_id && (
                  <Chip
                    label={`RIF: ${tenant.tax_id}`}
                    size="small"
                    variant="outlined"
                    sx={{ fontWeight: 700, fontSize: '0.68rem', height: 22, borderRadius: '8px' }}
                  />
                )}
              </Box>
              <Typography
                sx={{
                  fontSize: { xs: '1.25rem', sm: '1.65rem' },
                  fontWeight: 900,
                  letterSpacing: '-0.5px',
                  lineHeight: 1.2,
                }}
              >
                ¡Hola, {user?.username || 'Usuario'}! Bienvenido a{' '}
                <Box component="span" sx={{ color: brandColor }}>
                  APEX
                </Box>
                {tenant?.name ? (
                  <Typography
                    component="span"
                    sx={{
                      fontSize: { xs: '0.95rem', sm: '1.05rem' },
                      fontWeight: 800,
                      color: 'text.secondary',
                      ml: 1,
                    }}
                  >
                    — {tenant.name}
                  </Typography>
                ) : null}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mt: 0.4, fontSize: '0.84rem' }}>
                {personalizedSubtitle}
              </Typography>
            </Box>
          </Box>

          {/* Quick Actions */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', width: { xs: '100%', md: 'auto' } }}>
            <Button
              size="small"
              variant="contained"
              startIcon={<PointOfSale />}
              onClick={() => navigate('/sales')}
              sx={{ borderRadius: '11px', fontWeight: 800, px: 2 }}
            >
              Punto de Venta
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<Receipt />}
              onClick={() => navigate('/sales/manual-billing')}
              sx={{ borderRadius: '11px', fontWeight: 800 }}
            >
              Facturar SENIAT
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<Warehouse />}
              onClick={() => navigate('/warehouses')}
              sx={{ borderRadius: '11px', fontWeight: 800 }}
            >
              Almacenes
            </Button>
          </Box>
        </Paper>
      </Fade>

      {/* ── MONITOR EJECUTIVO EN VIVO (LO PRIMERO QUE VE EL CLIENTE) ── */}
      <Fade in timeout={650}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 3.5 },
            mb: 3.5,
            borderRadius: '24px',
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(17, 24, 39, 0.55)' : 'rgba(255, 255, 255, 0.92)'),
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
          <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '14px', maxHeight: 320 }}>
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
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
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

      {/* WMS Alerts Banner */}
      {alerts.length > 0 && (
        <Fade in timeout={800}>
          <Box
            sx={{
              mb: 3,
              display: 'flex',
              gap: 2,
              overflowX: 'auto',
              pb: 1,
            }}
          >
            {alerts.map((alert: any, i: number) => (
              <Paper
                key={i}
                elevation={0}
                sx={{
                  p: 2.2,
                  minWidth: { xs: 295, sm: 360 },
                  borderRadius: '18px',
                  borderLeft: '5px solid',
                  borderColor: 'error.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 2,
                  bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(254, 242, 242, 0.95)'),
                  color: (theme) => (theme.palette.mode === 'dark' ? '#fca5a5' : '#991b1b'),
                }}
              >
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
    </Box>
  );
}
