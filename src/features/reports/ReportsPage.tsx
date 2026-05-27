import { useState } from 'react';
import { 
  Box, Typography, Grid, Paper, Card, CardContent, 
  List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Breadcrumbs, Link
} from '@mui/material';
import { 
  Description, 
  PointOfSale, Inventory, ShoppingCart, AccountBalance 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

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

  const categoryData = REPORT_CATEGORIES.find(c => c.id === selectedCategory);

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link 
          component="button" 
          variant="body2" 
          onClick={() => navigate('/dashboard')} 
          underline="hover" 
          color="inherit"
        >
          Dashboard
        </Link>
        <Link 
          component="button" 
          variant="body2" 
          onClick={() => setSelectedCategory(null)} 
          underline="hover" 
          color={selectedCategory ? "inherit" : "primary"}
        >
          Reportes
        </Link>
        {selectedCategory && (
          <Typography variant="body2" color="primary">{categoryData?.title}</Typography>
        )}
      </Breadcrumbs>

      <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
        Centro de Reportes
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 5 }}>
        {selectedCategory ? `Listado de reportes disponibles para ${categoryData?.title}` : 'Selecciona una categoría para ver los reportes disponibles.'}
      </Typography>

      {!selectedCategory ? (
        <Grid container spacing={3}>
          {REPORT_CATEGORIES.map((cat) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={cat.id}>
              <Paper
                onClick={() => setSelectedCategory(cat.id)}
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 4,
                  border: '1px solid',
                  borderColor: 'divider',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-6px)',
                    boxShadow: `0 12px 20px -5px ${cat.color}33`,
                    borderColor: cat.color,
                  }
                }}
              >
                <Box sx={{ bgcolor: `${cat.color}15`, p: 2, borderRadius: '50%', mb: 2, color: cat.color }}>
                  {cat.icon}
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, textAlign: 'center' }}>
                  {cat.title}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                  {cat.reports.length} reportes disponibles
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
              <List disablePadding>
                {REPORT_CATEGORIES.map((cat) => (
                  <ListItem key={cat.id} disablePadding>
                    <ListItemButton 
                      selected={selectedCategory === cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      sx={{ 
                        py: 2,
                        '&.Mui-selected': { bgcolor: `${cat.color}10`, color: cat.color, borderLeft: `4px solid ${cat.color}` }
                      }}
                    >
                      <ListItemIcon sx={{ color: selectedCategory === cat.id ? cat.color : 'inherit' }}>
                        {cat.icon}
                      </ListItemIcon>
                      <ListItemText 
                        primary={<Typography sx={{ fontWeight: 700 }}>{cat.title}</Typography>} 
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
                    sx={{ 
                      borderRadius: 3, 
                      cursor: 'pointer', 
                      border: '1px solid', 
                      borderColor: 'divider',
                      boxShadow: 'none',
                      '&:hover': { bgcolor: 'action.hover', borderColor: categoryData.color }
                    }}
                  >
                    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Box sx={{ bgcolor: `${categoryData.color}15`, p: 1.5, borderRadius: 2, color: categoryData.color }}>
                        <Description />
                      </Box>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>{report.title}</Typography>
                        <Typography variant="body2" color="text.secondary">{report.description}</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
