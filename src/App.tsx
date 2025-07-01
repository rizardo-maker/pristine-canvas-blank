
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseAuthProvider } from '@/context/FirebaseAuthContext';
import { FirebaseDataProvider } from '@/context/FirebaseDataContext';
import { FinanceProvider } from '@/context/FinanceContext';
import { LocalAuthProvider } from '@/context/LocalAuthContext';
import Layout from '@/components/layout/Layout';
import Index from '@/pages/Index';
import Dashboard from '@/pages/Dashboard';
import CustomerManagement from '@/pages/CustomerManagement';
import PaymentEntry from '@/pages/PaymentEntry';
import DailyCollections from '@/pages/collections/DailyCollections';
import WeeklyCollections from '@/pages/collections/WeeklyCollections';
import MonthlyCollections from '@/pages/collections/MonthlyCollections';
import Reports from '@/pages/Reports';
import Settings from '@/pages/Settings';
import BatchPaymentEntry from '@/pages/BatchPaymentEntry';
import Areas from '@/pages/Areas';
import Customers from '@/pages/Customers';
import AppEntry from '@/pages/AppEntry';
import LocalAuth from '@/pages/auth/LocalAuth';
import SignIn from '@/pages/auth/SignIn';
import SignUp from '@/pages/auth/SignUp';
import RequireAuth from '@/components/auth/RequireAuth';
import { useFirebaseAuth } from '@/context/FirebaseAuthContext';
import { useAuth } from '@/context/LocalAuthContext';

const AppContent = () => {
  const { user: firebaseUser, isLoading: firebaseLoading } = useFirebaseAuth();
  const { user: localUser, isLoading: localLoading } = useAuth();

  const isLoading = firebaseLoading || localLoading;
  const isAuthenticated = firebaseUser || localUser;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Index />} />
      <Route path="/sign-in" element={<SignIn />} />
      <Route path="/sign-up" element={<SignUp />} />
      <Route path="/auth" element={<LocalAuth />} />
      
      {/* Protected routes */}
      <Route path="/app-entry" element={
        <RequireAuth>
          <AppEntry />
        </RequireAuth>
      } />
      
      <Route path="/areas" element={
        <RequireAuth>
          <FinanceProvider>
            <Layout>
              <Areas />
            </Layout>
          </FinanceProvider>
        </RequireAuth>
      } />
      
      {/* Firebase authenticated routes */}
      {firebaseUser && (
        <>
          <Route path="/dashboard" element={
            <FirebaseDataProvider>
              <FinanceProvider>
                <Layout>
                  <Dashboard />
                </Layout>
              </FinanceProvider>
            </FirebaseDataProvider>
          } />
          <Route path="/customers" element={
            <FirebaseDataProvider>
              <FinanceProvider>
                <Layout>
                  <CustomerManagement />
                </Layout>
              </FinanceProvider>
            </FirebaseDataProvider>
          } />
          <Route path="/payments" element={
            <FirebaseDataProvider>
              <FinanceProvider>
                <Layout>
                  <PaymentEntry />
                </Layout>
              </FinanceProvider>
            </FirebaseDataProvider>
          } />
          <Route path="/batch-payments" element={
            <FirebaseDataProvider>
              <FinanceProvider>
                <Layout>
                  <BatchPaymentEntry />
                </Layout>
              </FinanceProvider>
            </FirebaseDataProvider>
          } />
          <Route path="/collections/daily" element={
            <FirebaseDataProvider>
              <FinanceProvider>
                <Layout>
                  <DailyCollections />
                </Layout>
              </FinanceProvider>
            </FirebaseDataProvider>
          } />
          <Route path="/collections/weekly" element={
            <FirebaseDataProvider>
              <FinanceProvider>
                <Layout>
                  <WeeklyCollections />
                </Layout>
              </FinanceProvider>
            </FirebaseDataProvider>
          } />
          <Route path="/collections/monthly" element={
            <FirebaseDataProvider>
              <FinanceProvider>
                <Layout>
                  <MonthlyCollections />
                </Layout>
              </FinanceProvider>
            </FirebaseDataProvider>
          } />
          <Route path="/reports" element={
            <FirebaseDataProvider>
              <FinanceProvider>
                <Layout>
                  <Reports />
                </Layout>
              </FinanceProvider>
            </FirebaseDataProvider>
          } />
          <Route path="/settings" element={
            <FirebaseDataProvider>
              <FinanceProvider>
                <Layout>
                  <Settings />
                </Layout>
              </FinanceProvider>
            </FirebaseDataProvider>
          } />
        </>
      )}
      
      {/* Local authenticated routes */}
      {localUser && (
        <>
          <Route path="/dashboard" element={
            <FinanceProvider>
              <Layout>
                <Dashboard />
              </Layout>
            </FinanceProvider>
          } />
          <Route path="/customers" element={
            <FinanceProvider>
              <Layout>
                <Customers />
              </Layout>
            </FinanceProvider>
          } />
          <Route path="/payments" element={
            <FinanceProvider>
              <Layout>
                <PaymentEntry />
              </Layout>
            </FinanceProvider>
          } />
          <Route path="/batch-payments" element={
            <FinanceProvider>
              <Layout>
                <BatchPaymentEntry />
              </Layout>
            </FinanceProvider>
          } />
          <Route path="/collections/daily" element={
            <FinanceProvider>
              <Layout>
                <DailyCollections />
              </Layout>
            </FinanceProvider>
          } />
          <Route path="/collections/weekly" element={
            <FinanceProvider>
              <Layout>
                <WeeklyCollections />
              </Layout>
            </FinanceProvider>
          } />
          <Route path="/collections/monthly" element={
            <FinanceProvider>
              <Layout>
                <MonthlyCollections />
              </Layout>
            </FinanceProvider>
          } />
          <Route path="/reports" element={
            <FinanceProvider>
              <Layout>
                <Reports />
              </Layout>
            </FinanceProvider>
          } />
          <Route path="/settings" element={
            <FinanceProvider>
              <Layout>
                <Settings />
              </Layout>
            </FinanceProvider>
          } />
        </>
      )}
      
      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <FirebaseAuthProvider>
      <LocalAuthProvider>
        <Router>
          <AppContent />
          <Toaster />
        </Router>
      </LocalAuthProvider>
    </FirebaseAuthProvider>
  );
}

export default App;
