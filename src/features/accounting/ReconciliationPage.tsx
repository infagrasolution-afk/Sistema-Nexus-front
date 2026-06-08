import { useState } from 'react';
import { 
  Box, Typography, Grid, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Button, Chip, TextField, Dialog, 
  DialogTitle, DialogContent, DialogActions, Select, MenuItem, FormControl, InputLabel, CircularProgress
} from '@mui/material';
import { 
  CompareArrows as SyncIcon, 
  UploadFile as UploadIcon,
  CheckCircle as CheckIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axiosConfig';

export default function ReconciliationPage() {
  const queryClient = useQueryClient();
  const [openNew, setOpenNew] = useState(false);
  const [selectedStatementId, setSelectedStatementId] = useState<number | ''>('');
  const [newStmtData, setNewStmtData] = useState({
    account_id: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => (await api.get('/accounting/accounts')).data
  });

  const bankAccounts = accounts.filter((a: any) => a.code.startsWith('1000'));

  const { data: statements = [], isLoading: loadingStmts } = useQuery({
    queryKey: ['bank-statements'],
    queryFn: async () => (await api.get('/accounting/bank-statements')).data
  });

  const currentStatement = statements.find((s: any) => s.id === selectedStatementId);

  const createStmtMutation = useMutation({
    mutationFn: (data: any) => api.post('/accounting/bank-statements', data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bank-statements'] });
      setOpenNew(false);
      setSelectedStatementId(data.data.id);
    }
  });

  const uploadLinesMutation = useMutation({
    mutationFn: ({ stmtId, lines }: { stmtId: number, lines: any[] }) => 
      api.post(`/accounting/bank-statements/${stmtId}/lines`, lines),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-statements'] });
      alert('Líneas cargadas exitosamente');
    }
  });

  const autoReconcileMutation = useMutation({
    mutationFn: (stmtId: number) => api.post(`/accounting/bank-statements/${stmtId}/auto-reconcile`),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['bank-statements'] });
      alert(res.data.message);
    }
  });

  const handleCreate = () => {
    if (!newStmtData.account_id) return alert('Seleccione cuenta');
    createStmtMutation.mutate(newStmtData);
  };

  const handleSimulateUpload = () => {
    if (!selectedStatementId) return;
    // Simulate parsing a CSV file
    const mockLines = [
      { date: new Date().toISOString(), description: 'Trf Recibida Cliente X', amount: 500.00, reference: 'REF-123' },
      { date: new Date().toISOString(), description: 'Pago Nomina', amount: -150.00, reference: 'REF-124' },
      { date: new Date().toISOString(), description: 'Comision Bancaria', amount: -5.00, reference: 'COM-001' },
      { date: new Date().toISOString(), description: 'Deposito Efectivo', amount: 300.00, reference: 'DEP-99' },
    ];
    uploadLinesMutation.mutate({ stmtId: selectedStatementId as number, lines: mockLines });
  };

  if (loadingStmts) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;

  const reconciledCount = currentStatement?.lines.filter((l: any) => l.is_reconciled).length || 0;
  const totalCount = currentStatement?.lines.length || 0;

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: '-1px', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <SyncIcon color="primary" fontSize="large" />
            Conciliación Bancaria
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mt: 0.5 }}>
            Empareja tus movimientos bancarios con los asientos contables del sistema.
          </Typography>
        </Box>
      </Box>

      <Paper sx={{ p: 3, mb: 3, borderRadius: 3, display: 'flex', gap: 2, alignItems: 'center', bgcolor: 'grey.50', border: '1px solid', borderColor: 'divider' }}>
        <FormControl sx={{ minWidth: 250 }}>
          <InputLabel>Estado de Cuenta</InputLabel>
          <Select
            value={selectedStatementId}
            label="Estado de Cuenta"
            onChange={(e) => setSelectedStatementId(e.target.value as number)}
          >
            {statements.map((s: any) => {
              const acc = bankAccounts.find((a: any) => a.id === s.account_id);
              return (
                <MenuItem key={s.id} value={s.id}>
                  {acc?.name || `Cuenta #${s.account_id}`} - {s.month}/{s.year}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
        
        <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setOpenNew(true)}>
          Nuevo Estado
        </Button>

        {currentStatement && (
          <>
            <Box sx={{ flexGrow: 1 }} />
            <Button 
              variant="contained" 
              color="secondary" 
              startIcon={<UploadIcon />}
              onClick={handleSimulateUpload}
              disabled={uploadLinesMutation.isPending}
            >
              Cargar CSV Extracto
            </Button>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<SyncIcon />}
              onClick={() => autoReconcileMutation.mutate(selectedStatementId as number)}
              disabled={autoReconcileMutation.isPending || totalCount === 0}
            >
              Auto-Match Inteligente
            </Button>
          </>
        )}
      </Paper>

      {currentStatement ? (
        <Box>
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Paper sx={{ p: 2, flex: 1, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: 'info.50' }}>
              <Typography variant="subtitle2" color="info.main" sx={{ fontWeight: 700 }}>Progreso de Conciliación</Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, mt: 1, color: 'info.dark' }}>
                {reconciledCount} / {totalCount} líneas
              </Typography>
            </Paper>
          </Box>

          <Grid container spacing={3}>
            {/* Left side: Bank Lines */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Movimientos del Banco</Typography>
              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: 'action.hover' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800 }}>Fecha</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Descripción / Ref</TableCell>
                      <TableCell sx={{ fontWeight: 800 }} align="right">Monto</TableCell>
                      <TableCell sx={{ fontWeight: 800 }} align="center">Estado</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentStatement.lines.map((l: any) => (
                      <TableRow key={l.id} sx={{ bgcolor: l.is_reconciled ? 'success.50' : 'inherit' }}>
                        <TableCell>{new Date(l.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{l.description}</Typography>
                          <Typography variant="caption" color="text.secondary">{l.reference}</Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, color: l.amount > 0 ? 'success.main' : 'error.main' }}>
                          ${l.amount.toFixed(2)}
                        </TableCell>
                        <TableCell align="center">
                          {l.is_reconciled ? (
                            <Chip size="small" color="success" label="Match" icon={<CheckIcon />} sx={{ fontWeight: 700 }} />
                          ) : (
                            <Chip size="small" color="warning" label="Pendiente" sx={{ fontWeight: 700 }} />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {currentStatement.lines.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 4 }}>Sube el archivo CSV del banco para ver los movimientos aquí.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>

            {/* Right side: Journal Detail Matched */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Asiento Contable Vinculado</Typography>
              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: 'action.hover' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800 }}>ID Asiento</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Cuenta</TableCell>
                      <TableCell sx={{ fontWeight: 800 }} align="right">Débito</TableCell>
                      <TableCell sx={{ fontWeight: 800 }} align="right">Crédito</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentStatement.lines.filter((l: any) => l.is_reconciled).map((l: any) => (
                      <TableRow key={`je-${l.id}`} hover>
                        <TableCell sx={{ fontWeight: 700 }}>#{l.linked_journal_detail_id}</TableCell>
                        <TableCell>Banco</TableCell>
                        <TableCell align="right" sx={{ color: 'success.main' }}>
                           {l.amount > 0 ? `$${l.amount.toFixed(2)}` : '-'}
                        </TableCell>
                        <TableCell align="right" sx={{ color: 'error.main' }}>
                           {l.amount < 0 ? `$${Math.abs(l.amount).toFixed(2)}` : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                    {reconciledCount === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 4 }}>Ningún movimiento emparejado.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </Box>
      ) : (
        <Box sx={{ py: 10, textAlign: 'center', opacity: 0.5 }}>
          <SyncIcon sx={{ fontSize: 80, mb: 2 }} />
          <Typography variant="h6">Selecciona o crea un estado de cuenta bancario para comenzar.</Typography>
        </Box>
      )}

      <Dialog open={openNew} onClose={() => setOpenNew(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Nuevo Estado de Cuenta</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth required>
                <InputLabel>Cuenta Bancaria (Activo)</InputLabel>
                <Select
                  value={newStmtData.account_id}
                  label="Cuenta Bancaria (Activo)"
                  onChange={(e) => setNewStmtData({ ...newStmtData, account_id: e.target.value as string })}
                >
                  {bankAccounts.map((a: any) => (
                    <MenuItem key={a.id} value={a.id}>{a.code} - {a.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField 
                label="Mes" type="number" fullWidth 
                value={newStmtData.month}
                onChange={(e) => setNewStmtData({ ...newStmtData, month: Number(e.target.value) })}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField 
                label="Año" type="number" fullWidth 
                value={newStmtData.year}
                onChange={(e) => setNewStmtData({ ...newStmtData, year: Number(e.target.value) })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenNew(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreate}>Crear</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
