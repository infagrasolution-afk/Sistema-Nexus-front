import { useState } from 'react';
import { 
  Box, Typography, Button, Paper, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, Grid, FormControl, 
  InputLabel, Select, MenuItem, Chip, Alert, IconButton, Tooltip 
} from '@mui/material';
import { 
  Add as AddIcon, Person as PersonIcon, LockOpen as LockOpenIcon, 
  Delete as DeleteIcon, Edit as EditIcon, Security as SecurityIcon 
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axiosConfig';

export default function UsersPage() {
  const [open, setOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState<string | number>('');
  const [modules, setModules] = useState('sales,inventory');
  
  const [errorMsg, setErrorMsg] = useState('');
  const queryClient = useQueryClient();

  // 1. Obtener lista de usuarios de la empresa
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/users/');
      return response.data;
    },
  });

  // 2. Obtener roles disponibles para asignar
  const { data: roles = [] } = useQuery({
    queryKey: ['available-roles'],
    queryFn: async () => {
      const response = await api.get('/users/roles');
      return response.data;
    },
  });

  // 3. Mutación para crear usuario
  const createMutation = useMutation({
    mutationFn: (newUser: any) => api.post('/users/', newUser),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      handleClose();
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.detail || 'Error al crear el usuario.');
    }
  });

  // 4. Mutación para actualizar usuario (incluye cambio de rol)
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.put(`/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      handleClose();
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.detail || 'Error al actualizar el usuario.');
    }
  });

  // 5. Mutación para desbloquear cuenta
  const unlockMutation = useMutation({
    mutationFn: (userId: number) => api.post(`/users/${userId}/unlock`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  // 6. Mutación para desactivar (soft delete)
  const deleteMutation = useMutation({
    mutationFn: (userId: number) => api.delete(`/users/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const handleOpenCreate = () => {
    setEditingUser(null);
    setUsername('');
    setEmail('');
    setPassword('');
    setRoleId('');
    setModules('sales,inventory');
    setErrorMsg('');
    setOpen(true);
  };

  const handleOpenEdit = (user: any) => {
    setEditingUser(user);
    setUsername(user.username);
    setEmail(user.email || '');
    setPassword(''); // No mostrar hashed_password por seguridad
    setRoleId(user.role_id || '');
    setModules(user.modules || '');
    setErrorMsg('');
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingUser(null);
    setErrorMsg('');
  };

  const handleSubmit = () => {
    setErrorMsg('');
    if (!username || (!editingUser && !password)) {
      setErrorMsg('Usuario y contraseña son requeridos.');
      return;
    }

    const payload: any = {
      username,
      email: email || null,
      modules: modules || null,
      role_id: roleId ? Number(roleId) : null,
    };

    if (password) {
      payload.password = password;
    }

    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, data: payload });
    } else {
      payload.is_superuser = false; // El admin de empresa no puede crear superadmins globales
      createMutation.mutate(payload);
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'username', headerName: 'Usuario', flex: 1, renderCell: (params) => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <PersonIcon color="primary" fontSize="small" />
        <Typography variant="body2" sx={{ fontWeight: 700 }}>{params.value}</Typography>
      </Box>
    )},
    { field: 'email', headerName: 'Correo', flex: 1.2 },
    { field: 'role', headerName: 'Rol / Permisos', flex: 1.2, renderCell: (params) => {
      const roleName = params.value?.name;
      return roleName ? (
        <Chip 
          icon={<SecurityIcon fontSize="small" />} 
          label={roleName} 
          color="primary" 
          variant="outlined" 
          size="small" 
          sx={{ fontWeight: 700 }}
        />
      ) : (
        <Typography variant="caption" color="text.disabled">Sin Rol asignado</Typography>
      );
    }},
    { field: 'modules', headerName: 'Módulos', flex: 1, renderCell: (params) => (
      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
        {params.value ? params.value.split(',').map((mod: string, index: number) => (
          <Chip key={index} label={mod} size="small" variant="filled" sx={{ fontSize: '0.75rem', fontWeight: 600 }} />
        )) : <Typography variant="caption" color="text.disabled">-</Typography>}
      </Box>
    )},
    { field: 'is_locked', headerName: 'Estado', width: 130, renderCell: (params) => {
      const isLocked = params.value;
      return (
        <Chip 
          label={isLocked ? 'Bloqueado 🔒' : 'Activo ✅'} 
          color={isLocked ? 'error' : 'success'} 
          size="small" 
          sx={{ fontWeight: 800 }}
        />
      );
    }},
    { field: 'actions', headerName: 'Acciones', width: 180, sortable: false, renderCell: (params) => {
      const user = params.row;
      return (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', height: '100%' }}>
          <Tooltip title="Editar Usuario">
            <IconButton size="small" onClick={() => handleOpenEdit(user)}>
              <EditIcon fontSize="small" color="primary" />
            </IconButton>
          </Tooltip>

          {user.is_locked && (
            <Tooltip title="Desbloquear Cuenta (Reset Intentos)">
              <Button
                variant="contained"
                color="success"
                size="small"
                startIcon={<LockOpenIcon sx={{ fontSize: '1rem' }} />}
                onClick={() => unlockMutation.mutate(user.id)}
                sx={{ 
                  py: 0.2, 
                  px: 1.5, 
                  borderRadius: 2, 
                  fontSize: '0.75rem', 
                  fontWeight: 800, 
                  textTransform: 'none' 
                }}
              >
                Desbloquear
              </Button>
            </Tooltip>
          )}

          {!user.is_superuser && user.is_active && (
            <Tooltip title="Desactivar Usuario">
              <IconButton size="small" onClick={() => {
                if(confirm(`¿Está seguro de desactivar a '${user.username}'?`)) {
                  deleteMutation.mutate(user.id);
                }
              }}>
                <DeleteIcon fontSize="small" color="error" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      );
    }},
  ];

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto', p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: '-1px' }}>Gestión de Usuarios y Roles</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            Administra miembros del equipo, asigna roles de trabajo, módulos de acceso y desbloquea cuentas protegidas.
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={handleOpenCreate}
          sx={{ borderRadius: 3, fontWeight: 700, py: 1.2, px: 3 }}
        >
          Crear Nuevo Usuario
        </Button>
      </Box>

      <Paper sx={{ height: 600, width: '100%', borderRadius: '20px', overflow: 'hidden', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
        <DataGrid
          rows={users}
          columns={columns}
          loading={isLoading}
          pageSizeOptions={[10, 25]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': {
              bgcolor: 'rgba(0,0,0,0.02)',
              borderBottom: '1px solid',
              borderColor: 'divider',
            },
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid',
              borderColor: 'rgba(0,0,0,0.04)',
            }
          }}
        />
      </Paper>

      <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth="sm" 
        fullWidth 
        slotProps={{ paper: { sx: { borderRadius: '24px', p: 1 } } }}
      >
        <DialogTitle sx={{ fontWeight: 900, fontSize: '1.4rem' }}>
          {editingUser ? `Editar Usuario: ${editingUser.username}` : 'Crear Nuevo Usuario'}
        </DialogTitle>
        <DialogContent>
          {errorMsg && <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>{errorMsg}</Alert>}
          
          <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Nombre de Usuario (Login)"
                fullWidth
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Correo Electrónico"
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label={editingUser ? "Nueva Contraseña (dejar vacío para mantener)" : "Contraseña Temporal"}
                type="password"
                fullWidth
                required={!editingUser}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}>
                <InputLabel>Rol Asignado</InputLabel>
                <Select
                  value={roleId}
                  label="Rol Asignado"
                  onChange={(e) => setRoleId(e.target.value)}
                >
                  <MenuItem value=""><em>Ninguno (Sin permisos especiales)</em></MenuItem>
                  {roles.map((r: any) => (
                    <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Módulos Permitidos (separados por coma)"
                fullWidth
                placeholder="sales,inventory,purchases"
                value={modules}
                onChange={(e) => setModules(e.target.value)}
                helperText="Ej: sales,inventory,purchases,treasury,accounting"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              />
            </Grid>
          </Grid>

        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button onClick={handleClose} color="inherit" sx={{ fontWeight: 700 }}>Cancelar</Button>
          <Button 
            variant="contained" 
            onClick={handleSubmit} 
            disabled={createMutation.isPending || updateMutation.isPending}
            sx={{ borderRadius: 3, fontWeight: 700, px: 3 }}
          >
            {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
