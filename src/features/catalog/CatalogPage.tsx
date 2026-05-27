import { useState } from 'react';
import { 
  Box, Typography, Grid, Card, CardMedia, CardContent, CardActions, 
  Button, Chip, TextField, InputAdornment, Skeleton, Dialog, 
  DialogTitle, DialogContent, DialogActions, Snackbar, Alert, Divider, MenuItem
} from '@mui/material';
import { Search as SearchIcon, Add as AddIcon, Edit as EditIcon } from '@mui/icons-material';
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
  track_expiry: false
};

export default function CatalogPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Product Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [formData, setFormData] = useState(defaultFormData);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  // Notification Toast state
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'warning' });

  // 1. Fetch products from real backend
  const { data: products = [], isLoading } = useQuery({
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
      track_expiry: product.track_expiry || false
    });
    setSelectedProductId(product.id);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setFormData(defaultFormData);
    setSelectedProductId(null);
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

  const filteredProducts = products.filter((product: any) => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>Catálogo de Productos</Typography>
          <Typography variant="body2" color="text.secondary">Explora y gestiona tus listados de productos</Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            size="small"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }
            }}
            sx={{ width: 250, bgcolor: 'background.paper', borderRadius: 2 }}
          />
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={handleOpenCreate}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700 }}
          >
            Agregar Producto
          </Button>
        </Box>
      </Box>

      {isLoading ? (
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={i}>
              <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 2 }} />
              <Skeleton width="60%" sx={{ mt: 1 }} />
              <Skeleton width="40%" />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Grid container spacing={3}>
          {filteredProducts.map((product: any) => {
            const stockStatus = product.stock <= 0 ? 'Sin Stock' : (product.stock <= product.min_stock ? 'Stock Bajo' : 'En Stock');
            const chipColor = product.stock <= 0 ? 'error' : (product.stock <= product.min_stock ? 'warning' : 'success');

            return (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={product.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 3, transition: '0.3s', '&:hover': { boxShadow: 6, transform: 'translateY(-4px)' } }}>
                  <CardMedia
                    component="img"
                    height="160"
                    image={`https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=350&q=80`}
                    alt={product.name}
                    sx={{ objectFit: 'cover', bgcolor: 'grey.100' }}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography gutterBottom variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                        {product.name}
                      </Typography>
                      <Typography variant="subtitle1" color="primary.main" sx={{ fontWeight: 800 }}>
                        ${product.price.toFixed(2)}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                      SKU: {product.sku}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Chip 
                        label={stockStatus} 
                        color={chipColor} 
                        size="small" 
                        variant="outlined"
                        sx={{ fontWeight: 600, borderRadius: '6px' }}
                      />
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        Cant: {product.stock}
                      </Typography>
                    </Box>
                  </CardContent>
                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button 
                      size="small" 
                      variant="outlined" 
                      fullWidth 
                      onClick={() => handleOpenEdit(product)}
                      startIcon={<EditIcon fontSize="small" />}
                      sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
                    >
                      Editar Producto
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
          {filteredProducts.length === 0 && (
            <Grid size={12}>
              <Box sx={{ p: 10, textAlign: 'center', bgcolor: 'background.paper', borderRadius: 4, border: '1px dashed', borderColor: 'divider' }}>
                <Typography variant="h6" color="text.secondary">No se encontraron productos.</Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      )}

      {/* Product Form Dialog */}
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

      {/* Snackbar Notification */}
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
