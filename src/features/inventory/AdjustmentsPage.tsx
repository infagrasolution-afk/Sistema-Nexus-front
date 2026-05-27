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

export default function AdjustmentsPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    product_id: '',
    warehouse_id: '',
    quantity: '',
    reference: '',
    unit_cost: ''
  });
  
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'warning' });

  // 1. Fetch Adjustments
  const { data: adjustments = [], isLoading, refetch } = useQuery({
    queryKey: ['adjustments'],
    queryFn: async () => {
      const response = await api.get('/inventory/adjustments');
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

  // 2. Create Adjustment Mutation
  const createMutation = useMutation({
    mutationFn: async (newAdjustment: any) => {
      // Convert to numbers
      const payload = {
        product_id: Number(newAdjustment.product_id),
        warehouse_id: Number(newAdjustment.warehouse_id),
        quantity: Number(newAdjustment.quantity),
        reference: newAdjustment.reference || "Ajuste Manual",
        unit_cost: newAdjustment.unit_cost ? Number(newAdjustment.unit_cost) : null
      };
      const response = await api.post('/inventory/adjustments', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adjustments'] });
      queryClient.invalidateQueries({ queryKey: ['products'] }); // Refetch stock
      showToast('Ajuste registrado con éxito', 'success');
      handleCloseDialog();
    },
    onError: (error: any) => {
      const detail = error.response?.data?.detail || 'Error al registrar el ajuste';
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
      reference: 'Saldo Inicial',
      unit_cost: ''
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
    if (!formData.product_id || !formData.warehouse_id || !formData.quantity) {
      showToast('Producto, almacén y cantidad son obligatorios', 'error');
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: 'auto', pb: 8 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>Ajustes de Inventario</Typography>
          <Typography variant="body2" color="text.secondary">
            Registra entradas y salidas manuales de mercancía
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" onClick={() => refetch()} startIcon={<RefreshIcon />}>
            Actualizar
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
            Nuevo Ajuste
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
                  <TableCell>Producto</TableCell>
                  <TableCell>Almacén</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Cantidad</TableCell>
                  <TableCell>Referencia</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {adjustments.map((adj: any) => (
                  <TableRow key={adj.id}>
                    <TableCell>{new Date(adj.created_at).toLocaleString()}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{adj.product?.name || `ID: ${adj.product_id}`}</TableCell>
                    <TableCell>{adj.warehouse?.name || `ID: ${adj.warehouse_id}`}</TableCell>
                    <TableCell>
                      <Chip 
                        label={adj.quantity > 0 ? 'ENTRADA' : 'SALIDA'} 
                        color={adj.quantity > 0 ? 'success' : 'error'} 
                        size="small" 
                        sx={{ fontWeight: 'bold' }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 800, color: adj.quantity > 0 ? 'success.main' : 'error.main' }}>
                      {adj.quantity > 0 ? '+' : ''}{adj.quantity}
                    </TableCell>
                    <TableCell>{adj.reference}</TableCell>
                  </TableRow>
                ))}
                {adjustments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      No hay ajustes registrados
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Dialog for New Adjustment */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: 'bold' }}>Registrar Ajuste de Inventario</DialogTitle>
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
                    <MenuItem key={p.id} value={p.id}>{p.sku} - {p.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  select
                  fullWidth
                  label="Almacén"
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
                  label="Cantidad"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  helperText="Use positivos para Entrada, negativos para Salida"
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Costo Unitario ($)"
                  name="unit_cost"
                  value={formData.unit_cost}
                  onChange={handleChange}
                  helperText="Opcional. Actualiza el costo promedio"
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Referencia / Motivo"
                  name="reference"
                  value={formData.reference}
                  onChange={handleChange}
                  placeholder="Ej: Saldo Inicial, Merma, etc."
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleCloseDialog}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Guardando...' : 'Confirmar Ajuste'}
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
