import { useState } from 'react';
import { 
  Box, Typography, Button, Paper, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, Grid, IconButton,
  Tooltip, Snackbar, Alert
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Person as PersonIcon,
  FileDownload as DownloadIcon,
  FileUpload as UploadIcon,
  Description as TemplateIcon
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axiosConfig';

export default function CustomersPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<any | null>(null);
  
  // Notification Toast state
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    tax_id: '',
    phone: '',
    email: '',
    address: ''
  });

  const showToast = (message: string, severity: 'success' | 'error') => {
    setToast({ open: true, message, severity });
  };

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const response = await api.get('/sales/customers');
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (newCust: typeof formData) => api.post('/sales/customers', newCust),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      showToast('Cliente creado con éxito', 'success');
      handleClose();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || 'Error al crear el cliente';
      showToast(typeof msg === 'string' ? msg : JSON.stringify(msg), 'error');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: typeof formData }) => 
      api.put(`/sales/customers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      showToast('Cliente actualizado con éxito', 'success');
      handleClose();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || 'Error al actualizar el cliente';
      showToast(typeof msg === 'string' ? msg : JSON.stringify(msg), 'error');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/sales/customers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      showToast('Cliente eliminado con éxito', 'success');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || 'Error al eliminar el cliente';
      showToast(typeof msg === 'string' ? msg : JSON.stringify(msg), 'error');
    }
  });

  const importMutation = useMutation({
    mutationFn: (data: any[]) => api.post('/sales/customers/import', data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      showToast(`Importación exitosa. ${res.data.imported} clientes procesados.`, 'success');
      setImportOpen(false);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || 'Error al importar datos';
      showToast(typeof msg === 'string' ? msg : JSON.stringify(msg), 'error');
    }
  });

  const handleOpenCreate = () => {
    setEditCustomer(null);
    setFormData({ name: '', tax_id: '', phone: '', email: '', address: '' });
    setOpen(true);
  };

  const handleOpenEdit = (customer: any) => {
    setEditCustomer(customer);
    setFormData({
      name: customer.name || '',
      tax_id: customer.tax_id || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || ''
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditCustomer(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.tax_id) {
      showToast('Nombre y RIF/Cédula son obligatorios.', 'error');
      return;
    }

    if (editCustomer) {
      updateMutation.mutate({ id: editCustomer.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('¿Está seguro de que desea eliminar este cliente?')) {
      deleteMutation.mutate(id);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (customers.length === 0) {
      showToast('No hay datos para exportar.', 'error');
      return;
    }
    const headers = ['ID', 'Nombre', 'Identificacion Fiscal (RIF/CI)', 'Telefono', 'Correo', 'Direccion'];
    const rows = customers.map((c: any) => [
      c.id,
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.tax_id.replace(/"/g, '""')}"`,
      `"${(c.phone || '').replace(/"/g, '""')}"`,
      `"${(c.email || '').replace(/"/g, '""')}"`,
      `"${(c.address || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' 
      + [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'clientes_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Template Download
  const handleDownloadTemplate = () => {
    const headers = ['name', 'tax_id', 'phone', 'email', 'address'];
    const example = ['Cliente Ejemplo S.A.', 'V-12345678-9', '0412-0000000', 'cliente@ejemplo.com', 'Av. Principal Local 1'];
    
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' 
      + [headers.join(','), example.join(',')].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'plantilla_clientes.csv');
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
          // simple regex to handle optional quotes in CSV
          const values = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));
          
          if (values.length < headers.length) continue;

          const rowObj: any = {};
          headers.forEach((header, index) => {
            rowObj[header] = values[index] || '';
          });

          // Match schema fields
          parsedData.push({
            name: rowObj.name || rowObj['nombre'] || '',
            tax_id: rowObj.tax_id || rowObj['rif'] || rowObj['rif/ci'] || rowObj['identificación fiscal'] || '',
            phone: rowObj.phone || rowObj['telefono'] || rowObj['teléfono'] || '',
            email: rowObj.email || rowObj['correo'] || '',
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
    // Reset file input value to allow re-upload
    e.target.value = '';
  };

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Nombre del Cliente', flex: 1, renderCell: (params) => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <PersonIcon color="action" fontSize="small" />
        <Typography variant="body2" sx={{ fontWeight: 500 }}>{params.value}</Typography>
      </Box>
    )},
    { field: 'tax_id', headerName: 'RIF / Cédula', flex: 0.7 },
    { field: 'phone', headerName: 'Teléfono', flex: 0.7 },
    { field: 'email', headerName: 'Correo', flex: 1 },
    { field: 'address', headerName: 'Dirección', flex: 1.2 },
    { 
      field: 'actions', 
      headerName: 'Acciones', 
      width: 120, 
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton size="small" color="primary" onClick={() => handleOpenEdit(params.row)}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => handleDelete(params.row.id)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      )
    },
  ];

  return (
    <Box sx={{ p: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.5px' }}>
            Clientes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Administra la cartera de clientes y cuentas por cobrar asociadas
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
            sx={{ borderRadius: '12px', px: 3, textTransform: 'none', fontWeight: 700, boxShadow: 3 }}
          >
            Nuevo Cliente
          </Button>
        </Box>
      </Box>

      <Paper sx={{ height: 600, width: '100%', borderRadius: 4, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid', borderColor: 'divider' }}>
        <DataGrid
          rows={customers}
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

      {/* Create / Edit Dialog */}
      <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth="sm" 
        fullWidth 
        slotProps={{ paper: { sx: { borderRadius: '16px', p: 1 } } }}
      >
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: 800 }}>
            {editCustomer ? 'Editar Cliente' : 'Agregar Nuevo Cliente'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  label="Nombre o Razón Social"
                  fullWidth
                  required
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  name="tax_id"
                  value={formData.tax_id}
                  onChange={handleChange}
                  label="Identificación Fiscal (RIF / Cédula)"
                  fullWidth
                  required
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  label="Teléfono"
                  fullWidth
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  label="Correo Electrónico"
                  fullWidth
                  type="email"
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  label="Dirección de Facturación/Entrega"
                  fullWidth
                  multiline
                  rows={2}
                  variant="outlined"
                  size="small"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3, gap: 1 }}>
            <Button onClick={handleClose} color="inherit" sx={{ fontWeight: 600 }}>Cancelar</Button>
            <Button 
              type="submit" 
              variant="contained" 
              loading={createMutation.isPending || updateMutation.isPending}
              sx={{ borderRadius: '8px', px: 3, fontWeight: 700 }}
            >
              Guardar Cliente
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
        <DialogTitle sx={{ fontWeight: 800 }}>Importar Clientes Masivamente</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontWeight: 500 }}>
            Carga un archivo CSV que siga la estructura de nuestra plantilla oficial. Si la identificación fiscal (RIF/Cédula) coincide con uno existente, sus datos serán actualizados automáticamente.
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

      {/* Snackbar notification toast */}
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
