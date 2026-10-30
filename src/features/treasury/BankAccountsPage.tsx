import React, { useState } from 'react';
import {
  Box, Typography, Paper, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, CircularProgress, Alert, IconButton,
  Card, CardContent, Grid
} from '@mui/material';
import {
  Add as AddIcon,
  AccountBalance as BankIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axiosConfig';

interface BankAccount {
  id: number;
  bank_name: string;
  account_number: string;
  account_type: string;
  currency: string;
  initial_balance: number;
  current_balance: number;
  is_active: boolean;
  notes?: string;
  created_at?: string;
}

const COMMON_BANKS_VE = [
  'Banesco Banco Universal',
  'Banco Mercantil',
  'Banco de Venezuela (BDV)',
  'Banco Provincial (BBVA)',
  'Banco Nacional de Crédito (BNC)',
  'Bancaribe',
  'Banco Exterior',
  'Banco Fondo Común (BFC)',
  'Banplus',
  'Zelle (Cuenta Divisas USA)',
  'Bank of America',
  'Chase Bank',
  'Banesco Panamá',
  'Mercantil Panamá',
  'Binance / Criptoactivos'
];

export default function BankAccountsPage() {
  const queryClient = useQueryClient();
  const [openModal, setOpenModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);

  const [formData, setFormData] = useState({
    bank_name: '',
    account_number: '',
    account_type: 'Corriente',
    currency: 'USD',
    initial_balance: 0,
    is_active: true,
    notes: ''
  });

  // Query cuentas bancarias
  const { data: accounts = [], isLoading, refetch } = useQuery<BankAccount[]>({
    queryKey: ['bank-accounts'],
    queryFn: async () => {
      const res = await api.get('/treasury/bank-accounts');
      return res.data;
    }
  });

  // Mutación para Crear
  const createMutation = useMutation({
    mutationFn: async (payload: typeof formData) => {
      const res = await api.post('/treasury/bank-accounts', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      handleCloseModal();
    }
  });

  // Mutación para Editar
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: Partial<typeof formData> }) => {
      const res = await api.put(`/treasury/bank-accounts/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      handleCloseModal();
    }
  });

  const handleOpenCreate = () => {
    setEditingAccount(null);
    setFormData({
      bank_name: '',
      account_number: '',
      account_type: 'Corriente',
      currency: 'USD',
      initial_balance: 0,
      is_active: true,
      notes: ''
    });
    setOpenModal(true);
  };

  const handleOpenEdit = (acc: BankAccount) => {
    setEditingAccount(acc);
    setFormData({
      bank_name: acc.bank_name,
      account_number: acc.account_number,
      account_type: acc.account_type,
      currency: acc.currency,
      initial_balance: Number(acc.initial_balance),
      is_active: acc.is_active,
      notes: acc.notes || ''
    });
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setEditingAccount(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAccount) {
      updateMutation.mutate({ id: editingAccount.id, payload: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Totales de saldo por divisa
  const totalUSD = accounts
    .filter(a => a.currency === 'USD' && a.is_active)
    .reduce((acc, curr) => acc + Number(curr.current_balance || 0), 0);

  const totalVES = accounts
    .filter(a => a.currency === 'VES' && a.is_active)
    .reduce((acc, curr) => acc + Number(curr.current_balance || 0), 0);

  return (
    <Box sx={{ p: 3, maxWidth: 1400, margin: '0 auto' }}>
      {/* Encabezado */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <BankIcon color="primary" sx={{ fontSize: 36 }} />
          <div>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Cuentas Bancarias y Tesorería
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Gestión de cuentas nacionales e internacionales (VES / USD / Panamá / Zelle)
            </Typography>
          </div>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => refetch()}
          >
            Actualizar
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
            sx={{ borderRadius: 2 }}
          >
            Nueva Cuenta Bancaria
          </Button>
        </Box>
      </Box>

      {/* Tarjetas de Resumen Financiero */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                SALDO TOTAL EN DIVISAS (USD)
              </Typography>
              <Typography variant="h4" color="primary.main" sx={{ mt: 1, fontWeight: 800 }}>
                ${totalUSD.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Disponible en bancos extranjeros, Zelle y cuentas custodia USD
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                SALDO TOTAL EN BOLÍVARES (VES)
              </Typography>
              <Typography variant="h4" color="success.main" sx={{ mt: 1, fontWeight: 800 }}>
                Bs. {totalVES.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Disponible en banca nacional venezolana
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 12, md: 4 }}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                TOTAL CUENTAS REGISTRADAS
              </Typography>
              <Typography variant="h4" sx={{ mt: 1, fontWeight: 800 }}>
                {accounts.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {accounts.filter(a => a.is_active).length} activas para cobros y pagos
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabla de Cuentas */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
        {isLoading ? (
          <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        ) : accounts.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Alert severity="info" sx={{ maxWidth: 500, margin: '0 auto' }}>
              No hay cuentas bancarias registradas. Crea tu primera cuenta con el botón superior.
            </Alert>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Banco / Entidad</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Número de Cuenta / Identificador</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Tipo</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Moneda</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Saldo Actual</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Estado</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {accounts.map((acc) => (
                  <TableRow key={acc.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{acc.bank_name}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{acc.account_number}</TableCell>
                    <TableCell>{acc.account_type}</TableCell>
                    <TableCell>
                      <Chip
                        label={acc.currency}
                        size="small"
                        color={acc.currency === 'USD' ? 'primary' : 'success'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                      {acc.currency === 'USD' ? '$' : 'Bs. '}{' '}
                      {Number(acc.current_balance || 0).toLocaleString('es-VE', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        icon={acc.is_active ? <ActiveIcon /> : <InactiveIcon />}
                        label={acc.is_active ? 'Activa' : 'Inactiva'}
                        color={acc.is_active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => handleOpenEdit(acc)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Modal Crear / Editar */}
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: 700 }}>
            {editingAccount ? 'Editar Cuenta Bancaria' : 'Registrar Nueva Cuenta Bancaria'}
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  select
                  fullWidth
                  label="Banco / Entidad Financiera"
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  required
                >
                  {COMMON_BANKS_VE.map((bank) => (
                    <MenuItem key={bank} value={bank}>{bank}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Número de Cuenta (20 dígitos) / Correo Zelle"
                  value={formData.account_number}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                  required
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Tipo de Cuenta"
                  value={formData.account_type}
                  onChange={(e) => setFormData({ ...formData, account_type: e.target.value })}
                >
                  <MenuItem value="Corriente">Corriente</MenuItem>
                  <MenuItem value="Ahorros">Ahorros</MenuItem>
                  <MenuItem value="Custodia Divisas">Custodia Divisas</MenuItem>
                  <MenuItem value="Billetera Digital">Billetera Digital</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Moneda"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                >
                  <MenuItem value="USD">USD (Dólares)</MenuItem>
                  <MenuItem value="VES">VES (Bolívares)</MenuItem>
                </TextField>
              </Grid>
              {!editingAccount && (
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Saldo Inicial"
                    value={formData.initial_balance}
                    onChange={(e) => setFormData({ ...formData, initial_balance: parseFloat(e.target.value) || 0 })}
                    slotProps={{ htmlInput: { step: '0.01' } }}
                  />
                </Grid>
              )}
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Notas / Titular / Observaciones"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleCloseModal}>Cancelar</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingAccount ? 'Actualizar Cuenta' : 'Guardar Cuenta'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
