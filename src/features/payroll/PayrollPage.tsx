import React, { useState } from 'react';
import {
  Box, Typography, Paper, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, CircularProgress, Alert, Tabs, Tab,
  Card, CardContent, Grid, FormControlLabel, Checkbox
} from '@mui/material';
import {
  Add as AddIcon,
  People as PeopleIcon,
  Calculate as CalculateIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  Refresh as RefreshIcon,
  Lock as LockIcon,
  Badge as BadgeIcon,
  PictureAsPdf as PdfIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axiosConfig';

interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  national_id: string;
  department: string;
  position: string;
  base_salary_usd: number;
  base_salary_ves: number;
  payment_frequency: string;
  bank_name?: string;
  bank_account?: string;
  is_active: boolean;
  sso_eligible: boolean;
  rpe_eligible: boolean;
  faov_eligible: boolean;
  cestaticket_eligible: boolean;
}

interface PayrollPeriod {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  payment_date: string;
  status: string;
  total_gross: number;
  total_deductions: number;
  total_net: number;
  receipts: any[];
}

export default function PayrollPage() {
  const queryClient = useQueryClient();
  const [currentTab, setCurrentTab] = useState(0);

  // Modales
  const [openEmpModal, setOpenEmpModal] = useState(false);
  const [openPeriodModal, setOpenPeriodModal] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<PayrollPeriod | null>(null);

  // Formulario Empleado
  const [empFormData, setEmpFormData] = useState({
    first_name: '',
    last_name: '',
    national_id: '',
    department: 'Operaciones',
    position: 'Personal Operativo',
    hire_date: new Date().toISOString().split('T')[0],
    base_salary_usd: 150,
    base_salary_ves: 0,
    bank_name: 'Banco de Venezuela',
    bank_account: '',
    payment_frequency: 'QUINCENAL',
    sso_eligible: true,
    rpe_eligible: true,
    faov_eligible: true,
    cestaticket_eligible: true,
    is_active: true
  });

  // Formulario Período
  const [periodFormData, setPeriodFormData] = useState({
    name: '1ra Quincena Octubre 2026',
    start_date: '2026-10-01',
    end_date: '2026-10-15',
    payment_date: '2026-10-15',
    exchange_rate: 1.0
  });

  // Queries
  const { data: employees = [], isLoading: loadingEmployees, refetch: refetchEmployees } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: async () => (await api.get('/payroll/employees')).data
  });

  const { data: periods = [], refetch: refetchPeriods } = useQuery<PayrollPeriod[]>({
    queryKey: ['payroll-periods'],
    queryFn: async () => (await api.get('/payroll/periods')).data
  });

  // Mutación Crear Empleado
  const createEmpMutation = useMutation({
    mutationFn: async (payload: any) => (await api.post('/payroll/employees', payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setOpenEmpModal(false);
    }
  });

  // Mutación Crear Período
  const createPeriodMutation = useMutation({
    mutationFn: async (payload: any) => (await api.post('/payroll/periods', payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-periods'] });
      setOpenPeriodModal(false);
    }
  });

  // Mutación Calcular Nómina
  const calculateMutation = useMutation({
    mutationFn: async (periodId: number) => (await api.post(`/payroll/periods/${periodId}/calculate`)).data,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payroll-periods'] });
      setSelectedPeriod(data);
      alert('Cálculo de Nómina LOTTT completado exitosamente.');
    }
  });

  // Mutación Cerrar Nómina
  const closePeriodMutation = useMutation({
    mutationFn: async (periodId: number) => (await api.post(`/payroll/periods/${periodId}/close`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-periods'] });
      alert('Período de nómina cerrado.');
    }
  });

  const handleEmpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createEmpMutation.mutate(empFormData);
  };

  const handlePeriodSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPeriodMutation.mutate(periodFormData);
  };

  const handleDownloadReceiptPdf = async (receiptId: number, receiptNum: string) => {
    try {
      const response = await api.get(`/payroll/receipts/${receiptId}/pdf`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `recibo_nomina_${receiptNum}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error al descargar recibo:', err);
      alert('Error al generar el recibo de pago PDF');
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1400, margin: '0 auto' }}>
      {/* Encabezado */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <BadgeIcon color="primary" sx={{ fontSize: 40 }} />
          <div>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Nómina y Recursos Humanos (LOTTT Venezuela)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Gestión de personal, deducciones de ley (IVSS, Banavih, Cestaticket) y recibos de pago
            </Typography>
          </div>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => { refetchEmployees(); refetchPeriods(); }}>
            Actualizar
          </Button>
          {currentTab === 0 ? (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenEmpModal(true)}>
              Nuevo Trabajador
            </Button>
          ) : (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenPeriodModal(true)}>
              Aperturar Nómina
            </Button>
          )}
        </Box>
      </Box>

      {/* Pestañas */}
      <Paper elevation={0} sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={(_, val) => setCurrentTab(val)}>
          <Tab icon={<PeopleIcon />} iconPosition="start" label="Directorio de Trabajadores" sx={{ fontWeight: 700 }} />
          <Tab icon={<CalculateIcon />} iconPosition="start" label="Cálculo y Períodos de Nómina" sx={{ fontWeight: 700 }} />
        </Tabs>
      </Paper>

      {/* ── TAB 1: TRABAJADORES ── */}
      {currentTab === 0 && (
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
          {loadingEmployees ? (
            <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>
          ) : employees.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Alert severity="info" sx={{ maxWidth: 500, margin: '0 auto' }}>
                No hay trabajadores registrados. Registra el primero con el botón superior.
              </Alert>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Cédula / RIF</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Nombre Completo</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Departamento / Cargo</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Frecuencia</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Sueldo Base (USD)</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">Beneficios LOTTT</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">Estado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {employees.map((emp) => (
                    <TableRow key={emp.id} hover>
                      <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{emp.national_id}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{emp.first_name} {emp.last_name}</TableCell>
                      <TableCell>{emp.department} — {emp.position}</TableCell>
                      <TableCell><Chip label={emp.payment_frequency} size="small" variant="outlined" /></TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: 'primary.main' }}>
                        ${Number(emp.base_salary_usd).toFixed(2)}
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                          {emp.sso_eligible && <Chip label="SSO 4%" size="small" color="primary" sx={{ fontSize: '0.65rem' }} />}
                          {emp.faov_eligible && <Chip label="FAOV 1%" size="small" color="secondary" sx={{ fontSize: '0.65rem' }} />}
                          {emp.cestaticket_eligible && <Chip label="Bono Alim." size="small" color="success" sx={{ fontSize: '0.65rem' }} />}
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          icon={emp.is_active ? <ActiveIcon /> : <InactiveIcon />}
                          label={emp.is_active ? 'Activo' : 'Inactivo'}
                          color={emp.is_active ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {/* ── TAB 2: PERÍODOS Y CÁLCULO DE NÓMINA ── */}
      {currentTab === 1 && (
        <Box>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {periods.map((p) => (
              <Grid size={{ xs: 12, md: 6, lg: 4 }} key={p.id}>
                <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>{p.name}</Typography>
                      <Chip
                        label={p.status}
                        color={p.status === 'CLOSED' ? 'default' : (p.status === 'CALCULATED' ? 'success' : 'warning')}
                        size="small"
                        sx={{ fontWeight: 700 }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Período: {p.start_date} al {p.end_date}
                    </Typography>

                    <Box sx={{ bgcolor: 'action.hover', p: 1.5, borderRadius: 1.5, mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption">Total Asignaciones:</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>${Number(p.total_gross).toFixed(2)}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption">Total Deducciones (Ley):</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'error.main' }}>-${Number(p.total_deductions).toFixed(2)}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ fontWeight: 800 }}>Neto a Pagar:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: 'success.main' }}>${Number(p.total_net).toFixed(2)}</Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {p.status !== 'CLOSED' && (
                        <Button
                          fullWidth
                          variant="contained"
                          color="primary"
                          size="small"
                          startIcon={<CalculateIcon />}
                          disabled={calculateMutation.isPending}
                          onClick={() => calculateMutation.mutate(p.id)}
                        >
                          Calcular
                        </Button>
                      )}
                      {p.status === 'CALCULATED' && (
                        <Button
                          fullWidth
                          variant="outlined"
                          color="warning"
                          size="small"
                          startIcon={<LockIcon />}
                          onClick={() => closePeriodMutation.mutate(p.id)}
                        >
                          Cerrar
                        </Button>
                      )}
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setSelectedPeriod(p)}
                      >
                        Recibos
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Recibos del Período Seleccionado */}
          {selectedPeriod && (
            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                Recibos de Pago — {selectedPeriod.name}
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ bgcolor: 'action.hover' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Trabajador</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Cédula</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Sueldo Quincenal</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Cestaticket</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Deducción SSO (4%)</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Deducción FAOV (1%)</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Total Neto a Pagar</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Recibo (PDF)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(selectedPeriod.receipts || []).map((r: any) => (
                      <TableRow key={r.id} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{r.employee?.first_name} {r.employee?.last_name}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{r.employee?.national_id}</TableCell>
                        <TableCell align="right">${Number(r.base_salary_ves || r.base_salary_amount || 0).toFixed(2)}</TableCell>
                        <TableCell align="right">${Number(r.cestaticket_ves || r.cesta_ticket || 0).toFixed(2)}</TableCell>
                        <TableCell align="right" sx={{ color: 'error.main' }}>-${Number(r.sso_deduction_ves || r.sso_deduction || 0).toFixed(2)}</TableCell>
                        <TableCell align="right" sx={{ color: 'error.main' }}>-${Number(r.faov_deduction_ves || r.faov_deduction || 0).toFixed(2)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, color: 'success.main' }}>
                          ${Number(r.net_amount_usd || r.net_payable || 0).toFixed(2)}
                          {r.net_amount_ves && (
                            <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontWeight: 600 }}>
                              Bs. {Number(r.net_amount_ves).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Button
                            size="small"
                            variant="outlined"
                            color="primary"
                            startIcon={<PdfIcon />}
                            onClick={() => handleDownloadReceiptPdf(r.id, r.receipt_number || String(r.id))}
                            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                          >
                            PDF
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(selectedPeriod.receipts || []).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                          Aún no se ha calculado la nómina para este período. Haz clic en "Calcular".
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </Box>
      )}

      {/* Modal Nuevo Trabajador */}
      <Dialog open={openEmpModal} onClose={() => setOpenEmpModal(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleEmpSubmit}>
          <DialogTitle sx={{ fontWeight: 700 }}>Registrar Nuevo Trabajador</DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <TextField fullWidth label="Nombres" required value={empFormData.first_name} onChange={(e) => setEmpFormData({ ...empFormData, first_name: e.target.value })} />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField fullWidth label="Apellidos" required value={empFormData.last_name} onChange={(e) => setEmpFormData({ ...empFormData, last_name: e.target.value })} />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField fullWidth label="Cédula de Identidad (V- / E-)" required placeholder="V-12345678" value={empFormData.national_id} onChange={(e) => setEmpFormData({ ...empFormData, national_id: e.target.value })} />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField fullWidth type="date" label="Fecha de Ingreso" value={empFormData.hire_date} onChange={(e) => setEmpFormData({ ...empFormData, hire_date: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField fullWidth label="Departamento" value={empFormData.department} onChange={(e) => setEmpFormData({ ...empFormData, department: e.target.value })} />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField fullWidth label="Cargo" value={empFormData.position} onChange={(e) => setEmpFormData({ ...empFormData, position: e.target.value })} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth type="number" label="Sueldo Base Mensual (USD)" required value={empFormData.base_salary_usd} onChange={(e) => setEmpFormData({ ...empFormData, base_salary_usd: parseFloat(e.target.value) || 0 })} slotProps={{ htmlInput: { step: '0.01' } }} />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField fullWidth label="Banco" value={empFormData.bank_name} onChange={(e) => setEmpFormData({ ...empFormData, bank_name: e.target.value })} />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField fullWidth label="N° Cuenta Bancaria (20 dígitos)" value={empFormData.bank_account} onChange={(e) => setEmpFormData({ ...empFormData, bank_account: e.target.value })} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 1 }}>Beneficios y Deducciones de Ley (LOTTT):</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <FormControlLabel control={<Checkbox checked={empFormData.sso_eligible} onChange={(e) => setEmpFormData({ ...empFormData, sso_eligible: e.target.checked })} />} label="SSO (4%)" />
                  <FormControlLabel control={<Checkbox checked={empFormData.rpe_eligible} onChange={(e) => setEmpFormData({ ...empFormData, rpe_eligible: e.target.checked })} />} label="RPE (0.5%)" />
                  <FormControlLabel control={<Checkbox checked={empFormData.faov_eligible} onChange={(e) => setEmpFormData({ ...empFormData, faov_eligible: e.target.checked })} />} label="FAOV (1%)" />
                  <FormControlLabel control={<Checkbox checked={empFormData.cestaticket_eligible} onChange={(e) => setEmpFormData({ ...empFormData, cestaticket_eligible: e.target.checked })} />} label="Cestaticket Socialista" />
                </Box>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenEmpModal(false)}>Cancelar</Button>
            <Button type="submit" variant="contained">Guardar Trabajador</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Modal Apertura de Período */}
      <Dialog open={openPeriodModal} onClose={() => setOpenPeriodModal(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handlePeriodSubmit}>
          <DialogTitle sx={{ fontWeight: 700 }}>Aperturar Período de Nómina</DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth label="Nombre del Período" required value={periodFormData.name} onChange={(e) => setPeriodFormData({ ...periodFormData, name: e.target.value })} />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField fullWidth type="date" label="Desde" value={periodFormData.start_date} onChange={(e) => setPeriodFormData({ ...periodFormData, start_date: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField fullWidth type="date" label="Hasta" value={periodFormData.end_date} onChange={(e) => setPeriodFormData({ ...periodFormData, end_date: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth type="date" label="Fecha de Pago" value={periodFormData.payment_date} onChange={(e) => setPeriodFormData({ ...periodFormData, payment_date: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenPeriodModal(false)}>Cancelar</Button>
            <Button type="submit" variant="contained">Crear Período</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
