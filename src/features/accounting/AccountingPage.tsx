import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Box, Typography, Card, CardContent, Tabs, Tab, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, Grid, Button, Paper, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Divider,
  Snackbar, Alert, CircularProgress, IconButton, CardHeader, Autocomplete
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axiosConfig';
import { 
  Add as AddIcon, ReceiptLong as ReceiptIcon, AccountBalanceWallet as AccountIcon,
  Delete as DeleteIcon, LibraryAdd as LibraryAddIcon, CheckCircleOutlined as CheckedIcon,
  ErrorOutlined as ErrorIcon, AccountTree as ChartIcon, Search as SearchIcon
} from '@mui/icons-material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`accounting-tabpanel-${index}`}
      aria-labelledby={`accounting-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const defaultAccountForm = {
  code: '',
  name: '',
  type: 'Activo'
};

const defaultJournalForm = {
  reference: '',
  description: '',
  details: [
    { account_id: '', debit: 0, credit: 0 },
    { account_id: '', debit: 0, credit: 0 }
  ]
};

export default function AccountingPage() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const [tabValue, setTabValue] = useState(() => {
    if (location.pathname === '/accounting/journal') {
      return 1;
    }
    return 0;
  });

  // Dialog State
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [journalDialogOpen, setJournalDialogOpen] = useState(false);

  // Form State
  const [accountForm, setAccountForm] = useState(defaultAccountForm);
  const [journalForm, setJournalForm] = useState(defaultJournalForm);

  // Search State
  const [accountSearchQuery, setAccountSearchQuery] = useState('');
  const [journalSearchQuery, setJournalSearchQuery] = useState('');

  // Notification Toast State
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'warning' });

  // 1. Fetch Accounts
  const { data: accounts = [], isLoading: isLoadingAccounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const res = await api.get('/accounting/accounts');
      return res.data;
    }
  });

  // 2. Fetch Journal Entries
  const { data: journalEntries = [], isLoading: isLoadingEntries } = useQuery({
    queryKey: ['journal-entries'],
    queryFn: async () => {
      const res = await api.get('/accounting/journal-entries');
      return res.data;
    }
  });

  // 3. Create Account Mutation
  const createAccountMutation = useMutation({
    mutationFn: async (newAccount: typeof defaultAccountForm) => {
      const res = await api.post('/accounting/accounts', newAccount);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      showToast('Cuenta contable creada exitosamente', 'success');
      setAccountDialogOpen(false);
      setAccountForm(defaultAccountForm);
    },
    onError: (error: any) => {
      const detail = error.response?.data?.detail || 'Error al crear la cuenta contable';
      showToast(typeof detail === 'string' ? detail : JSON.stringify(detail), 'error');
    }
  });

  // 4. Create Journal Entry Mutation
  const createJournalMutation = useMutation({
    mutationFn: async (newJournal: any) => {
      // Format details to parse values to number and ignore zero rows if necessary
      const formattedDetails = newJournal.details.map((d: any) => ({
        account_id: Number(d.account_id),
        debit: Number(d.debit) || 0.0,
        credit: Number(d.credit) || 0.0
      }));
      const res = await api.post('/accounting/journal-entries', {
        ...newJournal,
        details: formattedDetails
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      showToast('Asiento de diario registrado exitosamente', 'success');
      setJournalDialogOpen(false);
      setJournalForm(defaultJournalForm);
    },
    onError: (error: any) => {
      const detail = error.response?.data?.detail || 'Error al registrar el asiento de diario';
      showToast(typeof detail === 'string' ? detail : JSON.stringify(detail), 'error');
    }
  });

  const showToast = (message: string, severity: 'success' | 'error' | 'warning') => {
    setToast({ open: true, message, severity });
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'Activo': return 'success';
      case 'Pasivo': return 'error';
      case 'Capital': return 'primary';
      case 'Ingreso': return 'success';
      case 'Gasto': return 'warning';
      default: return 'default';
    }
  };

  // Account form handlers
  const handleAccountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAccountForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountForm.code || !accountForm.name) {
      showToast('El código y el nombre son requeridos', 'error');
      return;
    }
    createAccountMutation.mutate(accountForm);
  };

  // Journal form handlers
  const handleJournalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setJournalForm(prev => ({ ...prev, [name]: value }));
  };

  const handleLineChange = (index: number, field: 'account_id' | 'debit' | 'credit', value: any) => {
    const updatedDetails = [...journalForm.details];
    if (field === 'debit' || field === 'credit') {
      updatedDetails[index][field] = Number(value) || 0;
    } else {
      updatedDetails[index][field] = value;
    }
    setJournalForm(prev => ({ ...prev, details: updatedDetails }));
  };

  const addJournalLine = () => {
    setJournalForm(prev => ({
      ...prev,
      details: [...prev.details, { account_id: '', debit: 0, credit: 0 }]
    }));
  };

  const removeJournalLine = (index: number) => {
    if (journalForm.details.length <= 2) {
      showToast('Un asiento contable debe tener al menos 2 líneas de registro', 'warning');
      return;
    }
    const updatedDetails = journalForm.details.filter((_, i) => i !== index);
    setJournalForm(prev => ({ ...prev, details: updatedDetails }));
  };

  // Compute debit & credit totals
  const totalDebit = journalForm.details.reduce((sum, d) => sum + (Number(d.debit) || 0), 0);
  const totalCredit = journalForm.details.reduce((sum, d) => sum + (Number(d.credit) || 0), 0);
  const difference = Math.abs(totalDebit - totalCredit);
  const isBalanced = difference < 0.01;

  const handleJournalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!journalForm.description) {
      showToast('La descripción del asiento es obligatoria', 'error');
      return;
    }
    
    // Check if any row has empty account selection
    const hasEmptyAccount = journalForm.details.some(d => !d.account_id);
    if (hasEmptyAccount) {
      showToast('Todas las líneas del asiento deben tener una cuenta seleccionada', 'error');
      return;
    }

    if (!isBalanced) {
      showToast(`El asiento contable está desbalanceado por $${difference.toFixed(2)}`, 'error');
      return;
    }

    createJournalMutation.mutate(journalForm);
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      width: '100%',
      maxWidth: 1200, 
      mx: 'auto', 
      mt: 4,
      px: { xs: 2, md: 3 },
      pb: 8
    }}>
      
      {/* Header bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ bgcolor: 'primary.50', p: 1.5, borderRadius: '12px', color: 'primary.main', display: 'flex', alignItems: 'center' }}>
            <AccountIcon fontSize="large" />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-1px' }}>
              Módulo Contable (Leyes de Venezuela)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
              Plan de cuentas y asientos de diario conformes a principios contables VEN-NIF e impuestos del SENIAT
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button 
            variant="outlined" 
            startIcon={<ChartIcon />} 
            onClick={() => setAccountDialogOpen(true)}
            sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 700, px: 2.5 }}
          >
            Nueva Cuenta
          </Button>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => setJournalDialogOpen(true)}
            sx={{ 
              borderRadius: '12px', 
              textTransform: 'none', 
              fontWeight: 700, 
              px: 3,
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)'
            }}
          >
            Nuevo Asiento Diario
          </Button>
        </Box>
      </Box>

      {/* Tabs Menu */}
      <Paper elevation={0} sx={{ 
        width: '100%',
        borderRadius: '20px', 
        border: '1px solid', 
        borderColor: 'divider',
        bgcolor: 'background.paper',
        overflow: 'hidden'
      }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, pt: 2, bgcolor: 'grey.50' }}>
          <Tabs value={tabValue} onChange={handleTabChange} sx={{ '& .MuiTab-root': { fontWeight: 700, textTransform: 'none', fontSize: '0.95rem', minWidth: 160 } }}>
            <Tab label="Plan de Cuentas (VEN-NIF)" />
            <Tab label="Libro Diario" />
          </Tabs>
        </Box>

        <Box sx={{ px: 3, pb: 3 }}>
          {/* TAB 1: Plan de Cuentas */}
          <CustomTabPanel value={tabValue} index={0}>
            {isLoadingAccounts ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box>
                {/* Search Bar */}
                <Box sx={{ mb: 3 }}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    size="small"
                    placeholder="Buscar cuenta por código, nombre o tipo..."
                    value={accountSearchQuery}
                    onChange={(e) => setAccountSearchQuery(e.target.value)}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <SearchIcon color="action" sx={{ mr: 1 }} />
                        )
                      }
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: 'background.paper' } }}
                  />
                </Box>

                <TableContainer sx={{ border: '1px solid', borderColor: 'grey.100', borderRadius: '12px', overflow: 'hidden' }}>
                  <Table>
                    <TableHead sx={{ bgcolor: 'grey.50' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, py: 2 }}>Código</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Nombre de Cuenta</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Tipo de Cuenta</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, pr: 4 }}>Saldo Actual (VES/USD Equivalente)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {accounts.filter((acc: any) => {
                        const q = accountSearchQuery.toLowerCase();
                        return !q || 
                          acc.code?.toLowerCase().includes(q) || 
                          acc.name?.toLowerCase().includes(q) || 
                          acc.type?.toLowerCase().includes(q);
                      }).map((acc: any) => (
                        <TableRow key={acc.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                          <TableCell sx={{ fontWeight: 800, color: 'primary.main', fontFamily: 'monospace', fontSize: '1rem' }}>
                            {acc.code}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{acc.name}</TableCell>
                          <TableCell>
                            <Chip 
                              label={acc.type} 
                              color={getTypeColor(acc.type) as any} 
                              size="small" 
                              sx={{ fontWeight: 700, borderRadius: '6px' }} 
                            />
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800, fontSize: '1.05rem', color: acc.balance < 0 ? 'error.main' : 'success.main', pr: 4 }}>
                            ${Math.abs(acc.balance).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            <Typography variant="caption" sx={{ ml: 0.5, fontWeight: 700, color: 'text.secondary' }}>
                              {acc.type === 'Activo' || acc.type === 'Gasto' 
                                ? (acc.balance >= 0 ? 'DB' : 'CR') 
                                : (acc.balance >= 0 ? 'CR' : 'DB')
                              }
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                      {accounts.filter((acc: any) => {
                        const q = accountSearchQuery.toLowerCase();
                        return !q || 
                          acc.code?.toLowerCase().includes(q) || 
                          acc.name?.toLowerCase().includes(q) || 
                          acc.type?.toLowerCase().includes(q);
                      }).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} align="center" sx={{ py: 10, color: 'text.secondary' }}>
                            No se encontraron cuentas contables.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </CustomTabPanel>

          {/* TAB 2: Libro Diario */}
          <CustomTabPanel value={tabValue} index={1}>
            {isLoadingEntries ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box>
                {/* Search Bar */}
                <Box sx={{ mb: 3 }}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    size="small"
                    placeholder="Buscar asientos por descripción, referencia, código de cuenta o nombre..."
                    value={journalSearchQuery}
                    onChange={(e) => setJournalSearchQuery(e.target.value)}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <SearchIcon color="action" sx={{ mr: 1 }} />
                        )
                      }
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: 'background.paper' } }}
                  />
                </Box>

                {journalEntries.filter((entry: any) => {
                  const q = journalSearchQuery.toLowerCase();
                  if (!q) return true;
                  const refMatch = entry.reference?.toLowerCase().includes(q);
                  const descMatch = entry.description?.toLowerCase().includes(q);
                  const detailMatch = entry.details?.some((d: any) => 
                    d.account?.code?.toLowerCase().includes(q) || 
                    d.account?.name?.toLowerCase().includes(q)
                  );
                  return refMatch || descMatch || detailMatch;
                }).length === 0 ? (
                  <Box sx={{ py: 10, textAlign: 'center', color: 'text.secondary', border: '1px dashed', borderColor: 'divider', borderRadius: '16px' }}>
                    <ReceiptIcon sx={{ fontSize: 70, opacity: 0.2, mb: 1.5 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>No hay asientos de diario que coincidan con la búsqueda</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      Pruebe con otros términos o cree un asiento nuevo
                    </Typography>
                  </Box>
                ) : (
                  <Grid container spacing={3}>
                    {journalEntries.filter((entry: any) => {
                      const q = journalSearchQuery.toLowerCase();
                      if (!q) return true;
                      const refMatch = entry.reference?.toLowerCase().includes(q);
                      const descMatch = entry.description?.toLowerCase().includes(q);
                      const detailMatch = entry.details?.some((d: any) => 
                        d.account?.code?.toLowerCase().includes(q) || 
                        d.account?.name?.toLowerCase().includes(q)
                      );
                      return refMatch || descMatch || detailMatch;
                    }).map((entry: any) => (
                      <Grid size={{ xs: 12 }} key={entry.id}>
                        <Card variant="outlined" sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'grey.200', bgcolor: 'grey.50' }}>
                          <CardHeader
                            title={
                              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                                {entry.description}
                              </Typography>
                            }
                            subheader={
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                Fecha: {new Date(entry.date).toLocaleString('es-VE')} • REF: {entry.reference || `ASIENTO-${entry.id}`}
                              </Typography>
                            }
                            action={
                              <Chip label="Validado y Mayorizado" size="small" color="success" sx={{ fontWeight: 700, borderRadius: '6px' }} />
                            }
                            sx={{ borderBottom: '1px solid', borderColor: 'grey.100', px: 3, py: 2 }}
                          />
                          <CardContent sx={{ p: 0 }}>
                            <TableContainer sx={{ bgcolor: 'background.paper' }}>
                              <Table size="small">
                                <TableHead sx={{ bgcolor: 'grey.50' }}>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 700, py: 1.5, pl: 3 }}>Código de Cuenta</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Descripción de Cuenta</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700 }}>Débito ($)</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700, pr: 3 }}>Crédito ($)</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {entry.details.map((detail: any) => (
                                    <TableRow key={detail.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                      <TableCell sx={{ pl: 3, fontFamily: 'monospace', fontWeight: 700, color: 'primary.main' }}>
                                        {detail.account.code}
                                      </TableCell>
                                      <TableCell sx={{ fontWeight: 600, pl: detail.credit > 0 ? 4 : 1 }}>
                                        {detail.account.name}
                                      </TableCell>
                                      <TableCell align="right" sx={{ fontWeight: 800, color: detail.debit > 0 ? 'text.primary' : 'grey.300' }}>
                                        {detail.debit > 0 ? `$${detail.debit.toFixed(2)}` : '-'}
                                      </TableCell>
                                      <TableCell align="right" sx={{ fontWeight: 800, pr: 3, color: detail.credit > 0 ? 'text.primary' : 'grey.300' }}>
                                        {detail.credit > 0 ? `$${detail.credit.toFixed(2)}` : '-'}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Box>
            )}
          </CustomTabPanel>
        </Box>
      </Paper>

      {/* DIALOG 1: Crear Nueva Cuenta */}
      <Dialog open={accountDialogOpen} onClose={() => setAccountDialogOpen(false)} maxWidth="xs" fullWidth sx={{ '& .MuiDialog-paper': { borderRadius: '16px' } }}>
        <form onSubmit={handleAccountSubmit}>
          <DialogTitle sx={{ fontWeight: 800 }}>Crear Cuenta Contable</DialogTitle>
          <Divider />
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
            <TextField
              label="Código Contable (Ej. 1140)"
              name="code"
              value={accountForm.code}
              onChange={handleAccountChange}
              required
              fullWidth
              size="small"
              placeholder="Número de cuenta"
              helperText="Determina la jerarquía en el plan de cuentas"
            />
            <TextField
              label="Nombre de la Cuenta"
              name="name"
              value={accountForm.name}
              onChange={handleAccountChange}
              required
              fullWidth
              size="small"
              placeholder="Nombre descriptivo"
            />
            <TextField
              select
              label="Tipo de Cuenta"
              name="type"
              value={accountForm.type}
              onChange={handleAccountChange}
              required
              fullWidth
              size="small"
            >
              <MenuItem value="Activo">Activo</MenuItem>
              <MenuItem value="Pasivo">Pasivo</MenuItem>
              <MenuItem value="Capital">Capital (Patrimonio)</MenuItem>
              <MenuItem value="Ingreso">Ingreso</MenuItem>
              <MenuItem value="Gasto">Gasto (Costo/Gasto)</MenuItem>
            </TextField>
          </DialogContent>
          <Divider />
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setAccountDialogOpen(false)} color="inherit" sx={{ fontWeight: 600 }}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={createAccountMutation.isPending}
              sx={{ fontWeight: 700 }}
            >
              {createAccountMutation.isPending ? 'Guardando...' : 'Crear Cuenta'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* DIALOG 2: Crear Nuevo Asiento de Diario */}
      <Dialog open={journalDialogOpen} onClose={() => setJournalDialogOpen(false)} maxWidth="md" fullWidth sx={{ '& .MuiDialog-paper': { borderRadius: '20px' } }}>
        <form onSubmit={handleJournalSubmit}>
          <DialogTitle sx={{ fontWeight: 800 }}>Nuevo Asiento de Diario (Ventas, Gastos, Impuestos)</DialogTitle>
          <Divider />
          <DialogContent sx={{ mt: 1, maxHeight: '65vh', overflowY: 'auto' }}>
            <Grid container spacing={2.5} sx={{ mb: 4 }}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Referencia / Soporte"
                  name="reference"
                  value={journalForm.reference}
                  onChange={handleJournalChange}
                  placeholder="Ej. Factura-001, RET-IVA"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 8 }}>
                <TextField
                  fullWidth
                  size="small"
                  required
                  label="Descripción del Asiento"
                  name="description"
                  value={journalForm.description}
                  onChange={handleJournalChange}
                  placeholder="Ej. Registro de compra con retención de IVA según ley SENIAT"
                />
              </Grid>
            </Grid>

            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, color: 'text.secondary', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>LÍNEAS DE CONTABILIZACIÓN</span>
              <Button 
                variant="outlined" 
                size="small" 
                startIcon={<LibraryAddIcon />} 
                onClick={addJournalLine}
                sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700 }}
              >
                Agregar Línea
              </Button>
            </Typography>

            {/* List of journal entry rows */}
            {journalForm.details.map((detail, index) => (
              <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <Box sx={{ flexGrow: 1, minWidth: 280 }}>
                  <Autocomplete
                    options={accounts}
                    getOptionLabel={(option: any) => `${option.code || ''} - ${option.name || ''} (${option.type || ''})`}
                    value={accounts.find((acc: any) => acc.id === Number(detail.account_id)) || null}
                    onChange={(_, newValue) => handleLineChange(index, 'account_id', newValue ? newValue.id.toString() : '')}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        size="small" 
                        required 
                        label="Cuenta Contable" 
                        fullWidth 
                      />
                    )}
                  />
                </Box>
                <Box sx={{ width: 140 }}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Débito ($)"
                    value={detail.debit || ''}
                    placeholder="0.00"
                    onChange={(e) => handleLineChange(index, 'debit', e.target.value)}
                    slotProps={{ htmlInput: { step: '0.01', min: '0' } }}
                  />
                </Box>
                <Box sx={{ width: 140 }}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Crédito ($)"
                    value={detail.credit || ''}
                    placeholder="0.00"
                    onChange={(e) => handleLineChange(index, 'credit', e.target.value)}
                    slotProps={{ htmlInput: { step: '0.01', min: '0' } }}
                  />
                </Box>
                <IconButton 
                  color="error" 
                  onClick={() => removeJournalLine(index)} 
                  sx={{ bgcolor: 'error.50', '&:hover': { bgcolor: 'error.100' } }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}

            {/* Math Check box */}
            <Box sx={{ 
              mt: 4, 
              p: 2.5, 
              borderRadius: '12px', 
              bgcolor: isBalanced ? 'success.50' : 'error.50',
              border: '1px solid',
              borderColor: isBalanced ? 'success.200' : 'error.200',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                {isBalanced ? (
                  <CheckedIcon color="success" />
                ) : (
                  <ErrorIcon color="error" />
                )}
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: isBalanced ? 'success.dark' : 'error.dark' }}>
                    {isBalanced 
                      ? 'Asiento Contable Balanceado' 
                      : `Asiento Desbalanceado (Diferencia: $${difference.toFixed(2)})`
                    }
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Según la ley de partida doble, los débitos y créditos deben sumar exactamente lo mismo.
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 4, textAlign: 'right' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>TOTAL DÉBITO</Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 900, color: 'text.primary' }}>
                    ${totalDebit.toFixed(2)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>TOTAL CRÉDITO</Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 900, color: 'text.primary' }}>
                    ${totalCredit.toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </DialogContent>
          <Divider />
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setJournalDialogOpen(false)} color="inherit" sx={{ fontWeight: 600 }}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={createJournalMutation.isPending || !isBalanced}
              sx={{ fontWeight: 700, px: 3 }}
            >
              {createJournalMutation.isPending ? 'Registrando...' : 'Registrar Asiento'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Snackbar alerts */}
      <Snackbar 
        open={toast.open} 
        autoHideDuration={5000} 
        onClose={() => setToast(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setToast(prev => ({ ...prev, open: false }))} 
          severity={toast.severity} 
          variant="filled"
          sx={{ width: '100%', fontWeight: 600, borderRadius: '8px' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
