import { Box, Paper, Typography, Button, CircularProgress, Alert, Divider } from '@mui/material';
import { Download as DownloadIcon, ArrowBack as ArrowBackIcon, ContactSupport as ContactSupportIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';

import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';

export default function ManualPage() {
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ['manual-content'],
    queryFn: async () => {
      const res = await api.get('/manual/');
      return res.data;
    }
  });

  const handleDownload = () => {
    // Para descargar archivos con token Bearer de forma segura
    const token = localStorage.getItem('token');
    const url = `${api.defaults.baseURL || ''}/manual/download`;
    
    // Podemos hacer un fetch del blob o usar un hack de descarga con el token
    fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => response.blob())
    .then(blob => {
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = 'manual_usuario_nexus_erp.md';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    })
    .catch(err => {
      console.error('Error al descargar el manual', err);
      alert('No se pudo descargar el manual en este momento.');
    });
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress size={50} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4, p: 2 }}>
        <Alert severity="error">No se pudo cargar el manual de usuario. Intente más tarde.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/dashboard')}
          sx={{ borderRadius: 3, fontWeight: 700 }}
        >
          Volver al Tablero
        </Button>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined" 
            color="success"
            startIcon={<ContactSupportIcon />}
            href={`https://wa.me/584120161906?text=Hola,%20tengo%20una%20duda%20sobre%20el%20funcionamiento%20del%20ERP%20NEXUS.`}
            target="_blank"
            sx={{ borderRadius: 3, fontWeight: 700 }}
          >
            Soporte por WhatsApp
          </Button>

          <Button 
            variant="contained" 
            color="primary"
            startIcon={<DownloadIcon />} 
            onClick={handleDownload}
            sx={{ borderRadius: 3, fontWeight: 700, px: 3 }}
          >
            Descargar Manual (.md)
          </Button>
        </Box>
      </Box>

      <Paper elevation={0} sx={{ p: { xs: 3, md: 6 }, borderRadius: '24px', border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Typography variant="h3" sx={{ fontWeight: 900, mb: 1, letterSpacing: '-1.5px', background: 'linear-gradient(135deg, #0f172a 0%, #2563eb 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          {data?.title}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 600, mb: 4 }}>
          Manual de operaciones oficiales de NEXUS ERP Venezuela
        </Typography>
        <Divider sx={{ mb: 4 }} />
        
        {/* Renderizado simple y elegante del manual formateado */}
        <Box sx={{ 
          whiteSpace: 'pre-wrap', 
          fontFamily: 'system-ui, -apple-system, sans-serif',
          lineHeight: 1.8,
          color: 'text.primary',
          fontSize: '1.05rem',
          '& h1': { fontSize: '2rem', fontWeight: 800, mt: 4, mb: 2, letterSpacing: '-0.5px' },
          '& h2': { fontSize: '1.5rem', fontWeight: 800, mt: 4, mb: 2, color: 'primary.main', borderBottom: '1px solid', borderColor: 'divider', pb: 0.5 },
          '& h3': { fontSize: '1.2rem', fontWeight: 700, mt: 3, mb: 1 },
          '& ul': { pl: 3, mb: 2 },
          '& li': { mb: 1 },
          '& hr': { my: 4, border: 0, borderBottom: '1px solid', borderColor: 'divider' },
          '& code': { fontFamily: 'monospace', bgcolor: 'action.selected', px: 0.7, py: 0.2, borderRadius: 1, fontSize: '0.9em' }
        }}>
          {/* Simple parseado de Markdown a HTML inline para evitar dependencias externas */}
          {data?.content_markdown.split('\n').map((line: string, i: number) => {
            if (line.startsWith('# ')) {
              return <Typography key={i} variant="h4" sx={{ fontWeight: 900, mt: 4, mb: 2, letterSpacing: '-0.8px' }}>{line.replace('# ', '')}</Typography>;
            }
            if (line.startsWith('## ')) {
              return (
                <Box key={i} sx={{ mt: 5, mb: 2 }}>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main' }}>{line.replace('## ', '')}</Typography>
                  <Divider sx={{ mt: 1, mb: 2 }} />
                </Box>
              );
            }
            if (line.startsWith('### ')) {
              return <Typography key={i} variant="h6" sx={{ fontWeight: 700, mt: 3, mb: 1 }}>{line.replace('### ', '')}</Typography>;
            }
            if (line.startsWith('* ')) {
              return <Typography key={i} variant="body1" component="div" sx={{ pl: 2, display: 'flex', gap: 1, mb: 0.5 }}>• {line.replace('* ', '')}</Typography>;
            }
            if (line.trim() === '---') {
              return <Divider key={i} sx={{ my: 4 }} />;
            }
            // Formatear texto en negrita inline
            if (line.includes('**')) {
              const parts = line.split('**');
              return (
                <Typography key={i} variant="body1" sx={{ mb: 1.5 }}>
                  {parts.map((part, index) => index % 2 === 1 ? <strong key={index} style={{ fontWeight: 800 }}>{part}</strong> : part)}
                </Typography>
              );
            }
            return <Typography key={i} variant="body1" sx={{ mb: 1.5, color: 'text.secondary' }}>{line}</Typography>;
          })}
        </Box>
      </Paper>
    </Box>
  );
}
