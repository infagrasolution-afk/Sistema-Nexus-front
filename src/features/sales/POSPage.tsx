import { useState, useEffect } from 'react';
import { 
  Box, Typography, Grid, Paper, TextField, Button, List, 
  ListItem, ListItemText, Divider, IconButton, MenuItem,
  ToggleButton, ToggleButtonGroup, Tooltip, Dialog, 
  DialogTitle, DialogContent, DialogActions, Chip 
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
  Sync as SyncIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../../api/axiosConfig';
import { useAppStore } from '../../store/useAppStore';
import { getComputerUID } from '../../utils/computer';
import { RegisterOpenDialog, RegisterCloseDialog } from './RegisterDialogs';

export default function POSPage() {
  const { t } = useTranslation();
  const [cart, setCart] = useState<{id: number, name: string, price: number, qty: number}[]>([]);
  const [warehouseId, setWarehouseId] = useState<number | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [currency, setCurrency] = useState('USD');
  const [exchangeRate, setExchangeRate] = useState(1.0);
  const [loadingRate, setLoadingRate] = useState(true);
  const [openHistory, setOpenHistory] = useState(false);
  const [openRegisterDialog, setOpenRegisterDialog] = useState(false);
  const [closeRegisterDialog, setCloseRegisterDialog] = useState(false);
  
  const { user, cashSession, setCashSession } = useAppStore();
  
  const queryClient = useQueryClient();

  const { data: history = [] } = useQuery({
    queryKey: ['exchange-history'],
    queryFn: async () => (await api.get('/inventory/exchange-rate/history')).data,
    enabled: openHistory
  });

  const { isLoading: loadingSession } = useQuery({
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
    onSuccess: (response) => {
      alert(t('Sale completed successfully!'));
      setCart([]);
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      window.open(`${api.defaults.baseURL}/sales/${response.data.id}/pdf`, '_blank');
    },
  });

  const addToCart = (product: any) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, { id: product.id, name: product.name, price: product.price, qty: 1 }]);
    }
  };

  const handleCheckout = () => {
    if (!warehouseId || cart.length === 0) return;
    createSaleMutation.mutate({
      customer_id: 1,
      warehouse_id: warehouseId,
      payment_method: paymentMethod,
      currency: currency,
      exchange_rate: currency === 'USD' ? 1 : exchangeRate,
      cash_session_id: cashSession?.id,
      details: cart.map(item => ({
        product_id: item.id,
        quantity: item.qty,
        unit_price: item.price
      }))
    });
  };

  const filteredProducts = products.filter((p: any) => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const subtotalUSD = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const taxUSD = subtotalUSD * 0.16;
  const totalUSD = subtotalUSD + taxUSD;
  
  const totalLocal = totalUSD * exchangeRate;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>{t('Point of Sale')}</Typography>
          {cashSession && (
            <Typography variant="subtitle2" color="primary.main" sx={{ fontWeight: 700, mt: 0.5 }}>
              {cashSession.register.name} | Usuario: {user?.email?.split('@')[0]}
            </Typography>
          )}
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Exchange Rate Edit */}
          <Paper sx={{ px: 2, py: 1, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.100', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box>
              <Typography variant="caption" color="primary.main" sx={{ fontWeight: 700, display: 'block' }}>
                {loadingRate ? 'Cargando BCV...' : 'Tasa Oficial BCV'}
              </Typography>
              <TextField 
                variant="standard" 
                size="small" 
                value={exchangeRate}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setExchangeRate(val);
                  updateRateMutation.mutate(val);
                }}
                sx={{ width: 80, '& .MuiInput-input': { fontWeight: 800, color: 'primary.dark' } }}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Tooltip title="Sincronizar con BCV">
                <span>
                  <IconButton size="small" color="primary" onClick={fetchBCVRate} disabled={loadingRate}>
                    <SyncIcon fontSize="small" sx={{ animation: loadingRate ? 'spin 2s linear infinite' : 'none' }} />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Ver Historial">
                <span>
                  <IconButton size="small" color="primary" onClick={() => setOpenHistory(true)}>
                    <HistoryIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          </Paper>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarehouseIcon color="action" fontSize="small" />
            <TextField
              select
              size="small"
              label={t('Inventory')}
              value={warehouseId}
              onChange={(e) => setWarehouseId(Number(e.target.value))}
              sx={{ width: 200 }}
            >
              {warehouses.map((w: any) => (
                <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
              ))}
            </TextField>
          </Box>
        </Box>
      </Box>
      
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

          <Grid container spacing={2}>
            {filteredProducts.map((prod: any) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={prod.id}>
                <Paper 
                  elevation={0} 
                  sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', cursor: 'pointer', '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.50' } }}
                  onClick={() => addToCart(prod)}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{prod.name}</Typography>
                  <Typography variant="body2" color="text.secondary">${prod.price.toFixed(2)}</Typography>
                  <Typography variant="caption" color="text.disabled">SKU: {prod.sku}</Typography>
                </Paper>
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
                  <ListItem secondaryAction={
                    <IconButton edge="end" color="error" onClick={() => setCart(cart.filter((_, i) => i !== idx))}>
                      <DeleteIcon />
                    </IconButton>
                  }>
                    <ListItemText 
                      primary={<Typography sx={{ fontWeight: 500 }}>{item.name}</Typography>} 
                      secondary={`${item.qty} x $${item.price.toFixed(2)}`} 
                    />
                    <Typography sx={{ fontWeight: 600 }}>${(item.price * item.qty).toFixed(2)}</Typography>
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

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography color="text.secondary">{t('Subtotal')}</Typography>
                <Typography sx={{ fontWeight: 500 }}>${subtotalUSD.toFixed(2)}</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ textAlign: 'right', mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main' }}>
                  {currency === 'USD' ? `$${totalUSD.toFixed(2)}` : `${totalLocal.toLocaleString()} VES`}
                </Typography>
                {currency === 'LOCAL' && (
                  <Typography variant="caption" color="text.secondary">Total USD: ${totalUSD.toFixed(2)}</Typography>
                )}
              </Box>

              <Button 
                variant="contained" 
                color="primary" 
                fullWidth 
                size="large" 
                startIcon={<PaymentIcon />} 
                onClick={handleCheckout}
                disabled={cart.length === 0 || !warehouseId}
                loading={createSaleMutation.isPending}
                sx={{ py: 2, fontSize: '1.2rem', borderRadius: '12px', boxShadow: '0 8px 16px rgba(96, 165, 250, 0.2)' }}
              >
                {t('Complete Sale')}
              </Button>

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
