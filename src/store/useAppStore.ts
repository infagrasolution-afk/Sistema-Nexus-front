import { create } from 'zustand';

interface User {
  id: number;
  email: string;
  is_superuser: boolean;
  tenant_id: number;
}

interface CashSession {
  id: number;
  register_id: number;
  user_id: number;
  register: {
    name: string;
  };
}

interface AppState {
  tenantId: number;
  sidebarOpen: boolean;
  user: User | null;
  cashSession: CashSession | null;
  setTenantId: (id: number) => void;
  setUser: (user: User | null) => void;
  setCashSession: (session: CashSession | null) => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  tenantId: 1,
  sidebarOpen: true,
  user: null,
  cashSession: null,
  setTenantId: (id) => set({ tenantId: id }),
  setUser: (user) => set({ user }),
  setCashSession: (cashSession) => set({ cashSession }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
