import { useState } from 'react';
import { 
  Box, Typography, Button, Paper, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, Grid, IconButton 
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Business as BusinessIcon } from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '../../api/axiosConfig';

const supplierSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  contact_name: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  tax_id: z.string().min(5, 'Tax ID is required'),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

export default function SuppliersPage() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
  });

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const response = await api.get('/suppliers/');
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (newSupplier: SupplierFormData) => api.post('/suppliers/', newSupplier),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setOpen(false);
      reset();
    },
  });

  const onSubmit = (data: SupplierFormData) => {
    createMutation.mutate(data);
  };

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Nombre de Empresa', flex: 1, renderCell: (params) => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <BusinessIcon color="action" fontSize="small" />
        <Typography variant="body2" sx={{ fontWeight: 500 }}>{params.value}</Typography>
      </Box>
    )},
    { field: 'contact_name', headerName: 'Contacto', flex: 0.8 },
    { field: 'email', headerName: 'Correo', flex: 1 },
    { field: 'phone', headerName: 'Teléfono', flex: 0.7 },
    { field: 'tax_id', headerName: 'Identificación Fiscal', flex: 0.7 },
    { 
      field: 'actions', 
      headerName: 'Acciones', 
      width: 100, 
      sortable: false,
      renderCell: () => (
        <IconButton size="small" color="primary">
          <EditIcon fontSize="small" />
        </IconButton>
      )
    },
  ];

  return (
    <Box sx={{ p: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.5px' }}>
            Proveedores
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gestiona tu cadena de suministro y socios comerciales
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={() => setOpen(true)}
          sx={{ borderRadius: '12px', px: 3, py: 1, boxShadow: 3 }}
        >
          Nuevo Proveedor
        </Button>
      </Box>

      <Paper sx={{ height: 600, width: '100%', borderRadius: 4, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid', borderColor: 'divider' }}>
        <DataGrid
          rows={suppliers}
          columns={columns}
          loading={isLoading}
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          disableRowSelectionOnClick
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': {
              bgcolor: 'background.default',
              color: 'text.secondary',
              fontWeight: 600,
            },
            '& .MuiDataGrid-cell:focus': { outline: 'none' },
          }}
        />
      </Paper>

      {/* New Supplier Dialog */}
      <Dialog 
        open={open} 
        onClose={() => setOpen(false)} 
        maxWidth="sm" 
        fullWidth 
        slotProps={{ paper: { sx: { borderRadius: 4, p: 1 } } }}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle sx={{ fontWeight: 700 }}>Agregar Nuevo Proveedor</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  {...register('name')}
                  label="Nombre de Empresa"
                  fullWidth
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  {...register('contact_name')}
                  label="Persona de Contacto"
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  {...register('tax_id')}
                  label="Identificación Fiscal (RUC/NIT/RFC)"
                  fullWidth
                  error={!!errors.tax_id}
                  helperText={errors.tax_id?.message}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  {...register('email')}
                  label="Correo Electrónico"
                  fullWidth
                  error={!!errors.email}
                  helperText={errors.email?.message}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  {...register('phone')}
                  label="Número de Teléfono"
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  {...register('address')}
                  label="Dirección Completa"
                  fullWidth
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setOpen(false)} color="inherit">Cancelar</Button>
            <Button 
              type="submit" 
              variant="contained" 
              loading={createMutation.isPending}
            >
              Guardar Proveedor
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
