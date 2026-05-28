import { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Grid, TextField, 
  MenuItem, IconButton, Divider, Card 
} from '@mui/material';
import { 
  LocalShipping as ShippingIcon, Add as AddIcon, Delete as DeleteIcon, 
  Print as PrintIcon, Person as PersonIcon, LocationOn as LocationOnIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '../../store/useAppStore';
import api from '../../api/axiosConfig';

interface DeliveryNoteItem {
  product_id: number;
  product_name: string;
  sku: string;
  quantity: number;
}

interface DeliveryNote {
  id: string;
  number: string;
  date: string;
  customer_name: string;
  customer_tax_id: string;
  delivery_address: string;
  phone: string;
  items: DeliveryNoteItem[];
  status: string;
}

export default function DeliveryNotesPage() {
  const tenant = useAppStore((state: any) => state.tenant) as any;
  const [notes, setNotes] = useState<DeliveryNote[]>([]);
  const [open, setOpen] = useState(false);
  
  // Form fields
  const [customerName, setCustomerName] = useState('');
  const [customerTaxId, setCustomerTaxId] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<DeliveryNoteItem[]>([]);

  // Fetch catalog products
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await api.get('/inventory/products');
      return res.data;
    }
  });

  // Load notes from localStorage on mount/tenant change
  useEffect(() => {
    if (tenant?.id) {
      const saved = localStorage.getItem(`nexus_delivery_notes_${tenant.id}`);
      if (saved) {
        setNotes(JSON.parse(saved));
      } else {
        setNotes([]);
      }
    }
  }, [tenant]);

  // Save notes to localStorage
  const saveNotes = (updatedNotes: DeliveryNote[]) => {
    if (tenant?.id) {
      localStorage.setItem(`nexus_delivery_notes_${tenant.id}`, JSON.stringify(updatedNotes));
      setNotes(updatedNotes);
    }
  };

  const handleOpenCreate = () => {
    setCustomerName('');
    setCustomerTaxId('');
    setDeliveryAddress('');
    setPhone('');
    setDate(new Date().toISOString().split('T')[0]);
    setItems([{ product_id: 0, product_name: '', sku: '', quantity: 1 }]);
    setOpen(true);
  };

  const handleAddItemRow = () => {
    setItems([...items, { product_id: 0, product_name: '', sku: '', quantity: 1 }]);
  };

  const handleRemoveItemRow = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
  };

  const handleItemChange = (index: number, field: keyof DeliveryNoteItem, value: any) => {
    const updated = [...items];
    if (field === 'product_id') {
      const prod = products.find((p: any) => p.id === value);
      if (prod) {
        updated[index].product_id = prod.id;
        updated[index].product_name = prod.name;
        updated[index].sku = prod.sku || '';
      }
    } else if (field === 'quantity') {
      updated[index].quantity = Number(value);
    }
    setItems(updated);
  };

  const handleSubmit = () => {
    if (!customerName || !deliveryAddress) return;

    // Filter valid selected items
    const validItems = items.filter(item => item.product_id > 0 && item.quantity > 0);
    if (validItems.length === 0) return;

    const nextSeq = notes.length + 1;
    const formattedSeq = String(nextSeq).padStart(4, '0');
    const noteNumber = `NE-${formattedSeq}`;

    const newNote: DeliveryNote = {
      id: String(Date.now()),
      number: noteNumber,
      date,
      customer_name: customerName,
      customer_tax_id: customerTaxId,
      delivery_address: deliveryAddress,
      phone,
      items: validItems,
      status: 'ENTREGADO'
    };

    const updatedNotes = [newNote, ...notes];
    saveNotes(updatedNotes);
    setOpen(false);
  };

  // Printable corporate PDF generation
  const handlePrint = (note: DeliveryNote) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const logoHtml = tenant?.logo_url 
      ? `<img src="${tenant.logo_url}" alt="Logo" style="max-height: 80px; object-fit: contain;" />`
      : `<div style="font-size: 24px; font-weight: 800; color: #2563eb;">${tenant?.name || 'NEXUS ERP'}</div>`;

    const itemsRows = note.items.map((item, idx) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">${idx + 1}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${item.sku}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${item.product_name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: bold;">${item.quantity}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Nota de Entrega ${note.number}</title>
          <style>
            body { font-family: 'Inter', sans-serif; color: #1e293b; margin: 40px; }
            .header-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .title { font-size: 28px; font-weight: 900; color: #0f172a; margin: 0; text-transform: uppercase; }
            .sub-title { font-size: 14px; color: #64748b; margin-top: 5px; }
            .meta-box { border: 1px solid #e2e8f0; padding: 15px; border-radius: 12px; margin-bottom: 25px; background: #f8fafc; }
            .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
            .meta-item { font-size: 13px; }
            .meta-item strong { color: #475569; }
            .products-table { width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 40px; }
            .products-table th { background: #f1f5f9; padding: 12px; text-align: left; font-size: 12px; font-weight: 700; color: #475569; border-bottom: 2px solid #cbd5e1; }
            .signature-container { display: flex; justify-content: space-between; margin-top: 80px; }
            .signature-box { width: 45%; text-align: center; border-top: 1px dashed #94a3b8; paddingTop: 10px; font-size: 13px; color: #475569; }
            @media print {
              body { margin: 20px; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <table class="header-table">
            <tr>
              <td style="vertical-align: top;">
                ${logoHtml}
                <div style="font-size: 12px; color: #64748b; margin-top: 5px;">
                  <strong>${tenant?.name || 'Nexus Corp'}</strong><br/>
                  Email: ${tenant?.email || 'admin@nexuserp.com'}<br/>
                  Rif / ID: J-00000000-0
                </div>
              </td>
              <td style="text-align: right; vertical-align: top;">
                <h1 class="title">Nota de Entrega</h1>
                <div style="font-size: 18px; font-weight: 700; color: #2563eb; margin-top: 5px;">${note.number}</div>
                <div style="font-size: 12px; color: #64748b; margin-top: 5px;">Fecha: ${new Date(note.date).toLocaleDateString()}</div>
              </td>
            </tr>
          </table>

          <div class="meta-box">
            <div style="font-weight: 800; font-size: 14px; margin-bottom: 10px; color: #0f172a; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">
              Información del Cliente y Despacho
            </div>
            <div class="meta-grid">
              <div class="meta-item">
                <strong>Cliente:</strong> ${note.customer_name}<br/>
                <strong>Cédula / RIF:</strong> ${note.customer_tax_id || 'N/A'}<br/>
                <strong>Teléfono:</strong> ${note.phone || 'N/A'}
              </div>
              <div class="meta-item">
                <strong>Dirección de Entrega:</strong> ${note.delivery_address}<br/>
                <strong>Estado de Entrega:</strong> <span style="background: #dcfce7; color: #15803d; padding: 2px 8px; border-radius: 9999px; font-weight: 700; font-size: 11px;">${note.status}</span>
              </div>
            </div>
          </div>

          <table class="products-table">
            <thead>
              <tr>
                <th style="width: 8%; text-align: center;">Item</th>
                <th style="width: 20%;">SKU / Código</th>
                <th>Descripción del Producto</th>
                <th style="width: 15%; text-align: center;">Cant. Entregada</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <div style="margin-top: 20px; font-size: 12px; color: #64748b; font-style: italic;">
            * La firma en este documento certifica que los productos fueron recibidos en perfectas condiciones y acordes a lo solicitado.
          </div>

          <div class="signature-container">
            <div class="signature-box" style="margin-top: 60px;">
              Entregado Por (Firma y Cédula)<br/>
              <strong>Despacho de Inventario NEXUS</strong>
            </div>
            <div class="signature-box" style="margin-top: 60px;">
              Recibido Conforme (Nombre, Firma y Fecha)<br/>
              <strong>Cliente / Receptor Autorizado</strong>
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ShippingIcon color="primary" fontSize="large" />
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main' }}>
            Notas de Entrega
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          sx={{ borderRadius: 3, textTransform: 'none', px: 3, fontWeight: 700 }}
        >
          Nueva Nota de Entrega
        </Button>
      </Box>

      <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'background.default' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Nro. Entrega</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Fecha</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Cliente</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Dirección</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {notes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <Typography color="text.secondary" variant="body1">No hay notas de entrega generadas aún.</Typography>
                    <Typography color="text.disabled" variant="body2" sx={{ mt: 0.5 }}>Utiliza el botón superior para crear tu primer documento.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                notes.map((note) => (
                  <TableRow key={note.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell sx={{ fontWeight: 600, color: 'primary.main' }}>{note.number}</TableCell>
                    <TableCell>{new Date(note.date).toLocaleDateString()}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{note.customer_name}</TableCell>
                    <TableCell>{note.delivery_address}</TableCell>
                    <TableCell>
                      <Chip label={note.status} size="small" color="success" sx={{ fontWeight: 700 }} />
                    </TableCell>
                    <TableCell align="right">
                      <Button 
                        size="small" 
                        variant="outlined" 
                        color="primary"
                        startIcon={<PrintIcon />}
                        onClick={() => handlePrint(note)}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                      >
                        Imprimir PDF
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Create Delivery Note Dialog */}
      <Dialog 
        open={open} 
        onClose={() => setOpen(false)} 
        maxWidth="md" 
        fullWidth 
        slotProps={{ paper: { sx: { borderRadius: 4, p: 1 } } }}
      >
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Generar Nueva Nota de Entrega</span>
          <IconButton onClick={() => setOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Nombre del Cliente"
                  fullWidth
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  slotProps={{ input: { startAdornment: <PersonIcon color="action" sx={{ mr: 1 }} /> } }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Cédula / RIF"
                  fullWidth
                  value={customerTaxId}
                  onChange={(e) => setCustomerTaxId(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Dirección de Entrega"
                  fullWidth
                  required
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  slotProps={{ input: { startAdornment: <LocationOnIcon color="action" sx={{ mr: 1 }} /> } }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Teléfono de Contacto"
                  fullWidth
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Fecha de Despacho"
                  type="date"
                  fullWidth
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>Productos a Entregar</Typography>
              <Button 
                variant="outlined" 
                startIcon={<AddIcon />} 
                onClick={handleAddItemRow}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
              >
                Añadir Producto
              </Button>
            </Box>

            {items.map((item, idx) => (
              <Card key={idx} variant="outlined" sx={{ mb: 2, borderRadius: 3, p: 2 }}>
                <Grid container spacing={2} sx={{ alignItems: 'center' }}>
                  <Grid size={{ xs: 12, sm: 7 }}>
                    <TextField
                      select
                      label="Seleccionar Producto del Catálogo"
                      fullWidth
                      value={item.product_id || ''}
                      onChange={(e) => handleItemChange(idx, 'product_id', e.target.value)}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                    >
                      <MenuItem value=""><em>-- Seleccionar --</em></MenuItem>
                      {products.map((p: any) => (
                        <MenuItem key={p.id} value={p.id}>
                          {p.name} (SKU: {p.sku || 'S/N'}) - Stock: {p.stock !== undefined ? p.stock : 0}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField
                      label="Cantidad"
                      type="number"
                      fullWidth
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 2 }} sx={{ display: 'flex', justifyContent: 'center' }}>
                    <IconButton 
                      color="error" 
                      onClick={() => handleRemoveItemRow(idx)}
                      disabled={items.length === 1}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              </Card>
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button 
            onClick={() => setOpen(false)} 
            color="inherit" 
            sx={{ fontWeight: 700 }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            sx={{ px: 4, borderRadius: 3, fontWeight: 700 }}
            disabled={!customerName || !deliveryAddress || items.some(item => !item.product_id)}
          >
            Generar Nota
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
