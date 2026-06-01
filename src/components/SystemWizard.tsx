import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Dialog, Box, Typography, Button, IconButton, 
  Checkbox, FormControlLabel, MobileStepper, useTheme
} from '@mui/material';
import { 
  Close as CloseIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon,
  EmojiObjects as WelcomeIcon,
  Inventory as InventoryIcon,
  PointOfSale as SalesIcon,
  ShoppingCart as ShoppingCartIcon,
  AccountBalanceWallet as TreasuryIcon,
  Security as AuditIcon,
  CheckCircle as FinishIcon
} from '@mui/icons-material';

export default function SystemWizard() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    // Automatically trigger the wizard on login/startup if enabled
    const enabled = localStorage.getItem('nexus_wizard_enabled') !== 'false';
    const hasPromptedThisSession = sessionStorage.getItem('nexus_wizard_prompted') === 'true';
    
    if (enabled && !hasPromptedThisSession) {
      setOpen(true);
      sessionStorage.setItem('nexus_wizard_prompted', 'true');
    }
  }, []);

  const steps = [
    {
      title: "¡Bienvenido a NEXUS ERP!",
      subtitle: "Tu centro de control empresarial inteligente",
      description: "NEXUS ERP te permite automatizar la facturación, controlar inventarios con costeo promedio ponderado, realizar auditorías mediante una bitácora inmutable y monitorear tu flujo de caja en tiempo real. ¡Hagamos un recorrido rápido por el sistema!",
      icon: (size: number) => <WelcomeIcon sx={{ fontSize: size, color: '#38bdf8', filter: 'drop-shadow(0 0 15px rgba(56, 189, 248, 0.5))' }} />,
      color: '#38bdf8',
      path: '/dashboard'
    },
    {
      title: "Módulo de Inventario (WMS)",
      subtitle: "Control absoluto de tus mercancías",
      description: "Registra productos con SKU único, categorías y límites de stock. Realiza 'Cargos' para saldos iniciales y 'Descargos' para retiros o mermas. El sistema recalcula automáticamente el Costo Promedio Ponderado con cada nueva entrada.",
      icon: (size: number) => <InventoryIcon sx={{ fontSize: size, color: '#10b981', filter: 'drop-shadow(0 0 15px rgba(16, 185, 129, 0.5))' }} />,
      color: '#10b981',
      path: '/catalog'
    },
    {
      title: "Punto de Venta (POS)",
      subtitle: "Ventas y facturación fluidas",
      description: "Abre y cierra turnos de caja para controlar el efectivo. Procesa cobros rápidos en Bolívares o Divisas mediante múltiples métodos de pago (Efectivo, Pago Móvil, Punto de Venta o Transferencia). El stock se descarga instantáneamente.",
      icon: (size: number) => <SalesIcon sx={{ fontSize: size, color: '#3b82f6', filter: 'drop-shadow(0 0 15px rgba(59, 130, 246, 0.5))' }} />,
      color: '#3b82f6',
      path: '/sales'
    },
    {
      title: "Compras e Importaciones",
      subtitle: "Gestión inteligente de proveedores",
      description: "Registra compras a proveedores utilizando RIF/Cédula y cargando los costos unitarios de compra. El sistema sumará stock automáticamente y actualizará los costos del catálogo para mantener tus márgenes precisos.",
      icon: (size: number) => <ShoppingCartIcon sx={{ fontSize: size, color: '#f59e0b', filter: 'drop-shadow(0 0 15px rgba(245, 158, 11, 0.5))' }} />,
      color: '#f59e0b',
      path: '/purchases'
    },
    {
      title: "Tesorería y CxC / CxP",
      subtitle: "Tus cuentas y flujo bajo control",
      description: "Monitorea cuentas por cobrar (CxC) de clientes y cuentas por pagar (CxP) a proveedores. Registra abonos y cobros parciales de manera ordenada, manteniendo el flujo de caja perfectamente cuadrado.",
      icon: (size: number) => <TreasuryIcon sx={{ fontSize: size, color: '#8b5cf6', filter: 'drop-shadow(0 0 15px rgba(139, 92, 246, 0.5))' }} />,
      color: '#8b5cf6',
      path: '/accounting'
    },
    {
      title: "Bitácora Universal de Movimientos",
      subtitle: "Trazabilidad inmutable e informes transparentes",
      description: "Cada cargo, descargo, venta, compra y cierre de caja queda grabado de forma automática e inmutable en el historial del sistema con fecha, hora, usuario y descripción detallada, garantizando auditorías 100% transparentes.",
      icon: (size: number) => <AuditIcon sx={{ fontSize: size, color: '#ec4899', filter: 'drop-shadow(0 0 15px rgba(236, 72, 153, 0.5))' }} />,
      color: '#ec4899',
      path: '/dashboard'
    }
  ];

  useEffect(() => {
    if (open) {
      const current = steps[activeStep];
      if (current && current.path) {
        navigate(current.path);
      }
    }
  }, [activeStep, open]);

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep((prev) => prev + 1);
    } else {
      handleClose();
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep((prev) => prev - 1);
    }
  };

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('nexus_wizard_enabled', 'false');
    }
    setOpen(false);
  };

  const current = steps[activeStep];

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: '24px',
            maxHeight: 'calc(100vh - 48px)', // Set max height to prevent viewport overflow
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden', // Crop border radius
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          }
        }
      }}
    >
      <Box 
        sx={{ 
          position: 'relative', 
          p: { xs: 2.5, sm: 4 }, 
          pt: { xs: 4.5, sm: 6 }, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          textAlign: 'center',
          overflowY: 'auto', // Enable vertical scrolling when screen is short or zoomed in
          flexGrow: 1
        }}
      >
        <IconButton 
          onClick={handleClose}
          sx={{ position: 'absolute', top: 12, right: 12, color: 'text.secondary' }}
        >
          <CloseIcon />
        </IconButton>

        {/* Step Glowing Icon (Responsive size) */}
        <Box 
          sx={{ 
            width: { xs: 80, sm: 100 }, 
            height: { xs: 80, sm: 100 }, 
            borderRadius: '30%', 
            bgcolor: `${current.color}15`, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            mb: { xs: 2.5, sm: 3 },
            animation: 'float 3s ease-in-out infinite',
            '@keyframes float': {
              '0%, 100%': { transform: 'translateY(0)' },
              '50%': { transform: 'translateY(-6px)' }
            }
          }}
        >
          {current.icon(theme.breakpoints.down('sm') ? 48 : 56)}
        </Box>

        {/* Step Title & Content */}
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 900, 
            mb: 1, 
            letterSpacing: '-0.5px',
            fontSize: { xs: '1.45rem', sm: '1.85rem' } 
          }}
        >
          {current.title}
        </Typography>
        <Typography 
          variant="subtitle1" 
          sx={{ 
            color: current.color, 
            fontWeight: 700, 
            mb: { xs: 1.5, sm: 2.5 },
            fontSize: { xs: '0.88rem', sm: '1rem' }
          }}
        >
          {current.subtitle}
        </Typography>
        <Typography 
          variant="body1" 
          color="text.secondary" 
          sx={{ 
            lineHeight: 1.65, 
            mb: { xs: 2, sm: 3.5 }, 
            px: { xs: 1, sm: 3 }, 
            fontSize: { xs: '0.88rem', sm: '0.98rem' } 
          }}
        >
          {current.description}
        </Typography>

        {/* Don't show again Checkbox (Compressed spacing) */}
        <FormControlLabel
          control={
            <Checkbox 
              checked={dontShowAgain} 
              onChange={(e) => setDontShowAgain(e.target.checked)} 
              color="primary"
              size="small"
            />
          }
          label={
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: { xs: '0.78rem', sm: '0.88rem' } }}>
              No volver a mostrar este asistente al iniciar sesión
            </Typography>
          }
          sx={{ mb: { xs: 2, sm: 3.5 } }}
        />

        {/* Navigation Stepper & Buttons (Flexible positioning) */}
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
          <Button
            size="medium"
            disabled={activeStep === 0}
            onClick={handleBack}
            startIcon={<ArrowBackIcon />}
            sx={{ borderRadius: '12px', fontWeight: 700, textTransform: 'none', px: { xs: 1.5, sm: 2.5 } }}
          >
            Atrás
          </Button>

          <MobileStepper
            variant="dots"
            steps={steps.length}
            position="static"
            activeStep={activeStep}
            sx={{ bgcolor: 'transparent', flexGrow: 1, justifyContent: 'center' }}
            nextButton={null}
            backButton={null}
          />

          <Button
            size="medium"
            variant="contained"
            onClick={handleNext}
            endIcon={activeStep === steps.length - 1 ? <FinishIcon /> : <ArrowForwardIcon />}
            sx={{ 
              borderRadius: '12px', 
              fontWeight: 800, 
              textTransform: 'none', 
              px: { xs: 2, sm: 3 },
              bgcolor: current.color,
              '&:hover': {
                bgcolor: current.color,
                filter: 'brightness(0.9)',
                transform: 'translateY(-1px)'
              }
            }}
          >
            {activeStep === steps.length - 1 ? 'Finalizar' : 'Siguiente'}
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
}
