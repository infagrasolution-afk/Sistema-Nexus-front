import { useState } from 'react';
import { 
  Box, Typography, Button, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, IconButton, Dialog, 
  DialogTitle, DialogContent, DialogActions, TextField, Grid,
  Snackbar, Alert, CircularProgress, Card, CardContent, Divider, MenuItem
} from '@mui/material';
import { 
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, 
  Refresh as RefreshIcon, Inventory as InventoryIcon, 
  Warning as WarningIcon, Error as ErrorIcon 
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axiosConfig';

const defaultFormData = {
  name: '',
  sku: '',
  description: '',
  price: 0,
  cost: 0,
  min_stock: 0,
  max_stock: 0,
  unit_of_measure: 'unit',
  track_batches: false,
  track_expiry: false,
  image_url: ''
};

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [formData, setFormData] = useState(defaultFormData);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  
  // Delete confirmation dialog
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<any>(null);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Notification Toast state
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'warning' });

  // 1. Fetch real products from the backend API
  const { data: products = [], isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await api.get('/inventory/products');
      return response.data;
    },
  });

  // 2. Create Product Mutation
  const createMutation = useMutation({
    mutationFn: async (newProduct: typeof defaultFormData) => {
      const response = await api.post('/inventory/products', newProduct);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      showToast('Producto agregado con éxito', 'success');
      handleCloseDialog();
    },
    onError: (error: any) => {
      const detail = error.response?.data?.detail || 'Error al crear el producto';
      showToast(typeof detail === 'string' ? detail : JSON.stringify(detail), 'error');
    }
  });

  // 3. Update Product Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: typeof defaultFormData }) => {
      const response = await api.put(`/inventory/products/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      showToast('Producto actualizado con éxito', 'success');
      handleCloseDialog();
    },
    onError: (error: any) => {
      const detail = error.response?.data?.detail || 'Error al actualizar el producto';
      showToast(typeof detail === 'string' ? detail : JSON.stringify(detail), 'error');
    }
  });

  // 4. Delete Product Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/inventory/products/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      showToast('Producto eliminado con éxito', 'success');
      setDeleteConfirmOpen(false);
      setProductToDelete(null);
    },
    onError: (error: any) => {
      const detail = error.response?.data?.detail || 'Error al eliminar el producto';
      showToast(typeof detail === 'string' ? detail : JSON.stringify(detail), 'error');
    }
  });

  const showToast = (message: string, severity: 'success' | 'error' | 'warning') => {
    setToast({ open: true, message, severity });
  };

  const handleOpenCreate = () => {
    setDialogMode('create');
    setFormData(defaultFormData);
    setSelectedProductId(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (product: any) => {
    setDialogMode('edit');
    setFormData({
      name: product.name || '',
      sku: product.sku || '',
      description: product.description || '',
      price: product.price || 0,
      cost: product.cost || 0,
      min_stock: product.min_stock || 0,
      max_stock: product.max_stock || 0,
      unit_of_measure: product.unit_of_measure || 'unit',
      track_batches: product.track_batches || false,
      track_expiry: product.track_expiry || false,
      image_url: product.image_url || ''
    });
    setSelectedProductId(product.id);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setFormData(defaultFormData);
    setSelectedProductId(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          image_url: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
              (name === 'price' || name === 'cost' || name === 'min_stock' || name === 'max_stock') ? Number(value) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.sku) {
      showToast('El nombre y el SKU son obligatorios', 'error');
      return;
    }
    
    if (dialogMode === 'create') {
      createMutation.mutate(formData);
    } else if (dialogMode === 'edit' && selectedProductId !== null) {
      updateMutation.mutate({ id: selectedProductId, data: formData });
    }
  };

  const handleDeleteClick = (product: any) => {
    setProductToDelete(product);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (productToDelete) {
      deleteMutation.mutate(productToDelete.id);
    }
  };

  // Filtering products locally
  const filteredProducts = products.filter((p: any) => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Statistics calculation
  const totalProducts = products.length;
  const lowStockProducts = products.filter((p: any) => p.stock > 0 && p.stock <= p.min_stock).length;
  const noStockProducts = products.filter((p: any) => p.stock <= 0).length;

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
      
      {/* 1. Header with Title & Action Button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-1px', color: 'text.primary' }}>
            Gestión de Inventario
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            Control en tiempo real de tus productos, niveles de stock y costos
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <IconButton onClick={() => refetch()} disabled={isLoading || isRefetching} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '12px' }}>
            {isLoading || isRefetching ? <CircularProgress size={20} /> : <RefreshIcon />}
          </IconButton>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={handleOpenCreate}
            sx={{ 
              borderRadius: '12px', 
              px: 3, 
              fontWeight: 700,
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
              textTransform: 'none'
            }}
          >
            Agregar Producto
          </Button>
        </Box>
      </Box>

      {/* 2. Premium Analytics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card elevation={0} sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: '20px !important' }}>
              <Box sx={{ p: 1.5, bgcolor: 'primary.50', color: 'primary.main', borderRadius: '12px' }}>
                <InventoryIcon />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>{totalProducts}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Total Productos</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card elevation={0} sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: '20px !important' }}>
              <Box sx={{ p: 1.5, bgcolor: 'warning.50', color: 'warning.main', borderRadius: '12px' }}>
                <WarningIcon />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: 'warning.dark' }}>{lowStockProducts}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Stock Bajo</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card elevation={0} sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: '20px !important' }}>
              <Box sx={{ p: 1.5, bgcolor: 'error.50', color: 'error.main', borderRadius: '12px' }}>
                <ErrorIcon />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: 'error.main' }}>{noStockProducts}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Sin Stock</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 3. Search and Actions bar */}
      <Paper elevation={0} sx={{ 
        p: 3, 
        width: '100%',
        borderRadius: '20px', 
        border: '1px solid', 
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}>
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Buscar por SKU o Nombre de Producto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ maxWidth: 400, bgcolor: 'grey.50', borderRadius: '10px', '& fieldset': { borderRadius: '10px' } }}
          />
        </Box>

        {/* 4. Products Table */}
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer sx={{ border: '1px solid', borderColor: 'grey.100', borderRadius: '12px', overflow: 'hidden' }}>
            <Table sx={{ minWidth: 650 }}>
              <TableHead sx={{ bgcolor: 'grey.50' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>SKU</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Nombre</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Costo</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Precio</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Utilidad Bruta</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Stock Actual</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>U.M.</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, pr: 3 }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredProducts.map((row: any) => {
                  const profit = row.price - row.cost;
                  const margin = row.price > 0 ? (profit / row.price) * 100 : 0;
                  
                  // Compute real status based on inventory stock summary
                  let stockStatus = 'En Stock';
                  let chipColor: 'success' | 'warning' | 'error' = 'success';
                  
                  if (row.stock <= 0) {
                    stockStatus = 'Sin Stock';
                    chipColor = 'error';
                  } else if (row.stock <= row.min_stock) {
                    stockStatus = 'Stock Bajo';
                    chipColor = 'warning';
                  }

                  return (
                    <TableRow key={row.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>{row.sku}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{row.name}</TableCell>
                      <TableCell sx={{ color: 'text.secondary' }}>${row.cost.toFixed(2)}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>${row.price.toFixed(2)}</TableCell>
                      <TableCell sx={{ color: profit >= 0 ? 'success.main' : 'error.main', fontWeight: 700 }}>
                        {profit >= 0 ? '+' : ''}${profit.toFixed(2)} <span style={{ fontSize: '0.75rem', opacity: 0.8, marginLeft: '4px' }}>({margin.toFixed(1)}%)</span>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>{row.stock}</TableCell>
                      <TableCell sx={{ color: 'text.secondary', textTransform: 'lowercase' }}>{row.unit_of_measure}</TableCell>
                      <TableCell>
                        <Chip 
                          label={stockStatus} 
                          color={chipColor} 
                          size="small" 
                          sx={{ fontWeight: 700, borderRadius: '6px' }}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ pr: 2 }}>
                        <IconButton 
                          size="small" 
                          color="primary" 
                          onClick={() => handleOpenEdit(row)} 
                          sx={{ bgcolor: 'primary.50', mr: 1, '&:hover': { bgcolor: 'primary.100' } }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="error" 
                          onClick={() => handleDeleteClick(row)}
                          sx={{ bgcolor: 'error.50', '&:hover': { bgcolor: 'error.100' } }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredProducts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                      <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
                        No se encontraron productos registrados.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* 5. Create / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth sx={{ '& .MuiDialog-paper': { borderRadius: '16px' } }}>
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>
            {dialogMode === 'create' ? 'Agregar Nuevo Producto' : 'Editar Producto'}
          </DialogTitle>
          <Divider />
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="SKU / Código Único"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  required
                  disabled={dialogMode === 'edit'}
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Nombre del Producto"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Descripción"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  variant="outlined"
                  size="small"
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Costo de Compra ($)"
                  name="cost"
                  type="number"
                  value={formData.cost}
                  onChange={handleChange}
                  slotProps={{ htmlInput: { step: '0.01', min: '0' } }}
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Precio de Venta ($)"
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  slotProps={{ htmlInput: { step: '0.01', min: '0' } }}
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Mínimo Stock"
                  name="min_stock"
                  type="number"
                  value={formData.min_stock}
                  onChange={handleChange}
                  slotProps={{ htmlInput: { min: '0' } }}
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Máximo Stock"
                  name="max_stock"
                  type="number"
                  value={formData.max_stock}
                  onChange={handleChange}
                  slotProps={{ htmlInput: { min: '0' } }}
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth
                  select
                  label="Unidad de Medida"
                  name="unit_of_measure"
                  value={formData.unit_of_measure}
                  onChange={handleChange}
                  variant="outlined"
                  size="small"
                  slotProps={{ select: { displayEmpty: true } }}
                >
                  <MenuItem value="unid">UND - Unidad</MenuItem>
                  <MenuItem value="kg">KG - Kilogramo</MenuItem>
                  <MenuItem value="gr">GR - Gramo</MenuItem>
                  <MenuItem value="lts">LTS - Litro</MenuItem>
                  <MenuItem value="ml">ML - Mililitro</MenuItem>
                  <MenuItem value="m">M - Metro</MenuItem>
                  <MenuItem value="cja">CJA - Caja</MenuItem>
                  <MenuItem value="paq">PAQ - Paquete</MenuItem>
                  <MenuItem value="sac">SAC - Saco</MenuItem>
                  <MenuItem value="doc">DOC - Docena</MenuItem>
                  <MenuItem value="gal">GAL - Galón</MenuItem>
                  <MenuItem value="blt">BLT - Bulto</MenuItem>
                </TextField>
              </Grid>
              <Grid size={12}>
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  sx={{ borderRadius: '8px', textTransform: 'none', height: '40px' }}
                >
                  {formData.image_url ? 'Cambiar Imagen del Producto' : 'Subir Imagen del Producto'}
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </Button>
                {formData.image_url && (
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                    <img 
                      src={formData.image_url} 
                      alt="Preview" 
                      style={{ maxWidth: '100%', maxHeight: '150px', borderRadius: '8px', objectFit: 'contain', border: '1px solid #ddd' }} 
                    />
                  </Box>
                )}
              </Grid>
            </Grid>
          </DialogContent>
          <Divider />
          <DialogActions sx={{ p: 2.5, gap: 1 }}>
            <Button onClick={handleCloseDialog} color="inherit" sx={{ fontWeight: 600, textTransform: 'none' }}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={createMutation.isPending || updateMutation.isPending}
              sx={{ fontWeight: 700, textTransform: 'none', px: 3, borderRadius: '8px' }}
            >
              {createMutation.isPending || updateMutation.isPending ? 'Guardando...' : 'Guardar Producto'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* 6. Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} sx={{ '& .MuiDialog-paper': { borderRadius: '12px' } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>¿Eliminar Producto?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            ¿Está seguro de que desea eliminar el producto <strong>{productToDelete?.name}</strong>? Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)} color="inherit" sx={{ fontWeight: 600, textTransform: 'none' }}>
            Cancelar
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained" 
            disabled={deleteMutation.isPending}
            sx={{ fontWeight: 700, textTransform: 'none' }}
          >
            {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 7. Snackbar Notification */}
      <Snackbar 
        open={toast.open} 
        autoHideDuration={4000} 
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
