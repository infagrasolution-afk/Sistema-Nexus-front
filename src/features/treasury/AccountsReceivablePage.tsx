import { useState } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Chip, Button, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, MenuItem
} from '@mui/material';
import { 
  Payments as PaymentIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axiosConfig';

export default function AccountsReceivablePage() {
  const [openPayment, setOpenPayment] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<any>(null);
  const [paymentData, setPaymentData] = useState({ amount: 0, method: 'cash', reference: '' });
  
  const queryClient = useQueryClient();

  const { data: debts = [] } = useQuery({
    queryKey: ['ar'],
    queryFn: async () => (await api.get('/treasury/ar')).data
  });

  const paymentMutation = useMutation({
    mutationFn: (data: any) => api.post('/treasury/payments', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ar'] });
      setOpenPayment(false);
      setPaymentData({ amount: 0, method: 'cash', reference: '' });
    }
  });

  const handleOpenPayment = (debt: any) => {
    setSelectedDebt(debt);
    setPaymentData({ ...paymentData, amount: debt.remaining_amount });
    setOpenPayment(true);
  };

  const getStatusChip = (status: string) => {
    const colors: any = { OPEN: 'error', PARTIAL: 'warning', PAID: 'success' };
    return <Chip label={status} color={colors[status]} size="small" sx={{ fontWeight: 700 }} />;
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 900, mb: 4 }}>Cuentas por Cobrar (Clientes)</Typography>
      
      <TableContainer component={Paper} sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <Table>
          <TableHead sx={{ bgcolor: 'action.hover' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Cliente</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Venta #</TableCell>
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
                  <Typography sx={{ fontWeight: 600 }}>{debt.customer?.name}</Typography>
                </TableCell>
                <TableCell>#{debt.sale_id}</TableCell>
                <TableCell>${debt.total_amount.toFixed(2)}</TableCell>
                <TableCell sx={{ color: 'error.main', fontWeight: 700 }}>
                  ${debt.remaining_amount.toFixed(2)}
                </TableCell>
                <TableCell>{new Date(debt.due_date).toLocaleDateString()}</TableCell>
                <TableCell>{getStatusChip(debt.status)}</TableCell>
                <TableCell align="right">
                  <Button 
                    variant="contained" 
                    size="small" 
                    startIcon={<PaymentIcon />}
                    onClick={() => handleOpenPayment(debt)}
                    disabled={debt.status === 'PAID'}
                    sx={{ borderRadius: 2 }}
                  >
                    Registrar Abono
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Payment Dialog */}
      <Dialog open={openPayment} onClose={() => setOpenPayment(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Registrar Pago de Cliente</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Cliente: <strong>{selectedDebt?.customer?.name}</strong> <br/>
              Saldo pendiente: <strong>${selectedDebt?.remaining_amount.toFixed(2)}</strong>
            </Typography>
            
            <TextField
              label="Monto a Pagar"
              type="number"
              fullWidth
              value={paymentData.amount}
              onChange={(e) => setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) })}
            />
            
            <TextField
              select
              label="Método de Pago"
              fullWidth
              value={paymentData.method}
              onChange={(e) => setPaymentData({ ...paymentData, method: e.target.value })}
            >
              <MenuItem value="cash">Efectivo</MenuItem>
              <MenuItem value="transfer">Transferencia Bancaria</MenuItem>
              <MenuItem value="card">Tarjeta de Débito/Crédito</MenuItem>
            </TextField>
            
            <TextField
              label="Referencia / Nota"
              fullWidth
              value={paymentData.reference}
              onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenPayment(false)}>Cancelar</Button>
          <Button 
            variant="contained" 
            onClick={() => paymentMutation.mutate({ ...paymentData, ar_id: selectedDebt.id })}
            disabled={paymentData.amount <= 0 || paymentData.amount > (selectedDebt?.remaining_amount || 0)}
          >
            Confirmar Pago
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
