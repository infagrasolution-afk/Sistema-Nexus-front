import { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Grid, TextField, Button, 
  Avatar, Divider, Alert, CircularProgress, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { 
  Business as BusinessIcon, 
  Save as SaveIcon,
  Security as SecurityIcon,
  Help as HelpIcon,
  Print as PrintIcon,
  FileDownload as DownloadIcon,
  AccountBalance as AccountBalanceIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../../api/axiosConfig';
import { useAppStore } from '../../store/useAppStore';

export default function SettingsPage() {
  const { t } = useTranslation();
  const [agentStatus, setAgentStatus] = useState<'connected' | 'disconnected' | 'checking'>('disconnected');

  useEffect(() => {
    let intervalId: any;
    
    const checkStatus = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const response = await fetch('http://localhost:8080/status', { 
          method: 'GET',
          signal: controller.signal,
          mode: 'cors'
        });
        clearTimeout(timeoutId);
        if (response.ok) {
          setAgentStatus('connected');
        } else {
          setAgentStatus('disconnected');
        }
      } catch (e) {
        setAgentStatus('disconnected');
      }
    };

    checkStatus();
    intervalId = setInterval(checkStatus, 5000);

    return () => clearInterval(intervalId);
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    tax_id: '',
    phone: '',
    address: '',
    logo_url: '',
    primary_color: '#2563eb',
    secondary_color: '#64748b',
    settings: { session_timeout: 5 } as any
  });
  const [success, setSuccess] = useState(false);
  const [wizardEnabled, setWizardEnabled] = useState(() => {
    return localStorage.getItem('apex_wizard_enabled') !== 'false' ? 'true' : 'false';
  });
  
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
        secondary_color: tenant.secondary_color || '#64748b',
        settings: tenant.settings || {}
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
          {/* Card 1: Personalización de Marca */}
          <Paper sx={{ p: 4, borderRadius: 4, textAlign: 'center', mb: 3 }}>
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

          {/* Card 2: Seguridad y Sesión */}
          <Paper sx={{ p: 4, borderRadius: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <Avatar sx={{ bgcolor: 'error.main', width: 40, height: 40 }}>
                <SecurityIcon sx={{ fontSize: 20 }} />
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Seguridad y Sesión</Typography>
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
              Administra el tiempo límite de inactividad antes de que la sesión se cierre automáticamente.
            </Typography>

            <FormControl fullWidth size="small">
              <InputLabel id="session-timeout-label">Tiempo de Sesión</InputLabel>
              <Select
                labelId="session-timeout-label"
                label="Tiempo de Sesión"
                value={formData.settings?.session_timeout || 5}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setFormData({
                    ...formData,
                    settings: {
                      ...formData.settings,
                      session_timeout: val
                    }
                  });
                }}
              >
                <MenuItem value={5}>5 Minutos (Por defecto)</MenuItem>
                <MenuItem value={15}>15 Minutos</MenuItem>
                <MenuItem value={30}>30 Minutos</MenuItem>
                <MenuItem value={60}>1 Hora</MenuItem>
                <MenuItem value={120}>2 Horas</MenuItem>
                <MenuItem value={240}>4 Horas</MenuItem>
                <MenuItem value={480}>8 Horas (Día Completo)</MenuItem>
                <MenuItem value={1440}>24 Horas (1 Día)</MenuItem>
              </Select>
            </FormControl>

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
              Mantener las sesiones abiertas por más tiempo ayuda a evitar cierres e interrupciones constantes.
            </Typography>
          </Paper>

          {/* Card 2.5: Contabilidad Automática vs Manual */}
          <Paper sx={{ p: 4, borderRadius: 4, mt: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <Avatar sx={{ bgcolor: 'warning.main', width: 40, height: 40 }}>
                <AccountBalanceIcon sx={{ fontSize: 20 }} />
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Contabilidad (Libro Diario)</Typography>
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
              Elige si deseas que el sistema genere los Asientos de Diario de manera automática o si prefieres registrarlos de forma manual.
            </Typography>

            <FormControl fullWidth size="small">
              <InputLabel id="accounting-mode-label">Modo de Contabilidad</InputLabel>
              <Select
                labelId="accounting-mode-label"
                label="Modo de Contabilidad"
                value={formData.settings?.accounting_mode || 'manual'}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    settings: {
                      ...formData.settings,
                      accounting_mode: e.target.value
                    }
                  });
                }}
              >
                <MenuItem value="manual">Manual (Por Defecto)</MenuItem>
                <MenuItem value="automatic">Automática (Sugerido)</MenuItem>
              </Select>
            </FormControl>

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
              Nota: El módulo de Cuentas por Cobrar y por Pagar seguirá funcionando de forma automática independientemente del modo que elijas.
            </Typography>
          </Paper>

          {/* Card 3: Asistente de Bienvenida (Wizard) */}
          <Paper sx={{ p: 4, borderRadius: 4, mt: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <Avatar sx={{ bgcolor: 'info.main', width: 40, height: 40 }}>
                <HelpIcon sx={{ fontSize: 20 }} />
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Asistente Guiado</Typography>
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
              Activa o desactiva el asistente interactivo paso a paso que aparece al iniciar sesión en el sistema.
            </Typography>

            <FormControl fullWidth size="small">
              <InputLabel id="wizard-status-label">Mostrar Asistente</InputLabel>
              <Select
                labelId="wizard-status-label"
                label="Mostrar Asistente"
                value={wizardEnabled}
                onChange={(e) => {
                  const val = e.target.value;
                  setWizardEnabled(val);
                  localStorage.setItem('apex_wizard_enabled', val);
                }}
              >
                <MenuItem value="true">Activo (Mostrar en cada inicio)</MenuItem>
                <MenuItem value="false">Oculto definitivo (Desactivado)</MenuItem>
              </Select>
            </FormControl>
          </Paper>

          {/* Card 4: Impresión Fiscal SENIAT */}
          <Paper sx={{ p: 4, borderRadius: 4, mt: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                <PrintIcon sx={{ fontSize: 20 }} />
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Impresión Fiscal SENIAT</Typography>
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
              Vincula APEX ERP con impresoras fiscales autorizadas usando nuestro Agente de Enlace Local.
            </Typography>

            <FormControl fullWidth size="small" sx={{ mb: 2.5 }}>
              <InputLabel id="printer-brand-label">Marca de la Impresora</InputLabel>
              <Select
                labelId="printer-brand-label"
                label="Marca de la Impresora"
                value={formData.settings?.fiscal_printer_brand || 'none'}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    settings: {
                      ...formData.settings,
                      fiscal_printer_brand: e.target.value
                    }
                  });
                }}
              >
                <MenuItem value="none">Ninguna (Formatos Libres / Ticket Digital)</MenuItem>
                <MenuItem value="hka">The Factory HKA (Clásicas / Nuevas)</MenuItem>
                <MenuItem value="bematech">Bematech</MenuItem>
                <MenuItem value="bixolon">Bixolon / SRP</MenuItem>
                <MenuItem value="aclas">Aclas</MenuItem>
              </Select>
            </FormControl>

            {formData.settings?.fiscal_printer_brand && formData.settings?.fiscal_printer_brand !== 'none' && (
              <TextField
                label="Puerto de Conexión (ej: COM1, USB001)"
                fullWidth
                size="small"
                value={formData.settings?.fiscal_printer_port || 'COM1'}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    settings: {
                      ...formData.settings,
                      fiscal_printer_port: e.target.value
                    }
                  });
                }}
                sx={{ mb: 2.5 }}
              />
            )}

            {/* Connection Status Indicator */}
            <Box sx={{ 
              p: 2, 
              mb: 3, 
              borderRadius: 3, 
              border: '1px solid', 
              borderColor: agentStatus === 'connected' ? 'success.main' : 'divider',
              bgcolor: agentStatus === 'connected' ? 'rgba(46, 125, 50, 0.05)' : 'rgba(0, 0, 0, 0.02)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ 
                  width: 10, 
                  height: 10, 
                  borderRadius: '50%', 
                  bgcolor: agentStatus === 'connected' ? 'success.main' : 'error.main',
                  boxShadow: agentStatus === 'connected' ? '0 0 10px #2e7d32' : 'none',
                  animation: agentStatus === 'connected' ? 'pulse 2s infinite' : 'none',
                  '@keyframes pulse': {
                    '0%': { transform: 'scale(0.95)', boxShadow: '0 0 0 0 rgba(46, 125, 50, 0.7)' },
                    '70%': { transform: 'scale(1)', boxShadow: '0 0 0 6px rgba(46, 125, 50, 0)' },
                    '100%': { transform: 'scale(0.95)', boxShadow: '0 0 0 0 rgba(46, 125, 50, 0)' }
                  }
                }} />
                <Typography variant="body2" sx={{ fontWeight: 700, color: agentStatus === 'connected' ? 'success.dark' : 'text.secondary' }}>
                  {agentStatus === 'connected' ? 'Agente Local Activo' : 'Agente Local Desconectado'}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                Puerto: 8080
              </Typography>
            </Box>

            <Button
              variant="outlined"
              fullWidth
              startIcon={<DownloadIcon />}
              href={(api.defaults.baseURL || '').replace('/api/v1', '') + '/static/downloads/nexus-fiscal-connector.exe'}
              download
              sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 700 }}
            >
              Descargar Agente Fiscal (Windows)
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
