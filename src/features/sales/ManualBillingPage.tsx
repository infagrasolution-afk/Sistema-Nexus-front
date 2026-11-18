import { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Grid, TextField, Button, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Divider, Autocomplete, Dialog, DialogTitle, DialogContent, DialogActions,
  MenuItem
} from '@mui/material';
import { 
  ReceiptLongRounded as InvoiceIcon, 
  DeleteOutlineRounded as DeleteIcon,
  SearchRounded as SearchIcon,
  TaskAltRounded as SaveIcon,
  PictureAsPdfRounded as DownloadIcon,
  PrintRounded as PrintIcon,
  PointOfSaleRounded as ThermalIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axiosConfig';
import { useAppStore } from '../../store/useAppStore';
import { saveOfflineSale } from '../../utils/offlineQueue';
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

export default function ManualBillingPage() {
  const queryClient = useQueryClient();
  const tenant = useAppStore((state: any) => state.tenant);
  const [items, setItems] = useState<any[]>([]);
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [warehouseId, setWarehouseId] = useState<number | ''>('');
  const [openBudgetDialog, setOpenBudgetDialog] = useState(false);
  const [budgetId, setBudgetId] = useState('');

  // New local states for discounts, currency, payment methods, 3 prices & SENIAT emission
  const [paymentMethod, setPaymentMethod] = useState('credit');
  const [currency, setCurrency] = useState('USD');
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [exchangeRate, setExchangeRate] = useState(36.5);
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
    const payload = await fetchSaleDigitalInvoiceJson(lastEmittedSale, tenant);
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

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => (await api.get('/sales/customers')).data,
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => (await api.get('/inventory/warehouses')).data,
  });

  const [quickCustOpen, setQuickCustOpen] = useState(false);
  const [quickCustData, setQuickCustData] = useState({ name: '', tax_id: '', phone: '', email: '', address: '' });

  const createCustomerMutation = useMutation({
    mutationFn: (data: typeof quickCustData) => api.post('/sales/customers', data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setCustomerId(res.data.id);
      setQuickCustOpen(false);
      setQuickCustData({ name: '', tax_id: '', phone: '', email: '', address: '' });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || 'Error al registrar el cliente';
      alert(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  });

  useEffect(() => {
    if (warehouses.length > 0 && !warehouseId) {
      setWarehouseId(warehouses[0].id);
    }
  }, [warehouses]);

  const createSaleMutation = useMutation({
    mutationFn: (saleData: any) => api.post('/sales/', saleData),
    onSuccess: (response) => {
      const selectedCust = customers.find((c: any) => c.id === customerId) || null;
      const printableSale: PrintableSaleData = {
        id: response.data.id,
        invoiceNumber: response.data.fiscal_invoice_number || customInvoiceNumber || String(response.data.id).padStart(8, '0'),
        controlNumber: response.data.control_number || customControlNumber || `00-${String(response.data.id).padStart(8, '0')}`,
        createdAt: response.data.created_at || new Date().toISOString(),
        currency,
        exchangeRate,
        paymentMethod,
        customer: selectedCust,
        items: items.map((i: any) => ({
          sku: i.sku,
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.unit_price * (1 - globalDiscount / 100),
          discount: i.discount || 0,
          taxExempt: Boolean(i.tax_exempt),
          priceTier: i.price_tier || 1
        })),
        subtotalUsd: subtotal,
        taxUsd: tax,
        igtfUsd: igtf,
        totalUsd: total
      };
      setLastEmittedSale(printableSale);
      executeFiscalEmission(emissionMode, printableSale, tenant, thermalWidth);

      setItems([]);
      setCustomerId(null);
      setCustomInvoiceNumber('');
      setCustomControlNumber('');
      if (budgetId) {
        api.put(`/sales/budgets/${budgetId}/approve`).catch(e => console.error(e));
      }
      setBudgetId('');
      queryClient.invalidateQueries({ queryKey: ['sales'] });
    },
    onError: (_err: any, variables: any) => {
      const saved = saveOfflineSale(variables, {
        subtotal,
        tax,
        igtf,
        total,
        currency,
      });
      const selectedCust = customers.find((c: any) => c.id === customerId) || null;
      const printableSale: PrintableSaleData = {
        id: saved.local_id,
        invoiceNumber: customInvoiceNumber || `OFF-${String(Date.now()).slice(-6)}`,
        controlNumber: customControlNumber || `00-${String(Date.now()).slice(-8)}`,
        createdAt: saved.created_at,
        currency,
        exchangeRate,
        paymentMethod,
        customer: selectedCust,
        items: items.map((i: any) => ({
          sku: i.sku,
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.unit_price * (1 - globalDiscount / 100),
          discount: i.discount || 0,
          taxExempt: Boolean(i.tax_exempt),
          priceTier: i.price_tier || 1,
        })),
        subtotalUsd: subtotal,
        taxUsd: tax,
        igtfUsd: igtf,
        totalUsd: total,
      };
      setLastEmittedSale(printableSale);
      executeFiscalEmission(emissionMode, printableSale, tenant, thermalWidth);
      setItems([]);
      setCustomerId(null);
      alert(
        '⚡ FACTURA GUARDADA EN CONTINGENCIA OFFLINE\n\nNo hay conexión a internet en este momento, pero la factura fue impresa y guardada localmente de forma segura. Se enviará automáticamente a la Base de Datos apenas regrese el internet.'
      );
    },
  });

  const handleAddItem = (product: any) => {
    if (!product) return;
    const exists = items.find(i => i.product_id === product.id);
    if (exists) {
      setItems(items.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      const selectedPrice = getProductPriceByTier(product, defaultPriceTier);
      setItems([
        ...items,
        {
          product_id: product.id,
          sku: product.sku,
          name: product.name,
          quantity: 1,
          price_1: Number(product.price || 0),
          price_2: Number(product.price_2 || 0),
          price_3: Number(product.price_3 || 0),
          price_tier: defaultPriceTier,
          unit_price: selectedPrice,
          tax_exempt: Boolean(product.tax_exempt),
          discount: 0
        }
      ]);
    }
  };

  const handleGlobalPriceTierChange = (tier: PriceTier) => {
    setDefaultPriceTier(tier);
    setItems(prev => prev.map(item => {
      const prodObj = { price: item.price_1, price_2: item.price_2, price_3: item.price_3 };
      return {
        ...item,
        price_tier: tier,
        unit_price: getProductPriceByTier(prodObj, tier)
      };
    }));
  };

  const handleItemPriceTierChange = (index: number, tier: PriceTier) => {
    const newItems = [...items];
    const item = newItems[index];
    const prodObj = { price: item.price_1, price_2: item.price_2, price_3: item.price_3 };
    newItems[index] = {
      ...item,
      price_tier: tier,
      unit_price: getProductPriceByTier(prodObj, tier)
    };
    setItems(newItems);
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
      exchange_rate: currency === 'USD' ? exchangeRate : exchangeRate,
      cash_session_id: null,
      status: "COMPLETED",
      fiscal_invoice_number: customInvoiceNumber.trim() || null,
      control_number: customControlNumber.trim() || null,
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
      maxWidth: 1480, 
      mx: 'auto', 
      mt: { xs: 2, sm: 3 },
      px: { xs: 1, sm: 2 },
      pb: 8
    }}>
      <Paper elevation={0} sx={{ 
        p: { xs: 2, sm: 3.5 }, 
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

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 8.5 }}>
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <SearchIcon fontSize="small" color="primary" /> Datos del Cliente y Despacho
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Autocomplete
                    options={customers}
                    getOptionLabel={(option: any) => `${option.name} (${option.tax_id})`}
                    value={customers.find((c: any) => c.id === customerId) || null}
                    onChange={(_, newValue: any) => {
                      setCustomerId(newValue ? newValue.id : null);
                    }}
                    fullWidth
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        label="Seleccionar Cliente" 
                        variant="outlined" 
                        required
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                      />
                    )}
                    noOptionsText="No se encontraron clientes"
                  />
                  <Button 
                    variant="outlined"
                    onClick={() => setQuickCustOpen(true)}
                    sx={{ borderRadius: '12px', minWidth: '120px', height: '56px', fontWeight: 700 }}
                  >
                    + Nuevo
                  </Button>
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
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Renglones de Factura</Typography>
                  <TextField
                    select
                    size="small"
                    label="Tarifa / Precio Activo"
                    value={defaultPriceTier}
                    onChange={(e) => handleGlobalPriceTierChange(Number(e.target.value) as PriceTier)}
                    sx={{ minWidth: 215, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                  >
                    <MenuItem value={1}>🏷️ Precio 1 (Por Defecto / Detal)</MenuItem>
                    <MenuItem value={2}>📦 Precio 2 (Mayor / Especial)</MenuItem>
                    <MenuItem value={3}>💎 Precio 3 (Distribuidor / VIP)</MenuItem>
                  </TextField>
                </Box>
                <Autocomplete
                  options={products}
                  getOptionLabel={(option: any) => `${option.sku} - ${option.name} (P1:$${Number(option.price || 0).toFixed(2)}${Number(option.price_2) > 0 ? ` | P2:$${Number(option.price_2).toFixed(2)}` : ''}${Number(option.price_3) > 0 ? ` | P3:$${Number(option.price_3).toFixed(2)}` : ''})`}
                  sx={{ width: { xs: '100%', sm: 360 } }}
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
              
              <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '16px' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'grey.50' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800, py: 1.5, minWidth: 210 }}>Producto</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 800, width: 78 }}>Cant.</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 800, minWidth: 125 }}>Nivel Precio</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, width: 105 }}>Precio ($)</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 800, width: 76 }}>Desc %</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, minWidth: 96 }}>Subtotal</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 800, width: 56 }}>Acción</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                          <Typography color="text.disabled" variant="body2">No hay productos en la lista</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                    {items.map((item, index) => (
                      <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.86rem', minWidth: 210 }}>{item.name}</TableCell>
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
                        <TableCell align="center">
                          <TextField
                            select
                            size="small"
                            value={item.price_tier || 1}
                            onChange={(e) => handleItemPriceTierChange(index, Number(e.target.value) as PriceTier)}
                            sx={{ minWidth: 92, '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700 } }}
                          >
                            <MenuItem value={1}>P1 (${Number(item.price_1 || item.unit_price || 0).toFixed(2)})</MenuItem>
                            <MenuItem value={2}>P2 (${Number(item.price_2 > 0 ? item.price_2 : (item.price_1 || item.unit_price || 0)).toFixed(2)})</MenuItem>
                            <MenuItem value={3}>P3 (${Number(item.price_3 > 0 ? item.price_3 : (item.price_1 || item.unit_price || 0)).toFixed(2)})</MenuItem>
                          </TextField>
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
                        <TableCell align="right" sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>
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

          <Grid size={{ xs: 12, lg: 3.5 }}>
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
              <Box sx={{ mb: 2 }}>
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

              {/* Modo de Emisión Fiscal SENIAT (Térmica + Digital en Paralelo) */}
              <Box sx={{ mb: 2, p: 1.5, borderRadius: '12px', bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main', display: 'block', mb: 1 }}>
                  🇻🇪 MODALIDAD DE EMISIÓN SENIAT
                </Typography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Salida de Facturación"
                  value={emissionMode}
                  onChange={(e) => setEmissionMode(e.target.value as EmissionMode)}
                  sx={{ mb: 1.5, bgcolor: 'background.paper', '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: '0.82rem', fontWeight: 700 } }}
                >
                  <MenuItem value="ambos">⚡ En Paralelo (Térmica + Factura Digital)</MenuItem>
                  <MenuItem value="termica">🧾 Impresora Térmica (Ticket POS)</MenuItem>
                  <MenuItem value="digital">📄 Factura Digital SENIAT (Carta / PDF)</MenuItem>
                </TextField>

                {(emissionMode === 'ambos' || emissionMode === 'termica') && (
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Ancho Impresora Térmica"
                    value={thermalWidth}
                    onChange={(e) => setThermalWidth(Number(e.target.value) as 80 | 58)}
                    sx={{ mb: 1.5, bgcolor: 'background.paper', '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: '0.8rem' } }}
                  >
                    <MenuItem value={80}>Impresora Térmica 80mm (Estándar)</MenuItem>
                    <MenuItem value={58}>Impresora Térmica 58mm (Compacta)</MenuItem>
                  </TextField>
                )}

                <Grid container spacing={1}>
                  <Grid size={{ xs: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="N° Factura (Opc.)"
                      placeholder="Auto"
                      value={customInvoiceNumber}
                      onChange={(e) => setCustomInvoiceNumber(e.target.value)}
                      sx={{ bgcolor: 'background.paper', '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '0.78rem' } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="N° Control SENIAT"
                      placeholder="00-Auto"
                      value={customControlNumber}
                      onChange={(e) => setCustomControlNumber(e.target.value)}
                      sx={{ bgcolor: 'background.paper', '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '0.78rem' } }}
                    />
                  </Grid>
                </Grid>
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
                {emissionMode === 'ambos'
                  ? 'Emitir (Térmica + Digital SENIAT)'
                  : emissionMode === 'termica'
                    ? 'Emitir e Imprimir Ticket Térmico'
                    : 'Emitir Factura Digital SENIAT'}
              </Button>

              {lastEmittedSale && (
                <Box sx={{ mt: 2, p: 1.5, borderRadius: '12px', bgcolor: 'success.50', border: '1px solid', borderColor: 'success.200' }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'success.dark', display: 'block', mb: 1 }}>
                    ✅ Última Factura #{lastEmittedSale.invoiceNumber} (Control: {lastEmittedSale.controlNumber})
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<ThermalIcon />}
                      onClick={() => printThermalTicketVenezuela(lastEmittedSale, tenant, thermalWidth)}
                      sx={{ flex: 1, fontSize: '0.72rem', fontWeight: 700, textTransform: 'none' }}
                    >
                      Ticket Térmico
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<PrintIcon />}
                      onClick={() => printDigitalInvoiceVenezuela(lastEmittedSale, tenant)}
                      sx={{ flex: 1, fontSize: '0.72rem', fontWeight: 700, textTransform: 'none' }}
                    >
                      Factura Digital
                    </Button>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                    <Button
                      size="small"
                      variant="contained"
                      color="secondary"
                      disabled={sendingToApi}
                      onClick={handleTransmitDigitalInvoice}
                      sx={{ flex: 1, fontSize: '0.7rem', fontWeight: 700, textTransform: 'none' }}
                    >
                      {sendingToApi ? 'Enviando JSON...' : '🚀 Enviar a Proveedor (API)'}
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="secondary"
                      onClick={handleViewSeniatJson}
                      sx={{ flex: 1, fontSize: '0.7rem', fontWeight: 700, textTransform: 'none' }}
                    >
                      🧩 Ver JSON SENIAT
                    </Button>
                  </Box>
                </Box>
              )}
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

      <Dialog 
        open={quickCustOpen} 
        onClose={() => setQuickCustOpen(false)} 
        maxWidth="sm" 
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: '20px' } } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Registrar Nuevo Cliente</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Nombre / Razón Social"
                size="small"
                value={quickCustData.name}
                onChange={e => setQuickCustData({ ...quickCustData, name: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="RIF / Identificación Fiscal"
                size="small"
                value={quickCustData.tax_id}
                onChange={e => setQuickCustData({ ...quickCustData, tax_id: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Teléfono"
                size="small"
                value={quickCustData.phone}
                onChange={e => setQuickCustData({ ...quickCustData, phone: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Correo Electrónico"
                size="small"
                value={quickCustData.email}
                onChange={e => setQuickCustData({ ...quickCustData, email: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Dirección Completa"
                size="small"
                multiline
                rows={2}
                value={quickCustData.address}
                onChange={e => setQuickCustData({ ...quickCustData, address: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setQuickCustOpen(false)} color="inherit" sx={{ fontWeight: 600 }}>Cancelar</Button>
          <Button 
            variant="contained" 
            onClick={() => createCustomerMutation.mutate(quickCustData)} 
            disabled={!quickCustData.name || !quickCustData.tax_id || createCustomerMutation.isPending}
            sx={{ borderRadius: '10px', px: 3, fontWeight: 700 }}
          >
            Registrar Cliente
          </Button>
        </DialogActions>
      </Dialog>

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
