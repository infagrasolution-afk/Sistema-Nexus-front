import React, { useState } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, Grid, TextField, MenuItem, CircularProgress, Alert,
  FormControlLabel, Checkbox, IconButton, Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Receipt as ReceiptIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  Print as PrintIcon,
  CheckCircleOutlined as SuccessIcon,
  ErrorOutlined as ErrorIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axiosConfig';
import { useAppStore } from '../../store/useAppStore';

interface CreditNoteItem {
  id?: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
}

interface CreditNote {
  id: number;
  number: string;
  control_number?: string;
  sale_id: number;
  customer_id: number;
  reason: string;
  currency: string;
  exchange_rate: number;
  subtotal: number;
  tax_total: number;
  total: number;
  status: string;
  notes?: string;
  created_at: string;
  items?: CreditNoteItem[];
}

export default function CreditNotesPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<CreditNote | null>(null);
  const [centerModal, setCenterModal] = useState<{ open: boolean; title: string; message: string; type: 'success' | 'error' }>({
    open: false,
    title: '',
    message: '',
    type: 'success',
  });

  const [formData, setFormData] = useState({
    sale_id: '',
    customer_id: '',
    reason: '',
    control_number: '',
    currency: 'USD',
    exchange_rate: 1.0,
    subtotal: 0,
    tax_total: 0,
    total: 0,
    notes: '',
    restock_inventory: true,
    items: [] as any[]
  });

  // Query notas de crédito
  const { data: creditNotes = [], isLoading, refetch } = useQuery<CreditNote[]>({
    queryKey: ['credit-notes'],
    queryFn: async () => {
      const res = await api.get('/sales/credit-notes');
      return res.data;
    }
  });

  // Query clientes
  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const res = await api.get('/sales/customers');
      return res.data;
    }
  });

  // Query ventas completadas para asociar la nota de crédito
  const { data: sales = [] } = useQuery({
    queryKey: ['sales-for-cn'],
    queryFn: async () => {
      const res = await api.get('/sales/list?status=COMPLETED&limit=50');
      return res.data;
    }
  });

  // Mutación para crear Nota de Crédito
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/sales/credit-notes', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-notes'] });
      queryClient.invalidateQueries({ queryKey: ['ar'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setCreateOpen(false);
      resetForm();
      setCenterModal({
        open: true,
        title: 'Nota de Crédito Emitida',
        message: 'La Nota de Crédito fiscal se emitió exitosamente y el inventario fue actualizado.',
        type: 'success',
      });
    },
    onError: (error: any) => {
      const detail = error.response?.data?.detail || error.response?.data?.message || 'No se pudo emitir la Nota de Crédito.';
      setCenterModal({
        open: true,
        title: 'Error al Emitir Nota de Crédito',
        message: typeof detail === 'string' ? detail : JSON.stringify(detail),
        type: 'error',
      });
    }
  });

  const resetForm = () => {
    setFormData({
      sale_id: '',
      customer_id: '',
      reason: '',
      control_number: '',
      currency: 'USD',
      exchange_rate: 1.0,
      subtotal: 0,
      tax_total: 0,
      total: 0,
      notes: '',
      restock_inventory: true,
      items: []
    });
  };

  const handleSelectSale = (saleIdStr: string) => {
    const saleId = parseInt(saleIdStr);
    const sale = sales.find((s: any) => s.id === saleId);
    if (sale) {
      const sub = Number(sale.subtotal || 0);
      const tax = Number(sale.tax_total || 0);
      const tot = Number(sale.total || 0);

      const items = (sale.details || []).map((d: any) => ({
        product_id: d.product_id,
        quantity: Number(d.quantity),
        unit_price: Number(d.unit_price),
        subtotal: Number(d.subtotal),
        tax_rate: 16.0,
        tax_amount: Number(d.subtotal) * 0.16,
        total: Number(d.subtotal) * 1.16
      }));

      setFormData({
        ...formData,
        sale_id: saleIdStr,
        customer_id: sale.customer_id,
        currency: sale.currency || 'USD',
        exchange_rate: Number(sale.exchange_rate || 1.0),
        subtotal: sub,
        tax_total: tax,
        total: tot,
        items
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sale_id || !formData.customer_id || !formData.reason || formData.total <= 0) {
      setCenterModal({
        open: true,
        title: 'Campos Incompletos',
        message: 'Por favor complete todos los datos obligatorios y seleccione la factura de referencia.',
        type: 'error',
      });
      return;
    }

    createMutation.mutate({
      ...formData,
      sale_id: parseInt(formData.sale_id),
      customer_id: parseInt(formData.customer_id as string),
      subtotal: formData.subtotal,
      tax_total: formData.tax_total,
      total: formData.total
    });
  };

  const handlePrintCreditNote = (cn: CreditNote) => {
    const tenant = useAppStore.getState().tenant;
    const brandColor = tenant?.primary_color || '#1e3a8a';
    const win = window.open('', '_blank');
    if (!win) return;

    const cust = customers.find((c: any) => c.id === cn.customer_id) || {};
    const logoHtml = tenant?.logo_url
      ? `<img src="${tenant.logo_url}" alt="Logo Empresa" style="max-height:75px;max-width:190px;object-fit:contain;margin-bottom:6px;" />`
      : `<div style="font-size:24px;font-weight:900;color:${brandColor};">${(tenant?.name || 'EMPRESA S.A.').toUpperCase()}</div>`;

    const sym = cn.currency === 'USD' ? '$' : 'Bs. ';
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Nota de Crédito Fiscal ${cn.number}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #0f172a; margin: 32px 40px; font-size: 12px; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid ${brandColor}; padding-bottom: 16px; margin-bottom: 20px; }
            .box { border: 2px solid ${brandColor}; border-radius: 10px; padding: 12px 18px; background: #f8fafc; min-width: 240px; }
            .client-box { border: 1px solid #cbd5e1; border-radius: 10px; padding: 14px 18px; background: #f8fafc; margin-bottom: 20px; }
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
              <div style="font-size:14px;font-weight:900;color:${brandColor};text-align:center;margin-bottom:8px;">NOTA DE CRÉDITO FISCAL</div>
              <div><strong>N° Nota Crédito:</strong> <span style="color:#dc2626;font-weight:900;">${cn.number}</span></div>
              <div><strong>N° Control SENIAT:</strong> ${cn.control_number || `00-${String(cn.id).padStart(8, '0')}`}</div>
              <div><strong>Factura Afectada:</strong> #${String(cn.sale_id).padStart(8, '0')}</div>
              <div><strong>Fecha Emisión:</strong> ${new Date(cn.created_at).toLocaleString('es-VE')}</div>
            </div>
          </div>
          <div class="client-box">
            <div style="font-weight:800;color:${brandColor};margin-bottom:6px;text-transform:uppercase;">Datos del Cliente / Adquiriente</div>
            <div><strong>Razón Social:</strong> ${cust.name || 'Cliente Fiscal'}</div>
            <div><strong>R.I.F. / C.I.:</strong> ${cust.tax_id || 'N/A'} | <strong>Teléfono:</strong> ${cust.phone || 'N/A'}</div>
            <div><strong>Dirección Fiscal:</strong> ${cust.address || 'Venezuela'}</div>
          </div>
          <div class="client-box">
            <div style="font-weight:800;color:#0f172a;margin-bottom:6px;">MOTIVO / CONCEPTO LEGAL (SENIAT):</div>
            <div>${cn.reason}</div>
          </div>
          <div style="display:flex;justify-content:flex-end;margin-top:20px;">
            <table style="width:300px;border-collapse:collapse;">
              <tr>
                <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;"><strong>Base Imponible:</strong></td>
                <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:right;">${sym}${Number(cn.subtotal || 0).toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;"><strong>I.V.A. (16%):</strong></td>
                <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:right;">${sym}${Number(cn.tax_total || 0).toFixed(2)}</td>
              </tr>
              <tr style="background:${brandColor};color:#fff;font-weight:900;font-size:14px;">
                <td style="padding:8px;">TOTAL ACREDITADO:</td>
                <td style="padding:8px;text-align:right;">${sym}${Number(cn.total || 0).toFixed(2)}</td>
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
    <Box sx={{ p: 3, maxWidth: 1400, margin: '0 auto' }}>
      {/* Encabezado */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ReceiptIcon color="primary" sx={{ fontSize: 36 }} />
          <div>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Notas de Crédito Fiscales (SENIAT)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Emisión oficial de Notas de Crédito, restitución de inventario y ajuste de Cuentas por Cobrar
            </Typography>
          </div>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => refetch()}>
            Actualizar
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => { resetForm(); setCreateOpen(true); }}
            sx={{ borderRadius: 2 }}
          >
            Emitir Nota de Crédito
          </Button>
        </Box>
      </Box>

      {/* Tabla de Notas de Crédito */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
        {isLoading ? (
          <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        ) : creditNotes.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Alert severity="info" sx={{ maxWidth: 500, margin: '0 auto' }}>
              No se han emitido Notas de Crédito. Emite una haciendo clic en el botón superior.
            </Alert>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Número NC</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>N° Control Fiscal</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Factura Origen</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Motivo / Concepto</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Fecha</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Monto Total</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Estado</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Detalle</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {creditNotes.map((cn) => (
                  <TableRow key={cn.id} hover>
                    <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {cn.number}
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>
                      {cn.control_number || '—'}
                    </TableCell>
                    <TableCell>
                      Factura #{String(cn.sale_id).padStart(6, '0')}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 250, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {cn.reason}
                    </TableCell>
                    <TableCell>
                      {new Date(cn.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
                      {cn.currency === 'USD' ? '$' : 'Bs. '}{' '}
                      {Number(cn.total).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={cn.status || 'APROBADA'}
                        color="success"
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Ver Detalle">
                        <IconButton
                          size="small"
                          onClick={() => { setSelectedNote(cn); setDetailOpen(true); }}
                        >
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Imprimir PDF con Logo">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handlePrintCreditNote(cn)}
                        >
                          <PrintIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Modal Emisión de Nota de Crédito */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: 700 }}>
            Emitir Nota de Crédito Fiscal
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Factura de Venta Original"
                  value={formData.sale_id}
                  onChange={(e) => handleSelectSale(e.target.value)}
                  required
                >
                  <MenuItem value="">-- Seleccionar Factura --</MenuItem>
                  {sales.map((s: any) => (
                    <MenuItem key={s.id} value={s.id}>
                      Factura #{String(s.id).padStart(6, '0')} — Total: {s.currency === 'USD' ? '$' : 'Bs.'} {Number(s.total).toFixed(2)}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Cliente"
                  value={formData.customer_id}
                  onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                  required
                >
                  {customers.map((c: any) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name} ({c.tax_id})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Número de Control Fiscal SENIAT"
                  placeholder="00-00000001"
                  value={formData.control_number}
                  onChange={(e) => setFormData({ ...formData, control_number: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Monto Total a Acreditar"
                  value={formData.total}
                  onChange={(e) => setFormData({ ...formData, total: parseFloat(e.target.value) || 0 })}
                  slotProps={{ htmlInput: { step: '0.01' } }}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Motivo / Justificación Legal (SENIAT)"
                  placeholder="Ej: Devolución de mercancía por defecto / Anulación parcial de factura"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.restock_inventory}
                      onChange={(e) => setFormData({ ...formData, restock_inventory: e.target.checked })}
                      color="primary"
                    />
                  }
                  label="Reingresar productos devueltos automáticamente al inventario (Almacén de origen)"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={createMutation.isPending}>
              Emitir Nota de Crédito
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Modal Detalle de Nota de Crédito */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Detalle de Nota de Crédito {selectedNote?.number}
        </DialogTitle>
        <DialogContent dividers>
          {selectedNote && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Typography variant="body2"><strong>Número Correlativo:</strong> {selectedNote.number}</Typography>
              <Typography variant="body2"><strong>N° Control Fiscal:</strong> {selectedNote.control_number || 'N/A'}</Typography>
              <Typography variant="body2"><strong>Factura Afectada:</strong> #{String(selectedNote.sale_id).padStart(6, '0')}</Typography>
              <Typography variant="body2"><strong>Fecha de Emisión:</strong> {new Date(selectedNote.created_at).toLocaleString()}</Typography>
              <Typography variant="body2"><strong>Motivo:</strong> {selectedNote.reason}</Typography>
              <Typography variant="body2"><strong>Moneda:</strong> {selectedNote.currency}</Typography>
              <Typography variant="body2"><strong>Tasa de Cambio:</strong> {Number(selectedNote.exchange_rate).toFixed(4)}</Typography>
              <Typography variant="h6" color="primary.main" sx={{ mt: 1 }}>
                Total Acreditado: {selectedNote.currency === 'USD' ? '$' : 'Bs. '} {Number(selectedNote.total).toFixed(2)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Modal Moderno Centrado para Mensajes (Éxito / Error) */}
      <Dialog
        open={centerModal.open}
        onClose={() => setCenterModal((p) => ({ ...p, open: false }))}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: '18px', p: 1 } } }}
      >
        <DialogContent sx={{ textAlign: 'center', pt: 3, pb: 2 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              mx: 'auto',
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: centerModal.type === 'success' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
              color: centerModal.type === 'success' ? '#10b981' : '#ef4444',
            }}
          >
            {centerModal.type === 'success' ? <SuccessIcon sx={{ fontSize: 32 }} /> : <ErrorIcon sx={{ fontSize: 32 }} />}
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
            {centerModal.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            {centerModal.message}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2.5 }}>
          <Button
            variant="contained"
            color={centerModal.type === 'success' ? 'success' : 'primary'}
            onClick={() => setCenterModal((p) => ({ ...p, open: false }))}
            sx={{ borderRadius: '10px', px: 4, fontWeight: 700, textTransform: 'none' }}
          >
            Aceptar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
