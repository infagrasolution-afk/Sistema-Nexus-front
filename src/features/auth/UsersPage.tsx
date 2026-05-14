import { useState } from 'react';
import { Box, Typography, Button, Paper, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid } from '@mui/material';
import { Add as AddIcon, Person as PersonIcon } from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axiosConfig';

export default function UsersPage() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/users/');
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (newUser: any) => api.post('/users/', newUser),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setOpen(false);
      setEmail('');
      setPassword('');
    },
  });

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'email', headerName: 'Correo', flex: 1, renderCell: (params) => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <PersonIcon color="primary" fontSize="small" />
        {params.value}
      </Box>
    )},
    { field: 'is_active', headerName: 'Activo', type: 'boolean', width: 120 },
    { field: 'is_superuser', headerName: 'Admin', type: 'boolean', width: 120 },
    { field: 'created_at', headerName: 'Registro', flex: 1, valueFormatter: (params) => new Date(params).toLocaleDateString() },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>Gestión de Usuarios</Typography>
          <Typography variant="body2" color="text.secondary">Administra miembros del equipo y sus permisos</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
          Invitar Usuario
        </Button>
      </Box>

      <Paper sx={{ height: 600, width: '100%', borderRadius: 4, overflow: 'hidden' }}>
        <DataGrid
          rows={users}
          columns={columns}
          loading={isLoading}
          pageSizeOptions={[10, 25]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        />
      </Paper>

      <Dialog 
        open={open} 
        onClose={() => setOpen(false)} 
        maxWidth="xs" 
        fullWidth 
        slotProps={{ paper: { sx: { borderRadius: 4 } } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Invitar Nuevo Usuario</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Correo Electrónico"
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Contraseña Temporal"
                type="password"
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpen(false)} color="inherit">Cancelar</Button>
          <Button variant="contained" onClick={() => createMutation.mutate({ email, password, is_superuser: false })}>
            Crear Cuenta
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
