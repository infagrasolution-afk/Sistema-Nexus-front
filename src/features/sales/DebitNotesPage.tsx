import { useState } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Button, Chip, Dialog, DialogTitle, DialogContent, 
  DialogActions, Grid, TextField, MenuItem, CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Print as PrintIcon,
  CheckCircleOutlined as SuccessIcon,
  ErrorOutlined as ErrorIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axiosConfig';
import { useAppStore } from '../../store/useAppStore';

export default function DebitNotesPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [centerModal, setCenterModal] = useState<{ open: boolean; title: string; message: string; type: 'success' | 'error' }>({
    open: false,
    title: '',
    message: '',
    type: 'success',
  });
  const [formData, setFormData] = useState({
    type: 'Débito',
    customer_id: '',
    amount: '',
    reason: ''
  });

  // Queries
  const { data: notes = [], isLoading: isLoadingNotes } = useQuery({
    queryKey: ['commercial-notes'],
    queryFn: async () => {
      const res = await api.get('/sales/commercial-notes');
      return res.data;
    }
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const res = await api.get('/sales/customers');
      return res.data;
    }
  });

  // Mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/sales/commercial-notes', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commercial-notes'] });
      setCreateOpen(false);
      setFormData({ type: 'Débito', customer_id: '', amount: '', reason: '' });
      setCenterModal({
        open: true,
        title: 'Nota Emitida',
        message: 'La nota comercial fue registrada exitosamente.',
        type: 'success',
      });
    },
    onError: (error: any) => {
      const detail = error.response?.data?.detail || 'Error al crear la nota';
      setCenterModal({
        open: true,
        title: 'Error al Crear Nota',
        message: typeof detail === 'string' ? detail : JSON.stringify(detail),
        type: 'error',
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer_id || !formData.amount || !formData.reason) {
      setCenterModal({
        open: true,
        title: 'Campos Incompletos',
        message: 'Por favor, complete todos los campos obligatorios.',
        type: 'error',
      });
      return;
    }
    createMutation.mutate({
      ...formData,
      amount: parseFloat(formData.amount)
    });
  };

  const handlePrintNote = (note: any) => {
    const tenant = useAppStore.getState().tenant;
    const brandColor = tenant?.primary_color || '#1e3a8a';
    const win = window.open('', '_blank');
    if (!win) return;

    const cust = customers.find((c: any) => c.id === note.customer_id) || {};
    const logoHtml = tenant?.logo_url
      ? `<img src="${tenant.logo_url}" alt="Logo Empresa" style="max-height:75px;max-width:190px;object-fit:contain;margin-bottom:6px;" />`
      : `<div style="font-size:24px;font-weight:900;color:${brandColor};">${(tenant?.name || 'EMPRESA S.A.').toUpperCase()}</div>`;

    const amount = Number(note.amount || 0);
    const base = amount / 1.16;
    const tax = amount - base;

    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Nota de ${note.type || 'Débito'} ${note.number || `N-${note.id}`}</title>
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
              <div style="font-size:14px;font-weight:900;color:${brandColor};text-align:center;margin-bottom:8px;">NOTA DE ${(note.type || 'DÉBITO').toUpperCase()} FISCAL</div>
              <div><strong>N° Documento:</strong> <span style="color:#dc2626;font-weight:900;">${note.number || `ND-${String(note.id).padStart(6, '0')}`}</span></div>
              <div><strong>N° Control SENIAT:</strong> 00-${String(note.id).padStart(8, '0')}</div>
              <div><strong>Fecha Emisión:</strong> ${new Date(note.created_at).toLocaleDateString('es-VE')}</div>
            </div>
          </div>
          <div class="client-box">
            <div style="font-weight:800;color:${brandColor};margin-bottom:6px;text-transform:uppercase;">Datos del Cliente</div>
            <div><strong>Razón Social:</strong> ${cust.name || 'Cliente Fiscal'}</div>
            <div><strong>R.I.F. / C.I.:</strong> ${cust.tax_id || 'N/A'} | <strong>Teléfono:</strong> ${cust.phone || 'N/A'}</div>
            <div><strong>Dirección Fiscal:</strong> ${cust.address || 'Venezuela'}</div>
          </div>
          <div class="client-box">
            <div style="font-weight:800;color:#0f172a;margin-bottom:6px;">CONCEPTO / MOTIVO LEGAL:</div>
            <div>${note.reason}</div>
          </div>
          <div style="display:flex;justify-content:flex-end;margin-top:20px;">
            <table style="width:280px;border-collapse:collapse;">
              <tr>
                <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;"><strong>Base Imponible:</strong></td>
                <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:right;">$${base.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;"><strong>I.V.A. (16%):</strong></td>
                <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:right;">$${tax.toFixed(2)}</td>
              </tr>
              <tr style="background:${brandColor};color:#fff;font-weight:900;font-size:14px;">
                <td style="padding:8px;">MONTO TOTAL:</td>
                <td style="padding:8px;text-align:right;">$${amount.toFixed(2)}</td>
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
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main' }}>
          Notas de Crédito y Débito
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          sx={{ borderRadius: 2 }}
          onClick={() => setCreateOpen(true)}
        >
          Nueva Nota
        </Button>
      </Box>

      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'background.default' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Número</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Tipo</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Fecha</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Cliente/Proveedor</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Monto</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoadingNotes ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : notes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No hay notas registradas.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                notes.map((note: any) => (
                  <TableRow key={note.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{note.number || `N-${note.id}`}</TableCell>
                    <TableCell>
                      <Chip label={note.type || 'Débito'} size="small" color={note.type === 'Crédito' ? 'success' : 'error'} />
                    </TableCell>
                    <TableCell>{new Date(note.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {customers.find((c: any) => c.id === note.customer_id)?.name || 'Cliente Desconocido'}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>${Number(note.amount).toFixed(2)}</TableCell>
                    <TableCell>
                      <Chip label={note.status} size="small" color={note.status === 'PAID' ? 'success' : 'warning'} />
                    </TableCell>
                    <TableCell align="right">
                      <Button size="small" variant="outlined" startIcon={<PrintIcon />} onClick={() => handlePrintNote(note)}>
                        Ver PDF
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* DIALOG: Create Note */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Crear Nota de Ajuste</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent dividers>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  label="Tipo de Nota"
                  fullWidth
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <MenuItem value="Débito">Nota de Débito (+ Deuda)</MenuItem>
                  <MenuItem value="Crédito">Nota de Crédito (- Deuda)</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Monto ($)"
                  type="number"
                  fullWidth
                  required
                  slotProps={{ htmlInput: { step: "0.01", min: "0" } }}
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  select
                  label="Cliente"
                  fullWidth
                  required
                  value={formData.customer_id}
                  onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                >
                  {customers.map((c: any) => (
                    <MenuItem key={c.id} value={c.id}>{c.name} ({c.tax_id})</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Concepto / Motivo"
                  fullWidth
                  required
                  multiline
                  rows={2}
                  placeholder="Ej. Devolución de mercancía averiada"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setCreateOpen(false)} color="inherit" sx={{ fontWeight: 600 }}>Cancelar</Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={createMutation.isPending}
              sx={{ fontWeight: 600 }}
            >
              {createMutation.isPending ? 'Guardando...' : 'Crear Nota'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

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
