import { create } from 'zustand';

// ─── Módulos disponibles en el ERP y sus licencias ───────────────────────────
// Cada módulo tiene un ID que debe coincidir con el campo `modules` del tenant en BD
export type ModuleId =
  | 'admin'       // Administrativo (base, siempre activo)
  | 'inventory'   // Inventario (bundle con admin)
  | 'sales'       // Ventas / POS
  | 'purchases'   // Compras
  | 'accounting'  // Contabilidad
  | 'hr'          // Nómina / RRHH (módulo separado)
  | 'crm'         // CRM
  | 'reports'     // Reportes avanzados
  | 'treasury';   // Tesorería (CxC/CxP/Bancos)

export interface User {
  id: number;
  email: string;
  is_superuser: boolean;
  tenant_id: number;
  modules?: string;
  username?: string;
  role_id?: number;
}

export interface CashSession {
  id: number;
  register_id: number;
  user_id: number;
  register: { name: string };
}

export interface TenantInfo {
  id?: number;
  name: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  settings?: any;
  // modules es JSONB en BD: puede ser un array ["sales","inventory",...] u objeto {"sales":{"is_active":true}}
  modules?: string[] | Record<string, any> | null;
  subscription_end?: string;
}

interface AppState {
  tenantId: number;
  sidebarOpen: boolean;
  user: User | null;
  tenant: TenantInfo | null;
  cashSession: CashSession | null;
  themeMode: 'light' | 'dark';

  // ── Módulos activos del tenant (computed) ──────────────────────────────────
  activeModules: Set<ModuleId>;

  setTenantId: (id: number) => void;
  setUser: (user: User | null) => void;
  setTenant: (tenant: TenantInfo | null) => void;
  setCashSession: (session: CashSession | null) => void;
  setThemeMode: (mode: 'light' | 'dark') => void;
  toggleSidebar: () => void;

  /** Retorna true si el módulo está licenciado para el tenant actual */
  hasModule: (mod: ModuleId) => boolean;
}

/** Parsea el campo `modules` del tenant (JSONB flexible) a un Set<ModuleId> */
function parseModules(modules: TenantInfo['modules']): Set<ModuleId> {
  // Siempre incluir admin e inventory (bundle base)
  const base: ModuleId[] = ['admin', 'inventory'];

  if (!modules) return new Set(base);

  // Array simple: ["sales", "inventory", "hr", ...]
  if (Array.isArray(modules)) {
    return new Set([...base, ...(modules as ModuleId[])]);
  }

  // Objeto: {"sales": {"is_active": true}, "hr": true, ...}
  if (typeof modules === 'object') {
    const active = Object.entries(modules)
      .filter(([, v]) => {
        if (typeof v === 'boolean') return v;
        if (typeof v === 'object' && v !== null) return (v as any).is_active !== false;
        return true;
      })
      .map(([k]) => k as ModuleId);
    return new Set([...base, ...active]);
  }

  return new Set(base);
}

export const useAppStore = create<AppState>((set, get) => ({
  tenantId: 1,
  sidebarOpen: true,
  user: null,
  tenant: null,
  cashSession: null,
  themeMode: (localStorage.getItem('themeMode') as 'light' | 'dark') || 'light',
  activeModules: new Set<ModuleId>(['admin', 'inventory']),

  setTenantId: (id) => set({ tenantId: id }),

  setUser: (user) => set({ user }),

  setTenant: (tenant) => {
    const activeModules = parseModules(tenant?.modules);
    set({ tenant, activeModules });
  },

  setCashSession: (cashSession) => set({ cashSession }),

  setThemeMode: (mode) => {
    localStorage.setItem('themeMode', mode);
    set({ themeMode: mode });
  },

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  hasModule: (mod: ModuleId) => {
    const { user, activeModules } = get();
    // Superadmin siempre tiene acceso a todo
    if (user?.is_superuser) return true;
    return activeModules.has(mod);
  },
}));
