import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Transactions from "@/pages/Transactions";
import Accounts from "@/pages/Accounts";
import BudgetPage from "@/pages/Budget";
import GoalsPage from "@/pages/Goals";
import Settings from "@/pages/Settings";
import Report from "@/pages/Report";
import Categories from "@/pages/Categories";
import TontinesPage from "@/pages/Tontines";
import TontineDetailPage from "@/pages/TontineDetail";
import Portfolio from "@/pages/Portfolio";
import More from "@/pages/More";
import PaymentMethods from "@/pages/PaymentMethods";
import Auth from "@/pages/Auth";
import NotFound from "./pages/NotFound";
import NotificationsPage from "@/pages/Notifications";
import NotificationSettings from "@/pages/NotificationSettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/transactions" element={<Transactions />} />
                      <Route path="/accounts" element={<Accounts />} />
                      <Route path="/budget" element={<BudgetPage />} />
                      <Route path="/report" element={<Report />} />
                      <Route path="/goals" element={<GoalsPage />} />
                      <Route path="/tontines" element={<TontinesPage />} />
                      <Route path="/tontines/:id" element={<TontineDetailPage />} />
                      <Route path="/portfolio" element={<Portfolio />} />
                      <Route path="/more" element={<More />} />
                      <Route path="/payment-methods" element={<PaymentMethods />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/categories" element={<Categories />} />
                      <Route path="/notifications" element={<NotificationsPage />} />
                      <Route path="/notification-settings" element={<NotificationSettings />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
