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
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axiosConfig';

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
      queryClient.invalidateQueries({ queryKey: ['ar-list'] });
      alert('Nota de Crédito fiscal emitida exitosamente');
      setCreateOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      const detail = error.response?.data?.detail || 'Error al emitir Nota de Crédito';
      alert(typeof detail === 'string' ? detail : JSON.stringify(detail));
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
      alert('Por favor complete todos los datos obligatorios y la factura de referencia.');
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
    </Box>
  );
}
