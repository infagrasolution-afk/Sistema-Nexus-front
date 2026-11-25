export interface TutorialVideoItem {
  id: string;
  order: number;
  moduleGroup: string;
  title: string;
  description: string;
  topics: string[];
  fileSlug: string;
  /** Pega aquí el enlace de YouTube (ej. https://youtu.be/XXXX o https://www.youtube.com/watch?v=XXXX) */
  youtubeUrl: string;
}

export function toYoutubeEmbedUrl(rawUrl: string): string | null {
  const url = (rawUrl || '').trim();
  if (!url) return null;
  if (url.includes('youtube.com/embed/')) return url;
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}?rel=0`;
  const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{6,})/);
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}?rel=0`;
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return `https://www.youtube.com/embed/${url}?rel=0`;
  return url;
}

export const TUTORIAL_VIDEOS: TutorialVideoItem[] = [
  {
    id: '01-pos',
    order: 1,
    moduleGroup: 'Ventas y Facturación',
    title: 'Punto de Venta (POS) Completo',
    description:
      'Recorrido paso a paso desde el inicio de sesión y apertura de caja hasta la facturación SENIAT y arqueo de cierre.',
    topics: [
      'Inicio de sesión y Tablero Principal',
      'Apertura de Caja (fondo inicial)',
      'Tasa Oficial BCV, modo Offline y Almacén',
      'Búsqueda de productos y Niveles de Precio (P1, P2, P3)',
      'Carrito, descuentos, IVA 16% e IGTF 3%',
      'Métodos de pago, USD/VES y Ventas en Espera',
      'Datos fiscales del cliente y emisión Térmica / Digital',
      'Comprobantes post-venta y Cierre de Caja (Arqueo)',
    ],
    fileSlug: '01_modulo_ventas_punto_de_venta_pos.mp4',
    youtubeUrl: '',
  },
  {
    id: '02-facturacion-presupuestos',
    order: 2,
    moduleGroup: 'Ventas y Facturación',
    title: 'Facturación SENIAT, Presupuestos y Notas de Entrega',
    description:
      'Cómo emitir facturas manuales SENIAT, armar cotizaciones comerciales convertibles a factura y generar notas de entrega.',
    topics: [
      'Facturación SENIAT directa y carga de presupuestos',
      'Selección de almacén, tarifa y N° de Control',
      'Creación de Presupuestos Comerciales y PDF',
      'Conversión directa de presupuesto a factura',
      'Emisión de Notas de Entrega para despacho',
    ],
    fileSlug: '02_modulo_ventas_facturacion_presupuestos_entregas.mp4',
    youtubeUrl: '',
  },
  {
    id: '03-clientes-notas',
    order: 3,
    moduleGroup: 'Ventas y Facturación',
    title: 'Clientes, Notas de Débito y Notas de Crédito',
    description:
      'Gestión del directorio de clientes, carga masiva en Excel y emisión de notas de débito y crédito fiscales.',
    topics: [
      'Directorio de Clientes y búsqueda por RIF',
      'Importación masiva con plantilla Excel (.xlsx)',
      'Registro manual de ficha fiscal del cliente',
      'Emisión de Notas de Débito',
      'Emisión de Notas de Crédito y devoluciones',
    ],
    fileSlug: '03_modulo_ventas_clientes_notas_ajuste.mp4',
    youtubeUrl: '',
  },
  {
    id: '04-catalogo-almacenes-kardex',
    order: 4,
    moduleGroup: 'Inventario y WMS',
    title: 'Catálogo de Productos, Almacenes y Kardex',
    description:
      'Creación de productos con costos y 3 niveles de precio, configuración de almacenes y control de Kardex.',
    topics: [
      'Catálogo maestro, recálculo por margen e importación Excel',
      'Creación de producto (SKU, costo y precios P1, P2, P3)',
      'Almacenes, ubicaciones (Bins) y alertas de stock mínimo',
      'Kardex de movimientos y carga inicial de inventario',
    ],
    fileSlug: '04_modulo_inventario_catalogo_almacenes_kardex.mp4',
    youtubeUrl: '',
  },
  {
    id: '05-operaciones-wms',
    order: 5,
    moduleGroup: 'Inventario y WMS',
    title: 'Auditoría, Ajustes, Cargos, Descargos y Transferencias',
    description:
      'Operaciones avanzadas de almacén para mantener el inventario auditado y sincronizado entre sucursales.',
    topics: [
      'Conteo físico y Auditoría de inventario',
      'Ajustes de stock positivos y negativos',
      'Cargos (entradas) y Descargos (mermas)',
      'Transferencias entre almacenes y Notas de Despacho',
    ],
    fileSlug: '05_modulo_inventario_operaciones_wms.mp4',
    youtubeUrl: '',
  },
  {
    id: '06-contabilidad',
    order: 6,
    moduleGroup: 'Contabilidad VEN-NIF',
    title: 'Plan de Cuentas, Libro Diario y Conciliación Bancaria',
    description:
      'Gestión contable bajo normas VEN-NIF, asientos automáticos/manuales, balances y conciliación bancaria.',
    topics: [
      'Plan de Cuentas VEN-NIF e importación Excel',
      'Libro Diario y asientos manuales cuadrados',
      'Balance de Comprobación y Balance General',
      'Conciliación Bancaria contra estados de cuenta',
    ],
    fileSlug: '06_modulo_contabilidad_ven_nif.mp4',
    youtubeUrl: '',
  },
  {
    id: '07-tesoreria',
    order: 7,
    moduleGroup: 'Tesorería y Finanzas',
    title: 'Cuentas por Cobrar, Cuentas por Pagar, Bancos y Caja',
    description:
      'Control de cobranzas, pagos a proveedores, cuentas bancarias en VES/USD y supervisión de cajas.',
    topics: [
      'Cuentas por Cobrar (CxC) y registro de abonos',
      'Cuentas por Pagar (CxP) a proveedores',
      'Cuentas bancarias en Bolívares, Dólares y Zelle',
      'Supervisión de Caja y Arqueo Diario',
    ],
    fileSlug: '07_modulo_tesoreria_finanzas.mp4',
    youtubeUrl: '',
  },
  {
    id: '08-nomina',
    order: 8,
    moduleGroup: 'Nómina (LOTTT)',
    title: 'Trabajadores y Cálculo de Nómina (IVSS / FAOV)',
    description:
      'Registro de empleados, configuración de deducciones de ley LOTTT y apertura/cálculo de períodos de nómina.',
    topics: [
      'Directorio de Trabajadores',
      'Ficha laboral y deducciones (SSO, RPE, FAOV, Cestaticket)',
      'Apertura y cálculo de períodos de nómina',
    ],
    fileSlug: '08_modulo_nomina_lottt.mp4',
    youtubeUrl: '',
  },
  {
    id: '09-compras',
    order: 9,
    moduleGroup: 'Compras y Proveedores',
    title: 'Directorio de Proveedores y Órdenes de Compra',
    description:
      'Registro de proveedores, carga de facturas de compra, retenciones IVA/ISLR e ingreso automático a stock.',
    topics: [
      'Directorio de Proveedores e importación Excel',
      'Historial y recepción de Órdenes de Compra',
      'Registro de compra con factura, control SENIAT y retenciones',
    ],
    fileSlug: '09_modulo_compras_proveedores.mp4',
    youtubeUrl: '',
  },
  {
    id: '10-administracion',
    order: 10,
    moduleGroup: 'Administración',
    title: 'Reportes SENIAT, Usuarios, Roles y Configuración',
    description:
      'Generación de libros fiscales SENIAT, creación de usuarios, permisos por rol y personalización de la empresa.',
    topics: [
      'Reportes y Libros Fiscales SENIAT (Ventas / Compras)',
      'Creación y gestión de Usuarios y Accesos',
      'Roles y Permisos granulares por módulo',
      'Configuración de Empresa, RIF y logotipo',
    ],
    fileSlug: '10_modulo_administracion_reportes_roles.mp4',
    youtubeUrl: '',
  },
];

