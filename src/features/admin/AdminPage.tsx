import { useState } from 'react';
import { 
  Box, Typography, Grid, Paper, Card, CardContent, Button, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem, OutlinedInput, Checkbox, ListItemText, Divider
} from '@mui/material';
import { 
  Business as BusinessIcon, 
  People as PeopleIcon, 
  VpnKey as LicenseIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingIcon,
  Warning as WarningIcon,
  Login as LoginIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../../api/axiosConfig';

export default function AdminPage() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const AVAILABLE_MODULES = [
    { id: 'sales', label: 'Módulo de Ventas' },
    { id: 'inventory', label: 'Módulo de Inventario' },
    { id: 'accounting', label: 'Módulo Contable' },
    { id: 'users', label: 'Módulo Administrativo' },
  ];

  const [newCompany, setNewCompany] = useState({ 
    name: '', 
    email: '', 
    tax_id: '', 
    modules: ['sales', 'inventory', 'accounting', 'users'],
    admin_username: '',
    admin_password: '',
    logo_url: ''
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

  const { data: metrics } = useQuery({
    queryKey: ['admin-metrics'],
    queryFn: async () => (await api.get('/admin/dashboard')).data
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants'],
    queryFn: async () => (await api.get('/admin/tenants')).data
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
        logo_url: ''
      });
    }
  });

  const renewMutation = useMutation({
    mutationFn: (id: number) => api.post(`/admin/tenants/${id}/renew`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['admin-metrics'] });
    }
  });

  const dashboardCards = [
    { title: t('Total Companies'), value: metrics?.total_tenants || 0, icon: <BusinessIcon />, color: '#2563eb' },
    { title: t('Active Users'), value: metrics?.total_users || 0, icon: <PeopleIcon />, color: '#059669' },
    { title: t('Expiring Soon'), value: metrics?.expiring_soon || 0, icon: <WarningIcon />, color: '#d97706' },
    { title: t('Growth'), value: '+12%', icon: <TrendingIcon />, color: '#7c3aed' },
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

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>{t('SaaS Admin Control')}</Typography>
          <Typography variant="body2" color="text.secondary">{t('Global oversight of all companies')}</Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={() => setOpen(true)}
          sx={{ borderRadius: '12px', px: 3 }}
        >
          {t('New Client')}
        </Button>
      </Box>

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
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>{t('Company')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('License Key')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('Expiration')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('Status')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">{t('Actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tenants.map((tenant: any) => (
                <TableRow key={tenant.id} hover>
                  <TableCell>
                    <Typography sx={{ fontWeight: 600 }}>{tenant.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{tenant.email}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={tenant.license_key} 
                      size="small" 
                      icon={<LicenseIcon fontSize="small" />} 
                      sx={{ borderRadius: '6px', fontWeight: 600, fontFamily: 'monospace' }} 
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(tenant.subscription_end).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={tenant.is_active ? t('Active') : t('Suspended')} 
                      color={tenant.is_active ? 'success' : 'error'}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <Button 
                        startIcon={<LoginIcon />} 
                        size="small"
                        color="success"
                        variant="outlined"
                        onClick={() => handleAccessTenant(tenant.id, tenant.name)}
                        sx={{ borderRadius: 2, fontWeight: 600 }}
                      >
                        Acceder
                      </Button>
                      <Button 
                        startIcon={<RefreshIcon />} 
                        size="small" 
                        onClick={() => renewMutation.mutate(tenant.id)}
                        disabled={renewMutation.isPending}
                      >
                        {t('Renew')}
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

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
                  const newModules = typeof value === 'string' ? value.split(',') : value;
                  // Ensure 'users' is ALWAYS included if any other module is selected
                  if (newModules.length > 0 && !newModules.includes('users')) {
                    newModules.push('users');
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
    </Box>
  );
}
