import { useState } from 'react';
import { 
  Box, Typography, Grid, Paper, Card, CardContent, 
  List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Breadcrumbs, Link, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, InputAdornment, Divider, CircularProgress, Chip
} from '@mui/material';
import { 
  Description, 
  PointOfSale, Inventory, ShoppingCart, AccountBalance,
  Search as SearchIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
  TrendingUp as ProfitIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import useAppStore from '../../store/useAppStore';
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
  }
];

export default function ReportsPage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentReport, setCurrentReport] = useState<{ id: string, title: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Extract user modules to dynamically hide categories
  const { user } = useAppStore();
  const userModulesStr = user?.modules || 'sales,inventory,purchases,accounting';

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

  const handleOpenReport = (reportId: string, title: string) => {
    setCurrentReport({ id: reportId, title });
    setSearchQuery('');
    setViewerOpen(true);
  };

  const handleCloseViewer = () => {
    setViewerOpen(false);
    setCurrentReport(null);
  };

  const handleExportCSV = () => {
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
            <TableHead sx={{ bgcolor: 'grey.50' }}>
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
              <TableHead sx={{ bgcolor: 'grey.50' }}>
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
            <TableHead sx={{ bgcolor: 'grey.50' }}>
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
              <TableHead sx={{ bgcolor: 'grey.50' }}>
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

    // --- FALLBACK MOCK DATA FOR OTHER MODULES RENDER ---
    return (
      <Box sx={{ py: 4 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Resumen del Reporte ({currentReport.title})</Typography>
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '12px' }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: 'grey.50' }}>
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
