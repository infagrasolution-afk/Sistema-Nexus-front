import React, { useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Typography, Alert, Box, Divider 
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axiosConfig';
import { getComputerUID } from '../../utils/computer';
import { useAppStore } from '../../store/useAppStore';

interface OpenDialogProps {
  open: boolean;
  onSuccess: (session: any) => void;
}


export const RegisterOpenDialog: React.FC<OpenDialogProps> = ({ open, onSuccess }) => {
  const [startingCash, setStartingCash] = useState('0');
  const [error, setError] = useState('');
  const { setCashSession } = useAppStore();

  const openMutation = useMutation({
    mutationFn: (data: { starting_cash: number, computer_uid: string, register_id?: number }) => 
      api.post('/cash/session/open', data),
    onSuccess: (res) => {
      setCashSession(res.data);
      onSuccess(res.data);
    },
    onError: (err: any) => {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        setError(detail);
      } else if (Array.isArray(detail)) {
        const friendlyMsgs = detail.map((d: any) => {
          const field = d.loc[d.loc.length - 1];
          if (field === 'register_id') return 'Por favor, asigne o configure una caja registradora en el sistema.';
          if (field === 'starting_cash') return 'El monto inicial en efectivo es obligatorio y debe ser numérico.';
          if (d.msg === 'Field required') return 'Campo obligatorio requerido.';
          return d.msg;
        });
        setError(friendlyMsgs.join(', ') || 'Error de validación en el servidor');
      } else if (detail && typeof detail === 'object') {
        setError(detail.message || JSON.stringify(detail));
      } else {
        setError('Error al abrir caja');
      }
    }
  });

  const handleOpen = () => {
    openMutation.mutate({
      starting_cash: parseFloat(startingCash) || 0,
      computer_uid: getComputerUID(),
      register_id: 1 // Default to 1 for backwards compatibility with legacy server validation
    });
  };

  return (
    <Dialog open={open} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
      <DialogTitle sx={{ fontWeight: 800 }}>Apertura de Caja</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
          Ingrese el monto de efectivo con el que inicia la caja hoy.
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TextField
          autoFocus
          label="Monto Inicial (Efectivo)"
          fullWidth
          type="number"
          value={startingCash}
          onChange={(e) => setStartingCash(e.target.value)}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button 
          variant="contained" 
          fullWidth 
          size="large"
          onClick={handleOpen}
          disabled={openMutation.isPending}
        >
          Abrir Caja
        </Button>
      </DialogActions>
    </Dialog>
  );
};

interface CloseDialogProps {
  open: boolean;
  onClose: () => void;
  session: any;
}

export const RegisterCloseDialog: React.FC<CloseDialogProps> = ({ open, onClose, session }) => {
  const [actualCash, setActualCash] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isAccounted, setIsAccounted] = useState(false);
  const [showPurchaseAccounting, setShowPurchaseAccounting] = useState(false);
  const { setCashSession } = useAppStore();
  const queryClient = useQueryClient();

  const closeMutation = useMutation({
    mutationFn: (data: { actual_cash: number }) => 
      api.post(`/cash/session/${session?.id}/close`, data),
    onSuccess: () => {
      setCashSession(null);
      queryClient.invalidateQueries({ queryKey: ['cash-session'] });
      // Muestra el modal de compras después de cerrar
      setShowPurchaseAccounting(true);
    },
    onError: (err: any) => {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        setError(detail);
      } else if (Array.isArray(detail)) {
        const msgs = detail.map((d: any) => `${d.loc.join('.')}: ${d.msg}`).join(', ');
        setError(msgs || 'Error de validación al cerrar caja');
      } else if (detail && typeof detail === 'object') {
        setError(detail.message || JSON.stringify(detail));
      } else {
        setError('Error al cerrar caja');
      }
    }
  });

  const accountSalesMutation = useMutation({
    mutationFn: () => api.post(`/accounting/account-session/${session?.id}`),
    onSuccess: (res) => {
      setIsAccounted(true);
      setSuccessMsg(res.data.message);
      setError('');
    },
    onError: (err: any) => {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        setError(detail);
      } else if (Array.isArray(detail)) {
        const msgs = detail.map((d: any) => `${d.loc.join('.')}: ${d.msg}`).join(', ');
        setError(msgs || 'Error de validación al contabilizar');
      } else if (detail && typeof detail === 'object') {
        setError(detail.message || JSON.stringify(detail));
      } else {
        setError('Error al contabilizar ventas');
      }
    }
  });

  const accountPurchasesMutation = useMutation({
    mutationFn: () => api.post(`/accounting/account-purchases`),
    onSuccess: (res) => {
      alert(res.data.message);
      onClose();
      window.location.reload();
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Error al contabilizar compras');
      onClose();
      window.location.reload();
    }
  });

  if (showPurchaseAccounting) {
    return (
      <Dialog open={open} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
        <DialogTitle sx={{ fontWeight: 800, color: 'primary.main' }}>Contabilizar Compras</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Caja cerrada exitosamente. Existen compras pendientes. ¿Desea contabilizar el módulo de compras ahora?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button variant="outlined" onClick={() => { onClose(); window.location.reload(); }}>Saltar</Button>
          <Button 
            variant="contained" 
            onClick={() => accountPurchasesMutation.mutate()}
            disabled={accountPurchasesMutation.isPending}
          >
            Contabilizar Compras
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
      <DialogTitle sx={{ fontWeight: 800 }}>Cierre de Caja (Arqueo)</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">Caja: {session?.register?.name}</Typography>
          <Typography variant="subtitle2" color="text.secondary">Apertura: {new Date(session?.opening_time).toLocaleString()}</Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />
        
        {successMsg && <Alert severity="success" sx={{ mb: 2 }}>{successMsg}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        {!isAccounted ? (
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
              Antes de cerrar la caja, debe contabilizar las ventas del día.
            </Typography>
            <Button 
              variant="outlined" 
              color="primary" 
              fullWidth 
              onClick={() => accountSalesMutation.mutate()}
              disabled={accountSalesMutation.isPending}
            >
              Contabilizar Ventas
            </Button>
          </Box>
        ) : (
          <>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Cuente el efectivo físico en caja e ingrese el monto total:
            </Typography>
            <TextField
              autoFocus
              label="Efectivo Real en Caja"
              fullWidth
              type="number"
              value={actualCash}
              onChange={(e) => setActualCash(e.target.value)}
            />
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button variant="outlined" onClick={onClose}>Cancelar</Button>
        <Button 
          variant="contained" 
          color="error"
          onClick={() => closeMutation.mutate({ actual_cash: parseFloat(actualCash) })}
          disabled={!isAccounted || !actualCash || closeMutation.isPending}
        >
          Finalizar y Cerrar Caja
        </Button>
      </DialogActions>
    </Dialog>
  );
};
