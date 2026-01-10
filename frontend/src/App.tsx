import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import GoogleCallbackPage from './pages/auth/GoogleCallbackPage';

// Main pages
import DashboardPage from './pages/DashboardPage';

// Admin pages
import RolesPage from './pages/admin/RolesPage';
import RoleFormPage from './pages/admin/RoleFormPage';
import UsersPage from './pages/admin/UsersPage';
import UserFormPage from './pages/admin/UserFormPage';

// References pages
import UnitsPage from './pages/references/UnitsPage';
import UnitFormPage from './pages/references/UnitFormPage';
import ProductTypesPage from './pages/references/ProductTypesPage';
import ProductTypeFormPage from './pages/references/ProductTypeFormPage';
import ProductsPage from './pages/references/ProductsPage';
import ProductFormPage from './pages/references/ProductFormPage';
import WarehousesPage from './pages/references/WarehousesPage';
import WarehouseFormPage from './pages/references/WarehouseFormPage';
import CashRegistersPage from './pages/references/CashRegistersPage';
import CashRegisterFormPage from './pages/references/CashRegisterFormPage';
import CounterpartiesPage from './pages/references/CounterpartiesPage';
import CounterpartyFormPage from './pages/references/CounterpartyFormPage';
import CounterpartyTypesPage from './pages/references/CounterpartyTypesPage';
import CounterpartyTypeFormPage from './pages/references/CounterpartyTypeFormPage';
import CurrenciesPage from './pages/references/CurrenciesPage';
import CurrencyFormPage from './pages/references/CurrencyFormPage';
import PartnersPage from './pages/references/PartnersPage';
import PartnerFormPage from './pages/references/PartnerFormPage';

// Accounting pages
import TransactionsPage from './pages/accounting/TransactionsPage';
import TransactionFormPage from './pages/accounting/TransactionFormPage';
import CashPage from './pages/accounting/CashPage';
import StockPage from './pages/accounting/StockPage';
import CounterpartiesBalancePage from './pages/accounting/CounterpartiesBalancePage';
import DividendsPage from './pages/accounting/DividendsPage';
import SalaryPage from './pages/accounting/SalaryPage';

// Production pages
import { RecipesPage, RecipeFormPage, ProductionsPage, ProductionFormPage } from './pages/production';

// Profile pages
import AccountSettingsPage from './pages/profile/AccountSettingsPage';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/auth/callback" element={<GoogleCallbackPage />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/" element={<DashboardPage />} />

                {/* Admin routes */}
                <Route path="/admin/roles" element={<RolesPage />} />
                <Route path="/admin/roles/create" element={<RoleFormPage />} />
                <Route path="/admin/roles/:id/edit" element={<RoleFormPage />} />
                <Route path="/admin/users" element={<UsersPage />} />
                <Route path="/admin/users/create" element={<UserFormPage />} />
                <Route path="/admin/users/:id/edit" element={<UserFormPage />} />
                <Route path="/admin/settings" element={<PlaceholderPage title="Глобальные настройки" />} />

                {/* References routes */}
                <Route path="/references/units" element={<UnitsPage />} />
                <Route path="/references/units/new" element={<UnitFormPage />} />
                <Route path="/references/units/:id" element={<UnitFormPage />} />
                <Route path="/references/product-types" element={<ProductTypesPage />} />
                <Route path="/references/product-types/new" element={<ProductTypeFormPage />} />
                <Route path="/references/product-types/:id" element={<ProductTypeFormPage />} />
                <Route path="/references/products" element={<ProductsPage />} />
                <Route path="/references/products/new" element={<ProductFormPage />} />
                <Route path="/references/products/:id" element={<ProductFormPage />} />
                <Route path="/references/warehouses" element={<WarehousesPage />} />
                <Route path="/references/warehouses/new" element={<WarehouseFormPage />} />
                <Route path="/references/warehouses/:id" element={<WarehouseFormPage />} />
                <Route path="/references/cash-registers" element={<CashRegistersPage />} />
                <Route path="/references/cash-registers/new" element={<CashRegisterFormPage />} />
                <Route path="/references/cash-registers/:id" element={<CashRegisterFormPage />} />
                <Route path="/references/counterparties" element={<CounterpartiesPage />} />
                <Route path="/references/counterparties/new" element={<CounterpartyFormPage />} />
                <Route path="/references/counterparties/:id" element={<CounterpartyFormPage />} />
                <Route path="/references/counterparty-types" element={<CounterpartyTypesPage />} />
                <Route path="/references/counterparty-types/new" element={<CounterpartyTypeFormPage />} />
                <Route path="/references/counterparty-types/:id" element={<CounterpartyTypeFormPage />} />
                <Route path="/references/currencies" element={<CurrenciesPage />} />
                <Route path="/references/currencies/new" element={<CurrencyFormPage />} />
                <Route path="/references/currencies/:id" element={<CurrencyFormPage />} />
                <Route path="/references/partners" element={<PartnersPage />} />
                <Route path="/references/partners/new" element={<PartnerFormPage />} />
                <Route path="/references/partners/:id" element={<PartnerFormPage />} />

                {/* Accounting routes */}
                <Route path="/accounting/transactions" element={<TransactionsPage />} />
                <Route path="/accounting/transactions/new" element={<TransactionFormPage />} />
                <Route path="/accounting/transactions/:id" element={<TransactionFormPage />} />
                <Route path="/accounting/cash" element={<CashPage />} />
                <Route path="/accounting/stock" element={<StockPage />} />
                <Route path="/accounting/counterparties" element={<CounterpartiesBalancePage />} />
                <Route path="/accounting/dividends" element={<DividendsPage />} />
                <Route path="/accounting/salary" element={<SalaryPage />} />

                {/* Production routes */}
                <Route path="/production/recipes" element={<RecipesPage />} />
                <Route path="/production/recipes/new" element={<RecipeFormPage />} />
                <Route path="/production/recipes/:id" element={<RecipeFormPage />} />
                <Route path="/production/productions" element={<ProductionsPage />} />
                <Route path="/production/productions/new" element={<ProductionFormPage />} />
                <Route path="/production/productions/:id" element={<ProductionFormPage />} />

                {/* Profile routes */}
                <Route path="/profile/settings" element={<AccountSettingsPage />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

// Placeholder component for unimplemented pages
function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="card p-8 text-center">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
      <p className="text-gray-500">Этот раздел находится в разработке</p>
    </div>
  );
}

export default App;
