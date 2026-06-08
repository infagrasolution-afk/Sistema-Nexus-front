import { useState } from 'react';
import { 
  Box, Typography, Button, Paper, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, Grid, IconButton,
  Snackbar, Alert
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Business as BusinessIcon,
  FileDownload as DownloadIcon,
  FileUpload as UploadIcon,
  Description as TemplateIcon
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '../../api/axiosConfig';

const supplierSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  contact_name: z.string().optional().or(z.literal('')),
  email: z.string().email('Correo electrónico no válido').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  tax_id: z.string().min(5, 'El RIF es obligatorio'),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

export default function SuppliersPage() {
  const [open, setOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editSupplier, setEditSupplier] = useState<any | null>(null);
  
  // Notification Toast state
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const queryClient = useQueryClient();
  
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
  });

  const showToast = (message: string, severity: 'success' | 'error') => {
    setToast({ open: true, message, severity });
  };

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
      showToast('Proveedor guardado con éxito', 'success');
      setOpen(false);
      reset();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || 'Error al guardar proveedor';
      showToast(typeof msg === 'string' ? msg : JSON.stringify(msg), 'error');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: SupplierFormData }) => 
      api.patch(`/suppliers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      showToast('Proveedor actualizado con éxito', 'success');
      setOpen(false);
      reset();
      setEditSupplier(null);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || 'Error al actualizar proveedor';
      showToast(typeof msg === 'string' ? msg : JSON.stringify(msg), 'error');
    }
  });

  const importMutation = useMutation({
    mutationFn: (data: any[]) => api.post('/suppliers/import', data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      showToast(`Importación exitosa. ${res.data.imported} proveedores procesados.`, 'success');
      setImportOpen(false);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || 'Error al importar proveedores';
      showToast(typeof msg === 'string' ? msg : JSON.stringify(msg), 'error');
    }
  });

  const onSubmit = (data: SupplierFormData) => {
    if (editSupplier) {
      updateMutation.mutate({ id: editSupplier.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleOpenCreate = () => {
    setEditSupplier(null);
    reset({ name: '', contact_name: '', tax_id: '', email: '', phone: '', address: '' });
    setOpen(true);
  };

  const handleOpenEdit = (supplier: any) => {
    setEditSupplier(supplier);
    setValue('name', supplier.name || '');
    setValue('contact_name', supplier.contact_name || '');
    setValue('tax_id', supplier.tax_id || '');
    setValue('email', supplier.email || '');
    setValue('phone', supplier.phone || '');
    setValue('address', supplier.address || '');
    setOpen(true);
  };

  // CSV Export
  const handleExportCSV = () => {
    if (suppliers.length === 0) {
      showToast('No hay datos para exportar.', 'error');
      return;
    }
    const headers = ['ID', 'Nombre de Empresa', 'Contacto', 'RIF', 'Correo', 'Telefono', 'Direccion'];
    const rows = suppliers.map((s: any) => [
      s.id,
      `"${s.name.replace(/"/g, '""')}"`,
      `"${(s.contact_name || '').replace(/"/g, '""')}"`,
      `"${s.tax_id.replace(/"/g, '""')}"`,
      `"${(s.email || '').replace(/"/g, '""')}"`,
      `"${(s.phone || '').replace(/"/g, '""')}"`,
      `"${(s.address || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' 
      + [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'proveedores_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Template Download
  const handleDownloadTemplate = () => {
    const headers = ['nombre', 'contacto', 'rif', 'correo', 'telefono', 'direccion'];
    const example = ['Proveedor Ejemplo C.A.', 'Juan Perez', 'J-12345678-0', 'contacto@proveedor.com', '0212-5555555', 'Zona Industrial II'];
    
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' 
      + [headers.join(','), example.join(',')].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'plantilla_proveedores.csv');
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
            name: rowObj.name || rowObj['nombre'] || '',
            contact_name: rowObj.contact_name || rowObj['contacto'] || '',
            tax_id: rowObj.tax_id || rowObj['rif'] || '',
            email: rowObj.email || rowObj['correo'] || '',
            phone: rowObj.phone || rowObj['telefono'] || rowObj['teléfono'] || '',
            address: rowObj.address || rowObj['direccion'] || rowObj['dirección'] || ''
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

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Nombre de Empresa', flex: 1, renderCell: (params) => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <BusinessIcon color="action" fontSize="small" />
        <Typography variant="body2" sx={{ fontWeight: 500 }}>{params.value}</Typography>
      </Box>
    )},
    { field: 'contact_name', headerName: 'Contacto', flex: 0.8 },
    { field: 'tax_id', headerName: 'Identificación Fiscal', flex: 0.7 },
    { field: 'email', headerName: 'Correo', flex: 1 },
    { field: 'phone', headerName: 'Teléfono', flex: 0.7 },
    { 
      field: 'actions', 
      headerName: 'Acciones', 
      width: 100, 
      sortable: false,
      renderCell: (params) => (
        <IconButton size="small" color="primary" onClick={() => handleOpenEdit(params.row)}>
          <EditIcon fontSize="small" />
        </IconButton>
      )
    },
  ];

  return (
    <Box sx={{ p: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.5px' }}>
            Proveedores
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gestiona tu cadena de suministro y socios comerciales
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button 
            variant="outlined" 
            startIcon={<TemplateIcon />} 
            onClick={handleDownloadTemplate}
            sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600 }}
          >
            Plantilla CSV
          </Button>

          <Button 
            variant="outlined" 
            startIcon={<UploadIcon />} 
            onClick={() => setImportOpen(true)}
            sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600 }}
          >
            Importar
          </Button>

          <Button 
            variant="outlined" 
            startIcon={<DownloadIcon />} 
            onClick={handleExportCSV}
            sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600 }}
          >
            Exportar
          </Button>

          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={handleOpenCreate}
            sx={{ borderRadius: '12px', px: 3, py: 1, textTransform: 'none', fontWeight: 700, boxShadow: 3 }}
          >
            Nuevo Proveedor
          </Button>
        </Box>
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

      {/* New/Edit Supplier Dialog */}
      <Dialog 
        open={open} 
        onClose={() => setOpen(false)} 
        maxWidth="sm" 
        fullWidth 
        slotProps={{ paper: { sx: { borderRadius: '16px', p: 1 } } }}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle sx={{ fontWeight: 800 }}>
            {editSupplier ? 'Editar Proveedor' : 'Agregar Nuevo Proveedor'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  {...register('name')}
                  label="Nombre de Empresa"
                  fullWidth
                  error={!!errors.name}
                  helperText={errors.name?.message}
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  {...register('contact_name')}
                  label="Persona de Contacto"
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  {...register('tax_id')}
                  label="Identificación Fiscal (RIF)"
                  fullWidth
                  error={!!errors.tax_id}
                  helperText={errors.tax_id?.message}
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  {...register('email')}
                  label="Correo Electrónico"
                  fullWidth
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  {...register('phone')}
                  label="Número de Teléfono"
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  {...register('address')}
                  label="Dirección Completa"
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3, gap: 1 }}>
            <Button onClick={() => setOpen(false)} color="inherit" sx={{ fontWeight: 600 }}>Cancelar</Button>
            <Button 
              type="submit" 
              variant="contained" 
              loading={createMutation.isPending || updateMutation.isPending}
              sx={{ borderRadius: '8px', px: 3, fontWeight: 700 }}
            >
              Guardar Proveedor
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Import CSV Dialog */}
      <Dialog 
        open={importOpen} 
        onClose={() => setImportOpen(false)} 
        maxWidth="xs" 
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: '16px' } } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Importar Proveedores Masivamente</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontWeight: 500 }}>
            Carga un archivo CSV que siga la estructura de nuestra plantilla oficial. Si el RIF ya existe para algún proveedor, sus datos serán actualizados automáticamente.
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

      {/* Snackbar Toast */}
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
