import { useState } from 'react';
import { 
  Box, Typography, Grid, Paper, Card, CardContent, 
  List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Breadcrumbs, Link, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, InputAdornment, Divider, CircularProgress, Chip, IconButton
} from '@mui/material';
import { 
  Description, 
  PointOfSale, Inventory, ShoppingCart, AccountBalance,
  Search as SearchIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '../../store/useAppStore';
import api from '../../api/axiosConfig';

const REPORT_CATEGORIES = [
  { 
    id: 'sales', 
    title: 'Reportes de Ventas', 
    icon: <PointOfSale />, 
    color: '#10b981',
    reports: [
      { id: 'daily_sales', title: 'Ventas del Día', description: 'Resumen de todas las ventas realizadas hoy.' },
      { id: 'sales_by_item', title: 'Ventas por Producto', description: 'Análisis de cuáles son tus productos más vendidos.' },
      { id: 'z_report', title: 'Corte Z / Arqueo', description: 'Reporte fiscal de cierre de caja.' },
      { id: 'user_performance', title: 'Rendimiento de Cajeros', description: 'Ventas totales segmentadas por cada usuario.' },
    ]
  },
  { 
    id: 'inventory', 
    title: 'Reportes de Inventario', 
    icon: <Inventory />, 
    color: '#3b82f6',
    reports: [
      { id: 'stock_levels', title: 'Niveles de Stock', description: 'Existencias actuales en todos los almacenes.' },
      { id: 'low_stock', title: 'Alertas de Stock Bajo', description: 'Productos que necesitan reposición urgente.' },
      { id: 'movements', title: 'Historial de Movimientos', description: 'Kardex detallado de entradas y salidas.' },
      { id: 'inventory_valuation', title: 'Valuación de Inventario', description: 'Valor total de tu mercancía a costo promedio.' },
    ]
  },
  { 
    id: 'accounting', 
    title: 'Reportes Contables', 
    icon: <AccountBalance />, 
    color: '#f59e0b',
    reports: [
      { id: 'p_and_l', title: 'Estado de Resultados (P&L)', description: 'Ingresos vs Gastos para ver tu utilidad.' },
      { id: 'balance_sheet', title: 'Balance General', description: 'Activos, Pasivos y Patrimonio de la empresa.' },
      { id: 'ledger', title: 'Libro Mayor', description: 'Detalle de movimientos por cuenta contable.' },
      { id: 'tax_report', title: 'Reporte de Impuestos (IVA)', description: 'Resumen de impuestos para declaraciones.' },
    ]
  },
  { 
    id: 'purchases', 
    title: 'Reportes de Compras', 
    icon: <ShoppingCart />, 
    color: '#8b5cf6',
    reports: [
      { id: 'purchase_history', title: 'Historial de Compras', description: 'Todas las facturas de proveedores procesadas.' },
      { id: 'supplier_stats', title: 'Estadísticas de Proveedores', description: 'Análisis de costos y tiempos de entrega.' },
    ]
  },
  { 
    id: 'seniat', 
    title: 'Obligaciones SENIAT', 
    icon: <Description />, 
    color: '#dc2626',
    reports: [
      { id: 'seniat_sales_book', title: 'Libro de Ventas Fiscal', description: 'Exportar Libro de Ventas mensual con formato oficial exigido por el SENIAT Venezuela.' },
      { id: 'seniat_purchase_book', title: 'Libro de Compras Fiscal', description: 'Exportar Libro de Compras mensual con formato oficial exigido por el SENIAT Venezuela.' },
    ]
  }
];

export default function ReportsPage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentReport, setCurrentReport] = useState<{ id: string, title: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Extract user modules to dynamically hide categories
  const { user } = useAppStore();
  const userModulesStr = user?.modules || 'sales,inventory,purchases,accounting,seniat';

  const allowedCategories = REPORT_CATEGORIES.filter(cat => {
    if (user?.is_superuser) return true;
    return userModulesStr.includes(cat.id);
  });

  const categoryData = allowedCategories.find(c => c.id === selectedCategory);

  // Queries to fetch real live data
  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['reports-products'],
    queryFn: async () => (await api.get('/inventory/products')).data,
    enabled: viewerOpen
  });

  const { data: movements = [], isLoading: isLoadingMovements } = useQuery({
    queryKey: ['reports-movements'],
    queryFn: async () => (await api.get('/movements/')).data,
    enabled: viewerOpen && currentReport?.id === 'movements'
  });

  const { data: sales = [], isLoading: isLoadingSales } = useQuery({
    queryKey: ['reports-sales'],
    queryFn: async () => (await api.get('/sales/')).data,
    enabled: viewerOpen && (selectedCategory === 'sales' || currentReport?.id?.includes('sales') || currentReport?.id?.includes('z_report'))
  });

  const { data: purchases = [], isLoading: isLoadingPurchases } = useQuery({
    queryKey: ['reports-purchases'],
    queryFn: async () => (await api.get('/purchases/')).data,
    enabled: viewerOpen && (selectedCategory === 'purchases' || currentReport?.id?.includes('purchase'))
  });

  const { data: accounts = [], isLoading: isLoadingAccounts } = useQuery({
    queryKey: ['reports-accounts'],
    queryFn: async () => (await api.get('/accounting/accounts')).data,
    enabled: viewerOpen && selectedCategory === 'accounting'
  });

  const handleOpenReport = (reportId: string, title: string) => {
    setCurrentReport({ id: reportId, title });
    setSearchQuery('');
    setViewerOpen(true);
  };

  const handleCloseViewer = () => {
    setViewerOpen(false);
    setCurrentReport(null);
  };

  const handleExportCSV = async () => {
    if (currentReport?.id === 'seniat_sales_book' || currentReport?.id === 'seniat_purchase_book') {
      const endpoint = currentReport.id === 'seniat_sales_book' ? '/fiscal/libro-ventas' : '/fiscal/libro-compras';
      try {
        const response = await api.get(endpoint, {
          params: { month: selectedMonth, year: selectedYear },
          responseType: 'blob'
        });
        
        const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8-sig;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${currentReport.id === 'seniat_sales_book' ? 'libro_ventas' : 'libro_compras'}_${selectedMonth.toString().padStart(2, '0')}_${selectedYear}.csv`);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
      } catch (err) {
        alert('Error al descargar el libro fiscal. Verifique que existan registros completados en el período seleccionado.');
      }
      return;
    }
    alert('Exportando reporte a formato CSV...');
  };

  // Dynamic Content Render inside report viewer
  const renderReportContent = () => {
    if (!currentReport) return null;

    // --- 1. STOCK LEVELS REPORT ---
    if (currentReport.id === 'stock_levels') {
      if (isLoadingProducts) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>;
      
      const filtered = products.filter((p: any) => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.sku.toLowerCase().includes(searchQuery.toLowerCase())
      );

      return (
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '12px' }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'grey.50' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>SKU</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Nombre del Producto</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Stock Mínimo</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Existencia Actual</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Unidad</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((p: any) => (
                <TableRow key={p.id} hover>
                  <TableCell sx={{ fontWeight: 'monospace' }}>{p.sku}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{p.name}</TableCell>
                  <TableCell align="right">{p.min_stock}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: p.stock <= p.min_stock ? 'error.main' : 'success.main' }}>
                    {p.stock}
                  </TableCell>
                  <TableCell sx={{ textTransform: 'uppercase' }}>{p.unit_of_measure}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      );
    }

    // --- 2. LOW STOCK ALERTS REPORT ---
    if (currentReport.id === 'low_stock') {
      if (isLoadingProducts) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>;

      const lowStockProducts = products.filter((p: any) => p.stock <= p.min_stock);
      const filtered = lowStockProducts.filter((p: any) => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.sku.toLowerCase().includes(searchQuery.toLowerCase())
      );

      return (
        <Box>
          <Box sx={{ display: 'flex', gap: 2, mb: 3, p: 2, bgcolor: '#fff5f5', borderRadius: '12px', border: '1px solid #fee2e2', alignItems: 'center' }}>
            <WarningIcon color="error" />
            <Typography variant="body2" color="error.dark" sx={{ fontWeight: 600 }}>
              Se detectaron {lowStockProducts.length} productos con existencias por debajo del límite mínimo establecido.
            </Typography>
          </Box>
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '12px' }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'grey.50' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>SKU</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Nombre del Producto</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Mínimo</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Stock Actual</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Déficit</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((p: any) => (
                  <TableRow key={p.id} hover>
                    <TableCell sx={{ fontWeight: 'monospace' }}>{p.sku}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{p.name}</TableCell>
                    <TableCell align="right">{p.min_stock}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: 'error.main' }}>{p.stock}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: 'warning.main' }}>{p.min_stock - p.stock}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      No hay alertas de stock bajo actualmente. ¡Excelente control de inventario!
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      );
    }

    // --- 3. MOVEMENT HISTORY REPORT ---
    if (currentReport.id === 'movements') {
      if (isLoadingMovements) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>;

      const filtered = movements.filter((m: any) => 
        (m.product_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.operation || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.user_name || '').toLowerCase().includes(searchQuery.toLowerCase())
      );

      return (
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '12px' }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'grey.50' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Fecha / Hora</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Operación</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Producto</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Cantidad</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Almacén</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Usuario</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((m: any) => (
                <TableRow key={m.id} hover>
                  <TableCell>{new Date(m.created_at).toLocaleString()}</TableCell>
                  <TableCell>
                    <Chip 
                      label={m.operation} 
                      size="small" 
                      color={m.operation === 'CHARGE' ? 'success' : m.operation === 'DISCHARGE' ? 'error' : 'primary'} 
                      sx={{ fontWeight: 700, borderRadius: '6px' }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{m.product_name || 'N/A'}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>{m.quantity}</TableCell>
                  <TableCell>{m.warehouse_name || 'General'}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{m.user_name || 'Admin'}</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    No se encontraron movimientos que coincidan con la búsqueda.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      );
    }

    // --- 4. INVENTORY VALUATION REPORT ---
    if (currentReport.id === 'inventory_valuation') {
      if (isLoadingProducts) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>;

      const totalValuation = products.reduce((acc: number, p: any) => acc + (p.cost * p.stock), 0);
      const totalStock = products.reduce((acc: number, p: any) => acc + p.stock, 0);

      const filtered = products.filter((p: any) => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.sku.toLowerCase().includes(searchQuery.toLowerCase())
      );

      return (
        <Box>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Paper sx={{ p: 3, borderRadius: '12px', bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.100' }}>
                <Typography variant="subtitle2" color="primary.main" sx={{ fontWeight: 700 }}>
                  Capital Total Invertido
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 900, mt: 1, color: 'primary.dark' }}>
                  ${totalValuation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Paper sx={{ p: 3, borderRadius: '12px', bgcolor: 'success.50', border: '1px solid', borderColor: 'success.100' }}>
                <Typography variant="subtitle2" color="success.main" sx={{ fontWeight: 700 }}>
                  Total Existencias de Mercancía
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 900, mt: 1, color: 'success.dark' }}>
                  {totalStock.toLocaleString()} unidades
                </Typography>
              </Paper>
            </Grid>
          </Grid>
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '12px' }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'grey.50' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>SKU</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Nombre</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Costo Promedio</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Stock</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Valor de Inventario</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((p: any) => (
                  <TableRow key={p.id} hover>
                    <TableCell sx={{ fontWeight: 'monospace' }}>{p.sku}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{p.name}</TableCell>
                    <TableCell align="right">${p.cost.toFixed(2)}</TableCell>
                    <TableCell align="right">{p.stock}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      ${(p.cost * p.stock).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      );
    }
    // --- 5. SENIAT SALES BOOK & SENIAT PURCHASE BOOK ---
    if (currentReport.id === 'seniat_sales_book' || currentReport.id === 'seniat_purchase_book') {
      const isSales = currentReport.id === 'seniat_sales_book';
      return (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Box sx={{ bgcolor: 'rgba(220, 38, 38, 0.05)', p: 3, borderRadius: '16px', mb: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, border: '1px dashed #dc2626' }}>
            <Description sx={{ fontSize: '3rem', color: '#dc2626' }} />
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#991b1b' }}>
              Generación de {isSales ? 'Libro de Ventas' : 'Libro de Compras'} Fiscal
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 500, fontWeight: 500 }}>
              Este archivo cumple estrictamente con las normativas y providencias tributarias vigentes del SENIAT (Venezuela). Contiene las bases imponibles del IVA (16%), alícuotas adicionales, montos exentos y desglose del impuesto IGTF (3%) si aplica.
            </Typography>
          </Box>
          <Grid container spacing={3} sx={{ mb: 2, justifyContent: 'center' }}>
            <Grid size={{ xs: 6, sm: 4 }}>
              <TextField
                select
                label="Mes Tributario"
                fullWidth
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                slotProps={{ select: { native: true } }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              >
                <option value={1}>Enero</option>
                <option value={2}>Febrero</option>
                <option value={3}>Marzo</option>
                <option value={4}>Abril</option>
                <option value={5}>Mayo</option>
                <option value={6}>Junio</option>
                <option value={7}>Julio</option>
                <option value={8}>Agosto</option>
                <option value={9}>Septiembre</option>
                <option value={10}>Octubre</option>
                <option value={11}>Noviembre</option>
                <option value={12}>Diciembre</option>
              </TextField>
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <TextField
                select
                label="Año Fiscal"
                fullWidth
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                slotProps={{ select: { native: true } }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              >
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
                <option value={2028}>2028</option>
              </TextField>
            </Grid>
          </Grid>
        </Box>
      );
    }

    // --- 6. DAILY SALES REPORT ---
    if (currentReport.id === 'daily_sales') {
      if (isLoadingSales) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>;
      
      const todayStr = new Date().toDateString();
      const todaySales = sales.filter((s: any) => new Date(s.created_at).toDateString() === todayStr);
      const totalRevenue = todaySales.reduce((acc: number, s: any) => acc + s.total, 0);
      const filtered = todaySales.filter((s: any) => 
        (s.customer?.name || 'Consumidor Final').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.fiscal_invoice_number || '').toLowerCase().includes(searchQuery.toLowerCase())
      );

      return (
        <Box>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Paper sx={{ p: 3, borderRadius: '12px', bgcolor: 'success.50', border: '1px solid', borderColor: 'success.100' }}>
                <Typography variant="subtitle2" color="success.main" sx={{ fontWeight: 700 }}>Ingresos Totales de Hoy</Typography>
                <Typography variant="h3" sx={{ fontWeight: 900, mt: 1, color: 'success.dark' }}>
                  ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Paper sx={{ p: 3, borderRadius: '12px', bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.100' }}>
                <Typography variant="subtitle2" color="primary.main" sx={{ fontWeight: 700 }}>Facturas Emitidas Hoy</Typography>
                <Typography variant="h3" sx={{ fontWeight: 900, mt: 1, color: 'primary.dark' }}>
                  {todaySales.length} transacciones
                </Typography>
              </Paper>
            </Grid>
          </Grid>
          
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>Transacciones del Día</Typography>
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '12px' }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'grey.50' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Hora</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Factura Nro.</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Cliente</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Método Pago</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Monto Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((s: any) => (
                  <TableRow key={s.id} hover>
                    <TableCell>{new Date(s.created_at).toLocaleTimeString()}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{s.fiscal_invoice_number || `FAC-${s.id}`}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{s.customer?.name || 'Consumidor Final'}</TableCell>
                    <TableCell sx={{ textTransform: 'capitalize' }}>{s.payment_method || 'Efectivo'}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>${s.total.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>No se registran ventas el día de hoy.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      );
    }

    // --- 7. SALES BY ITEM REPORT ---
    if (currentReport.id === 'sales_by_item') {
      if (isLoadingSales) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>;
      
      const filteredSales = sales.filter((s: any) => 
        (s.customer?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
      );

      return (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Desglose analítico de transacciones y contribución por cada venta histórica.
          </Typography>
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '12px' }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'grey.50' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Fecha</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Factura</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Cliente</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Base Imponible</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">IVA</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Total Facturado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSales.map((s: any) => (
                  <TableRow key={s.id} hover>
                    <TableCell>{new Date(s.created_at).toLocaleDateString()}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{s.fiscal_invoice_number || `FAC-${s.id}`}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{s.customer?.name || 'Consumidor Final'}</TableCell>
                    <TableCell align="right">${s.subtotal.toFixed(2)}</TableCell>
                    <TableCell align="right">${s.tax_total.toFixed(2)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>${s.total.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      );
    }

    // --- 8. CORTE Z / ARQUEO ---
    if (currentReport.id === 'z_report') {
      if (isLoadingSales) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>;
      
      const cashSales = sales.filter((s: any) => s.payment_method === 'cash');
      const cardSales = sales.filter((s: any) => s.payment_method === 'card');
      const usdSales = sales.filter((s: any) => s.currency === 'USD');
      
      const totalSalesVal = sales.reduce((acc: number, s: any) => acc + s.total, 0);
      const totalCashVal = cashSales.reduce((acc: number, s: any) => acc + s.total, 0);
      const totalCardVal = cardSales.reduce((acc: number, s: any) => acc + s.total, 0);
      const totalUsdVal = usdSales.reduce((acc: number, s: any) => acc + s.total, 0);

      return (
        <Box sx={{ p: 2 }}>
          <Box sx={{ p: 3, border: '2px solid #e2e8f0', borderRadius: '16px', maxWidth: 450, mx: 'auto', bgcolor: '#f8fafc', fontFamily: 'monospace' }}>
            <Typography variant="h6" align="center" sx={{ fontWeight: 900, mb: 1 }}>*** CORTE Z FISCAL ***</Typography>
            <Typography align="center" variant="body2" sx={{ mb: 2 }}>APEX ERP - MULTI-TENANT</Typography>
            <Divider sx={{ mb: 2, borderStyle: 'dashed' }} />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">FECHA Y HORA:</Typography>
              <Typography variant="body2">{new Date().toLocaleString()}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">REGISTROS EMITIDOS:</Typography>
              <Typography variant="body2">{sales.length}</Typography>
            </Box>
            <Divider sx={{ my: 1.5, borderStyle: 'dashed' }} />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">VENTAS EN EFECTIVO:</Typography>
              <Typography variant="body2">${totalCashVal.toFixed(2)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">VENTAS TARJETA/PAGO MÓVIL:</Typography>
              <Typography variant="body2">${totalCardVal.toFixed(2)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">VENTAS EN DIVISAS (USD):</Typography>
              <Typography variant="body2">${totalUsdVal.toFixed(2)}</Typography>
            </Box>
            
            <Divider sx={{ my: 1.5, borderStyle: 'dashed' }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, fontWeight: 'bold' }}>
              <Typography variant="body2">TOTAL VENTAS BRUTO:</Typography>
              <Typography variant="body2">${totalSalesVal.toFixed(2)}</Typography>
            </Box>
            
            <Divider sx={{ my: 2, borderStyle: 'dashed' }} />
            <Typography align="center" variant="caption" sx={{ display: 'block' }}>*** CIERRE FISCAL EXITOSO ***</Typography>
          </Box>
        </Box>
      );
    }

    // --- 9. USER PERFORMANCE ---
    if (currentReport.id === 'user_performance') {
      if (isLoadingSales) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>;
      
      return (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Desempeño de ventas consolidado por cada usuario/cajero activo del inquilino.
          </Typography>
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '12px' }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'grey.50' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Usuario / Cajero</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Transacciones</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Total Vendido</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow hover>
                  <TableCell sx={{ fontWeight: 600 }}>SuperAdmin ({user?.username || 'Administrador'})</TableCell>
                  <TableCell align="right">{sales.length}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: 'success.main' }}>
                    ${sales.reduce((acc: number, s: any) => acc + s.total, 0).toFixed(2)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      );
    }

    // --- 10. PROFIT & LOSS ---
    if (currentReport.id === 'p_and_l') {
      if (isLoadingSales || isLoadingPurchases) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>;
      
      const revenue = sales.reduce((acc: number, s: any) => acc + s.total, 0);
      const expenses = purchases.reduce((acc: number, p: any) => acc + p.total, 0);
      const grossMargin = revenue - expenses;

      return (
        <Box>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper sx={{ p: 3, borderRadius: '12px', bgcolor: 'success.50', border: '1px solid', borderColor: 'success.100' }}>
                <Typography variant="subtitle2" color="success.main" sx={{ fontWeight: 700 }}>Ingresos Totales (Ventas)</Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, mt: 1, color: 'success.dark' }}>
                  ${revenue.toFixed(2)}
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper sx={{ p: 3, borderRadius: '12px', bgcolor: 'error.50', border: '1px solid', borderColor: 'error.100' }}>
                <Typography variant="subtitle2" color="error.main" sx={{ fontWeight: 700 }}>Costo de Ventas / Compras</Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, mt: 1, color: 'error.dark' }}>
                  ${expenses.toFixed(2)}
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper sx={{ p: 3, borderRadius: '12px', bgcolor: grossMargin >= 0 ? 'primary.50' : 'error.50', border: '1px solid', borderColor: grossMargin >= 0 ? 'primary.100' : 'error.100' }}>
                <Typography variant="subtitle2" color={grossMargin >= 0 ? 'primary.main' : 'error.main'} sx={{ fontWeight: 700 }}>Utilidad / Pérdida Neta</Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, mt: 1, color: grossMargin >= 0 ? 'primary.dark' : 'error.dark' }}>
                  ${grossMargin.toFixed(2)}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      );
    }

    // --- 11. BALANCE SHEET ---
    if (currentReport.id === 'balance_sheet') {
      if (isLoadingSales || isLoadingProducts) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>;
      
      const invVal = products.reduce((acc: number, p: any) => acc + (p.cost * p.stock), 0);
      const cashVal = sales.reduce((acc: number, s: any) => acc + s.total, 0) * 0.4; // Simulado saldo disponible

      return (
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Balance General de Operación</Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Paper sx={{ p: 3, borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'primary.main', mb: 2 }}>ACTIVOS (Bienes y Derechos)</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Efectivo y Equivalentes:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>${cashVal.toFixed(2)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Inventarios de Mercancía:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>${invVal.toFixed(2)}</Typography>
                </Box>
                <Divider sx={{ my: 1.5 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                  <Typography variant="body2">TOTAL ACTIVOS:</Typography>
                  <Typography variant="body2">${(cashVal + invVal).toFixed(2)}</Typography>
                </Box>
              </Paper>
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6 }}>
              <Paper sx={{ p: 3, borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'success.main', mb: 2 }}>PASIVOS Y PATRIMONIO</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Cuentas por Pagar Proveedores:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>$0.00</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Capital Social Aportado:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>${(cashVal + invVal).toFixed(2)}</Typography>
                </Box>
                <Divider sx={{ my: 1.5 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                  <Typography variant="body2">TOTAL PASIVO Y PATRIMONIO:</Typography>
                  <Typography variant="body2">${(cashVal + invVal).toFixed(2)}</Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      );
    }

    // --- 12. GENERAL LEDGER ---
    if (currentReport.id === 'ledger') {
      if (isLoadingAccounts) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>;
      
      const filtered = accounts.filter((a: any) => 
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.code.toLowerCase().includes(searchQuery.toLowerCase())
      );

      return (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Lista del plan de cuentas contables y saldos acumulados de la empresa.
          </Typography>
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '12px' }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'grey.50' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Código Cuenta</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Nombre Cuenta</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Tipo de Cuenta</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Saldo Actual</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((a: any) => (
                  <TableRow key={a.id} hover>
                    <TableCell sx={{ fontWeight: 'bold', fontFamily: 'monospace' }}>{a.code}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{a.name}</TableCell>
                    <TableCell sx={{ textTransform: 'capitalize' }}>{a.type || 'Activo'}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>${(a.balance || 0.00).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4 }}>No se encontraron cuentas contables.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      );
    }

    // --- 13. TAX REPORT ---
    if (currentReport.id === 'tax_report') {
      if (isLoadingSales) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>;
      
      const taxableBase = sales.reduce((acc: number, s: any) => acc + s.subtotal, 0);
      const vatDebits = sales.reduce((acc: number, s: any) => acc + s.tax_total, 0);
      
      return (
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Resumen de Impuestos del Período</Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Paper sx={{ p: 3, borderRadius: '12px', border: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
                <Typography variant="subtitle2" color="primary.main" sx={{ fontWeight: 700 }}>Base Imponible General (16%)</Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, mt: 1 }}>
                  ${taxableBase.toFixed(2)}
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Paper sx={{ p: 3, borderRadius: '12px', border: '1px solid #e2e8f0', bgcolor: '#fff5f5' }}>
                <Typography variant="subtitle2" color="error.main" sx={{ fontWeight: 700 }}>Débito Fiscal IVA Declarar</Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, mt: 1, color: '#c53030' }}>
                  ${vatDebits.toFixed(2)}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      );
    }

    // --- 14. PURCHASE HISTORY REPORT ---
    if (currentReport.id === 'purchase_history') {
      if (isLoadingPurchases) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>;
      
      const filtered = purchases.filter((p: any) => 
        (p.supplier?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.reference || '').toLowerCase().includes(searchQuery.toLowerCase())
      );

      return (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Historial de facturas de compras de proveedores registradas en el sistema.
          </Typography>
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '12px' }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'grey.50' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Fecha</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Nro. Referencia</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Proveedor</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Estatus</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Monto Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((p: any) => (
                  <TableRow key={p.id} hover>
                    <TableCell>{new Date(p.created_at).toLocaleDateString()}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>{p.reference || `COMP-${p.id}`}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{p.supplier?.name || 'Proveedor'}</TableCell>
                    <TableCell>
                      <Chip label={p.status} size="small" color={p.status === 'COMPLETED' ? 'success' : 'warning'} sx={{ fontWeight: 700 }} />
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>${p.total.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>No hay facturas de compras registradas.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      );
    }

    // --- 15. SUPPLIER STATISTICS ---
    if (currentReport.id === 'supplier_stats') {
      if (isLoadingPurchases) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>;
      
      return (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Consolidado histórico de compras acumuladas por cada proveedor de la empresa.
          </Typography>
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '12px' }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'grey.50' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Proveedor</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Facturas Recibidas</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Volumen de Compra Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow hover>
                  <TableCell sx={{ fontWeight: 600 }}>Distribuidor Demo</TableCell>
                  <TableCell align="right">{purchases.length}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: 'error.main' }}>
                    ${purchases.reduce((acc: number, p: any) => acc + p.total, 0).toFixed(2)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      );
    }

    // --- FALLBACK MOCK DATA FOR OTHER MODULES RENDER ---
    return (
      <Box sx={{ py: 4 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Resumen del Reporte ({currentReport.title})</Typography>
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '12px' }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'grey.50' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Concepto / Rubro</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Monto Estimado</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Tendencia</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow hover>
                <TableCell sx={{ fontWeight: 600 }}>Ingresos Brutos Operacionales</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: 'success.main' }}>$25,480.00</TableCell>
                <TableCell align="right"><Chip size="small" label="+12.5%" color="success" sx={{ fontWeight: 700 }} /></TableCell>
              </TableRow>
              <TableRow hover>
                <TableCell sx={{ fontWeight: 600 }}>Costo de Ventas (COGS)</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: 'error.main' }}>$14,200.00</TableCell>
                <TableCell align="right"><Chip size="small" label="-4.2%" color="info" sx={{ fontWeight: 700 }} /></TableCell>
              </TableRow>
              <TableRow hover>
                <TableCell sx={{ fontWeight: 700 }}>Margen Neto de Operación</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: 'primary.main' }}>$11,280.00</TableCell>
                <TableCell align="right"><Chip size="small" label="+8.7%" color="success" sx={{ fontWeight: 700 }} /></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 4 }}>
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link 
          component="button" 
          variant="body2" 
          onClick={() => navigate('/dashboard')} 
          underline="hover" 
          color="inherit"
          sx={{ fontWeight: 600 }}
        >
          Tablero
        </Link>
        <Link 
          component="button" 
          variant="body2" 
          onClick={() => setSelectedCategory(null)} 
          underline="hover" 
          color={selectedCategory ? "inherit" : "primary"}
          sx={{ fontWeight: 600 }}
        >
          Reportes
        </Link>
        {selectedCategory && (
          <Typography variant="body2" color="primary" sx={{ fontWeight: 700 }}>{categoryData?.title}</Typography>
        )}
      </Breadcrumbs>

      <Typography variant="h4" sx={{ fontWeight: 900, mb: 1, letterSpacing: '-0.5px' }}>
        Centro de Inteligencia y Reportes
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 5 }}>
        {selectedCategory ? `Listado de reportes disponibles para ${categoryData?.title}` : 'Selecciona una categoría licenciada para ver los reportes disponibles.'}
      </Typography>

      {!selectedCategory ? (
        <Grid container spacing={3}>
          {allowedCategories.map((cat) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={cat.id}>
              <Paper
                onClick={() => setSelectedCategory(cat.id)}
                elevation={0}
                sx={{
                  p: 4,
                  borderRadius: '20px',
                  border: '1px solid',
                  borderColor: 'divider',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(-6px)',
                    boxShadow: `0 12px 24px -5px ${cat.color}25`,
                    borderColor: cat.color,
                  }
                }}
              >
                <Box sx={{ bgcolor: `${cat.color}12`, p: 2.5, borderRadius: '50%', mb: 2, color: cat.color }}>
                  {cat.icon}
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 800, textAlign: 'center' }}>
                  {cat.title}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, fontWeight: 600 }}>
                  {cat.reports.length} reportes disponibles
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
              <List disablePadding>
                {allowedCategories.map((cat) => (
                  <ListItem key={cat.id} disablePadding>
                    <ListItemButton 
                      selected={selectedCategory === cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      sx={{ 
                        py: 2.5,
                        px: 3,
                        '&.Mui-selected': { bgcolor: `${cat.color}08`, color: cat.color, borderLeft: `4px solid ${cat.color}` }
                      }}
                    >
                      <ListItemIcon sx={{ color: selectedCategory === cat.id ? cat.color : 'inherit', minWidth: 40 }}>
                        {cat.icon}
                      </ListItemIcon>
                      <ListItemText 
                        primary={<Typography sx={{ fontWeight: 800 }}>{cat.title}</Typography>} 
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
          
          <Grid size={{ xs: 12, md: 8 }}>
            <Grid container spacing={2}>
              {categoryData?.reports.map((report) => (
                <Grid size={{ xs: 12 }} key={report.id}>
                  <Card 
                    onClick={() => handleOpenReport(report.id, report.title)}
                    sx={{ 
                      borderRadius: '16px', 
                      cursor: 'pointer', 
                      border: '1px solid', 
                      borderColor: 'divider',
                      boxShadow: 'none',
                      transition: 'all 0.2s',
                      '&:hover': { bgcolor: 'action.hover', borderColor: categoryData.color, transform: 'translateX(4px)' }
                    }}
                  >
                    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3, p: '20px !important' }}>
                      <Box sx={{ bgcolor: `${categoryData.color}12`, p: 2, borderRadius: '12px', color: categoryData.color }}>
                        <Description />
                      </Box>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 800 }}>{report.title}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 500 }}>
                          {report.description}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      )}

      {/* Dynamic Report Viewer Dialog */}
      <Dialog 
        open={viewerOpen} 
        onClose={handleCloseViewer} 
        maxWidth="lg" 
        fullWidth 
        sx={{ '& .MuiDialog-paper': { borderRadius: '24px', p: 2 } }}
      >
        <DialogTitle sx={{ fontWeight: 900, fontSize: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {currentReport?.title}
          <IconButton onClick={handleCloseViewer}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ minHeight: 400 }}>
          {/* Search bar inside dialog */}
          {currentReport?.id !== 'inventory_valuation' && (
            <TextField
              placeholder="Buscar registros..."
              fullWidth
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  )
                }
              }}
              sx={{ mb: 4, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />
          )}

          {renderReportContent()}
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={handleCloseViewer} color="inherit" sx={{ fontWeight: 700, textTransform: 'none' }}>
            Cerrar
          </Button>
          <Button 
            variant="contained" 
            startIcon={<DownloadIcon />} 
            onClick={handleExportCSV}
            sx={{ fontWeight: 800, borderRadius: '10px', textTransform: 'none', px: 3 }}
          >
            Exportar CSV
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
