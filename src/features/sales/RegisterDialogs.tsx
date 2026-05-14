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
    mutationFn: (data: { starting_cash: number, computer_uid: string }) => 
      api.post('/cash/session/open', data),
    onSuccess: (res) => {
      setCashSession(res.data);
      onSuccess(res.data);
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || 'Error al abrir caja');
    }
  });

  const handleOpen = () => {
    openMutation.mutate({
      starting_cash: parseFloat(startingCash),
      computer_uid: getComputerUID()
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
  const { setCashSession } = useAppStore();
  const queryClient = useQueryClient();

  const closeMutation = useMutation({
    mutationFn: (data: { actual_cash: number }) => 
      api.post(`/cash/session/${session?.id}/close`, data),
    onSuccess: () => {
      setCashSession(null);
      queryClient.invalidateQueries({ queryKey: ['cash-session'] });
      onClose();
      window.location.reload(); // Refresh to clear states
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || 'Error al cerrar caja');
    }
  });

  return (
    <Dialog open={open} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
      <DialogTitle sx={{ fontWeight: 800 }}>Cierre de Caja (Arqueo)</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">Caja: {session?.register?.name}</Typography>
          <Typography variant="subtitle2" color="text.secondary">Apertura: {new Date(session?.opening_time).toLocaleString()}</Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="body2" sx={{ mb: 2 }}>
          Cuente el efectivo físico en caja e ingrese el monto total:
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TextField
          autoFocus
          label="Efectivo Real en Caja"
          fullWidth
          type="number"
          value={actualCash}
          onChange={(e) => setActualCash(e.target.value)}
        />
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button variant="outlined" onClick={onClose}>Cancelar</Button>
        <Button 
          variant="contained" 
          color="error"
          onClick={() => closeMutation.mutate({ actual_cash: parseFloat(actualCash) })}
          disabled={!actualCash || closeMutation.isPending}
        >
          Finalizar y Cerrar Caja
        </Button>
      </DialogActions>
    </Dialog>
  );
};
