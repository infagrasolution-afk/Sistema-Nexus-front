import { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Grid, TextField, Button, 
  Avatar, Divider, Alert, CircularProgress 
} from '@mui/material';
import { 
  Business as BusinessIcon, 
  Save as SaveIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../../api/axiosConfig';
import { useAppStore } from '../../store/useAppStore';

export default function SettingsPage() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    tax_id: '',
    phone: '',
    address: '',
    logo_url: '',
    primary_color: '#2563eb',
    secondary_color: '#64748b'
  });
  const [success, setSuccess] = useState(false);
  
  const queryClient = useQueryClient();

  const { data: tenant, isLoading } = useQuery({
    queryKey: ['tenant-me'],
    queryFn: async () => {
      const response = await api.get('/tenants/me');
      return response.data;
    },
  });

  useEffect(() => {
    if (tenant) {
      setFormData({
        name: tenant.name || '',
        tax_id: tenant.tax_id || '',
        phone: tenant.phone || '',
        address: tenant.address || '',
        logo_url: tenant.logo_url || '',
        primary_color: tenant.primary_color || '#2563eb',
        secondary_color: tenant.secondary_color || '#64748b'
      });
    }
  }, [tenant]);

  const updateMutation = useMutation({
    mutationFn: (updatedData: any) => api.put('/tenants/me', updatedData),
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ['tenant-me'] });
      queryClient.invalidateQueries({ queryKey: ['my-tenant'] });
      useAppStore.getState().setTenant(response.data); // Update store instantly!
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) return <CircularProgress />;

  return (
    <Box sx={{ p: 1 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>{t('Company Settings')}</Typography>
        <Typography variant="body2" color="text.secondary">{t('Manage your company profile and invoice details')}</Typography>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{t('Settings saved successfully')}</Alert>}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 4, borderRadius: 4 }}>
            <form onSubmit={handleSubmit}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                  <BusinessIcon />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>{t('General Information')}</Typography>
              </Box>

              <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label={t('Company Name')}
                    fullWidth
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label={t('Tax ID (RIF / NIT)')}
                    fullWidth
                    value={formData.tax_id}
                    onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label={t('Phone')}
                    fullWidth
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label={t('Business Address')}
                    fullWidth
                    multiline
                    rows={3}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 4 }} />

              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button 
                  type="submit" 
                  variant="contained" 
                  size="large" 
                  startIcon={<SaveIcon />}
                  loading={updateMutation.isPending}
                  sx={{ borderRadius: 2, px: 4 }}
                >
                  {t('Save Changes')}
                </Button>
              </Box>
            </form>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 4, borderRadius: 4, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>{t('Personalización de Marca')}</Typography>
            <Avatar 
              src={formData.logo_url} 
              sx={{ width: 120, height: 120, mx: 'auto', mb: 3, borderRadius: 2, bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider' }}
            >
              {!formData.logo_url && <BusinessIcon sx={{ fontSize: 60, color: 'text.disabled' }} />}
            </Avatar>
            
            <TextField
              label="URL del Logo"
              fullWidth
              size="small"
              value={formData.logo_url}
              onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
              sx={{ mb: 3 }}
            />

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 1 }}>Color Primario</Typography>
                <input 
                  type="color" 
                  value={formData.primary_color} 
                  onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                  style={{ width: '100%', height: '40px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 1 }}>Color Secundario</Typography>
                <input 
                  type="color" 
                  value={formData.secondary_color} 
                  onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                  style={{ width: '100%', height: '40px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                />
              </Grid>
            </Grid>

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
              Los colores y el logo se aplicarán a la interfaz y a todos los documentos impresos.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
