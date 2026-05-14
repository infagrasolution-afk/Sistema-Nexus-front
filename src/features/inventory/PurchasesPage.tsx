import { useState } from 'react';
import { 
  Box, Typography, Button, Paper, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, Grid, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon, 
  ShoppingCart as ShoppingCartIcon,
  Receipt as ReceiptIcon 
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
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

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'reference', headerName: 'Ref/Factura', flex: 1 },
    { field: 'supplier_id', headerName: 'ID Proveedor', width: 120 },
    { field: 'status', headerName: 'Estado', width: 120 },
    { 
      field: 'total', 
      headerName: 'Total', 
      width: 130, 
      renderCell: (params) => (
        <Typography sx={{ fontWeight: 700, color: 'primary.main' }}>
          ${params.value.toFixed(2)}
        </Typography>
      )
    },
    { field: 'created_at', headerName: 'Fecha', flex: 1, valueFormatter: (params) => new Date(params).toLocaleDateString() },
  ];

  return (
    <Box sx={{ p: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.5px' }}>
            Compras
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gestiona el reabastecimiento de inventario y las facturas de proveedores
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<ShoppingCartIcon />} 
          onClick={() => setOpen(true)}
          sx={{ borderRadius: '12px', px: 3, py: 1 }}
        >
          Nueva Compra
        </Button>
      </Box>

      <Paper sx={{ height: 600, width: '100%', borderRadius: 4, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <DataGrid
          rows={purchases}
          columns={columns}
          loading={isLoading}
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        />
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
