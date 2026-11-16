import { useState } from 'react';
import { 
  Box, Typography, Paper, Button, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid,
  TextField, MenuItem, Autocomplete, IconButton
} from '@mui/material';
import { Add, RequestQuote, FileDownload, Delete as DeleteIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axiosConfig';
import { useAppStore } from '../../store/useAppStore';
import { type PriceTier, getProductPriceByTier } from '../../utils/venezuelaFiscalPrint';

export default function BudgetsPage() {
  const queryClient = useQueryClient();
  const tenant = useAppStore((state: any) => state.tenant);
  const [openNewDialog, setOpenNewDialog] = useState(false);
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [defaultPriceTier, setDefaultPriceTier] = useState<PriceTier>(1);
  const [items, setItems] = useState<Array<{
    product_id: number;
    sku: string;
    name: string;
    quantity: number;
    price_1: number;
    price_2: number;
    price_3: number;
    price_tier: PriceTier;
    unit_price: number;
  }>>([]);

  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ['budgets'],
    queryFn: async () => {
      const res = await api.get('/sales/budgets');
      return res.data;
    }
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => (await api.get('/sales/customers')).data,
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => (await api.get('/inventory/products')).data,
  });

  const createBudgetMutation = useMutation({
    mutationFn: (payload: any) => api.post('/sales/budgets', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      setOpenNewDialog(false);
      setCustomerId(null);
      setItems([]);
    }
  });

  const handleAddItem = (prod: any) => {
    if (!prod) return;
    const price = getProductPriceByTier(prod, defaultPriceTier);
    setItems(prev => [
      ...prev,
      {
        product_id: prod.id,
        sku: prod.sku || '',
        name: prod.name,
        quantity: 1,
        price_1: Number(prod.price || 0),
        price_2: Number(prod.price_2 || 0),
        price_3: Number(prod.price_3 || 0),
        price_tier: defaultPriceTier,
        unit_price: price
      }
    ]);
  };

  const handlePrintBudget = (b: any) => {
    const win = window.open('', '_blank');
    if (!win) return;

    const brandColor = tenant?.primary_color || '#1e3a8a';
    const logoHtml = tenant?.logo_url
      ? `<img src="${tenant.logo_url}" alt="Logo Empresa" style="max-height:75px;max-width:190px;object-fit:contain;margin-bottom:6px;" />`
      : `<div style="font-size:24px;font-weight:900;color:${brandColor};">${(tenant?.name || 'EMPRESA S.A.').toUpperCase()}</div>`;

    const cust = customers.find((c: any) => c.id === b.customer_id) || {};
    const rowsHtml = (b.items || []).map((item: any, idx: number) => {
      const prod = products.find((p: any) => p.id === item.product_id) || {};
      const qty = Number(item.quantity || 1);
      const price = Number(item.unit_price || 0);
      const sub = qty * price;
      return `
        <tr>
          <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;text-align:center;">${idx + 1}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;font-family:monospace;">${prod.sku || `ID-${item.product_id}`}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;font-weight:600;">${prod.name || `Producto #${item.product_id}`}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;text-align:center;">${qty}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;text-align:right;">$${price.toFixed(2)}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700;">$${sub.toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    const total = Number(b.total || 0);
    const subtotal = total / 1.16;
    const tax = total - subtotal;

    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Presupuesto #${String(b.id).padStart(5, '0')}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #0f172a; margin: 32px 40px; font-size: 12px; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid ${brandColor}; padding-bottom: 16px; margin-bottom: 20px; }
            .box { border: 2px solid ${brandColor}; border-radius: 10px; padding: 12px 18px; background: #f8fafc; min-width: 230px; }
            .client-box { border: 1px solid #cbd5e1; border-radius: 10px; padding: 14px 18px; background: #f8fafc; margin-bottom: 20px; }
            table.items { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
            table.items th { background: ${brandColor}; color: #fff; padding: 10px 8px; font-size: 11px; text-transform: uppercase; }
            @media print { body { margin: 16px 22px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              ${logoHtml}
              <div style="font-size:15px;font-weight:900;color:${brandColor};">${(tenant?.name || 'EMPRESA S.A.').toUpperCase()}</div>
              <div><strong>R.I.F.:</strong> ${tenant?.tax_id || 'J-00000000-0'}</div>
              <div><strong>Domicilio Fiscal:</strong> ${tenant?.address || 'Venezuela'}</div>
              ${tenant?.phone ? `<div><strong>Teléfono:</strong> ${tenant.phone}</div>` : ''}
            </div>
            <div class="box">
              <div style="font-size:15px;font-weight:900;color:${brandColor};text-align:center;margin-bottom:8px;">PRESUPUESTO / COTIZACIÓN</div>
              <div><strong>N° Cotización:</strong> <span style="color:#dc2626;font-weight:900;">COT-${String(b.id).padStart(5, '0')}</span></div>
              <div><strong>Fecha:</strong> ${new Date(b.created_at).toLocaleDateString('es-VE')}</div>
              <div><strong>Asesor:</strong> ${b.created_by_name || 'Ventas'}</div>
              <div><strong>Estado:</strong> ${b.status}</div>
            </div>
          </div>

          <div class="client-box">
            <div style="font-weight:800;color:${brandColor};margin-bottom:6px;text-transform:uppercase;">Datos del Cliente</div>
            <div><strong>Cliente / Razón Social:</strong> ${cust.name || 'Cliente General'}</div>
            <div><strong>R.I.F. / C.I.:</strong> ${cust.tax_id || 'N/A'} | <strong>Teléfono:</strong> ${cust.phone || 'N/A'}</div>
            <div><strong>Dirección:</strong> ${cust.address || 'Venezuela'}</div>
          </div>

          <table class="items">
            <thead>
              <tr>
                <th style="width:6%;">#</th>
                <th style="width:18%;text-align:left;">SKU</th>
                <th style="text-align:left;">Descripción</th>
                <th style="width:12%;">Cant.</th>
                <th style="width:16%;text-align:right;">Precio Unit.</th>
                <th style="width:16%;text-align:right;">Total</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>

          <div style="display:flex;justify-content:flex-end;">
            <table style="width:280px;border-collapse:collapse;">
              <tr>
                <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;"><strong>Base Imponible:</strong></td>
                <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:right;">$${subtotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;"><strong>I.V.A. (16%):</strong></td>
                <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:right;">$${tax.toFixed(2)}</td>
              </tr>
              <tr style="background:${brandColor};color:#fff;font-weight:900;font-size:14px;">
                <td style="padding:8px;">TOTAL COTIZADO:</td>
                <td style="padding:8px;text-align:right;">$${total.toFixed(2)}</td>
              </tr>
            </table>
          </div>
          <script>window.onload = function() { setTimeout(function() { window.print(); }, 250); };</script>
        </body>
      </html>
    `);
    win.document.close();
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
      px: 3
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
              <RequestQuote color="primary" sx={{ fontSize: 32 }} />
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-1px' }}>Presupuestos</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, opacity: 0.8 }}>
                Gestión de cotizaciones con 3 niveles de precios y logo corporativo
              </Typography>
            </Box>
          </Box>
          <Button 
            variant="contained" 
            startIcon={<Add />}
            onClick={() => setOpenNewDialog(true)}
            sx={{ 
              borderRadius: '12px', 
              px: 3.5, 
              py: 1.2, 
              fontWeight: 700,
              boxShadow: '0 8px 16px rgba(37, 99, 235, 0.2)',
              '&:hover': { boxShadow: '0 12px 20px rgba(37, 99, 235, 0.3)' }
            }}
          >
            Nuevo Presupuesto
          </Button>
        </Box>

        <TableContainer sx={{ border: '1px solid', borderColor: 'grey.100', borderRadius: '16px' }}>
          <Table>
            <TableHead sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'grey.50' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, py: 2.5 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Fecha</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Vendedor</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {budgets.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                    <Typography color="text.secondary" sx={{ fontWeight: 500 }}>No hay presupuestos registrados aún.</Typography>
                  </TableCell>
                </TableRow>
              )}
              {budgets.map((b: any) => (
                <TableRow key={b.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell sx={{ fontWeight: 600 }}>#{b.id.toString().padStart(5, '0')}</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 500 }}>{new Date(b.created_at).toLocaleDateString()}</TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{b.created_by_name || 'N/A'}</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: 'primary.main' }}>${Number(b.total || 0).toFixed(2)}</TableCell>
                  <TableCell>
                    <Chip 
                      label={b.status} 
                      size="small"
                      color={b.status === 'PENDING' ? 'warning' : 'success'}
                      sx={{ fontWeight: 700, borderRadius: '6px', fontSize: '0.75rem' }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Button 
                      size="small" 
                      variant="outlined" 
                      startIcon={<FileDownload />}
                      onClick={() => handlePrintBudget(b)}
                      sx={{ fontWeight: 700, borderRadius: '8px', textTransform: 'none' }}
                    >
                      Imprimir PDF
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={openNewDialog} onClose={() => setOpenNewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Crear Nuevo Presupuesto</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Autocomplete
                options={customers}
                getOptionLabel={(c: any) => `${c.name} (${c.tax_id})`}
                value={customers.find((c: any) => c.id === customerId) || null}
                onChange={(_, val: any) => setCustomerId(val ? val.id : null)}
                renderInput={(params) => <TextField {...params} label="Cliente" size="small" />}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Tarifa / Precio por Defecto"
                value={defaultPriceTier}
                onChange={(e) => {
                  const tier = Number(e.target.value) as PriceTier;
                  setDefaultPriceTier(tier);
                  setItems(prev => prev.map(i => ({
                    ...i,
                    price_tier: tier,
                    unit_price: getProductPriceByTier({ price: i.price_1, price_2: i.price_2, price_3: i.price_3 }, tier)
                  })));
                }}
              >
                <MenuItem value={1}>🏷️ Precio 1 (Por Defecto / Detal)</MenuItem>
                <MenuItem value={2}>📦 Precio 2 (Mayor / Especial)</MenuItem>
                <MenuItem value={3}>💎 Precio 3 (Distribuidor / VIP)</MenuItem>
              </TextField>
            </Grid>
            <Grid size={12}>
              <Autocomplete
                options={products}
                getOptionLabel={(p: any) => `${p.sku} - ${p.name} (P1:$${Number(p.price || 0).toFixed(2)})`}
                onChange={(_, val) => handleAddItem(val)}
                renderInput={(params) => <TextField {...params} label="Añadir Producto al Presupuesto..." size="small" />}
              />
            </Grid>
          </Grid>

          <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Producto</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Cant.</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Tarifa</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Precio Unit. ($)</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Subtotal</TableCell>
                  <TableCell align="center"></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell align="center">
                      <TextField
                        type="number"
                        size="small"
                        value={item.quantity}
                        onChange={(e) => {
                          const next = [...items];
                          next[idx].quantity = Number(e.target.value) || 1;
                          setItems(next);
                        }}
                        sx={{ width: 65 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <TextField
                        select
                        size="small"
                        value={item.price_tier}
                        onChange={(e) => {
                          const tier = Number(e.target.value) as PriceTier;
                          const next = [...items];
                          next[idx].price_tier = tier;
                          next[idx].unit_price = getProductPriceByTier(
                            { price: item.price_1, price_2: item.price_2, price_3: item.price_3 },
                            tier
                          );
                          setItems(next);
                        }}
                      >
                        <MenuItem value={1}>P1</MenuItem>
                        <MenuItem value={2}>P2</MenuItem>
                        <MenuItem value={3}>P3</MenuItem>
                      </TextField>
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        type="number"
                        size="small"
                        value={item.unit_price}
                        onChange={(e) => {
                          const next = [...items];
                          next[idx].unit_price = Number(e.target.value) || 0;
                          setItems(next);
                        }}
                        sx={{ width: 90 }}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      ${(item.quantity * item.unit_price).toFixed(2)}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" color="error" onClick={() => setItems(items.filter((_, i) => i !== idx))}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenNewDialog(false)}>Cancelar</Button>
          <Button
            variant="contained"
            disabled={!customerId || items.length === 0 || createBudgetMutation.isPending}
            onClick={() => createBudgetMutation.mutate({
              customer_id: customerId,
              items: items.map(i => ({
                product_id: i.product_id,
                quantity: i.quantity,
                unit_price: i.unit_price
              }))
            })}
          >
            Guardar Presupuesto
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
