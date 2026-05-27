import { useState } from 'react';
import { 
  Box, Typography, Paper, Grid, TextField, Button, MenuItem
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
              <TransferIcon color="primary" sx={{ fontSize: 32 }} />
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-1px' }}>Transferencias de Stock</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, opacity: 0.8 }}>
                Movimientos de inventario entre almacenes y sucursales
              </Typography>
            </Box>
          </Box>
        </Box>

        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                Detalles del Movimiento
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  select
                  label="Producto a Transferir"
                  fullWidth
                  value={productId}
                  onChange={(e) => setProductId(Number(e.target.value))}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                >
                  {products.map((p: any) => (
                    <MenuItem key={p.id} value={p.id}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{p.name}</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.6 }}>SKU: {p.sku}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                  {products.length === 0 && <MenuItem disabled>No hay productos disponibles</MenuItem>}
                </TextField>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      select
                      label="Almacén de Origen"
                      fullWidth
                      value={fromWarehouse}
                      onChange={(e) => setFromWarehouse(Number(e.target.value))}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                    >
                      {warehouses.map((w: any) => (
                        <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      select
                      label="Almacén de Destino"
                      fullWidth
                      value={toWarehouse}
                      onChange={(e) => setToWarehouse(Number(e.target.value))}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                    >
                      {warehouses.map((w: any) => (
                        <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </Grid>

                <TextField
                  label="Cantidad"
                  type="number"
                  fullWidth
                  value={quantity}
                  onChange={(e) => setQuantity(parseFloat(e.target.value))}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                />

                <Button 
                  variant="contained" 
                  size="large" 
                  fullWidth 
                  startIcon={<TransferIcon />}
                  onClick={handleTransfer}
                  disabled={!productId || !fromWarehouse || !toWarehouse || !quantity || transferMutation.isPending}
                  sx={{ 
                    py: 1.8, 
                    borderRadius: '12px',
                    fontWeight: 700,
                    fontSize: '1rem',
                    boxShadow: '0 8px 24px rgba(37, 99, 235, 0.25)',
                    mt: 2
                  }}
                >
                  {transferMutation.isPending ? 'Procesando...' : 'Ejecutar Transferencia'}
                </Button>
              </Box>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <Paper elevation={0} sx={{ 
              p: 3, 
              borderRadius: '20px', 
              bgcolor: 'primary.50',
              border: '1px solid',
              borderColor: 'primary.100',
              height: '100%'
            }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
                <InventoryIcon /> Guía Rápida
              </Typography>
              <Box component="ul" sx={{ color: 'text.secondary', pl: 2, '& li': { mb: 1.5, fontWeight: 500, fontSize: '0.9rem' } }}>
                <li>Verifica existencias antes de mover.</li>
                <li>La transferencia es inmediata y afecta ambos inventarios.</li>
                <li>Se genera un registro de auditoría con tu usuario.</li>
                <li>Usa esta opción para reabastecer sucursales.</li>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}

