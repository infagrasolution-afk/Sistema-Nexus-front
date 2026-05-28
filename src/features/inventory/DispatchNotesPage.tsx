import { useState } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Button, Chip, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, Grid, MenuItem, IconButton, Divider, CircularProgress,
  Snackbar, Alert
} from '@mui/material';
import { 
  Output as OutputIcon, 
  Add as AddIcon, 
  Delete as DeleteIcon, 
  LocalShipping as ShippingIcon,
  CheckCircle as CheckIcon,
  PictureAsPdf as PdfIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axiosConfig';

export default function DispatchNotesPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'warning' });

  // Creation form states
  const [sourceWarehouseId, setSourceWarehouseId] = useState<number | ''>('');
  const [destinationWarehouseId, setDestinationWarehouseId] = useState<number | ''>('');
  const [reference, setReference] = useState('');
  const [items, setItems] = useState<{ product_id: number | ''; quantity: number }[]>([
    { product_id: '', quantity: 1 }
  ]);

  // Fetch real data
  const { data: notes = [], isLoading: isLoadingNotes } = useQuery({
    queryKey: ['dispatch-notes'],
    queryFn: async () => (await api.get('/inventory/dispatch-notes')).data,
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => (await api.get('/inventory/warehouses')).data,
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => (await api.get('/inventory/products')).data,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (newNote: any) => {
      const response = await api.post('/inventory/dispatch-notes', newNote);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispatch-notes'] });
      showToast('Nota de entrega/despacho creada con éxito', 'success');
      handleCloseDialog();
    },
    onError: (error: any) => {
      showToast(error.response?.data?.detail || 'Error al crear la nota', 'error');
    }
  });

  const confirmDispatchMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post(`/inventory/dispatch-notes/${id}/dispatch`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispatch-notes'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      showToast('Despacho confirmado y stock actualizado con éxito', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.detail || 'Error al procesar el despacho', 'error');
    }
  });

  const showToast = (message: string, severity: 'success' | 'error' | 'warning') => {
    setToast({ open: true, message, severity });
  };

  const handleOpenCreate = () => {
    setSourceWarehouseId('');
    setDestinationWarehouseId('');
    setReference('');
    setItems([{ product_id: '', quantity: 1 }]);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleAddItem = () => {
    setItems([...items, { product_id: '', quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceWarehouseId || !destinationWarehouseId) {
      showToast('Debe seleccionar los almacenes de origen y destino', 'error');
      return;
    }
    if (sourceWarehouseId === destinationWarehouseId) {
      showToast('Los almacenes de origen y destino no pueden ser iguales', 'error');
      return;
    }

    const filteredItems = items.filter(item => item.product_id !== '' && item.quantity > 0);
    if (filteredItems.length === 0) {
      showToast('Debe agregar al menos un producto válido', 'error');
      return;
    }

    createMutation.mutate({
      source_warehouse_id: Number(sourceWarehouseId),
      destination_warehouse_id: Number(destinationWarehouseId),
      reference,
      items: filteredItems.map(item => ({
        product_id: Number(item.product_id),
        quantity: Number(item.quantity)
      }))
    });
  };

  // Printable Delivery Note Generation
  const handlePrint = (note: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Por favor, permite ventanas emergentes para imprimir la nota', 'warning');
      return;
    }

    const itemsHtml = note.items.map((item: any) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px;"><strong>${item.product?.sku || 'N/A'}</strong></td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px;">${item.product?.name || 'Producto'}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: center; text-transform: uppercase;">${item.product?.unit_of_measure || 'unid'}</td>
      </tr>
    `).join('');

    const formattedDate = new Date(note.created_at || new Date()).toLocaleDateString();

    const htmlContent = `
      <html>
      <head>
        <title>Nota de Entrega #${note.id.toString().padStart(6, '0')}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; margin: 40px; line-height: 1.5; }
          .header-container { display: flex; justify-content: space-between; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
          .company-logo { font-size: 32px; font-weight: 900; color: #2563eb; letter-spacing: -1.5px; }
          .company-info { text-align: right; font-size: 12px; color: #475569; line-height: 1.6; }
          .document-title { font-size: 24px; font-weight: 800; margin-bottom: 25px; color: #0f172a; text-transform: uppercase; letter-spacing: -0.5px; }
          .metadata-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
          .meta-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 18px; border-radius: 12px; font-size: 13px; }
          .meta-card h4 { margin: 0 0 10px 0; color: #1e293b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; }
          .meta-card p { margin: 6px 0; color: #334155; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 40px; margin-top: 10px; }
          th { background: #2563eb; color: #ffffff; text-align: left; padding: 12px 10px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
          .signatures { display: flex; justify-content: space-between; margin-top: 90px; }
          .sig-line { width: 45%; border-top: 2px dashed #94a3b8; text-align: center; padding-top: 12px; font-size: 12px; color: #475569; font-weight: 600; }
          @media print {
            body { margin: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="header-container">
          <div>
            <div class="company-logo">KPRISHOP</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 4px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">Sistema de Gestión ERP</div>
          </div>
          <div class="company-info">
            <strong>R.I.F:</strong> J-40899123-5<br/>
            <strong>Dirección:</strong> Av. Principal Las Mercedes, Edif. Kprishop, Caracas<br/>
            <strong>Teléfono:</strong> +58 (212) 993-4567<br/>
            <strong>Email:</strong> contacto@kprishop.com
          </div>
        </div>

        <div class="document-title">Nota de Entrega / Despacho</div>

        <div class="metadata-grid">
          <div class="meta-card">
            <h4>Información de la Nota</h4>
            <p><strong>Nro. Nota:</strong> ND-${note.id.toString().padStart(6, '0')}</p>
            <p><strong>Fecha de Emisión:</strong> ${formattedDate}</p>
            <p><strong>Referencia / Cliente:</strong> ${note.reference || 'Cliente General'}</p>
            <p><strong>Estado Actual:</strong> ${note.status === 'RECEIVED' ? 'RECIBIDO / DESPACHADO' : 'PENDIENTE POR ENTREGAR'}</p>
          </div>
          <div class="meta-card">
            <h4>Ubicaciones de Inventario</h4>
            <p><strong>Almacén Origen:</strong> ${note.source_warehouse?.name || 'Almacén Principal'}</p>
            <p><strong>Almacén Destino:</strong> ${note.destination_warehouse?.name || 'Almacén Sucursal'}</p>
          </div>
        </div>

        <table style="width: 100%;">
          <thead>
            <tr>
              <th style="width: 25%">SKU / Código</th>
              <th style="width: 45%">Descripción del Producto</th>
              <th style="width: 15%; text-align: center;">Cantidad</th>
              <th style="width: 15%; text-align: center;">U.M.</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div style="margin-top: 40px; font-size: 12px; color: #64748b;">
          * La firma en esta nota de entrega constituye la aceptación conforme del material descrito en la tabla de cantidades y especificaciones.
        </div>

        <div class="signatures">
          <div class="sig-line">Entregado por (Firma y C.I.)</div>
          <div class="sig-line">Recibido Conforme por (Firma y C.I.)</div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
      
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ bgcolor: 'primary.50', p: 1.5, borderRadius: '12px', color: 'primary.main' }}>
            <OutputIcon fontSize="large" />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>
              Notas de Entrega y Despacho
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Genera notas de entrega con membrete corporativo, gestiona traslados y emite PDFs oficiales
            </Typography>
          </Box>
        </Box>
        
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={handleOpenCreate}
          sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, px: 3 }}
        >
          Crear Nota de Entrega
        </Button>
      </Box>

      {/* Main Content Table */}
      {isLoadingNotes ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper elevation={0} sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: 'grey.50' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Nro. Nota</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Cliente / Referencia</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Almacén Origen</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Almacén Destino</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Items</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {notes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                      <Typography color="text.secondary" sx={{ fontWeight: 600 }}>
                        No hay notas de entrega ni despachos registrados recientemente.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  notes.map((note: any) => (
                    <TableRow key={note.id} hover>
                      <TableCell sx={{ fontWeight: 800 }}>ND-{note.id.toString().padStart(6, '0')}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{note.reference || 'Cliente General'}</TableCell>
                      <TableCell>{note.source_warehouse?.name || 'Origen'}</TableCell>
                      <TableCell>{note.destination_warehouse?.name || 'Destino'}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{note.items?.length || 0} productos</TableCell>
                      <TableCell>
                        <Chip 
                          label={note.status === 'RECEIVED' ? 'Recibido' : 'Pendiente'} 
                          color={note.status === 'RECEIVED' ? 'success' : 'warning'} 
                          size="small" 
                          sx={{ fontWeight: 700, borderRadius: '6px' }}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ pr: 3 }}>
                        <IconButton 
                          color="primary" 
                          onClick={() => handlePrint(note)}
                          title="Imprimir / PDF"
                          sx={{ bgcolor: 'primary.50', mr: 1, '&:hover': { bgcolor: 'primary.100' } }}
                        >
                          <PdfIcon fontSize="small" />
                        </IconButton>
                        
                        {note.status !== 'RECEIVED' && (
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            onClick={() => confirmDispatchMutation.mutate(note.id)}
                            startIcon={<CheckIcon />}
                            disabled={confirmDispatchMutation.isPending}
                            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700 }}
                          >
                            Despachar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Creation Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth sx={{ '& .MuiDialog-paper': { borderRadius: '16px' } }}>
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <ShippingIcon color="primary" /> Nueva Nota de Entrega / Traslado
          </DialogTitle>
          <Divider />
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 0.5 }}>
              
              {/* Reference */}
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Referencia / Nombre del Cliente"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Ej. Distribuidora Polar, Inversiones García C.A."
                  size="small"
                  required
                />
              </Grid>

              {/* Warehouses */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Almacén de Origen (Envía stock)"
                  value={sourceWarehouseId}
                  onChange={(e) => setSourceWarehouseId(Number(e.target.value))}
                  size="small"
                  required
                >
                  {warehouses.map((w: any) => (
                    <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Almacén de Destino (Recibe stock)"
                  value={destinationWarehouseId}
                  onChange={(e) => setDestinationWarehouseId(Number(e.target.value))}
                  size="small"
                  required
                >
                  {warehouses.map((w: any) => (
                    <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid size={12}>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Productos y Cantidades a Entregar
                  </Typography>
                  <Button 
                    size="small" 
                    startIcon={<AddIcon />} 
                    onClick={handleAddItem}
                    sx={{ fontWeight: 700 }}
                  >
                    Agregar Producto
                  </Button>
                </Box>
              </Grid>

              {/* Dynamic Items list */}
              {items.map((item, index) => (
                <Grid container spacing={2} key={index} sx={{ px: 2, mb: 1, alignItems: 'center' }}>
                  <Grid size={7}>
                    <TextField
                      select
                      fullWidth
                      label="Seleccionar Producto"
                      value={item.product_id}
                      onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                      size="small"
                      required
                    >
                      {products.map((p: any) => (
                        <MenuItem key={p.id} value={p.id}>
                          {p.name} (SKU: {p.sku}) - Stock: {p.stock}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid size={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Cantidad"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                      slotProps={{ htmlInput: { min: 1 } }}
                      size="small"
                      required
                    />
                  </Grid>

                  <Grid size={2}>
                    <IconButton 
                      color="error" 
                      onClick={() => handleRemoveItem(index)}
                      disabled={items.length === 1}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              ))}

            </Grid>
          </DialogContent>
          <Divider />
          <DialogActions sx={{ p: 2.5, gap: 1 }}>
            <Button onClick={handleCloseDialog} color="inherit" sx={{ fontWeight: 600, textTransform: 'none' }}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={createMutation.isPending}
              sx={{ fontWeight: 700, textTransform: 'none', px: 3, borderRadius: '8px' }}
            >
              {createMutation.isPending ? 'Guardando...' : 'Crear Nota de Entrega'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Snackbar Toast */}
      <Snackbar 
        open={toast.open} 
        autoHideDuration={5000} 
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
