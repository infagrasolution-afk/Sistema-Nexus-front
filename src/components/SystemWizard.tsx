import { useState, useEffect } from 'react';
import { 
  Dialog, DialogContent, Box, Typography, Button, IconButton, 
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
      icon: <WelcomeIcon sx={{ fontSize: 70, color: '#38bdf8', filter: 'drop-shadow(0 0 15px rgba(56, 189, 248, 0.5))' }} />,
      color: '#38bdf8'
    },
    {
      title: "Módulo de Inventario (WMS)",
      subtitle: "Control absoluto de tus mercancías",
      description: "Registra productos con SKU único, categorías y límites de stock. Realiza 'Cargos' para saldos iniciales y 'Descargos' para retiros o mermas. El sistema recalcula automáticamente el Costo Promedio Ponderado con cada nueva entrada.",
      icon: <InventoryIcon sx={{ fontSize: 70, color: '#10b981', filter: 'drop-shadow(0 0 15px rgba(16, 185, 129, 0.5))' }} />,
      color: '#10b981'
    },
    {
      title: "Punto de Venta (POS)",
      subtitle: "Ventas y facturación fluidas",
      description: "Abre y cierra turnos de caja para controlar el efectivo. Procesa cobros rápidos en Bolívares o Divisas mediante múltiples métodos de pago (Efectivo, Pago Móvil, Punto de Venta o Transferencia). El stock se descarga instantáneamente.",
      icon: <SalesIcon sx={{ fontSize: 70, color: '#3b82f6', filter: 'drop-shadow(0 0 15px rgba(59, 130, 246, 0.5))' }} />,
      color: '#3b82f6'
    },
    {
      title: "Compras e Importaciones",
      subtitle: "Gestión inteligente de proveedores",
      description: "Registra compras a proveedores utilizando RIF/Cédula y cargando los costos unitarios de compra. El sistema sumará stock automáticamente y actualizará los costos del catálogo para mantener tus márgenes precisos.",
      icon: <ShoppingCartIcon sx={{ fontSize: 70, color: '#f59e0b', filter: 'drop-shadow(0 0 15px rgba(245, 158, 11, 0.5))' }} />,
      color: '#f59e0b'
    },
    {
      title: "Tesorería y CxC / CxP",
      subtitle: "Tus cuentas y flujo bajo control",
      description: "Monitorea cuentas por cobrar (CxC) de clientes y cuentas por pagar (CxP) a proveedores. Registra abonos y cobros parciales de manera ordenada, manteniendo el flujo de caja perfectamente cuadrado.",
      icon: <TreasuryIcon sx={{ fontSize: 70, color: '#8b5cf6', filter: 'drop-shadow(0 0 15px rgba(139, 92, 246, 0.5))' }} />,
      color: '#8b5cf6'
    },
    {
      title: "Bitácora Universal de Movimientos",
      subtitle: "Trazabilidad inmutable e informes transparentes",
      description: "Cada cargo, descargo, venta, compra y cierre de caja queda grabado de forma automática e inmutable en el historial del sistema con fecha, hora, usuario y descripción detallada, garantizando auditorías 100% transparentes.",
      icon: <AuditIcon sx={{ fontSize: 70, color: '#ec4899', filter: 'drop-shadow(0 0 15px rgba(236, 72, 153, 0.5))' }} />,
      color: '#ec4899'
    }
  ];

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
            overflow: 'hidden',
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          }
        }
      }}
    >
      <Box sx={{ position: 'relative', p: 4, pt: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <IconButton 
          onClick={handleClose}
          sx={{ position: 'absolute', top: 16, right: 16, color: 'text.secondary' }}
        >
          <CloseIcon />
        </IconButton>

        {/* Step Glowing Icon */}
        <Box 
          sx={{ 
            width: 120, 
            height: 120, 
            borderRadius: '30%', 
            bgcolor: `${current.color}15`, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            mb: 4,
            animation: 'float 3s ease-in-out infinite',
            '@keyframes float': {
              '0%, 100%': { transform: 'translateY(0)' },
              '50%': { transform: 'translateY(-8px)' }
            }
          }}
        >
          {current.icon}
        </Box>

        {/* Step Title & Content */}
        <Typography variant="h4" sx={{ fontWeight: 900, mb: 1, letterSpacing: '-0.5px' }}>
          {current.title}
        </Typography>
        <Typography variant="subtitle1" sx={{ color: current.color, fontWeight: 700, mb: 3 }}>
          {current.subtitle}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8, mb: 4, px: { xs: 1, sm: 3 }, fontSize: '1.02rem' }}>
          {current.description}
        </Typography>

        {/* Don't show again Checkbox on the last slide or any slide */}
        <FormControlLabel
          control={
            <Checkbox 
              checked={dontShowAgain} 
              onChange={(e) => setDontShowAgain(e.target.checked)} 
              color="primary"
            />
          }
          label={
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
              No volver a mostrar este asistente al iniciar sesión
            </Typography>
          }
          sx={{ mb: 4 }}
        />

        {/* Navigation Stepper & Buttons */}
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
          <Button
            size="large"
            disabled={activeStep === 0}
            onClick={handleBack}
            startIcon={<ArrowBackIcon />}
            sx={{ borderRadius: '14px', fontWeight: 700, textTransform: 'none', px: 3 }}
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
            size="large"
            variant="contained"
            onClick={handleNext}
            endIcon={activeStep === steps.length - 1 ? <FinishIcon /> : <ArrowForwardIcon />}
            sx={{ 
              borderRadius: '14px', 
              fontWeight: 800, 
              textTransform: 'none', 
              px: 4,
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
