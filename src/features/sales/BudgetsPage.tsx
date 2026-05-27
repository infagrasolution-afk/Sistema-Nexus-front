// import { useState } from 'react';
import { 
  Box, Typography, Paper, Button, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Chip
} from '@mui/material';
import { Add, RequestQuote, FileDownload } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axiosConfig';

export default function BudgetsPage() {
  // const [openNewDialog, setOpenNewDialog] = useState(false);

  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ['budgets'],
    queryFn: async () => {
      const res = await api.get('/sales/budgets');
      return res.data;
    }
  });

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      width: '100%',
      maxWidth: 1000, 
      mx: 'auto', 
      mt: 6,
      px: 3
    }}>
      <Paper elevation={0} sx={{ 
        p: 4, 
        width: '100%',
        borderRadius: '24px', 
        border: '1px solid', 
        borderColor: 'divider',
        bgcolor: 'background.paper',
        boxShadow: '0 10px 40px -10px rgba(0,0,0,0.05)'
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
            <Box sx={{ 
              bgcolor: 'primary.50', 
              p: 2, 
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid',
              borderColor: 'primary.100'
            }}>
              <RequestQuote color="primary" sx={{ fontSize: 32 }} />
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-1px' }}>Presupuestos</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, opacity: 0.8 }}>
                Gestión de cotizaciones y propuestas comerciales
              </Typography>
            </Box>
          </Box>
          <Button 
            variant="contained" 
            startIcon={<Add />}
            // onClick={() => setOpenNewDialog(true)}
            sx={{ 
              borderRadius: '12px', 
              px: 3.5, 
              py: 1.2, 
              fontWeight: 700,
              boxShadow: '0 8px 16px rgba(37, 99, 235, 0.2)',
              '&:hover': { boxShadow: '0 12px 20px rgba(37, 99, 235, 0.3)' }
            }}
          >
            Nuevo Presupuesto
          </Button>
        </Box>

        <TableContainer sx={{ border: '1px solid', borderColor: 'grey.100', borderRadius: '16px' }}>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.50' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, py: 2.5 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Fecha</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Vendedor</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {budgets.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                    <Typography color="text.secondary" sx={{ fontWeight: 500 }}>No hay presupuestos registrados aún.</Typography>
                  </TableCell>
                </TableRow>
              )}
              {budgets.map((b: any) => (
                <TableRow key={b.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell sx={{ fontWeight: 600 }}>#{b.id.toString().padStart(5, '0')}</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 500 }}>{new Date(b.created_at).toLocaleDateString()}</TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{b.created_by_name || 'N/A'}</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: 'primary.main' }}>${b.total.toFixed(2)}</TableCell>
                  <TableCell>
                    <Chip 
                      label={b.status} 
                      size="small"
                      color={b.status === 'PENDING' ? 'warning' : 'success'}
                      sx={{ fontWeight: 700, borderRadius: '6px', fontSize: '0.75rem' }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Button 
                      size="small" 
                      variant="text" 
                      startIcon={<FileDownload />}
                      sx={{ fontWeight: 700, borderRadius: '8px' }}
                    >
                      PDF
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
