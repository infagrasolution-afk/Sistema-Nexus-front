import { useState } from 'react';
import { 
  Box, Typography, Button, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, Dialog, 
  DialogTitle, DialogContent, DialogActions, TextField, Grid,
  Snackbar, Alert, CircularProgress, MenuItem
} from '@mui/material';
import { Add as AddIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axiosConfig';

const DISCHARGE_REASONS = [
  'Venta', 'Daño', 'Merma', 'Vencimiento', 'Donación', 'Robo/Pérdida', 'Consumo Interno', 'Otro'
];

export default function DischargesPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    product_id: '',
    warehouse_id: '',
    quantity: '',
    reason: '',
    reference: '',
    document_number: '',
    notes: ''
  });
  
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'warning' });

  // 1. Fetch Discharges
  const { data: discharges = [], isLoading, refetch } = useQuery({
    queryKey: ['discharges'],
    queryFn: async () => {
      const response = await api.get('/inventory/discharges');
      return response.data;
    },
  });

  // Fetch Products and Warehouses for the form
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await api.get('/inventory/products');
      return response.data;
    },
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const response = await api.get('/inventory/warehouses');
      return response.data;
    },
  });

  // 2. Create Discharge Mutation
  const createMutation = useMutation({
    mutationFn: async (newDischarge: any) => {
      const payload = {
        product_id: Number(newDischarge.product_id),
        warehouse_id: Number(newDischarge.warehouse_id),
        quantity: Number(newDischarge.quantity),
        reason: newDischarge.reason || null,
        reference: newDischarge.reference || null,
        document_number: newDischarge.document_number || null,
        notes: newDischarge.notes || null
      };
      const response = await api.post('/inventory/discharges', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discharges'] });
      queryClient.invalidateQueries({ queryKey: ['products'] }); // Refetch stock
      showToast('Descargo registrado con éxito', 'success');
      handleCloseDialog();
    },
    onError: (error: any) => {
      const detail = error.response?.data?.detail || 'Error al registrar el descargo';
      showToast(typeof detail === 'string' ? detail : JSON.stringify(detail), 'error');
    }
  });

  const showToast = (message: string, severity: 'success' | 'error' | 'warning') => {
    setToast({ open: true, message, severity });
  };

  const handleOpenCreate = () => {
    setFormData({
      product_id: '',
      warehouse_id: '',
      quantity: '',
      reason: 'Daño',
      reference: '',
      document_number: '',
      notes: ''
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.product_id || !formData.warehouse_id || !formData.quantity || !formData.reason) {
      showToast('Producto, almacén, cantidad y motivo son obligatorios', 'error');
      return;
    }
    if (Number(formData.quantity) <= 0) {
      showToast('La cantidad debe ser mayor a 0', 'error');
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: 'auto', pb: 8 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>Descargos de Inventario</Typography>
          <Typography variant="body2" color="text.secondary">
            Registra salidas de mercancía (mermas, daños, uso interno, etc.)
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" onClick={() => refetch()} startIcon={<RefreshIcon />}>
            Actualizar
          </Button>
          <Button variant="contained" color="error" startIcon={<AddIcon />} onClick={handleOpenCreate}>
            Nuevo Descargo
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 2, borderRadius: '16px' }} elevation={0}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: 'grey.50' }}>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Nº Doc.</TableCell>
                  <TableCell>Producto</TableCell>
                  <TableCell>Almacén</TableCell>
                  <TableCell>Motivo</TableCell>
                  <TableCell>Cantidad</TableCell>
                  <TableCell>Referencia</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {discharges.map((adj: any) => (
                  <TableRow key={adj.id}>
                    <TableCell>{new Date(adj.created_at).toLocaleString()}</TableCell>
                    <TableCell>{adj.document_number || '-'}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{adj.product?.name || `ID: ${adj.product_id}`}</TableCell>
                    <TableCell>{adj.warehouse?.name || `ID: ${adj.warehouse_id}`}</TableCell>
                    <TableCell>
                      <Chip 
                        label={adj.movement_subtype || 'SALIDA'} 
                        color="error" 
                        size="small" 
                        variant="outlined"
                        sx={{ fontWeight: 'bold' }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 800, color: 'error.main' }}>
                      -{adj.quantity}
                    </TableCell>
                    <TableCell>{adj.reference || '-'}</TableCell>
                  </TableRow>
                ))}
                {discharges.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      No hay descargos registrados
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Dialog for New Discharge */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: 'bold', color: 'error.main' }}>Registrar Nuevo Descargo</DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  select
                  fullWidth
                  label="Producto"
                  name="product_id"
                  value={formData.product_id}
                  onChange={handleChange}
                  required
                >
                  {products.map((p: any) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.sku} - {p.name} (Stock total: {p.stock || 0})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Almacén de Origen"
                  name="warehouse_id"
                  value={formData.warehouse_id}
                  onChange={handleChange}
                  required
                >
                  {warehouses.map((w: any) => (
                    <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Cantidad a Descargar"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  required
                  slotProps={{ htmlInput: { min: 0.01, step: 0.01 } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Motivo del Descargo"
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  required
                >
                  {DISCHARGE_REASONS.map((r) => (
                    <MenuItem key={r} value={r}>{r}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Nº Documento Soporte"
                  name="document_number"
                  value={formData.document_number}
                  onChange={handleChange}
                  placeholder="Ej: ACTA-001"
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Referencia"
                  name="reference"
                  value={formData.reference}
                  onChange={handleChange}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Notas Adicionales"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleCloseDialog}>Cancelar</Button>
            <Button type="submit" variant="contained" color="error" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Guardando...' : 'Confirmar Descargo'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast({ ...toast, open: false })}>
        <Alert severity={toast.severity}>{toast.message}</Alert>
      </Snackbar>
    </Box>
  );
}
