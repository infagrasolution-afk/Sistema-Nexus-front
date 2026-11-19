import {
  Inventory2Rounded as Inventory,
  PointOfSaleRounded as PointOfSale,
  PeopleAltRounded as People,
  SettingsSuggestRounded as Settings,
  InsightsRounded as Assessment,
  LocalShippingRounded as LocalShipping,
  ShoppingCartCheckoutRounded as ShoppingCart,
  DomainRounded as Business,
  SwapHorizRounded as CompareArrows,
  GridViewRounded as ViewModule,
  ReceiptLongRounded as Receipt,
  MenuBookRounded as Description,
  WarehouseRounded as Warehouse,
  AccountBalanceRounded as AccountBalance,
  AccountBalanceWalletRounded as AccountBalanceWallet,
  ShieldRounded as Security,
  AdminPanelSettingsRounded as AdminPanelSettings,
  RequestQuoteRounded as RequestQuote,
  CurrencyExchangeRounded as Sync,
  BadgeRounded as Badge,
  FactCheckRounded as FactCheck,
  TuneRounded as Tune,
  AddBoxRounded as AddBox,
  IndeterminateCheckBoxRounded as IndeterminateBox,
  AssignmentReturnRounded as CreditNoteIcon,
  PostAddRounded as DebitNoteIcon,
  CalculateRounded as PayrollCalcIcon,
  HelpCenterRounded as HelpIcon,
  PaidRounded as PaidIcon,
} from '@mui/icons-material';

export interface NavSubModule {
  id: string;
  title: string;
  path: string;
  icon: any;
}

export interface NavModuleGroup {
  id: string;
  title: string;
  icon: any;
  color: string;
  gradient: string;
  reqId: string;
  path?: string;
  subModules?: NavSubModule[];
}

export const ALL_ERP_MODULES: NavModuleGroup[] = [
  {
    id: 'sales_group',
    title: 'Ventas y Facturación',
    icon: PointOfSale,
    color: '#2563eb',
    gradient: 'linear-gradient(135deg, #2563eb, #3b82f6)',
    reqId: 'sales',
    subModules: [
      { id: 'pos', title: 'Punto de Venta (POS)', path: '/sales', icon: PointOfSale },
      { id: 'manual_billing', title: 'Facturación SENIAT', path: '/sales/manual-billing', icon: Receipt },
      { id: 'budgets', title: 'Presupuestos', path: '/sales/budgets', icon: RequestQuote },
      { id: 'delivery_notes', title: 'Notas de Entrega', path: '/sales/delivery-notes', icon: LocalShipping },
      { id: 'customers', title: 'Clientes', path: '/sales/customers', icon: People },
      { id: 'debit_notes', title: 'Notas de Débito', path: '/sales/debit-notes', icon: DebitNoteIcon },
      { id: 'credit_notes', title: 'Notas de Crédito', path: '/sales/credit-notes', icon: CreditNoteIcon },
    ],
  },
  {
    id: 'inventory_group',
    title: 'Inventario y WMS',
    icon: Inventory,
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #059669, #10b981)',
    reqId: 'inventory',
    subModules: [
      { id: 'catalog', title: 'Catálogo de Productos', path: '/catalog', icon: ViewModule },
      { id: 'warehouses', title: 'Almacenes y Stock Mín.', path: '/warehouses', icon: Warehouse },
      { id: 'movements', title: 'Kardex y Movimientos', path: '/inventory', icon: CompareArrows },
      { id: 'audits', title: 'Conteo / Auditoría', path: '/inventory/audits', icon: FactCheck },
      { id: 'adjustments', title: 'Ajustes de Stock', path: '/inventory/adjustments', icon: Tune },
      { id: 'charges', title: 'Cargos (Entradas)', path: '/inventory/charges', icon: AddBox },
      { id: 'discharges', title: 'Descargos (Mermas)', path: '/inventory/discharges', icon: IndeterminateBox },
      { id: 'transfers', title: 'Transferencias', path: '/transfers', icon: CompareArrows },
      { id: 'dispatch_notes', title: 'Notas de Despacho', path: '/inventory/dispatch-notes', icon: LocalShipping },
    ],
  },
  {
    id: 'accounting_group',
    title: 'Contabilidad VEN-NIF',
    icon: AccountBalance,
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #d97706, #f59e0b)',
    reqId: 'accounting',
    subModules: [
      { id: 'accounts', title: 'Plan de Cuentas', path: '/accounting/accounts', icon: AccountBalance },
      { id: 'journal', title: 'Libro Diario', path: '/accounting/journal', icon: Description },
      { id: 'reconciliation', title: 'Conciliación Bancaria', path: '/accounting/reconciliation', icon: Sync },
    ],
  },
  {
    id: 'treasury_group',
    title: 'Tesorería y Finanzas',
    icon: AccountBalanceWallet,
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
    reqId: 'treasury',
    subModules: [
      { id: 'cxc', title: 'Cuentas por Cobrar', path: '/ar', icon: PaidIcon },
      { id: 'cxp', title: 'Cuentas por Pagar', path: '/ap', icon: PointOfSale },
      { id: 'bank_accounts', title: 'Bancos (VES / USD)', path: '/treasury/bank-accounts', icon: AccountBalance },
      { id: 'cash', title: 'Caja y Arqueo Diario', path: '/cash', icon: AccountBalanceWallet },
    ],
  },
  {
    id: 'payroll_group',
    title: 'Nómina (LOTTT)',
    icon: Badge,
    color: '#ec4899',
    gradient: 'linear-gradient(135deg, #db2777, #ec4899)',
    reqId: 'payroll',
    subModules: [
      { id: 'employees', title: 'Trabajadores', path: '/payroll', icon: People },
      { id: 'payroll_periods', title: 'Cálculo IVSS / FAOV', path: '/payroll', icon: PayrollCalcIcon },
    ],
  },
  {
    id: 'purchases_group',
    title: 'Compras y Proveedores',
    icon: ShoppingCart,
    color: '#0ea5e9',
    gradient: 'linear-gradient(135deg, #0284c7, #0ea5e9)',
    reqId: 'purchases',
    subModules: [
      { id: 'purchases', title: 'Órdenes de Compra', path: '/purchases', icon: ShoppingCart },
      { id: 'suppliers', title: 'Directorio de Proveedores', path: '/suppliers', icon: Business },
    ],
  },
  {
    id: 'admin_group',
    title: 'Administración',
    icon: Settings,
    color: '#64748b',
    gradient: 'linear-gradient(135deg, #475569, #64748b)',
    reqId: 'users',
    subModules: [
      { id: 'reports', title: 'Reportes y Libros SENIAT', path: '/reports', icon: Assessment },
      { id: 'users', title: 'Usuarios y Accesos', path: '/users', icon: People },
      { id: 'roles', title: 'Roles y Permisos', path: '/roles', icon: Security },
      { id: 'settings', title: 'Configuración de Empresa', path: '/settings', icon: Settings },
      { id: 'manual', title: 'Manual SENIAT y Ayuda', path: '/manual', icon: HelpIcon },
    ],
  },
];

export const SUPERADMIN_MODULE: NavModuleGroup = {
  id: 'admin',
  title: 'Súper Admin SaaS',
  path: '/admin',
  icon: AdminPanelSettings,
  color: '#1e3a8a',
  gradient: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
  reqId: 'admin',
};

