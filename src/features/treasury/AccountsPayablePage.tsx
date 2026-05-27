import { useState } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Chip, Button, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, MenuItem
} from '@mui/material';
import { Payments as PaymentIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axiosConfig';

export default function AccountsPayablePage() {
  const [openPayment, setOpenPayment] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<any>(null);
  const [paymentData, setPaymentData] = useState({ amount: 0, method: 'cash', reference: '' });
  
  const queryClient = useQueryClient();

  const { data: debts = [] } = useQuery({
    queryKey: ['ap'],
    queryFn: async () => (await api.get('/treasury/ap')).data
  });

  const paymentMutation = useMutation({
    mutationFn: (data: any) => api.post('/treasury/payments', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ap'] });
      setOpenPayment(false);
    }
  });

  const handleOpenPayment = (debt: any) => {
    setSelectedDebt(debt);
    setPaymentData({ ...paymentData, amount: debt.remaining_amount });
    setOpenPayment(true);
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 900, mb: 4 }}>Cuentas por Pagar (Proveedores)</Typography>
      
      <TableContainer component={Paper} sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <Table>
          <TableHead sx={{ bgcolor: 'action.hover' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Proveedor</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Compra #</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Saldo Pendiente</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Vencimiento</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {debts.map((debt: any) => (
              <TableRow key={debt.id} hover>
                <TableCell>
                  <Typography sx={{ fontWeight: 600 }}>{debt.supplier?.name}</Typography>
                </TableCell>
                <TableCell>#{debt.purchase_id}</TableCell>
                <TableCell>${debt.total_amount.toFixed(2)}</TableCell>
                <TableCell sx={{ color: 'error.main', fontWeight: 700 }}>
                  ${debt.remaining_amount.toFixed(2)}
                </TableCell>
                <TableCell>{new Date(debt.due_date).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Chip label={debt.status} color={debt.status === 'PAID' ? 'success' : 'error'} size="small" />
                </TableCell>
                <TableCell align="right">
                  <Button 
                    variant="contained" 
                    size="small" 
                    color="warning"
                    startIcon={<PaymentIcon />}
                    onClick={() => handleOpenPayment(debt)}
                    disabled={debt.status === 'PAID'}
                    sx={{ borderRadius: 2 }}
                  >
                    Pagar Factura
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openPayment} onClose={() => setOpenPayment(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Pagar a Proveedor</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography variant="body2">
              Proveedor: <strong>{selectedDebt?.supplier?.name}</strong> <br/>
              Deuda pendiente: <strong>${selectedDebt?.remaining_amount.toFixed(2)}</strong>
            </Typography>
            <TextField
              label="Monto"
              type="number"
              fullWidth
              value={paymentData.amount}
              onChange={(e) => setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) })}
            />
            <TextField
              select
              label="Metodo"
              fullWidth
              value={paymentData.method}
              onChange={(e) => setPaymentData({ ...paymentData, method: e.target.value })}
            >
              <MenuItem value="cash">Efectivo</MenuItem>
              <MenuItem value="transfer">Transferencia</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenPayment(false)}>Cancelar</Button>
          <Button 
            variant="contained" 
            color="warning"
            onClick={() => paymentMutation.mutate({ ...paymentData, ap_id: selectedDebt.id })}
          >
            Confirmar Egreso
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
