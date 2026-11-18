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
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../../api/axiosConfig';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, tenant } = useAppStore();
  const [livePeriod, setLivePeriod] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const [logoError, setLogoError] = useState(false);
  const [showLiveFeed, setShowLiveFeed] = useState(true);

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
                          <Chip label={m.module} size="small" variant="outlined" sx={{ fontWeight: 800, fontSize: '0.66rem', height: 20 }} />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={m.operation}
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
