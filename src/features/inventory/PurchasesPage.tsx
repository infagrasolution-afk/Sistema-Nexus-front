import { useState } from 'react';
import { 
  Box, Typography, Button, Paper, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, Grid, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Chip, Autocomplete
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon, 
  ShoppingCart as ShoppingCartIcon,
  Receipt as ReceiptIcon,
  Business as BusinessIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { useAppStore } from '../../store/useAppStore';

export default function PurchasesPage() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [reference, setReference] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [controlNumber, setControlNumber] = useState('');
  const [ivaWithholding, setIvaWithholding] = useState('0');
  const [islrWithholding, setIslrWithholding] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState('credit');
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
    setInvoiceNumber('');
    setControlNumber('');
    setIvaWithholding('0');
    setIslrWithholding('0');
    setPaymentMethod('credit');
    setItems([]);
  };

  const handleDownloadVoucher = async (purchaseId: number) => {
    try {
      const response = await api.get(`/fiscal/comprobante-iva/${purchaseId}`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `comprobante_iva_${purchaseId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      alert('Error al generar el comprobante de retención.');
    }
  };

  const handlePrintPurchaseOrder = (purchase: any) => {
    const tenant = useAppStore.getState().tenant;
    const brandColor = tenant?.primary_color || '#1e3a8a';
    const win = window.open('', '_blank');
    if (!win) {
      window.open(`${api.defaults.baseURL}/purchases/${purchase.id}/pdf`, '_blank');
      return;
    }

    const logoHtml = tenant?.logo_url
      ? `<img src="${tenant.logo_url}" alt="Logo Empresa" style="max-height:75px;max-width:190px;object-fit:contain;margin-bottom:6px;" />`
      : `<div style="font-size:24px;font-weight:900;color:${brandColor};">${(tenant?.name || 'EMPRESA S.A.').toUpperCase()}</div>`;

    const supplier = purchase.supplier || suppliers.find((s: any) => s.id === purchase.supplier_id) || {};
    const details = purchase.details || [];
    const rowsHtml = details.map((det: any, idx: number) => {
      const prod = det.product || products.find((p: any) => p.id === det.product_id) || {};
      const qty = Number(det.quantity || 0);
      const cost = Number(det.cost_price || 0);
      const sub = Number(det.subtotal || qty * cost);
      return `
        <tr>
          <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;text-align:center;">${idx + 1}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;font-family:monospace;">${prod.sku || `ID-${det.product_id}`}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;font-weight:600;">${prod.name || `Producto #${det.product_id}`}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;text-align:center;">${qty.toFixed(2)}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;text-align:right;">$${cost.toFixed(2)}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700;">$${sub.toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    const subtotal = Number(purchase.subtotal || purchase.total || 0);
    const taxTotal = Number(purchase.tax_total || 0);
    const total = Number(purchase.total || subtotal + taxTotal);

    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Orden de Compra OC-${String(purchase.id).padStart(6, '0')}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #0f172a; margin: 32px 40px; font-size: 12px; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid ${brandColor}; padding-bottom: 16px; margin-bottom: 20px; }
            .order-box { border: 2px solid ${brandColor}; border-radius: 10px; padding: 12px 18px; background: #f8fafc; min-width: 240px; }
            .supplier-box { border: 1px solid #cbd5e1; border-radius: 10px; padding: 14px 18px; background: #f8fafc; margin-bottom: 20px; }
            table.items { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
            table.items th { background: ${brandColor}; color: #fff; padding: 10px 8px; font-size: 11px; text-transform: uppercase; }
            .signatures { display: flex; justify-content: space-between; margin-top: 80px; }
            .sig-line { width: 42%; border-top: 2px dashed #64748b; text-align: center; padding-top: 10px; font-weight: 700; color: #334155; }
            .no-print { margin-bottom: 14px; display: flex; gap: 10px; }
            @media print { .no-print { display: none; } body { margin: 16px 22px; } }
          </style>
        </head>
        <body>
          <div class="no-print">
            <button onclick="window.print()" style="background:${brandColor};color:#fff;border:none;padding:8px 16px;border-radius:6px;font-weight:700;cursor:pointer;">
              🖨️ Imprimir Orden de Compra
            </button>
            <a href="${api.defaults.baseURL}/purchases/${purchase.id}/pdf" target="_blank" style="text-decoration:none;background:#e2e8f0;color:#0f172a;padding:8px 14px;border-radius:6px;font-weight:700;">
              📄 Descargar PDF Oficial
            </a>
          </div>
          <div class="header">
            <div>
              ${logoHtml}
              <div style="font-size:15px;font-weight:900;color:${brandColor};">${(tenant?.name || 'EMPRESA S.A.').toUpperCase()}</div>
              <div><strong>R.I.F.:</strong> ${tenant?.tax_id || 'J-00000000-0'}</div>
              <div><strong>Domicilio Fiscal:</strong> ${tenant?.address || 'Venezuela'}</div>
              ${tenant?.phone ? `<div><strong>Teléfono:</strong> ${tenant.phone}</div>` : ''}
            </div>
            <div class="order-box">
              <div style="font-size:15px;font-weight:900;color:${brandColor};text-align:center;margin-bottom:8px;">ORDEN DE COMPRA</div>
              <div><strong>N° Orden:</strong> <span style="color:#dc2626;font-weight:900;">OC-${String(purchase.id).padStart(6, '0')}</span></div>
              <div><strong>Fecha Emisión:</strong> ${new Date(purchase.created_at).toLocaleDateString('es-VE')}</div>
              <div><strong>Factura Prov.:</strong> ${purchase.invoice_number || purchase.reference || 'S/N'}</div>
              <div><strong>N° Control:</strong> ${purchase.control_number || 'N/A'}</div>
              <div><strong>Estado:</strong> ${purchase.status}</div>
            </div>
          </div>

          <div class="supplier-box">
            <div style="font-weight:800;color:${brandColor};margin-bottom:6px;text-transform:uppercase;">Datos del Proveedor</div>
            <div style="display:grid;grid-template-columns:1.3fr 1fr;gap:6px 16px;">
              <div><strong>Razón Social:</strong> ${supplier.name || `Proveedor #${purchase.supplier_id}`}</div>
              <div><strong>R.I.F.:</strong> ${supplier.tax_id || 'N/A'}</div>
              <div><strong>Dirección:</strong> ${supplier.address || 'Venezuela'}</div>
              <div><strong>Teléfono / Contacto:</strong> ${supplier.phone || 'N/A'}</div>
            </div>
          </div>

          <table class="items">
            <thead>
              <tr>
                <th style="width:6%;">#</th>
                <th style="width:18%;text-align:left;">SKU / Código</th>
                <th style="text-align:left;">Descripción del Artículo / Insumo</th>
                <th style="width:12%;">Cantidad</th>
                <th style="width:16%;text-align:right;">Costo Unit.</th>
                <th style="width:16%;text-align:right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div style="display:flex;justify-content:flex-end;">
            <table style="width:280px;border-collapse:collapse;">
              <tr>
                <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;"><strong>Base Imponible:</strong></td>
                <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:right;">$${subtotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;"><strong>I.V.A. (16%):</strong></td>
                <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:right;">$${taxTotal.toFixed(2)}</td>
              </tr>
              <tr style="background:${brandColor};color:#fff;font-weight:900;font-size:14px;">
                <td style="padding:8px;">TOTAL ORDEN:</td>
                <td style="padding:8px;text-align:right;">$${total.toFixed(2)}</td>
              </tr>
            </table>
          </div>

          <div class="signatures">
            <div class="sig-line">Elaborado / Solicitado por (Compras)</div>
            <div class="sig-line">Autorizado / Aprobado por (Gerencia)</div>
          </div>
          <script>window.onload = function() { setTimeout(function() { window.print(); }, 250); };</script>
        </body>
      </html>
    `);
    win.document.close();
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
      supplier_id: Number(supplierId),
      warehouse_id: Number(warehouseId),
      reference: reference || invoiceNumber,
      invoice_number: invoiceNumber,
      control_number: controlNumber,
      iva_withholding: parseFloat(ivaWithholding) || 0,
      islr_withholding: parseFloat(islrWithholding) || 0,
      payment_method: paymentMethod,
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
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              variant="outlined" 
              startIcon={<BusinessIcon />} 
              onClick={() => navigate('/suppliers')}
              sx={{ borderRadius: '12px', px: 3, py: 1.2, fontWeight: 700 }}
            >
              Gestionar Proveedores
            </Button>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />} 
              onClick={() => setOpen(true)}
              sx={{ borderRadius: '12px', px: 4, py: 1.2, fontWeight: 700 }}
            >
              Nueva Compra
            </Button>
          </Box>
        </Box>

        <TableContainer sx={{ border: '1px solid', borderColor: 'grey.100', borderRadius: '16px' }}>
          <Table>
            <TableHead sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'grey.50' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, py: 2.5 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Proveedor</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>N° Factura / Control</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Total</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Ret. IVA</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Fecha</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Comprobante</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {purchases.map((row: any) => (
                <TableRow key={row.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>#{row.id}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{row.supplier?.name || `Prov. #${row.supplier_id}`}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>
                    {row.invoice_number || row.reference || 'S/N'}
                    {row.control_number && <Typography variant="caption" sx={{ display: 'block' }} color="text.secondary">Ctrl: {row.control_number}</Typography>}
                  </TableCell>
                  <TableCell>
                    <Chip label={row.status} size="small" color={row.status === 'COMPLETED' ? 'success' : 'default'} sx={{ fontWeight: 700, borderRadius: '6px' }} />
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>${Number(row.total || 0).toFixed(2)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: Number(row.iva_withholding || 0) > 0 ? 'secondary.main' : 'text.disabled' }}>
                    ${Number(row.iva_withholding || 0).toFixed(2)}
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>{new Date(row.created_at).toLocaleDateString()}</TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 0.8, justifyContent: 'center', flexWrap: 'wrap' }}>
                      <Button
                        size="small"
                        variant="outlined"
                        color="primary"
                        startIcon={<PrintIcon fontSize="small" />}
                        onClick={() => handlePrintPurchaseOrder(row)}
                        sx={{ fontSize: '0.72rem', py: 0.2, borderRadius: 1.5, textTransform: 'none', fontWeight: 700 }}
                      >
                        Orden Compra
                      </Button>
                      {Number(row.iva_withholding || 0) > 0 && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="secondary"
                          onClick={() => handleDownloadVoucher(row.id)}
                          sx={{ fontSize: '0.72rem', py: 0.2, borderRadius: 1.5, textTransform: 'none', fontWeight: 700 }}
                        >
                          PDF Retención
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {purchases.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 10, color: 'text.secondary' }}>No hay compras registradas.</TableCell>
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
          <Grid container spacing={2.5} sx={{ mb: 4, mt: 0.5 }}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Autocomplete
                options={suppliers}
                getOptionLabel={(option: any) => `${option.tax_id || ''} - ${option.name || ''}`}
                value={suppliers.find((s: any) => s.id === Number(supplierId)) || null}
                onChange={(_, newValue) => setSupplierId(newValue ? newValue.id.toString() : '')}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    label="Seleccionar Proveedor" 
                    fullWidth 
                  />
                )}
              />
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
                select
                label="Condición de Pago"
                fullWidth
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <MenuItem value="credit">Crédito Comercial (CxP)</MenuItem>
                <MenuItem value="cash">Contado / Transferencia Inmediata</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                label="N° Factura del Proveedor"
                fullWidth
                placeholder="Ej: FAC-10294"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                label="N° Control Fiscal SENIAT"
                fullWidth
                placeholder="Ej: 00-0010294"
                value={controlNumber}
                onChange={(e) => setControlNumber(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                label="Retención IVA (Bs/USD)"
                fullWidth
                type="number"
                placeholder="0.00"
                value={ivaWithholding}
                onChange={(e) => setIvaWithholding(e.target.value)}
                slotProps={{ htmlInput: { step: '0.01' } }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                label="Retención ISLR (Bs/USD)"
                fullWidth
                type="number"
                placeholder="0.00"
                value={islrWithholding}
                onChange={(e) => setIslrWithholding(e.target.value)}
                slotProps={{ htmlInput: { step: '0.01' } }}
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
                      <Autocomplete
                        options={products}
                        getOptionLabel={(option: any) => `${option.sku || ''} - ${option.name || ''}`}
                        value={products.find((p: any) => p.id === item.product_id) || null}
                        onChange={(_, newValue) => updateItem(index, 'product_id', newValue ? newValue.id : 0)}
                        renderInput={(params) => (
                          <TextField 
                            {...params} 
                            variant="standard" 
                            size="small" 
                            placeholder="Buscar producto..." 
                            fullWidth 
                          />
                        )}
                      />
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
