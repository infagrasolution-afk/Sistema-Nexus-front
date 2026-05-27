import { Box, Typography, Paper, Grid, Card, CardContent, Chip, Button } from '@mui/material';
import { AccountBalanceWallet as CashIcon, Storefront as RegisterIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axiosConfig';
import { useNavigate } from 'react-router-dom';

export default function CashPage() {
  const navigate = useNavigate();
  
  const { data: session } = useQuery({
    queryKey: ['cash-session'],
    queryFn: async () => {
      try {
        return (await api.get('/cash/session/current')).data;
      } catch (e) {
        return null;
      }
    }
  });

  const { data: registers = [] } = useQuery({
    queryKey: ['cash-registers'],
    queryFn: async () => (await api.get('/cash/registers')).data
  });

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <CashIcon color="primary" fontSize="large" />
        <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main' }}>
          Gestión de Caja
        </Typography>
      </Box>

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }} elevation={0}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Estado Actual de Caja</Typography>
              {session ? (
                <Box>
                  <Chip label="CAJA ABIERTA" color="success" sx={{ mb: 3, fontWeight: 700 }} />
                  <Typography variant="body1" color="text.secondary">Registro Activo: <b>{session.register.name}</b></Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>Fondo Inicial: <b>${session.opening_balance.toFixed(2)}</b></Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>Apertura: <b>{new Date(session.opened_at).toLocaleString()}</b></Typography>
                  <Button 
                    variant="outlined" 
                    color="error" 
                    fullWidth 
                    sx={{ mt: 4, borderRadius: 2 }}
                    onClick={() => navigate('/sales')}
                  >
                    Ir a Punto de Venta (Arqueo)
                  </Button>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Chip label="CAJA CERRADA" color="error" sx={{ mb: 2, fontWeight: 700 }} />
                  <Typography color="text.secondary" sx={{ mb: 3 }}>No hay ninguna sesión de caja activa en este momento.</Typography>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    sx={{ borderRadius: 2 }}
                    onClick={() => navigate('/sales')}
                  >
                    Abrir Nueva Caja
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }} elevation={0}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Cajas Registradoras Disponibles</Typography>
              {registers.map((reg: any) => (
                <Paper key={reg.id} variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <RegisterIcon color="action" />
                  <Box>
                    <Typography sx={{ fontWeight: 600 }}>{reg.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{reg.is_active ? 'Operativa' : 'Inactiva'}</Typography>
                  </Box>
                </Paper>
              ))}
              {registers.length === 0 && (
                <Typography color="text.secondary">No hay cajas configuradas.</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
