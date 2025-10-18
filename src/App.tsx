import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute, RoleBasedRoute } from "./components/auth/ProtectedRoute";
import { ManagerLayout } from "./components/layouts/manager-layout";
import { SupervisorLayout } from "./components/layouts/supervisor-layout";
import { SidebarProvider } from "./components/ui/sidebar";

// Page Components (Lazy Loaded)
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Login = lazy(() => import("./pages/Login"));
const SupervisorDashboard = lazy(() => import("./pages/supervisor/Dashboard"));
const ManagerDashboard = lazy(() => import("./pages/manager/Dashboard"));
const NursesPage = lazy(() => import("./pages/manager/Nurses"));
const NurseProfilePage = lazy(() => import("./pages/manager/NurseProfile"));
const AuditsPage = lazy(() => import("./pages/manager/Audits"));
const SupervisorsPage = lazy(() => import("./pages/manager/Supervisors"));
const ReportsPage = lazy(() => import("./pages/manager/Reports"));
const BadgesPage = lazy(() => import("./pages/manager/Badges"));
const LeaderboardPage = lazy(() => import("./pages/manager/Leaderboard"));
const AllBadgesPage = lazy(() => import("./pages/AllBadges"));
const Evaluate = lazy(() => import("./pages/supervisor/Evaluate"));
const SupervisorHistory = lazy(() => import("./pages/supervisor/History"));

const queryClient = new QueryClient();

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="text-xl font-semibold">Loading...</div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SidebarProvider>
            <Suspense fallback={<LoadingFallback />}>
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
                    <Route path="/manager/leaderboard" element={<LeaderboardPage />} />
                    <Route path="/all-badges" element={<AllBadgesPage />} />
                    <Route path="/manager/evaluate" element={<Evaluate />} />
                    <Route path="/manager/history" element={<SupervisorHistory />} />
                    <Route path="/manager/supervisor-dashboard" element={<SupervisorDashboard />} />
                  </Route>
                </Route>
                </Route>

                {/* Catch-all Route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </SidebarProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
