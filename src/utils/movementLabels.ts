const MODULE_LABELS_ES: Record<string, string> = {
  INVENTORY: 'INVENTARIO',
  PURCHASES: 'COMPRAS',
  SALES: 'VENTAS',
  TREASURY: 'TESORERÍA',
  ACCOUNTING: 'CONTABILIDAD',
  CASH: 'CAJA',
  PAYROLL: 'NÓMINA',
};

const OPERATION_LABELS_ES: Record<string, string> = {
  CHARGE: 'CARGO / ENTRADA',
  DISCHARGE: 'DESCARGO / SALIDA',
  ADJUSTMENT: 'AJUSTE',
  TRANSFER: 'TRANSFERENCIA',
  DISPATCH: 'DESPACHO',
  SALE: 'VENTA',
  PURCHASE: 'COMPRA',
  CREDIT_NOTE: 'NOTA DE CRÉDITO',
  DEBIT_NOTE: 'NOTA DE DÉBITO',
  PAYMENT_AR: 'COBRO (CxC)',
  PAYMENT_AP: 'PAGO (CxP)',
  JOURNAL_ENTRY: 'ASIENTO CONTABLE',
  CASH_OPEN: 'APERTURA CAJA',
  CASH_CLOSE: 'CIERRE CAJA',
};

export function formatMovementModule(code?: string, lang: string = 'es'): string {
  const key = (code || '').toUpperCase();
  if (lang.startsWith('en')) return key;
  return MODULE_LABELS_ES[key] || key;
}

export function formatMovementOperation(code?: string, lang: string = 'es'): string {
  const key = (code || '').toUpperCase();
  if (lang.startsWith('en')) return key;
  return OPERATION_LABELS_ES[key] || key;
}

