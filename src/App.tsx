
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getTheme } from './theme';
import Layout from './components/Layout';
import { useAppStore } from './store/useAppStore';
import InventoryPage from './features/inventory/InventoryPage';
import POSPage from './features/sales/POSPage';
import DashboardPage from './features/dashboard/DashboardPage';
import LoginPage from './features/auth/LoginPage';
import BudgetsPage from './features/sales/BudgetsPage';
import ManualBillingPage from './features/sales/ManualBillingPage';
import CatalogPage from './features/catalog/CatalogPage';
import SuppliersPage from './features/inventory/SuppliersPage';
import PurchasesPage from './features/inventory/PurchasesPage';
import UsersPage from './features/auth/UsersPage';
import WarehousesPage from './features/inventory/WarehousesPage';
import TransfersPage from './features/inventory/TransfersPage';
import AdjustmentsPage from './features/inventory/AdjustmentsPage';
import SettingsPage from './features/settings/SettingsPage';
import AdminPage from './features/admin/AdminPage';
import AccountingPage from './features/accounting/AccountingPage';
import ReportsPage from './features/reports/ReportsPage';
import AccountsReceivablePage from './features/treasury/AccountsReceivablePage';
import AccountsPayablePage from './features/treasury/AccountsPayablePage';
import DebitNotesPage from './features/accounting/DebitNotesPage';
import DeliveryNotesPage from './features/sales/DeliveryNotesPage';
import DispatchNotesPage from './features/inventory/DispatchNotesPage';
import CashPage from './features/treasury/CashPage';
import ChargesPage from './features/inventory/ChargesPage';
import DischargesPage from './features/inventory/DischargesPage';
import ManualPage from './features/dashboard/ManualPage';

const queryClient = new QueryClient();


const ProtectedRoute = () => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return <Layout />;
};

function App() {
  const tenant = useAppStore((state: any) => state.tenant);
  const theme = getTheme(tenant?.primary_color);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/warehouses" element={<WarehousesPage />} />
              <Route path="/transfers" element={<TransfersPage />} />
              <Route path="/catalog" element={<CatalogPage />} />
              <Route path="/suppliers" element={<SuppliersPage />} />
              <Route path="/purchases" element={<PurchasesPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/settings" element={<SettingsPage />} />
               <Route path="/admin" element={<AdminPage />} />
              <Route path="/accounting" element={<AccountingPage />} />
              <Route path="/accounting/accounts" element={<AccountingPage />} />
              <Route path="/accounting/journal" element={<AccountingPage />} />
              <Route path="/accounting/debit-notes" element={<DebitNotesPage />} />
              <Route path="/sales" element={<POSPage />} />
              <Route path="/sales/budgets" element={<BudgetsPage />} />
              <Route path="/sales/manual-billing" element={<ManualBillingPage />} />
              <Route path="/sales/delivery-notes" element={<DeliveryNotesPage />} />
              <Route path="/inventory/dispatch-notes" element={<DispatchNotesPage />} />
              <Route path="/inventory/adjustments" element={<AdjustmentsPage />} />
              <Route path="/inventory/charges" element={<ChargesPage />} />
              <Route path="/inventory/discharges" element={<DischargesPage />} />
              <Route path="/cash" element={<CashPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/ar" element={<AccountsReceivablePage />} />
              <Route path="/ap" element={<AccountsPayablePage />} />
              <Route path="/manual" element={<ManualPage />} />
            </Route>

            
            {/* Catch-all route to redirect to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
