
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { FinanceProvider } from "./context/FinanceContext";
import { FirebaseAuthProvider } from "./context/FirebaseAuthContext";
import { useEffect } from "react";
import { initializeMobileApp } from "./utils/mobileUtils";
import { ThemeProvider as NextThemesProvider } from "next-themes";

import Layout from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import DailyCollections from "./pages/collections/DailyCollections";
import WeeklyCollections from "./pages/collections/WeeklyCollections";
import MonthlyCollections from "./pages/collections/MonthlyCollections";
import Posting from "./pages/Posting";
import Reports from "./pages/Reports";
import BalanceSheet from "./pages/BalanceSheet";
import NotFound from "./pages/NotFound";
import CustomerDetail from "./pages/CustomerDetail";
import PostingDetails from "./pages/PostingDetails";
import Areas from "./pages/Areas";
import SignIn from "./pages/auth/SignIn";

import RequireFirebaseAuth from "./components/auth/RequireFirebaseAuth";
import Index from "./pages/Index";
import { VoiceNavigationProvider } from "./context/VoiceNavigationContext";
import { voiceNavRoutes } from "./config/voice-nav-routes";
import AreaReports from "./pages/AreaReports";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  return (
    <RequireFirebaseAuth>
      <VoiceNavigationProvider routes={voiceNavRoutes}>
        <Layout>{children}</Layout>
      </VoiceNavigationProvider>
    </RequireFirebaseAuth>
  );
};

const App = () => {
  useEffect(() => {
    initializeMobileApp();
  }, []);

  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <FirebaseAuthProvider>
          <FinanceProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Index />} />
                  <Route path="/sign-in" element={<SignIn />} />

                  {/* Protected routes */}
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
                  <Route path="/customers/:id" element={<ProtectedRoute><CustomerDetail /></ProtectedRoute>} />
                  <Route path="/collections/daily" element={<ProtectedRoute><DailyCollections /></ProtectedRoute>} />
                  <Route path="/collections/weekly" element={<ProtectedRoute><WeeklyCollections /></ProtectedRoute>} />
                  <Route path="/collections/monthly" element={<ProtectedRoute><MonthlyCollections /></ProtectedRoute>} />
                  <Route path="/posting" element={<ProtectedRoute><Posting /></ProtectedRoute>} />
                  <Route path="/posting/:date" element={<ProtectedRoute><PostingDetails /></ProtectedRoute>} />
                  <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
                  <Route path="/areas/:areaId/reports" element={<ProtectedRoute><AreaReports /></ProtectedRoute>} />
                  <Route path="/balance-sheet" element={<ProtectedRoute><BalanceSheet /></ProtectedRoute>} />
                  <Route path="/areas" element={<ProtectedRoute><Areas /></ProtectedRoute>} />
                  
                  {/* Not Found Route */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </FinanceProvider>
        </FirebaseAuthProvider>
      </QueryClientProvider>
    </NextThemesProvider>
  );
};

export default App;
