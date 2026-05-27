import { create } from 'zustand';

interface User {
  id: number;
  email: string;
  is_superuser: boolean;
  tenant_id: number;
  modules?: string;
  username?: string;
}

interface CashSession {
  id: number;
  register_id: number;
  user_id: number;
  register: {
    name: string;
  };
}

interface TenantInfo {
  name: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
}

interface AppState {
  tenantId: number;
  sidebarOpen: boolean;
  user: User | null;
  tenant: TenantInfo | null;
  cashSession: CashSession | null;
  setTenantId: (id: number) => void;
  setUser: (user: User | null) => void;
  setTenant: (tenant: TenantInfo | null) => void;
  setCashSession: (session: CashSession | null) => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  tenantId: 1,
  sidebarOpen: true,
  user: null,
  tenant: null,
  cashSession: null,
  setTenantId: (id) => set({ tenantId: id }),
  setUser: (user) => set({ user }),
  setTenant: (tenant) => set({ tenant }),
  setCashSession: (cashSession) => set({ cashSession }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
