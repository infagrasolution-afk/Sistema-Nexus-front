import { useState } from 'react';
import { Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

const initialProducts = [
  { id: 1, sku: 'PRD-001', name: 'Laptop Pro X', cost: 800.00, price: 1200.00, stock: 45, status: 'En Stock' },
  { id: 2, sku: 'PRD-002', name: 'Wireless Mouse', cost: 10.00, price: 25.00, stock: 5, status: 'Stock Bajo' },
  { id: 3, sku: 'PRD-003', name: 'Mechanical Keyboard', cost: 45.00, price: 85.00, stock: 120, status: 'En Stock' },
];

export default function InventoryPage() {
  const [products, setProducts] = useState(initialProducts);
  const [editOpen, setEditOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  const handleEditClick = (product: any) => {
    setEditingProduct({ ...product });
    setEditOpen(true);
  };

  const handleClose = () => {
    setEditOpen(false);
    setEditingProduct(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditingProduct((prev: any) => ({
      ...prev,
      [name]: name === 'cost' || name === 'price' || name === 'stock' ? Number(value) : value,
    }));
  };

  const handleSave = () => {
    setProducts((prev) => 
      prev.map((p) => {
        if (p.id === editingProduct.id) {
          // Update status based on new stock
          const newStatus = editingProduct.stock <= 10 ? (editingProduct.stock === 0 ? 'Sin Stock' : 'Stock Bajo') : 'En Stock';
          return { ...editingProduct, status: newStatus };
        }
        return p;
      })
    );
    handleClose();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">Gestión de Inventario</Typography>
        <Button variant="contained" startIcon={<AddIcon />} size="large">
          Agregar Producto
        </Button>
      </Box>

      <TableContainer component={Paper} elevation={1} sx={{ borderRadius: 3 }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ bgcolor: 'background.default' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>SKU</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Nombre</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Costo</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Precio</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Ganancia</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Nivel de Stock</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((row) => (
              <TableRow key={row.id} sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { bgcolor: 'action.hover' } }}>
                <TableCell component="th" scope="row">{row.sku}</TableCell>
                <TableCell sx={{ fontWeight: 500 }}>{row.name}</TableCell>
                <TableCell>${row.cost.toFixed(2)}</TableCell>
                <TableCell>${row.price.toFixed(2)}</TableCell>
                <TableCell sx={{ color: 'success.main', fontWeight: 600 }}>
                  ${(row.price - row.cost).toFixed(2)}
                </TableCell>
                <TableCell>{row.stock}</TableCell>
                <TableCell>
                  <Chip 
                    label={row.status} 
                    color={row.status === 'Stock Bajo' || row.status === 'Sin Stock' ? 'error' : 'success'} 
                    size="small" 
                    sx={{ fontWeight: 600, borderRadius: 1 }}
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton color="primary" onClick={() => handleEditClick(row)}><EditIcon /></IconButton>
                  <IconButton color="error"><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Edit Product Dialog */}
      <Dialog open={editOpen} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Editar Producto</DialogTitle>
        <DialogContent dividers>
          {editingProduct && (
            <Grid container spacing={3} sx={{ mt: 0 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="SKU"
                  name="sku"
                  value={editingProduct.sku}
                  onChange={handleChange}
                  disabled
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Nombre del Producto"
                  name="name"
                  value={editingProduct.name}
                  onChange={handleChange}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="Costo ($)"
                  name="cost"
                  type="number"
                  value={editingProduct.cost}
                  onChange={handleChange}
                  slotProps={{ htmlInput: { step: "0.01", min: "0" } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="Precio ($)"
                  name="price"
                  type="number"
                  value={editingProduct.price}
                  onChange={handleChange}
                  slotProps={{ htmlInput: { step: "0.01", min: "0" } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="Nivel de Stock"
                  name="stock"
                  type="number"
                  value={editingProduct.stock}
                  onChange={handleChange}
                  slotProps={{ htmlInput: { min: "0" } }}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, px: 3 }}>
          <Button onClick={handleClose} color="inherit">Cancelar</Button>
          <Button onClick={handleSave} variant="contained" color="primary">Guardar Cambios</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
