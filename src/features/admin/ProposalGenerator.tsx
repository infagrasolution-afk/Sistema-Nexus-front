import { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, TextField, Button, Checkbox, 
  FormControlLabel, Card, CardContent, Divider, Chip, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow,
  InputAdornment, Alert, Stack, Switch, IconButton, Tooltip,
  ToggleButtonGroup, ToggleButton, Collapse
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  LocalShipping as DeliveryNoteIcon,
  AddBusiness as AddBusinessIcon,
  CloudDone as CloudDoneIcon,
  Calculate as CalculateIcon,
  EditNote as NoteIcon,
  Refresh as RefreshIcon,
  InfoOutlined as InfoIcon,
  CurrencyExchange as CurrencyIcon,
  Tune as TuneIcon,
  LocalOffer as OfferIcon,
  RestartAlt as ResetIcon
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axiosConfig';

interface ModuleOption {
  id: string;
  name: string;
  badge: string;
  isBundle?: boolean;
  required?: boolean;
  description: string;
  initialPrice: number;
  promoPrice?: number | null;
  renewalPrice: number;
}

const DEFAULT_MODULES_CONFIG: ModuleOption[] = [
  {
    id: 'admin_inventory',
    name: 'Módulo Administrativo + Inventario & Almacenes (WMS)',
    badge: 'Base Obligatoria (Bundle)',
    isBundle: true,
    required: true,
    description: 'Núcleo del sistema: multi-almacén (soporta 2 o más depósitos externos), transferencias, control de stock mínimo con alarmas dinámicas, catálogo con fotos y códigos de barra, productos a granel (decimales), control de clientes y proveedores, emisión de notas de entrega y despacho, facturación en forma libre / manual, bimonetario USD/Bs con tasa BCV y configuración cloud.',
    initialPrice: 700,
    renewalPrice: 300
  },
  {
    id: 'sales',
    name: 'Punto de Venta Inteligente (POS) & Conector Fiscal',
    badge: 'Módulo Adicional',
    description: 'Facturación rápida de mostrador, cálculo automático de vueltos multimoneda, compatibilidad con impresoras térmicas (58mm / 80mm) y fiscales SENIAT (HKA, Bematech, Aclas), lectores de códigos de barra USB/Bluetooth y operación física y online.',
    initialPrice: 350,
    renewalPrice: 200
  },
  {
    id: 'treasury',
    name: 'Tesorería (Cuentas por Cobrar & Cuentas por Pagar)',
    badge: 'Módulo Adicional',
    description: 'Control de créditos y límites por cliente (CxC), compromisos de pago a proveedores (CxP), gestión de cuentas bancarias en bolívares y divisas, arqueos de caja y reporte de antigüedad de saldos.',
    initialPrice: 350,
    renewalPrice: 200
  },
  {
    id: 'purchases',
    name: 'Compras & Costeo Ponderado',
    badge: 'Módulo Adicional',
    description: 'Gestión de órdenes de compra a proveedores, recepción de mercancía en depósitos, cálculo automático de costo promedio ponderado y control de retenciones fiscales.',
    initialPrice: 350,
    renewalPrice: 200
  },
  {
    id: 'accounting',
    name: 'Contabilidad Auxiliar & Libros SENIAT',
    badge: 'Módulo Adicional',
    description: 'Generación automática de Libros de Compras y Ventas según providencias del SENIAT, asientos de diario contables automáticos generados desde ventas, soporte de IGTF (3%) y plan de cuentas.',
    initialPrice: 350,
    renewalPrice: 200
  },
  {
    id: 'hr',
    name: 'Nómina & Gestión de Talento Humano (LOTTT)',
    badge: 'Módulo Adicional',
    description: 'Expedientes de colaboradores, cálculo de nómina quincenal/mensual bajo legislación laboral venezolana (IVSS, FAOV, INCES), horas extras y emisión de recibos en PDF.',
    initialPrice: 350,
    renewalPrice: 200
  }
];

interface ProposalGeneratorProps {
  onProvisionTenant?: (tenantData: {
    name: string;
    email: string;
    tax_id: string;
    modules: string[];
  }) => void;
}

export default function ProposalGenerator({ onProvisionTenant }: ProposalGeneratorProps) {
  // Client details
  const [clientData, setClientData] = useState({
    companyName: '',
    taxId: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    proposalNumber: `PROP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    validityDays: '30',
    date: new Date().toISOString().split('T')[0]
  });

  // Modules Configuration state (allows Superadmin to customize prices anytime)
  const [modulesConfig, setModulesConfig] = useState<ModuleOption[]>(DEFAULT_MODULES_CONFIG);
  const [showPriceCustomizer, setShowPriceCustomizer] = useState(false);

  // Selected modules: Admin+Inventory is required/always selected
  const [selectedModules, setSelectedModules] = useState<string[]>([
    'admin_inventory', 'sales', 'treasury'
  ]);

  // Unselected modules observation / annex & Upsell bundle offer
  const [includeUnselectedInProposal, setIncludeUnselectedInProposal] = useState<boolean>(true);
  const [comboConditionText, setComboConditionText] = useState<string>(
    'Por la adquisición del Módulo Administrativo + Inventario (WMS)'
  );
  const [unselectedObservationNote, setUnselectedObservationNote] = useState<string>(
    'Los módulos listados en este anexo NO están incluidos en el monto total a pagar de esta cotización; se detallan de forma informativa para que el cliente conozca sus costos y el beneficio de tarifa preferencial disponible si decide incorporarlos junto con su compra.'
  );

  // Special agreement & discounts / promotions
  const [hasSpecialAgreement, setHasSpecialAgreement] = useState(false);
  const [discountType, setDiscountType] = useState<'fixed' | 'percent'>('fixed');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [promoTitle, setPromoTitle] = useState('Descuento Especial');
  const [downPaymentPercent, setDownPaymentPercent] = useState<number>(60);
  const [specialAgreementNotes, setSpecialAgreementNotes] = useState(
    'Forma de pago acordada: 60% de anticipo al formalizar la propuesta y 40% al terminar contra entrega de la plataforma parametrizada con capacitación del personal.'
  );

  // Exchange rate BCV en tiempo real
  const { data: bcvData, isLoading: isLoadingBcv, refetch: refetchBcv } = useQuery({
    queryKey: ['exchange-rate-bcv-proposal'],
    queryFn: async () => {
      // 1. Intento directo con API oficial en tiempo real
      try {
        const directRes = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
        if (directRes.ok) {
          const d = await directRes.json();
          const r = Number(d?.promedio || d?.valor || 0);
          if (r > 0) {
            return {
              rate: r,
              date: d?.fechaActualizacion,
              source: 'BCV Oficial'
            };
          }
        }
      } catch (err) {
        console.warn('Fallo consulta directa DolarAPI, consultando backend interno...', err);
      }

      // 2. Fallback al endpoint interno del backend
      try {
        const res = await api.get('/inventory/exchange-rate');
        const r = Number(res.data?.rate || 896.12);
        return {
          rate: r > 0 ? r : 896.12,
          date: new Date().toISOString(),
          source: 'BCV Oficial'
        };
      } catch {
        return {
          rate: 896.12,
          date: new Date().toISOString(),
          source: 'BCV Oficial'
        };
      }
    },
    staleTime: 1000 * 60 * 30 // 30 minutos
  });

  const [customBcvRate, setCustomBcvRate] = useState<number>(896.12);

  useEffect(() => {
    if (bcvData?.rate) {
      setCustomBcvRate(Number(bcvData.rate));
    }
  }, [bcvData]);

  // Handle module toggle
  const toggleModule = (id: string) => {
    if (id === 'admin_inventory') return; // Cannot uncheck required base
    setSelectedModules(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  // Modify module price
  const handleUpdatePrice = (id: string, field: 'initialPrice' | 'renewalPrice', val: number) => {
    setModulesConfig(prev => prev.map(m => m.id === id ? { ...m, [field]: Math.max(0, val) } : m));
  };

  // Modify module promotional/combo price (for cross-sell or bundle offer)
  const handleUpdatePromoPrice = (id: string, val: number | null) => {
    setModulesConfig(prev =>
      prev.map(m =>
        m.id === id
          ? { ...m, promoPrice: val === null || Number.isNaN(val) ? null : Math.max(0, val) }
          : m
      )
    );
  };

  // Apply a special promo price to all additional (non-required) or unselected modules at once
  const handleApplyPromoToUnselected = (price: number | null) => {
    setModulesConfig(prev =>
      prev.map(m => {
        if (m.required) return m;
        if (!selectedModules.includes(m.id)) {
          return { ...m, promoPrice: price };
        }
        return m;
      })
    );
  };

  // Reset to suggested default prices
  const handleResetDefaultPrices = () => {
    setModulesConfig(DEFAULT_MODULES_CONFIG.map(m => ({ ...m, promoPrice: null })));
  };

  // Quick Promotion Presets
  const applyPromoPreset = (preset: { title: string; type: 'fixed' | 'percent'; value: number }) => {
    setHasSpecialAgreement(true);
    setPromoTitle(preset.title);
    setDiscountType(preset.type);
    setDiscountValue(preset.value);
  };

  // Effective Year 1 price helper (takes promoPrice if configured on that module)
  const getEffectiveInitialPrice = (m: ModuleOption) =>
    m.promoPrice !== null && m.promoPrice !== undefined ? m.promoPrice : m.initialPrice;

  // Calculations
  const activeModulesList = modulesConfig.filter(m => selectedModules.includes(m.id));
  const unselectedModulesList = modulesConfig.filter(m => !selectedModules.includes(m.id));
  
  const listInitialTotal = activeModulesList.reduce((acc, m) => acc + m.initialPrice, 0);
  const rawInitialTotal = activeModulesList.reduce((acc, m) => acc + getEffectiveInitialPrice(m), 0);
  const modulePromoSavings = Math.max(0, listInitialTotal - rawInitialTotal);
  const renewalTotal = activeModulesList.reduce((acc, m) => acc + m.renewalPrice, 0);
  
  const calculatedDiscount = hasSpecialAgreement 
    ? (discountType === 'percent' 
        ? (rawInitialTotal * (Math.min(100, Math.max(0, discountValue)) / 100))
        : Math.min(rawInitialTotal, Math.max(0, discountValue)))
    : 0;

  const finalInitialTotal = Math.max(0, rawInitialTotal - calculatedDiscount);
  const safeDownPaymentPercent = Math.min(100, Math.max(0, downPaymentPercent));
  const downPaymentAmount = finalInitialTotal * (safeDownPaymentPercent / 100);
  const finalPaymentAmount = finalInitialTotal - downPaymentAmount;

  const totalInBsInitial = finalInitialTotal * (customBcvRate || 1);
  const totalInBsRenewal = renewalTotal * (customBcvRate || 1);

  // Direct printable Proposal PDF
  const handlePrintProposal = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const moduleRows = activeModulesList.map((m, idx) => {
      const hasModPromo = m.promoPrice !== null && m.promoPrice !== undefined && m.promoPrice < m.initialPrice;
      const effectivePrice = getEffectiveInitialPrice(m);
      return `
      <tr>
        <td style="padding: 12px 14px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: 700; color: #64748b;">${idx + 1}</td>
        <td style="padding: 12px 14px; border-bottom: 1px solid #e2e8f0;">
          <div style="font-weight: 800; color: #0f172a; font-size: 14px;">${m.name}</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 4px; line-height: 1.4;">${m.description}</div>
          ${hasModPromo ? `
            <div style="margin-top: 6px; display: inline-block; background: #fef3c7; border: 1px solid #fcd34d; color: #92400e; font-size: 10.5px; font-weight: 800; padding: 3px 8px; border-radius: 6px;">
              🎁 Beneficio Aplicado (${comboConditionText || 'Por compra de Módulo Base'}): Te queda en $${effectivePrice.toFixed(2)} USD (Ahorro: $${(m.initialPrice - effectivePrice).toFixed(2)} USD)
            </div>
          ` : ''}
        </td>
        <td style="padding: 12px 14px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 800; color: #2563eb; font-size: 14px;">
          ${hasModPromo ? `
            <div style="font-size: 11px; color: #94a3b8; text-decoration: line-through; font-weight: 600;">$${m.initialPrice.toFixed(2)}</div>
            <div style="color: #d97706; font-weight: 900; font-size: 15px;">$${effectivePrice.toFixed(2)}</div>
          ` : `$${effectivePrice.toFixed(2)}`}
        </td>
        <td style="padding: 12px 14px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700; color: #059669; font-size: 13px;">
          $${m.renewalPrice.toFixed(2)} / año
        </td>
      </tr>
    `;
    }).join('');

    const discountHtml = (hasSpecialAgreement && calculatedDiscount > 0) ? `
      <tr>
        <td colspan="2" style="padding: 8px 14px; text-align: right; color: #dc2626; font-weight: 700;">
          🏷️ Descuento / Oferta Especial (${promoTitle || 'Promoción'}):
        </td>
        <td style="padding: 8px 14px; text-align: right; color: #dc2626; font-weight: 800;">-$${calculatedDiscount.toFixed(2)}</td>
        <td></td>
      </tr>
    ` : '';

    const unselectedModulesHtml = (includeUnselectedInProposal && unselectedModulesList.length > 0) ? `
      <div style="margin-top: 28px; page-break-inside: avoid; border: 1.5px dashed #cbd5e1; border-radius: 10px; padding: 16px; background: #fcfcfd;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <div style="font-size: 12.5px; font-weight: 900; color: #334155; text-transform: uppercase; letter-spacing: 0.3px;">
            📋 Anexo Informativo: Módulos Adicionales No Incluidos en esta Cotización (Opcionales)
          </div>
          <span style="background: #e2e8f0; color: #475569; font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 12px; text-transform: uppercase;">
            No sumados al total actual
          </span>
        </div>
        ${unselectedObservationNote ? `
          <div style="font-size: 11px; color: #475569; margin-bottom: 10px; line-height: 1.45;">
            ${unselectedObservationNote}
          </div>
        ` : ''}
        ${unselectedModulesList.some(m => m.promoPrice !== null && m.promoPrice !== undefined) ? `
          <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 8px 12px; margin-bottom: 10px; font-size: 11.5px; color: #92400e; font-weight: 700;">
            🔥 <strong>OFERTA ESPECIAL DE EXPANSIÓN:</strong> ${comboConditionText || 'Por la adquisición del Módulo Administrativo + Inventario'}, usted puede adicionar cualquiera de los módulos en oferta al monto preferencial indicado en la tabla.
          </div>
        ` : ''}
        <table style="width: 100%; border-collapse: collapse; font-size: 11.5px;">
          <thead>
            <tr style="background: #f1f5f9;">
              <th style="padding: 8px 10px; text-align: left; color: #475569; font-weight: 800; border-bottom: 1.5px solid #cbd5e1; width: 48%;">Módulo Opcional Disponible</th>
              <th style="padding: 8px 10px; text-align: right; color: #475569; font-weight: 800; border-bottom: 1.5px solid #cbd5e1; width: 17%;">Precio Regular Año 1</th>
              <th style="padding: 8px 10px; text-align: right; color: #b45309; font-weight: 800; border-bottom: 1.5px solid #cbd5e1; width: 20%;">Oferta por Compra de Base</th>
              <th style="padding: 8px 10px; text-align: right; color: #475569; font-weight: 800; border-bottom: 1.5px solid #cbd5e1; width: 15%;">Renovación (Año 2+)</th>
            </tr>
          </thead>
          <tbody>
            ${unselectedModulesList.map(m => {
              const hasPromo = m.promoPrice !== null && m.promoPrice !== undefined;
              return `
                <tr>
                  <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0;">
                    <div style="font-weight: 800; color: #1e293b;">${m.name}</div>
                    <div style="font-size: 10.5px; color: #64748b; margin-top: 2px;">${m.description}</div>
                  </td>
                  <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700; color: ${hasPromo ? '#94a3b8; text-decoration: line-through' : '#334155'};">
                    $${m.initialPrice.toFixed(2)} USD
                  </td>
                  <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">
                    ${hasPromo ? `
                      <span style="background: #fef3c7; color: #b45309; font-weight: 900; padding: 3px 8px; border-radius: 6px; border: 1px solid #fcd34d; display: inline-block;">
                        🎁 Te queda en $${Number(m.promoPrice).toFixed(2)} USD
                      </span>
                    ` : `<span style="color: #94a3b8; font-size: 10.5px;">Tarifa estándar ($${m.initialPrice.toFixed(2)})</span>`}
                  </td>
                  <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700; color: #059669;">
                    $${m.renewalPrice.toFixed(2)} / año
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    ` : '';

    const observationBoxHtml = specialAgreementNotes ? `
      <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 14px; margin-top: 20px;">
        <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #0284c7; margin-bottom: 5px;">
          📌 Acuerdos Especiales, Términos Comerciales & Observaciones:
        </div>
        <div style="font-size: 12px; color: #334155; line-height: 1.5; white-space: pre-wrap;">${specialAgreementNotes}</div>
      </div>
    ` : '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Propuesta Comercial - ${clientData.companyName || 'Cliente'}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
            body { font-family: 'Inter', sans-serif; color: #1e293b; margin: 35px; line-height: 1.5; }
            .header-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
            .brand-name { font-size: 26px; font-weight: 900; color: #1e40af; letter-spacing: -0.5px; }
            .badge-saas { background: #dbeafe; color: #1d4ed8; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase; }
            .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 15px; margin-bottom: 25px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 12px; }
            .table-custom { width: 100%; border-collapse: collapse; margin-top: 15px; }
            .table-custom th { background: #f1f5f9; padding: 10px 14px; font-size: 12px; text-transform: uppercase; font-weight: 800; color: #475569; border-bottom: 2px solid #cbd5e1; }
            .tot-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            .clauses { font-size: 11px; color: #475569; margin-top: 25px; padding: 15px; border-left: 3px solid #3b82f6; background: #fafafa; border-radius: 4px; }
            .signatures { display: flex; justify-content: space-between; margin-top: 60px; page-break-inside: avoid; }
            .sig-box { width: 44%; text-align: center; border-top: 1px dashed #94a3b8; padding-top: 8px; font-size: 12px; }
            @media print {
              body { margin: 15mm; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="margin-bottom: 20px; text-align: right;">
            <button onclick="window.print()" style="background: #2563eb; color: white; border: none; padding: 10px 20px; font-weight: 700; border-radius: 6px; cursor: pointer;">
              🖨️ Descargar como PDF / Imprimir
            </button>
          </div>

          <table class="header-table">
            <tr>
              <td style="vertical-align: top;">
                <div class="brand-name">APEX ERP</div>
                <div style="font-size: 12px; color: #64748b; font-weight: 600;">Ecosistema Integral de Automatización Empresarial & Fiscal</div>
                <div style="font-size: 11px; color: #64748b; margin-top: 5px;">
                  <strong>Empresa Proveedora:</strong> InfaGraSolution<br/>
                  <strong>Contacto Comercial:</strong> Luis Infante | <strong>Teléfono:</strong> 0412-0161906<br/>
                  <strong>Email:</strong> infagrasolution@gmail.com | <strong>Soporte Técnico:</strong> 24/7 SLA
                </div>
              </td>
              <td style="vertical-align: top; text-align: right;">
                <span class="badge-saas">Propuesta Comercial & Contrato</span>
                <div style="font-size: 16px; font-weight: 900; color: #0f172a; margin-top: 8px;">${clientData.proposalNumber}</div>
                <div style="font-size: 12px; color: #64748b;"><strong>Fecha de Emisión:</strong> ${clientData.date}</div>
                <div style="font-size: 12px; color: #dc2626; font-weight: 700;"><strong>Validez:</strong> ${clientData.validityDays} días</div>
              </td>
            </tr>
          </table>

          <div class="info-box">
            <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #1e40af; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
              Información de la Empresa Prospecto / Cliente
            </div>
            <div class="info-grid">
              <div>
                <strong>Razón Social / Empresa:</strong> ${clientData.companyName || 'Empresa No Especificada'}<br/>
                <strong>RIF / C.I.:</strong> ${clientData.taxId || 'N/A'}<br/>
                <strong>Persona de Contacto:</strong> ${clientData.contactPerson || 'Representante Legal'}
              </div>
              <div>
                <strong>Teléfono / WhatsApp:</strong> ${clientData.phone || 'N/A'}<br/>
                <strong>Correo Electrónico:</strong> ${clientData.email || 'N/A'}<br/>
                <strong>Dirección:</strong> ${clientData.address || 'Venezuela'}
              </div>
            </div>
          </div>

          <div style="font-size: 13px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 5px;">
            1. Módulos y Servicios de Nube Incluidos en la Licencia
          </div>
          <table class="table-custom">
            <thead>
              <tr>
                <th style="width: 5%;">Item</th>
                <th style="width: 55%; text-align: left;">Módulo / Alcance Técnico</th>
                <th style="width: 20%; text-align: right;">Inversión Año 1 (Setup Cloud + Licencia)</th>
                <th style="width: 20%; text-align: right;">Renovación Anual (Año 2+)</th>
              </tr>
            </thead>
            <tbody>
              ${moduleRows}
              ${discountHtml}
            </tbody>
          </table>

          <div style="margin-top: 15px; display: flex; justify-content: flex-end;">
            <div style="width: 440px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px;">
              <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
                <tr>
                  <td style="padding: 4px 0; font-weight: 600; color: #475569;">Inversión Inicial Primer Año (USD):</td>
                  <td style="padding: 4px 0; text-align: right; font-weight: 900; color: #1e40af; font-size: 18px;">$${finalInitialTotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-size: 11px; color: #64748b;">Equivalente Oficial (Tasa BCV ${customBcvRate.toFixed(2)} Bs/$):</td>
                  <td style="padding: 4px 0; text-align: right; font-weight: 700; color: #0f172a; font-size: 12px;">Bs. ${totalInBsInitial.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding-top: 6px;">
                    <div style="font-size: 10px; color: #0369a1; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 5px; padding: 5px 8px; font-style: italic; line-height: 1.3;">
                      ℹ️ <strong>Nota:</strong> Los pagos en Bolívares (Bs.) son calculados a la tasa oficial del Banco Central de Venezuela (BCV) vigente a la fecha de pago.
                    </div>
                  </td>
                </tr>
                <tr><td colspan="2"><hr style="border: none; border-top: 1px dashed #cbd5e1; margin: 8px 0;"/></td></tr>
                <tr>
                  <td style="padding: 4px 0; font-weight: 600; color: #059669;">Renovación Anual (a partir del Año 2):</td>
                  <td style="padding: 4px 0; text-align: right; font-weight: 800; color: #059669; font-size: 15px;">$${renewalTotal.toFixed(2)} / año</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-size: 11px; color: #64748b;">Equivalente Anual Referencial:</td>
                  <td style="padding: 4px 0; text-align: right; font-size: 11px; color: #64748b;">Bs. ${totalInBsRenewal.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              </table>
            </div>
          </div>

          <div style="margin-top: 15px; background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 8px; padding: 12px 16px;">
            <div style="font-size: 11.5px; font-weight: 800; color: #166534; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px;">
              💳 Modalidad y Plan de Pago Acordado (Año 1):
            </div>
            <table style="width: 100%; font-size: 11.5px; border-collapse: collapse;">
              <tr>
                <td style="padding: 3px 0; color: #1e293b; width: 55%;">
                  • <strong>Anticipo Inicial (${safeDownPaymentPercent}%):</strong> Al formalizar la propuesta y firma:
                </td>
                <td style="padding: 3px 0; text-align: right; font-weight: 800; color: #15803d; font-size: 12.5px;">
                  $${downPaymentAmount.toFixed(2)} USD 
                  <span style="font-size: 10.5px; color: #475569; font-weight: 600;">(≈ Bs. ${(downPaymentAmount * customBcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 3px 0; color: #1e293b;">
                  • <strong>Saldo Final (${100 - safeDownPaymentPercent}%):</strong> Al terminar contra entrega de la plataforma e inducción:
                </td>
                <td style="padding: 3px 0; text-align: right; font-weight: 800; color: #1e40af; font-size: 12.5px;">
                  $${finalPaymentAmount.toFixed(2)} USD 
                  <span style="font-size: 10.5px; color: #475569; font-weight: 600;">(≈ Bs. ${(finalPaymentAmount * customBcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</span>
                </td>
              </tr>
            </table>
          </div>

          ${unselectedModulesHtml}

          ${observationBoxHtml}

          <div class="clauses">
            <strong>Garantías, Propiedad y Nivel de Servicio (SLA):</strong><br/>
            • <strong>Forma y Condiciones de Pago:</strong> La inversión del primer año se liquidará en un <strong>${safeDownPaymentPercent}% de anticipo</strong> al formalizar la propuesta y el <strong>${100 - safeDownPaymentPercent}% restante al culminar</strong> contra entrega de la plataforma parametrizada y capacitación del personal. Precios fijados en Dólares ($ USD); los pagos en Bolívares (Bs.) se liquidarán a la tasa oficial del Banco Central de Venezuela (BCV) del día de pago.<br/>
            • <strong>Renovación Anual:</strong> A partir del segundo año, el cliente cancelará el mantenimiento anual fijado en <strong>$${renewalTotal.toFixed(2)} USD/año</strong> ($300 base administrativa + $200 por cada módulo adicional activo, o valor acordado en contrato).<br/>
            • <strong>Arquitectura en la Nube y Aislamiento:</strong> Base de datos PostgreSQL dedicada e independiente alojada en la nube con disponibilidad garantizada del 99.9% uptime.<br/>
            • <strong>Vigencia de la Licencia:</strong> La licencia inicial tiene una vigencia contractual de 365 días a partir de la firma y activación.<br/>
            • <strong>Propiedad Absoluta de Datos:</strong> Todos los registros, clientes, ventas y stock son propiedad exclusiva del cliente, con exportación y resguardo en cualquier momento.<br/>
            • <strong>Compatibilidad de Hardware:</strong> Soporte nativo para lectores de códigos de barra (EAN/UPC), impresoras térmicas (58/80mm), conector fiscal local e interfaz multi-usuario simultánea en ventas y oficina.
          </div>

          <div class="signatures">
            <div class="sig-box">
              <strong>POR EL PROVEEDOR</strong><br/>
              <strong>InfaGraSolution</strong><br/>
              Luis Infante — Director de Sistemas<br/>
              Telf: 0412-0161906 | infagrasolution@gmail.com<br/>
              Firma y Sello Autorizado
            </div>
            <div class="sig-box">
              <strong>POR EL CLIENTE / CONTRATANTE</strong><br/>
              ${clientData.companyName || 'Aceptado Conforme'}<br/>
              ${clientData.taxId ? `RIF/CI: ${clientData.taxId}` : 'Firma Autorizada'}
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Direct printable Delivery Note PDF (Nota de Entrega de Licencia)
  const handlePrintDeliveryNote = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const deliveryNoteNumber = `NE-LIC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const moduleRows = activeModulesList.map((m, idx) => `
      <tr>
        <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: 700;">${idx + 1}</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0;">
          <strong>${m.name}</strong><br/>
          <span style="font-size: 11px; color: #64748b;">${m.description}</span>
        </td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; text-align: center;">1 Licencia (1 Año)</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; text-align: center;">
          <span style="background: #dcfce7; color: #166534; padding: 3px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700;">OPERATIVO</span>
        </td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Nota de Entrega de Sistema - ${deliveryNoteNumber}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
            body { font-family: 'Inter', sans-serif; color: #1e293b; margin: 35px; line-height: 1.5; }
            .header-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
            .brand-name { font-size: 26px; font-weight: 900; color: #059669; letter-spacing: -0.5px; }
            .badge-doc { background: #dcfce7; color: #15803d; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 800; text-transform: uppercase; }
            .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 15px; margin-bottom: 25px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 12px; }
            .table-custom { width: 100%; border-collapse: collapse; margin-top: 15px; }
            .table-custom th { background: #f1f5f9; padding: 10px 14px; font-size: 12px; text-transform: uppercase; font-weight: 800; color: #475569; border-bottom: 2px solid #cbd5e1; }
            .signatures { display: flex; justify-content: space-between; margin-top: 70px; page-break-inside: avoid; }
            .sig-box { width: 44%; text-align: center; border-top: 1px dashed #94a3b8; padding-top: 8px; font-size: 12px; }
            @media print {
              body { margin: 15mm; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="margin-bottom: 20px; text-align: right;">
            <button onclick="window.print()" style="background: #059669; color: white; border: none; padding: 10px 20px; font-weight: 700; border-radius: 6px; cursor: pointer;">
              🖨️ Descargar como PDF / Imprimir
            </button>
          </div>

          <table class="header-table">
            <tr>
              <td style="vertical-align: top;">
                <div class="brand-name">APEX ERP</div>
                <div style="font-size: 12px; color: #64748b; font-weight: 600;">Entrega Oficial de Software & Licenciamiento en la Nube</div>
                <div style="font-size: 11px; color: #64748b; margin-top: 5px;">
                  <strong>Empresa Proveedora:</strong> InfaGraSolution<br/>
                  <strong>Responsable Técnico:</strong> Luis Infante | <strong>Teléfono:</strong> 0412-0161906<br/>
                  <strong>Email:</strong> infagrasolution@gmail.com
                </div>
              </td>
              <td style="vertical-align: top; text-align: right;">
                <span class="badge-doc">Nota de Entrega de Licencia</span>
                <div style="font-size: 16px; font-weight: 900; color: #0f172a; margin-top: 8px;">${deliveryNoteNumber}</div>
                <div style="font-size: 12px; color: #64748b;"><strong>Fecha de Entrega:</strong> ${clientData.date}</div>
                <div style="font-size: 12px; color: #64748b;"><strong>Propuesta Relacionada:</strong> ${clientData.proposalNumber}</div>
              </td>
            </tr>
          </table>

          <div class="info-box">
            <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #059669; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
              Datos de la Empresa Receptora
            </div>
            <div class="info-grid">
              <div>
                <strong>Razón Social / Empresa:</strong> ${clientData.companyName || 'Empresa No Especificada'}<br/>
                <strong>RIF / Cédula:</strong> ${clientData.taxId || 'N/A'}<br/>
                <strong>Contacto:</strong> ${clientData.contactPerson || 'Representante Legal'}
              </div>
              <div>
                <strong>Teléfono:</strong> ${clientData.phone || 'N/A'}<br/>
                <strong>Correo:</strong> ${clientData.email || 'N/A'}<br/>
                <strong>Dirección:</strong> ${clientData.address || 'Venezuela'}
              </div>
            </div>
          </div>

          <div style="font-size: 13px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 5px;">
            Detalle de Módulos Habilitados en la Nube
          </div>
          <table class="table-custom">
            <thead>
              <tr>
                <th style="width: 5%;">Item</th>
                <th style="width: 60%; text-align: left;">Módulo / Componente Activado</th>
                <th style="width: 20%; text-align: center;">Cantidad</th>
                <th style="width: 15%; text-align: center;">Estado</th>
              </tr>
            </thead>
            <tbody>
              ${moduleRows}
            </tbody>
          </table>

          <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 14px; margin-top: 25px; font-size: 12px; color: #334155; line-height: 1.5;">
            <strong>DECLARACIÓN DE RECEPCIÓN A CONFORMIDAD:</strong><br/>
            Por medio del presente documento, el <strong>Cliente</strong> deja constancia de haber recibido a entera satisfacción el acceso operativo a la plataforma tecnológica <strong>APEX ERP</strong> en la nube, incluyendo el aprovisionamiento de su base de datos, credenciales maestras y la activación de los módulos arriba descritos, así como la debida inducción operativa.
          </div>

          <div class="signatures">
            <div class="sig-box">
              <strong>ENTREGADO POR</strong><br/>
              <strong>InfaGraSolution</strong><br/>
              Luis Infante — Administrador de Sistemas<br/>
              Telf: 0412-0161906 | infagrasolution@gmail.com<br/>
              Firma y Sello de Entrega
            </div>
            <div class="sig-box">
              <strong>RECIBIDO CONFORME</strong><br/>
              ${clientData.companyName || 'Cliente'}<br/>
              C.I. / RIF y Firma del Receptor
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Convert to actual Tenant
  const handleProvisionTenant = () => {
    if (onProvisionTenant) {
      // Map configured module IDs to tenant modules format
      const mappedModules = selectedModules.map(m => m === 'admin_inventory' ? 'admin' : m);
      if (selectedModules.includes('admin_inventory') && !mappedModules.includes('inventory')) {
        mappedModules.push('inventory');
      }

      onProvisionTenant({
        name: clientData.companyName,
        email: clientData.email,
        tax_id: clientData.taxId,
        modules: mappedModules
      });
    }
  };

  return (
    <Box>
      {/* Header Banner */}
      <Paper sx={{ 
        p: 3, 
        mb: 4, 
        borderRadius: 4, 
        background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)', 
        color: 'white',
        boxShadow: '0 10px 30px rgba(37,99,235,0.2)' 
      }}>
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <CalculateIcon sx={{ fontSize: 32 }} />
              <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: '-0.5px' }}>
                Generador de Propuestas & Cotizador Comercial
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Herramienta exclusiva para el administrador. Configure cotizaciones a la medida, 
              personalice precios de licenciamiento y renovación, aplique promociones u ofertas y descargue al instante la <strong>Propuesta Comercial en PDF</strong> y la <strong>Nota de Entrega</strong>.
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 5 }} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
            <Paper sx={{ 
              p: 2, 
              bgcolor: 'rgba(255,255,255,0.15)', 
              backdropFilter: 'blur(12px)', 
              borderRadius: 3, 
              display: 'inline-block', 
              textAlign: 'left',
              border: '1px solid rgba(255,255,255,0.3)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, mb: 0.8 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <CurrencyIcon sx={{ fontSize: 18, color: '#38bdf8' }} />
                  <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'white' }}>
                    Tasa Oficial BCV del Día
                  </Typography>
                </Box>
                <Tooltip title="Actualizar tasa BCV en tiempo real">
                  <IconButton 
                    size="small" 
                    onClick={() => refetchBcv()} 
                    disabled={isLoadingBcv}
                    sx={{ color: 'white', p: 0.5, '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
                  >
                    <RefreshIcon fontSize="small" sx={{ animation: isLoadingBcv ? 'spin 1s linear infinite' : 'none' }} />
                  </IconButton>
                </Tooltip>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography variant="h5" sx={{ fontWeight: 900, color: 'white', letterSpacing: '-0.5px' }}>
                  {customBcvRate.toFixed(2)} <span style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.9 }}>Bs / $</span>
                </Typography>
                <TextField 
                  size="small"
                  type="number"
                  value={customBcvRate}
                  onChange={(e) => setCustomBcvRate(Number(e.target.value))}
                  placeholder="Tasa Bs"
                  sx={{ 
                    width: 105,
                    bgcolor: 'white', 
                    borderRadius: 1.5,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                      '& input': { p: '4px 8px', fontSize: '0.85rem', fontWeight: 800 }
                    }
                  }}
                />
              </Box>

              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.92)', fontSize: '0.72rem', display: 'block', mt: 0.8, fontStyle: 'italic', borderTop: '1px dashed rgba(255,255,255,0.25)', pt: 0.6 }}>
                📌 Pagos en Bs. a la tasa oficial del BCV del día de pago.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={4}>
        {/* Left Column: Form & Configuration */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <Stack spacing={3}>
            {/* Step 1: Client Information */}
            <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
                <NoteIcon /> 1. Datos del Cliente o Prospecto
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 8 }}>
                  <TextField 
                    label="Nombre de la Empresa / Razón Social" 
                    fullWidth 
                    size="small"
                    placeholder="ej: Inversiones Los Andes C.A."
                    value={clientData.companyName}
                    onChange={(e) => setClientData({ ...clientData, companyName: e.target.value })}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField 
                    label="RIF / Cédula" 
                    fullWidth 
                    size="small"
                    placeholder="J-12345678-9"
                    value={clientData.taxId}
                    onChange={(e) => setClientData({ ...clientData, taxId: e.target.value })}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField 
                    label="Persona de Contacto" 
                    fullWidth 
                    size="small"
                    placeholder="ej: Lic. Carlos Gómez"
                    value={clientData.contactPerson}
                    onChange={(e) => setClientData({ ...clientData, contactPerson: e.target.value })}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField 
                    label="Teléfono / WhatsApp" 
                    fullWidth 
                    size="small"
                    placeholder="+58 412 1234567"
                    value={clientData.phone}
                    onChange={(e) => setClientData({ ...clientData, phone: e.target.value })}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField 
                    label="Correo Electrónico" 
                    type="email"
                    fullWidth 
                    size="small"
                    placeholder="gerencia@empresa.com"
                    value={clientData.email}
                    onChange={(e) => setClientData({ ...clientData, email: e.target.value })}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField 
                    label="Días de Validez de la Oferta" 
                    type="number"
                    fullWidth 
                    size="small"
                    value={clientData.validityDays}
                    onChange={(e) => setClientData({ ...clientData, validityDays: e.target.value })}
                    slotProps={{ input: { endAdornment: <InputAdornment position="end">días</InputAdornment> } }}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField 
                    label="Dirección Comercial" 
                    fullWidth 
                    size="small"
                    placeholder="Av. Principal, Edificio Apex, Caracas, Venezuela"
                    value={clientData.address}
                    onChange={(e) => setClientData({ ...clientData, address: e.target.value })}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Step 2: Modules Selection & Price Customizer */}
            <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
                    <CloudDoneIcon /> 2. Selección de Módulos & Precios
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Seleccione módulos a cotizar o modifique los montos de licencia y renovación anual.
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Button 
                    variant={showPriceCustomizer ? "contained" : "outlined"}
                    size="small"
                    startIcon={<TuneIcon />}
                    onClick={() => setShowPriceCustomizer(!showPriceCustomizer)}
                    sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
                  >
                    {showPriceCustomizer ? "Cerrar Editor de Montos" : "⚙️ Personalizar Montos"}
                  </Button>
                  <Chip 
                    label={`${selectedModules.length} de ${modulesConfig.length} Módulos`} 
                    color="primary" 
                    size="small" 
                    sx={{ fontWeight: 700 }}
                  />
                </Box>
              </Box>

              <Alert severity="info" sx={{ mb: 2.5, borderRadius: 2 }}>
                <strong>Regla de Precios Oficial:</strong> El <em>Módulo Administrativo + Inventario</em> se contrata de forma obligatoria como base a <strong>$700 USD</strong> el primer año y <strong>$300 USD</strong> de renovación anual a partir del 2do año. Los demás módulos tienen un costo de <strong>$350 USD</strong> el primer año y <strong>$200 USD</strong> de renovación anual cada uno.
              </Alert>

              {/* Collapsible Price Customizer Panel */}
              <Collapse in={showPriceCustomizer}>
                <Paper variant="outlined" sx={{ p: 2, mb: 2.5, borderRadius: 3, bgcolor: '#f8fafc', borderColor: '#cbd5e1' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: 0.8 }}>
                      <TuneIcon fontSize="small" /> Editor de Tarifas y Ofertas por Módulo
                    </Typography>
                    <Button 
                      size="small" 
                      color="inherit" 
                      startIcon={<ResetIcon />} 
                      onClick={handleResetDefaultPrices}
                      sx={{ textTransform: 'none', fontSize: '0.75rem', fontWeight: 700 }}
                    >
                      Restablecer Sugeridos ($700/$300 y $350/$200)
                    </Button>
                  </Box>

                  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem' }}>Módulo</TableCell>
                          <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', width: 120 }} align="center">Precio Regular Año 1</TableCell>
                          <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', width: 150, color: '#b45309' }} align="center">🎁 Oferta por Compra Base</TableCell>
                          <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', width: 120 }} align="center">Año 2+ (Renov.)</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {modulesConfig.map((mod) => (
                          <TableRow key={mod.id}>
                            <TableCell sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                              {mod.name}
                              {mod.required && <Chip label="Base Obligatoria" size="small" color="warning" sx={{ ml: 1, height: 18, fontSize: '0.65rem' }} />}
                            </TableCell>
                            <TableCell align="center">
                              <TextField 
                                size="small"
                                type="number"
                                value={mod.initialPrice}
                                onChange={(e) => handleUpdatePrice(mod.id, 'initialPrice', Number(e.target.value))}
                                slotProps={{ input: { startAdornment: <InputAdornment position="start">$</InputAdornment> } }}
                                sx={{ width: 100, '& input': { p: '4px 6px', fontSize: '0.82rem', fontWeight: 800 } }}
                              />
                            </TableCell>
                            <TableCell align="center">
                              {mod.required ? (
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Módulo Base</Typography>
                              ) : (
                                <TextField 
                                  size="small"
                                  type="number"
                                  placeholder="Sin oferta"
                                  value={mod.promoPrice !== null && mod.promoPrice !== undefined ? mod.promoPrice : ''}
                                  onChange={(e) => {
                                    const raw = e.target.value;
                                    handleUpdatePromoPrice(mod.id, raw === '' ? null : Number(raw));
                                  }}
                                  slotProps={{ input: { startAdornment: <InputAdornment position="start">$</InputAdornment> } }}
                                  sx={{ 
                                    width: 115, 
                                    bgcolor: mod.promoPrice !== null && mod.promoPrice !== undefined ? '#fffbeb' : 'white',
                                    '& input': { p: '4px 6px', fontSize: '0.82rem', fontWeight: 800, color: '#b45309' } 
                                  }}
                                />
                              )}
                            </TableCell>
                            <TableCell align="center">
                              <TextField 
                                size="small"
                                type="number"
                                value={mod.renewalPrice}
                                onChange={(e) => handleUpdatePrice(mod.id, 'renewalPrice', Number(e.target.value))}
                                slotProps={{ input: { startAdornment: <InputAdornment position="start">$</InputAdornment> } }}
                                sx={{ width: 100, '& input': { p: '4px 6px', fontSize: '0.82rem', fontWeight: 800, color: '#059669' } }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Collapse>

              {/* Module Cards List */}
              <Stack spacing={2}>
                {modulesConfig.map((mod) => {
                  const isChecked = selectedModules.includes(mod.id);
                  const hasModPromo = mod.promoPrice !== null && mod.promoPrice !== undefined;
                  const effectivePrice = getEffectiveInitialPrice(mod);
                  return (
                    <Card 
                      key={mod.id} 
                      variant="outlined" 
                      onClick={() => {
                        if (!mod.required) toggleModule(mod.id);
                      }}
                      sx={{ 
                        borderRadius: 3, 
                        cursor: mod.required ? 'default' : 'pointer',
                        borderColor: isChecked ? 'primary.main' : (hasModPromo ? '#f59e0b' : 'divider'),
                        bgcolor: isChecked ? 'rgba(37,99,235,0.04)' : (hasModPromo ? 'rgba(245,158,11,0.03)' : 'background.paper'),
                        boxShadow: isChecked ? '0 2px 10px rgba(37,99,235,0.08)' : 'none',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          borderColor: 'primary.main',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                        }
                      }}
                    >
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Box sx={{ 
                          display: 'flex', 
                          flexDirection: { xs: 'column', sm: 'row' }, 
                          alignItems: { xs: 'flex-start', sm: 'center' }, 
                          justifyContent: 'space-between',
                          gap: 1.5 
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, flex: 1 }}>
                            <Checkbox 
                              checked={isChecked}
                              disabled={mod.required}
                              onChange={(e) => {
                                e.stopPropagation();
                                if (!mod.required) toggleModule(mod.id);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              sx={{ p: 0.5, mt: 0.2 }}
                            />
                            <Box sx={{ flex: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                                  {mod.name}
                                </Typography>
                                <Chip 
                                  label={isChecked ? (mod.isBundle ? mod.badge : 'Adquirido') : 'No Adquirido (Anexo)'} 
                                  size="small" 
                                  color={mod.isBundle ? 'warning' : (isChecked ? 'primary' : 'default')} 
                                  variant={isChecked ? 'filled' : 'outlined'}
                                  sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }}
                                />
                                {hasModPromo && (
                                  <Chip 
                                    label={`🎁 En Oferta: $${mod.promoPrice} USD`}
                                    size="small"
                                    color="warning"
                                    sx={{ height: 20, fontSize: '0.68rem', fontWeight: 800 }}
                                  />
                                )}
                              </Box>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, lineHeight: 1.4 }}>
                                {mod.description}
                              </Typography>

                              {/* Quick per-module Offer Input ("Por la compra de Base te queda en tal monto") */}
                              {!mod.required && (
                                <Box 
                                  onClick={(e) => e.stopPropagation()} 
                                  sx={{ 
                                    mt: 1.2, 
                                    pt: 1, 
                                    borderTop: '1px dashed', 
                                    borderColor: 'divider',
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    flexWrap: 'wrap', 
                                    gap: 1 
                                  }}
                                >
                                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#b45309', fontSize: '0.73rem' }}>
                                    🎁 Precio especial por compra de Admin+Inventario:
                                  </Typography>
                                  <TextField
                                    size="small"
                                    type="number"
                                    placeholder={`Ej: 200 (Reg. $${mod.initialPrice})`}
                                    value={mod.promoPrice !== null && mod.promoPrice !== undefined ? mod.promoPrice : ''}
                                    onChange={(e) => {
                                      const raw = e.target.value;
                                      handleUpdatePromoPrice(mod.id, raw === '' ? null : Number(raw));
                                    }}
                                    slotProps={{ input: { startAdornment: <InputAdornment position="start">$</InputAdornment> } }}
                                    sx={{
                                      width: 145,
                                      bgcolor: hasModPromo ? '#fffbeb' : 'background.paper',
                                      '& .MuiOutlinedInput-root': {
                                        borderRadius: 1.5,
                                        '& input': { p: '3px 6px', fontSize: '0.78rem', fontWeight: 800, color: '#b45309' }
                                      }
                                    }}
                                  />
                                  {[250, 200, 150].map(presetVal => (
                                    <Chip
                                      key={presetVal}
                                      label={`$${presetVal}`}
                                      size="small"
                                      clickable
                                      color={mod.promoPrice === presetVal ? 'warning' : 'default'}
                                      variant={mod.promoPrice === presetVal ? 'filled' : 'outlined'}
                                      onClick={() => handleUpdatePromoPrice(mod.id, mod.promoPrice === presetVal ? null : presetVal)}
                                      sx={{ height: 22, fontSize: '0.7rem', fontWeight: 700 }}
                                    />
                                  ))}
                                  {hasModPromo && (
                                    <Button
                                      size="small"
                                      color="inherit"
                                      onClick={() => handleUpdatePromoPrice(mod.id, null)}
                                      sx={{ minWidth: 'auto', p: '1px 6px', fontSize: '0.68rem', textTransform: 'none', color: 'text.secondary' }}
                                    >
                                      Quitar oferta
                                    </Button>
                                  )}
                                </Box>
                              )}
                            </Box>
                          </Box>

                          <Box sx={{ 
                            textAlign: { xs: 'left', sm: 'right' }, 
                            minWidth: { xs: 'auto', sm: 135 },
                            pl: { xs: 5, sm: 0 },
                            pt: { xs: 0.5, sm: 0 }
                          }}>
                            {hasModPromo ? (
                              <>
                                <Typography variant="caption" sx={{ textDecoration: 'line-through', color: 'text.disabled', fontWeight: 700, display: 'block' }}>
                                  Reg: ${mod.initialPrice} USD
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 900, color: '#d97706', fontSize: '1rem' }}>
                                  ${effectivePrice} <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>Oferta Año 1</span>
                                </Typography>
                              </>
                            ) : (
                              <Typography variant="body2" sx={{ fontWeight: 900, color: 'primary.main', fontSize: '0.95rem' }}>
                                ${mod.initialPrice} <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b' }}>Año 1</span>
                              </Typography>
                            )}
                            <Typography variant="caption" sx={{ fontWeight: 700, color: 'success.main', display: 'block' }}>
                              ${mod.renewalPrice} <span style={{ color: '#64748b' }}>/ año (2+)</span>
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })}
              </Stack>

              {/* Step 2.B: Unselected Modules Annex & Cross-Sell Offer ("Módulos que no se van a adquirir aparte + Oferta por compra de Base") */}
              <Paper 
                variant="outlined" 
                sx={{ 
                  mt: 3, 
                  p: 2.5, 
                  borderRadius: 3, 
                  bgcolor: includeUnselectedInProposal ? '#f8fafc' : 'background.paper',
                  borderColor: includeUnselectedInProposal ? '#3b82f6' : 'divider',
                  borderStyle: 'dashed',
                  borderWidth: 1.5
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: 0.8 }}>
                      📋 Anexo de Módulos No Adquiridos y Oferta Cruzada (Cross-Sell)
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Muestre aparte los módulos no contratados para que el cliente conozca su precio y ofrézcale un monto especial por comprar el Módulo Administrativo + Inventario.
                    </Typography>
                  </Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={includeUnselectedInProposal}
                        onChange={(e) => setIncludeUnselectedInProposal(e.target.checked)}
                        color="primary"
                      />
                    }
                    label={
                      <Typography variant="caption" sx={{ fontWeight: 800 }}>
                        Anexar No Adquiridos ({unselectedModulesList.length})
                      </Typography>
                    }
                  />
                </Box>

                {includeUnselectedInProposal && (
                  <Stack spacing={2} sx={{ mt: 1.5 }}>
                    <Grid container spacing={2} sx={{ alignItems: 'center' }}>
                      <Grid size={{ xs: 12, sm: 7 }}>
                        <TextField
                          label="Condición del Beneficio / Oferta por Compra"
                          size="small"
                          fullWidth
                          value={comboConditionText}
                          onChange={(e) => setComboConditionText(e.target.value)}
                          placeholder="Por la adquisición del Módulo Administrativo + Inventario (WMS)"
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#b45309', display: 'block', mb: 0.5 }}>
                          ⚡ Dejar todos los NO adquiridos en oferta a:
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
                          {[250, 200, 150].map(price => (
                            <Chip
                              key={price}
                              label={`$${price} USD`}
                              size="small"
                              color="warning"
                              variant="outlined"
                              clickable
                              onClick={() => handleApplyPromoToUnselected(price)}
                              sx={{ fontWeight: 800 }}
                            />
                          ))}
                          <Chip
                            label="Precio Regular ($350)"
                            size="small"
                            variant="outlined"
                            clickable
                            onClick={() => handleApplyPromoToUnselected(null)}
                            sx={{ fontWeight: 600 }}
                          />
                        </Box>
                      </Grid>
                    </Grid>

                    {unselectedModulesList.length === 0 ? (
                      <Alert severity="success" sx={{ py: 0.5, borderRadius: 2 }}>
                        Todos los módulos del sistema están seleccionados en la cotización principal. Desmarque algún módulo arriba si desea mostrarlo aparte como observación/anexo.
                      </Alert>
                    ) : (
                      <Box sx={{ bgcolor: 'white', p: 1.5, borderRadius: 2, border: '1px solid #e2e8f0' }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', display: 'block', mb: 1 }}>
                          Módulos que aparecerán aparte como Observación Informativa ({unselectedModulesList.length}):
                        </Typography>
                        <Stack spacing={1}>
                          {unselectedModulesList.map(m => {
                            const hasPromo = m.promoPrice !== null && m.promoPrice !== undefined;
                            return (
                              <Box 
                                key={m.id} 
                                sx={{ 
                                  display: 'flex', 
                                  justifyContent: 'space-between', 
                                  alignItems: 'center', 
                                  flexWrap: 'wrap', 
                                  gap: 1,
                                  p: 1,
                                  borderRadius: 1.5,
                                  bgcolor: hasPromo ? '#fffbeb' : '#f8fafc',
                                  border: '1px solid',
                                  borderColor: hasPromo ? '#fde68a' : '#e2e8f0'
                                }}
                              >
                                <Box sx={{ flex: 1, minWidth: 200 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 800, fontSize: '0.82rem' }}>
                                    {m.name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Precio Regular: <strong>${m.initialPrice} USD</strong> (Año 1) | Renovación: <strong>${m.renewalPrice} USD/año</strong>
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <TextField
                                    size="small"
                                    type="number"
                                    label="Te queda en ($)"
                                    placeholder="Sin oferta"
                                    value={hasPromo ? m.promoPrice : ''}
                                    onChange={(e) => {
                                      const raw = e.target.value;
                                      handleUpdatePromoPrice(m.id, raw === '' ? null : Number(raw));
                                    }}
                                    slotProps={{ input: { startAdornment: <InputAdornment position="start">$</InputAdornment> } }}
                                    sx={{ width: 130, bgcolor: 'white', '& input': { p: '5px 8px', fontSize: '0.8rem', fontWeight: 800, color: '#b45309' } }}
                                  />
                                </Box>
                              </Box>
                            );
                          })}
                        </Stack>
                      </Box>
                    )}

                    <TextField
                      label="Nota / Observación del Anexo de Módulos No Adquiridos"
                      multiline
                      rows={2}
                      size="small"
                      fullWidth
                      value={unselectedObservationNote}
                      onChange={(e) => setUnselectedObservationNote(e.target.value)}
                    />

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        size="small"
                        variant="outlined"
                        color="warning"
                        onClick={() => {
                          const modulesWithPromo = modulesConfig.filter(
                            m => !m.required && m.promoPrice !== null && m.promoPrice !== undefined
                          );
                          const offerLines = modulesWithPromo.length > 0
                            ? modulesWithPromo
                                .map(m => `${m.name} te queda en $${m.promoPrice} USD (precio regular $${m.initialPrice} USD)`)
                                .join('; ')
                            : 'cualquier módulo adicional como Punto de Venta (POS), Tesorería o Contabilidad cuenta con tarifa preferencial';
                          const textToAppend = `\n\n🎁 OFERTA ESPECIAL POR ADQUISICIÓN: ${comboConditionText}, ${offerLines}.`;
                          if (!specialAgreementNotes.includes('OFERTA ESPECIAL POR ADQUISICIÓN')) {
                            setSpecialAgreementNotes(prev => `${prev.trim()}${textToAppend}`);
                          }
                        }}
                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
                      >
                        ✍️ Redactar también esta oferta en la caja de Observaciones
                      </Button>
                    </Box>
                  </Stack>
                )}
              </Paper>
            </Paper>

            {/* Step 3: Promotions, Offers & Special Agreements */}
            <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1, color: 'warning.dark' }}>
                    <OfferIcon /> 3. Promociones, Ofertas y Acuerdos Especiales
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Configure bonificaciones, porcentajes de descuento y plan de pago por hitos.
                  </Typography>
                </Box>
                <FormControlLabel
                  control={
                    <Switch 
                      checked={hasSpecialAgreement} 
                      onChange={(e) => setHasSpecialAgreement(e.target.checked)} 
                      color="warning"
                    />
                  }
                  label={<Typography variant="body2" sx={{ fontWeight: 800 }}>Aplicar Promoción u Oferta</Typography>}
                />
              </Box>

              {hasSpecialAgreement && (
                <Box sx={{ mt: 2, mb: 2.5, p: 2, bgcolor: '#fffbeb', borderRadius: 3, border: '1px solid #fde68a' }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#92400e', textTransform: 'uppercase', display: 'block', mb: 1.5, letterSpacing: '0.5px' }}>
                    🏷️ Ofertas y Promociones Rápidas (Presets con 1 Clic):
                  </Typography>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    <Chip 
                      label="Combo 3 Módulos (-10%)" 
                      clickable 
                      color="warning" 
                      variant={promoTitle.includes('10%') ? 'filled' : 'outlined'}
                      onClick={() => applyPromoPreset({ title: 'Oferta Especial Combo PyME (-10%)', type: 'percent', value: 10 })}
                      sx={{ fontWeight: 700 }}
                    />
                    <Chip 
                      label="Paquete Completo Suite (-20%)" 
                      clickable 
                      color="warning" 
                      variant={promoTitle.includes('20%') ? 'filled' : 'outlined'}
                      onClick={() => applyPromoPreset({ title: 'Promo Suite Integral Todos los Módulos (-20%)', type: 'percent', value: 20 })}
                      sx={{ fontWeight: 700 }}
                    />
                    <Chip 
                      label="Bono Descuento ($100 USD)" 
                      clickable 
                      color="warning" 
                      variant={discountValue === 100 && discountType === 'fixed' ? 'filled' : 'outlined'}
                      onClick={() => applyPromoPreset({ title: 'Bono Promocional de Apertura ($100 OFF)', type: 'fixed', value: 100 })}
                      sx={{ fontWeight: 700 }}
                    />
                    <Chip 
                      label="Bono Descuento ($200 USD)" 
                      clickable 
                      color="warning" 
                      variant={discountValue === 200 && discountType === 'fixed' ? 'filled' : 'outlined'}
                      onClick={() => applyPromoPreset({ title: 'Bono Especial Corporativo ($200 OFF)', type: 'fixed', value: 200 })}
                      sx={{ fontWeight: 700 }}
                    />
                  </Box>

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField 
                        label="Nombre / Concepto de la Oferta" 
                        fullWidth 
                        size="small"
                        placeholder="ej: Descuento de Lanzamiento Q4"
                        value={promoTitle}
                        onChange={(e) => setPromoTitle(e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <ToggleButtonGroup
                        value={discountType}
                        exclusive
                        size="small"
                        fullWidth
                        onChange={(_, val) => val && setDiscountType(val)}
                      >
                        <ToggleButton value="fixed" sx={{ fontWeight: 800 }}>$ Fijo</ToggleButton>
                        <ToggleButton value="percent" sx={{ fontWeight: 800 }}>% Porc.</ToggleButton>
                      </ToggleButtonGroup>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <TextField 
                        label={discountType === 'percent' ? "Porcentaje (%)" : "Monto ($ USD)"}
                        type="number"
                        fullWidth 
                        size="small"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(Number(e.target.value))}
                        slotProps={{
                          input: {
                            startAdornment: <InputAdornment position="start">{discountType === 'percent' ? '%' : '$'}</InputAdornment>
                          }
                        }}
                      />
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 1.5, p: 1, bgcolor: 'rgba(255,255,255,0.7)', borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#78350f' }}>
                      Ahorro para el cliente: <strong>-${calculatedDiscount.toFixed(2)} USD</strong> (≈ Bs. {(calculatedDiscount * customBcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#15803d' }}>
                      Inversión Año 1 Final: <strong>${finalInitialTotal.toFixed(2)} USD</strong>
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Down payment control */}
              <Box sx={{ mb: 2, p: 2, bgcolor: '#f0fdf4', borderRadius: 3, border: '1px solid #bbf7d0' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#166534' }}>
                    💳 Condiciones y Porcentajes de Pago (Año 1)
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.8 }}>
                    <Chip 
                      label="60% / 40%" 
                      size="small" 
                      color={downPaymentPercent === 60 ? "success" : "default"}
                      onClick={() => setDownPaymentPercent(60)}
                      clickable
                      sx={{ fontWeight: 700 }}
                    />
                    <Chip 
                      label="50% / 50%" 
                      size="small" 
                      color={downPaymentPercent === 50 ? "success" : "default"}
                      onClick={() => setDownPaymentPercent(50)}
                      clickable
                      sx={{ fontWeight: 700 }}
                    />
                    <Chip 
                      label="100% Contado" 
                      size="small" 
                      color={downPaymentPercent === 100 ? "success" : "default"}
                      onClick={() => setDownPaymentPercent(100)}
                      clickable
                      sx={{ fontWeight: 700 }}
                    />
                  </Box>
                </Box>

                <Grid container spacing={2} sx={{ alignItems: 'center' }}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField 
                      label="Anticipo Inicial (%)" 
                      type="number"
                      size="small"
                      fullWidth
                      value={downPaymentPercent}
                      onChange={(e) => setDownPaymentPercent(Math.min(100, Math.max(0, Number(e.target.value))))}
                      slotProps={{ input: { endAdornment: <InputAdornment position="end">%</InputAdornment> } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" sx={{ color: '#166534', fontWeight: 600, display: 'block' }}>
                      • Anticipo: <strong>{safeDownPaymentPercent}%</strong> (${downPaymentAmount.toFixed(2)} USD)<br/>
                      • Saldo Final: <strong>{100 - safeDownPaymentPercent}%</strong> (${finalPaymentAmount.toFixed(2)} USD)
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              <TextField 
                label="Observaciones y Acuerdos Especiales (Se incluirán en el contrato y propuesta PDF)" 
                multiline
                rows={3}
                fullWidth 
                placeholder="Indique aquí acuerdos de pago, plazos, condiciones verbales acordadas con el cliente, servicios de cortesía, etc."
                value={specialAgreementNotes}
                onChange={(e) => setSpecialAgreementNotes(e.target.value)}
              />
            </Paper>
          </Stack>
        </Grid>

        {/* Right Column: Dynamic Financial Summary & Action PDF Buttons */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <Box sx={{ position: { lg: 'sticky' }, top: { lg: 100 } }}>
            <Paper sx={{ 
              p: 3, 
              borderRadius: 4, 
              border: '2px solid', 
              borderColor: 'primary.main',
              boxShadow: '0 8px 30px rgba(37,99,235,0.08)' 
            }}>
              <Typography variant="h6" sx={{ fontWeight: 900, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalculateIcon color="primary" /> Resumen Financiero de la Licencia
              </Typography>

              {/* Modules breakdown table */}
              <TableContainer sx={{ mb: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Módulo Adquirido</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }} align="right">Año 1</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }} align="right">Año 2+</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {activeModulesList.map((m) => {
                      const hasPromo = m.promoPrice !== null && m.promoPrice !== undefined && m.promoPrice < m.initialPrice;
                      const effectivePrice = getEffectiveInitialPrice(m);
                      return (
                        <TableRow key={m.id}>
                          <TableCell sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                            {m.name}
                            {hasPromo && (
                              <Typography variant="caption" sx={{ display: 'block', color: '#b45309', fontWeight: 700, fontSize: '0.68rem' }}>
                                🎁 Oferta por compra de Base
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.8rem', fontWeight: 800 }} align="right">
                            {hasPromo ? (
                              <Box>
                                <Typography variant="caption" sx={{ textDecoration: 'line-through', color: 'text.disabled', display: 'block', fontSize: '0.68rem' }}>
                                  ${m.initialPrice}
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 900, color: '#d97706', fontSize: '0.82rem' }}>
                                  ${effectivePrice}
                                </Typography>
                              </Box>
                            ) : (
                              `$${effectivePrice}`
                            )}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.8rem', color: 'success.main', fontWeight: 700 }} align="right">${m.renewalPrice}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Unselected modules annex preview in right column */}
              {includeUnselectedInProposal && unselectedModulesList.length > 0 && (
                <Paper variant="outlined" sx={{ p: 1.5, mb: 2, borderRadius: 2.5, bgcolor: '#fcfcfd', borderStyle: 'dashed', borderColor: '#cbd5e1' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.8 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#334155', textTransform: 'uppercase', fontSize: '0.7rem' }}>
                      📋 Anexo: Módulos No Adquiridos (Informativo)
                    </Typography>
                    <Chip label="No sumados al total" size="small" sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700 }} />
                  </Box>
                  <Stack spacing={0.6}>
                    {unselectedModulesList.map(m => {
                      const hasPromo = m.promoPrice !== null && m.promoPrice !== undefined;
                      return (
                        <Box key={m.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', py: 0.3, borderBottom: '1px solid #f1f5f9' }}>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', pr: 1 }}>
                            • {m.name}
                          </Typography>
                          <Box sx={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                            {hasPromo ? (
                              <Typography variant="caption" sx={{ fontWeight: 800, color: '#b45309' }}>
                                <span style={{ textDecoration: 'line-through', color: '#94a3b8', marginRight: 4 }}>${m.initialPrice}</span>
                                🎁 ${m.promoPrice} USD
                              </Typography>
                            ) : (
                              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                ${m.initialPrice} USD
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      );
                    })}
                  </Stack>
                </Paper>
              )}

              <Divider sx={{ my: 2 }} />

              {/* Totals Summary */}
              <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 3, mb: 3 }}>
                {modulePromoSavings > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8, color: '#b45309' }}>
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>
                      🎁 Ahorro por Oferta en Módulos (Compra de Base):
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 800 }}>
                      -${modulePromoSavings.toFixed(2)} USD
                    </Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Subtotal Inicial (Servicios Cloud + Licencia):</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>${rawInitialTotal.toFixed(2)} USD</Typography>
                </Box>

                {hasSpecialAgreement && calculatedDiscount > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, color: 'error.main' }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      🏷️ {promoTitle || 'Descuento / Oferta'}:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>-${calculatedDiscount.toFixed(2)} USD</Typography>
                  </Box>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mt: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 900, color: 'primary.main', lineHeight: 1.1 }}>
                      Total Inversión Año 1:
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Setup Nube + Licencia (365 días)
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: 'primary.main', lineHeight: 1 }}>
                      ${finalInitialTotal.toFixed(2)} USD
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mt: 0.5 }}>
                      ≈ Bs. {totalInBsInitial.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mt: 2, pt: 1.5, borderTop: '1px dashed', borderColor: 'divider' }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: 'success.main' }}>
                      Renovación a partir del Año 2:
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Mantenimiento de Servidores + Soporte ($300 base + $200 extras)
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 900, color: 'success.main' }}>
                      ${renewalTotal.toFixed(2)} USD / año
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                      ≈ Bs. {totalInBsRenewal.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                </Box>

                {/* Forma de Pago configurable (ej: 60% adelante y 40% al terminar) */}
                <Paper variant="outlined" sx={{ mt: 2.5, p: 1.5, borderRadius: 2.5, bgcolor: '#f0fdf4', borderColor: '#86efac' }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: '#166534', display: 'block', mb: 1, letterSpacing: '0.3px', fontSize: '0.72rem' }}>
                    💳 Modalidad de Pago: {safeDownPaymentPercent}% Anticipo y {100 - safeDownPaymentPercent}% al Culminar
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.8 }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#14532d', fontSize: '0.8rem' }}>
                        1. Anticipo Inicial ({safeDownPaymentPercent}%):
                      </Typography>
                      <Typography variant="caption" color="text.secondary">Al firmar propuesta</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" sx={{ fontWeight: 900, color: '#15803d' }}>
                        ${downPaymentAmount.toFixed(2)} USD
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#475569', display: 'block', fontSize: '0.7rem' }}>
                        ≈ Bs. {(downPaymentAmount * customBcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ my: 0.8, borderStyle: 'dashed', borderColor: '#bbf7d0' }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e3a8a', fontSize: '0.8rem' }}>
                        2. Saldo Final ({100 - safeDownPaymentPercent}%):
                      </Typography>
                      <Typography variant="caption" color="text.secondary">Contra entrega e inducción</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" sx={{ fontWeight: 900, color: '#1e40af' }}>
                        ${finalPaymentAmount.toFixed(2)} USD
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#475569', display: 'block', fontSize: '0.7rem' }}>
                        ≈ Bs. {(finalPaymentAmount * customBcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>

                <Box sx={{ 
                  mt: 2, 
                  p: 1.25, 
                  bgcolor: '#f0f9ff', 
                  borderRadius: 2, 
                  border: '1px solid #bae6fd', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1 
                }}>
                  <InfoIcon sx={{ fontSize: 18, color: '#0284c7', flexShrink: 0 }} />
                  <Typography variant="caption" sx={{ color: '#0369a1', fontWeight: 600, fontSize: '0.74rem', lineHeight: 1.35 }}>
                    Nota: Los pagos en Bolívares (Bs.) se calculan a la tasa oficial del BCV vigente a la fecha de pago.
                  </Typography>
                </Box>
              </Box>

              {/* Action Buttons: PDF Generation */}
              <Stack spacing={2}>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<PdfIcon />}
                  onClick={handlePrintProposal}
                  sx={{ 
                    py: 1.5, 
                    borderRadius: 3, 
                    fontWeight: 800, 
                    fontSize: '0.95rem',
                    boxShadow: '0 4px 14px rgba(37,99,235,0.35)' 
                  }}
                >
                  📄 Descargar Propuesta Comercial (PDF)
                </Button>

                <Button
                  variant="contained"
                  color="success"
                  size="large"
                  startIcon={<DeliveryNoteIcon />}
                  onClick={handlePrintDeliveryNote}
                  sx={{ 
                    py: 1.5, 
                    borderRadius: 3, 
                    fontWeight: 800, 
                    fontSize: '0.95rem',
                    boxShadow: '0 4px 14px rgba(5,150,105,0.3)' 
                  }}
                >
                  📦 Generar Nota de Entrega de Licencia (PDF)
                </Button>

                {onProvisionTenant && (
                  <Button
                    variant="outlined"
                    color="inherit"
                    startIcon={<AddBusinessIcon />}
                    onClick={handleProvisionTenant}
                    sx={{ py: 1.2, borderRadius: 3, fontWeight: 700 }}
                  >
                    Crear Empresa con estos Módulos
                  </Button>
                )}
              </Stack>
            </Paper>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
