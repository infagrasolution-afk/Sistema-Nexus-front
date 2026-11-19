import { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  InputAdornment,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  LinearProgress,
  Divider,
  Stack,
} from '@mui/material';
import {
  Payments as PaymentIcon,
  Search as SearchIcon,
  Add as AddIcon,
  History as HistoryIcon,
  Print as PrintIcon,
  FileDownload as DownloadIcon,
  WarningAmber as WarningIcon,
  CheckCircleOutlined as PaidIcon,
  AccountBalanceWallet as WalletIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axiosConfig';
import { downloadExcelFile } from '../../utils/excelHelper';

interface TreasuryDebtManagerProps {
  mode: 'ar' | 'ap';
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  transfer: 'Transferencia Bancaria',
  mobile: 'Pago Móvil',
  zelle: 'Zelle / Divisas',
  card: 'Tarjeta Débito/Crédito',
  check: 'Cheque',
};

const STATUS_LABELS: Record<string, { label: string; color: 'error' | 'warning' | 'success' | 'default' }> = {
  OPEN: { label: 'Abierta', color: 'error' },
  PARTIAL: { label: 'Parcial', color: 'warning' },
  PAID: { label: 'Pagada', color: 'success' },
  OVERDUE: { label: 'Vencida', color: 'error' },
};

const AGING_BUCKETS: { key: string; label: string; color: string }[] = [
  { key: 'current', label: 'Al Día', color: '#10b981' },
  { key: '1_30', label: '1 - 30 Días', color: '#f59e0b' },
  { key: '31_60', label: '31 - 60 Días', color: '#f97316' },
  { key: '61_90', label: '61 - 90 Días', color: '#ef4444' },
  { key: 'over_90', label: '+90 Días', color: '#991b1b' },
];

export default function TreasuryDebtManager({ mode }: TreasuryDebtManagerProps) {
  const isAR = mode === 'ar';
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedAgingBucket, setSelectedAgingBucket] = useState<string>('ALL');

  const [openPayment, setOpenPayment] = useState(false);
  const [openHistory, setOpenHistory] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<any>(null);

  const [paymentData, setPaymentData] = useState({
    amount: 0,
    payment_method: 'cash',
    bank_account_id: '' as string | number,
    currency: 'USD',
    exchange_rate: 1,
    reference: '',
    notes: '',
  });

  const [manualData, setManualData] = useState({
    counterpart_id: '' as string | number,
    total_amount: '',
    due_date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    currency: 'USD',
    notes: '',
  });

  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const showToast = (message: string, severity: 'success' | 'error' = 'success') => {
    setToast({ open: true, message, severity });
  };

  // Queries
  const { data: debts = [], isLoading } = useQuery({
    queryKey: [mode],
    queryFn: async () => (await api.get(`/treasury/${mode}?limit=500`)).data,
  });

  const { data: agingReport } = useQuery({
    queryKey: [`${mode}-aging`],
    queryFn: async () => (await api.get(`/treasury/${mode}/aging-report`)).data,
  });

  const { data: bankAccounts = [] } = useQuery({
    queryKey: ['bank-accounts'],
    queryFn: async () => (await api.get('/treasury/bank-accounts')).data,
  });

  const { data: counterparts = [] } = useQuery({
    queryKey: [isAR ? 'customers' : 'suppliers'],
    queryFn: async () => (await api.get(isAR ? '/sales/customers' : '/suppliers/')).data,
  });

  const { data: tenantInfo } = useQuery({
    queryKey: ['tenant-me'],
    queryFn: async () => (await api.get('/tenants/me')).data,
  });

  const defaultRate = Number(tenantInfo?.bcv_rate || tenantInfo?.exchange_rate || 1);

  const getCounterpartName = (debt: any) =>
    (isAR ? debt.customer?.name : debt.supplier?.name) || 'Sin especificar';

  const getDaysOverdue = (debt: any) => {
    if (debt.status === 'PAID') return 0;
    const due = new Date(debt.due_date).getTime();
    const diff = Math.floor((Date.now() - due) / 86400000);
    return diff > 0 ? diff : 0;
  };

  // Print receipt helper
  const printPaymentReceipt = (debt: any, payment: any) => {
    const companyName = tenantInfo?.name || 'APEX ERP';
    const companyRif = tenantInfo?.tax_id ? `RIF: ${tenantInfo.tax_id}` : '';
    const counterpart = getCounterpartName(debt);
    const docNum = isAR
      ? debt.sale_id
        ? `Venta #${debt.sale_id}`
        : `CxC #${debt.id}`
      : debt.purchase_id
      ? `Compra #${debt.purchase_id}`
      : `CxP #${debt.id}`;

    const win = window.open('', '_blank', 'width=760,height=650');
    if (!win) return;

    const methodText = PAYMENT_METHOD_LABELS[payment.payment_method] || payment.payment_method || 'Efectivo';
    const payDate = payment.payment_date
      ? new Date(payment.payment_date).toLocaleString()
      : new Date().toLocaleString();

    win.document.write(`
      <html>
        <head>
          <title>Comprobante de ${isAR ? 'Cobro' : 'Pago'}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 28px; color: #0f172a; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #1e293b; padding-bottom: 12px; margin-bottom: 20px; }
            .title { font-size: 20px; font-weight: 800; color: #1e40af; }
            .box { border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
            .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #e2e8f0; font-size: 14px; }
            .row:last-child { border-bottom: none; }
            .total { font-size: 18px; font-weight: 800; color: #0f172a; }
            .footer { margin-top: 40px; display: flex; justify-content: space-between; font-size: 12px; color: #64748b; }
            .sig { border-top: 1px solid #64748b; width: 220px; text-align: center; padding-top: 6px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">${companyName}</div>
              <div>${companyRif}</div>
            </div>
            <div style="text-align:right">
              <strong>COMPROBANTE DE ${isAR ? 'COBRO (CxC)' : 'PAGO (CxP)'}</strong><br/>
              <span>Fecha: ${payDate}</span>
            </div>
          </div>
          <div class="box">
            <div class="row"><span>${isAR ? 'Cliente' : 'Proveedor'}:</span><strong>${counterpart}</strong></div>
            <div class="row"><span>Documento de Origen:</span><strong>${docNum}</strong></div>
            <div class="row"><span>Método de Pago:</span><strong>${methodText}</strong></div>
            <div class="row"><span>Referencia:</span><strong>${payment.reference || 'N/A'}</strong></div>
            <div class="row"><span>Moneda / Tasa:</span><strong>${payment.currency || 'USD'} (Tasa: ${Number(payment.exchange_rate || 1).toFixed(2)})</strong></div>
            ${payment.notes ? `<div class="row"><span>Notas:</span><span>${payment.notes}</span></div>` : ''}
          </div>
          <div class="box">
            <div class="row"><span>Monto Total del Documento:</span><span>$${Number(debt.total_amount).toFixed(2)}</span></div>
            <div class="row total"><span>Monto ${isAR ? 'Cobrado' : 'Pagado'} en este Recibo:</span><span>$${Number(payment.amount).toFixed(2)}</span></div>
            <div class="row"><span>Saldo Pendiente Actual:</span><strong>$${Number(debt.remaining_amount).toFixed(2)}</strong></div>
          </div>
          <div class="footer">
            <div class="sig">Elaborado / Recibido por</div>
            <div class="sig">Firma / Sello ${isAR ? 'Cliente' : 'Proveedor'}</div>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    win.document.close();
  };

  // Mutations
  const paymentMutation = useMutation({
    mutationFn: async (payload: any) => (await api.post('/treasury/payments', payload)).data,
    onSuccess: (createdPayment) => {
      queryClient.invalidateQueries({ queryKey: [mode] });
      queryClient.invalidateQueries({ queryKey: [`${mode}-aging`] });
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      showToast(isAR ? 'Cobro registrado exitosamente.' : 'Pago registrado exitosamente.');
      const updatedDebt = selectedDebt
        ? {
            ...selectedDebt,
            remaining_amount: Math.max(0, Number(selectedDebt.remaining_amount) - Number(createdPayment.amount)),
          }
        : null;
      setOpenPayment(false);
      if (updatedDebt && window.confirm('¿Deseas imprimir el comprobante de pago ahora?')) {
        printPaymentReceipt(updatedDebt, createdPayment);
      }
    },
    onError: (err: any) => {
      showToast(err?.response?.data?.detail || 'Error al registrar el pago.', 'error');
    },
  });

  const createManualMutation = useMutation({
    mutationFn: async (payload: any) => (await api.post(`/treasury/${mode}`, payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [mode] });
      queryClient.invalidateQueries({ queryKey: [`${mode}-aging`] });
      showToast(isAR ? 'Cuenta por cobrar creada correctamente.' : 'Cuenta por pagar creada correctamente.');
      setOpenCreate(false);
      setManualData({
        counterpart_id: '',
        total_amount: '',
        due_date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        currency: 'USD',
        notes: '',
      });
    },
    onError: (err: any) => {
      showToast(err?.response?.data?.detail || 'Error al crear la cuenta.', 'error');
    },
  });

  const handleOpenPayment = (debt: any) => {
    setSelectedDebt(debt);
    setPaymentData({
      amount: Number(Number(debt.remaining_amount).toFixed(2)),
      payment_method: 'cash',
      bank_account_id: '',
      currency: 'USD',
      exchange_rate: defaultRate > 0 ? defaultRate : 1,
      reference: '',
      notes: '',
    });
    setOpenPayment(true);
  };

  const handleSubmitPayment = () => {
    if (!selectedDebt) return;
    const payload: any = {
      amount: Number(paymentData.amount),
      payment_method: paymentData.payment_method,
      reference: paymentData.reference.trim() || undefined,
      currency: paymentData.currency,
      exchange_rate: Number(paymentData.exchange_rate) || 1,
      notes: paymentData.notes.trim() || undefined,
    };
    if (paymentData.bank_account_id) {
      payload.bank_account_id = Number(paymentData.bank_account_id);
    }
    if (isAR) payload.ar_id = selectedDebt.id;
    else payload.ap_id = selectedDebt.id;

    paymentMutation.mutate(payload);
  };

  const handleCreateManual = () => {
    const amountNum = Number(manualData.total_amount);
    if (!manualData.counterpart_id || amountNum <= 0 || !manualData.due_date) {
      showToast('Completa todos los campos obligatorios con un monto válido.', 'error');
      return;
    }
    const payload: any = {
      total_amount: amountNum,
      due_date: `${manualData.due_date}T23:59:59`,
      currency: manualData.currency,
      notes: manualData.notes.trim() || undefined,
    };
    if (isAR) payload.customer_id = Number(manualData.counterpart_id);
    else payload.supplier_id = Number(manualData.counterpart_id);

    createManualMutation.mutate(payload);
  };

  // Filtered debts
  const filteredDebts = useMemo(() => {
    return (debts as any[]).filter((d) => {
      const name = getCounterpartName(d).toLowerCase();
      const docRef = isAR ? `${d.sale_id || d.id}` : `${d.purchase_id || d.id}`;
      const q = search.trim().toLowerCase();
      if (q && !name.includes(q) && !docRef.includes(q) && !(d.notes || '').toLowerCase().includes(q)) {
        return false;
      }

      const overdueDays = getDaysOverdue(d);
      if (statusFilter === 'OVERDUE') {
        if (overdueDays <= 0 || d.status === 'PAID') return false;
      } else if (statusFilter !== 'ALL' && d.status !== statusFilter) {
        return false;
      }

      if (dateFrom) {
        if (new Date(d.due_date) < new Date(`${dateFrom}T00:00:00`)) return false;
      }
      if (dateTo) {
        if (new Date(d.due_date) > new Date(`${dateTo}T23:59:59`)) return false;
      }
      return true;
    });
  }, [debts, search, statusFilter, dateFrom, dateTo, isAR]);

  // KPIs
  const kpis = useMemo(() => {
    let openTotal = 0;
    let overdueTotal = 0;
    let overdueCount = 0;
    let upcomingTotal = 0;
    let paidTotal = 0;

    (debts as any[]).forEach((d) => {
      const total = Number(d.total_amount || 0);
      const rem = Number(d.remaining_amount || 0);
      paidTotal += Math.max(0, total - rem);
      if (d.status !== 'PAID' && rem > 0) {
        openTotal += rem;
        if (getDaysOverdue(d) > 0) {
          overdueTotal += rem;
          overdueCount += 1;
        } else {
          upcomingTotal += rem;
        }
      }
    });

    return { openTotal, overdueTotal, overdueCount, upcomingTotal, paidTotal };
  }, [debts]);

  // Grouped Statement by Counterpart
  const groupedStatements = useMemo(() => {
    const map = new Map<string, any>();
    (debts as any[]).forEach((d) => {
      const key = String(isAR ? d.customer_id : d.supplier_id);
      const name = getCounterpartName(d);
      if (!map.has(key)) {
        map.set(key, {
          id: key,
          name,
          totalDocs: 0,
          openDocs: 0,
          overdueDocs: 0,
          totalBilled: 0,
          totalPaid: 0,
          totalRemaining: 0,
        });
      }
      const entry = map.get(key);
      const total = Number(d.total_amount || 0);
      const rem = Number(d.remaining_amount || 0);
      entry.totalDocs += 1;
      entry.totalBilled += total;
      entry.totalRemaining += rem;
      entry.totalPaid += Math.max(0, total - rem);
      if (d.status !== 'PAID' && rem > 0) {
        entry.openDocs += 1;
        if (getDaysOverdue(d) > 0) entry.overdueDocs += 1;
      }
    });
    return Array.from(map.values()).sort((a, b) => b.totalRemaining - a.totalRemaining);
  }, [debts, isAR]);

  const handleExportExcel = () => {
    if (filteredDebts.length === 0) {
      showToast('No hay registros para exportar.', 'error');
      return;
    }
    const headers = [
      isAR ? 'Cliente' : 'Proveedor',
      isAR ? 'Venta #' : 'Compra #',
      'Total ($)',
      'Abonado ($)',
      'Saldo Pendiente ($)',
      'Vencimiento',
      'Días Mora',
      'Estado',
      'Notas',
    ];
    const rows = filteredDebts.map((d: any) => {
      const total = Number(d.total_amount || 0);
      const rem = Number(d.remaining_amount || 0);
      return [
        getCounterpartName(d),
        isAR ? (d.sale_id ? `#${d.sale_id}` : `Manual #${d.id}`) : d.purchase_id ? `#${d.purchase_id}` : `Manual #${d.id}`,
        Number(total.toFixed(2)),
        Number(Math.max(0, total - rem).toFixed(2)),
        Number(rem.toFixed(2)),
        new Date(d.due_date).toLocaleDateString(),
        getDaysOverdue(d),
        STATUS_LABELS[d.status]?.label || d.status,
        d.notes || '',
      ];
    });
    downloadExcelFile(
      headers,
      rows,
      isAR ? 'cuentas_por_cobrar.xlsx' : 'cuentas_por_pagar.xlsx',
      isAR ? 'Cuentas por Cobrar' : 'Cuentas por Pagar'
    );
  };

  const agingRows = useMemo(() => {
    if (!agingReport?.buckets) return [];
    if (selectedAgingBucket === 'ALL') {
      return AGING_BUCKETS.flatMap((b) =>
        (agingReport.buckets[b.key] || []).map((r: any) => ({ ...r, bucketLabel: b.label, bucketColor: b.color }))
      );
    }
    const bMeta = AGING_BUCKETS.find((b) => b.key === selectedAgingBucket);
    return (agingReport.buckets[selectedAgingBucket] || []).map((r: any) => ({
      ...r,
      bucketLabel: bMeta?.label || '',
      bucketColor: bMeta?.color || '#64748b',
    }));
  }, [agingReport, selectedAgingBucket]);

  const maxPayable = Number(selectedDebt?.remaining_amount || 0);
  const invalidPayAmount = paymentData.amount <= 0 || paymentData.amount > maxPayable + 0.01 || Number.isNaN(paymentData.amount);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>
            {isAR ? 'Cuentas por Cobrar (Clientes)' : 'Cuentas por Pagar (Proveedores)'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isAR
              ? 'Control de cartera, cobros parciales, vencimientos y antigüedad de saldos'
              : 'Control de obligaciones con proveedores, egresos, vencimientos y antigüedad'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExportExcel}
            sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 700 }}
          >
            Exportar Excel
          </Button>
          <Button
            variant="contained"
            color={isAR ? 'primary' : 'warning'}
            startIcon={<AddIcon />}
            onClick={() => setOpenCreate(true)}
            sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 700 }}
          >
            {isAR ? 'Nueva CxC Manual' : 'Nueva CxP Manual'}
          </Button>
        </Box>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }} elevation={0}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                  {isAR ? 'TOTAL POR COBRAR' : 'TOTAL POR PAGAR'}
                </Typography>
                <WalletIcon color={isAR ? 'primary' : 'warning'} fontSize="small" />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 900 }}>
                ${kpis.openTotal.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'error.light', bgcolor: 'rgba(239,68,68,0.04)' }} elevation={0}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" color="error.main" sx={{ fontWeight: 700 }}>
                  SALDO VENCIDO ({kpis.overdueCount})
                </Typography>
                <WarningIcon color="error" fontSize="small" />
              </Box>
              <Typography variant="h5" color="error.main" sx={{ fontWeight: 900 }}>
                ${kpis.overdueTotal.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }} elevation={0}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                  VIGENTE / POR VENCER
                </Typography>
                <ScheduleIcon color="info" fontSize="small" />
              </Box>
              <Typography variant="h5" color="info.main" sx={{ fontWeight: 900 }}>
                ${kpis.upcomingTotal.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'success.light', bgcolor: 'rgba(16,185,129,0.04)' }} elevation={0}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" color="success.main" sx={{ fontWeight: 700 }}>
                  {isAR ? 'TOTAL COBRADO' : 'TOTAL PAGADO'}
                </Typography>
                <PaidIcon color="success" fontSize="small" />
              </Box>
              <Typography variant="h5" color="success.main" sx={{ fontWeight: 900 }}>
                ${kpis.paidTotal.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ borderRadius: 3, mb: 2.5 }} elevation={0} variant="outlined">
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ px: 2 }}>
          <Tab label="Documentos y Movimientos" sx={{ fontWeight: 700, textTransform: 'none' }} />
          <Tab label="Antigüedad de Saldos (Aging)" sx={{ fontWeight: 700, textTransform: 'none' }} />
          <Tab label={isAR ? 'Estado por Cliente' : 'Estado por Proveedor'} sx={{ fontWeight: 700, textTransform: 'none' }} />
        </Tabs>
      </Paper>

      {isLoading && <LinearProgress sx={{ mb: 2, borderRadius: 2 }} />}

      {/* TAB 0: Document List */}
      {activeTab === 0 && (
        <>
          <Paper sx={{ p: 2, borderRadius: 3, mb: 2.5 }} elevation={0} variant="outlined">
            <Grid container spacing={2} sx={{ alignItems: 'center' }}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder={isAR ? 'Buscar cliente, # venta o nota...' : 'Buscar proveedor, # compra o nota...'}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" color="action" />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4, md: 2.5 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Estado"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="ALL">Todos</MenuItem>
                  <MenuItem value="OPEN">Abierta</MenuItem>
                  <MenuItem value="PARTIAL">Parcial</MenuItem>
                  <MenuItem value="OVERDUE">Vencidas (En Mora)</MenuItem>
                  <MenuItem value="PAID">Pagada</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 6, sm: 4, md: 2.5 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Vencimiento Desde"
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 4, md: 2.5 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Vencimiento Hasta"
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </Grid>
            </Grid>
          </Paper>

          <TableContainer component={Paper} sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <Table>
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>{isAR ? 'Cliente' : 'Proveedor'}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{isAR ? 'Documento' : 'Compra'}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Abonado</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Saldo Pendiente</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Vencimiento</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredDebts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                      No se encontraron cuentas con los filtros seleccionados.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDebts.map((debt: any) => {
                    const total = Number(debt.total_amount || 0);
                    const rem = Number(debt.remaining_amount || 0);
                    const paid = Math.max(0, total - rem);
                    const overdueDays = getDaysOverdue(debt);
                    const statusInfo =
                      overdueDays > 0 && debt.status !== 'PAID'
                        ? { label: `Vencida (${overdueDays}d)`, color: 'error' as const }
                        : STATUS_LABELS[debt.status] || { label: debt.status, color: 'default' as const };

                    return (
                      <TableRow key={debt.id} hover>
                        <TableCell>
                          <Typography sx={{ fontWeight: 700 }}>{getCounterpartName(debt)}</Typography>
                          {debt.notes && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              {debt.notes}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {isAR
                            ? debt.sale_id
                              ? `Venta #${debt.sale_id}`
                              : `Manual #${debt.id}`
                            : debt.purchase_id
                            ? `Compra #${debt.purchase_id}`
                            : `Manual #${debt.id}`}
                        </TableCell>
                        <TableCell>${total.toFixed(2)}</TableCell>
                        <TableCell sx={{ color: 'success.main', fontWeight: 600 }}>${paid.toFixed(2)}</TableCell>
                        <TableCell sx={{ color: rem > 0 ? 'error.main' : 'text.secondary', fontWeight: 800 }}>
                          ${rem.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color={overdueDays > 0 ? 'error.main' : 'text.primary'} sx={{ fontWeight: overdueDays > 0 ? 700 : 400 }}>
                            {new Date(debt.due_date).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={statusInfo.label} color={statusInfo.color} size="small" sx={{ fontWeight: 700 }} />
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                            <Tooltip title="Ver historial de abonos / recibos">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedDebt(debt);
                                  setOpenHistory(true);
                                }}
                              >
                                <HistoryIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Button
                              variant="contained"
                              size="small"
                              color={isAR ? 'primary' : 'warning'}
                              startIcon={<PaymentIcon />}
                              onClick={() => handleOpenPayment(debt)}
                              disabled={debt.status === 'PAID'}
                              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                            >
                              {isAR ? 'Registrar Abono' : 'Pagar Factura'}
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* TAB 1: Aging Report */}
      {activeTab === 1 && (
        <Box>
          <Grid container spacing={2} sx={{ mb: 2.5 }}>
            {AGING_BUCKETS.map((b) => {
              const amount = Number(agingReport?.totals?.[b.key] || 0);
              const isSelected = selectedAgingBucket === b.key;
              return (
                <Grid key={b.key} size={{ xs: 6, sm: 4, md: 2.4 }}>
                  <Card
                    onClick={() => setSelectedAgingBucket(isSelected ? 'ALL' : b.key)}
                    sx={{
                      cursor: 'pointer',
                      borderRadius: 3,
                      border: '2px solid',
                      borderColor: isSelected ? b.color : 'divider',
                    }}
                    elevation={0}
                  >
                    <CardContent>
                      <Typography variant="caption" sx={{ color: b.color, fontWeight: 800 }}>
                        {b.label.toUpperCase()}
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 900 }}>
                        ${amount.toFixed(2)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          <TableContainer component={Paper} sx={{ borderRadius: 4 }}>
            <Table>
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>{isAR ? 'Cliente' : 'Proveedor'}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Tramo</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Total Original</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Saldo Pendiente</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Vencimiento</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Días Vencido</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {agingRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      No hay saldos pendientes en este tramo.
                    </TableCell>
                  </TableRow>
                ) : (
                  agingRows.map((row: any) => (
                    <TableRow key={`${row.bucketLabel}-${row.id}`} hover>
                      <TableCell sx={{ fontWeight: 700 }}>{isAR ? row.customer : row.supplier}</TableCell>
                      <TableCell>
                        <Chip
                          label={row.bucketLabel}
                          size="small"
                          sx={{ bgcolor: `${row.bucketColor}20`, color: row.bucketColor, fontWeight: 700 }}
                        />
                      </TableCell>
                      <TableCell>${Number(row.total).toFixed(2)}</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: 'error.main' }}>${Number(row.remaining).toFixed(2)}</TableCell>
                      <TableCell>{new Date(row.due_date).toLocaleDateString()}</TableCell>
                      <TableCell>{row.days_overdue} días</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* TAB 2: Grouped Statement */}
      {activeTab === 2 && (
        <TableContainer component={Paper} sx={{ borderRadius: 4 }}>
          <Table>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>{isAR ? 'Cliente' : 'Proveedor'}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Docs. Totales</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Docs. Abiertos</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>En Mora</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Total Facturado</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Total Abonado</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Saldo Pendiente</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {groupedStatements.map((st: any) => (
                <TableRow key={st.id} hover>
                  <TableCell sx={{ fontWeight: 700 }}>{st.name}</TableCell>
                  <TableCell>{st.totalDocs}</TableCell>
                  <TableCell>{st.openDocs}</TableCell>
                  <TableCell>
                    {st.overdueDocs > 0 ? (
                      <Chip label={`${st.overdueDocs} venc.`} color="error" size="small" />
                    ) : (
                      '0'
                    )}
                  </TableCell>
                  <TableCell>${st.totalBilled.toFixed(2)}</TableCell>
                  <TableCell sx={{ color: 'success.main', fontWeight: 600 }}>${st.totalPaid.toFixed(2)}</TableCell>
                  <TableCell sx={{ color: st.totalRemaining > 0 ? 'error.main' : 'success.main', fontWeight: 800 }}>
                    ${st.totalRemaining.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Payment Dialog */}
      <Dialog open={openPayment} onClose={() => setOpenPayment(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {isAR ? 'Registrar Cobro de Cliente' : 'Registrar Pago a Proveedor'}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5, bgcolor: 'action.hover' }}>
              <Typography variant="body2">
                {isAR ? 'Cliente' : 'Proveedor'}: <strong>{selectedDebt ? getCounterpartName(selectedDebt) : ''}</strong>
              </Typography>
              <Typography variant="body2">
                Saldo pendiente actual:{' '}
                <strong style={{ color: '#ef4444' }}>${maxPayable.toFixed(2)}</strong>
              </Typography>
            </Paper>

            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <TextField
                label="Monto a Abonar ($ USD)"
                type="number"
                fullWidth
                slotProps={{ htmlInput: { step: '0.01', min: '0.01', max: maxPayable } }}
                value={paymentData.amount}
                onChange={(e) => setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) || 0 })}
                error={invalidPayAmount}
                helperText={invalidPayAmount ? `Debe ser mayor a 0 y máximo $${maxPayable.toFixed(2)}` : ''}
              />
              <Button
                variant="outlined"
                onClick={() => setPaymentData({ ...paymentData, amount: Number(maxPayable.toFixed(2)) })}
                sx={{ whiteSpace: 'nowrap', height: 40, textTransform: 'none', fontWeight: 700 }}
              >
                Pagar Total
              </Button>
            </Box>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  label="Método de Pago"
                  fullWidth
                  value={paymentData.payment_method}
                  onChange={(e) => setPaymentData({ ...paymentData, payment_method: e.target.value })}
                >
                  {Object.entries(PAYMENT_METHOD_LABELS).map(([val, label]) => (
                    <MenuItem key={val} value={val}>
                      {label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  label="Cuenta Bancaria (Opcional)"
                  fullWidth
                  value={paymentData.bank_account_id}
                  onChange={(e) => setPaymentData({ ...paymentData, bank_account_id: e.target.value })}
                >
                  <MenuItem value="">Sin cuenta bancaria (Caja / General)</MenuItem>
                  {(bankAccounts as any[])
                    .filter((b) => b.is_active !== false)
                    .map((b) => (
                      <MenuItem key={b.id} value={b.id}>
                        {b.bank_name} ({b.currency}) - ***{String(b.account_number || '').slice(-4)}
                      </MenuItem>
                    ))}
                </TextField>
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <TextField
                  select
                  label="Moneda del Pago"
                  fullWidth
                  value={paymentData.currency}
                  onChange={(e) => setPaymentData({ ...paymentData, currency: e.target.value })}
                >
                  <MenuItem value="USD">Dólares (USD)</MenuItem>
                  <MenuItem value="VES">Bolívares (VES)</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  label="Tasa de Cambio (Bs/$)"
                  type="number"
                  fullWidth
                  slotProps={{ htmlInput: { step: '0.01', min: '0.01' } }}
                  value={paymentData.exchange_rate}
                  onChange={(e) => setPaymentData({ ...paymentData, exchange_rate: parseFloat(e.target.value) || 1 })}
                  helperText={
                    paymentData.currency === 'VES' && paymentData.amount > 0
                      ? `Equiv: Bs. ${(paymentData.amount * (paymentData.exchange_rate || 1)).toFixed(2)}`
                      : ''
                  }
                />
              </Grid>
            </Grid>

            <TextField
              label="Referencia / N° Comprobante"
              fullWidth
              value={paymentData.reference}
              onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })}
            />

            <TextField
              label="Notas / Observación"
              fullWidth
              multiline
              rows={2}
              value={paymentData.notes}
              onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenPayment(false)} disabled={paymentMutation.isPending}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color={isAR ? 'primary' : 'warning'}
            onClick={handleSubmitPayment}
            disabled={invalidPayAmount || paymentMutation.isPending}
          >
            {paymentMutation.isPending ? 'Procesando...' : isAR ? 'Confirmar Cobro' : 'Confirmar Pago'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={openHistory} onClose={() => setOpenHistory(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          Historial de Abonos — {selectedDebt ? getCounterpartName(selectedDebt) : ''}
        </DialogTitle>
        <DialogContent dividers>
          {!selectedDebt?.payments || selectedDebt.payments.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
              Aún no se han registrado abonos para este documento.
            </Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Fecha</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Método</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Referencia</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Moneda / Tasa</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Monto ($)</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Recibo</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedDebt.payments.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell>{new Date(p.payment_date).toLocaleString()}</TableCell>
                    <TableCell>{PAYMENT_METHOD_LABELS[p.payment_method] || p.payment_method}</TableCell>
                    <TableCell>{p.reference || '—'}</TableCell>
                    <TableCell>
                      {p.currency || 'USD'} ({Number(p.exchange_rate || 1).toFixed(2)})
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'success.main' }}>
                      ${Number(p.amount).toFixed(2)}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => printPaymentReceipt(selectedDebt, p)}>
                        <PrintIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenHistory(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Manual Create Dialog */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {isAR ? 'Registrar Cuenta por Cobrar Manual' : 'Registrar Cuenta por Pagar Manual'}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField
              select
              label={isAR ? 'Cliente *' : 'Proveedor *'}
              fullWidth
              value={manualData.counterpart_id}
              onChange={(e) => setManualData({ ...manualData, counterpart_id: e.target.value })}
            >
              {(counterparts as any[]).map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name} {c.tax_id ? `(${c.tax_id})` : ''}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Monto Total ($ USD) *"
              type="number"
              fullWidth
              slotProps={{ htmlInput: { step: '0.01', min: '0.01' } }}
              value={manualData.total_amount}
              onChange={(e) => setManualData({ ...manualData, total_amount: e.target.value })}
            />

            <TextField
              label="Fecha de Vencimiento *"
              type="date"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              value={manualData.due_date}
              onChange={(e) => setManualData({ ...manualData, due_date: e.target.value })}
            />

            <Divider />

            <TextField
              label="Concepto / Notas"
              fullWidth
              multiline
              rows={2}
              placeholder="Ej: Saldo inicial migrado o factura anterior..."
              value={manualData.notes}
              onChange={(e) => setManualData({ ...manualData, notes: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenCreate(false)} disabled={createManualMutation.isPending}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color={isAR ? 'primary' : 'warning'}
            onClick={handleCreateManual}
            disabled={createManualMutation.isPending}
          >
            {createManualMutation.isPending ? 'Guardando...' : 'Guardar Cuenta'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={4500}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={toast.severity} onClose={() => setToast({ ...toast, open: false })} variant="filled">
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

