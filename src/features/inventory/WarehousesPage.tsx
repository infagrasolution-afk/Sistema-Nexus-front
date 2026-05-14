import { useState } from 'react';
import { 
  Box, Typography, Paper, Grid, Button, IconButton, TextField, 
  Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, 
  ListItemText, Divider, Tooltip
} from '@mui/material';
import { 
  Warehouse as WarehouseIcon, 
  Add as AddIcon, 
  QrCode as QrIcon,
  Print as PrintIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../../api/axiosConfig';

export default function WarehousesPage() {
  const { t } = useTranslation();
  const [openWarehouse, setOpenWarehouse] = useState(false);
  const [openBin, setOpenBin] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<any>(null);
  const [newWarehouse, setNewWarehouse] = useState({ name: '', address: '' });
  const [newBin, setNewBin] = useState({ code: '', zone: '', description: '' });
  
  const queryClient = useQueryClient();

  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => (await api.get('/inventory/warehouses')).data
  });

  const createWarehouseMutation = useMutation({
    mutationFn: (data: any) => api.post('/inventory/warehouses', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      setOpenWarehouse(false);
      setNewWarehouse({ name: '', address: '' });
    }
  });

  const createBinMutation = useMutation({
    mutationFn: (data: any) => api.post('/inventory/bins', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      setOpenBin(false);
      setNewBin({ code: '', zone: '', description: '' });
    }
  });

  const handlePrintLabel = (bin: any) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Label ${bin.code}</title>
            <style>
              body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
              .label { border: 2px solid black; padding: 40px; text-align: center; border-radius: 10px; }
              .code { font-size: 48px; font-weight: bold; margin-top: 20px; }
              .zone { font-size: 24px; color: #666; }
            </style>
          </head>
          <body>
            <div class="label">
              <div id="qr-container"></div>
              <div class="code">${bin.code}</div>
              <div class="zone">${bin.zone || 'General Zone'}</div>
            </div>
            <script>
              // This is a bit tricky to inject the SVG directly, so we use a simple trick or just the text
              // For a real app, we'd convert SVG to DataURL or similar.
              window.onload = () => { window.print(); };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>WMS - {t('Warehouses')}</Typography>
          <Typography variant="body2" color="text.secondary">{t('Manage physical storage locations')}</Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={() => setOpenWarehouse(true)}
          sx={{ borderRadius: '12px' }}
        >
          {t('Add Warehouse')}
        </Button>
      </Box>

      <Grid container spacing={3}>
        {warehouses.map((wh: any) => (
          <Grid size={{ xs: 12, md: 6 }} key={wh.id}>
            <Paper sx={{ p: 3, borderRadius: 4, height: '100%', border: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', borderRadius: 2 }}>
                    <WarehouseIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>{wh.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{wh.address || t('No address set')}</Typography>
                  </Box>
                </Box>
                <Button 
                  size="small" 
                  startIcon={<AddIcon />} 
                  onClick={() => { setSelectedWarehouse(wh); setOpenBin(true); }}
                >
                  {t('Add Bin')}
                </Button>
              </Box>

              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary', fontWeight: 600 }}>
                {t('Bin Locations')} ({wh.bins?.length || 0})
              </Typography>
              
              <List dense>
                {wh.bins?.map((bin: any) => (
                  <ListItem 
                    key={bin.id} 
                    sx={{ bgcolor: 'action.hover', mb: 1, borderRadius: 2 }}
                    secondaryAction={
                      <Box>
                        <Tooltip title={t('Print QR Label')}>
                          <IconButton size="small" onClick={() => handlePrintLabel(bin)}>
                            <PrintIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <IconButton size="small" color="error">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    }
                  >
                    <ListItemIcon>
                      <QrIcon color="action" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={<Typography sx={{ fontWeight: 600 }}>{bin.code}</Typography>} 
                      secondary={bin.zone ? `${t('Zone')}: ${bin.zone}` : t('General Zone')} 
                    />
                  </ListItem>
                ))}
                {(!wh.bins || wh.bins.length === 0) && (
                  <Typography variant="body2" sx={{ py: 2, textAlign: 'center', color: 'text.disabled', fontStyle: 'italic' }}>
                    No hay ubicaciones (bins) definidas para este almacén.
                  </Typography>
                )}
              </List>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Dialog: New Warehouse */}
      <Dialog open={openWarehouse} onClose={() => setOpenWarehouse(false)} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{t('New Warehouse')}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label={t('Warehouse Name')} fullWidth value={newWarehouse.name} onChange={(e) => setNewWarehouse({...newWarehouse, name: e.target.value})} />
            <TextField label={t('Physical Address')} fullWidth multiline rows={2} value={newWarehouse.address} onChange={(e) => setNewWarehouse({...newWarehouse, address: e.target.value})} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenWarehouse(false)} color="inherit">{t('Cancel')}</Button>
          <Button variant="contained" onClick={() => createWarehouseMutation.mutate(newWarehouse)}>{t('Create')}</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: New Bin */}
      <Dialog open={openBin} onClose={() => setOpenBin(false)} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{t('Add Bin')} - {selectedWarehouse?.name}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label={t('Bin Code')} fullWidth autoFocus value={newBin.code} onChange={(e) => setNewBin({...newBin, code: e.target.value.toUpperCase()})} />
            <TextField label={t('Zone')} fullWidth value={newBin.zone} onChange={(e) => setNewBin({...newBin, zone: e.target.value})} />
            <TextField label={t('Description')} fullWidth value={newBin.description} onChange={(e) => setNewBin({...newBin, description: e.target.value})} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenBin(false)} color="inherit">{t('Cancel')}</Button>
          <Button 
            variant="contained" 
            onClick={() => createBinMutation.mutate({ ...newBin, warehouse_id: selectedWarehouse?.id })}
          >
            {t('Add Bin')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// Helper components for consistency
const Avatar = ({ children, sx, ...props }: any) => (
  <Box 
    sx={{ 
      width: 40, height: 40, display: 'flex', alignItems: 'center', 
      justifyContent: 'center', borderRadius: 2, ...sx 
    }} 
    {...props}
  >
    {children}
  </Box>
);

const ListItemIcon = ({ children }: any) => (
  <Box sx={{ minWidth: 40, display: 'flex', alignItems: 'center' }}>
    {children}
  </Box>
);
