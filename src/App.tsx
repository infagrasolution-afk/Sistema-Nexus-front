
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from './theme';
import Layout from './components/Layout';
import InventoryPage from './features/inventory/InventoryPage';
import POSPage from './features/sales/POSPage';
import DashboardPage from './features/dashboard/DashboardPage';
import LoginPage from './features/auth/LoginPage';
import CatalogPage from './features/catalog/CatalogPage';
import SuppliersPage from './features/inventory/SuppliersPage';
import PurchasesPage from './features/inventory/PurchasesPage';
import UsersPage from './features/auth/UsersPage';
import WarehousesPage from './features/inventory/WarehousesPage';
import TransfersPage from './features/inventory/TransfersPage';
import SettingsPage from './features/settings/SettingsPage';
import AdminPage from './features/admin/AdminPage';

const queryClient = new QueryClient();

const ProtectedRoute = () => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return <Layout />;
};

function App() {
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
              <Route path="/sales" element={<POSPage />} />
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
