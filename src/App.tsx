
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { FinanceProvider } from "./context/FinanceContext";
import { AuthProvider } from "./context/LocalAuthContext";

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
import LocalAuth from "./pages/auth/LocalAuth";
import RequireAuth from "./components/auth/RequireAuth";
import Index from "./pages/Index";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <FinanceProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<LocalAuth />} />
              
              {/* Protected routes */}
              <Route path="/dashboard" element={<RequireAuth><Layout><Dashboard /></Layout></RequireAuth>} />
              <Route path="/customers" element={<RequireAuth><Layout><Customers /></Layout></RequireAuth>} />
              <Route path="/customers/:id" element={<RequireAuth><Layout><CustomerDetail /></Layout></RequireAuth>} />
              <Route path="/collections/daily" element={<RequireAuth><Layout><DailyCollections /></Layout></RequireAuth>} />
              <Route path="/collections/weekly" element={<RequireAuth><Layout><WeeklyCollections /></Layout></RequireAuth>} />
              <Route path="/collections/monthly" element={<RequireAuth><Layout><MonthlyCollections /></Layout></RequireAuth>} />
              <Route path="/posting" element={<RequireAuth><Layout><Posting /></Layout></RequireAuth>} />
              <Route path="/posting/:date" element={<RequireAuth><Layout><PostingDetails /></Layout></RequireAuth>} />
              <Route path="/reports" element={<RequireAuth><Layout><Reports /></Layout></RequireAuth>} />
              <Route path="/balance-sheet" element={<RequireAuth><Layout><BalanceSheet /></Layout></RequireAuth>} />
              <Route path="/areas" element={<RequireAuth><Layout><Areas /></Layout></RequireAuth>} />
              
              {/* Not Found Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </FinanceProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
