import { useState } from 'react';
import { 
  Box, Typography, Grid, Card, CardMedia, CardContent, CardActions, 
  Button, Chip, TextField, InputAdornment, Skeleton, Dialog, 
  DialogTitle, DialogContent, DialogActions, Snackbar, Alert, Divider, MenuItem
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Add as AddIcon, 
  Edit as EditIcon, 
  ViewModule as ViewModuleIcon,
  FileDownload as DownloadIcon,
  FileUpload as UploadIcon,
  Description as TemplateIcon,
  Calculate as RecalculateIcon
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
  unit_of_measure: 'unid',
  track_batches: false,
  track_expiry: false,
  image_url: ''
};

export default function CatalogPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Product Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [formData, setFormData] = useState(defaultFormData);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  // Recalculate Prices Dialog state
  const [recalcOpen, setRecalcOpen] = useState(false);
  const [marginPercent, setMarginPercent] = useState<number>(20);

  // Import Dialog state
  const [importOpen, setImportOpen] = useState(false);

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
      // Ensure image_url is null or valid string, not empty string
      const payload = {
        ...newProduct,
        image_url: newProduct.image_url.trim() === '' ? null : newProduct.image_url
      };
      const response = await api.post('/inventory/products', payload);
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
      const payload = {
        ...data,
        image_url: data.image_url.trim() === '' ? null : data.image_url
      };
      const response = await api.put(`/inventory/products/${id}`, payload);
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

  // 4. Recalculate Prices Mutation
  const recalculateMutation = useMutation({
    mutationFn: async (margin: number) => {
      const response = await api.post('/inventory/products/recalculate', { margin_percent: margin });
      return response.data;
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      showToast(`Precios actualizados para ${res.data.updated_count} productos.`, 'success');
      setRecalcOpen(false);
    },
    onError: (error: any) => {
      const detail = error.response?.data?.detail || 'Error al recalcular precios';
      showToast(typeof detail === 'string' ? detail : JSON.stringify(detail), 'error');
    }
  });

  // 5. Import Products Mutation
  const importMutation = useMutation({
    mutationFn: async (list: any[]) => {
      const response = await api.post('/inventory/products/import', list);
      return response.data;
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      showToast(`Importación exitosa. ${res.data.imported} productos procesados.`, 'success');
      setImportOpen(false);
    },
    onError: (error: any) => {
      const detail = error.response?.data?.detail || 'Error al importar catálogo';
      showToast(typeof detail === 'string' ? detail : JSON.stringify(detail), 'error');
    }
  });

  const [formMargin, setFormMargin] = useState<number>(30);

  const showToast = (message: string, severity: 'success' | 'error' | 'warning') => {
    setToast({ open: true, message, severity });
  };

  const handleOpenCreate = () => {
    setDialogMode('create');
    setFormMargin(30);
    setFormData(defaultFormData);
    setSelectedProductId(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (product: any) => {
    setDialogMode('edit');
    const cost = product.cost || 0;
    const price = product.price || 0;
    const margin = cost > 0 ? Math.round(((price / cost) - 1) * 100) : 30;
    setFormMargin(margin);
    setFormData({
      name: product.name || '',
      sku: product.sku || '',
      description: product.description || '',
      price: price,
      cost: cost,
      min_stock: product.min_stock || 0,
      max_stock: product.max_stock || 0,
      unit_of_measure: product.unit_of_measure || 'unid',
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
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: type === 'checkbox' ? checked : 
                (name === 'price' || name === 'cost' || name === 'min_stock' || name === 'max_stock') ? Number(value) : value
      };
      
      if (name === 'cost') {
        const costVal = Number(value);
        updated.price = Number((costVal * (1 + formMargin / 100)).toFixed(2));
      } else if (name === 'price') {
        const priceVal = Number(value);
        if (updated.cost > 0) {
          const calculatedMargin = Math.round(((priceVal / updated.cost) - 1) * 100);
          setFormMargin(calculatedMargin);
        }
      }
      return updated;
    });
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

  // CSV Export
  const handleExportCSV = () => {
    if (products.length === 0) {
      showToast('No hay datos para exportar.', 'error');
      return;
    }
    const headers = ['SKU', 'Nombre', 'Descripcion', 'Costo', 'Precio', 'Min Stock', 'Max Stock', 'Unidad de Medida'];
    const rows = filteredProducts.map((p: any) => [
      `"${p.sku.replace(/"/g, '""')}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${(p.description || '').replace(/"/g, '""')}"`,
      p.cost,
      p.price,
      p.min_stock,
      p.max_stock,
      `"${p.unit_of_measure}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' 
      + [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'catalogo_productos.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Template Download
  const handleDownloadTemplate = () => {
    const headers = ['sku', 'nombre', 'descripcion', 'costo', 'precio', 'stock_minimo', 'stock_maximo', 'unidad_medida'];
    const example = ['PROD-001', 'Galletas de Chocolate', 'Caja de galletas de choco 12 und', '2.50', '3.50', '10', '100', 'cja'];
    
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' 
      + [headers.join(','), example.join(',')].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'plantilla_productos.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Import Parse
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
        if (lines.length <= 1) {
          showToast('El archivo está vacío o solo contiene encabezados.', 'error');
          return;
        }

        const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        const parsedData = [];

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));
          if (values.length < headers.length) continue;

          const rowObj: any = {};
          headers.forEach((header, index) => {
            rowObj[header] = values[index] || '';
          });

          parsedData.push({
            sku: rowObj.sku || '',
            name: rowObj.name || rowObj['nombre'] || '',
            description: rowObj.description || rowObj['descripcion'] || rowObj['descripción'] || '',
            cost: Number(rowObj.cost || rowObj['costo'] || 0),
            price: Number(rowObj.price || rowObj['precio'] || rowObj['precio de venta'] || 0),
            min_stock: Number(rowObj.min_stock || rowObj['stock minimo'] || rowObj['stock mínimo'] || 0),
            max_stock: Number(rowObj.max_stock || rowObj['stock maximo'] || rowObj['stock máximo'] || 0),
            unit_of_measure: rowObj.unit_of_measure || rowObj['unidad'] || 'unid',
            track_batches: false,
            track_expiry: false,
            image_url: null
          });
        }

        if (parsedData.length === 0) {
          showToast('No se pudieron procesar filas válidas.', 'error');
          return;
        }

        importMutation.mutate(parsedData);
      } catch (err) {
        showToast('Error al procesar el archivo CSV.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
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
        
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center', width: { xs: '100%', md: 'auto' } }}>
          <TextField
            size="small"
            placeholder="Buscar..."
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
            sx={{ width: { xs: '100%', sm: 200 }, bgcolor: 'background.paper', borderRadius: 2 }}
          />

          <Button 
            variant="outlined" 
            startIcon={<TemplateIcon />} 
            onClick={handleDownloadTemplate}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, height: '40px' }}
          >
            Plantilla CSV
          </Button>

          <Button 
            variant="outlined" 
            startIcon={<UploadIcon />} 
            onClick={() => setImportOpen(true)}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, height: '40px' }}
          >
            Importar
          </Button>

          <Button 
            variant="outlined" 
            startIcon={<DownloadIcon />} 
            onClick={handleExportCSV}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, height: '40px' }}
          >
            Exportar
          </Button>

          <Button 
            variant="outlined" 
            color="secondary"
            startIcon={<RecalculateIcon />} 
            onClick={() => setRecalcOpen(true)}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, height: '40px' }}
          >
            Recalcular Precios
          </Button>

          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={handleOpenCreate}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, height: '40px', px: 3, boxShadow: 3 }}
          >
            Nuevo Producto
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
                  {product.image_url ? (
                    <CardMedia
                      component="img"
                      height="160"
                      image={product.image_url}
                      alt={product.name}
                      sx={{ objectFit: 'cover', bgcolor: 'grey.100' }}
                    />
                  ) : (
                    <Box sx={{ height: 160, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: 'action.hover', color: 'text.secondary' }}>
                      <ViewModuleIcon sx={{ fontSize: 48, opacity: 0.4 }} />
                      <Typography variant="caption" sx={{ fontWeight: 600, mt: 1, color: 'text.secondary' }}>Sin imagen</Typography>
                    </Box>
                  )}
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
              <Grid size={{ xs: 12, sm: 4 }}>
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
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="Margen (%)"
                  type="number"
                  value={formMargin}
                  onChange={(e) => {
                    const newMargin = Number(e.target.value);
                    setFormMargin(newMargin);
                    setFormData(prev => ({
                      ...prev,
                      price: Number((prev.cost * (1 + newMargin / 100)).toFixed(2))
                    }));
                  }}
                  slotProps={{ htmlInput: { min: '0', step: '1' } }}
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
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

      {/* Recalculate Prices Dialog */}
      <Dialog 
        open={recalcOpen} 
        onClose={() => setRecalcOpen(false)} 
        maxWidth="xs" 
        fullWidth
        sx={{ '& .MuiDialog-paper': { borderRadius: '16px' } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Recalcular Precios de Venta</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Esto recalculará automáticamente el precio de venta de todos los productos basándose en su costo de compra y el margen de ganancia especificado.
          </Typography>
          <TextField
            fullWidth
            label="Margen de Ganancia (%)"
            type="number"
            value={marginPercent}
            onChange={(e) => setMarginPercent(Number(e.target.value))}
            variant="outlined"
            slotProps={{ htmlInput: { min: '0', max: '1000' } }}
            size="small"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setRecalcOpen(false)} color="inherit" sx={{ fontWeight: 600 }}>Cancelar</Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => recalculateMutation.mutate(marginPercent)}
            loading={recalculateMutation.isPending}
            sx={{ borderRadius: '8px', fontWeight: 700 }}
          >
            Actualizar Precios
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import Catalog Dialog */}
      <Dialog 
        open={importOpen} 
        onClose={() => setImportOpen(false)} 
        maxWidth="xs" 
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: '16px' } } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Importar Catálogo Masivamente</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontWeight: 500 }}>
            Carga un archivo CSV que siga la estructura de nuestra plantilla oficial. Si el SKU ya existe, los datos del producto se actualizarán automáticamente con la información del archivo.
          </Typography>
          <Button
            variant="outlined"
            component="label"
            fullWidth
            startIcon={<UploadIcon />}
            sx={{ borderRadius: '12px', height: '48px', textTransform: 'none', fontWeight: 600 }}
          >
            Seleccionar archivo CSV
            <input
              type="file"
              hidden
              accept=".csv"
              onChange={handleImportFile}
            />
          </Button>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setImportOpen(false)} color="inherit" sx={{ fontWeight: 600 }}>Cancelar</Button>
        </DialogActions>
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
