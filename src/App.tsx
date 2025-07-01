
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseAuthProvider } from '@/context/FirebaseAuthContext';
import { FirebaseDataProvider } from '@/context/FirebaseDataContext';
import { FinanceProvider } from '@/context/FinanceContext';
import AuthScreen from '@/components/auth/AuthScreen';
import Layout from '@/components/layout/Layout';
import Dashboard from '@/pages/Dashboard';
import CustomerManagement from '@/pages/CustomerManagement';
import PaymentEntry from '@/pages/PaymentEntry';
import DailyCollections from '@/pages/collections/DailyCollections';
import WeeklyCollections from '@/pages/collections/WeeklyCollections';
import MonthlyCollections from '@/pages/collections/MonthlyCollections';
import Reports from '@/pages/Reports';
import Settings from '@/pages/Settings';
import BatchPaymentEntry from '@/pages/BatchPaymentEntry';
import { useFirebaseAuth } from '@/context/FirebaseAuthContext';

const AppContent = () => {
  const { user, isLoading } = useFirebaseAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <FirebaseDataProvider>
      <FinanceProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/customers" element={<CustomerManagement />} />
            <Route path="/payments" element={<PaymentEntry />} />
            <Route path="/batch-payments" element={<BatchPaymentEntry />} />
            <Route path="/collections/daily" element={<DailyCollections />} />
            <Route path="/collections/weekly" element={<WeeklyCollections />} />
            <Route path="/collections/monthly" element={<MonthlyCollections />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </FinanceProvider>
    </FirebaseDataProvider>
  );
};

function App() {
  return (
    <FirebaseAuthProvider>
      <Router>
        <AppContent />
        <Toaster />
      </Router>
    </FirebaseAuthProvider>
  );
}

export default App;
