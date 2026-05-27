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

export default function ChargesPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    product_id: '',
    warehouse_id: '',
    quantity: '',
    reference: '',
    document_number: '',
    notes: '',
    unit_cost: ''
  });
  
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'warning' });

  // 1. Fetch Charges
  const { data: charges = [], isLoading, refetch } = useQuery({
    queryKey: ['charges'],
    queryFn: async () => {
      const response = await api.get('/inventory/charges');
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

  // 2. Create Charge Mutation
  const createMutation = useMutation({
    mutationFn: async (newCharge: any) => {
      const payload = {
        product_id: Number(newCharge.product_id),
        warehouse_id: Number(newCharge.warehouse_id),
        quantity: Number(newCharge.quantity),
        reference: newCharge.reference || null,
        document_number: newCharge.document_number || null,
        notes: newCharge.notes || null,
        unit_cost: newCharge.unit_cost ? Number(newCharge.unit_cost) : null
      };
      const response = await api.post('/inventory/charges', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charges'] });
      queryClient.invalidateQueries({ queryKey: ['products'] }); // Refetch stock
      showToast('Cargo registrado con éxito', 'success');
      handleCloseDialog();
    },
    onError: (error: any) => {
      const detail = error.response?.data?.detail || 'Error al registrar el cargo';
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
      reference: '',
      document_number: '',
      notes: '',
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
          <Typography variant="h4" sx={{ fontWeight: 800 }}>Cargos de Inventario</Typography>
          <Typography variant="body2" color="text.secondary">
            Registra entradas de mercancía (compras, devoluciones, etc.)
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" onClick={() => refetch()} startIcon={<RefreshIcon />}>
            Actualizar
          </Button>
          <Button variant="contained" color="success" startIcon={<AddIcon />} onClick={handleOpenCreate}>
            Nuevo Cargo
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
                  <TableCell>Tipo</TableCell>
                  <TableCell>Cantidad</TableCell>
                  <TableCell>Referencia</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {charges.map((adj: any) => (
                  <TableRow key={adj.id}>
                    <TableCell>{new Date(adj.created_at).toLocaleString()}</TableCell>
                    <TableCell>{adj.document_number || '-'}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{adj.product?.name || `ID: ${adj.product_id}`}</TableCell>
                    <TableCell>{adj.warehouse?.name || `ID: ${adj.warehouse_id}`}</TableCell>
                    <TableCell>
                      <Chip 
                        label="ENTRADA" 
                        color="success" 
                        size="small" 
                        sx={{ fontWeight: 'bold' }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 800, color: 'success.main' }}>
                      +{adj.quantity}
                    </TableCell>
                    <TableCell>{adj.reference || '-'}</TableCell>
                  </TableRow>
                ))}
                {charges.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      No hay cargos registrados
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Dialog for New Charge */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: 'bold', color: 'success.main' }}>Registrar Nuevo Cargo</DialogTitle>
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
                  label="Almacén de Destino"
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
                  label="Cantidad (Positiva)"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  required
                  slotProps={{ htmlInput: { min: 0.01, step: 0.01 } }}
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
                  helperText="Opcional"
                  slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Nº Documento Soporte"
                  name="document_number"
                  value={formData.document_number}
                  onChange={handleChange}
                  placeholder="Ej: FAC-1234"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Referencia / Motivo"
                  name="reference"
                  value={formData.reference}
                  onChange={handleChange}
                  placeholder="Ej: Compra, Devolución"
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
            <Button type="submit" variant="contained" color="success" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Guardando...' : 'Confirmar Cargo'}
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
