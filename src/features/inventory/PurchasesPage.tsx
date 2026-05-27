import { useState } from 'react';
import { 
  Box, Typography, Button, Paper, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, Grid, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Chip
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon, 
  ShoppingCart as ShoppingCartIcon,
  Receipt as ReceiptIcon 
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axiosConfig';

export default function PurchasesPage() {
  const [open, setOpen] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [reference, setReference] = useState('');
  const [items, setItems] = useState<{product_id: number, name: string, quantity: number, cost_price: number}[]>([]);
  
  const queryClient = useQueryClient();

  const { data: purchases = [], isLoading } = useQuery({
    queryKey: ['purchases'],
    queryFn: async () => {
      const response = await api.get('/purchases/');
      return response.data;
    },
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const response = await api.get('/suppliers/');
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

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await api.get('/inventory/products');
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (newPurchase: any) => api.post('/purchases/', newPurchase),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      setOpen(false);
      resetForm();
    },
  });

  const resetForm = () => {
    setSupplierId('');
    setWarehouseId('');
    setReference('');
    setItems([]);
  };

  const addItem = () => {
    setItems([...items, { product_id: 0, name: '', quantity: 1, cost_price: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    if (field === 'product_id') {
      const prod = products.find((p: any) => p.id === value);
      newItems[index] = { ...newItems[index], product_id: value, name: prod?.name || '', cost_price: prod?.cost || 0 };
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }
    setItems(newItems);
  };

  const calculateTotal = () => items.reduce((acc, item) => acc + (item.quantity * item.cost_price), 0);

  const handleSubmit = () => {
    if (!supplierId || !warehouseId || items.length === 0) return;
    createMutation.mutate({
      supplier_id: supplierId,
      warehouse_id: warehouseId,
      reference,
      details: items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        cost_price: item.cost_price
      }))
    });
  };

  // Columns removed as we switched to manual Table for centering and premium look

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      width: '100%',
      maxWidth: 1000, 
      mx: 'auto', 
      mt: 6,
      px: 3,
      pb: 8
    }}>
      <Paper elevation={0} sx={{ 
        p: 4, 
        width: '100%',
        borderRadius: '24px', 
        border: '1px solid', 
        borderColor: 'divider',
        bgcolor: 'background.paper',
        boxShadow: '0 10px 40px -10px rgba(0,0,0,0.05)'
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
            <Box sx={{ 
              bgcolor: 'primary.50', 
              p: 2, 
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid',
              borderColor: 'primary.100'
            }}>
              <ShoppingCartIcon color="primary" sx={{ fontSize: 32 }} />
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-1px' }}>Compras</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, opacity: 0.8 }}>
                Gestión de reabastecimiento y facturas de proveedores
              </Typography>
            </Box>
          </Box>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => setOpen(true)}
            sx={{ borderRadius: '12px', px: 4, py: 1.2, fontWeight: 700 }}
          >
            Nueva Compra
          </Button>
        </Box>

        <TableContainer sx={{ border: '1px solid', borderColor: 'grey.100', borderRadius: '16px' }}>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.50' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, py: 2.5 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Ref / Factura</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Fecha</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {purchases.map((row: any) => (
                <TableRow key={row.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>#{row.id}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{row.reference || 'S/N'}</TableCell>
                  <TableCell>
                    <Chip label={row.status} size="small" color="success" sx={{ fontWeight: 700, borderRadius: '6px' }} />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>${row.total.toFixed(2)}</TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>{new Date(row.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
              {purchases.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 10, color: 'text.secondary' }}>No hay compras registradas.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog 
        open={open} 
        onClose={() => setOpen(false)} 
        maxWidth="md" 
        fullWidth 
        slotProps={{ paper: { sx: { borderRadius: 4 } } }}
      >
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <ReceiptIcon color="primary" /> Nueva Orden de Compra
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3} sx={{ mb: 4, mt: 0.5 }}>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                select
                label="Seleccionar Proveedor"
                fullWidth
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
              >
                {suppliers.map((s: any) => (
                  <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                select
                label="Almacén de Destino"
                fullWidth
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
              >
                {warehouses.map((w: any) => (
                  <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Factura / Referencia #"
                fullWidth
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </Grid>
          </Grid>

          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Artículos del Pedido</Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Producto</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Cantidad</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Precio de Costo</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Subtotal</TableCell>
                  <TableCell align="center"></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell sx={{ minWidth: 200 }}>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        variant="standard"
                        value={item.product_id}
                        onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                      >
                        {products.map((p: any) => (
                          <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                        ))}
                      </TextField>
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        type="number"
                        size="small"
                        variant="standard"
                        sx={{ width: 80 }}
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value))}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        type="number"
                        size="small"
                        variant="standard"
                        sx={{ width: 100 }}
                        value={item.cost_price}
                        onChange={(e) => updateItem(index, 'cost_price', parseFloat(e.target.value))}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography sx={{ fontWeight: 600 }}>
                        ${(item.quantity * item.cost_price).toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton color="error" size="small" onClick={() => removeItem(index)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      No hay artículos añadidos. Haz clic en el botón de abajo para agregar productos.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          <Button 
            startIcon={<AddIcon />} 
            onClick={addItem} 
            sx={{ mt: 2 }}
          >
            Agregar Producto
          </Button>

          <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
            <Box sx={{ display: 'flex', gap: 4 }}>
              <Typography color="text.secondary">Monto Total:</Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main' }}>
                ${calculateTotal().toFixed(2)}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpen(false)} color="inherit">Cancelar</Button>
          <Button 
            variant="contained" 
            size="large" 
            onClick={handleSubmit}
            disabled={!supplierId || !warehouseId || items.length === 0}
            loading={createMutation.isPending}
            sx={{ borderRadius: '10px', px: 4 }}
          >
            Completar Compra
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
