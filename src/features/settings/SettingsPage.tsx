import { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Grid, TextField, Button, 
  Avatar, Divider, Alert, CircularProgress, FormControl, InputLabel, Select, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, FormControlLabel, Checkbox, Chip
} from '@mui/material';
import { 
  Business as BusinessIcon, 
  Save as SaveIcon,
  Security as SecurityIcon,
  Help as HelpIcon,
  Print as PrintIcon,
  FileDownload as DownloadIcon,
  AccountBalance as AccountBalanceIcon,
  CloudUpload as CloudApiIcon,
  Code as JsonIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { QRCodeCanvas } from 'qrcode.react';
import api from '../../api/axiosConfig';
import { useAppStore } from '../../store/useAppStore';

export default function SettingsPage() {
  const { t } = useTranslation();
  const [agentStatus, setAgentStatus] = useState<'connected' | 'disconnected' | 'checking'>('disconnected');
  const [pwdForm, setPwdForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [pwdFeedback, setPwdFeedback] = useState<{ text: string; severity: 'success' | 'error' } | null>(null);
  const [totpSetup, setTotpSetup] = useState<{ secret: string; otpauth_uri: string } | null>(null);
  const [totpCodeInput, setTotpCodeInput] = useState('');
  const [totpFeedback, setTotpFeedback] = useState<{ text: string; severity: 'success' | 'error' } | null>(null);

  const { data: secStatus, refetch: refetchSecStatus } = useQuery({
    queryKey: ['auth-security-status'],
    queryFn: async () => (await api.get('/auth/security-status')).data,
  });

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
  const [testingApi, setTestingApi] = useState(false);
  const [apiTestResult, setApiTestResult] = useState<any>(null);
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

  const digitalApiCfg = formData.settings?.digital_invoice_api || {
    enabled: false,
    provider_name: 'custom_rest',
    environment: 'sandbox',
    endpoint_url: '',
    auth_type: 'bearer',
    api_header_name: 'X-API-Key',
    api_token: '',
    auto_send_on_sale: true,
  };

  const updateDigitalApiCfg = (patch: Record<string, any>) => {
    setFormData((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        digital_invoice_api: {
          ...(prev.settings?.digital_invoice_api || digitalApiCfg),
          ...patch,
        },
      },
    }));
  };

  const handleTestDigitalInvoiceApi = async () => {
    setTestingApi(true);
    try {
      const res = await api.post('/sales/digital-invoice/test-connection', digitalApiCfg);
      setApiTestResult(res.data);
    } catch (err: any) {
      setApiTestResult({
        status: 'error',
        message: err.response?.data?.detail || 'Error al probar la conexión con la API de Facturación Digital',
      });
    } finally {
      setTestingApi(false);
    }
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

            <Button
              variant="contained"
              color="info"
              fullWidth
              sx={{ mt: 2, borderRadius: '12px', textTransform: 'none', fontWeight: 800 }}
              onClick={() => window.dispatchEvent(new CustomEvent('open-apex-induction-agent'))}
            >
              🎙️ Iniciar Agente de Inducción con Audio Ahora
            </Button>

            <Button
              variant="outlined"
              color="success"
              fullWidth
              sx={{ mt: 1.2, borderRadius: '12px', textTransform: 'none', fontWeight: 800 }}
              onClick={async () => {
                try {
                  const res = await api.post('/tenants/seed-demo');
                  queryClient.invalidateQueries();
                  alert(res.data?.message || 'Datos de demostración cargados exitosamente.');
                } catch (err: any) {
                  alert(err.response?.data?.detail || 'Error al cargar datos de demostración.');
                }
              }}
            >
              🏢 Cargar / Restaurar Datos de Empresa Demo (Venezuela)
            </Button>
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

          {/* Card 5: Integración API REST — Facturación Digital (Imprenta Digital SENIAT) */}
          <Paper sx={{ p: 4, borderRadius: 4, mt: 3, border: '1.5px solid', borderColor: 'primary.200' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ bgcolor: 'secondary.main', width: 40, height: 40 }}>
                  <CloudApiIcon sx={{ fontSize: 20 }} />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                    API Facturación Digital
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    Imprenta Digital Autorizada SENIAT (JSON / REST)
                  </Typography>
                </Box>
              </Box>
              <Chip
                size="small"
                label={digitalApiCfg.enabled ? 'ACTIVA' : 'INACTIVA'}
                color={digitalApiCfg.enabled ? 'success' : 'default'}
                sx={{ fontWeight: 800 }}
              />
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Configura la API REST de la empresa proveedora de Facturación Digital para enviar automáticamente el JSON de cada factura según la normativa del SENIAT.
            </Typography>

            <FormControlLabel
              control={
                <Checkbox
                  checked={Boolean(digitalApiCfg.enabled)}
                  onChange={(e) => updateDigitalApiCfg({ enabled: e.target.checked })}
                />
              }
              label={<Typography variant="body2" sx={{ fontWeight: 700 }}>Habilitar Integración API REST de Factura Digital</Typography>}
              sx={{ mb: 1.5 }}
            />

            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Proveedor / Imprenta Digital</InputLabel>
              <Select
                label="Proveedor / Imprenta Digital"
                value={digitalApiCfg.provider_name || 'custom_rest'}
                onChange={(e) => updateDigitalApiCfg({ provider_name: e.target.value })}
              >
                <MenuItem value="custom_rest">API REST Estándar / Proveedor Personalizado (JSON)</MenuItem>
                <MenuItem value="tfhka">The Factory HKA Digital (TFHKA Venezuela)</MenuItem>
                <MenuItem value="unidigital">Unidigital Imprenta Digital SENIAT</MenuItem>
                <MenuItem value="imprenta_seniat">Servycal / Imprenta Digital Homologada</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Entorno de Emisión</InputLabel>
              <Select
                label="Entorno de Emisión"
                value={digitalApiCfg.environment || 'sandbox'}
                onChange={(e) => updateDigitalApiCfg({ environment: e.target.value })}
              >
                <MenuItem value="sandbox">🛠️ Sandbox / Homologación (Pruebas)</MenuItem>
                <MenuItem value="production">🚀 Producción (Emisión Fiscal Oficial SENIAT)</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="URL del Endpoint API REST (POST)"
              placeholder="https://api.imprentadigital.com.ve/v1/facturas/emitir"
              fullWidth
              size="small"
              value={digitalApiCfg.endpoint_url || ''}
              onChange={(e) => updateDigitalApiCfg({ endpoint_url: e.target.value })}
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Tipo de Autenticación</InputLabel>
              <Select
                label="Tipo de Autenticación"
                value={digitalApiCfg.auth_type || 'bearer'}
                onChange={(e) => updateDigitalApiCfg({ auth_type: e.target.value })}
              >
                <MenuItem value="bearer">Bearer Token (Authorization: Bearer ...)</MenuItem>
                <MenuItem value="api_key">API Key en Cabecera (X-API-Key)</MenuItem>
                <MenuItem value="basic">Basic Auth</MenuItem>
              </Select>
            </FormControl>

            {digitalApiCfg.auth_type === 'api_key' && (
              <TextField
                label="Nombre del Header API Key"
                placeholder="X-API-Key"
                fullWidth
                size="small"
                value={digitalApiCfg.api_header_name || 'X-API-Key'}
                onChange={(e) => updateDigitalApiCfg({ api_header_name: e.target.value })}
                sx={{ mb: 2 }}
              />
            )}

            <TextField
              label="Token / API Key del Proveedor"
              type="password"
              placeholder="Ingrese el token o credencial provista por la imprenta digital"
              fullWidth
              size="small"
              value={digitalApiCfg.api_token || ''}
              onChange={(e) => updateDigitalApiCfg({ api_token: e.target.value })}
              sx={{ mb: 1.5 }}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={digitalApiCfg.auto_send_on_sale !== false}
                  onChange={(e) => updateDigitalApiCfg({ auto_send_on_sale: e.target.checked })}
                />
              }
              label={<Typography variant="caption" sx={{ fontWeight: 600 }}>Enviar JSON automáticamente al emitir factura en POS / Facturación Manual</Typography>}
              sx={{ mb: 2 }}
            />

            <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
              <Button
                variant="outlined"
                color="secondary"
                fullWidth
                startIcon={<JsonIcon />}
                onClick={handleTestDigitalInvoiceApi}
                disabled={testingApi}
                sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 700 }}
              >
                {testingApi ? 'Probando API y generando JSON...' : 'Probar Envío JSON / Ver Estructura SENIAT'}
              </Button>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                startIcon={<SaveIcon />}
                onClick={() => updateMutation.mutate(formData)}
                disabled={updateMutation.isPending}
                sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 700 }}
              >
                Guardar Configuración API Digital
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Card 7: Seguridad de Cuenta (Contraseña y 2FA Google Authenticator) */}
        <Grid size={12}>
          <Paper sx={{ p: 4, borderRadius: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ bgcolor: 'error.main', width: 42, height: 42 }}>
                  <SecurityIcon sx={{ fontSize: 22 }} />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    Seguridad Blindada de Cuenta (Contraseña y 2FA Google Authenticator)
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Protege tu acceso con una clave fuerte y verificación en 2 pasos (TOTP)
                  </Typography>
                </Box>
              </Box>
              {secStatus?.is_superuser && (
                <Chip
                  size="small"
                  color={secStatus?.secret_key_configured ? 'success' : 'warning'}
                  label={
                    secStatus?.secret_key_configured
                      ? '🔐 SECRET_KEY Segura Configurada'
                      : '⚠️ Configura SECRET_KEY (>=32 chars) en Render'
                  }
                  sx={{ fontWeight: 800 }}
                />
              )}
            </Box>

            <Grid container spacing={4}>
              {/* Cambiar Contraseña */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2 }}>
                  1. Cambiar Mi Contraseña
                </Typography>
                {pwdFeedback && (
                  <Alert severity={pwdFeedback.severity} sx={{ mb: 2, fontWeight: 600 }}>
                    {pwdFeedback.text}
                  </Alert>
                )}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <TextField
                    size="small"
                    type="password"
                    label="Contraseña Actual"
                    value={pwdForm.current_password}
                    onChange={(e) => setPwdForm({ ...pwdForm, current_password: e.target.value })}
                  />
                  <TextField
                    size="small"
                    type="password"
                    label="Nueva Contraseña (mín. 8 caracteres)"
                    value={pwdForm.new_password}
                    onChange={(e) => setPwdForm({ ...pwdForm, new_password: e.target.value })}
                  />
                  <TextField
                    size="small"
                    type="password"
                    label="Confirmar Nueva Contraseña"
                    value={pwdForm.confirm_password}
                    onChange={(e) => setPwdForm({ ...pwdForm, confirm_password: e.target.value })}
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={async () => {
                      setPwdFeedback(null);
                      if (pwdForm.new_password.length < 8) {
                        setPwdFeedback({ text: 'La nueva contraseña debe tener al menos 8 caracteres.', severity: 'error' });
                        return;
                      }
                      if (pwdForm.new_password !== pwdForm.confirm_password) {
                        setPwdFeedback({ text: 'Las contraseñas nuevas no coinciden.', severity: 'error' });
                        return;
                      }
                      try {
                        const res = await api.post('/auth/change-password', {
                          current_password: pwdForm.current_password,
                          new_password: pwdForm.new_password,
                        });
                        setPwdFeedback({ text: res.data?.detail || 'Contraseña actualizada.', severity: 'success' });
                        setPwdForm({ current_password: '', new_password: '', confirm_password: '' });
                      } catch (err: any) {
                        setPwdFeedback({ text: err.response?.data?.detail || 'Error al actualizar contraseña.', severity: 'error' });
                      }
                    }}
                    sx={{ borderRadius: '12px', fontWeight: 800, alignSelf: 'flex-start', px: 3 }}
                  >
                    Actualizar Contraseña
                  </Button>
                </Box>
              </Grid>

              {/* 2FA Google Authenticator */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                    2. Autenticación de 2 Factores (Google Authenticator)
                  </Typography>
                  <Chip
                    size="small"
                    color={secStatus?.totp_enabled ? 'success' : 'default'}
                    label={secStatus?.totp_enabled ? '✅ 2FA Activo' : 'Desactivado'}
                    sx={{ fontWeight: 800 }}
                  />
                </Box>
                {totpFeedback && (
                  <Alert severity={totpFeedback.severity} sx={{ mb: 2, fontWeight: 600 }}>
                    {totpFeedback.text}
                  </Alert>
                )}

                {!secStatus?.totp_enabled ? (
                  !totpSetup ? (
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Escanea un código QR con <strong>Google Authenticator</strong> o <strong>Authy</strong> para pedir un código de 6 dígitos cada vez que inicies sesión.
                      </Typography>
                      <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<SecurityIcon />}
                        onClick={async () => {
                          setTotpFeedback(null);
                          try {
                            const res = await api.post('/auth/2fa/setup');
                            setTotpSetup(res.data);
                          } catch (err: any) {
                            setTotpFeedback({ text: err.response?.data?.detail || 'Error generando QR 2FA.', severity: 'error' });
                          }
                        }}
                        sx={{ borderRadius: '12px', fontWeight: 800 }}
                      >
                        Activar 2FA (Generar QR)
                      </Button>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, alignItems: 'flex-start' }}>
                      <Box sx={{ p: 1.5, bgcolor: '#fff', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                        <QRCodeCanvas value={totpSetup.otpauth_uri} size={160} />
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        Clave manual: <strong style={{ fontFamily: 'monospace' }}>{totpSetup.secret}</strong>
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', width: '100%', maxWidth: 340 }}>
                        <TextField
                          size="small"
                          label="Código de 6 dígitos"
                          value={totpCodeInput}
                          onChange={(e) => setTotpCodeInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          fullWidth
                        />
                        <Button
                          variant="contained"
                          color="success"
                          onClick={async () => {
                            setTotpFeedback(null);
                            try {
                              const res = await api.post('/auth/2fa/enable', { code: totpCodeInput });
                              setTotpFeedback({ text: res.data?.detail || '2FA activado.', severity: 'success' });
                              setTotpSetup(null);
                              setTotpCodeInput('');
                              refetchSecStatus();
                            } catch (err: any) {
                              setTotpFeedback({ text: err.response?.data?.detail || 'Código incorrecto.', severity: 'error' });
                            }
                          }}
                          sx={{ borderRadius: '10px', fontWeight: 800, whiteSpace: 'nowrap' }}
                        >
                          Confirmar 2FA
                        </Button>
                      </Box>
                    </Box>
                  )
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, alignItems: 'flex-start' }}>
                    <Typography variant="body2" color="text.secondary">
                      Tu cuenta exige el código de 6 dígitos de Google Authenticator al iniciar sesión.
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', width: '100%', maxWidth: 360 }}>
                      <TextField
                        size="small"
                        label="Código 2FA actual para desactivar"
                        value={totpCodeInput}
                        onChange={(e) => setTotpCodeInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        fullWidth
                      />
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={async () => {
                          setTotpFeedback(null);
                          try {
                            const res = await api.post('/auth/2fa/disable', { code: totpCodeInput });
                            setTotpFeedback({ text: res.data?.detail || '2FA desactivado.', severity: 'success' });
                            setTotpCodeInput('');
                            refetchSecStatus();
                          } catch (err: any) {
                            setTotpFeedback({ text: err.response?.data?.detail || 'Código inválido.', severity: 'error' });
                          }
                        }}
                        sx={{ borderRadius: '10px', fontWeight: 800, whiteSpace: 'nowrap' }}
                      >
                        Desactivar 2FA
                      </Button>
                    </Box>
                  </Box>
                )}
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Modal de Prueba y Previsualización del JSON Fiscal SENIAT */}
      <Dialog open={Boolean(apiTestResult)} onClose={() => setApiTestResult(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          Resultado de Prueba API REST — Facturación Digital SENIAT
        </DialogTitle>
        <DialogContent dividers>
          {apiTestResult && (
            <Box>
              <Alert
                severity={apiTestResult.status === 'error' ? 'error' : apiTestResult.status === 'warning' ? 'warning' : 'success'}
                sx={{ mb: 2, fontWeight: 600 }}
              >
                {apiTestResult.message}
              </Alert>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
                Estructura JSON Estándar Enviada a la Proveedora de Facturación Digital:
              </Typography>
              <Box
                component="pre"
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: '#0f172a',
                  color: '#e2e8f0',
                  fontSize: '0.75rem',
                  overflowX: 'auto',
                  maxHeight: 380,
                }}
              >
                {JSON.stringify(apiTestResult.sample_json || apiTestResult, null, 2)}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setApiTestResult(null)} variant="contained">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
