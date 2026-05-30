import { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Grid, TextField, Button, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Divider, Autocomplete, Dialog, DialogTitle, DialogContent, DialogActions,
  MenuItem
} from '@mui/material';
import { 
  Description as InvoiceIcon, 
  Delete as DeleteIcon,
  Search as SearchIcon,
  Save as SaveIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axiosConfig';

export default function ManualBillingPage() {
  const queryClient = useQueryClient();
  const [items, setItems] = useState<any[]>([]);
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [warehouseId, setWarehouseId] = useState<number | ''>('');
  const [openBudgetDialog, setOpenBudgetDialog] = useState(false);
  const [budgetId, setBudgetId] = useState('');

  // New local states for discounts, currency, and payment methods
  const [paymentMethod, setPaymentMethod] = useState('credit');
  const [currency, setCurrency] = useState('USD');
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [exchangeRate, setExchangeRate] = useState(36.5);

  useEffect(() => {
    const fetchRate = async () => {
      try {
        const res = await api.get('/inventory/exchange-rate');
        setExchangeRate(res.data.rate);
      } catch (e) {
        console.error(e);
      }
    };
    fetchRate();
  }, []);

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => (await api.get('/inventory/products')).data,
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => (await api.get('/inventory/warehouses')).data,
  });

  useEffect(() => {
    if (warehouses.length > 0 && !warehouseId) {
      setWarehouseId(warehouses[0].id);
    }
  }, [warehouses]);

  const createSaleMutation = useMutation({
    mutationFn: (saleData: any) => api.post('/sales/', saleData),
    onSuccess: (response) => {
      alert('Factura emitida con éxito!');
      setItems([]);
      setCustomerId(null);
      if (budgetId) {
        api.put(`/sales/budgets/${budgetId}/approve`).catch(e => console.error(e));
      }
      setBudgetId('');
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      window.open(`${api.defaults.baseURL}/sales/${response.data.id}/invoice`, '_blank');
    },
  });

  const handleAddItem = (product: any) => {
    if (!product) return;
    const exists = items.find(i => i.product_id === product.id);
    if (exists) {
      setItems(items.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setItems([...items, { product_id: product.id, name: product.name, quantity: 1, unit_price: product.price, discount: 0 }]);
    }
  };

  const handleLoadBudget = async () => {
    try {
      const res = await api.get(`/sales/budgets`);
      const budget = res.data.find((b: any) => b.id.toString() === budgetId);
      if (!budget) {
        alert("Presupuesto no encontrado");
        return;
      }
      setCustomerId(budget.customer_id);
      setItems(budget.items.map((i: any) => ({
        product_id: i.product_id,
        name: products.find((p:any) => p.id === i.product_id)?.name || 'Producto',
        quantity: i.quantity,
        unit_price: i.unit_price,
        discount: 0
      })));
      setOpenBudgetDialog(false);
    } catch (error) {
      alert("Error cargando el presupuesto");
    }
  };

  const handleSaveInvoice = () => {
    if (!customerId || items.length === 0 || !warehouseId) {
      alert("Debe seleccionar un cliente, almacén y añadir productos.");
      return;
    }
    createSaleMutation.mutate({
      customer_id: customerId,
      warehouse_id: warehouseId,
      payment_method: paymentMethod,
      currency: currency,
      exchange_rate: currency === 'USD' ? 1.0 : exchangeRate,
      cash_session_id: null,
      status: "COMPLETED",
      details: items.map(i => ({
        product_id: i.product_id,
        quantity: i.quantity,
        unit_price: i.unit_price * (1 - (i.discount || 0) / 100) * (1 - globalDiscount / 100)
      }))
    });
  };

  // Sum of items after per-product discounts
  const subtotalBeforeGlobalDiscount = items.reduce(
    (acc, item) => acc + (item.quantity * item.unit_price * (1 - (item.discount || 0) / 100)), 
    0
  );

  const globalDiscountAmount = subtotalBeforeGlobalDiscount * (globalDiscount / 100);

  // Base Imponible (Subtotal after all discounts)
  const subtotal = Math.max(0, subtotalBeforeGlobalDiscount - globalDiscountAmount);

  // IVA 16%
  const tax = subtotal * 0.16;

  // IGTF 3% - Applies dynamically when payment is in USD
  const igtf = currency === 'USD' ? (subtotal + tax) * 0.03 : 0;

  // Total invoice sum in USD
  const total = subtotal + tax + igtf;
  
  // Total in VES (Bolívares)
  const totalLocal = total * exchangeRate;

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
              bgcolor: 'secondary.50', 
              p: 2, 
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid',
              borderColor: 'secondary.100'
            }}>
              <InvoiceIcon color="secondary" sx={{ fontSize: 32 }} />
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-1px' }}>Facturación Manual</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, opacity: 0.8 }}>
                Emisión de facturas administrativas y propuestas comerciales
              </Typography>
            </Box>
          </Box>
          <Button 
            variant="outlined" 
            startIcon={<DownloadIcon />}
            onClick={() => setOpenBudgetDialog(true)}
            sx={{ borderRadius: '12px', px: 3, fontWeight: 700 }}
          >
            Cargar Presupuesto
          </Button>
        </Box>

        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <SearchIcon fontSize="small" color="primary" /> Datos del Cliente y Despacho
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField 
                    fullWidth 
                    label="ID del Cliente" 
                    variant="outlined"
                    type="number"
                    value={customerId || ''}
                    onChange={(e) => setCustomerId(Number(e.target.value))}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    select
                    fullWidth
                    label="Almacén de Despacho"
                    value={warehouseId}
                    onChange={(e) => setWarehouseId(Number(e.target.value))}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                  >
                    {warehouses.map((w: any) => (
                      <MenuItem key={w.id} value={w.id}>
                        {w.name}
                      </MenuItem>
                    ))}
                    {warehouses.length === 0 && <MenuItem disabled>Cargando almacenes...</MenuItem>}
                  </TextField>
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ mb: 4 }} />

            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Renglones de Factura</Typography>
                <Autocomplete
                  options={products}
                  getOptionLabel={(option: any) => `${option.sku} - ${option.name}`}
                  sx={{ width: 350 }}
                  onChange={(_, newValue) => handleAddItem(newValue)}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      label="Añadir producto..." 
                      size="small" 
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                    />
                  )}
                />
              </Box>
              
              <TableContainer sx={{ border: '1px solid', borderColor: 'grey.100', borderRadius: '16px' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: 'grey.50' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, py: 2 }}>Producto</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Cant.</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Precio</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Desc %</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Subtotal</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Acción</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                          <Typography color="text.disabled" variant="body2">No hay productos en la lista</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                    {items.map((item, index) => (
                      <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell sx={{ fontWeight: 500 }}>{item.name}</TableCell>
                        <TableCell align="center">
                          <TextField 
                            type="number" 
                            size="small" 
                            value={item.quantity}
                            onChange={(e) => {
                              const newItems = [...items];
                              newItems[index].quantity = Number(e.target.value);
                              setItems(newItems);
                            }}
                            slotProps={{ 
                              htmlInput: { 
                                style: { textAlign: 'center', width: '40px', padding: '4px', fontSize: '0.875rem' } 
                              } 
                            }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <TextField 
                            type="number" 
                            size="small" 
                            value={item.unit_price}
                            onChange={(e) => {
                              const newItems = [...items];
                              newItems[index].unit_price = Number(e.target.value);
                              setItems(newItems);
                            }}
                            slotProps={{ 
                              htmlInput: { 
                                style: { textAlign: 'right', width: '60px', padding: '4px', fontSize: '0.875rem' } 
                              } 
                            }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <TextField 
                            type="number" 
                            size="small" 
                            value={item.discount || 0}
                            onChange={(e) => {
                              const newItems = [...items];
                              newItems[index].discount = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                              setItems(newItems);
                            }}
                            slotProps={{ 
                              htmlInput: { 
                                min: 0, max: 100, style: { textAlign: 'center', width: '35px', padding: '4px', fontSize: '0.875rem' } 
                              } 
                            }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                          {item.discount > 0 && (
                            <Typography variant="caption" sx={{ textDecoration: 'line-through', color: 'text.secondary', display: 'block' }}>
                              ${(item.quantity * item.unit_price).toFixed(2)}
                            </Typography>
                          )}
                          ${(item.quantity * item.unit_price * (1 - (item.discount || 0) / 100)).toFixed(2)}
                        </TableCell>
                        <TableCell align="center">
                          <IconButton size="small" color="error" onClick={() => setItems(items.filter((_, i) => i !== index))}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Paper elevation={0} sx={{ 
              p: 3, 
              borderRadius: '20px', 
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              position: 'sticky', 
              top: 100 
            }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 800 }}>Resumen de Pago</Typography>
              
              {/* Payment Method Select */}
              <Box sx={{ mb: 2 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Método de Pago"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                >
                  <MenuItem value="cash">Efectivo</MenuItem>
                  <MenuItem value="card">Tarjeta</MenuItem>
                  <MenuItem value="transfer">Transferencia</MenuItem>
                  <MenuItem value="credit">Crédito</MenuItem>
                </TextField>
              </Box>

              {/* Currency Select */}
              <Box sx={{ mb: 2 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Moneda de Pago"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                >
                  <MenuItem value="USD">Divisas (USD)</MenuItem>
                  <MenuItem value="LOCAL">Bolívares (VES)</MenuItem>
                </TextField>
              </Box>

              {/* Global Discount input */}
              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Descuento Global (%)"
                  type="number"
                  value={globalDiscount || 0}
                  onChange={(e) => setGlobalDiscount(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                />
              </Box>

              <Divider sx={{ mb: 2.5 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Subtotal Bruto:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  ${items.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0).toFixed(2)}
                </Typography>
              </Box>

              {(globalDiscountAmount > 0 || (subtotalBeforeGlobalDiscount < items.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0))) && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="error.main">Descuentos:</Typography>
                  <Typography variant="body2" color="error.main" sx={{ fontWeight: 600 }}>
                    -${(items.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0) - subtotal).toFixed(2)}
                  </Typography>
                </Box>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Base Imponible:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>${subtotal.toFixed(2)}</Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">IVA (16%):</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>${tax.toFixed(2)}</Typography>
              </Box>

              {igtf > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="warning.dark" sx={{ fontWeight: 600 }}>IGTF (3% Divisas):</Typography>
                  <Typography variant="body2" color="warning.dark" sx={{ fontWeight: 700 }}>${igtf.toFixed(2)}</Typography>
                </Box>
              )}

              <Divider sx={{ my: 2.5 }} />
              
              <Box sx={{ textAlign: 'right', mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 900, color: 'primary.main', letterSpacing: '-1.5px' }}>
                  {currency === 'USD' ? `$${total.toFixed(2)}` : `${totalLocal.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} VES`}
                </Typography>
                {currency === 'LOCAL' ? (
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Total Ref: ${total.toFixed(2)}</Typography>
                ) : (
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    Equivalente: {totalLocal.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} VES
                  </Typography>
                )}
              </Box>

              <Button 
                variant="contained" 
                fullWidth 
                size="large"
                startIcon={<SaveIcon />}
                onClick={handleSaveInvoice}
                disabled={createSaleMutation.isPending}
                sx={{ 
                  borderRadius: '12px', 
                  py: 1.8, 
                  fontWeight: 700,
                  fontSize: '1rem',
                  boxShadow: '0 8px 24px rgba(37, 99, 235, 0.25)',
                  '&:hover': { boxShadow: '0 12px 30px rgba(37, 99, 235, 0.35)' }
                }}
              >
                Emitir Factura
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Paper>

      <Dialog 
        open={openBudgetDialog} 
        onClose={() => setOpenBudgetDialog(false)} 
        maxWidth="xs" 
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: '20px' } } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Cargar Presupuesto</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary', fontWeight: 500 }}>
            Ingrese el ID del presupuesto para importar los datos automáticamente.
          </Typography>
          <TextField 
            fullWidth 
            label="ID del Presupuesto" 
            value={budgetId}
            onChange={(e) => setBudgetId(e.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenBudgetDialog(false)} color="inherit" sx={{ fontWeight: 600 }}>Cancelar</Button>
          <Button 
            variant="contained" 
            onClick={handleLoadBudget} 
            disabled={!budgetId}
            sx={{ borderRadius: '10px', px: 3, fontWeight: 700 }}
          >
            Importar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
