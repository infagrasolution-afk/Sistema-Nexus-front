import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog, Box, Typography, Button, IconButton,
  Checkbox, FormControlLabel, MobileStepper, useTheme,
  Chip, Tooltip, CircularProgress, Alert
} from '@mui/material';
import {
  Close as CloseIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon,
  EmojiObjects as WelcomeIcon,
  Inventory as InventoryIcon,
  PointOfSale as SalesIcon,
  Description as ManualInvoiceIcon,
  ShoppingCart as ShoppingCartIcon,
  AccountBalanceWallet as TreasuryIcon,
  Gavel as FiscalIcon,
  Badge as PayrollIcon,
  Settings as SettingsIcon,
  CheckCircle as FinishIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Replay as ReplayIcon,
  AutoMode as AutoPlayIcon,
  Dataset as SeedDemoIcon
} from '@mui/icons-material';
import { useQueryClient } from '@tanstack/react-query';
import api from '../api/axiosConfig';
import { useAppStore } from '../store/useAppStore';

interface InductionStep {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  voiceScript: string;
  color: string;
  path: string;
  icon: (size: number) => React.ReactNode;
}

export default function SystemWizard() {
  const theme = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { tenant } = useAppStore();

  const [open, setOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // Audio / Voice Agent State
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [autoTour, setAutoTour] = useState(false);

  // Demo Data Seeding State
  const [seedingDemo, setSeedingDemo] = useState(false);
  const [seedMessage, setSeedMessage] = useState<{ text: string; severity: 'success' | 'error' } | null>(null);

  const autoTourRef = useRef(autoTour);
  autoTourRef.current = autoTour;
  const activeStepRef = useRef(activeStep);
  activeStepRef.current = activeStep;

  const allSteps: InductionStep[] = [
    {
      id: 'welcome',
      title: '¡Bienvenido a APEX ERP Venezuela!',
      subtitle: 'Agente Virtual de Inducción Guiada con Audio',
      description:
        'Soy tu Agente Instructor de APEX ERP. Te guiaré paso a paso por todos los módulos del sistema adaptados a las leyes de Venezuela: SENIAT, Ley de IGTF, Tasa Oficial BCV, VEN-NIF y LOTTT. También puedes cargar datos de demostración con un clic.',
      voiceScript:
        'Bienvenido a APEX E R P. Soy tu agente virtual de inducción. En este recorrido conocerás cómo funciona nuestro sistema empresarial adaptado cien por ciento a las leyes de Venezuela: facturación térmica y digital en paralelo según el SENIAT, manejo de tres niveles de precios, tasa oficial del Banco Central de Venezuela, I G T F del tres por ciento, retenciones de IVA y nómina L O T T T.',
      icon: (size: number) => <WelcomeIcon sx={{ fontSize: size, color: '#38bdf8', filter: 'drop-shadow(0 0 15px rgba(56, 189, 248, 0.5))' }} />,
      color: '#38bdf8',
      path: '/dashboard',
    },
    {
      id: 'inventory',
      title: 'Catálogo e Inventario WMS (3 Precios)',
      subtitle: 'Precio 1 por Defecto, Precio 2 Mayor y Precio 3 VIP',
      description:
        'Cada producto cuenta con SKU, control de stock mínimo/máximo, Costo Promedio Ponderado y 3 niveles de precios en divisas con conversión automática a Bolívares según tasa BCV, además de indicador Exento o Gravado con IVA 16%.',
      voiceScript:
        'Estamos en el módulo de Catálogo e Inventario. Aquí registras tus productos con tres niveles de precios: el Precio uno por defecto para detal, el Precio dos para ventas al mayor, y el Precio tres para distribuidores o clientes VIP. El sistema calcula automáticamente el costo promedio ponderado y convierte los montos a bolívares a la tasa oficial del B C V.',
      icon: (size: number) => <InventoryIcon sx={{ fontSize: size, color: '#10b981', filter: 'drop-shadow(0 0 15px rgba(16, 185, 129, 0.5))' }} />,
      color: '#10b981',
      path: '/catalog',
    },
    {
      id: 'sales',
      title: 'Punto de Venta (POS) — Térmica + Digital',
      subtitle: 'Emisión en paralelo autorizada por el SENIAT',
      description:
        'En el Punto de Venta puedes elegir el Precio 1, 2 o 3 para toda la venta o por artículo, cobrar en Bolívares o Divisas (calculando el 3% de IGTF automáticamente) e imprimir en paralelo por Impresora Térmica (80mm/58mm) y Factura Digital SENIAT.',
      voiceScript:
        'Este es el Punto de Venta. Al facturar, el Precio uno viene seleccionado por defecto, pero puedes cambiar en cualquier momento al Precio dos o Precio tres de forma global o por producto. Además, cumpliendo con el SENIAT en Venezuela, puedes emitir en paralelo tanto el ticket en impresora térmica de ochenta o cincuenta y ocho milímetros como la factura digital con el logo de tu empresa.',
      icon: (size: number) => <SalesIcon sx={{ fontSize: size, color: '#3b82f6', filter: 'drop-shadow(0 0 15px rgba(59, 130, 246, 0.5))' }} />,
      color: '#3b82f6',
      path: '/sales',
    },
    {
      id: 'manual_billing',
      title: 'Facturación Manual e Integración API Digital',
      subtitle: 'Envío de JSON vía API REST a Imprenta Digital SENIAT',
      description:
        'Emite facturas administrativas a crédito o contado con todos los requisitos legales de Venezuela (RIF, Domicilio Fiscal, N° de Factura, N° de Control 00-XXXXXXXX, Exento, Base Imponible, IVA 16%, IGTF 3% y Equivalente BCV) y transmite el JSON vía API REST al proveedor de Factura Digital.',
      voiceScript:
        'En Facturación Manual puedes emitir facturas administrativas a crédito o de contado, importar presupuestos y elegir entre los tres precios configurados. Al emitir la factura, el sistema genera el documento con el logo corporativo y todos los requisitos fiscales del SENIAT, y además envía la estructura J S O N vía A P I REST a la empresa proveedora de facturación digital.',
      icon: (size: number) => <ManualInvoiceIcon sx={{ fontSize: size, color: '#6366f1', filter: 'drop-shadow(0 0 15px rgba(99, 102, 241, 0.5))' }} />,
      color: '#6366f1',
      path: '/sales/manual-billing',
    },
    {
      id: 'purchases',
      title: 'Compras, Órdenes de Compra y Retención IVA',
      subtitle: 'Providencia Administrativa SENIAT SNAT/2015/0049',
      description:
        'Registra Órdenes de Compra con el logo de la empresa, recepciona mercancía alimentando el inventario automáticamente y genera el Comprobante Oficial de Retención de IVA (75% o 100%) en PDF con correlativo de 14 dígitos.',
      voiceScript:
        'En el módulo de Compras gestionas tus proveedores, imprimes órdenes de compra con el logo de tu empresa y registras las facturas de compra con su número de control. Si eres contribuyente especial, el sistema emite automáticamente el comprobante oficial de retención de IVA de catorce dígitos exigido por el SENIAT.',
      icon: (size: number) => <ShoppingCartIcon sx={{ fontSize: size, color: '#f59e0b', filter: 'drop-shadow(0 0 15px rgba(245, 158, 11, 0.5))' }} />,
      color: '#f59e0b',
      path: '/purchases',
    },
    {
      id: 'treasury',
      title: 'Tesorería, Bancos, CxC y CxP Bimonetaria',
      subtitle: 'Control financiero en Dólares y Bolívares',
      description:
        'Administra cuentas bancarias nacionales (VES) y en divisas (USD/Zelle), controla el arqueo de caja bimonetario y lleva el seguimiento detallado de Cuentas por Cobrar a clientes y Cuentas por Pagar a proveedores.',
      voiceScript:
        'En Tesorería controlas tus cuentas bancarias en bolívares y en divisas, así como las cuentas por cobrar de ventas a crédito y las cuentas por pagar a proveedores, registrando abonos parciales o totales con trazabilidad completa.',
      icon: (size: number) => <TreasuryIcon sx={{ fontSize: size, color: '#8b5cf6', filter: 'drop-shadow(0 0 15px rgba(139, 92, 246, 0.5))' }} />,
      color: '#8b5cf6',
      path: '/ar',
    },
    {
      id: 'fiscal',
      title: 'Libros Fiscales SENIAT y Reportes Tributarios',
      subtitle: 'Libro de Ventas, Libro de Compras, TXT IVA y XML ISLR',
      description:
        'Exporta con un clic el Libro de Ventas y el Libro de Compras con todas las columnas exigidas por el SENIAT, el resumen de la Forma 30 de IVA, el archivo TXT de retenciones de IVA y el XML de ISLR.',
      voiceScript:
        'En la sección de Reportes y Fiscal cuentas con la generación automática del Libro de Ventas y Libro de Compras del SENIAT en formato Excel, además de las notas de entrega, notas de crédito y notas de débito con el logo de tu empresa.',
      icon: (size: number) => <FiscalIcon sx={{ fontSize: size, color: '#ec4899', filter: 'drop-shadow(0 0 15px rgba(236, 72, 153, 0.5))' }} />,
      color: '#ec4899',
      path: '/reports',
    },
    {
      id: 'payroll',
      title: 'Nómina y Recursos Humanos (LOTTT)',
      subtitle: 'SSO 4%, RPE 0.5%, FAOV 1% y Cestaticket Socialista',
      description:
        'Calcula quincenas y nóminas mensuales conforme a la Ley Orgánica del Trabajo (LOTTT), aplicando deducciones legales venezolanas y generando Recibos de Pago en PDF con el logo de la empresa.',
      voiceScript:
        'El módulo de Nómina cumple con la L O T T T de Venezuela. Calcula automáticamente el salario base, el Cestaticket Socialista y las deducciones de ley como Seguro Social Obligatorio, Régimen Prestacional de Empleo y FAOV, emitiendo los recibos de pago con el logo de la empresa.',
      icon: (size: number) => <PayrollIcon sx={{ fontSize: size, color: '#14b8a6', filter: 'drop-shadow(0 0 15px rgba(20, 184, 166, 0.5))' }} />,
      color: '#14b8a6',
      path: '/payroll',
    },
    {
      id: 'settings',
      title: 'Configuración Corporativa, Logo y API Digital',
      subtitle: 'Personaliza tu marca y conecta tu Imprenta Digital',
      description:
        'Configura el RIF, dirección fiscal, logo corporativo (que aparece en todas las facturas, notas de entrega y órdenes de compra) y las credenciales de la API REST de tu proveedor de Facturación Digital SENIAT.',
      voiceScript:
        'Finalmente, en Configuración puedes subir el logo de tu empresa, definir tus colores corporativos y configurar la URL y el token de la A P I REST de tu empresa proveedora de facturación digital. ¡Con esto hemos completado la inducción de APEX E R P!',
      icon: (size: number) => <SettingsIcon sx={{ fontSize: size, color: '#f97316', filter: 'drop-shadow(0 0 15px rgba(249, 115, 22, 0.5))' }} />,
      color: '#f97316',
      path: '/settings',
    },
  ];

  const steps = allSteps;

  const stopSpeech = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsPaused(false);
  }, []);

  const speakText = useCallback(
    (text: string) => {
      if (!('speechSynthesis' in window) || !voiceEnabled) return;
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-VE';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      // Prefer a natural Spanish voice if available
      const voices = window.speechSynthesis.getVoices();
      const spanishVoice =
        voices.find((v) => v.lang.toLowerCase().includes('es-ve')) ||
        voices.find((v) => v.lang.toLowerCase().includes('es-mx')) ||
        voices.find((v) => v.lang.toLowerCase().includes('es-co')) ||
        voices.find((v) => v.lang.toLowerCase().includes('es-419')) ||
        voices.find((v) => v.lang.toLowerCase().startsWith('es'));

      if (spanishVoice) {
        utterance.voice = spanishVoice;
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
      };
      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
        if (autoTourRef.current && activeStepRef.current < steps.length - 1) {
          setTimeout(() => {
            setActiveStep((prev) => prev + 1);
          }, 900);
        } else if (autoTourRef.current && activeStepRef.current >= steps.length - 1) {
          setAutoTour(false);
        }
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        setIsPaused(false);
      };

      window.speechSynthesis.speak(utterance);
    },
    [voiceEnabled, steps.length]
  );

  // Triggered on initial login or via CustomEvent('open-apex-induction-agent')
  useEffect(() => {
    const enabled = localStorage.getItem('apex_wizard_enabled') !== 'false';
    const hasPromptedThisSession = sessionStorage.getItem('apex_wizard_prompted') === 'true';

    if (enabled && !hasPromptedThisSession) {
      setOpen(true);
      sessionStorage.setItem('apex_wizard_prompted', 'true');
    }

    const handleOpenEvent = () => {
      setActiveStep(0);
      setVoiceEnabled(true);
      setOpen(true);
    };

    window.addEventListener('open-apex-induction-agent', handleOpenEvent);
    return () => {
      window.removeEventListener('open-apex-induction-agent', handleOpenEvent);
      stopSpeech();
    };
  }, [stopSpeech]);

  useEffect(() => {
    if (open) {
      sessionStorage.setItem('apex_wizard_active', 'true');
      const current = steps[activeStep];
      if (current?.path) {
        navigate(current.path);
      }
      if (voiceEnabled && current?.voiceScript) {
        const timer = setTimeout(() => {
          speakText(current.voiceScript);
        }, 300);
        return () => clearTimeout(timer);
      }
    } else {
      sessionStorage.removeItem('apex_wizard_active');
      stopSpeech();
    }
  }, [activeStep, open, voiceEnabled, speakText, stopSpeech]);

  const handleTogglePlayPause = () => {
    if (!('speechSynthesis' in window)) return;
    if (isSpeaking && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    } else if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    } else {
      const current = steps[activeStep];
      if (current) speakText(current.voiceScript);
    }
  };

  const handleSeedDemoData = async () => {
    setSeedingDemo(true);
    setSeedMessage(null);
    try {
      const res = await api.post('/tenants/seed-demo');
      setSeedMessage({
        text: res.data?.message || '¡Datos de demostración cargados con éxito!',
        severity: 'success',
      });
      // Refresh all queries so data appears immediately on screen
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      queryClient.invalidateQueries({ queryKey: ['my-tenant'] });
      if (voiceEnabled) {
        speakText(
          'He cargado exitosamente toda la información de demostración en tu empresa: productos con tres precios, clientes, proveedores, facturas fiscales SENIAT, órdenes de compra y nómina.'
        );
      }
    } catch (err: any) {
      setSeedMessage({
        text: err.response?.data?.detail || 'Error al cargar los datos de demostración.',
        severity: 'error',
      });
    } finally {
      setSeedingDemo(false);
    }
  };

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
    stopSpeech();
    setAutoTour(false);
    if (dontShowAgain) {
      localStorage.setItem('apex_wizard_enabled', 'false');
    }
    setOpen(false);
  };

  const current = steps[activeStep];
  if (!current) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      hideBackdrop={true}
      disableScrollLock={true}
      disableEnforceFocus={true}
      style={{ pointerEvents: 'none' }}
      slotProps={{
        paper: {
          sx: {
            pointerEvents: 'auto',
            position: 'fixed',
            bottom: { xs: 16, sm: 24 },
            right: { xs: 16, sm: 92 },
            m: 0,
            width: { xs: 'calc(100% - 32px)', sm: '420px' },
            borderRadius: '24px',
            maxHeight: 'calc(100vh - 80px)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(15, 23, 42, 0.97)' : 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            border: '2px solid',
            borderColor: isSpeaking ? current.color : 'divider',
            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.22)',
          },
        },
      }}
    >
      <Box
        sx={{
          position: 'relative',
          p: { xs: 2.5, sm: 3.2 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          overflowY: 'auto',
          flexGrow: 1,
        }}
      >
        {/* Top Controls: Voice Badge & Close */}
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Chip
            size="small"
            icon={voiceEnabled ? <VolumeUpIcon fontSize="small" /> : <VolumeOffIcon fontSize="small" />}
            label={isSpeaking && !isPaused ? '🎙️ Hablando en vivo...' : '🎙️ Agente IA con Voz'}
            color={isSpeaking && !isPaused ? 'primary' : 'default'}
            sx={{ fontWeight: 800, fontSize: '0.72rem' }}
          />
          <IconButton onClick={handleClose} size="small" sx={{ color: 'text.secondary' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Step Icon */}
        <Box
          sx={{
            width: 72,
            height: 72,
            borderRadius: '28%',
            bgcolor: `${current.color}18`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 1.5,
            boxShadow: isSpeaking ? `0 0 24px ${current.color}55` : 'none',
            transition: 'all 0.3s ease',
          }}
        >
          {current.icon(42)}
        </Box>

        {/* Title & Subtitle */}
        <Typography variant="h6" sx={{ fontWeight: 900, mb: 0.5, letterSpacing: '-0.4px', lineHeight: 1.2 }}>
          {current.title}
        </Typography>
        <Typography variant="caption" sx={{ color: current.color, fontWeight: 800, mb: 1.2, display: 'block' }}>
          {current.subtitle}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55, mb: 2, fontSize: '0.84rem' }}>
          {current.description}
        </Typography>

        {/* Audio Player Bar */}
        <Box
          sx={{
            width: '100%',
            p: 1.2,
            mb: 1.5,
            borderRadius: '14px',
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(37, 99, 235, 0.05)',
            border: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Tooltip title={isSpeaking && !isPaused ? 'Pausar Voz' : 'Escuchar Explicación'}>
              <IconButton size="small" color="primary" onClick={handleTogglePlayPause}>
                {isSpeaking && !isPaused ? <PauseIcon fontSize="small" /> : <PlayIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Repetir Audio">
              <IconButton size="small" onClick={() => speakText(current.voiceScript)}>
                <ReplayIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={voiceEnabled ? 'Silenciar Voz' : 'Activar Voz'}>
              <IconButton
                size="small"
                color={voiceEnabled ? 'primary' : 'default'}
                onClick={() => {
                  if (voiceEnabled) {
                    stopSpeech();
                    setVoiceEnabled(false);
                  } else {
                    setVoiceEnabled(true);
                    speakText(current.voiceScript);
                  }
                }}
              >
                {voiceEnabled ? <VolumeUpIcon fontSize="small" /> : <VolumeOffIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          </Box>

          <Button
            size="small"
            variant={autoTour ? 'contained' : 'outlined'}
            color={autoTour ? 'secondary' : 'primary'}
            startIcon={<AutoPlayIcon fontSize="small" />}
            onClick={() => {
              const nextAuto = !autoTour;
              setAutoTour(nextAuto);
              if (nextAuto && !isSpeaking) {
                setVoiceEnabled(true);
                speakText(current.voiceScript);
              }
            }}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 800, fontSize: '0.72rem' }}
          >
            {autoTour ? 'Auto-Inducción: ON' : 'Auto-Recorrido'}
          </Button>
        </Box>

        {/* Demo Data Seeder Button for Inductions */}
        <Button
          fullWidth
          size="small"
          variant="outlined"
          color="success"
          startIcon={seedingDemo ? <CircularProgress size={14} color="inherit" /> : <SeedDemoIcon fontSize="small" />}
          disabled={seedingDemo}
          onClick={handleSeedDemoData}
          sx={{ mb: 1.5, borderRadius: '10px', textTransform: 'none', fontWeight: 800, fontSize: '0.76rem' }}
        >
          {seedingDemo
            ? 'Cargando Empresa Demo Venezolana...'
            : `🏢 Cargar Datos de Demostración en ${tenant?.name || 'esta Empresa'}`}
        </Button>

        {seedMessage && (
          <Alert severity={seedMessage.severity} sx={{ width: '100%', mb: 1.5, py: 0.2, fontSize: '0.74rem' }}>
            {seedMessage.text}
          </Alert>
        )}

        <FormControlLabel
          control={<Checkbox checked={dontShowAgain} onChange={(e) => setDontShowAgain(e.target.checked)} size="small" />}
          label={
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              No abrir automáticamente al iniciar sesión
            </Typography>
          }
          sx={{ mb: 1 }}
        />

        {/* Navigation Buttons */}
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
          <Button
            size="small"
            disabled={activeStep === 0}
            onClick={handleBack}
            startIcon={<ArrowBackIcon />}
            sx={{ borderRadius: '10px', fontWeight: 700, textTransform: 'none' }}
          >
            Anterior
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
            size="small"
            variant="contained"
            onClick={handleNext}
            endIcon={activeStep === steps.length - 1 ? <FinishIcon /> : <ArrowForwardIcon />}
            sx={{
              borderRadius: '10px',
              fontWeight: 800,
              textTransform: 'none',
              bgcolor: current.color,
              '&:hover': { bgcolor: current.color, filter: 'brightness(0.92)' },
            }}
          >
            {activeStep === steps.length - 1 ? 'Finalizar' : 'Siguiente'}
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
}
