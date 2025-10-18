import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute, RoleBasedRoute } from "./components/auth/ProtectedRoute";
import { ManagerLayout } from "./components/layouts/manager-layout";
import { SupervisorLayout } from "./components/layouts/supervisor-layout";
import { SidebarProvider } from "./components/ui/sidebar";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import SupervisorDashboard from "./pages/supervisor/Dashboard";
import ManagerDashboard from "./pages/manager/Dashboard";
import NursesPage from "./pages/manager/Nurses";
import NurseProfilePage from "./pages/manager/NurseProfile";
import AuditsPage from "./pages/manager/Audits";
import SupervisorsPage from "./pages/manager/Supervisors";
import ReportsPage from "./pages/manager/Reports";
import BadgesPage from "./pages/manager/Badges";
import AllBadgesPage from "./pages/AllBadges";
import Evaluate from "./pages/supervisor/Evaluate";
import SupervisorHistory from "./pages/supervisor/History";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SidebarProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              
              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Index />} />
                
                {/* Supervisor Routes */}
                <Route element={<RoleBasedRoute allowedRoles={['supervisor']} />}>
                  <Route element={<SupervisorLayout />}>
                    <Route path="/supervisor/dashboard" element={<SupervisorDashboard />} />
                    <Route path="/supervisor/evaluate" element={<Evaluate />} />
                    <Route path="/supervisor/history" element={<SupervisorHistory />} />
                  </Route>
                </Route>

                {/* Manager Routes */}
                <Route element={<RoleBasedRoute allowedRoles={['manager']} />}>
                  <Route element={<ManagerLayout />}>
                    <Route path="/manager/dashboard" element={<ManagerDashboard />} />
                    <Route path="/manager/nurses" element={<NursesPage />} />
                    <Route path="/manager/nurses/:id" element={<NurseProfilePage />} />
                    <Route path="/manager/audits" element={<AuditsPage />} />
                    <Route path="/manager/supervisors" element={<SupervisorsPage />} />
                    <Route path="/manager/reports" element={<ReportsPage />} />
                    <Route path="/manager/badges" element={<BadgesPage />} />
                    <Route path="/all-badges" element={<AllBadgesPage />} />
                  </Route>
                </Route>
              </Route>

              {/* Catch-all Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </SidebarProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
