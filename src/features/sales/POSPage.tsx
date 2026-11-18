import { useState, useEffect } from 'react';
import { 
  Box, Typography, Grid, Paper, TextField, Button, List, 
  ListItem, ListItemText, Divider, IconButton, MenuItem,
  ToggleButton, ToggleButtonGroup, Tooltip, Dialog, 
  DialogTitle, DialogContent, DialogActions, Chip, CircularProgress,
  Card, CardContent, InputAdornment, Avatar
} from '@mui/material';
import { 
  SearchRounded as SearchIcon, 
  DeleteOutlineRounded as DeleteIcon, 
  PaymentsRounded as PaymentIcon,
  WarehouseRounded as WarehouseIcon,
  PaidRounded as MoneyIcon,
  CreditCardRounded as CardIcon,
  AccountBalanceRounded as BankIcon,
  HistoryRounded as HistoryIcon,
  SyncRounded as SyncIcon,
  PersonAddAlt1Rounded as PersonAddIcon,
  PauseCircleOutlineRounded as PauseIcon,
  PlayCircleOutlineRounded as PlayArrowIcon,
  CloudDoneRounded as OnlineIcon,
  CloudOffRounded as OfflineIcon,
  PrintRounded as PrintIcon,
  ReceiptLongRounded as ThermalIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Autocomplete } from '@mui/material';
import api from '../../api/axiosConfig';
import { useAppStore } from '../../store/useAppStore';
import { saveOfflineSale, getOfflineSales, syncOfflineSales } from '../../utils/offlineQueue';
import {
  type PriceTier,
  type EmissionMode,
  getProductPriceByTier,
  executeFiscalEmission,
  printThermalTicketVenezuela,
  printDigitalInvoiceVenezuela,
  fetchSaleDigitalInvoiceJson,
  sendSaleToDigitalProviderApi,
  type PrintableSaleData
} from '../../utils/venezuelaFiscalPrint';

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
  const tenant = useAppStore((state: any) => state.tenant);
  const [cart, setCart] = useState<{
    id: number;
    sku?: string;
    name: string;
    price: number;
    price_1: number;
    price_2: number;
    price_3: number;
    price_tier: PriceTier;
    tax_exempt?: boolean;
    qty: number;
    discount: number;
  }[]>([]);
  const [defaultPriceTier, setDefaultPriceTier] = useState<PriceTier>(1);
  const [emissionMode, setEmissionMode] = useState<EmissionMode>(
    (tenant?.settings?.default_emission_mode as EmissionMode) || 'digital'
  );

  useEffect(() => {
    const mode = tenant?.settings?.default_emission_mode as EmissionMode | undefined;
    if (mode === 'digital' || mode === 'termica' || mode === 'ambos') {
      setEmissionMode(mode);
    }
  }, [tenant?.settings?.default_emission_mode]);
  const [thermalWidth, setThermalWidth] = useState<80 | 58>(80);
  const [customInvoiceNumber, setCustomInvoiceNumber] = useState('');
  const [customControlNumber, setCustomControlNumber] = useState('');
  const [lastEmittedSale, setLastEmittedSale] = useState<PrintableSaleData | null>(null);
  const [jsonModalData, setJsonModalData] = useState<any>(null);
  const [sendingToApi, setSendingToApi] = useState(false);

  const handleViewSeniatJson = async () => {
    if (!lastEmittedSale) return;
    const payload = await fetchSaleDigitalInvoiceJson(lastEmittedSale, useAppStore.getState().tenant);
    setJsonModalData({ title: `JSON Fiscal SENIAT — Factura #${lastEmittedSale.invoiceNumber}`, data: payload });
  };

  const handleTransmitDigitalInvoice = async () => {
    if (!lastEmittedSale) return;
    setSendingToApi(true);
    try {
      const res = await sendSaleToDigitalProviderApi(lastEmittedSale.id);
      if (res.control_number) {
        setLastEmittedSale({
          ...lastEmittedSale,
          controlNumber: res.control_number,
          invoiceNumber: res.fiscal_invoice_number || lastEmittedSale.invoiceNumber
        });
      }
      setJsonModalData({
        title: `Transmisión API REST Imprenta Digital — Factura #${lastEmittedSale.invoiceNumber}`,
        data: res
      });
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error al enviar el JSON a la API del proveedor');
    } finally {
      setSendingToApi(false);
    }
  };
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
  
  // Estado de contingencia Offline
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineCount, setOfflineCount] = useState(getOfflineSales().length);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      // Auto-sincronizar ventas offline al regresar la conexión
      const pending = getOfflineSales();
      if (pending.length > 0) {
        setIsSyncing(true);
        const { synced } = await syncOfflineSales(api);
        setOfflineCount(getOfflineSales().length);
        setIsSyncing(false);
        if (synced > 0) {
          alert(`✅ Conexión restablecida: Se sincronizaron exitosamente ${synced} ventas guardadas en modo contingencia.`);
        }
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    const { synced, failed } = await syncOfflineSales(api);
    setOfflineCount(getOfflineSales().length);
    setIsSyncing(false);
    if (synced > 0) {
      alert(`✅ Sincronizadas ${synced} ventas offline.${failed > 0 ? ` (${failed} pendientes)` : ''}`);
      queryClient.invalidateQueries({ queryKey: ['sales'] });
    } else if (failed > 0) {
      alert(`⚠️ No se pudieron sincronizar ${failed} ventas. Verifica la conexión con el servidor.`);
    } else {
      alert('No hay ventas offline pendientes por sincronizar.');
    }
  };
  
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
        const isWizardActive = sessionStorage.getItem('apex_wizard_active') === 'true';
        if (!res.data && !isWizardActive) setOpenRegisterDialog(true);
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

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => (await api.get('/sales/customers')).data,
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
        const tenantObj = useAppStore.getState().tenant;
        const printableSale: PrintableSaleData = {
          id: response.data.id,
          invoiceNumber: response.data.fiscal_invoice_number || customInvoiceNumber || String(response.data.id).padStart(8, '0'),
          controlNumber: response.data.control_number || customControlNumber || `00-${String(response.data.id).padStart(8, '0')}`,
          createdAt: response.data.created_at || new Date().toISOString(),
          currency,
          exchangeRate,
          paymentMethod,
          customer: {
            name: fiscalData.name || 'CONSUMIDOR FINAL',
            tax_id: fiscalData.tax_id || 'V-00000000-0',
            phone: fiscalData.phone || '',
            address: fiscalData.address || ''
          },
          items: cart.map(item => ({
            sku: item.sku,
            name: item.name,
            quantity: item.qty,
            unitPrice: item.price * (1 - globalDiscount / 100),
            discount: item.discount || 0,
            taxExempt: Boolean(item.tax_exempt),
            priceTier: item.price_tier || 1
          })),
          subtotalUsd: subtotalUSD,
          taxUsd: taxUSD,
          igtfUsd: igtfUSD,
          totalUsd: totalUSD
        };
        setLastEmittedSale(printableSale);
        executeFiscalEmission(emissionMode, printableSale, tenantObj, thermalWidth);

        setCart([]);
        setCustomInvoiceNumber('');
        setCustomControlNumber('');
        queryClient.invalidateQueries({ queryKey: ['sales'] });
      }
    },
    onError: (_error: any, variables: any) => {
      // Contingencia Offline ante caídas de internet/luz
      saveOfflineSale(variables, {
        subtotal: subtotalUSD,
        tax: taxUSD,
        igtf: igtfUSD,
        total: totalUSD,
        currency: currency
      });
      setOfflineCount(getOfflineSales().length);
      setCart([]);
      alert(
        "⚡ MODO CONTINGENCIA OFFLINE ACTIVADO\n\n" +
        "La conexión con el servidor falló o no hay internet. La venta ha sido registrada y guardada en este equipo local de forma segura.\n" +
        "Puedes seguir cobrando normalmente a los clientes; las ventas se sincronizarán solas al volver la conexión."
      );
    }
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
      const selectedPrice = getProductPriceByTier(product, defaultPriceTier);
      setCart([
        ...cart,
        {
          id: product.id,
          sku: product.sku,
          name: product.name,
          price: selectedPrice,
          price_1: Number(product.price || 0),
          price_2: Number(product.price_2 || 0),
          price_3: Number(product.price_3 || 0),
          price_tier: defaultPriceTier,
          tax_exempt: Boolean(product.tax_exempt),
          qty: 1,
          discount: 0
        }
      ]);
    }
  };

  const handleGlobalPriceTierChange = (tier: PriceTier) => {
    setDefaultPriceTier(tier);
    setCart(prev => prev.map(item => {
      const prodObj = { price: item.price_1, price_2: item.price_2, price_3: item.price_3 };
      return {
        ...item,
        price_tier: tier,
        price: getProductPriceByTier(prodObj, tier)
      };
    }));
  };

  const handleCartItemTierChange = (idx: number, tier: PriceTier) => {
    setCart(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      const prodObj = { price: item.price_1, price_2: item.price_2, price_3: item.price_3 };
      return {
        ...item,
        price_tier: tier,
        price: getProductPriceByTier(prodObj, tier)
      };
    }));
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

    let fiscalInvoiceNumber: string | null = null;
    let printerSerial: string | null = null;
    
    const tenantSettings = useAppStore.getState().tenant?.settings || {};
    const printerBrand = tenantSettings.fiscal_printer_brand || 'none';
    const printerPort = tenantSettings.fiscal_printer_port || 'COM1';

    if (printerBrand !== 'none') {
      try {
        const payload = {
          brand: printerBrand,
          port: printerPort,
          customer: {
            name: fiscalData.name || 'CONSUMIDOR FINAL',
            tax_id: fiscalData.tax_id || 'V-999999999',
            phone: fiscalData.phone || '',
            address: fiscalData.address || ''
          },
          payment_method: paymentMethod,
          currency: currency,
          exchange_rate: exchangeRate,
          totals: {
            subtotal: subtotalUSD,
            tax: taxUSD,
            igtf: igtfUSD,
            total: totalUSD
          },
          items: cart.map(item => ({
            name: item.name,
            qty: item.qty,
            price: item.price * (1 - (item.discount || 0) / 100) * (1 - globalDiscount / 100),
            tax_rate: 16.0
          }))
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout for local printer
        const printRes = await fetch('http://localhost:8080/print', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (printRes.ok) {
          const printData = await printRes.json();
          fiscalInvoiceNumber = printData.invoice_number || null;
          printerSerial = printData.printer_serial || null;
          alert("✨ Factura Fiscal Impresa con Éxito: #" + fiscalInvoiceNumber);
        } else {
          const proceed = confirm("⚠️ La impresora fiscal local retornó un error. ¿Desea completar la venta de todas formas sin imprimir ticket fiscal?");
          if (!proceed) return;
        }
      } catch (err) {
        console.error("Local printing failed", err);
        const proceed = confirm("⚠️ El Agente Fiscal Local está desconectado o apagado. ¿Desea completar la venta de todas formas sin imprimir ticket fiscal?");
        if (!proceed) return;
      }
    }

    createSaleMutation.mutate({
      customer_id: customerId,
      warehouse_id: warehouseId,
      payment_method: paymentMethod,
      currency: currency,
      exchange_rate: currency === 'USD' ? exchangeRate : exchangeRate,
      cash_session_id: cashSession?.id,
      status: "COMPLETED",
      fiscal_invoice_number: fiscalInvoiceNumber || customInvoiceNumber.trim() || null,
      control_number: customControlNumber.trim() || null,
      printer_serial: printerSerial,
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
                  • {cashSession?.register?.name || 'Sin Caja Abierta'} • Cajero: {user?.username || user?.email?.split('@')[0]}
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

        <Grid size={{ xs: 12, md: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
            {/* Indicador de Conectividad y Contingencia Offline */}
            <Chip 
              icon={isOnline ? <OnlineIcon sx={{ fontSize: '1rem !important' }} /> : <OfflineIcon sx={{ fontSize: '1rem !important' }} />}
              label={isOnline ? "En Línea" : "Offline"}
              color={isOnline ? "success" : "warning"}
              size="small"
              sx={{ fontWeight: 700, borderRadius: '8px', height: '30px' }}
            />
            {offlineCount > 0 && (
              <Button
                size="small"
                variant="contained"
                color="warning"
                startIcon={<SyncIcon sx={{ animation: isSyncing ? 'spin 1.5s linear infinite' : 'none' }} />}
                onClick={handleManualSync}
                disabled={isSyncing || !isOnline}
                sx={{ borderRadius: '8px', fontWeight: 800, textTransform: 'none', height: '30px', px: 1.5, fontSize: '0.75rem' }}
              >
                Sincronizar ({offlineCount})
              </Button>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', maxWidth: 160 }}>
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
          <Paper elevation={1} sx={{ p: 2.5, borderRadius: 3, mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField 
              sx={{ flex: 1, minWidth: 220 }}
              size="small"
              placeholder={t('Search products') + "..."} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              slotProps={{ input: { startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} /> } }}
            />
            <TextField
              select
              size="small"
              label="Nivel de Precio Activo"
              value={defaultPriceTier}
              onChange={(e) => handleGlobalPriceTierChange(Number(e.target.value) as PriceTier)}
              sx={{ minWidth: 230 }}
            >
              <MenuItem value={1}>🏷️ Precio 1 (Por Defecto / Detal)</MenuItem>
              <MenuItem value={2}>📦 Precio 2 (Mayor / Especial)</MenuItem>
              <MenuItem value={3}>💎 Precio 3 (Distribuidor / VIP)</MenuItem>
            </TextField>
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
                        ${getProductPriceByTier(prod, defaultPriceTier).toFixed(2)}
                        {defaultPriceTier > 1 && (
                          <Chip label={`P${defaultPriceTier}`} size="small" color="secondary" sx={{ ml: 1, height: 18, fontSize: '0.65rem', fontWeight: 800 }} />
                        )}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, fontSize: '0.75rem', display: 'block' }}>
                        ≈ {(getProductPriceByTier(prod, defaultPriceTier) * exchangeRate).toFixed(2)} VES
                      </Typography>
                      {(Number(prod.price_2) > 0 || Number(prod.price_3) > 0) && (
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem', display: 'block', mt: 0.3 }}>
                          P1: ${Number(prod.price || 0).toFixed(2)}
                          {Number(prod.price_2) > 0 ? ` | P2: $${Number(prod.price_2).toFixed(2)}` : ''}
                          {Number(prod.price_3) > 0 ? ` | P3: $${Number(prod.price_3).toFixed(2)}` : ''}
                        </Typography>
                      )}
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
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                            x ${item.price.toFixed(2)}
                          </Typography>

                          <TextField
                            select
                            size="small"
                            variant="standard"
                            value={item.price_tier || 1}
                            onChange={(e) => handleCartItemTierChange(idx, Number(e.target.value) as PriceTier)}
                            sx={{ ml: 1, minWidth: 48, '& .MuiInputBase-root': { fontSize: '0.72rem', fontWeight: 800, color: 'primary.main' } }}
                          >
                            <MenuItem value={1}>P1 (${Number(item.price_1 || item.price).toFixed(2)})</MenuItem>
                            <MenuItem value={2}>P2 (${Number(item.price_2 > 0 ? item.price_2 : (item.price_1 || item.price)).toFixed(2)})</MenuItem>
                            <MenuItem value={3}>P3 (${Number(item.price_3 > 0 ? item.price_3 : (item.price_1 || item.price)).toFixed(2)})</MenuItem>
                          </TextField>
                          
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
                sx={{ py: 1.5, fontSize: '1.1rem', borderRadius: '12px', boxShadow: '0 8px 16px rgba(96, 165, 250, 0.2)' }}
              >
                {emissionMode === 'ambos'
                  ? 'Facturar (Térmica + Digital)'
                  : emissionMode === 'termica'
                    ? 'Facturar (Impresora Térmica)'
                    : 'Facturar (Digital SENIAT)'}
              </Button>

              {lastEmittedSale && (
                <Box sx={{ mt: 1.5, p: 1.2, borderRadius: '10px', bgcolor: 'success.50', border: '1px solid', borderColor: 'success.200' }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'success.dark', display: 'block', mb: 0.8 }}>
                    ✅ Factura #{lastEmittedSale.invoiceNumber} | Control: {lastEmittedSale.controlNumber}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<ThermalIcon />}
                      onClick={() => printThermalTicketVenezuela(lastEmittedSale, useAppStore.getState().tenant, thermalWidth)}
                      sx={{ flex: 1, fontSize: '0.7rem', fontWeight: 700, textTransform: 'none' }}
                    >
                      Ticket ({thermalWidth}mm)
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<PrintIcon />}
                      onClick={() => printDigitalInvoiceVenezuela(lastEmittedSale, useAppStore.getState().tenant)}
                      sx={{ flex: 1, fontSize: '0.7rem', fontWeight: 700, textTransform: 'none' }}
                    >
                      Factura Digital
                    </Button>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, mt: 0.8 }}>
                    <Button
                      size="small"
                      variant="contained"
                      color="secondary"
                      disabled={sendingToApi}
                      onClick={handleTransmitDigitalInvoice}
                      sx={{ flex: 1, fontSize: '0.68rem', fontWeight: 700, textTransform: 'none' }}
                    >
                      {sendingToApi ? 'Enviando...' : '🚀 Enviar API Digital'}
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="secondary"
                      onClick={handleViewSeniatJson}
                      sx={{ flex: 1, fontSize: '0.68rem', fontWeight: 700, textTransform: 'none' }}
                    >
                      🧩 JSON SENIAT
                    </Button>
                  </Box>
                </Box>
              )}

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
      <Dialog open={openFiscalDialog} onClose={() => setOpenFiscalDialog(false)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: '16px' } } }}>
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonAddIcon color="primary" /> Seleccionar / Registrar Cliente
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontWeight: 500 }}>
            Busca un cliente registrado en el sistema o ingresa los datos correspondientes para registrar uno nuevo automáticamente al facturar.
          </Typography>

          <Autocomplete
            options={customers}
            getOptionLabel={(option: any) => `${option.name} (${option.tax_id})`}
            value={customers.find((c: any) => c.tax_id === fiscalData.tax_id) || null}
            onChange={(_, newValue: any) => {
              if (newValue) {
                setFiscalData({
                  tax_id: newValue.tax_id || '',
                  name: newValue.name || '',
                  phone: newValue.phone || '',
                  address: newValue.address || ''
                });
              } else {
                setFiscalData({ tax_id: '', name: '', phone: '', address: '' });
              }
            }}
            renderInput={(params) => (
              <TextField 
                {...params} 
                label="Buscar por Nombre o RIF" 
                variant="outlined"
                placeholder="Escribe para buscar..."
                sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
            )}
            noOptionsText="No se encontraron clientes coincidentes"
          />

          <Divider sx={{ my: 2, borderStyle: 'dashed' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>DATOS DE FACTURACIÓN</Typography>
          </Divider>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField 
                label="RIF / CI / Identificación" 
                fullWidth 
                value={fiscalData.tax_id}
                onChange={e => setFiscalData({...fiscalData, tax_id: e.target.value})}
                slotProps={{ input: { sx: { borderRadius: '10px' } } }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField 
                label="Nombre / Razón Social" 
                fullWidth 
                value={fiscalData.name}
                onChange={e => setFiscalData({...fiscalData, name: e.target.value})}
                slotProps={{ input: { sx: { borderRadius: '10px' } } }}
              />
            </Grid>
            <Grid size={12}>
              <TextField 
                label="Dirección Fiscal" 
                fullWidth 
                value={fiscalData.address}
                onChange={e => setFiscalData({...fiscalData, address: e.target.value})}
                slotProps={{ input: { sx: { borderRadius: '10px' } } }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField 
                label="Teléfono" 
                fullWidth 
                value={fiscalData.phone}
                onChange={e => setFiscalData({...fiscalData, phone: e.target.value})}
                slotProps={{ input: { sx: { borderRadius: '10px' } } }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                select
                fullWidth
                label="Modalidad de Emisión SENIAT"
                value={emissionMode}
                onChange={(e) => setEmissionMode(e.target.value as EmissionMode)}
                slotProps={{ input: { sx: { borderRadius: '10px', fontWeight: 700 } } }}
              >
                <MenuItem value="ambos">⚡ En Paralelo: Térmica + Factura Digital</MenuItem>
                <MenuItem value="termica">🧾 Solo Impresora Térmica ({thermalWidth}mm)</MenuItem>
                <MenuItem value="digital">📄 Solo Factura Digital SENIAT</MenuItem>
              </TextField>
            </Grid>
            {(emissionMode === 'ambos' || emissionMode === 'termica') && (
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Formato Papel Térmico"
                  value={thermalWidth}
                  onChange={(e) => setThermalWidth(Number(e.target.value) as 80 | 58)}
                >
                  <MenuItem value={80}>80mm (Estándar POS)</MenuItem>
                  <MenuItem value={58}>58mm (Compacta)</MenuItem>
                </TextField>
              </Grid>
            )}
            <Grid size={{ xs: 12, md: (emissionMode === 'ambos' || emissionMode === 'termica') ? 4 : 6 }}>
              <TextField
                fullWidth
                size="small"
                label="N° Factura (Opcional)"
                placeholder="Automático"
                value={customInvoiceNumber}
                onChange={(e) => setCustomInvoiceNumber(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, md: (emissionMode === 'ambos' || emissionMode === 'termica') ? 4 : 6 }}>
              <TextField
                fullWidth
                size="small"
                label="N° Control SENIAT (Opcional)"
                placeholder="00-Automático"
                value={customControlNumber}
                onChange={(e) => setCustomControlNumber(e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button onClick={() => setOpenFiscalDialog(false)} color="inherit" sx={{ fontWeight: 600 }}>Cancelar</Button>
          <Button onClick={handleProcessFiscalSale} variant="contained" color="primary" disabled={createCustomerMutation.isPending || createSaleMutation.isPending} sx={{ borderRadius: '8px', fontWeight: 700 }}>
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

      <Dialog open={Boolean(jsonModalData)} onClose={() => setJsonModalData(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>{jsonModalData?.title}</DialogTitle>
        <DialogContent dividers>
          <Box
            component="pre"
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: '#0f172a',
              color: '#e2e8f0',
              fontSize: '0.75rem',
              overflowX: 'auto',
              maxHeight: 420,
            }}
          >
            {JSON.stringify(jsonModalData?.data, null, 2)}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            variant="outlined"
            onClick={() => {
              navigator.clipboard.writeText(JSON.stringify(jsonModalData?.data, null, 2));
              alert('JSON copiado al portapapeles');
            }}
          >
            Copiar JSON
          </Button>
          <Button variant="contained" onClick={() => setJsonModalData(null)}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
