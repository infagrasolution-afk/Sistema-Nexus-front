import { useState } from 'react';
import { 
  Box, Typography, Paper, Grid, TextField, Button, MenuItem, 
  Card, CardContent
} from '@mui/material';
import { 
  CompareArrows as TransferIcon, 
  Inventory as InventoryIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axiosConfig';

export default function TransfersPage() {
  const [productId, setProductId] = useState<number | ''>('');
  const [fromWarehouse, setFromWarehouse] = useState<number | ''>('');
  const [toWarehouse, setToWarehouse] = useState<number | ''>('');
  const [quantity, setQuantity] = useState<number | ''>('');
  
  const queryClient = useQueryClient();

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => (await api.get('/inventory/products')).data,
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => (await api.get('/inventory/warehouses')).data,
  });

  const transferMutation = useMutation({
    mutationFn: (data: any) => api.post('/inventory/transfers', data),
    onSuccess: () => {
      alert('¡Stock transferido con éxito!');
      setQuantity('');
      setProductId('');
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || 'Error al transferir el stock');
    }
  });

  const handleTransfer = () => {
    if (!productId || !fromWarehouse || !toWarehouse || !quantity) return;
    if (fromWarehouse === toWarehouse) {
      alert('Los almacenes de origen y destino deben ser diferentes');
      return;
    }
    transferMutation.mutate({
      product_id: productId,
      from_warehouse_id: fromWarehouse,
      to_warehouse_id: toWarehouse,
      quantity: Number(quantity)
    });
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>Transferencias de Stock</Typography>
        <Typography variant="body2" color="text.secondary">Mueve inventario entre tus almacenes y sucursales</Typography>
      </Box>

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper sx={{ p: 4, borderRadius: 4 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
              <TransferIcon color="primary" /> Nueva Transferencia
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                select
                label="Seleccionar Producto"
                fullWidth
                value={productId}
                onChange={(e) => setProductId(Number(e.target.value))}
              >
                {products.map((p: any) => (
                  <MenuItem key={p.id} value={p.id}>{p.name} (SKU: {p.sku})</MenuItem>
                ))}
              </TextField>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  select
                  label="Almacén de Origen"
                  fullWidth
                  value={fromWarehouse}
                  onChange={(e) => setFromWarehouse(Number(e.target.value))}
                >
                  {warehouses.map((w: any) => (
                    <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  label="Almacén de Destino"
                  fullWidth
                  value={toWarehouse}
                  onChange={(e) => setToWarehouse(Number(e.target.value))}
                >
                  {warehouses.map((w: any) => (
                    <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
                  ))}
                </TextField>
              </Box>

              <TextField
                label="Cantidad a Mover"
                type="number"
                fullWidth
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value))}
              />

              <Button 
                variant="contained" 
                size="large" 
                fullWidth 
                startIcon={<TransferIcon />}
                onClick={handleTransfer}
                loading={transferMutation.isPending}
                disabled={!productId || !fromWarehouse || !toWarehouse || !quantity}
                sx={{ py: 1.5, borderRadius: 3 }}
              >
                Ejecutar Transferencia
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ borderRadius: 4, bgcolor: 'primary.50', border: 'none', boxShadow: 'none' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <InventoryIcon color="primary" /> Guía de Transferencias
              </Typography>
              <Box component="ul" sx={{ color: 'text.secondary', pl: 2 }}>
                <li>Asegúrate de tener suficiente stock en el almacén de origen antes de transferir.</li>
                <li>Las transferencias se registran como dos movimientos: SALIDA del origen y ENTRADA al destino.</li>
                <li>Usa transferencias para reabastecer el inventario de sucursales desde tu centro de distribución principal.</li>
                <li>Las transferencias entre diferentes empresas del holding quedarán registradas para auditoría.</li>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

