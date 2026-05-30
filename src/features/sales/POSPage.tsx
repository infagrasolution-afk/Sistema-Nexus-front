import { useState, useEffect } from 'react';
import { 
  Box, Typography, Grid, Paper, TextField, Button, List, 
  ListItem, ListItemText, Divider, IconButton, MenuItem,
  ToggleButton, ToggleButtonGroup, Tooltip, Dialog, 
  DialogTitle, DialogContent, DialogActions, Chip, CircularProgress,
  Card, CardContent, InputAdornment, Avatar
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Delete as DeleteIcon, 
  Payment as PaymentIcon,
  Warehouse as WarehouseIcon,
  AttachMoney as MoneyIcon,
  CreditCard as CardIcon,
  AccountBalance as BankIcon,
  History as HistoryIcon,
  Sync as SyncIcon,
  PersonAdd as PersonAddIcon,
  Pause as PauseIcon,
  PlayArrow as PlayArrowIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../../api/axiosConfig';
import { useAppStore } from '../../store/useAppStore';

function Clock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main', fontFamily: 'monospace', fontSize: '1rem' }}>
      {time.toLocaleTimeString()}
    </Typography>
  );
}
import { getComputerUID } from '../../utils/computer';
import { RegisterOpenDialog, RegisterCloseDialog } from './RegisterDialogs';

export default function POSPage() {
  const { t } = useTranslation();
  const [cart, setCart] = useState<{id: number, name: string, price: number, qty: number, discount: number}[]>([]);
  const [globalDiscount, setGlobalDiscount] = useState(0); // global discount %
  const [warehouseId, setWarehouseId] = useState<number | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [currency, setCurrency] = useState('USD');
  const [exchangeRate, setExchangeRate] = useState(1.0);
  const [loadingRate, setLoadingRate] = useState(true);
  const [openHistory, setOpenHistory] = useState(false);
  const [openRegisterDialog, setOpenRegisterDialog] = useState(false);
  const [closeRegisterDialog, setCloseRegisterDialog] = useState(false);
  const [openFiscalDialog, setOpenFiscalDialog] = useState(false);
  const [openParkedDialog, setOpenParkedDialog] = useState(false);
  
  // Fiscal Data State
  const [fiscalData, setFiscalData] = useState({ tax_id: '', name: '', phone: '', address: '' });

  // High performance rate state to avoid keypress lags
  const [localRateInput, setLocalRateInput] = useState('1.0');

  useEffect(() => {
    setLocalRateInput(exchangeRate.toString());
  }, [exchangeRate]);

  const handleRateSubmit = () => {
    const val = Number(localRateInput);
    if (!isNaN(val) && val > 0) {
      setExchangeRate(val);
      updateRateMutation.mutate(val);
    }
  };
  
  const { user, cashSession, setCashSession } = useAppStore();
  
  const queryClient = useQueryClient();

  const { data: history = [] } = useQuery({
    queryKey: ['exchange-history'],
    queryFn: async () => (await api.get('/inventory/exchange-rate/history')).data,
    enabled: openHistory
  });

  const { data: parkedSales = [], isLoading: loadingParked } = useQuery({
    queryKey: ['parked-sales'],
    queryFn: async () => (await api.get('/sales/on-hold')).data,
    enabled: openParkedDialog
  });

  const { } = useQuery({
    queryKey: ['cash-session'],
    queryFn: async () => {
      try {
        const res = await api.get(`/cash/session/current?computer_uid=${getComputerUID()}`);
        setCashSession(res.data);
        if (!res.data) setOpenRegisterDialog(true);
        return res.data;
      } catch (e) {
        console.error("Error fetching session", e);
        return null;
      }
    }
  });

  const updateRateMutation = useMutation({
    mutationFn: (rate: number) => api.post('/inventory/exchange-rate', { rate, provider: 'Manual' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchange-history'] });
    }
  });

  const fetchBCVRate = async () => {
    setLoadingRate(true);
    try {
      const response = await api.get('/inventory/exchange-rate');
      setExchangeRate(response.data.rate);
    } catch (error) {
      console.error("Error fetching BCV rate", error);
      setExchangeRate(36.5);
    } finally {
      setLoadingRate(false);
    }
  };

  useEffect(() => {
    fetchBCVRate();
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
      const main = warehouses.find((w: any) => w.name.toLowerCase().includes('main')) || warehouses[0];
      setWarehouseId(main.id);
    }
  }, [warehouses]);

  const createSaleMutation = useMutation({
    mutationFn: (saleData: any) => api.post('/sales/', saleData),
    onSuccess: (response, variables) => {
      if (variables.status === 'ON_HOLD') {
        alert(t('Venta puesta en espera'));
        setCart([]);
      } else {
        alert(t('Sale completed successfully!'));
        setCart([]);
        queryClient.invalidateQueries({ queryKey: ['sales'] });
        window.open(`${api.defaults.baseURL}/sales/${response.data.id}/invoice`, '_blank');
      }
    },
  });

  const completeParkedMutation = useMutation({
    mutationFn: (saleId: number) => api.put(`/sales/${saleId}/complete`),
    onSuccess: () => {
      alert('Venta completada con éxito');
      setCart([]);
      queryClient.invalidateQueries({ queryKey: ['parked-sales'] });
      setOpenParkedDialog(false);
    }
  });

  const createCustomerMutation = useMutation({
    mutationFn: (data: any) => api.post('/sales/customers/fiscal', data),
    onSuccess: (res) => {
      return res.data;
    }
  });

  const addToCart = (product: any) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, { id: product.id, name: product.name, price: product.price, qty: 1, discount: 0 }]);
    }
  };

  const handleInitiateCheckout = () => {
    if (!warehouseId || cart.length === 0) return;
    setOpenFiscalDialog(true);
  };

  const handleProcessFiscalSale = async () => {
    let customerId = 1; // Default
    if (fiscalData.tax_id && fiscalData.name) {
      try {
        const res = await createCustomerMutation.mutateAsync(fiscalData);
        customerId = res.data.id;
      } catch (e) {
        alert("Error procesando datos del cliente");
        return;
      }
    }
    
    setOpenFiscalDialog(false);
    createSaleMutation.mutate({
      customer_id: customerId,
      warehouse_id: warehouseId,
      payment_method: paymentMethod,
      currency: currency,
      exchange_rate: currency === 'USD' ? 1 : exchangeRate,
      cash_session_id: cashSession?.id,
      status: "COMPLETED",
      details: cart.map(item => ({
        product_id: item.id,
        quantity: item.qty,
        unit_price: item.price * (1 - (item.discount || 0) / 100) * (1 - globalDiscount / 100)
      }))
    });
  };

  const handleParkSale = () => {
    if (!warehouseId || cart.length === 0) return;
    createSaleMutation.mutate({
      customer_id: 1,
      warehouse_id: warehouseId,
      payment_method: paymentMethod,
      currency: currency,
      exchange_rate: currency === 'USD' ? 1 : exchangeRate,
      cash_session_id: cashSession?.id,
      status: "ON_HOLD",
      details: cart.map(item => ({
        product_id: item.id,
        quantity: item.qty,
        unit_price: item.price * (1 - (item.discount || 0) / 100) * (1 - globalDiscount / 100)
      }))
    });
  };

  const loadParkedSale = (sale: any) => {
    // In a real app we might just set the sale ID and call complete endpoint later
    // but here we just copy the items to the cart and will complete the sale using the put endpoint
    // To keep it simple, we will just call the complete endpoint directly and clear the cart
    if (confirm("¿Cobrar esta venta en espera por " + sale.total + "?")) {
      completeParkedMutation.mutate(sale.id);
    }
  };

  const filteredProducts = products.filter((p: any) => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sum of items after per-product discounts
  const subtotalBeforeGlobalDiscountUSD = cart.reduce(
    (acc, item) => acc + (item.price * item.qty * (1 - (item.discount || 0) / 100)), 
    0
  );

  // Global discount amount
  const globalDiscountAmountUSD = subtotalBeforeGlobalDiscountUSD * (globalDiscount / 100);

  // Subtotal after all discounts (Base Imponible)
  const subtotalUSD = Math.max(0, subtotalBeforeGlobalDiscountUSD - globalDiscountAmountUSD);

  // IVA (16%)
  const taxUSD = subtotalUSD * 0.16;

  // IGTF (3%) - Applies dynamically when payment is in foreign currency (USD)
  const igtfUSD = currency === 'USD' ? (subtotalUSD + taxUSD) * 0.03 : 0;

  // Total invoice sum in USD
  const totalUSD = subtotalUSD + taxUSD + igtfUSD;
  
  // Total in VES (Bolívares)
  const totalLocal = totalUSD * exchangeRate;

  return (
    <Box sx={{ width: '100%', px: { xs: 2.5, sm: 4, md: 6 }, py: { xs: 2, md: 3 } }}>
      <Grid container spacing={3} sx={{ mb: 4, alignItems: 'center' }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {useAppStore.getState().tenant?.logo_url ? (
              <Box component="img" src={useAppStore.getState().tenant?.logo_url} sx={{ height: 50, width: 'auto', borderRadius: 1 }} />
            ) : (
              <Box sx={{ bgcolor: 'primary.main', color: 'white', p: 1.5, borderRadius: '12px', display: 'flex' }}>
                <PaymentIcon fontSize="large" />
              </Box>
            )}
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 900, color: 'primary.main', lineHeight: 1.1, letterSpacing: '-1.5px' }}>
                {useAppStore.getState().tenant?.name || t('Point of Sale')}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5 }}>
                <Clock />
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                  • {cashSession?.register.name} • Cajero: {user?.username || user?.email?.split('@')[0]}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          {/* Centered Premium Exchange Rate Widget */}
          <Card 
            variant="outlined" 
            sx={{ 
              px: 2.5, 
              py: 1, 
              bgcolor: 'background.paper', 
              border: '1.5px solid', 
              borderColor: 'primary.200', 
              borderRadius: '16px', 
              boxShadow: '0 4px 20px rgba(37, 99, 235, 0.06)',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              gap: 2,
              mx: 'auto',
              width: '100%',
              maxWidth: 480
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ bgcolor: 'primary.50', color: 'primary.main', width: 38, height: 38 }}>
                <BankIcon fontSize="small" />
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', lineHeight: 1 }}>
                  Tasa Oficial BCV
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 900, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {exchangeRate.toFixed(2)} <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6b7280' }}>VES</span>
                </Typography>
              </Box>
            </Box>
            
            <Divider orientation="vertical" flexItem />
            
            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 0.5, alignItems: 'center' }}>
              <TextField 
                size="small" 
                label="Editar"
                value={localRateInput}
                onChange={(e) => setLocalRateInput(e.target.value)}
                onBlur={handleRateSubmit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRateSubmit();
                  }
                }}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small" color="primary" onClick={handleRateSubmit}>
                          <PaymentIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    )
                  }
                }}
                sx={{ 
                  width: 100, 
                  '& .MuiOutlinedInput-root': { 
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    height: '34px'
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '0.8rem',
                    transform: 'translate(14px, 8px) scale(1)'
                  },
                  '& .MuiInputLabel-shrink': {
                    transform: 'translate(14px, -6px) scale(0.75)'
                  }
                }}
              />
              <Tooltip title="Sincronizar con BCV">
                <IconButton 
                  size="small"
                  color="primary" 
                  onClick={fetchBCVRate} 
                  disabled={loadingRate}
                  sx={{ bgcolor: 'primary.50', '&:hover': { bgcolor: 'primary.100' }, width: 34, height: 34 }}
                >
                  <SyncIcon fontSize="small" sx={{ animation: loadingRate ? 'spin 2s linear infinite' : 'none' }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Historial de Tasas">
                <IconButton 
                  size="small"
                  color="secondary" 
                  onClick={() => setOpenHistory(true)}
                  sx={{ bgcolor: 'secondary.50', '&:hover': { bgcolor: 'secondary.100' }, width: 34, height: 34 }}
                >
                  <HistoryIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', maxWidth: 180 }}>
              <WarehouseIcon color="action" fontSize="small" />
              <TextField
                select
                size="small"
                fullWidth
                label={t('Inventory')}
                value={warehouseId}
                onChange={(e) => setWarehouseId(Number(e.target.value))}
                slotProps={{
                  select: {
                    sx: { borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', height: '34px' }
                  }
                }}
              >
                {warehouses.map((w: any) => (
                  <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
                ))}
              </TextField>
            </Box>
            <Tooltip title="Ventas en Espera">
              <IconButton 
                color="secondary" 
                onClick={() => setOpenParkedDialog(true)}
                sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '10px', p: '6px' }}
              >
                <PlayArrowIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Grid>
      </Grid>
      
      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper elevation={1} sx={{ p: 3, borderRadius: 3, mb: 3 }}>
            <TextField 
              fullWidth 
              placeholder={t('Search products') + "..."} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              slotProps={{ input: { startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} /> } }}
            />
          </Paper>

          <Grid container spacing={2.5}>
            {filteredProducts.map((prod: any) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={prod.id}>
                <Card 
                  elevation={0} 
                  sx={{ 
                    borderRadius: '16px', 
                    border: '1.5px solid', 
                    borderColor: 'divider', 
                    cursor: prod.stock > 0 ? 'pointer' : 'not-allowed', 
                    position: 'relative',
                    overflow: 'hidden',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    opacity: prod.stock > 0 ? 1 : 0.65,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                    '&:hover': prod.stock > 0 ? { 
                      borderColor: 'primary.main', 
                      boxShadow: '0 8px 24px rgba(37, 99, 235, 0.12)',
                      transform: 'translateY(-4px)'
                    } : {}
                  }}
                  onClick={() => {
                    if (prod.stock > 0) {
                      addToCart(prod);
                    }
                  }}
                >
                  <Box sx={{ 
                    height: '75px', 
                    background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', 
                    color: 'white', 
                    display: 'flex', 
                    alignItems: 'center', 
                    px: 2,
                    position: 'relative'
                  }}>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.25)', color: 'white', width: 36, height: 36, fontWeight: 800, fontSize: '0.9rem' }}>
                      {prod.name.substring(0, 2).toUpperCase()}
                    </Avatar>
                    <Box sx={{ ml: 1.5, overflow: 'hidden' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.85rem' }}>
                        {prod.name}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', fontSize: '0.75rem' }}>
                        SKU: {prod.sku}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Chip 
                        size="small"
                        label={prod.stock <= 0 ? 'Agotado' : (prod.stock <= prod.min_stock ? `Bajo Stock (${prod.stock})` : `En Stock (${prod.stock})`)} 
                        color={prod.stock <= 0 ? 'error' : (prod.stock <= prod.min_stock ? 'warning' : 'success')} 
                        sx={{ fontWeight: 700, borderRadius: '6px', fontSize: '0.75rem', height: '22px' }}
                      />
                    </Box>
                    
                    <Box sx={{ mt: 'auto' }}>
                      <Typography variant="h6" color="primary.main" sx={{ fontWeight: 850, lineHeight: 1.1, fontSize: '1.15rem' }}>
                        ${prod.price.toFixed(2)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, fontSize: '0.75rem' }}>
                        ≈ {(prod.price * exchangeRate).toFixed(2)} VES
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper elevation={1} sx={{ p: 0, borderRadius: 3, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%', minHeight: '650px' }}>
            <Box sx={{ p: 3, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>{t('Cart')}</Typography>
            </Box>
            
            <List sx={{ flexGrow: 1, overflow: 'auto', p: 0 }}>
              {cart.map((item, idx) => (
                <Box key={idx}>
                  <ListItem 
                    secondaryAction={
                      <IconButton edge="end" color="error" size="small" onClick={() => setCart(cart.filter((_, i) => i !== idx))}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    }
                    sx={{ py: 1.5 }}
                  >
                    <ListItemText 
                      primary={<Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>{item.name}</Typography>} 
                      secondary={
                        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, alignItems: 'center', mt: 0.5 }}>
                          <Button 
                            variant="outlined" 
                            size="small" 
                            sx={{ minWidth: 24, height: 24, p: 0, borderRadius: '4px', border: '1px solid' }}
                            onClick={() => {
                              if (item.qty > 1) {
                                  setCart(cart.map((c, i) => i === idx ? { ...c, qty: c.qty - 1 } : c));
                              } else {
                                  setCart(cart.filter((_, i) => i !== idx));
                              }
                            }}
                          >
                            -
                          </Button>
                          <Typography variant="body2" sx={{ fontWeight: 700, px: 0.5 }}>{item.qty}</Typography>
                          <Button 
                            variant="outlined" 
                            size="small" 
                            sx={{ minWidth: 24, height: 24, p: 0, borderRadius: '4px', border: '1px solid' }}
                            onClick={() => {
                              setCart(cart.map((c, i) => i === idx ? { ...c, qty: c.qty + 1 } : c));
                            }}
                          >
                            +
                          </Button>
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                            x ${item.price.toFixed(2)}
                          </Typography>
                          
                          <TextField
                            size="small"
                            variant="standard"
                            label="Desc %"
                            type="number"
                            value={item.discount || 0}
                            onChange={(e) => {
                              const val = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                              setCart(cart.map((c, i) => i === idx ? { ...c, discount: val } : c));
                            }}
                            slotProps={{ htmlInput: { min: 0, max: 100, style: { fontSize: '0.75rem', width: '35px', textAlign: 'center' } } }}
                            sx={{ ml: 2, transform: 'translateY(-4px)' }}
                          />
                        </Box>
                      } 
                    />
                    <Box sx={{ textAlign: 'right', mr: 2 }}>
                      {item.discount > 0 && (
                        <Typography variant="caption" sx={{ textDecoration: 'line-through', color: 'text.secondary', display: 'block' }}>
                          ${(item.price * item.qty).toFixed(2)}
                        </Typography>
                      )}
                      <Typography sx={{ fontWeight: 800, fontSize: '0.95rem' }}>
                        ${(item.price * item.qty * (1 - item.discount / 100)).toFixed(2)}
                      </Typography>
                    </Box>
                  </ListItem>
                  <Divider />
                </Box>
              ))}
            </List>

            <Box sx={{ p: 3, bgcolor: 'background.paper', borderTop: '1px solid', borderColor: 'divider' }}>
              {/* Payment Methods */}
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 1, display: 'block' }}>MÉTODO DE PAGO</Typography>
              <ToggleButtonGroup
                value={paymentMethod}
                exclusive
                onChange={(_, val) => val && setPaymentMethod(val)}
                fullWidth
                size="small"
                sx={{ mb: 3 }}
              >
                <ToggleButton value="cash" sx={{ py: 1 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <MoneyIcon fontSize="small" />
                    <Typography variant="caption">Efectivo</Typography>
                  </Box>
                </ToggleButton>
                <ToggleButton value="card" sx={{ py: 1 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <CardIcon fontSize="small" />
                    <Typography variant="caption">Tarjeta</Typography>
                  </Box>
                </ToggleButton>
                <ToggleButton value="transfer" sx={{ py: 1 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <BankIcon fontSize="small" />
                    <Typography variant="caption">Banco</Typography>
                  </Box>
                </ToggleButton>
              </ToggleButtonGroup>

              {/* Currency Toggle */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>MONEDA</Typography>
                <ToggleButtonGroup
                  value={currency}
                  exclusive
                  onChange={(_, val) => val && setCurrency(val)}
                  size="small"
                >
                  <ToggleButton value="USD" sx={{ px: 2 }}>USD</ToggleButton>
                  <ToggleButton value="LOCAL" sx={{ px: 2 }}>VES</ToggleButton>
                </ToggleButtonGroup>
              </Box>

              {/* Global Discount input */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, mt: 1 }}>
                <Typography variant="body2" color="text.secondary">Descuento Global (%)</Typography>
                <TextField
                  size="small"
                  type="number"
                  value={globalDiscount || 0}
                  onChange={(e) => setGlobalDiscount(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                  slotProps={{ htmlInput: { min: 0, max: 100, style: { fontSize: '0.85rem', width: '60px', textAlign: 'right' } } }}
                />
              </Box>

              <Divider sx={{ my: 1.5 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" color="text.secondary">Subtotal Bruto:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  ${cart.reduce((acc, item) => acc + (item.price * item.qty), 0).toFixed(2)}
                </Typography>
              </Box>

              {(globalDiscountAmountUSD > 0 || (subtotalBeforeGlobalDiscountUSD < cart.reduce((acc, item) => acc + (item.price * item.qty), 0))) && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" color="error.main">Descuentos:</Typography>
                  <Typography variant="body2" color="error.main" sx={{ fontWeight: 600 }}>
                    -${(cart.reduce((acc, item) => acc + (item.price * item.qty), 0) - subtotalUSD).toFixed(2)}
                  </Typography>
                </Box>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" color="text.secondary">Base Imponible:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>${subtotalUSD.toFixed(2)}</Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" color="text.secondary">IVA (16%):</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>${taxUSD.toFixed(2)}</Typography>
              </Box>

              {igtfUSD > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" color="warning.dark" sx={{ fontWeight: 600 }}>IGTF (3% Divisas):</Typography>
                  <Typography variant="body2" color="warning.dark" sx={{ fontWeight: 700 }}>${igtfUSD.toFixed(2)}</Typography>
                </Box>
              )}

              <Divider sx={{ my: 1.5 }} />
              
              <Box sx={{ textAlign: 'right', mb: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 900, color: 'primary.main', letterSpacing: '-1px' }}>
                  {currency === 'USD' ? `$${totalUSD.toFixed(2)}` : `${totalLocal.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} VES`}
                </Typography>
                {currency === 'LOCAL' ? (
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Total Ref: ${totalUSD.toFixed(2)}</Typography>
                ) : (
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    Equivalente: {totalLocal.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} VES
                  </Typography>
                )}
              </Box>

              <Button 
                variant="contained" 
                color="primary" 
                fullWidth 
                size="large" 
                startIcon={<PaymentIcon />} 
                onClick={handleInitiateCheckout}
                disabled={cart.length === 0 || !warehouseId}
                loading={createSaleMutation.isPending && !openFiscalDialog}
                sx={{ py: 1.5, fontSize: '1.2rem', borderRadius: '12px', boxShadow: '0 8px 16px rgba(96, 165, 250, 0.2)' }}
              >
                {t('Complete Sale')}
              </Button>

              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid size={12}>
                  <Button 
                    variant="outlined" 
                    color="warning" 
                    fullWidth 
                    startIcon={<PauseIcon />}
                    onClick={handleParkSale}
                    disabled={cart.length === 0}
                    sx={{ borderRadius: '12px' }}
                  >
                    Poner en Espera
                  </Button>
                </Grid>
              </Grid>

              <Button 
                variant="outlined" 
                color="error" 
                fullWidth 
                sx={{ mt: 2, borderRadius: '12px' }}
                onClick={() => setCloseRegisterDialog(true)}
              >
                Cerrar Caja (Arqueo)
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Exchange Rate History Dialog */}
      <Dialog open={openHistory} onClose={() => setOpenHistory(false)} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <HistoryIcon color="primary" /> {t('Exchange Rate History')}
        </DialogTitle>
        <DialogContent>
          <List>
            {history.map((h: any) => (
              <Box key={h.id}>
                <ListItem sx={{ py: 1.5 }}>
                  <ListItemText 
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography sx={{ fontWeight: 800, fontSize: '1.1rem' }}>{h.rate} VES</Typography>
                        <Chip 
                          label={h.provider} 
                          size="small" 
                          color={h.provider === 'BCV' ? 'success' : 'info'} 
                          variant="outlined"
                          sx={{ fontWeight: 700, borderRadius: '4px' }}
                        />
                      </Box>
                    }
                    secondary={new Date(h.created_at).toLocaleString()}
                  />
                </ListItem>
                <Divider />
              </Box>
            ))}
          </List>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenHistory(false)} fullWidth variant="outlined" sx={{ borderRadius: 3 }}>
            {t('Close')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Fiscal Data Dialog */}
      <Dialog open={openFiscalDialog} onClose={() => setOpenFiscalDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonAddIcon color="primary" /> Datos de Cliente (Factura Fiscal)
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Ingrese los datos del cliente. Si el RIF ya existe, los datos se actualizarán. Puede dejar los campos en blanco para consumidor final.
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField 
                label="RIF / CI (tax_id)" 
                fullWidth 
                value={fiscalData.tax_id}
                onChange={e => setFiscalData({...fiscalData, tax_id: e.target.value})}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField 
                label="Nombre / Razón Social" 
                fullWidth 
                value={fiscalData.name}
                onChange={e => setFiscalData({...fiscalData, name: e.target.value})}
              />
            </Grid>
            <Grid size={12}>
              <TextField 
                label="Dirección" 
                fullWidth 
                value={fiscalData.address}
                onChange={e => setFiscalData({...fiscalData, address: e.target.value})}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField 
                label="Teléfono" 
                fullWidth 
                value={fiscalData.phone}
                onChange={e => setFiscalData({...fiscalData, phone: e.target.value})}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenFiscalDialog(false)} color="inherit">Omitir y Facturar</Button>
          <Button onClick={handleProcessFiscalSale} variant="contained" color="primary" disabled={createCustomerMutation.isPending || createSaleMutation.isPending}>
            Confirmar y Facturar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Parked Sales Dialog */}
      <Dialog open={openParkedDialog} onClose={() => setOpenParkedDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <PauseIcon color="warning" /> Ventas en Espera
        </DialogTitle>
        <DialogContent dividers>
          {loadingParked ? <CircularProgress /> : parkedSales.length === 0 ? <Typography>No hay ventas en espera.</Typography> : (
            <List>
              {parkedSales.map((sale: any) => (
                <Box key={sale.id}>
                  <ListItem secondaryAction={
                    <Button variant="contained" size="small" onClick={() => loadParkedSale(sale)}>Cobrar</Button>
                  }>
                    <ListItemText 
                      primary={`Venta #${sale.id} - ${new Date(sale.created_at).toLocaleTimeString()}`}
                      secondary={`Subtotal: $${sale.subtotal} | Total: $${sale.total}`}
                    />
                  </ListItem>
                  <Divider />
                </Box>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenParkedDialog(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      <RegisterOpenDialog 
        open={openRegisterDialog} 
        onSuccess={() => setOpenRegisterDialog(false)} 
      />
      
      <RegisterCloseDialog 
        open={closeRegisterDialog} 
        onClose={() => setCloseRegisterDialog(false)} 
        session={cashSession}
      />
    </Box>
  );
}
