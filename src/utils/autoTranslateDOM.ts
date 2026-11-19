/**
 * Traductor automático ligero para textos de interfaz ES <-> EN.
 * Preserva el texto original en español mediante WeakMap para restaurarlo intacto al volver a ES.
 */
const ES_TO_EN_EXACT: Record<string, string> = {
  // Navegación / Módulos / Sidebar
  'Ventas y Facturación': 'Sales & Billing',
  'Punto de Venta (POS)': 'Point of Sale (POS)',
  'Facturación SENIAT': 'SENIAT Billing',
  'Facturación Manual': 'Manual Billing',
  'Presupuestos': 'Quotes & Budgets',
  'Presupuestos y Cotizaciones': 'Quotes & Proposals',
  'Notas de Entrega': 'Delivery Notes',
  'Clientes': 'Customers',
  'Clientes y Contactos': 'Customers & Contacts',
  'Notas de Débito': 'Debit Notes',
  'Notas de Crédito': 'Credit Notes',
  'Inventario y WMS': 'Inventory & WMS',
  'Catálogo de Productos': 'Product Catalog',
  'Almacenes y Stock Mín.': 'Warehouses & Min. Stock',
  'Kardex y Movimientos': 'Kardex & Movements',
  'Conteo / Auditoría': 'Stock Count / Audit',
  'Ajustes de Stock': 'Stock Adjustments',
  'Cargos (Entradas)': 'Stock Charges (In)',
  'Descargos (Mermas)': 'Stock Discharges (Out)',
  'Transferencias': 'Transfers',
  'Notas de Despacho': 'Dispatch Notes',
  'Contabilidad VEN-NIF': 'Accounting (VEN-NIF)',
  'Plan de Cuentas': 'Chart of Accounts',
  'Libro Diario': 'General Journal',
  'Conciliación Bancaria': 'Bank Reconciliation',
  'Tesorería y Finanzas': 'Treasury & Finance',
  'Cuentas por Cobrar': 'Accounts Receivable',
  'Cuentas por Pagar': 'Accounts Payable',
  'Cuentas por Pagar (CxP)': 'Accounts Payable (AP)',
  'Bancos (VES / USD)': 'Banks (VES / USD)',
  'Caja y Arqueo Diario': 'Cash & Daily Close',
  'Nómina (LOTTT)': 'Payroll (HR)',
  'Trabajadores': 'Employees',
  'Cálculo IVSS / FAOV': 'Payroll & Tax Calc',
  'Compras y Proveedores': 'Purchases & Suppliers',
  'Órdenes de Compra': 'Purchase Orders',
  'Directorio de Proveedores': 'Suppliers Directory',
  'Administración': 'Administration',
  'Reportes y Libros SENIAT': 'Reports & Tax Books',
  'Usuarios y Accesos': 'Users & Access',
  'Roles y Permisos': 'Roles & Permissions',
  'Configuración de Empresa': 'Company Settings',
  'Manual SENIAT y Ayuda': 'Help & Tax Manual',
  'Súper Admin SaaS': 'SaaS Super Admin',
  'Panel SaaS': 'SaaS Panel',
  'Configuración': 'Settings',
  'Cerrar Sesión': 'Logout',
  'Súper Admin': 'Super Admin',
  'APEX ERP Empresarial': 'APEX ERP Enterprise',
  'APEX ERP • Súper Admin': 'APEX ERP • Super Admin',
  'Sucursal Activa': 'Active Branch',
  'Sucursal Principal': 'Main Branch',

  // Dashboard y Tablas
  'Fecha / Hora': 'Date / Time',
  'Fecha': 'Date',
  'Hora': 'Time',
  'Módulo': 'Module',
  'Operación': 'Operation',
  'Descripción': 'Description',
  'Monto / Cant.': 'Amount / Qty',
  'Usuario': 'User',
  'IP': 'IP',
  'Acciones': 'Actions',
  'Acción': 'Action',
  'Estado': 'Status',
  'Cliente': 'Customer',
  'Proveedor': 'Supplier',
  'Producto': 'Product',
  'Cant.': 'Qty',
  'Subtotal': 'Subtotal',
  'Total': 'Total',
  'Buscar': 'Search',
  'Guardar': 'Save',
  'Cancelar': 'Cancel',
  'Cerrar': 'Close',
  'Exportar CSV': 'Export CSV',
  'Imprimir PDF': 'Print PDF',
  'Nuevo Producto': 'New Product',
  'Nuevo Presupuesto': 'New Quote',
  'Nuevo Almacén (+ Stock Mínimo)': 'New Warehouse (+ Min. Stock)',
  'Stock Mínimo por Producto': 'Min. Stock per Product',
  'Agregar Producto': 'Add Product',
  'Gestión de Inventario': 'Inventory Management',
  'Datos del Cliente y Despacho': 'Customer & Dispatch Info',
  'Renglones de Factura': 'Invoice Line Items',
  'Resumen de Pago': 'Payment Summary',
  'Método de Pago': 'Payment Method',
  'Moneda de Pago': 'Payment Currency',
  'Descuento Global (%)': 'Global Discount (%)',
  'Emitir Factura': 'Issue Invoice',
  'Cargar Presupuesto': 'Load Quote',
  'Centro de Inteligencia y Reportes': 'Intelligence & Reports Center',
  'Reportes de Ventas': 'Sales Reports',
  'Reportes de Inventario': 'Inventory Reports',
  'Reportes Contables': 'Accounting Reports',
  'Reportes de Compras': 'Purchase Reports',
  'Obligaciones SENIAT': 'Tax Obligations (SENIAT)',
  'Bitácora Universal y Seguridad (IP)': 'Universal Log & Security (IP)',
  'Tesorería, Bancos y CxC/CxP': 'Treasury, Banks & AR/AP',
  'Nómina y RRHH (LOTTT)': 'Payroll & HR',
  'Desde': 'From',
  'Hasta': 'To',
  'Hoy': 'Today',
  'Mes': 'Month',
  'Limpiar': 'Clear',
  'Ver Almacenes': 'View Warehouses',
  'Reponer en Compras': 'Restock in Purchases',
  'Configuración de la Empresa': 'Company Settings',
  'Guardar Cambios': 'Save Changes',
  'Cambiar Mi Contraseña': 'Change My Password',
  'Actualizar Contraseña': 'Update Password',
  'Activar 2FA (Generar QR)': 'Enable 2FA (Generate QR)',
  'Confirmar 2FA': 'Confirm 2FA',
  'Desactivar 2FA': 'Disable 2FA',
  'No se encontraron productos.': 'No products found.',
  'No hay presupuestos registrados aún.': 'No quotes registered yet.',
  'Aún no hay movimientos recientes. Las ventas, compras y ajustes aparecerán aquí en vivo.': 'No recent movements yet. Sales, purchases, and adjustments will appear here live.',
};

const originalTextMap = new WeakMap<Text, string>();
let activeObserver: MutationObserver | null = null;
let currentTargetLang: 'es' | 'en' = 'es';

function translateTextNode(node: Text, lang: 'es' | 'en') {
  const raw = node.nodeValue;
  if (!raw || !raw.trim()) return;

  if (!originalTextMap.has(node)) {
    originalTextMap.set(node, raw);
  }
  const original = originalTextMap.get(node) || raw;

  if (lang === 'es') {
    if (node.nodeValue !== original) {
      node.nodeValue = original;
    }
    return;
  }

  const trimmed = original.trim();
  // Match exact phrase
  const exact = ES_TO_EN_EXACT[trimmed];
  if (exact) {
    const leading = original.match(/^\s*/)?.[0] || '';
    const trailing = original.match(/\s*$/)?.[0] || '';
    const nextVal = `${leading}${exact}${trailing}`;
    if (node.nodeValue !== nextVal) {
      node.nodeValue = nextVal;
    }
    return;
  }

  // Match patterns with numbers like "7 opciones" -> "7 options"
  const optMatch = trimmed.match(/^(\d+)\s+opciones$/i);
  if (optMatch) {
    const nextVal = `${optMatch[1]} options`;
    if (node.nodeValue !== nextVal) node.nodeValue = nextVal;
    return;
  }

  const repMatch = trimmed.match(/^(\d+)\s+reportes disponibles$/i);
  if (repMatch) {
    const nextVal = `${repMatch[1]} available reports`;
    if (node.nodeValue !== nextVal) node.nodeValue = nextVal;
  }
}

function walkAndTranslate(root: Node, lang: 'es' | 'en') {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      const tag = parent.tagName;
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'CODE' || tag === 'PRE') {
        return NodeFilter.FILTER_REJECT;
      }
      if (parent.closest('[data-no-translate="true"]')) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let current = walker.nextNode();
  while (current) {
    translateTextNode(current as Text, lang);
    current = walker.nextNode();
  }
}

export function applyGlobalLanguageDOM(lang: 'es' | 'en') {
  currentTargetLang = lang;
  const root = document.getElementById('root') || document.body;
  if (!root) return;

  walkAndTranslate(root, lang);

  if (activeObserver) {
    activeObserver.disconnect();
    activeObserver = null;
  }

  if (lang === 'en') {
    activeObserver = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'childList') {
          m.addedNodes.forEach((n) => walkAndTranslate(n, currentTargetLang));
        } else if (m.type === 'characterData' && m.target.nodeType === Node.TEXT_NODE) {
          translateTextNode(m.target as Text, currentTargetLang);
        }
      }
    });
    activeObserver.observe(root, { childList: true, subtree: true, characterData: true });
  }
}

