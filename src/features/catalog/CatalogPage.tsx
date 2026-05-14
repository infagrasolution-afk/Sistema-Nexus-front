import { useState } from 'react';
import { Box, Typography, Grid, Card, CardMedia, CardContent, CardActions, Button, Chip, TextField, InputAdornment, Skeleton } from '@mui/material';
import { Search as SearchIcon, Add as AddIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axiosConfig';

export default function CatalogPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await api.get('/inventory/products');
      return response.data;
    },
  });

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
          <Button variant="contained" startIcon={<AddIcon />}>
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
          {filteredProducts.map((product: any) => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={product.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 3, transition: '0.3s', '&:hover': { boxShadow: 6, transform: 'translateY(-4px)' } }}>
                <CardMedia
                  component="img"
                  height="160"
                  image={`https://source.unsplash.com/featured/?${product.name}`}
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
                      label="En Stock" 
                      color="success" 
                      size="small" 
                      variant="outlined"
                      sx={{ fontWeight: 600, borderRadius: '6px' }}
                    />
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      Cant: 0
                    </Typography>
                  </Box>
                </CardContent>
                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button size="small" variant="outlined" fullWidth sx={{ borderRadius: '8px' }}>
                    Editar Producto
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
          {filteredProducts.length === 0 && (
            <Grid size={{ xs: 12 }}>
              <Box sx={{ p: 10, textAlign: 'center', bgcolor: 'background.paper', borderRadius: 4, border: '1px dashed', borderColor: 'divider' }}>
                <Typography variant="h6" color="text.secondary">No se encontraron productos.</Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      )}
    </Box>
  );
}
