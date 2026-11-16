import api from '../api/axiosConfig';

export type PriceTier = 1 | 2 | 3;
export type EmissionMode = 'ambos' | 'termica' | 'digital';

/**
 * Obtiene el precio correspondiente al nivel seleccionado (Precio 1 por defecto, Precio 2 o Precio 3).
 * Si el Precio 2 o 3 no está configurado (<= 0), retorna el Precio 1 por defecto.
 */
export function getProductPriceByTier(product: any, tier: PriceTier): number {
  const p1 = Number(product?.price ?? product?.price_1 ?? 0);
  const p2 = Number(product?.price_2 ?? 0);
  const p3 = Number(product?.price_3 ?? 0);

  if (tier === 2 && p2 > 0) return p2;
  if (tier === 3 && p3 > 0) return p3;
  return p1;
}

export interface PrintableSaleData {
  id: number | string;
  invoiceNumber?: string;
  controlNumber?: string;
  createdAt?: string;
  currency: 'USD' | 'LOCAL' | 'VES' | string;
  exchangeRate: number;
  paymentMethod: string;
  customer?: {
    name?: string;
    tax_id?: string;
    address?: string;
    phone?: string;
    email?: string;
  } | null;
  items: Array<{
    sku?: string;
    name: string;
    quantity: number;
    unitPrice: number; // en USD base
    discount?: number;
    taxExempt?: boolean;
    priceTier?: PriceTier;
  }>;
  subtotalUsd: number;
  exemptUsd?: number;
  taxUsd: number;
  igtfUsd: number;
  totalUsd: number;
}

/**
 * Imprime el Ticket para Impresora Térmica (80mm / 58mm) cumpliendo normativa SENIAT Venezuela
 * e incluyendo el Logo de la Empresa.
 */
export function printThermalTicketVenezuela(sale: PrintableSaleData, tenant: any, widthMm: 80 | 58 = 80) {
  const win = window.open('', '_blank', `width=${widthMm === 80 ? 380 : 300},height=720`);
  if (!win) {
    // Fallback al endpoint PDF del backend si el bloqueador impide ventana emergente secundaria
    window.open(`${api.defaults.baseURL}/sales/${sale.id}/ticket`, '_blank');
    return;
  }

  const companyName = (tenant?.name || 'EMPRESA S.A.').toUpperCase();
  const companyRif = (tenant?.tax_id || 'J-00000000-0').toUpperCase();
  const companyAddress = tenant?.address || 'Domicilio Fiscal en Venezuela';
  const companyPhone = tenant?.phone || '';
  const invNum = sale.invoiceNumber || String(sale.id).padStart(8, '0');
  const ctrlNum = sale.controlNumber || `00-${String(sale.id).padStart(8, '0')}`;
  const dateStr = sale.createdAt ? new Date(sale.createdAt).toLocaleString('es-VE') : new Date().toLocaleString('es-VE');
  const rate = Number(sale.exchangeRate || 1);
  const isVes = sale.currency === 'LOCAL' || sale.currency === 'VES';
  const mult = isVes ? rate : 1;
  const sym = isVes ? 'Bs.' : '$';

  const logoHtml = tenant?.logo_url
    ? `<div style="text-align:center;margin-bottom:6px;"><img src="${tenant.logo_url}" alt="Logo" style="max-width:140px;max-height:60px;object-fit:contain;" /></div>`
    : '';

  const itemsHtml = sale.items.map((item) => {
    const discFactor = 1 - Number(item.discount || 0) / 100;
    const unitVal = item.unitPrice * discFactor * mult;
    const lineTotal = item.quantity * unitVal;
    const flag = item.taxExempt ? '(E)' : '(G)';
    const tierBadge = item.priceTier && item.priceTier > 1 ? ` [P${item.priceTier}]` : '';
    return `
      <div style="margin-bottom:4px;">
        <div style="display:flex;justify-content:space-between;font-weight:700;">
          <span>${item.name.substring(0, 26)}${tierBadge} ${flag}</span>
          <span>${sym}${lineTotal.toFixed(2)}</span>
        </div>
        <div style="font-size:10px;color:#333;">
          ${item.quantity} x ${sym}${unitVal.toFixed(2)}${item.discount ? ` (-${item.discount}%)` : ''}
        </div>
      </div>
    `;
  }).join('');

  const subtotalDisp = sale.subtotalUsd * mult;
  const exemptDisp = (sale.exemptUsd || 0) * mult;
  const taxDisp = sale.taxUsd * mult;
  const igtfDisp = sale.igtfUsd * mult;
  const totalDisp = sale.totalUsd * mult;
  const totalBs = sale.totalUsd * rate;

  win.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Ticket Fiscal #${invNum}</title>
        <style>
          @page { size: ${widthMm}mm auto; margin: 2mm; }
          body {
            font-family: 'Courier New', Courier, monospace;
            width: ${widthMm - 6}mm;
            margin: 0 auto;
            padding: 4px;
            font-size: 11px;
            color: #000;
          }
          .center { text-align: center; }
          .divider { border-top: 1px dashed #000; margin: 6px 0; }
          .row { display: flex; justify-content: space-between; margin: 2px 0; }
          .bold { font-weight: 700; }
          .no-print { text-align: center; margin-bottom: 8px; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="no-print">
          <button onclick="window.print()" style="padding:6px 12px;font-weight:bold;cursor:pointer;">🖨️ Imprimir Ticket (${widthMm}mm)</button>
        </div>
        ${logoHtml}
        <div class="center bold" style="font-size:13px;">${companyName}</div>
        <div class="center bold">R.I.F.: ${companyRif}</div>
        <div class="center" style="font-size:10px;">${companyAddress}</div>
        ${companyPhone ? `<div class="center" style="font-size:10px;">TELF: ${companyPhone}</div>` : ''}
        <div class="divider"></div>
        <div class="bold">FACTURA N°: ${invNum}</div>
        <div>N° CONTROL: ${ctrlNum}</div>
        <div>FECHA: ${dateStr}</div>
        <div class="divider"></div>
        <div><strong>RAZÓN SOCIAL:</strong> ${(sale.customer?.name || 'CONSUMIDOR FINAL').toUpperCase()}</div>
        <div><strong>RIF / C.I.:</strong> ${(sale.customer?.tax_id || 'V-00000000-0').toUpperCase()}</div>
        ${sale.customer?.address ? `<div><strong>DIRECCIÓN:</strong> ${sale.customer.address}</div>` : ''}
        ${sale.customer?.phone ? `<div><strong>TELF:</strong> ${sale.customer.phone}</div>` : ''}
        <div class="divider"></div>
        <div class="row bold">
          <span>CANT x PRECIO / DESCRIPCIÓN</span>
          <span>MONTO</span>
        </div>
        <div class="divider"></div>
        ${itemsHtml}
        <div class="divider"></div>
        ${exemptDisp > 0 ? `<div class="row"><span>Monto Exento (E):</span><span>${sym}${exemptDisp.toFixed(2)}</span></div>` : ''}
        <div class="row"><span>Base Imponible (G 16%):</span><span>${sym}${subtotalDisp.toFixed(2)}</span></div>
        <div class="row"><span>I.V.A. Alícuota General (16%):</span><span>${sym}${taxDisp.toFixed(2)}</span></div>
        ${igtfDisp > 0.001 ? `<div class="row"><span>I.G.T.F. Pagos Divisas (3%):</span><span>${sym}${igtfDisp.toFixed(2)}</span></div>` : ''}
        <div class="divider"></div>
        <div class="row bold" style="font-size:13px;">
          <span>TOTAL FACTURA:</span>
          <span>${sym}${totalDisp.toFixed(2)}</span>
        </div>
        <div class="row bold" style="font-size:11px;margin-top:4px;">
          <span>EQUIVALENTE EN BOLÍVARES:</span>
          <span>Bs. ${totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <div style="font-size:10px;text-align:right;">Tasa Oficial BCV: Bs. ${rate.toFixed(2)} / USD</div>
        <div class="divider"></div>
        <div class="center bold" style="font-size:10px;">DOCUMENTO FISCAL EMITIDO CONFORME AL SENIAT</div>
        <div class="center" style="font-size:9px;">Providencias SNAT/2011/00071 y SNAT/2014/0032</div>
        <div class="center" style="font-size:10px;margin-top:4px;">¡Gracias por su compra!</div>
        <script>
          window.onload = function() { setTimeout(function() { window.print(); }, 250); };
        </script>
      </body>
    </html>
  `);
  win.document.close();
}

/**
 * Genera e imprime/visualiza la Factura Digital SENIAT Venezuela (Tamaño Carta / Forma Libre Digital)
 * con el Logo de la Empresa y todos los requisitos de ley exigidos en Venezuela.
 */
export function printDigitalInvoiceVenezuela(sale: PrintableSaleData, tenant: any) {
  const win = window.open('', '_blank');
  if (!win) {
    window.open(`${api.defaults.baseURL}/sales/${sale.id}/invoice`, '_blank');
    return;
  }

  const brandColor = tenant?.primary_color || '#1e3a8a';
  const companyName = (tenant?.name || 'EMPRESA S.A.').toUpperCase();
  const companyRif = (tenant?.tax_id || 'J-00000000-0').toUpperCase();
  const companyAddress = tenant?.address || 'Domicilio Fiscal en Venezuela';
  const companyPhone = tenant?.phone || 'N/A';
  const companyEmail = tenant?.email || '';

  const invNum = sale.invoiceNumber || String(sale.id).padStart(8, '0');
  const ctrlNum = sale.controlNumber || `00-${String(sale.id).padStart(8, '0')}`;
  const dateStr = sale.createdAt ? new Date(sale.createdAt).toLocaleString('es-VE') : new Date().toLocaleString('es-VE');
  const rate = Number(sale.exchangeRate || 1);
  const isVes = sale.currency === 'LOCAL' || sale.currency === 'VES';
  const mult = isVes ? rate : 1;
  const sym = isVes ? 'Bs.' : '$';

  const paymentLabels: Record<string, string> = {
    cash: 'EFECTIVO DIVISAS / CAJA',
    efectivo_bs: 'EFECTIVO BOLÍVARES',
    card: 'PUNTO DE VENTA / TARJETA',
    punto_venta: 'PUNTO DE VENTA (TDD / TDC)',
    pago_movil: 'PAGO MÓVIL INTERBANCARIO',
    transfer: 'TRANSFERENCIA BANCARIA',
    zelle: 'ZELLE / DIVISAS ELECTRÓNICAS',
    credit: 'CRÉDITO COMERCIAL',
  };

  const logoHtml = tenant?.logo_url
    ? `<img src="${tenant.logo_url}" alt="Logo Empresa" style="max-height:78px;max-width:190px;object-fit:contain;margin-bottom:6px;" />`
    : `<div style="font-size:24px;font-weight:900;color:${brandColor};margin-bottom:4px;">${companyName}</div>`;

  const rowsHtml = sale.items.map((item, idx) => {
    const discFactor = 1 - Number(item.discount || 0) / 100;
    const unitVal = item.unitPrice * discFactor * mult;
    const lineTotal = item.quantity * unitVal;
    const taxLabel = item.taxExempt ? 'EXENTO (E)' : '16% (G)';
    const tierBadge = item.priceTier ? `Precio ${item.priceTier}` : 'Precio 1';
    return `
      <tr>
        <td style="padding:9px 8px;border-bottom:1px solid #e2e8f0;text-align:center;">${idx + 1}</td>
        <td style="padding:9px 8px;border-bottom:1px solid #e2e8f0;font-family:monospace;">${item.sku || `ITEM-${idx + 1}`}</td>
        <td style="padding:9px 8px;border-bottom:1px solid #e2e8f0;">
          <strong>${item.name}</strong>
          <span style="font-size:10px;color:#64748b;margin-left:6px;">(${tierBadge})</span>
        </td>
        <td style="padding:9px 8px;border-bottom:1px solid #e2e8f0;text-align:center;">${item.quantity}</td>
        <td style="padding:9px 8px;border-bottom:1px solid #e2e8f0;text-align:right;">${sym}${unitVal.toFixed(2)}</td>
        <td style="padding:9px 8px;border-bottom:1px solid #e2e8f0;text-align:center;">${item.discount ? `${item.discount}%` : '0%'}</td>
        <td style="padding:9px 8px;border-bottom:1px solid #e2e8f0;text-align:center;font-size:11px;font-weight:700;">${taxLabel}</td>
        <td style="padding:9px 8px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700;">${sym}${lineTotal.toFixed(2)}</td>
      </tr>
    `;
  }).join('');

  const subtotalDisp = sale.subtotalUsd * mult;
  const exemptDisp = (sale.exemptUsd || 0) * mult;
  const taxDisp = sale.taxUsd * mult;
  const igtfDisp = sale.igtfUsd * mult;
  const totalDisp = sale.totalUsd * mult;
  const totalBs = sale.totalUsd * rate;

  win.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Factura Digital SENIAT #${invNum}</title>
        <style>
          body { font-family: 'Inter', 'Segoe UI', Arial, sans-serif; color: #0f172a; margin: 28px 36px; font-size: 12px; }
          .top-bar { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid ${brandColor}; padding-bottom: 16px; margin-bottom: 18px; }
          .fiscal-box { border: 2px solid ${brandColor}; border-radius: 10px; padding: 12px 16px; min-width: 250px; background: #f8fafc; }
          .client-box { border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px 16px; background: #f8fafc; margin-bottom: 18px; }
          .client-grid { display: grid; grid-template-columns: 1.4fr 1fr; gap: 8px 16px; }
          table.items { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          table.items th { background: ${brandColor}; color: #fff; padding: 9px 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.3px; }
          .totals-wrap { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; margin-top: 10px; }
          .bcv-box { flex: 1; border: 1px dashed #64748b; border-radius: 10px; padding: 12px; background: #f1f5f9; font-size: 11px; }
          .totals-table { width: 320px; border-collapse: collapse; }
          .totals-table td { padding: 6px 10px; border-bottom: 1px solid #e2e8f0; }
          .totals-table tr.grand-total td { background: ${brandColor}; color: #fff; font-weight: 900; font-size: 14px; border: none; }
          .no-print { margin-bottom: 14px; display: flex; gap: 10px; }
          @media print { .no-print { display: none; } body { margin: 12px 18px; } }
        </style>
      </head>
      <body>
        <div class="no-print">
          <button onclick="window.print()" style="background:${brandColor};color:#fff;border:none;padding:8px 16px;border-radius:6px;font-weight:700;cursor:pointer;">
            🖨️ Imprimir / Guardar Factura Digital PDF
          </button>
          <a href="${api.defaults.baseURL}/sales/${sale.id}/invoice" target="_blank" style="text-decoration:none;background:#e2e8f0;color:#0f172a;padding:8px 14px;border-radius:6px;font-weight:700;">
            📄 Ver PDF Oficial del Servidor
          </a>
        </div>

        <div class="top-bar">
          <div>
            ${logoHtml}
            <div style="font-size:15px;font-weight:900;color:${brandColor};">${companyName}</div>
            <div style="font-weight:800;font-size:12px;">R.I.F.: ${companyRif}</div>
            <div style="color:#334155;max-width:420px;"><strong>Domicilio Fiscal:</strong> ${companyAddress}</div>
            <div style="color:#334155;"><strong>Teléfono:</strong> ${companyPhone} ${companyEmail ? `| <strong>Email:</strong> ${companyEmail}` : ''}</div>
          </div>
          <div class="fiscal-box">
            <div style="font-size:14px;font-weight:900;color:${brandColor};text-align:center;border-bottom:1px solid #cbd5e1;padding-bottom:6px;margin-bottom:8px;">
              FACTURA FISCAL / DIGITAL
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
              <strong>N° DE FACTURA:</strong>
              <span style="color:#dc2626;font-weight:900;font-size:14px;">${invNum}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
              <strong>N° DE CONTROL:</strong>
              <span style="font-weight:900;font-family:monospace;font-size:13px;">${ctrlNum}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
              <strong>Fecha y Hora:</strong>
              <span>${dateStr}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <strong>Condición / Pago:</strong>
              <span>${paymentLabels[sale.paymentMethod] || sale.paymentMethod.toUpperCase()}</span>
            </div>
          </div>
        </div>

        <div class="client-box">
          <div style="font-weight:800;color:${brandColor};font-size:11px;text-transform:uppercase;margin-bottom:6px;border-bottom:1px solid #e2e8f0;padding-bottom:4px;">
            Datos Fiscales del Adquiriente / Receptor (SENIAT)
          </div>
          <div class="client-grid">
            <div><strong>Nombre o Razón Social:</strong> ${(sale.customer?.name || 'CONSUMIDOR FINAL').toUpperCase()}</div>
            <div><strong>R.I.F. / Cédula de Identidad:</strong> ${(sale.customer?.tax_id || 'V-00000000-0').toUpperCase()}</div>
            <div><strong>Domicilio Fiscal / Dirección:</strong> ${sale.customer?.address || 'Ciudad - Venezuela'}</div>
            <div><strong>Teléfono:</strong> ${sale.customer?.phone || 'N/A'}</div>
          </div>
        </div>

        <table class="items">
          <thead>
            <tr>
              <th style="width:4%;">#</th>
              <th style="width:13%;text-align:left;">Código / SKU</th>
              <th style="text-align:left;">Descripción del Producto o Servicio</th>
              <th style="width:8%;">Cant.</th>
              <th style="width:13%;text-align:right;">Precio Unit.</th>
              <th style="width:8%;">Desc.</th>
              <th style="width:11%;">Alícuota</th>
              <th style="width:14%;text-align:right;">Total Renglón</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="totals-wrap">
          <div class="bcv-box">
            <div style="font-weight:800;color:#0f172a;margin-bottom:6px;">INFORMACIÓN BIMONETARIA Y FISCAL (SENIAT / BCV)</div>
            <div>• <strong>Tasa de Cambio Oficial BCV aplicada:</strong> Bs. ${rate.toFixed(4)} por 1,00 USD.</div>
            <div>• <strong>Base Imponible Equivalente en Bs.:</strong> Bs. ${(sale.subtotalUsd * rate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div>• <strong>Impuesto I.V.A. (16%) Equivalente en Bs.:</strong> Bs. ${(sale.taxUsd * rate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            ${sale.igtfUsd > 0 ? `<div>• <strong>I.G.T.F. (3% Pagos en Divisas) Equivalente en Bs.:</strong> Bs. ${(sale.igtfUsd * rate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>` : ''}
            <div style="margin-top:6px;font-size:13px;font-weight:900;color:${brandColor};">
              TOTAL EQUIVALENTE EN BOLÍVARES: Bs. ${totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style="margin-top:8px;font-size:10px;color:#475569;">
              Documento emitido conforme a las Providencias Administrativas del SENIAT N° SNAT/2011/00071 y SNAT/2014/0032 (Facturación Digital y/o Impresión Térmica Autorizada).
            </div>
          </div>

          <table class="totals-table">
            ${exemptDisp > 0 ? `<tr><td>Monto Exento o Exonerado (E):</td><td style="text-align:right;font-weight:700;">${sym}${exemptDisp.toFixed(2)}</td></tr>` : ''}
            <tr>
              <td>Base Imponible Alícuota General (G 16%):</td>
              <td style="text-align:right;font-weight:700;">${sym}${subtotalDisp.toFixed(2)}</td>
            </tr>
            <tr>
              <td>Impuesto al Valor Agregado I.V.A. (16%):</td>
              <td style="text-align:right;font-weight:700;">${sym}${taxDisp.toFixed(2)}</td>
            </tr>
            ${igtfDisp > 0.001 ? `
              <tr>
                <td style="color:#b45309;font-weight:700;">I.G.T.F. (3% Pagos en Divisas):</td>
                <td style="text-align:right;color:#b45309;font-weight:700;">${sym}${igtfDisp.toFixed(2)}</td>
              </tr>
            ` : ''}
            <tr class="grand-total">
              <td>TOTAL A PAGAR (${isVes ? 'VES' : 'USD'}):</td>
              <td style="text-align:right;">${sym}${totalDisp.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="font-weight:800;color:#1e293b;">Equivalente en Bolívares (BCV):</td>
              <td style="text-align:right;font-weight:900;color:#1e293b;">Bs. ${totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
          </table>
        </div>
      </body>
    </html>
  `);
  win.document.close();
}

/**
 * Ejecuta la emisión según el modo seleccionado:
 * - 'ambos': Impresión Térmica + Factura Digital SENIAT en paralelo
 * - 'termica': Solo Ticket Térmico (80mm / 58mm)
 * - 'digital': Solo Factura Digital SENIAT
 */
export function executeFiscalEmission(
  mode: EmissionMode,
  sale: PrintableSaleData,
  tenant: any,
  thermalWidthMm: 80 | 58 = 80
) {
  if (mode === 'termica') {
    printThermalTicketVenezuela(sale, tenant, thermalWidthMm);
  } else if (mode === 'digital') {
    printDigitalInvoiceVenezuela(sale, tenant);
  } else {
    // Ambos en paralelo (Impresora Térmica + Factura Digital SENIAT)
    printDigitalInvoiceVenezuela(sale, tenant);
    setTimeout(() => {
      printThermalTicketVenezuela(sale, tenant, thermalWidthMm);
    }, 300);
  }
}

/**
 * Construye localmente o consulta al backend el JSON estándar SENIAT Venezuela
 * listo para ser enviado vía API REST a la empresa proveedora de Facturación Digital.
 */
export async function fetchSaleDigitalInvoiceJson(sale: PrintableSaleData, tenant: any): Promise<any> {
  try {
    const res = await api.get(`/sales/${sale.id}/digital-invoice-json`);
    return res.data;
  } catch {
    // Fallback local en caso de modo contingencia u offline
    const rate = Number(sale.exchangeRate || 1);
    return {
      version_esquema: 'SENIAT-VE-1.0',
      normativa_legal: 'Providencias Administrativas SENIAT SNAT/2014/0032 y SNAT/2011/00071',
      documento: {
        tipo_documento: '01',
        nombre_tipo_documento: 'FACTURA',
        id_interno_erp: sale.id,
        numero_factura: sale.invoiceNumber,
        numero_control: sale.controlNumber,
        serie: 'A',
        fecha_hora_iso: sale.createdAt || new Date().toISOString(),
        condicion_pago: sale.paymentMethod === 'credit' ? 'CREDITO' : 'CONTADO',
        metodo_pago: sale.paymentMethod.toUpperCase(),
        moneda_operacion: sale.currency === 'LOCAL' ? 'VES' : sale.currency,
        tasa_cambio_bcv: rate,
      },
      emisor: {
        razon_social: tenant?.name || 'EMPRESA EMISORA S.A.',
        rif: (tenant?.tax_id || 'J-00000000-0').toUpperCase(),
        domicilio_fiscal: tenant?.address || 'Venezuela',
        telefono: tenant?.phone || '',
      },
      adquiriente: {
        razon_social: (sale.customer?.name || 'CONSUMIDOR FINAL').toUpperCase(),
        rif_ci: (sale.customer?.tax_id || 'V-00000000-0').toUpperCase(),
        domicilio_fiscal: sale.customer?.address || 'Venezuela',
        telefono: sale.customer?.phone || '',
      },
      items: sale.items.map((it, idx) => ({
        numero_linea: idx + 1,
        codigo_sku: it.sku || `ITEM-${idx + 1}`,
        descripcion: it.name,
        cantidad: it.quantity,
        indicador_fiscal: it.taxExempt ? 'E' : 'G',
        alicuota_iva_porcentaje: it.taxExempt ? 0 : 16,
        precio_unitario_usd: Number(it.unitPrice.toFixed(4)),
        subtotal_usd: Number((it.quantity * it.unitPrice * (1 - (it.discount || 0) / 100)).toFixed(4)),
        precio_unitario_ves: Number((it.unitPrice * rate).toFixed(2)),
        subtotal_ves: Number((it.quantity * it.unitPrice * (1 - (it.discount || 0) / 100) * rate).toFixed(2)),
      })),
      totales: {
        moneda_base: 'USD',
        tasa_bcv: rate,
        divisas_usd: {
          base_imponible_general_16: Number(sale.subtotalUsd.toFixed(2)),
          monto_iva_16: Number(sale.taxUsd.toFixed(2)),
          monto_igtf_3: Number(sale.igtfUsd.toFixed(2)),
          total_a_pagar: Number(sale.totalUsd.toFixed(2)),
        },
        bolivares_ves: {
          base_imponible_general_16: Number((sale.subtotalUsd * rate).toFixed(2)),
          monto_iva_16: Number((sale.taxUsd * rate).toFixed(2)),
          monto_igtf_3: Number((sale.igtfUsd * rate).toFixed(2)),
          total_a_pagar: Number((sale.totalUsd * rate).toFixed(2)),
        },
      },
    };
  }
}

/**
 * Consume el endpoint del backend que envía el JSON vía API REST a la empresa proveedora
 * de Facturación Digital autorizada por el SENIAT.
 */
export async function sendSaleToDigitalProviderApi(saleId: number | string): Promise<any> {
  const res = await api.post(`/sales/${saleId}/send-digital-invoice`);
  return res.data;
}


