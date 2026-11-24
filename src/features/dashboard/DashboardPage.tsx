import { useState } from 'react';
import {
  Box, Typography, Grid, Paper, Button, Fade, Chip, Collapse,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, ToggleButtonGroup, ToggleButton
} from '@mui/material';
import {
  Inventory2Rounded as Inventory,
  PointOfSaleRounded as PointOfSale,
  InsightsRounded as Assessment,
  AccountBalanceWalletRounded as AccountBalanceWallet,
  TrendingUpRounded as TrendingUp,
  BoltRounded as Bolt,
  PaidRounded as PaidIcon,
  ExpandMoreRounded as ExpandMoreIcon,
  ExpandLessRounded as ExpandLessIcon,
  ShowChartRounded as ChartIcon,
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../../api/axiosConfig';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { formatMovementModule, formatMovementOperation } from '../../utils/movementLabels';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user, tenant } = useAppStore();
  const [livePeriod, setLivePeriod] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const [logoError, setLogoError] = useState(false);
  const [showLiveFeed, setShowLiveFeed] = useState(true);
  const [rightChartTab, setRightChartTab] = useState<'products' | 'treasury'>('products');

  const { data: summary } = useQuery({
    queryKey: ['dashboard-live-summary', livePeriod],
    queryFn: async () => (await api.get(`/dashboard/summary?period=${livePeriod}`)).data,
    enabled: !!user,
    refetchInterval: 10000,
  });

  const { data: liveMovements = [] } = useQuery({
    queryKey: ['dashboard-live-movements'],
    queryFn: async () => (await api.get('/movements/?limit=4')).data,
    enabled: !!user,
    refetchInterval: 10000,
  });

  const isDemo = (tenant?.name || '').toLowerCase().includes('demo');
  const isMaster = tenant?.id === 1;
  const brandColor = tenant?.primary_color || '#2563eb';

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 1360,
        mx: 'auto',
        mt: { xs: 1, sm: 1.5 },
        px: { xs: 0.5, sm: 1.5 },
        py: { xs: 1, sm: 2 },
        position: 'relative',
      }}
    >
      {/* Cabecera de Bienvenida Compacta y Limpia */}
      <Fade in timeout={450}>
        <Paper
          elevation={0}
          sx={{
            px: { xs: 2, sm: 3 },
            py: { xs: 1.8, sm: 2.2 },
            mb: 2.5,
            borderRadius: '20px',
            border: '1px solid',
            borderColor: 'divider',
            background: (theme) =>
              theme.palette.mode === 'dark'
                ? `linear-gradient(135deg, rgba(17, 24, 39, 0.9) 0%, ${brandColor}1f 100%)`
                : `linear-gradient(135deg, #ffffff 0%, ${brandColor}0a 100%)`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 1.5,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 } }}>
            {tenant?.logo_url && !logoError && (
              <Box
                component="img"
                src={tenant.logo_url}
                alt={tenant?.name || 'Logo Empresa'}
                onError={() => setLogoError(true)}
                sx={{
                  height: { xs: 44, sm: 50 },
                  maxWidth: { xs: 80, sm: 115 },
                  objectFit: 'contain',
                  borderRadius: '12px',
                  bgcolor: '#fff',
                  p: 0.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  flexShrink: 0,
                }}
              />
            )}

            <Box>
              <Typography
                sx={{
                  fontSize: { xs: '1.15rem', sm: '1.45rem' },
                  fontWeight: 900,
                  letterSpacing: '-0.4px',
                  lineHeight: 1.2,
                }}
              >
                ¡{t('Hello')}, {user?.username || 'Usuario'}! {t('Welcome to')}{' '}
                <Box component="span" sx={{ color: brandColor }}>
                  APEX
                </Box>
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mt: 0.2 }}>
                {tenant?.name || 'Mi Empresa'}{tenant?.tax_id ? ` • RIF: ${tenant.tax_id}` : ''}
              </Typography>
            </Box>
          </Box>

          <Chip
            icon={<Bolt sx={{ fontSize: 14 }} />}
            label={isDemo ? t('Demo Company Active') : isMaster ? t('SaaS Master Panel') : t('Active Company')}
            size="small"
            sx={{
              fontWeight: 800,
              fontSize: '0.7rem',
              height: 24,
              bgcolor: `${brandColor}14`,
              color: brandColor,
              borderRadius: '8px',
            }}
          />
        </Paper>
      </Fade>

      {/* ── MONITOR EJECUTIVO EN VIVO ── */}
      <Fade in timeout={600}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 3 },
            borderRadius: '22px',
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(17, 24, 39, 0.55)' : 'rgba(255, 255, 255, 0.94)'),
            backdropFilter: 'blur(16px)',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.4 }}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: '#10b981',
                  boxShadow: '0 0 10px #10b981',
                  flexShrink: 0,
                }}
              />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.15 }}>
                  {t('Live Executive Monitor')}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  {t('Real-time operational summary')} — {tenant?.name || 'Mi Empresa'}
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
                <ToggleButton value="today" sx={{ fontWeight: 700, fontSize: '0.73rem', px: { xs: 1.1, sm: 1.5 } }}>{t('Today')}</ToggleButton>
                <ToggleButton value="week" sx={{ fontWeight: 700, fontSize: '0.73rem', px: { xs: 1.1, sm: 1.5 } }}>{t('7 Days')}</ToggleButton>
                <ToggleButton value="month" sx={{ fontWeight: 700, fontSize: '0.73rem', px: { xs: 1.1, sm: 1.5 } }}>{t('Month')}</ToggleButton>
                <ToggleButton value="all" sx={{ fontWeight: 700, fontSize: '0.73rem', px: { xs: 1.1, sm: 1.5 } }}>{t('All Time')}</ToggleButton>
              </ToggleButtonGroup>

              <Button
                size="small"
                variant="outlined"
                onClick={() => navigate('/reports')}
                startIcon={<Assessment fontSize="small" />}
                sx={{ borderRadius: '10px', fontWeight: 800, textTransform: 'none' }}
              >
                {t('View Reports')}
              </Button>
            </Box>
          </Box>

          {/* KPIs en Vivo */}
          <Grid container spacing={2} sx={{ mb: 2.5 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper elevation={0} sx={{ p: 2, borderRadius: '16px', bgcolor: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.22)', display: 'flex', alignItems: 'center', gap: 1.6 }}>
                <Box sx={{ p: 1.2, borderRadius: '12px', bgcolor: 'rgba(16, 185, 129, 0.16)', color: '#059669', display: 'flex' }}>
                  <PointOfSale />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#059669', textTransform: 'uppercase', display: 'block' }}>
                    {t('Sales (Invoices)')} ({summary?.total_orders || 0})
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: '#047857', mt: 0.1 }}>
                    ${Number(summary?.total_sales || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper elevation={0} sx={{ p: 2, borderRadius: '16px', bgcolor: 'rgba(37, 99, 235, 0.08)', border: '1px solid rgba(37, 99, 235, 0.22)', display: 'flex', alignItems: 'center', gap: 1.6 }}>
                <Box sx={{ p: 1.2, borderRadius: '12px', bgcolor: 'rgba(37, 99, 235, 0.16)', color: '#2563eb', display: 'flex' }}>
                  <PaidIcon />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', display: 'block' }}>
                    {t('Accounts Receivable')}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: '#1d4ed8', mt: 0.1 }}>
                    ${Number(summary?.ar_open || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper elevation={0} sx={{ p: 2, borderRadius: '16px', bgcolor: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.22)', display: 'flex', alignItems: 'center', gap: 1.6 }}>
                <Box sx={{ p: 1.2, borderRadius: '12px', bgcolor: 'rgba(245, 158, 11, 0.16)', color: '#d97706', display: 'flex' }}>
                  <AccountBalanceWallet />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#d97706', textTransform: 'uppercase', display: 'block' }}>
                    {t('Accounts Payable')}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: '#b45309', mt: 0.1 }}>
                    ${Number(summary?.ap_open || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper elevation={0} sx={{ p: 2, borderRadius: '16px', bgcolor: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.22)', display: 'flex', alignItems: 'center', gap: 1.6 }}>
                <Box sx={{ p: 1.2, borderRadius: '12px', bgcolor: 'rgba(139, 92, 246, 0.16)', color: '#7c3aed', display: 'flex' }}>
                  <Inventory />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', display: 'block' }}>
                    {t('Catalog / Purchases')}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: '#6d28d9', mt: 0.1 }}>
                    {summary?.active_products || 0} Ítems | ${Number(summary?.total_purchases || 0).toFixed(2)}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* Gráficos Ejecutivos en Vivo (Diseño limpio, 2 tarjetas equilibradas) */}
          <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
            <Grid size={{ xs: 12, lg: 7 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.2,
                  borderRadius: '18px',
                  border: '1px solid',
                  borderColor: 'divider',
                  height: 290,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ChartIcon fontSize="small" sx={{ color: brandColor }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                      Ventas en Vivo (Últimos 7 Días)
                    </Typography>
                  </Box>
                  <Chip
                    label="Actualización en vivo"
                    size="small"
                    sx={{ fontSize: '0.68rem', fontWeight: 700, height: 22, bgcolor: 'rgba(16,185,129,0.1)', color: '#059669' }}
                  />
                </Box>

                <Box sx={{ flex: 1, minHeight: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={summary?.sales_chart || []} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                      <defs>
                        <linearGradient id="salesAreaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={brandColor} stopOpacity={0.32} />
                          <stop offset="95%" stopColor={brandColor} stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.18} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        tickFormatter={(v) => `$${v}`}
                      />
                      <RechartsTooltip
                        formatter={(value: any) => [`$${Number(value || 0).toFixed(2)}`, 'Ventas']}
                        contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 8px 24px rgba(15,23,42,0.08)' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="ventas"
                        stroke={brandColor}
                        strokeWidth={2.5}
                        fill="url(#salesAreaGrad)"
                        activeDot={{ r: 5 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, lg: 5 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.2,
                  borderRadius: '18px',
                  border: '1px solid',
                  borderColor: 'divider',
                  height: 290,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, gap: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                    {rightChartTab === 'products' ? 'Top Productos Vendidos' : 'Balance Financiero'}
                  </Typography>
                  <ToggleButtonGroup
                    size="small"
                    exclusive
                    value={rightChartTab}
                    onChange={(_, v) => v && setRightChartTab(v)}
                  >
                    <ToggleButton value="products" sx={{ fontSize: '0.68rem', fontWeight: 700, py: 0.3, px: 1, textTransform: 'none' }}>
                      Productos
                    </ToggleButton>
                    <ToggleButton value="treasury" sx={{ fontSize: '0.68rem', fontWeight: 700, py: 0.3, px: 1, textTransform: 'none' }}>
                      Finanzas
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>

                <Box sx={{ flex: 1, minHeight: 0 }}>
                  {rightChartTab === 'products' ? (
                    (summary?.top_products || []).length === 0 ? (
                      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                          Aún no hay ventas registradas en este período.
                        </Typography>
                      </Box>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={(summary?.top_products || []).map((p: any) => ({
                            name: String(p.name || p.sku).slice(0, 16),
                            cantidad: Number(p.total_vendido || 0),
                          }))}
                          layout="vertical"
                          margin={{ top: 4, right: 16, left: 4, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} strokeOpacity={0.18} />
                          <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                          <YAxis type="category" dataKey="name" width={105} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#475569' }} />
                          <RechartsTooltip
                            formatter={(v: any) => [`${v} und`, 'Vendido']}
                            contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }}
                          />
                          <Bar dataKey="cantidad" fill={brandColor} radius={[0, 8, 8, 0]} barSize={18} />
                        </BarChart>
                      </ResponsiveContainer>
                    )
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { name: 'Ventas', monto: Number(summary?.total_sales || 0), color: '#10b981' },
                          { name: 'Compras', monto: Number(summary?.total_purchases || 0), color: '#8b5cf6' },
                          { name: 'Por Cobrar', monto: Number(summary?.ar_open || 0), color: '#2563eb' },
                          { name: 'Por Pagar', monto: Number(summary?.ap_open || 0), color: '#f59e0b' },
                        ]}
                        margin={{ top: 8, right: 12, left: -12, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.18} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `$${v}`} />
                        <RechartsTooltip
                          formatter={(v: any) => [`$${Number(v || 0).toFixed(2)}`, 'Monto']}
                          contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }}
                        />
                        <Bar dataKey="monto" radius={[8, 8, 0, 0]} barSize={32}>
                          {[
                            '#10b981',
                            '#8b5cf6',
                            '#2563eb',
                            '#f59e0b',
                          ].map((c, idx) => (
                            <Cell key={idx} fill={c} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* Feed de Movimientos en Vivo (Resumido a 4 filas y Plegable) */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUp fontSize="small" color="primary" /> {t('Recent Live Activity')}
            </Typography>
            <Button
              size="small"
              variant="text"
              onClick={() => setShowLiveFeed((prev) => !prev)}
              endIcon={showLiveFeed ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              sx={{ fontWeight: 700, fontSize: '0.76rem' }}
            >
              {showLiveFeed ? t('Hide') : t('Show')}
            </Button>
          </Box>

          <Collapse in={showLiveFeed}>
            <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '14px' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.73rem' }}>Fecha / Hora</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.73rem' }}>Módulo</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.73rem' }}>Operación</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.73rem' }}>Descripción</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.73rem' }} align="right">Monto / Cant.</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.73rem' }}>Usuario</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.73rem' }}>IP</TableCell>
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
                        <TableCell sx={{ fontSize: '0.73rem', whiteSpace: 'nowrap' }}>
                          {new Date(m.created_at).toLocaleString('es-VE')}
                        </TableCell>
                        <TableCell>
                          <Chip label={formatMovementModule(m.module, i18n.language)} size="small" variant="outlined" sx={{ fontWeight: 800, fontSize: '0.66rem', height: 20 }} />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={formatMovementOperation(m.operation, i18n.language)}
                            size="small"
                            color={m.operation === 'SALE' || m.operation === 'CHARGE' ? 'success' : m.operation === 'DISCHARGE' ? 'error' : 'primary'}
                            sx={{ fontWeight: 800, fontSize: '0.66rem', height: 20 }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.76rem', fontWeight: 600, minWidth: 190 }}>{m.description}</TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.76rem', fontWeight: 800, whiteSpace: 'nowrap' }}>
                          {m.amount ? `$${Number(m.amount).toFixed(2)}` : m.quantity ? `${m.quantity} ${m.unit || 'und'}` : '—'}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.73rem', fontWeight: 700, whiteSpace: 'nowrap' }}>{m.user_name || 'Admin'}</TableCell>
                        <TableCell sx={{ fontSize: '0.71rem', fontFamily: 'monospace', color: 'text.secondary', whiteSpace: 'nowrap' }}>
                          {m.ip_address || 'Local'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Collapse>
        </Paper>
      </Fade>
    </Box>
  );
}
