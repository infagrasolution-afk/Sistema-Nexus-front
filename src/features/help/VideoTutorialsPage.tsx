import { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Chip,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Stack,
} from '@mui/material';
import {
  SearchRounded as SearchIcon,
  PlayCircleFilledRounded as PlayIcon,
  CheckCircleOutlineRounded as CheckIcon,
  OndemandVideoRounded as VideoIcon,
  CloseRounded as CloseIcon,
  MenuBookRounded as ManualIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  TUTORIAL_VIDEOS,
  toYoutubeEmbedUrl,
  type TutorialVideoItem,
} from '../../config/tutorialVideos';

export default function VideoTutorialsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('Todos');
  const [activeVideo, setActiveVideo] = useState<TutorialVideoItem | null>(null);

  const groups = useMemo(() => {
    const unique = Array.from(new Set(TUTORIAL_VIDEOS.map((v) => v.moduleGroup)));
    return ['Todos', ...unique];
  }, []);

  const filteredVideos = useMemo(() => {
    const q = search.trim().toLowerCase();
    return TUTORIAL_VIDEOS.filter((video) => {
      const matchesGroup = selectedGroup === 'Todos' || video.moduleGroup === selectedGroup;
      if (!matchesGroup) return false;
      if (!q) return true;
      return (
        video.title.toLowerCase().includes(q) ||
        video.description.toLowerCase().includes(q) ||
        video.moduleGroup.toLowerCase().includes(q) ||
        video.topics.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [search, selectedGroup]);

  const embedUrl = activeVideo ? toYoutubeEmbedUrl(activeVideo.youtubeUrl) : null;

  return (
    <Box sx={{ maxWidth: 1280, mx: 'auto', p: { xs: 2, md: 3 } }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{ fontWeight: 900, letterSpacing: '-0.8px', display: 'flex', alignItems: 'center', gap: 1.2 }}
          >
            <VideoIcon color="primary" fontSize="large" />
            Centro de Videotutoriales
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mt: 0.5 }}>
            Guías audiovisuales paso a paso de cada módulo de APEX ERP para capacitar a tu equipo en minutos.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={<ManualIcon />}
          onClick={() => navigate('/manual')}
          sx={{ borderRadius: 2.5, fontWeight: 700, textTransform: 'none' }}
        >
          Ver Manual Escrito
        </Button>
      </Box>

      <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Buscar videotutorial por módulo, función o palabra clave (ej. POS, Facturación, Inventario, Nómina)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            },
          }}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: 'background.paper' } }}
        />

        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
          {groups.map((grp) => (
            <Chip
              key={grp}
              label={grp}
              clickable
              color={selectedGroup === grp ? 'primary' : 'default'}
              variant={selectedGroup === grp ? 'filled' : 'outlined'}
              onClick={() => setSelectedGroup(grp)}
              sx={{ fontWeight: 700, borderRadius: 2 }}
            />
          ))}
        </Stack>
      </Box>

      <Grid container spacing={2.5}>
        {filteredVideos.map((video) => {
          const hasLink = Boolean(toYoutubeEmbedUrl(video.youtubeUrl));
          return (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={video.id}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: '0 10px 28px rgba(15, 23, 42, 0.08)',
                    borderColor: 'primary.main',
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, gap: 1 }}>
                    <Chip
                      size="small"
                      color="primary"
                      variant="outlined"
                      label={`#${String(video.order).padStart(2, '0')} • ${video.moduleGroup}`}
                      sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                    />
                    <Chip
                      size="small"
                      color={hasLink ? 'success' : 'default'}
                      label={hasLink ? 'Disponible' : 'Próximamente'}
                      sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                    />
                  </Box>

                  <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.25, mb: 1 }}>
                    {video.title}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    {video.description}
                  </Typography>

                  <List dense disablePadding>
                    {video.topics.slice(0, 4).map((topic, i) => (
                      <ListItem key={i} disableGutters sx={{ py: 0.2 }}>
                        <ListItemIcon sx={{ minWidth: 24 }}>
                          <CheckIcon sx={{ fontSize: 15, color: 'success.main' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={topic}
                          slotProps={{ primary: { variant: 'caption', color: 'text.secondary', sx: { fontWeight: 600 } } }}
                        />
                      </ListItem>
                    ))}
                    {video.topics.length > 4 && (
                      <Typography variant="caption" color="primary.main" sx={{ fontWeight: 700, pl: 3 }}>
                        +{video.topics.length - 4} pasos más incluidos
                      </Typography>
                    )}
                  </List>
                </CardContent>

                <CardActions sx={{ px: 2, pb: 2 }}>
                  <Button
                    fullWidth
                    variant={hasLink ? 'contained' : 'outlined'}
                    startIcon={<PlayIcon />}
                    onClick={() => setActiveVideo(video)}
                    sx={{ borderRadius: 2.5, fontWeight: 800, textTransform: 'none' }}
                  >
                    {hasLink ? 'Reproducir Tutorial' : 'Ver Temario / Configurar Link'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Dialog
        open={Boolean(activeVideo)}
        onClose={() => setActiveVideo(null)}
        maxWidth="md"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
      >
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="caption" color="primary.main" sx={{ fontWeight: 800, display: 'block' }}>
              {activeVideo?.moduleGroup}
            </Typography>
            {activeVideo?.title}
          </Box>
          <Button size="small" color="inherit" onClick={() => setActiveVideo(null)} sx={{ minWidth: 36 }}>
            <CloseIcon />
          </Button>
        </DialogTitle>

        <DialogContent dividers>
          {embedUrl ? (
            <Box
              sx={{
                position: 'relative',
                paddingTop: '56.25%',
                borderRadius: 2,
                overflow: 'hidden',
                bgcolor: '#0f172a',
                mb: 2.5,
              }}
            >
              <Box
                component="iframe"
                src={embedUrl}
                title={activeVideo?.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 0,
                }}
              />
            </Box>
          ) : (
            <Alert severity="info" sx={{ mb: 2.5, borderRadius: 2 }}>
              Este video aún no tiene enlace de YouTube asignado. Sube el archivo{' '}
              <strong>{activeVideo?.fileSlug}</strong> a tu canal de YouTube y pega la URL en{' '}
              <code>frontend/src/config/tutorialVideos.ts</code>.
            </Alert>
          )}

          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
            Contenido paso a paso incluido en este video:
          </Typography>
          <List dense>
            {activeVideo?.topics.map((topic, idx) => (
              <ListItem key={idx} disableGutters sx={{ py: 0.3 }}>
                <ListItemIcon sx={{ minWidth: 28 }}>
                  <CheckIcon fontSize="small" color="success" />
                </ListItemIcon>
                <ListItemText primary={topic} />
              </ListItem>
            ))}
          </List>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button variant="contained" onClick={() => setActiveVideo(null)} sx={{ borderRadius: 2, fontWeight: 700 }}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

