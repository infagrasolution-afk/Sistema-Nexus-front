import { useState } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Chip } from '@mui/material';
import { Output as OutputIcon } from '@mui/icons-material';

export default function DispatchNotesPage() {
  const [notes] = useState([]);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <OutputIcon color="primary" fontSize="large" />
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main' }}>
            Notas de Despacho (Salidas)
          </Typography>
        </Box>
      </Box>

      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'background.default' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Nro. Despacho</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Fecha</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Almacén Origen</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Referencia</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {notes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No hay despachos registrados recientemente.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                notes.map((note: any) => (
                  <TableRow key={note.id} hover>
                    <TableCell>{note.number}</TableCell>
                    <TableCell>{new Date(note.date).toLocaleDateString()}</TableCell>
                    <TableCell>{note.warehouse_name}</TableCell>
                    <TableCell>{note.reference}</TableCell>
                    <TableCell>
                      <Chip label={note.status} size="small" color="info" />
                    </TableCell>
                    <TableCell align="right">
                      <Button size="small">Ver</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
