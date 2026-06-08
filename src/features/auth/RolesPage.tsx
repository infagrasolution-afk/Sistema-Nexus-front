import { useState } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Button, IconButton, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, CircularProgress, 
  Chip, Grid, Checkbox, FormControlLabel, Divider
} from '@mui/material';
import { 
  Security as SecurityIcon, 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon 
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axiosConfig';

export default function RolesPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permission_ids: [] as number[]
  });

  // Query: Get Roles
  const { data: roles = [], isLoading: loadingRoles } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await api.get('/roles');
      return res.data;
    }
  });

  // Query: Get All Permissions
  const { data: permissions = [] } = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const res = await api.get('/roles/permissions');
      return res.data;
    }
  });

  // Group permissions by module
  const groupedPermissions = permissions.reduce((acc: any, curr: any) => {
    if (!acc[curr.module]) acc[curr.module] = [];
    acc[curr.module].push(curr);
    return acc;
  }, {});

  const seedDefaultsMutation = useMutation({
    mutationFn: () => api.post('/roles/seed-defaults'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      alert('Roles predeterminados generados con éxito');
    }
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => {
      if (editingRole) {
        return api.put(`/roles/${editingRole.id}`, data);
      }
      return api.post('/roles', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      const detail = err.response?.data?.detail || 'Error al guardar el rol';
      alert(typeof detail === 'string' ? detail : JSON.stringify(detail));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/roles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
    onError: (err: any) => {
      const detail = err.response?.data?.detail || 'Error al eliminar';
      alert(typeof detail === 'string' ? detail : JSON.stringify(detail));
    }
  });

  const resetForm = () => {
    setEditingRole(null);
    setFormData({ name: '', description: '', permission_ids: [] });
  };

  const handleOpen = (role?: any) => {
    if (role) {
      setEditingRole(role);
      setFormData({
        name: role.name,
        description: role.description || '',
        permission_ids: role.permissions.map((p: any) => p.id)
      });
    } else {
      resetForm();
    }
    setOpen(true);
  };

  const handleTogglePermission = (permId: number) => {
    setFormData(prev => {
      const isSelected = prev.permission_ids.includes(permId);
      if (isSelected) {
        return { ...prev, permission_ids: prev.permission_ids.filter(id => id !== permId) };
      } else {
        return { ...prev, permission_ids: [...prev.permission_ids, permId] };
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      alert('El nombre del rol es requerido');
      return;
    }
    saveMutation.mutate(formData);
  };

  if (loadingRoles) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <SecurityIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h5" sx={{ fontWeight: 800 }}>Roles y Permisos</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {roles.length === 0 && (
            <Button 
              variant="outlined" 
              color="secondary"
              onClick={() => seedDefaultsMutation.mutate()}
              disabled={seedDefaultsMutation.isPending}
            >
              Generar Roles Básicos
            </Button>
          )}
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => handleOpen()}
            sx={{ borderRadius: '12px', fontWeight: 700 }}
          >
            Nuevo Rol
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <Table>
          <TableHead sx={{ bgcolor: 'action.hover' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Rol</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Descripción</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Nº Permisos</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Sistema</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {roles.map((role: any) => (
              <TableRow key={role.id}>
                <TableCell sx={{ fontWeight: 600 }}>{role.name}</TableCell>
                <TableCell>{role.description}</TableCell>
                <TableCell>
                  <Chip label={`${role.permissions?.length || 0} permisos`} size="small" color="primary" variant="outlined" />
                </TableCell>
                <TableCell>
                  {role.is_system_role ? (
                    <Chip label="Protegido" size="small" color="error" />
                  ) : (
                    <Chip label="Personalizado" size="small" color="default" />
                  )}
                </TableCell>
                <TableCell align="center">
                  <IconButton color="primary" onClick={() => handleOpen(role)}>
                    <EditIcon />
                  </IconButton>
                  {!role.is_system_role && (
                    <IconButton color="error" onClick={() => {
                      if (window.confirm(`¿Eliminar el rol ${role.name}?`)) {
                        deleteMutation.mutate(role.id);
                      }
                    }}>
                      <DeleteIcon />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {roles.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                  <Typography variant="body1" color="text.secondary">
                    No hay roles configurados. Haz clic en "Generar Roles Básicos".
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Role Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {editingRole ? 'Editar Rol' : 'Crear Nuevo Rol'}
        </DialogTitle>
        <DialogContent dividers>
          <Box component="form" id="role-form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Nombre del Rol"
                  fullWidth
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={editingRole?.is_system_role}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Descripción"
                  fullWidth
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </Grid>
            </Grid>

            <Typography variant="h6" sx={{ fontWeight: 700, mt: 2 }}>Permisos de Acceso</Typography>
            
            <Grid container spacing={3}>
              {Object.keys(groupedPermissions).map((moduleName) => (
                <Grid size={{ xs: 12, md: 6 }} key={moduleName}>
                  <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, textTransform: 'uppercase', mb: 1, color: 'primary.main' }}>
                      Módulo: {moduleName}
                    </Typography>
                    <Divider sx={{ mb: 1 }} />
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      {groupedPermissions[moduleName].map((perm: any) => (
                        <FormControlLabel
                          key={perm.id}
                          control={
                            <Checkbox 
                              checked={formData.permission_ids.includes(perm.id)}
                              onChange={() => handleTogglePermission(perm.id)}
                            />
                          }
                          label={
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{perm.code}</Typography>
                              <Typography variant="caption" color="text.secondary">{perm.description}</Typography>
                            </Box>
                          }
                          sx={{ mb: 1, alignItems: 'flex-start' }}
                        />
                      ))}
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>

          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, px: 3 }}>
          <Button onClick={() => setOpen(false)} color="inherit" sx={{ fontWeight: 700 }}>Cancelar</Button>
          <Button type="submit" form="role-form" variant="contained" disabled={saveMutation.isPending} sx={{ fontWeight: 700, borderRadius: 2 }}>
            Guardar Rol
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
