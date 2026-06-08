import { useState } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Button, Chip, Dialog, DialogTitle, DialogContent, 
  DialogActions, Grid, TextField, MenuItem, CircularProgress
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axiosConfig';

export default function DebitNotesPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
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
      alert('Nota creada exitosamente');
      setCreateOpen(false);
      setFormData({ type: 'Débito', customer_id: '', amount: '', reason: '' });
    },
    onError: (error: any) => {
      const detail = error.response?.data?.detail || 'Error al crear la nota';
      alert(typeof detail === 'string' ? detail : JSON.stringify(detail));
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer_id || !formData.amount || !formData.reason) {
      alert('Por favor, complete todos los campos obligatorios');
      return;
    }
    createMutation.mutate({
      ...formData,
      amount: parseFloat(formData.amount)
    });
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
                      <Button size="small">Ver PDF</Button>
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
    </Box>
  );
}
