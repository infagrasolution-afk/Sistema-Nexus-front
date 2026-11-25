import { useState } from 'react';
import { 
  Box, Typography, Grid, Paper, Card, CardContent, Button, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem, OutlinedInput, Checkbox, ListItemText, Divider,
  Tabs, Tab, IconButton, Tooltip, Switch, FormControlLabel, Snackbar, Alert
} from '@mui/material';
import { 
  Business as BusinessIcon, 
  People as PeopleIcon, 
  VpnKey as LicenseIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  Login as LoginIcon,
  BugReport as ErrorIcon,
  Terminal as TerminalIcon,
  Delete as DeleteIcon,
  Calculate as CalculateIcon,
  Security as SecurityIcon,
  Storage as StorageIcon,
  Extension as ModulesIcon,
  CloudDownload as BackupIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../../api/axiosConfig';
import ProposalGenerator from './ProposalGenerator';

export default function AdminPage() {
  const { t } = useTranslation();
  const [tabValue, setTabValue] = useState(0);
  const [open, setOpen] = useState(false);
  const [selectedError, setSelectedError] = useState<any>(null);
  const [tenantSearch, setTenantSearch] = useState('');
  const [auditSearch, setAuditSearch] = useState('');
  const [modulesModalTenant, setModulesModalTenant] = useState<any>(null);
  const [editingModules, setEditingModules] = useState<string[]>(['admin', 'inventory']);
  const [editingLicenseDate, setEditingLicenseDate] = useState<string>('');
  const [editingIsActive, setEditingIsActive] = useState<boolean>(true);
  const [downloadingBackup, setDownloadingBackup] = useState<boolean>(false);
  const [downloadingTenantId, setDownloadingTenantId] = useState<number | null>(null);
  const [adminToast, setAdminToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [dbMode, setDbMode] = useState<'shared' | 'dedicated'>('shared');

  const AVAILABLE_MODULES = [
    { id: 'admin', label: 'Módulo Administrativo (Base Obligatoria)' },
    { id: 'inventory', label: 'Módulo de Inventario (Bundle con Admin)' },
    { id: 'sales', label: 'Módulo de Ventas / Facturación / POS' },
    { id: 'purchases', label: 'Módulo de Compras y Proveedores' },
    { id: 'treasury', label: 'Módulo de Tesorería (Cuentas por Cobrar/Pagar, Bancos)' },
    { id: 'accounting', label: 'Módulo Contable' },
    { id: 'hr', label: 'Módulo de Nómina y RRHH (LOTTT)' },
  ];

  const [newCompany, setNewCompany] = useState({ 
    name: '', 
    email: '', 
    tax_id: '', 
    modules: ['admin', 'inventory', 'sales', 'purchases', 'treasury', 'accounting', 'hr'],
    admin_username: '',
    admin_password: '',
    logo_url: '',
    custom_database_url: ''
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewCompany((prev) => ({ ...prev, logo_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };
  
  const queryClient = useQueryClient();

  const handleAccessTenant = (tenantId: number, tenantName: string) => {
    localStorage.setItem('active_tenant_id', String(tenantId));
    localStorage.setItem('active_tenant_name', tenantName);
    window.location.href = '/'; // Redirige al Dashboard de esa empresa
  };

  const handleExitTenant = () => {
    localStorage.removeItem('active_tenant_id');
    localStorage.removeItem('active_tenant_name');
    window.location.href = '/admin';
  };

  // Queries
  const { data: metrics } = useQuery({
    queryKey: ['admin-metrics'],
    queryFn: async () => (await api.get('/admin/dashboard')).data,
    refetchInterval: 12000,
  });

  const { data: tenants = [], isLoading: tenantsLoading, isError: tenantsError, refetch: refetchTenants } = useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      const res = await api.get('/admin/tenants');
      return Array.isArray(res.data) ? res.data : (res.data?.items || res.data?.data || []);
    },
    refetchInterval: 15000,
  });

  const { data: errorLogs = [], refetch: refetchLogs } = useQuery({
    queryKey: ['error-logs'],
    queryFn: async () => (await api.get('/support/error-logs')).data,
    enabled: tabValue === 1
  });

  const { data: securityAuditLogs = [], refetch: refetchAuditLogs } = useQuery({
    queryKey: ['admin-security-audit-logs'],
    queryFn: async () => (await api.get('/admin/security-audit-logs?limit=250')).data,
    enabled: tabValue === 3,
    refetchInterval: 10000,
  });

  const createTenantMutation = useMutation({
    mutationFn: (data: any) => {
      const expirationDate = new Date();
      expirationDate.setFullYear(expirationDate.getFullYear() + 1);
      const isoExp = expirationDate.toISOString();

      const modulesJson: Record<string, any> = {};
      data.modules.forEach((modId: string) => {
        modulesJson[modId] = { is_active: true, expires_at: isoExp };
      });

      return api.post('/admin/tenants', { ...data, modules: modulesJson });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['admin-metrics'] });
      setOpen(false);
      setNewCompany({ 
        name: '', 
        email: '', 
        tax_id: '', 
        modules: ['sales', 'inventory', 'accounting', 'users'],
        admin_username: '',
        admin_password: '',
        logo_url: '',
        custom_database_url: ''
      });
      setDbMode('shared');
    }
  });

  const renewMutation = useMutation({
    mutationFn: (id: number) => api.post(`/admin/tenants/${id}/renew`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['admin-metrics'] });
    }
  });

  const deleteLogMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/support/error-logs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['error-logs'] });
    }
  });

  const clearAllLogsMutation = useMutation({
    mutationFn: () => api.delete('/support/error-logs'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['error-logs'] });
    }
  });

  const updateModulesMutation = useMutation({
    mutationFn: ({ tenantId, payload }: { tenantId: number; payload: Record<string, any> }) =>
      api.put(`/admin/tenants/${tenantId}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['my-tenant'] });
      setModulesModalTenant(null);
      setAdminToast({ open: true, message: 'Módulos y licencia actualizados correctamente.', severity: 'success' });
    },
    onError: (err: any) => {
      setAdminToast({
        open: true,
        message: err?.response?.data?.detail || 'Error al actualizar módulos.',
        severity: 'error',
      });
    },
  });

  const parseTenantModulesList = (mods: any): string[] => {
    const base = new Set<string>(['admin', 'inventory']);
    if (!mods) return Array.from(base);
    if (Array.isArray(mods)) {
      mods.forEach((m) => base.add(String(m)));
    } else if (typeof mods === 'string') {
      mods.split(',').map((s) => s.trim()).filter(Boolean).forEach((m) => base.add(m));
    } else if (typeof mods === 'object') {
      Object.entries(mods).forEach(([k, v]: [string, any]) => {
        if (v === true || (typeof v === 'object' && v?.is_active !== false)) {
          base.add(k);
        }
      });
    }
    return Array.from(base);
  };

  const handleOpenModulesModal = (tenant: any) => {
    setModulesModalTenant(tenant);
    setEditingModules(parseTenantModulesList(tenant.modules));
    setEditingIsActive(tenant.is_active !== false);
    if (tenant.subscription_end) {
      setEditingLicenseDate(new Date(tenant.subscription_end).toISOString().slice(0, 10));
    } else {
      setEditingLicenseDate('');
    }
  };

  const handleToggleModuleSwitch = (modId: string) => {
    if (modId === 'admin' || modId === 'inventory') return; // Base obligatoria
    setEditingModules((prev) =>
      prev.includes(modId) ? prev.filter((m) => m !== modId) : [...prev, modId]
    );
  };

  const handleSaveTenantModules = () => {
    if (!modulesModalTenant) return;
    const exp = editingLicenseDate
      ? `${editingLicenseDate}T23:59:59`
      : modulesModalTenant.subscription_end || new Date(Date.now() + 365 * 86400000).toISOString();
    const modulesJson: Record<string, any> = {};
    editingModules.forEach((modId) => {
      modulesJson[modId] = {
        is_active: true,
        expires_at: exp,
      };
    });
    const payload: Record<string, any> = {
      modules: modulesJson,
      is_active: editingIsActive,
    };
    if (editingLicenseDate) {
      payload.subscription_end = `${editingLicenseDate}T23:59:59`;
    }
    updateModulesMutation.mutate({ tenantId: modulesModalTenant.id, payload });
  };

  const handleDownloadBackup = async (tenantId?: number, tenantName?: string) => {
    if (tenantId) {
      setDownloadingTenantId(tenantId);
    } else {
      setDownloadingBackup(true);
    }
    try {
      const endpoint = tenantId ? `/admin/backup/download?tenant_id=${tenantId}` : '/admin/backup/download';
      if (!tenantId) {
        await api.post('/admin/backup/run');
      }
      const res = await api.get(endpoint, { responseType: 'blob' });
      const slug = tenantName ? tenantName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') : '';
      const outName = tenantId ? `respaldo_${slug || `empresa_${tenantId}`}.json.gz` : 'apex_backup_latest.json.gz';
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', outName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setAdminToast({
        open: true,
        message: tenantId
          ? `Respaldo de ${tenantName || `empresa #${tenantId}`} descargado (${outName}).`
          : 'Respaldo completo actualizado y descargado (apex_backup_latest.json.gz).',
        severity: 'success',
      });
    } catch (err: any) {
      setAdminToast({
        open: true,
        message: err?.response?.data?.detail || 'No se pudo generar o descargar el respaldo.',
        severity: 'error',
      });
    } finally {
      setDownloadingBackup(false);
      setDownloadingTenantId(null);
    }
  };

  const handleDeleteLog = (id: number) => {
    if (confirm('¿Está seguro de eliminar este registro de incidente?')) {
      deleteLogMutation.mutate(id);
    }
  };

  const handleClearAllLogs = () => {
    if (confirm('¿Está seguro de limpiar TODO el historial de incidentes? Esta acción no se puede deshacer.')) {
      clearAllLogsMutation.mutate();
    }
  };

  const handleProvisionFromProposal = (tenantData: {
    name: string;
    email: string;
    tax_id: string;
    modules: string[];
  }) => {
    setNewCompany(prev => ({
      ...prev,
      name: tenantData.name || '',
      email: tenantData.email || '',
      tax_id: tenantData.tax_id || '',
      modules: tenantData.modules
    }));
    setOpen(true);
  };

  const dashboardCards = [
    { title: t('Total Companies'), value: metrics?.total_tenants || 0, icon: <BusinessIcon />, color: '#2563eb' },
    { title: t('Active Users'), value: metrics?.total_users || 0, icon: <PeopleIcon />, color: '#059669' },
    { title: t('Expiring Soon'), value: metrics?.expiring_soon || 0, icon: <WarningIcon />, color: '#d97706' },
    { title: 'Eventos Auditados (IP/Seguridad)', value: metrics?.total_audit_events || 0, icon: <SecurityIcon />, color: '#7c3aed' },
  ];

  return (
    <Box>
      {/* Banner when impersonating a tenant */}
      {localStorage.getItem('active_tenant_id') && (
        <Paper sx={{ p: 1.5, mb: 3, bgcolor: 'warning.light', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography sx={{ fontWeight: 700, color: 'warning.dark' }}>
            ⚠️ Estás viendo la empresa: <strong>{localStorage.getItem('active_tenant_name')}</strong>
          </Typography>
          <Button variant="contained" color="warning" size="small" onClick={handleExitTenant} sx={{ borderRadius: 2 }}>
            Volver al Panel SaaS
          </Button>
        </Paper>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>{t('SaaS Admin Control')}</Typography>
          <Typography variant="body2" color="text.secondary">{t('Global oversight of all companies')}</Typography>
        </Box>
        {tabValue === 0 ? (
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Tooltip title="Respaldo automático programado: 8:00 AM, 1:00 PM y 7:00 PM (VET)">
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<BackupIcon />}
                onClick={() => handleDownloadBackup()}
                disabled={downloadingBackup}
                sx={{ borderRadius: '12px', px: 2.5, fontWeight: 700, textTransform: 'none' }}
              >
                {downloadingBackup ? 'Respaldando...' : 'Respaldar Todo'}
              </Button>
            </Tooltip>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />} 
              onClick={() => setOpen(true)}
              sx={{ borderRadius: '12px', px: 3, fontWeight: 700 }}
            >
              {t('New Client')}
            </Button>
          </Box>
        ) : (
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />} 
            onClick={() => refetchLogs()}
            sx={{ borderRadius: '12px', px: 3, fontWeight: 700 }}
          >
            Actualizar Diagnósticos
          </Button>
        )}
      </Box>

      {/* Tabs Menu Responsive */}
      <Tabs 
        value={tabValue} 
        onChange={(_, val) => setTabValue(val)} 
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{ 
          mb: 4, 
          borderBottom: 1, 
          borderColor: 'divider',
          '& .MuiTab-root': { fontWeight: 700, textTransform: 'none', fontSize: '0.95rem', minHeight: 48 }
        }}
      >
        <Tab icon={<BusinessIcon fontSize="small" />} iconPosition="start" label="Control de Inquilinos (En Vivo)" />
        <Tab icon={<ErrorIcon fontSize="small" />} iconPosition="start" label="Diagnóstico de Errores y Soporte" />
        <Tab icon={<CalculateIcon fontSize="small" />} iconPosition="start" label="Cotizador & Propuestas (PDF)" />
        <Tab icon={<SecurityIcon fontSize="small" />} iconPosition="start" label="Auditoría Forense Global (IPs / Usuarios)" />
      </Tabs>

      {tabValue === 0 && (
        <>
          {/* Metrics Grid */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {dashboardCards.map((card, idx) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={idx}>
                <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid', borderColor: 'divider' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ p: 1, borderRadius: 2, bgcolor: `${card.color}15`, color: card.color }}>
                        {card.icon}
                      </Box>
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 800 }}>{card.value}</Typography>
                    <Typography variant="body2" color="text.secondary">{card.title}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Tenants Table */}
          <Paper sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.secondary' }}>
                {tenantsLoading ? 'Cargando...' : `${tenants.length} empresa${tenants.length !== 1 ? 's' : ''} registrada${tenants.length !== 1 ? 's' : ''}`}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                <TextField
                  size="small"
                  placeholder="Filtrar cliente por nombre, RIF o licencia..."
                  value={tenantSearch}
                  onChange={(e) => setTenantSearch(e.target.value)}
                  sx={{ minWidth: 260 }}
                />
                <Button size="small" startIcon={<RefreshIcon />} onClick={() => refetchTenants()} sx={{ fontWeight: 700, fontSize: '0.78rem' }}>
                  Actualizar
                </Button>
              </Box>
            </Box>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>{t('Company')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Arquitectura BD / Usuarios</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t('License Key')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t('Expiration')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t('Status')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">{t('Actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tenantsLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary', fontWeight: 600 }}>
                        ⏳ Cargando empresas...
                      </TableCell>
                    </TableRow>
                  ) : tenantsError ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <Typography color="error" sx={{ fontWeight: 700, mb: 1.5 }}>
                          ⚠️ Error al consultar la lista de empresas. Puede que el servidor se esté reiniciando.
                        </Typography>
                        <Button variant="outlined" size="small" onClick={() => refetchTenants()} startIcon={<RefreshIcon />} sx={{ borderRadius: 2, fontWeight: 700 }}>
                          Reintentar Carga
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) : tenants.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
                          <BusinessIcon sx={{ fontSize: 48, color: 'text.disabled', opacity: 0.4 }} />
                          <Typography color="text.secondary" sx={{ fontWeight: 600 }}>No hay empresas registradas aún</Typography>
                          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => setOpen(true)} sx={{ borderRadius: '10px', mt: 0.5, fontWeight: 700 }}>
                            Crear Primera Empresa
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    tenants
                      .filter((tenant: any) =>
                        !tenantSearch ||
                        (tenant.name || '').toLowerCase().includes(tenantSearch.toLowerCase()) ||
                        (tenant.tax_id || '').toLowerCase().includes(tenantSearch.toLowerCase()) ||
                        (tenant.license_key || '').toLowerCase().includes(tenantSearch.toLowerCase())
                      )
                      .map((tenant: any) => {
                      const tenantNameLower = (tenant.name || '').toLowerCase();
                      const isLifetime = tenant.id === 1 || tenantNameLower.includes('master') || tenantNameLower.includes('demo');
                      const userCount = metrics?.users_per_tenant?.[String(tenant.id)] || 1;
                      const isDedicatedDb = Boolean(tenant.custom_database_url);
                      return (
                        <TableRow key={tenant.id} hover>
                          <TableCell>
                            <Typography sx={{ fontWeight: 800, fontSize: '0.95rem' }}>{tenant.name || '—'}</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              RIF: {tenant.tax_id || 'N/A'} • {tenant.email || 'Sin email'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'flex-start' }}>
                              <Chip
                                size="small"
                                icon={<StorageIcon fontSize="small" />}
                                label={isDedicatedDb ? '🏢 BD Dedicada VIP' : `⚡ Pool Único (tenant_${tenant.id})`}
                                color={isDedicatedDb ? 'secondary' : 'info'}
                                variant="outlined"
                                sx={{ fontWeight: 800, fontSize: '0.7rem', height: 22 }}
                              />
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                                👥 {userCount} usuario{userCount !== 1 ? 's' : ''} activo{userCount !== 1 ? 's' : ''}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={tenant.license_key || 'Sin clave'} 
                              size="small" 
                              icon={<LicenseIcon fontSize="small" />} 
                              sx={{ borderRadius: '6px', fontWeight: 600, fontFamily: 'monospace', fontSize: '0.72rem' }} 
                            />
                          </TableCell>
                          <TableCell>
                            {isLifetime ? (
                              <Chip 
                                label="Ilimitada / Vitalicia" 
                                color="primary" 
                                size="small"
                                variant="outlined" 
                                sx={{ borderRadius: '6px', fontWeight: 800 }} 
                              />
                            ) : tenant.subscription_end ? (
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {new Date(tenant.subscription_end).toLocaleDateString('es-VE')}
                              </Typography>
                            ) : (
                              <Typography variant="caption" color="text.disabled">No definida</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={tenant.is_active ? 'Activo' : 'Suspendido'} 
                              color={tenant.is_active ? 'success' : 'error'}
                              size="small"
                              sx={{ fontWeight: 700 }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                              <Tooltip title="Descargar respaldo individual de esta empresa (.json.gz)">
                                <Button
                                  startIcon={<BackupIcon />}
                                  size="small"
                                  color="secondary"
                                  variant="outlined"
                                  disabled={downloadingTenantId === tenant.id}
                                  onClick={() => handleDownloadBackup(tenant.id, tenant.name)}
                                  sx={{ borderRadius: '10px', fontWeight: 700, fontSize: '0.78rem' }}
                                >
                                  {downloadingTenantId === tenant.id ? 'Generando...' : 'Respaldo'}
                                </Button>
                              </Tooltip>
                              <Button 
                                startIcon={<ModulesIcon />} 
                                size="small"
                                color="primary"
                                variant="outlined"
                                onClick={() => handleOpenModulesModal(tenant)}
                                sx={{ borderRadius: '10px', fontWeight: 700, fontSize: '0.78rem' }}
                              >
                                Módulos / Licencia
                              </Button>
                              <Button 
                                startIcon={<LoginIcon />} 
                                size="small"
                                color="success"
                                variant="outlined"
                                onClick={() => handleAccessTenant(tenant.id, tenant.name)}
                                sx={{ borderRadius: '10px', fontWeight: 700, fontSize: '0.78rem' }}
                              >
                                Acceder
                              </Button>
                              {!isLifetime && (
                                <Button 
                                  startIcon={<RefreshIcon />} 
                                  size="small"
                                  variant="outlined"
                                  onClick={() => renewMutation.mutate(tenant.id)}
                                  disabled={renewMutation.isPending}
                                  sx={{ borderRadius: '10px', fontWeight: 700, fontSize: '0.78rem' }}
                                >
                                  Renovar
                                </Button>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}

      {tabValue === 1 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
                🚨 Historial de Incidentes y Diagnósticos en Tiempo Real
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Monitorea en tiempo real todas las fallas, excepciones de red e incidencias críticas que reportan los clientes para dar un soporte proactivo de nivel empresarial.
              </Typography>
            </Box>
            {errorLogs.length > 0 && (
              <Button
                variant="contained"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleClearAllLogs}
                disabled={clearAllLogsMutation.isPending}
                sx={{ borderRadius: 3, fontWeight: 700, textTransform: 'none', py: 1, px: 2.5 }}
              >
                Limpiar Todo el Historial
              </Button>
            )}
          </Box>

          <Paper sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: '#fff5f5' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: '#c53030' }}>Fecha/Hora</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#c53030' }}>Empresa (Inquilino ID)</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#c53030' }}>Usuario</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#c53030' }}>Fallo Reportado</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#c53030' }}>Componente</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#c53030' }} align="right">Diagnóstico</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {errorLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                        <Typography sx={{ color: 'text.secondary', fontWeight: 600 }}>
                          ✅ ¡No se registran errores reportados! El sistema funciona de forma óptima.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    errorLogs.map((log: any) => (
                      <TableRow key={log.id} hover>
                        <TableCell sx={{ fontSize: '0.85rem' }}>
                          {new Date(log.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>
                          {log.tenant_id ? `Inquilino #${log.tenant_id}` : 'Global/Público'}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>
                          {log.username || 'Invitado'}
                        </TableCell>
                        <TableCell sx={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#c53030' }}>
                            {log.error_message}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {log.url}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={log.component} size="small" color="error" variant="outlined" sx={{ borderRadius: 1.5, fontWeight: 700 }} />
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
                            <Button 
                              variant="contained" 
                              color="error" 
                              size="small" 
                              startIcon={<TerminalIcon />}
                              onClick={() => setSelectedError(log)}
                              sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700 }}
                            >
                              Ver Stack
                            </Button>
                            <Tooltip title="Eliminar Registro">
                              <IconButton 
                                size="small" 
                                color="error"
                                onClick={() => handleDeleteLog(log.id)}
                                disabled={deleteLogMutation.isPending}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      )}

      {tabValue === 2 && (
        <ProposalGenerator onProvisionTenant={handleProvisionFromProposal} />
      )}

      {tabValue === 3 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
                🛡️ Bitácora Forense Global en Tiempo Real (Usuarios, Direcciones IP y Operaciones)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Supervisa en vivo cada acción ejecutada en todas las empresas: quién lo hizo, desde qué dirección IP, navegador/dispositivo y qué operación realizó.
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <TextField
                size="small"
                placeholder="Buscar por usuario, IP, módulo o acción..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                sx={{ minWidth: 260 }}
              />
              <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => refetchAuditLogs()} sx={{ borderRadius: 2, fontWeight: 700 }}>
                Refrescar
              </Button>
            </Box>
          </Box>

          <Paper sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>Fecha / Hora</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Empresa (Tenant)</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Usuario</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Dirección IP</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Módulo</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Acción / Operación</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>HTTP</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Navegador / Sistema Operativo</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {securityAuditLogs
                    .filter((l: any) =>
                      !auditSearch ||
                      (l.username || '').toLowerCase().includes(auditSearch.toLowerCase()) ||
                      (l.ip_address || '').toLowerCase().includes(auditSearch.toLowerCase()) ||
                      (l.module || '').toLowerCase().includes(auditSearch.toLowerCase()) ||
                      (l.action || '').toLowerCase().includes(auditSearch.toLowerCase())
                    )
                    .map((log: any) => {
                      const tName = tenants.find((t: any) => t.id === log.tenant_id)?.name || (log.tenant_id ? `Empresa #${log.tenant_id}` : 'Global');
                      return (
                        <TableRow key={log.id} hover>
                          <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.78rem' }}>
                            {new Date(log.created_at).toLocaleString('es-VE')}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem' }}>{tName}</TableCell>
                          <TableCell sx={{ fontWeight: 800, color: 'primary.main' }}>{log.username}</TableCell>
                          <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{log.ip_address}</TableCell>
                          <TableCell>
                            <Chip label={log.module} size="small" variant="outlined" sx={{ fontWeight: 800, fontSize: '0.7rem' }} />
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>{log.action}</TableCell>
                          <TableCell>
                            <Chip
                              label={log.status_code || 200}
                              size="small"
                              color={(log.status_code || 200) < 400 ? 'success' : 'error'}
                              sx={{ fontWeight: 800, fontSize: '0.7rem' }}
                            />
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.72rem', color: 'text.secondary', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {log.user_agent}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  {securityAuditLogs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                        <Typography color="text.secondary" sx={{ fontWeight: 600 }}>
                          Aún no hay eventos registrados en la bitácora forense global.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      )}

      {/* Create Tenant Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{t('Add New Client Company')}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField 
              label={t('Company Name')} 
              fullWidth 
              value={newCompany.name} 
              onChange={(e) => setNewCompany({...newCompany, name: e.target.value})} 
            />
            <TextField 
              label={t('Contact Email')} 
              fullWidth 
              value={newCompany.email} 
              onChange={(e) => setNewCompany({...newCompany, email: e.target.value})} 
            />
            <TextField 
              label={t('Tax ID')} 
              fullWidth 
              value={newCompany.tax_id} 
              onChange={(e) => setNewCompany({...newCompany, tax_id: e.target.value})} 
            />

            <Button
              variant="outlined"
              component="label"
              sx={{ mt: 1, borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
            >
              Subir Logo de la Empresa
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleLogoChange}
              />
            </Button>
            {newCompany.logo_url && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                <img 
                  src={newCompany.logo_url} 
                  alt="Logo Preview" 
                  style={{ maxHeight: 60, borderRadius: '8px', objectFit: 'contain' }} 
                />
              </Box>
            )}
            
            <FormControl fullWidth sx={{ mt: 1 }}>
              <InputLabel id="modules-label">Módulos Comprados</InputLabel>
              <Select
                labelId="modules-label"
                multiple
                value={newCompany.modules}
                onChange={(e) => {
                  const value = e.target.value;
                  let newModules = typeof value === 'string' ? value.split(',') : value;
                  // Regla de Negocio: Administrativo e Inventario se venden y operan en bundle
                  if (newModules.includes('admin') && !newModules.includes('inventory')) {
                    newModules.push('inventory');
                  } else if (newModules.includes('inventory') && !newModules.includes('admin')) {
                    newModules.push('admin');
                  }
                  setNewCompany({...newCompany, modules: newModules});
                }}
                input={<OutlinedInput label="Módulos Comprados" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={AVAILABLE_MODULES.find(m => m.id === value)?.label || value} size="small" />
                    ))}
                  </Box>
                )}
              >
                {AVAILABLE_MODULES.map((mod) => (
                  <MenuItem key={mod.id} value={mod.id}>
                    <Checkbox checked={newCompany.modules.indexOf(mod.id) > -1} />
                    <ListItemText primary={mod.label} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Divider sx={{ my: 1 }}>Arquitectura de Base de Datos (Modo Híbrido)</Divider>

            <FormControl fullWidth size="small">
              <InputLabel>Modo de Base de Datos del Cliente</InputLabel>
              <Select
                label="Modo de Base de Datos del Cliente"
                value={dbMode}
                onChange={(e) => {
                  const val = e.target.value as 'shared' | 'dedicated';
                  setDbMode(val);
                  if (val === 'shared') {
                    setNewCompany({ ...newCompany, custom_database_url: '' });
                  }
                }}
              >
                <MenuItem value="shared">⚡ Pool Único Multi-Esquema (Estándar — Sin costo extra)</MenuItem>
                <MenuItem value="dedicated">🏢 Base de Datos Dedicada VIP (Servidor / BD Exclusiva)</MenuItem>
              </Select>
            </FormControl>

            {dbMode === 'dedicated' && (
              <TextField
                label="URL de Base de Datos PostgreSQL Dedicada"
                placeholder="postgresql+asyncpg://usuario:clave@host:5432/bd_cliente"
                fullWidth
                size="small"
                value={newCompany.custom_database_url}
                onChange={(e) => setNewCompany({ ...newCompany, custom_database_url: e.target.value })}
                helperText="El ERP creará todas las tablas automáticamente en esta base de datos exclusiva."
              />
            )}

            <Divider sx={{ my: 1 }}>Datos de Acceso Administrador</Divider>

            <TextField 
              label="Usuario Administrador" 
              fullWidth 
              placeholder="ej: admin_empresa"
              value={newCompany.admin_username} 
              onChange={(e) => setNewCompany({...newCompany, admin_username: e.target.value})} 
            />
            <TextField 
              label="Contraseña Inicial" 
              type="password"
              fullWidth 
              value={newCompany.admin_password} 
              onChange={(e) => setNewCompany({...newCompany, admin_password: e.target.value})} 
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpen(false)} color="inherit">{t('Cancel')}</Button>
          <Button 
            variant="contained" 
            onClick={() => createTenantMutation.mutate(newCompany)}
            disabled={!newCompany.name || !newCompany.email || !newCompany.admin_username || !newCompany.admin_password}
            loading={createTenantMutation.isPending}
          >
            {t('Create Company')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Details Modal */}
      <Dialog 
        open={Boolean(selectedError)} 
        onClose={() => setSelectedError(null)} 
        maxWidth="md" 
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 4, bgcolor: '#0f172a', color: '#f8fafc', p: 1 } } }}
      >
        <DialogTitle sx={{ fontWeight: 800, borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', gap: 1 }}>
          <TerminalIcon /> Reporte Técnico del Incidente
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {selectedError && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>Usuario Activo</Typography>
                  <Typography sx={{ fontWeight: 700 }}>{selectedError.username || 'Invitado/Anónimo'}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>Inquilino ID / Tenant</Typography>
                  <Typography sx={{ fontWeight: 700 }}>{selectedError.tenant_id ? `Empresa ID #${selectedError.tenant_id}` : 'Global/Público'}</Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>URL de Origen</Typography>
                  <Typography sx={{ fontFamily: 'monospace', fontSize: '0.9rem', color: '#38bdf8' }}>{selectedError.url}</Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>Navegador / User Agent</Typography>
                  <Typography sx={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>{selectedError.user_agent}</Typography>
                </Grid>
              </Grid>

              <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

              <Typography variant="body2" sx={{ fontWeight: 800, color: '#ef4444' }}>Mensaje de Error:</Typography>
              <Paper sx={{ p: 2, bgcolor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 2 }}>
                <Typography sx={{ fontFamily: 'monospace', fontWeight: 700, color: '#fca5a5' }}>
                  {selectedError.error_message}
                </Typography>
              </Paper>

              <Typography variant="body2" sx={{ fontWeight: 800, color: '#38bdf8' }}>Traza del Error / Stack Trace & Payload:</Typography>
              <Paper sx={{ p: 2, bgcolor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2, maxHeight: 220, overflow: 'auto' }}>
                <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.82rem', color: '#cbd5e1', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {selectedError.error_stack}
                </pre>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <Button onClick={() => setSelectedError(null)} color="inherit" sx={{ fontWeight: 700, color: 'white' }}>
            Cerrar Diagnóstico
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Tenant Modules Modal */}
      <Dialog
        open={Boolean(modulesModalTenant)}
        onClose={() => setModulesModalTenant(null)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: '16px' } } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          Módulos y Licencia — {modulesModalTenant?.name}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mb: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <TextField
              label="Fecha de Vencimiento de Licencia"
              type="date"
              fullWidth
              size="small"
              slotProps={{ inputLabel: { shrink: true } }}
              value={editingLicenseDate}
              onChange={(e) => setEditingLicenseDate(e.target.value)}
              helperText="Deja vacío para mantener la fecha actual o elige una nueva fecha límite."
            />
            <FormControlLabel
              control={
                <Switch
                  checked={editingIsActive}
                  onChange={(e) => setEditingIsActive(e.target.checked)}
                  color="success"
                />
              }
              label={
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {editingIsActive ? 'Empresa Activa' : 'Empresa Suspendida'}
                </Typography>
              }
            />
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Activa o desactiva los módulos contratados por este cliente:
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {AVAILABLE_MODULES.map((mod) => {
              const isBase = mod.id === 'admin' || mod.id === 'inventory';
              const checked = editingModules.includes(mod.id);
              return (
                <Paper
                  key={mod.id}
                  variant="outlined"
                  sx={{ px: 1.5, py: 0.6, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <FormControlLabel
                    control={
                      <Switch
                        checked={checked}
                        disabled={isBase}
                        onChange={() => handleToggleModuleSwitch(mod.id)}
                        color="primary"
                      />
                    }
                    label={
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {mod.label}
                      </Typography>
                    }
                    sx={{ width: '100%', m: 0 }}
                  />
                </Paper>
              );
            })}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setModulesModalTenant(null)} color="inherit" disabled={updateModulesMutation.isPending}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveTenantModules}
            disabled={updateModulesMutation.isPending}
            sx={{ borderRadius: '10px', fontWeight: 700 }}
          >
            {updateModulesMutation.isPending ? 'Guardando...' : 'Guardar Módulos'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={adminToast.open}
        autoHideDuration={4000}
        onClose={() => setAdminToast((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={adminToast.severity} variant="filled" onClose={() => setAdminToast((p) => ({ ...p, open: false }))}>
          {adminToast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
