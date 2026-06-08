import { useState } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Button, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, CircularProgress, Chip, Grid,
  MenuItem, Select, FormControl, InputLabel, Stepper, Step, StepLabel,
  InputAdornment
} from '@mui/material';
import { 
  Inventory as InventoryIcon, 
  Add as AddIcon, 
  Search as SearchIcon,
  Check as CheckIcon,
  PlayArrow as PlayIcon,
  Save as SaveIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axiosConfig';

export default function AuditsPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [selectedAudit, setSelectedAudit] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    warehouse_id: '',
    notes: ''
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [counts, setCounts] = useState<Record<number, string>>({});

  // Fetch Audits
  const { data: audits = [], isLoading: loadingAudits } = useQuery({
    queryKey: ['audits'],
    queryFn: async () => (await api.get('/inventory/audits')).data
  });

  // Fetch Warehouses for Creation
  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => (await api.get('/inventory/warehouses')).data
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/inventory/audits', data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['audits'] });
      setSelectedAudit(data);
      setActiveStep(1); // Move to count step
    },
    onError: (err: any) => alert(err.response?.data?.detail || 'Error al iniciar auditoría')
  });

  const saveCountMutation = useMutation({
    mutationFn: ({ auditId, data }: { auditId: number, data: any }) => 
      api.post(`/inventory/audits/${auditId}/details`, data),
    onSuccess: () => {
      // Don't invalidate full list to prevent heavy re-renders, just show success toast if we had one
    }
  });

  const applyMutation = useMutation({
    mutationFn: (auditId: number) => api.post(`/inventory/audits/${auditId}/apply`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audits'] });
      setOpen(false);
      alert('Auditoría aplicada exitosamente. Los ajustes de inventario se han generado.');
    },
    onError: (err: any) => alert(err.response?.data?.detail || 'Error al aplicar auditoría')
  });

  const handleOpenNew = () => {
    setFormData({ name: `Auditoría ${new Date().toLocaleDateString()}`, warehouse_id: '', notes: '' });
    setSelectedAudit(null);
    setCounts({});
    setActiveStep(0);
    setOpen(true);
  };

  const handleContinueAudit = (audit: any) => {
    setSelectedAudit(audit);
    const initialCounts: Record<number, string> = {};
    audit.details.forEach((d: any) => {
      if (d.counted_quantity !== null) {
        initialCounts[d.product_id] = d.counted_quantity.toString();
      }
    });
    setCounts(initialCounts);
    setActiveStep(1);
    setOpen(true);
  };

  const handleStartAudit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.warehouse_id) return alert('Completa los campos requeridos');
    createMutation.mutate(formData);
  };

  const handleCountChange = (productId: number, val: string) => {
    setCounts(prev => ({ ...prev, [productId]: val }));
    
    // Auto-save count
    if (val !== '' && !isNaN(Number(val))) {
      saveCountMutation.mutate({
        auditId: selectedAudit.id,
        data: { product_id: productId, counted_quantity: Number(val) }
      });
    }
  };

  const handleApply = () => {
    if (window.confirm('¿Estás seguro de finalizar esta auditoría? Esto aplicará cargos y descargos reales al inventario y no se puede deshacer.')) {
      applyMutation.mutate(selectedAudit.id);
    }
  };

  if (loadingAudits) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: '-1px', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <InventoryIcon color="primary" fontSize="large" />
            Auditoría de Inventario (Toma Física)
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mt: 0.5 }}>
            Realiza conteos físicos cíclicos o totales, identifica discrepancias y ajusta el sistema automáticamente.
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={handleOpenNew}
          sx={{ borderRadius: '12px', fontWeight: 800, py: 1.5, px: 3 }}
        >
          Nueva Auditoría
        </Button>
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
        <Table>
          <TableHead sx={{ bgcolor: 'action.hover' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 800 }}>Referencia / Nombre</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Fecha de Inicio</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Almacén</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Estado</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Progreso</TableCell>
              <TableCell align="center" sx={{ fontWeight: 800 }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {audits.map((a: any) => {
              const totalItems = a.details?.length || 0;
              const countedItems = a.details?.filter((d: any) => d.counted_quantity !== null).length || 0;
              const progress = totalItems > 0 ? Math.round((countedItems / totalItems) * 100) : 0;

              return (
                <TableRow key={a.id} hover>
                  <TableCell sx={{ fontWeight: 700 }}>{a.name}</TableCell>
                  <TableCell>{new Date(a.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{a.warehouse?.name}</TableCell>
                  <TableCell>
                    <Chip 
                      label={a.status === 'COMPLETED' ? 'Finalizada' : 'En Progreso'} 
                      color={a.status === 'COMPLETED' ? 'success' : 'warning'} 
                      size="small" 
                      sx={{ fontWeight: 700 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>{progress}%</Typography>
                      <Box sx={{ width: '100%', bgcolor: 'grey.200', borderRadius: 5, height: 6 }}>
                        <Box sx={{ width: `${progress}%`, bgcolor: progress === 100 ? 'success.main' : 'primary.main', height: '100%', borderRadius: 5 }} />
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    {a.status !== 'COMPLETED' ? (
                      <Button size="small" variant="outlined" endIcon={<PlayIcon />} onClick={() => handleContinueAudit(a)}>
                        Continuar
                      </Button>
                    ) : (
                      <Button size="small" variant="text" color="inherit" onClick={() => handleContinueAudit(a)}>
                        Ver Detalles
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {audits.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <Typography variant="body1" color="text.secondary">No hay auditorías registradas en el sistema.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Audit Wizard Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="lg" fullWidth slotProps={{ paper: { sx: { borderRadius: 4, minHeight: '80vh' } } }}>
        <DialogTitle sx={{ fontWeight: 900, pb: 1 }}>
          {selectedAudit ? `Auditoría: ${selectedAudit.name}` : 'Asistente de Auditoría Física'}
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
          
          <Box sx={{ bgcolor: 'action.hover', p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Stepper activeStep={activeStep}>
              <Step><StepLabel>Configurar Auditoría</StepLabel></Step>
              <Step><StepLabel>Ejecutar Conteo Físico</StepLabel></Step>
              <Step><StepLabel>Revisar Discrepancias y Aplicar</StepLabel></Step>
            </Stepper>
          </Box>

          <Box sx={{ p: 4, flexGrow: 1, overflowY: 'auto' }}>
            {/* STEP 0: Configuration */}
            {activeStep === 0 && (
              <Box component="form" id="audit-form" onSubmit={handleStartAudit} sx={{ maxWidth: 600, mx: 'auto' }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>Paso 1: Parámetros del Conteo</Typography>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      label="Nombre o Referencia de la Auditoría"
                      fullWidth required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <FormControl fullWidth required>
                      <InputLabel>Almacén a Auditar</InputLabel>
                      <Select
                        value={formData.warehouse_id}
                        label="Almacén a Auditar"
                        onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value })}
                      >
                        {warehouses.map((w: any) => (
                          <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      label="Notas Adicionales (Opcional)"
                      fullWidth multiline rows={3}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* STEP 1: Counting */}
            {activeStep === 1 && selectedAudit && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>Paso 2: Conteo Ciego</Typography>
                  <TextField
                    size="small"
                    placeholder="Escanear SKU o buscar..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    slotProps={{
                      input: {
                        startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
                      }
                    }}
                    sx={{ width: 300 }}
                  />
                </Box>
                
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: 'action.hover' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800 }}>SKU</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Producto</TableCell>
                        {selectedAudit.status === 'COMPLETED' && (
                          <TableCell sx={{ fontWeight: 800 }} align="right">Stock Teórico</TableCell>
                        )}
                        <TableCell sx={{ fontWeight: 800 }} width={200}>Conteo Físico</TableCell>
                        {selectedAudit.status === 'COMPLETED' && (
                          <TableCell sx={{ fontWeight: 800 }} align="right">Diferencia</TableCell>
                        )}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedAudit.details
                        ?.filter((d: any) => (d.product?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (d.product?.sku || '').toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((detail: any) => (
                        <TableRow key={detail.id} hover>
                          <TableCell sx={{ fontWeight: 'monospace' }}>{detail.product?.sku}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{detail.product?.name}</TableCell>
                          
                          {selectedAudit.status === 'COMPLETED' && (
                            <TableCell align="right">{detail.expected_quantity}</TableCell>
                          )}
                          
                          <TableCell>
                            <TextField
                              size="small"
                              type="number"
                              fullWidth
                              disabled={selectedAudit.status === 'COMPLETED'}
                              placeholder="0"
                              value={counts[detail.product_id] || ''}
                              onChange={(e) => handleCountChange(detail.product_id, e.target.value)}
                              slotProps={{
                                input: {
                                  endAdornment: selectedAudit.status !== 'COMPLETED' && counts[detail.product_id] ? (
                                    <InputAdornment position="end"><CheckIcon color="success" fontSize="small" /></InputAdornment>
                                  ) : null
                                }
                              }}
                            />
                          </TableCell>

                          {selectedAudit.status === 'COMPLETED' && (
                            <TableCell align="right" sx={{ fontWeight: 800, color: detail.difference < 0 ? 'error.main' : detail.difference > 0 ? 'success.main' : 'text.primary' }}>
                              {detail.difference > 0 ? '+' : ''}{detail.difference}
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* STEP 2: Review and Apply */}
            {activeStep === 2 && selectedAudit && (
              <Box>
                <Box sx={{ bgcolor: 'rgba(245, 158, 11, 0.1)', p: 3, borderRadius: '16px', mb: 4, display: 'flex', gap: 2, border: '1px dashed #f59e0b' }}>
                  <WarningIcon sx={{ color: '#d97706', fontSize: 40 }} />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#b45309' }}>Atención: Ajuste Irreversible</Typography>
                    <Typography variant="body2" sx={{ color: '#92400e' }}>
                      Al aplicar esta auditoría, el sistema generará automáticamente comprobantes de Entrada (Cargos) y Salida (Descargos) para igualar el stock del sistema con el conteo físico que acabas de realizar.
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}

          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: 'action.hover' }}>
          <Button onClick={() => setOpen(false)} sx={{ fontWeight: 700, mr: 'auto' }}>Cerrar</Button>
          
          {activeStep === 0 && (
            <Button type="submit" form="audit-form" variant="contained" disabled={createMutation.isPending} sx={{ fontWeight: 700 }}>
              Iniciar Toma Física
            </Button>
          )}
          
          {activeStep === 1 && selectedAudit?.status !== 'COMPLETED' && (
            <Button variant="contained" onClick={() => setActiveStep(2)} sx={{ fontWeight: 700 }}>
              Revisar y Finalizar
            </Button>
          )}

          {activeStep === 2 && selectedAudit?.status !== 'COMPLETED' && (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button onClick={() => setActiveStep(1)} sx={{ fontWeight: 700 }}>Volver al Conteo</Button>
              <Button variant="contained" color="warning" onClick={handleApply} disabled={applyMutation.isPending} startIcon={<SaveIcon />} sx={{ fontWeight: 800 }}>
                APLICAR AJUSTES AL INVENTARIO
              </Button>
            </Box>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
