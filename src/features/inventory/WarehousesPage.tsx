import { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Grid, Button, IconButton, TextField, 
  Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, 
  ListItemText, Divider, Tooltip, Chip, Alert, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Snackbar
} from '@mui/material';
import { 
  Warehouse as WarehouseIcon, 
  Add as AddIcon, 
  QrCode as QrIcon,
  Print as PrintIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  WarningAmber as WarningIcon,
  NotificationsActive as AlarmIcon,
  Inventory2 as InventoryIcon,
  ShoppingCartCheckout as RestockIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';

export default function WarehousesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [openWarehouse, setOpenWarehouse] = useState(false);
  const [openBin, setOpenBin] = useState(false);
  const [openLimitsDialog, setOpenLimitsDialog] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<any>(null);
  const [newWarehouse, setNewWarehouse] = useState({
    name: '',
    address: '',
    default_min_stock: 5,
  });
  const [newWarehouseProductLimits, setNewWarehouseProductLimits] = useState<Record<number, { min_stock: number; initial_stock: number }>>({});
  const [warehouseStockLimits, setWarehouseStockLimits] = useState<any[]>([]);
  const [limitsSearch, setLimitsSearch] = useState('');
  const [newBin, setNewBin] = useState({ code: '', zone: '', description: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'warning' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  
  const queryClient = useQueryClient();

  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => (await api.get('/inventory/warehouses')).data
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => (await api.get('/inventory/products')).data
  });

  const { data: stockAlerts = [] } = useQuery({
    queryKey: ['wms-alerts'],
    queryFn: async () => (await api.get('/inventory/alerts')).data,
    refetchInterval: 15000,
  });

  useEffect(() => {
    if (openWarehouse && products.length > 0) {
      const initialMap: Record<number, { min_stock: number; initial_stock: number }> = {};
      products.forEach((p: any) => {
        initialMap[p.id] = {
          min_stock: Number(p.min_stock || newWarehouse.default_min_stock || 5),
          initial_stock: 0,
        };
      });
      setNewWarehouseProductLimits(initialMap);
    }
  }, [openWarehouse, products]);

  const applyDefaultMinStockToAll = (val: number) => {
    setNewWarehouse((prev) => ({ ...prev, default_min_stock: val }));
    const updated: Record<number, { min_stock: number; initial_stock: number }> = {};
    products.forEach((p: any) => {
      updated[p.id] = {
        min_stock: val,
        initial_stock: newWarehouseProductLimits[p.id]?.initial_stock || 0,
      };
    });
    setNewWarehouseProductLimits(updated);
  };

  const createWarehouseMutation = useMutation({
    mutationFn: (data: any) => api.post('/inventory/warehouses', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      queryClient.invalidateQueries({ queryKey: ['wms-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setOpenWarehouse(false);
      setNewWarehouse({ name: '', address: '', default_min_stock: 5 });
      setToast({
        open: true,
        message: 'Almacén creado con configuración de stock mínimo y alarmas de reposición activas.',
        severity: 'success',
      });
    }
  });

  const handleCreateWarehouse = () => {
    const product_min_stocks = Object.entries(newWarehouseProductLimits).map(([pid, cfg]) => ({
      product_id: Number(pid),
      min_stock: Number(cfg.min_stock || 0),
      initial_stock: Number(cfg.initial_stock || 0),
    }));
    createWarehouseMutation.mutate({
      name: newWarehouse.name,
      address: newWarehouse.address,
      default_min_stock: Number(newWarehouse.default_min_stock || 0),
      product_min_stocks,
    });
  };

  const handleOpenLimitsDialog = async (wh: any) => {
    setSelectedWarehouse(wh);
    setLimitsSearch('');
    setOpenLimitsDialog(true);
    try {
      const res = await api.get(`/inventory/warehouses/${wh.id}/stock-limits`);
      setWarehouseStockLimits(res.data || []);
    } catch {
      setWarehouseStockLimits([]);
    }
  };

  const saveStockLimitsMutation = useMutation({
    mutationFn: async ({ warehouseId, items }: { warehouseId: number; items: any[] }) => {
      return (await api.post(`/inventory/warehouses/${warehouseId}/stock-limits`, items)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setOpenLimitsDialog(false);
      setToast({
        open: true,
        message: 'Stock mínimo por producto actualizado. Las alarmas de reposición han sido recalibradas.',
        severity: 'success',
      });
    },
  });

  const createBinMutation = useMutation({
    mutationFn: (data: any) => api.post('/inventory/bins', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      setOpenBin(false);
      setNewBin({ code: '', zone: '', description: '' });
    }
  });

  const handlePrintLabel = (bin: any) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Label ${bin.code}</title>
            <style>
              body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
              .label { border: 2px solid black; padding: 40px; text-align: center; border-radius: 10px; }
              .code { font-size: 48px; font-weight: bold; margin-top: 20px; }
              .zone { font-size: 24px; color: #666; }
            </style>
          </head>
          <body>
            <div class="label">
              <div id="qr-container"></div>
              <div class="code">${bin.code}</div>
              <div class="zone">${bin.zone || 'General Zone'}</div>
            </div>
            <script>
              window.onload = () => { window.print(); };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const filteredWarehouses = warehouses.filter((wh: any) => {
    const query = searchQuery.toLowerCase();
    const nameMatch = wh.name?.toLowerCase().includes(query);
    const addressMatch = wh.address?.toLowerCase().includes(query);
    const binMatch = wh.bins?.some((bin: any) => 
      bin.code?.toLowerCase().includes(query) || 
      bin.zone?.toLowerCase().includes(query)
    );
    return nameMatch || addressMatch || binMatch;
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>WMS - {t('Warehouses')} y Control de Stock Mínimo</Typography>
          <Typography variant="body2" color="text.secondary">
            Gestiona ubicaciones físicas, define el stock mínimo por producto en cada almacén y recibe alarmas de reposición
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={() => setOpenWarehouse(true)}
          sx={{ borderRadius: '12px', fontWeight: 700, px: 2.5, py: 1.2 }}
        >
          Nuevo Almacén (+ Stock Mínimo)
        </Button>
      </Box>

      {/* ALARMA GLOBAL DE PRODUCTOS PRÓXIMOS A AGOTARSE EN ALMACENES */}
      {stockAlerts.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            mb: 4,
            p: 2.5,
            borderRadius: 4,
            border: '2px solid',
            borderColor: 'error.main',
            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.12)' : '#fef2f2',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5, mb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <AlarmIcon color="error" sx={{ fontSize: 28 }} />
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 900, color: 'error.main', lineHeight: 1.2 }}>
                  🚨 ALARMA DE INVENTARIO: {stockAlerts.length} Producto(s) Próximo(s) a Agotarse — ¡Debes Reponer!
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Los siguientes productos han alcanzado o bajado de su Stock Mínimo configurado en almacén:
                </Typography>
              </Box>
            </Box>
            <Button
              size="small"
              variant="contained"
              color="error"
              startIcon={<RestockIcon />}
              onClick={() => navigate('/purchases')}
              sx={{ borderRadius: '10px', fontWeight: 800, textTransform: 'none' }}
            >
              Ir a Compras para Reponer
            </Button>
          </Box>

          <Grid container spacing={1.5}>
            {stockAlerts.map((al: any, idx: number) => (
              <Grid size={{ xs: 12, md: 6 }} key={idx}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2.5,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: al.status === 'AGOTADO' ? 'error.main' : 'warning.main',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 1.5,
                  }}
                >
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>
                      {al.name} <Typography component="span" variant="caption" color="text.secondary">({al.sku})</Typography>
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', color: 'error.main', fontWeight: 700 }}>
                      ⚠️ El producto está próximo a agotarse en «{al.warehouse_name || 'Almacén'}» — ¡Debes reponer!
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Disponible: <strong>{al.current_stock}</strong> | Stock Mínimo: <strong>{al.min_stock}</strong>
                    </Typography>
                  </Box>
                  <Chip
                    size="small"
                    color={al.status === 'AGOTADO' ? 'error' : 'warning'}
                    label={al.status === 'AGOTADO' ? 'AGOTADO — REPONER' : 'POR AGOTARSE — REPONER'}
                    sx={{ fontWeight: 900, fontSize: '0.68rem' }}
                  />
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Smart search input */}
      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Buscar almacén, dirección, zona o código de ubicación (bin)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <SearchIcon color="action" sx={{ mr: 1 }} />
              )
            }
          }}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px', bgcolor: 'background.paper' } }}
        />
      </Box>

      <Grid container spacing={3}>
        {filteredWarehouses.map((wh: any) => {
          const whAlerts = stockAlerts.filter((a: any) => a.warehouse_id === wh.id);
          return (
            <Grid size={{ xs: 12, md: 6 }} key={wh.id}>
              <Paper sx={{ p: 3, borderRadius: 4, height: '100%', border: '1px solid', borderColor: whAlerts.length > 0 ? 'error.main' : 'divider' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', borderRadius: 2, color: '#fff' }}>
                      <WarehouseIcon />
                    </Avatar>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>{wh.name}</Typography>
                        {whAlerts.length > 0 && (
                          <Chip
                            size="small"
                            color="error"
                            icon={<WarningIcon />}
                            label={`${whAlerts.length} por agotarse — ¡Reponer!`}
                            sx={{ fontWeight: 800, fontSize: '0.7rem' }}
                          />
                        )}
                      </Box>
                      <Typography variant="caption" color="text.secondary">{wh.address || t('No address set')}</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                      size="small"
                      variant="outlined"
                      color="warning"
                      startIcon={<InventoryIcon />}
                      onClick={() => handleOpenLimitsDialog(wh)}
                      sx={{ borderRadius: '10px', fontWeight: 700, textTransform: 'none' }}
                    >
                      Stock Mínimo por Producto
                    </Button>
                    <Button 
                      size="small" 
                      variant="contained"
                      startIcon={<AddIcon />} 
                      onClick={() => { setSelectedWarehouse(wh); setOpenBin(true); }}
                      sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700 }}
                    >
                      {t('Add Bin')}
                    </Button>
                  </Box>
                </Box>

                {whAlerts.length > 0 && (
                  <Alert severity="error" sx={{ mb: 2, borderRadius: 2.5, py: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800 }}>
                      ⚠️ Atención en {wh.name}: {whAlerts.map((a: any) => `${a.name} (Quedan ${a.current_stock}/${a.min_stock})`).join(', ')} — ¡Próximo a agotarse, debes reponer!
                    </Typography>
                  </Alert>
                )}

                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary', fontWeight: 600 }}>
                  {t('Bin Locations')} ({wh.bins?.filter((bin: any) => {
                    const query = searchQuery.toLowerCase();
                    return !query || 
                      wh.name?.toLowerCase().includes(query) ||
                      wh.address?.toLowerCase().includes(query) ||
                      bin.code?.toLowerCase().includes(query) || 
                      bin.zone?.toLowerCase().includes(query);
                  }).length || 0})
                </Typography>
                
                <List dense>
                  {wh.bins?.filter((bin: any) => {
                    const query = searchQuery.toLowerCase();
                    return !query || 
                      wh.name?.toLowerCase().includes(query) ||
                      wh.address?.toLowerCase().includes(query) ||
                      bin.code?.toLowerCase().includes(query) || 
                      bin.zone?.toLowerCase().includes(query);
                  }).map((bin: any) => (
                    <ListItem 
                      key={bin.id} 
                      sx={{ bgcolor: 'action.hover', mb: 1, borderRadius: 2 }}
                      secondaryAction={
                        <Box>
                          <Tooltip title={t('Print QR Label')}>
                            <IconButton size="small" onClick={() => handlePrintLabel(bin)}>
                              <PrintIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <IconButton size="small" color="error">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      }
                    >
                      <ListItemIcon>
                        <QrIcon color="action" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={<Typography sx={{ fontWeight: 600 }}>{bin.code}</Typography>} 
                        secondary={bin.zone ? `${t('Zone')}: ${bin.zone}` : t('General Zone')} 
                      />
                    </ListItem>
                  ))}
                  {(!wh.bins || wh.bins.length === 0) && (
                    <Typography variant="body2" sx={{ py: 2, textAlign: 'center', color: 'text.disabled', fontStyle: 'italic' }}>
                      No hay ubicaciones (bins) definidas para este almacén.
                    </Typography>
                  )}
                </List>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {/* Dialog: New Warehouse + Per-Product Minimum Stock */}
      <Dialog open={openWarehouse} onClose={() => setOpenWarehouse(false)} maxWidth="md" fullWidth slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>
          Crear Nuevo Almacén y Configurar Stock Mínimo por Producto
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 0.5 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 5 }}>
                <TextField
                  label="Nombre del Almacén *"
                  placeholder="Ej: Almacén Central Caracas"
                  fullWidth
                  value={newWarehouse.name}
                  onChange={(e) => setNewWarehouse({ ...newWarehouse, name: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Dirección Física"
                  placeholder="Zona Industrial / Sucursal"
                  fullWidth
                  value={newWarehouse.address}
                  onChange={(e) => setNewWarehouse({ ...newWarehouse, address: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  label="Stock Mínimo Base"
                  type="number"
                  fullWidth
                  value={newWarehouse.default_min_stock}
                  onChange={(e) => applyDefaultMinStockToAll(Number(e.target.value || 0))}
                  helperText="Aplica a todos o edita abajo por producto"
                />
              </Grid>
            </Grid>

            <Alert severity="info" sx={{ borderRadius: 2.5 }}>
              Define el <strong>Stock Mínimo (Alarma)</strong> de cada producto para este almacén. Cuando la existencia sea igual o menor a ese número, el sistema arrojará automáticamente la alarma: <strong>«⚠️ El producto está próximo a agotarse — ¡Debes reponer!»</strong>.
            </Alert>

            {products.length > 0 ? (
              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 320, borderRadius: 3 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800 }}>SKU</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Producto</TableCell>
                      <TableCell sx={{ fontWeight: 800 }} align="center">Stock Mínimo (Alarma Reponer)</TableCell>
                      <TableCell sx={{ fontWeight: 800 }} align="center">Stock Inicial en Almacén (Opcional)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {products.map((prod: any) => {
                      const rowCfg = newWarehouseProductLimits[prod.id] || { min_stock: newWarehouse.default_min_stock, initial_stock: 0 };
                      return (
                        <TableRow key={prod.id} hover>
                          <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{prod.sku}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{prod.name}</TableCell>
                          <TableCell align="center">
                            <TextField
                              size="small"
                              type="number"
                              value={rowCfg.min_stock}
                              onChange={(e) =>
                                setNewWarehouseProductLimits((prev) => ({
                                  ...prev,
                                  [prod.id]: {
                                    ...rowCfg,
                                    min_stock: Math.max(0, Number(e.target.value || 0)),
                                  },
                                }))
                              }
                              sx={{ width: 120 }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <TextField
                              size="small"
                              type="number"
                              value={rowCfg.initial_stock}
                              onChange={(e) =>
                                setNewWarehouseProductLimits((prev) => ({
                                  ...prev,
                                  [prod.id]: {
                                    ...rowCfg,
                                    initial_stock: Math.max(0, Number(e.target.value || 0)),
                                  },
                                }))
                              }
                              sx={{ width: 120 }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                Aún no hay productos registrados. El Stock Mínimo Base ({newWarehouse.default_min_stock}) quedará guardado para futuros productos.
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenWarehouse(false)} color="inherit">{t('Cancel')}</Button>
          <Button
            variant="contained"
            disabled={!newWarehouse.name.trim() || createWarehouseMutation.isPending}
            onClick={handleCreateWarehouse}
            sx={{ borderRadius: '10px', fontWeight: 800, px: 3 }}
          >
            Crear Almacén y Activar Alarmas
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Configurar Stock Mínimo por Producto en un Almacén Existente */}
      <Dialog open={openLimitsDialog} onClose={() => setOpenLimitsDialog(false)} maxWidth="md" fullWidth slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>
          ⚠️ Stock Mínimo y Alarmas de Reposición — {selectedWarehouse?.name}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <TextField
              size="small"
              placeholder="Buscar producto o SKU..."
              value={limitsSearch}
              onChange={(e) => setLimitsSearch(e.target.value)}
              sx={{ minWidth: 280 }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              Si el Stock Actual es menor o igual al Stock Mínimo, el sistema activa la alarma «¡Próximo a agotarse, debes reponer!»
            </Typography>
          </Box>

          <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 380, borderRadius: 3 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>SKU</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Producto</TableCell>
                  <TableCell sx={{ fontWeight: 800 }} align="center">Existencia en este Almacén</TableCell>
                  <TableCell sx={{ fontWeight: 800 }} align="center">Stock Mínimo (Alarma)</TableCell>
                  <TableCell sx={{ fontWeight: 800 }} align="center">Estado / Alarma</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {warehouseStockLimits
                  .filter((item) =>
                    !limitsSearch ||
                    item.name?.toLowerCase().includes(limitsSearch.toLowerCase()) ||
                    item.sku?.toLowerCase().includes(limitsSearch.toLowerCase())
                  )
                  .map((item) => {
                    const isLow = item.min_stock > 0 && item.current_stock <= item.min_stock;
                    const isOut = item.min_stock > 0 && item.current_stock <= 0;
                    return (
                      <TableRow key={item.product_id} hover>
                        <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{item.sku}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{item.name}</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 800 }}>
                          {item.current_stock}
                        </TableCell>
                        <TableCell align="center">
                          <TextField
                            size="small"
                            type="number"
                            value={item.min_stock}
                            onChange={(e) => {
                              const val = Math.max(0, Number(e.target.value || 0));
                              setWarehouseStockLimits((prev) =>
                                prev.map((r) => (r.product_id === item.product_id ? { ...r, min_stock: val } : r))
                              );
                            }}
                            sx={{ width: 110 }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          {isOut ? (
                            <Chip size="small" color="error" label="🚨 AGOTADO — ¡DEBES REPONER!" sx={{ fontWeight: 800, fontSize: '0.68rem' }} />
                          ) : isLow ? (
                            <Chip size="small" color="warning" label="⚠️ PRÓXIMO A AGOTARSE — ¡REPONER!" sx={{ fontWeight: 800, fontSize: '0.68rem' }} />
                          ) : (
                            <Chip size="small" color="success" variant="outlined" label="✅ Stock Óptimo" sx={{ fontWeight: 700, fontSize: '0.68rem' }} />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenLimitsDialog(false)} color="inherit">Cancelar</Button>
          <Button
            variant="contained"
            disabled={saveStockLimitsMutation.isPending}
            onClick={() =>
              saveStockLimitsMutation.mutate({
                warehouseId: selectedWarehouse?.id,
                items: warehouseStockLimits.map((i) => ({
                  product_id: i.product_id,
                  min_stock: Number(i.min_stock || 0),
                })),
              })
            }
            sx={{ borderRadius: '10px', fontWeight: 800, px: 3 }}
          >
            Guardar Stock Mínimo en {selectedWarehouse?.name}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: New Bin */}
      <Dialog open={openBin} onClose={() => setOpenBin(false)} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{t('Add Bin')} - {selectedWarehouse?.name}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label={t('Bin Code')} fullWidth autoFocus value={newBin.code} onChange={(e) => setNewBin({...newBin, code: e.target.value.toUpperCase()})} />
            <TextField label={t('Zone')} fullWidth value={newBin.zone} onChange={(e) => setNewBin({...newBin, zone: e.target.value})} />
            <TextField label={t('Description')} fullWidth value={newBin.description} onChange={(e) => setNewBin({...newBin, description: e.target.value})} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenBin(false)} color="inherit">{t('Cancel')}</Button>
          <Button 
            variant="contained" 
            onClick={() => createBinMutation.mutate({ ...newBin, warehouse_id: selectedWarehouse?.id })}
          >
            {t('Add Bin')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={4500}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={toast.severity} variant="filled" sx={{ borderRadius: 2, fontWeight: 700 }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

// Helper components for consistency
const Avatar = ({ children, sx, ...props }: any) => (
  <Box 
    sx={{ 
      width: 40, height: 40, display: 'flex', alignItems: 'center', 
      justifyContent: 'center', borderRadius: 2, ...sx 
    }} 
    {...props}
  >
    {children}
  </Box>
);

const ListItemIcon = ({ children }: any) => (
  <Box sx={{ minWidth: 40, display: 'flex', alignItems: 'center' }}>
    {children}
  </Box>
);
