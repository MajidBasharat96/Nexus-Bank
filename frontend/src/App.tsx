import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/auth.store';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CustomersPage } from './pages/CustomersPage';
import { CustomerDetailPage } from './pages/CustomerDetailPage';
import { AccountsPage } from './pages/AccountsPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { LoansPage } from './pages/LoansPage';
import { CardsPage } from './pages/CardsPage';
import { CompliancePage } from './pages/CompliancePage';
import { FraudPage } from './pages/FraudPage';
import { ReportsPage } from './pages/ReportsPage';
import { AdminPage } from './pages/AdminPage';
import { BranchesPage } from './pages/BranchesPage';
import { TreasuryPage } from './pages/TreasuryPage';
import { IntegrationsPage } from './pages/IntegrationsPage';
import { TransferPage } from './pages/TransferPage';
import './index.css';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#162040', color: '#f1f5f9', border: '1px solid #1e2d4a', fontFamily: 'DM Sans, sans-serif' },
          success: { iconTheme: { primary: '#22c55e', secondary: '#162040' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#162040' } }
        }}
      />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="customers/:id" element={<CustomerDetailPage />} />
          <Route path="accounts" element={<AccountsPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="transfer" element={<TransferPage />} />
          <Route path="loans" element={<LoansPage />} />
          <Route path="cards" element={<CardsPage />} />
          <Route path="compliance" element={<CompliancePage />} />
          <Route path="fraud" element={<FraudPage />} />
          <Route path="treasury" element={<TreasuryPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="branches" element={<BranchesPage />} />
          <Route path="integrations" element={<IntegrationsPage />} />
          <Route path="admin" element={<AdminPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
